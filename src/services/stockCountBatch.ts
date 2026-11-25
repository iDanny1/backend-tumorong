import { createHash, randomUUID } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { stockCountDay } from '../lib/stockCount.js';
import { StockCount } from '../models/StockCount.js';
import { Product } from '../models/Product.js';
import { Warehouse } from '../models/Warehouse.js';
import { InventoryError, inventoryTransaction } from './inventory.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).toLowerCase();
export const stockCountBatchInput = z.object({
  requestId: z.uuid(), warehouseId: objectId,
  checkerName: z.string().trim().min(1).max(120).regex(/^[^\r\n]+$/),
  items: z.array(z.object({
    productId: objectId, quantity: z.number().nonnegative().max(Number.MAX_SAFE_INTEGER),
    packaging: z.string().trim().min(1).max(500),
  }).strict()).min(1).max(200),
}).strict().refine(data => new Set(data.items.map(item => item.productId)).size === data.items.length, {
  message: 'Mỗi sản phẩm chỉ nhập một dòng trong phiếu.',
});
const Batch = mongoose.model('StockCountBatch', new Schema({
  _id: String, fingerprint: String, day: String, count: Number,
}, { versionKey: false }));

export async function saveStockCountBatch(input: z.infer<typeof stockCountBatchInput>, staff: { _id: unknown; name?: string; username: string }) {
  const { requestId, ...data } = input;
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...data, staffId: String(staff._id) })).digest('hex');
  const replay = async () => {
    const saved = await Batch.findById(requestId).lean();
    if (!saved) return null;
    if (saved.fingerprint !== fingerprint) throw new InventoryError(409, 'Lượt lưu này đã dùng cho nội dung khác.');
    return { day: saved.day, count: saved.count };
  };
  const existing = await replay();
  if (existing) return existing;
  try {
    return await inventoryTransaction(async session => {
      const warehouse = await Warehouse.findOne({ _id: input.warehouseId, active: { $ne: false } }).session(session).lean();
      const products = await Product.find({ _id: { $in: input.items.map(item => item.productId) }, archived: { $ne: true } }).session(session).lean();
      if (!warehouse || products.length !== input.items.length) {
        throw new InventoryError(409, 'Kho hoặc sản phẩm đã ngừng sử dụng. Vui lòng kiểm tra lại danh sách.');
      }
      const createdAt = new Date(), day = stockCountDay(createdAt);
      await Batch.create([{ _id: requestId, fingerprint, day, count: input.items.length }], { session });
      const byId = new Map(products.map(product => [String(product._id), product]));
      await StockCount.insertMany(input.items.map(item => {
        const product = byId.get(item.productId)!;
        return { ...item, _id: randomUUID(), warehouseId: input.warehouseId, warehouseName: warehouse.name,
          productName: product.name, sku: product.sku || '', unit: product.unit || 'đơn vị',
          staffId: String(staff._id), countedBy: staff.name || staff.username, checkerName: input.checkerName, day, createdAt };
      }), { session });
      return { day, count: input.items.length };
    });
  } catch (error) {
    if (error?.code === 11000) {
      const saved = await replay();
      if (saved) return saved;
    }
    throw error;
  }
}
