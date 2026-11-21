import { Router } from 'express';
import { Campaign } from '../models/Campaign.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const docs = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải chiến dịch' });
  }
});

router.post('/', async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, createdAt: new Date().toISOString() });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo chiến dịch' });
  }
});

export default router;
