import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Voucher } from '../models/StoreVoucher.js';
import { AdvancedVoucher } from '../models/AdvancedVoucher.js';
import { UserVoucherUsage } from '../models/UserVoucherUsage.js';

const CONFIRMED_STATUSES = ['confirmed', 'đã xác nhận', 'đang chuẩn bị', 'đang giao', 'hoàn thành'];
const CANCELLED_STATUSES = ['cancelled', 'đã hủy'];

async function updateProductInventory(orderDoc: any, item: any, deduct: boolean) {
  const productId = item.id || item._id || item.productId;
  if (!productId) return;

  const quantity = Number(item.quantity) || 1;
  const product = await Product.findById(productId);
  if (!product) return;

  const warehouseStock = typeof product.warehouseStock === 'object' && product.warehouseStock !== null
    ? { ...product.warehouseStock }
    : {};
  const warehouseKeys = Object.keys(warehouseStock);

  if (warehouseKeys.length === 0) {
    const stock = deduct
      ? Math.max(0, (product.stock || 0) - quantity)
      : (product.stock || 0) + quantity;
    await Product.findByIdAndUpdate(productId, { $set: { stock } });
    return;
  }

  const targetWarehouse = orderDoc.store || orderDoc.warehouseId;
  if (!deduct) {
    const key = targetWarehouse || warehouseKeys[0];
    warehouseStock[key] = (Number(warehouseStock[key]) || 0) + quantity;
  } else if (targetWarehouse && warehouseStock[targetWarehouse] !== undefined) {
    warehouseStock[targetWarehouse] = Math.max(0, (Number(warehouseStock[targetWarehouse]) || 0) - quantity);
  } else {
    let remaining = quantity;
    for (const key of warehouseKeys) {
      if (remaining <= 0) break;
      const current = Number(warehouseStock[key]) || 0;
      if (current > 0) {
        const deducted = Math.min(current, remaining);
        warehouseStock[key] = current - deducted;
        remaining -= deducted;
      }
    }
  }

  const stock = Object.values(warehouseStock).reduce((sum: number, value: any) => sum + (Number(value) || 0), 0);
  await Product.findByIdAndUpdate(productId, { $set: { warehouseStock, stock } });
}

export async function syncOrderInventory(orderDoc: any, newStatus?: string) {
  try {
    if (!orderDoc) return;
    const status = newStatus || orderDoc.status;
    if (!status) return;

    const statusLower = String(status).toLowerCase();
    const isNowConfirmed = CONFIRMED_STATUSES.some(value => statusLower.includes(value));
    const isNowCancelled = CANCELLED_STATUSES.some(value => statusLower.includes(value));
    const items = orderDoc.items?.length > 0 ? orderDoc.items : (orderDoc.products || []);
    if (!Array.isArray(items) || items.length === 0) return;

    const shouldDeduct = isNowConfirmed && !orderDoc.stockDeducted;
    const shouldRestore = isNowCancelled && orderDoc.stockDeducted;
    if (shouldDeduct || shouldRestore) {
      for (const item of items) {
        await updateProductInventory(orderDoc, item, shouldDeduct);
      }
      await Order.findByIdAndUpdate(orderDoc._id, { $set: { stockDeducted: shouldDeduct } });
      orderDoc.stockDeducted = shouldDeduct;
      console.log(shouldDeduct
        ? `📦 Đã trừ tồn kho cho đơn hàng ${orderDoc.orderCode || orderDoc._id}`
        : `🔄 Đã hoàn trả tồn kho cho đơn hàng bị hủy ${orderDoc.orderCode || orderDoc._id}`);
    }

    // Restore voucher usage when order is cancelled
    if (isNowCancelled && orderDoc.voucherCode) {
      const code = String(orderDoc.voucherCode).trim().toUpperCase();
      await AdvancedVoucher.findOneAndUpdate(
        { code, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      ).catch(() => {});

      const userId = (orderDoc.customerPhone || orderDoc.customerName || '').trim();
      if (userId) {
        await UserVoucherUsage.findOneAndUpdate(
          { userId, voucherCode: code, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } }
        ).catch(() => {});
      }

      await Voucher.findOneAndUpdate(
        { code, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      ).catch(() => {});

      console.log(`🎟️ Đã hoàn trả lượt sử dụng voucher ${code} cho đơn hàng bị hủy ${orderDoc.orderCode || orderDoc._id}`);
    }
  } catch (err) {
    console.error("❌ Lỗi khi đồng bộ tồn kho đơn hàng:");
  }
}
