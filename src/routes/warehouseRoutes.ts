import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { inventoryTransaction, InventoryError, lockWarehouse } from '../services/inventory.js';
import { Router } from 'express';
import { Warehouse } from '../models/Warehouse.js';
import { warehouseInput } from '../lib/warehouse.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const docs = await Warehouse.find({ active: { $ne: false } }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải kho hàng' });
  }
});

router.post('/', async (req, res) => {
  let input: Record<string, unknown>;
  try {
    input = warehouseInput(req.body);
    if (!input.name) throw new Error('Vui lòng nhập tên kho.');
  } catch (err) { return res.status(400).json({ error: (err as Error).message }); }
  try {
    const warehouse = await Warehouse.create({ ...input, createdAt: new Date().toISOString() });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo kho hàng' });
  }
});

router.put('/:id', async (req, res) => {
  let input: Record<string, unknown>;
  try { input = warehouseInput(req.body); }
  catch (err) { return res.status(400).json({ error: (err as Error).message }); }
  try {
    if (input.active === false) return res.status(400).json({error: 'Dùng thao tác ngừng sử dụng kho để kiểm tra tồn trước khi đóng.'});
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, { $set: input }, { new: true });
    if (!warehouse) return res.status(404).json({ error: 'Không tìm thấy kho hàng.' });
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật kho hàng' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await inventoryTransaction(async session => {
      const id = await lockWarehouse(session,req.params.id);
      if (await Product.exists({ ['warehouseStock.'+id]: { $gt:0 } }).session(session)
        || await Order.exists({stockDeducted:true, 'inventoryAllocations.warehouseId':id}).session(session)) {
        throw new InventoryError(409,'Kho còn hàng hoặc có đơn đã trừ kho. Cần đối soát trước khi đóng kho.');
      }
      await Warehouse.updateOne({_id:id},{$set:{active:false}},{session});
    });
    res.json({ success: true });
  } catch (err) {
    if (err instanceof InventoryError) return res.status(err.status).json({error:err.message});
    res.status(500).json({ error: 'Lỗi xóa kho hàng' });
  }
});

export default router;
