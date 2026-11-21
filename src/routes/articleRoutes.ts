import { Router } from 'express';
import { Article } from '../models/Article.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const docs = await Article.find({}).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải tin tức' });
  }
});

router.post('/', async (req, res) => {
  try {
    const article = await Article.create({ ...req.body, views: 0, createdAt: new Date().toISOString() });
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo bài viết' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Article.findByIdAndUpdate(req.params.id, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật bài viết' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa bài viết' });
  }
});

router.patch('/:slug/view', async (req, res) => {
  try {
    await Article.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tăng lượt xem' });
  }
});

export default router;
