import { isDeepStrictEqual } from 'node:util';
import { Router, type Response } from 'express';
import mongoose, { Schema, Types } from 'mongoose';
import { normalizeQuote, quoteCompanies, quoteHistoryPageSize, quoteNumber, quotePricing, quoteRequestId, type QuoteData, type SavedQuote } from '../lib/quotation.js';
import { customerFromQuote, syncDocumentCustomer } from '../services/documentCustomer.js';

interface QuoteRecord {
  _id: Types.ObjectId;
  requestId: string;
  number: string;
  data: QuoteData;
  companyName: string;
  companyAddress: string;
  totals: ReturnType<typeof quotePricing>;
  createdAt: Date;
}

const schema = new Schema<QuoteRecord>({
  requestId: { type: String, unique: true, required: true },
  number: { type: String, unique: true, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  totals: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
schema.index({ 'data.date': -1, createdAt: -1, _id: -1 });

const Quotation = mongoose.model('Quotation', schema);
const QuoteCounter = mongoose.model('QuotationCounter', new Schema({ _id: String, value: Number }));
const router = Router();

function serialize(doc: QuoteRecord): SavedQuote {
  return {
    ...doc.data, _id: String(doc._id), number: doc.number, requestId: doc.requestId,
    companyName: doc.companyName, companyAddress: doc.companyAddress, createdAt: doc.createdAt.toISOString(),
  };
}

router.get('/', async (req, res) => {
  const offset = req.query.offset ?? '0';
  const query = req.query.q ?? '';
  if (typeof query !== 'string' || query.length > 150 || typeof offset !== 'string'
      || !/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset))) {
    return res.status(400).json({ message: 'Thông tin tìm kiếm báo giá không hợp lệ.' });
  }
  const search = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = search ? { $or: ['data.customerName', 'number'].map(field => ({
    [field]: { $regex: search, $options: 'i' },
  })) } : {};
  try {
    const docs = await Quotation.find(filter).sort({ 'data.date': -1, createdAt: -1, _id: -1 })
      .skip(Number(offset)).limit(quoteHistoryPageSize + 1).lean();
    res.json({ items: docs.slice(0, quoteHistoryPageSize).map(serialize), hasMore: docs.length > quoteHistoryPageSize });
  } catch {
    res.status(500).json({ message: 'Chưa tải được lịch sử báo giá.' });
  }
});

async function respondWithCustomer(res: Response, doc: QuoteRecord, status = 200) {
  try {
    await syncDocumentCustomer(customerFromQuote(doc.data));
    return res.status(status).json(serialize(doc));
  } catch {
    return res.status(503).json({ documentSaved: true, requestId: doc.requestId, number: doc.number,
      message: 'Báo giá đã lưu nhưng chưa lưu được khách hàng. Vui lòng bấm lưu lại để hoàn tất; hệ thống sẽ giữ nguyên số báo giá.' });
  }
}

function respondToRetry(res: Response, doc: QuoteRecord, data: QuoteData) {
  if (!isDeepStrictEqual(doc.data, data)) {
    return res.status(409).json({ message: 'Báo giá đã được lưu với nội dung khác. Vui lòng kiểm tra lịch sử báo giá.' });
  }
  return respondWithCustomer(res, doc);
}

router.post('/', async (req, res) => {
  let requestId: string;
  let data: QuoteData;
  try {
    requestId = quoteRequestId(req.body?.requestId);
    data = normalizeQuote(req.body);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  try {
    await Quotation.init();
    const existing = await Quotation.findOne({ requestId }).lean();
    if (existing) return respondToRetry(res, existing, data);
    const day = data.date.replaceAll('-', '');
    const counter = await QuoteCounter.findOneAndUpdate(
      { _id: day }, { $inc: { value: 1 } }, { upsert: true, returnDocument: 'after' },
    );
    const company = quoteCompanies.find(option => option.id === data.companyId)!;
    const doc = await Quotation.create({
      data, requestId, number: quoteNumber(data.date, counter.value),
      companyName: company.name, companyAddress: company.address, totals: quotePricing(data),
    });
    return respondWithCustomer(res, doc, 201);
  } catch (error) {
    // Concurrent submissions can both pass the lookup before the unique index chooses a winner.
    if ((error as { code?: number }).code === 11000) {
      const winner = await Quotation.findOne({ requestId }).lean().catch(() => null);
      if (winner) return respondToRetry(res, winner, data);
    }
    res.status(500).json({ message: 'Chưa lưu được báo giá. Vui lòng thử lại.' });
  }
});

export default router;
