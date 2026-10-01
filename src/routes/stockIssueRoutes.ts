import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { normalizeStockIssue, stockIssueTotals } from '../lib/stockIssue.js';

const issueSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  data: { type: Schema.Types.Mixed, required: true },
  totals: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
export const StockIssue = mongoose.model('StockIssue', issueSchema);
const counterSchema = new Schema({ _id: String, value: { type: Number, default: 0 } });
const StockIssueCounter = mongoose.model('StockIssueCounter', counterSchema);
const router = Router();
const serialize = (doc: any) => ({ ...doc.data, _id: String(doc._id), number: doc.number, requestId: doc.requestId, createdAt: doc.createdAt });

router.get('/', async (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 150) : '';
    const literal = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = query ? { $or: ['number', 'data.recipient', 'data.phone'].map(field => ({ [field]: { $regex: literal, $options: 'i' } })) } : {};
    const docs = await StockIssue.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50).lean();
    res.json(docs.map(serialize));
  } catch {
    res.status(500).json({ message: 'Chưa tải được phiếu đã lưu. Vui lòng thử lại.' });
  }
});

router.post('/', async (req, res) => {
  let data;
  const requestId = req.body?.requestId;
  try {
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) throw new Error('Mã lưu phiếu không hợp lệ. Vui lòng tải lại trang.');
    data = normalizeStockIssue(req.body);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
  try {
    await StockIssue.init();
    await StockIssueCounter.init();
    // Durable idempotency: retrying a lost response must not create a second paper.
    const existing = await StockIssue.findOne({ requestId }).lean();
    if (existing) {
      if (JSON.stringify(existing.data) !== JSON.stringify(data)) return res.status(409).json({ message: 'Phiếu này đã được lưu với nội dung khác. Hãy mở Phiếu đã lưu để kiểm tra và tạo bản sao nếu cần sửa.' });
      return res.json(serialize(existing));
    }
    const day = data.date.replaceAll('-', '');
    const counter = await StockIssueCounter.findOneAndUpdate({ _id: day }, { $inc: { value: 1 } }, { upsert: true, new: true });
    const number = `PXK${day}-${String(counter.value).padStart(4, '0')}`;
    // Paper records intentionally do not mutate orders, stock, or customer spending.
    const doc = await StockIssue.create({ requestId, number, data, totals: stockIssueTotals(data.items, data.vatRate) });
    res.status(201).json(serialize(doc));
  } catch (error: any) {
    if (error.code === 11000) {
      const existing = await StockIssue.findOne({ requestId }).lean().catch(() => null);
      if (existing && JSON.stringify(existing.data) === JSON.stringify(data)) return res.json(serialize(existing));
      return res.status(409).json({ message: 'Phiếu đang được lưu. Vui lòng bấm lưu lại sau vài giây.' });
    }
    res.status(500).json({ message: 'Chưa lưu được phiếu. Nội dung vẫn được giữ trên máy, bạn có thể thử lại.' });
  }
});

export default router;
