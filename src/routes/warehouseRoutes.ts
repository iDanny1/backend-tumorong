import { Router } from 'express';
import { Warehouse } from '../models/Warehouse.js';
import { warehouseInput } from '../lib/warehouse.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const docs = await Warehouse.find({}).sort({ createdAt: -1 });
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
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, { $set: input }, { new: true });
    if (!warehouse) return res.status(404).json({ error: 'Không tìm thấy kho hàng.' });
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật kho hàng' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa kho hàng' });
  }
});

export default router;
