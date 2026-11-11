import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { normalizeStockIssue, stockIssueAmounts } from '../lib/stockIssue.js';
import { STOCK_ISSUE_HISTORY_START, STOCK_ISSUE_HISTORY_PAGE_SIZE, STOCK_ISSUE_DAY_PAGE_SIZE } from '../lib/stockIssueHistory.js';

const issueSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  data: { type: Schema.Types.Mixed, required: true },
  totals: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
issueSchema.index({ 'data.date': -1, createdAt: -1, _id: -1 });
export const StockIssue = mongoose.model('StockIssue', issueSchema);
const counterSchema = new Schema({ _id: String, value: { type: Number, default: 0 } });
const StockIssueCounter = mongoose.model('StockIssueCounter', counterSchema);
const router = Router();
const serialize = (doc: any) => ({ ...doc.data, _id: String(doc._id), number: doc.number, requestId: doc.requestId, createdAt: doc.createdAt });

const historySearch = (value: unknown) => {
  const query = typeof value === 'string' ? value.trim().slice(0, 150) : '';
  const literal = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return query ? { $or: ['number', 'data.recipient', 'data.organizationName', 'data.phone'].map(field => ({ [field]: { $regex: literal, $options: 'i' } })) } : {};
};
const validHistoryDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < STOCK_ISSUE_HISTORY_START) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

// Count all matching papers before pagination, rather than grouping the latest 50.
router.get('/days', async (req, res) => {
  if (req.query.before !== undefined && !validHistoryDate(req.query.before)) return res.status(400).json({ message: 'Mốc ngày không hợp lệ.' });
  try {
    const days = await StockIssue.aggregate([
      { $match: { ...historySearch(req.query.q), 'data.date': { $gte: STOCK_ISSUE_HISTORY_START, ...(req.query.before ? { $lt: req.query.before } : {}) } } },
      { $group: { _id: '$data.date', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: STOCK_ISSUE_HISTORY_PAGE_SIZE + 1 },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);
    res.json({ days: days.slice(0, STOCK_ISSUE_HISTORY_PAGE_SIZE), hasMore: days.length > STOCK_ISSUE_HISTORY_PAGE_SIZE });
  } catch {
    res.status(500).json({ message: 'Chưa tải được danh sách ngày. Vui lòng thử lại.' });
  }
});

router.get('/day', async (req, res) => {
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!validHistoryDate(req.query.date) || (req.query.offset !== undefined && (typeof req.query.offset !== 'string' || !/^\d+$/.test(req.query.offset))) || !Number.isSafeInteger(offset) || offset < 0) return res.status(400).json({ message: 'Ngày hoặc vị trí tải phiếu không hợp lệ.' });
  try {
    const docs = await StockIssue.find({ ...historySearch(req.query.q), 'data.date': req.query.date })
      .sort({ createdAt: -1, _id: -1 }).skip(offset).limit(STOCK_ISSUE_DAY_PAGE_SIZE + 1).lean();
    res.json({ items: docs.slice(0, STOCK_ISSUE_DAY_PAGE_SIZE).map(serialize), hasMore: docs.length > STOCK_ISSUE_DAY_PAGE_SIZE });
  } catch {
    res.status(500).json({ message: 'Chưa tải được phiếu trong ngày. Vui lòng thử lại.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = historySearch(req.query.q);
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
    const doc = await StockIssue.create({ requestId, number, data, totals: stockIssueAmounts(data) });
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
