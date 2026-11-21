import { Router } from 'express';
import { Product } from '../models/Product.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.categoryId) {
      filter.categoryIds = req.query.categoryId;
    }
    if (req.query.active) {
      filter.active = req.query.active === 'true';
    }
    const docs = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = new Product({ ...req.body, createdAt: new Date().toISOString() });
    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { runValidators: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.patch('/:id/stock', async (req, res) => {
  try {
    const { warehouseStock, stock } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { $set: { warehouseStock, stock } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

export default router;
