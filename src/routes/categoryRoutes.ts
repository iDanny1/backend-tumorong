import { Router } from 'express';
import { Category } from '../models/Category.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.active) {
      filter.active = req.query.active === 'true';
    }
    const docs = await Category.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải danh mục' });
  }
});

router.post('/', async (req, res) => {
  try {
    const category = await Category.create({ ...req.body, createdAt: new Date().toISOString() });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo danh mục' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa danh mục' });
  }
});

export default router;
