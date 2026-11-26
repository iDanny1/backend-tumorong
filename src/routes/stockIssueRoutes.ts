import { Router, type Response } from 'express';
import { isDeepStrictEqual } from 'node:util';
import mongoose, { Schema } from 'mongoose';
import { normalizeStockIssue, stockIssueAmounts, type StockIssueData } from '../lib/stockIssue.js';
import { STOCK_ISSUE_HISTORY_START, STOCK_ISSUE_HISTORY_PAGE_SIZE, STOCK_ISSUE_DAY_PAGE_SIZE } from '../lib/stockIssueHistory.js';
import { customerFromStockIssue, syncDocumentCustomer } from '../services/documentCustomer.js';
import { applyWarehouseMovement, inventoryTransaction, InventoryError } from '../services/inventory.js';
import { linkDeductedOrder } from '../services/orderInventory.js';

const issueSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  data: { type: Schema.Types.Mixed, required: true },
  totals: { type: Schema.Types.Mixed, required: true },
  inventoryStatus: { type: String, enum: ['posted', 'linked', 'document-only'] },
  postedBy: String,
}, { timestamps: true });
issueSchema.index({ 'data.date': -1, createdAt: -1, _id: -1 });
issueSchema.index({ 'data.sourceIssueId': 1 }, { unique: true, sparse: true });
export const StockIssue = mongoose.model('StockIssue', issueSchema);
const counterSchema = new Schema({ _id: String, value: { type: Number, default: 0 } });
const StockIssueCounter = mongoose.model('StockIssueCounter', counterSchema);
const router = Router();
const serialize = (doc: any) => ({ ...doc.data, _id: String(doc._id), number: doc.number, requestId: doc.requestId, createdAt: doc.createdAt,
  inventoryStatus: doc.inventoryStatus ?? 'legacy' });

async function respondWithCustomer(res: Response, doc: any, status = 200) {
  try {
    // Run on identical retries too: a saved paper can recover a failed CRM write.
    if (doc.data.documentType !== 'receipt') await syncDocumentCustomer(customerFromStockIssue(doc.data));
    return res.status(status).json(serialize(doc));
  } catch {
    return res.status(503).json({ documentSaved: true, requestId: doc.requestId, number: doc.number,
      message: 'Phiếu đã lưu nhưng chưa lưu được khách hàng. Vui lòng bấm lưu lại để hoàn tất; hệ thống sẽ giữ nguyên số phiếu.' });
  }
}

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

// A handover tied to an issued shipment is evidence of that same delivery.
// Compare physical quantities only; the financial columns differ by document type.
function deliveredLines(data: StockIssueData) {
  return data.items.filter(item => item.quantity > 0)
    .map(({ productId, quantity }) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId) || a.quantity - b.quantity);
}

router.post('/', async (req, res) => {
  let data: StockIssueData;
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
      if (!isDeepStrictEqual(existing.data, data)) return res.status(409).json({ message: 'Phiếu này đã được lưu với nội dung khác. Hãy mở Phiếu đã lưu để kiểm tra và tạo bản sao nếu cần sửa.' });
      return respondWithCustomer(res, existing);
    }
    if (!data.documentOnly && !mongoose.isObjectIdOrHexString(data.warehouseId)) return res.status(400).json({ message: 'Vui lòng chọn kho từ danh mục trước khi ghi sổ.' });
    const missingProduct = data.items.findIndex(item => !mongoose.isObjectIdOrHexString(item.productId));
    if (missingProduct >= 0) return res.status(400).json({ message: `Dòng ${missingProduct + 1} chưa liên kết sản phẩm. Vui lòng chọn hàng từ danh mục.` });
    const lines = deliveredLines(data);
    const day = data.date.replaceAll('-', '');
    const prefix = data.documentType === 'handover' ? 'BBBG' : data.documentType === 'receipt' ? 'PNK' : 'PXK';
    const counter = await StockIssueCounter.findOneAndUpdate({ _id: prefix === 'PXK' ? day : `${prefix}:${day}` }, { $inc: { value: 1 } }, { upsert: true, new: true });
    const number = `${prefix}${day}-${String(counter.value).padStart(4, '0')}`;
    const persist = async (session?: mongoose.ClientSession) => {
      const linked = Boolean(data.sourceIssueId || data.sourceOrderId);
      // Claim the request before mutating stock. A failed movement rolls back
      // this insert and every touched product in the same transaction.
      const [saved] = await StockIssue.create([{ requestId, number, data, totals: stockIssueAmounts(data),
        inventoryStatus: data.documentOnly ? 'document-only' : linked ? 'linked' : 'posted', postedBy: req.adminUser?.username }], { session });
      if (data.documentOnly) return saved;
      if (data.sourceIssueId) {
        const source = await StockIssue.findById(data.sourceIssueId, null, { session }).lean();
        if (!['posted', 'linked'].includes(source?.inventoryStatus) || ['handover', 'receipt'].includes(source.data.documentType)
          || source.data.warehouseId !== data.warehouseId || !isDeepStrictEqual(deliveredLines(source.data), lines)) {
          throw new InventoryError(409, 'Biên bản phải khớp kho và số lượng từng dòng của phiếu xuất đã ghi sổ.');
        }
      } else if (data.sourceOrderId) {
        await linkDeductedOrder(session, data.sourceOrderId, data.warehouseId, lines, requestId);
      } else {
        await applyWarehouseMovement(session, data.warehouseId, lines, data.documentType === 'receipt' ? 'in' : 'out');
      }
      return saved;
    };
    const doc = data.documentOnly ? await persist() : await inventoryTransaction(persist);
    return respondWithCustomer(res, doc, 201);
  } catch (error: any) {
    if (error instanceof InventoryError) return res.status(error.status).json({ message: error.message });
    if (error.code === 11000) {
      const existing = await StockIssue.findOne({ requestId }).lean().catch(() => null);
      if (existing && isDeepStrictEqual(existing.data, data)) return respondWithCustomer(res, existing);
      const message = error.keyPattern?.['data.sourceIssueId'] ? 'Phiếu xuất này đã có biên bản bàn giao. Vui lòng mở lịch sử để in lại.'
        : 'Số phiếu hoặc mã yêu cầu đã được sử dụng. Vui lòng kiểm tra lịch sử phiếu.';
      return res.status(409).json({ message });
    }
    res.status(500).json({ message: 'Chưa lưu được phiếu. Nội dung vẫn được giữ trên máy, bạn có thể thử lại.' });
  }
});

export default router;
