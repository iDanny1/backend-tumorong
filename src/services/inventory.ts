import mongoose, { type ClientSession } from 'mongoose';
import Decimal from 'decimal.js-light';
import { Product } from '../models/Product.js';
import { Warehouse } from '../models/Warehouse.js';

export class InventoryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface InventoryLine { productId: string; quantity: number }
export interface Allocation extends InventoryLine { warehouseId: string }
type Direction = 'in' | 'out';

export async function inventoryTransaction<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
  try {
    return await mongoose.connection.transaction(operation, { readPreference: 'primary', writeConcern: { w: 'majority' } });
  } catch (error) {
    if ((error as { code?: number })?.code === 20) {
      throw new InventoryError(503, 'Ghi sổ kho cần MongoDB replica set. Vui lòng liên hệ quản trị viên.');
    }
    throw error;
  }
}

function checkId(id: unknown, message: string) {
  if (typeof id !== 'string' || !/^[0-9a-f]{24}$/i.test(id)) throw new InventoryError(400, message);
  return id.toLowerCase();
}

// Store a movement only if its decimal result can round-trip through the existing BSON Number field.
function add(left: number, right: number) {
  const sum = new Decimal(left).plus(right);
  const value = sum.toNumber();
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER || !sum.eq(value) ||
      (right !== 0 && value === left)) throw new InventoryError(409, 'Số lượng vượt độ chính xác của dữ liệu tồn kho.');
  return value;
}

export function quantitiesByProduct(lines: readonly InventoryLine[]): Map<string, number> {
  if (!Array.isArray(lines) || !lines.length) throw new InventoryError(400, 'Chưa có sản phẩm để ghi sổ kho.');
  const quantities = new Map<string, number>();
  for (const line of lines) {
    const id = checkId(line?.productId, 'Mỗi dòng ghi sổ phải chọn một sản phẩm từ danh mục.');
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      throw new InventoryError(400, 'Số lượng ghi sổ phải lớn hơn 0.');
    }
    quantities.set(id, add(quantities.get(id) || 0, line.quantity));
  }
  return quantities;
}

// The write on the warehouse also serializes movements against disabling or deleting that warehouse.
export async function lockWarehouse(session: ClientSession, warehouseId: string) {
  const id = checkId(warehouseId, 'Vui lòng chọn kho trong danh sách.');
  const result = await Warehouse.updateOne({ _id: id, active: { $ne: false } }, { $inc: { inventoryRevision: 1 } }, { session });
  if (!result.matchedCount) throw new InventoryError(409, 'Kho đã ngừng hoạt động hoặc không còn tồn tại.');
  return id;
}

async function readBalance(session: ClientSession, productId: string, restoreArchived = false) {
  const product = await Product.findById(productId, 'name stock warehouseStock archived', { session }).lean();
  if (!product) throw new InventoryError(404, 'Sản phẩm đã bị xóa hoặc không tồn tại.');
  if (product.archived && !restoreArchived) throw new InventoryError(409, 'Sản phẩm đã lưu trữ. Vui lòng chọn sản phẩm đang quản lý.');
  const byWarehouse: Record<string, number> = { ...(product.warehouseStock || {}) };
  let allocated = 0;
  for (const qty of Object.values(byWarehouse)) {
    if (!Number.isFinite(qty) || qty < 0) throw new InventoryError(409, 'Tồn từng kho không hợp lệ. Vui lòng đối soát trước khi lập phiếu.');
    allocated = add(allocated, qty);
  }
  const total = product.stock ?? allocated;
  if (!Number.isFinite(total) || total < allocated) throw new InventoryError(409, 'Tổng tồn nhỏ hơn tồn các kho hoặc không hợp lệ. Vui lòng đối soát sản phẩm.');
  return { name: product.name, total, byWarehouse, unallocated: add(total, -allocated), archived: Boolean(product.archived) };
}

type Balance = Awaited<ReturnType<typeof readBalance>>;

async function writeMovement(session: ClientSession, productId: string, balance: Balance, allocations: Allocation[], direction: Direction) {
  for (const { warehouseId, quantity } of allocations) {
    const available = warehouseId ? balance.byWarehouse[warehouseId] ?? 0 : balance.unallocated;
    if (direction === 'out' && available < quantity) {
      throw new InventoryError(409, `Sản phẩm “${balance.name}” chỉ còn ${available} tại kho đã chọn, cần ${quantity}.`);
    }
    const change = direction === 'in' ? quantity : -quantity;
    if (warehouseId) balance.byWarehouse[warehouseId] = add(available, change);
    else balance.unallocated = add(available, change);
    balance.total = add(balance.total, change);
  }
  await Product.updateOne({ _id: productId }, { $set: {
    stock: balance.total, warehouseStock: balance.byWarehouse,
    // Restored stock must reappear in the warehouse catalog. Storefront visibility stays off.
    ...(balance.archived ? { archived: false, active: false } : {}),
  } }, { session });
}

export async function applyWarehouseMovement(session: ClientSession, warehouseId: string, lines: readonly InventoryLine[], direction: Direction) {
  const quantities = quantitiesByProduct(lines);
  const id = await lockWarehouse(session, warehouseId);
  for (const [productId, quantity] of quantities) {
    const balance = await readBalance(session, productId);
    await writeMovement(session, productId, balance, [{ productId, quantity, warehouseId: id }], direction);
  }
}

export async function deductOrderLines(session: ClientSession, lines: InventoryLine[], warehouseId?: string): Promise<Allocation[]> {
  const quantities = quantitiesByProduct(lines);
  if (warehouseId) {
    await applyWarehouseMovement(session, warehouseId, lines, 'out');
    return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity, warehouseId: warehouseId.toLowerCase() }));
  }
  const active = await Warehouse.find({ active: { $ne: false } }, '_id', { session }).lean();
  const availableIds = new Set(active.map(row => String(row._id)));
  const locked = new Set<string>();
  const allocations: Allocation[] = [];
  for (const [productId, quantity] of quantities) {
    const balance = await readBalance(session, productId);
    let remaining = quantity;
    const taken: Allocation[] = [];
    // Allocate real warehouses first. An empty ID identifies legacy unallocated stock.
    const ids = Object.keys(balance.byWarehouse).filter(id => availableIds.has(id)).sort();
    for (const id of [...ids, '']) {
      const available = id ? balance.byWarehouse[id] : balance.unallocated;
      const take = Math.min(remaining, available);
      if (take === 0) continue;
      if (id && !locked.has(id)) {
        await lockWarehouse(session, id);
        locked.add(id);
      }
      taken.push({ productId, warehouseId: id, quantity: take });
      remaining = add(remaining, -take);
      if (remaining === 0) break;
    }
    if (remaining > 0) throw new InventoryError(409, `Sản phẩm “${balance.name}” thiếu ${remaining} để xác nhận đơn.`);
    await writeMovement(session, productId, balance, taken, 'out');
    allocations.push(...taken);
  }
  return allocations;
}

export async function restoreOrderLines(session: ClientSession, allocations: Allocation[]) {
  if (!allocations?.length) throw new InventoryError(409, 'Đơn cũ thiếu lịch sử trừ kho. Cần đối soát số đã xuất và kho gốc trước khi hủy.');
  const grouped = new Map<string, Allocation[]>();
  for (const allocation of allocations) {
    const group = grouped.get(allocation.productId) || [];
    group.push(allocation);
    grouped.set(allocation.productId, group);
  }
  for (const id of new Set(allocations.map(line => line.warehouseId).filter(Boolean))) await lockWarehouse(session, id);
  for (const [productId, entries] of grouped) {
    const balance = await readBalance(session, productId, true);
    await writeMovement(session, productId, balance, entries, 'in');
  }
}
