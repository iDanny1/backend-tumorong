import mongoose, { type ClientSession } from 'mongoose';
import { Order } from '../models/Order.js';
import { Voucher } from '../models/StoreVoucher.js';
import { AdvancedVoucher } from '../models/AdvancedVoucher.js';
import { UserVoucherUsage } from '../models/UserVoucherUsage.js';
import { InventoryError, deductOrderLines, restoreOrderLines, quantitiesByProduct, inventoryTransaction, type InventoryLine } from './inventory.js';

const confirmed = new Set(['confirmed', 'shipping', 'delivered', 'đã xác nhận', 'đang chuẩn bị', 'đã lấy hàng', 'đang giao', 'hoàn thành']);
const cancelled = new Set(['cancelled', 'canceled', 'đã hủy', 'đã huỷ']);
const statusKey = (value?: string) => value?.trim().toLowerCase() ?? '';
function orderFilter(id: string) {
  if (typeof id === 'string' && /^DH.{1,100}$/.test(id)) return { orderCode: id };
  if (mongoose.isObjectIdOrHexString(id)) return { _id: id };
  throw new InventoryError(404, 'Không tìm thấy đơn hàng.');
}

export function orderLines(items: any[]): InventoryLine[] {
  if (!Array.isArray(items)) throw new InventoryError(400, 'Danh sách sản phẩm không hợp lệ.');
  const lines = items.map(item => ({
    productId: item?.id || item?._id || item?.productId,
    quantity: typeof item?.quantity === 'string' && item.quantity.trim() ? Number(item.quantity) : item?.quantity,
  }));
  quantitiesByProduct(lines);
  return lines;
}

const editableFields = ['status', 'paymentStatus', 'note', 'shippingUnit', 'shippingMethod', 'order_code', 'ghnOrderCode', 'warehouseId'];
export async function updateOrder(id: string, input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InventoryError(400, 'Dữ liệu cập nhật đơn hàng không hợp lệ.');
  const changes = Object.entries(input);
  if (!changes.length || changes.some(([key, value]) => !editableFields.includes(key) || typeof value !== 'string')) {
    throw new InventoryError(400, 'Có trường không hợp lệ hoặc không được phép sửa trên đơn hàng.');
  }
  const update: Record<string, string> = Object.fromEntries(changes);
  if (update.status !== undefined && !update.status.trim()) throw new InventoryError(400, 'Trạng thái đơn không được để trống.');
  if (update.warehouseId && !mongoose.isObjectIdOrHexString(update.warehouseId)) throw new InventoryError(400, 'Mã kho không hợp lệ.');
  const filter = orderFilter(id);
  if (update.status === undefined && update.warehouseId === undefined) {
    const doc = await Order.findOneAndUpdate(filter, { $set: update }, { new: true, runValidators: true });
    if (!doc) throw new InventoryError(404, 'Không tìm thấy đơn hàng.');
    return doc;
  }
  return inventoryTransaction(async session => {
    const doc = await Order.findOne(filter, null, { session });
    if (!doc) throw new InventoryError(404, 'Không tìm thấy đơn hàng.');
    const before = statusKey(doc.status);
    if (doc.stockDeducted && update.warehouseId !== undefined && update.warehouseId !== doc.warehouseId) {
      throw new InventoryError(409, 'Đơn đã xuất kho, không thể đổi kho.');
    }
    doc.set(update);
    const after = statusKey(doc.status);
    if (confirmed.has(after) && !doc.stockDeducted) {
      const items = doc.items?.length ? doc.items : doc.products;
      doc.inventoryAllocations = await deductOrderLines(session, orderLines(items || []), doc.warehouseId);
      doc.stockDeducted = true;
    }
    if (cancelled.has(after) && doc.stockDeducted) {
      if (doc.inventoryDocumentRequestId) throw new InventoryError(409, 'Đơn đã gắn chứng từ giao hàng. Hãy xử lý hàng trả bằng phiếu nhập kho.');
      await restoreOrderLines(session, doc.inventoryAllocations || []);
      doc.stockDeducted = false;
      doc.inventoryAllocations = undefined;
    }
    if (cancelled.has(after) && !cancelled.has(before) && doc.voucherCode && !doc.voucherUsageReleased) {
      const code = doc.voucherCode.trim().toUpperCase();
      const query = { code, usedCount: { $gt: 0 } };
      const decrement = { $inc: { usedCount: -1 } };
      await AdvancedVoucher.updateOne(query, decrement, { session });
      await Voucher.updateOne(query, decrement, { session });
      const userId = (doc.customerPhone || doc.customerName || '').trim();
      if (userId) await UserVoucherUsage.updateOne({ userId, voucherCode: code, usedCount: { $gt: 0 } }, decrement, { session });
      doc.voucherUsageReleased = true;
    }
    await doc.save({ session });
    return doc;
  });
}

// A warehouse paper for an already fulfilled order records delivery of that same stock.
export async function linkDeductedOrder(session: ClientSession, orderId: string, warehouseId: string, lines: InventoryLine[], requestId: string) {
  const doc = await Order.findOne(orderFilter(orderId), null, { session });
  if (!doc) throw new InventoryError(404, 'Không tìm thấy đơn hàng liên kết.');
  if (doc.inventoryDocumentRequestId && doc.inventoryDocumentRequestId !== requestId) throw new InventoryError(409, 'Đơn đã được liên kết với một chứng từ kho khác.');
  const allocations = doc.inventoryAllocations || [];
  if (!doc.stockDeducted || !allocations.length || allocations.some(row => row.warehouseId !== warehouseId)) {
    throw new InventoryError(409, 'Chỉ có thể liên kết đơn đã xuất toàn bộ hàng tại kho đang chọn và có lịch sử xuất kho.');
  }
  const supplied = quantitiesByProduct(lines), recorded = quantitiesByProduct(allocations);
  if (supplied.size !== recorded.size || [...supplied].some(([id, qty]) => recorded.get(id) !== qty)) {
    throw new InventoryError(409, 'Sản phẩm và số lượng của chứng từ phải khớp với đơn đã xuất kho.');
  }
  doc.inventoryDocumentRequestId = requestId;
  await doc.save({ session });
}

export async function deleteOrder(id: string) {
  const filter = orderFilter(id);
  const removed = await Order.findOneAndDelete({ ...filter, stockDeducted: { $ne: true }, inventoryDocumentRequestId: null });
  if (removed) return;
  if (await Order.exists(filter)) throw new InventoryError(409, 'Không thể xóa đơn đã trừ kho. Hãy kiểm tra chứng từ hoặc hủy đơn trước.');
  throw new InventoryError(404, 'Không tìm thấy đơn hàng.');
}
