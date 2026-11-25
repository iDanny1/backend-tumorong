import { Router } from 'express';
import { z } from 'zod';
import { stockCountDay } from '../lib/stockCount.js';
import { StockCount } from '../models/StockCount.js';
import { Product } from '../models/Product.js';
import { Warehouse } from '../models/Warehouse.js';
import { dailyStockCountRows, stockCountWorkbook } from '../services/stockCountReport.js';
import { sendStockCountMail, sendStockCountTest, StockReportMailError } from '../services/stockCountMail.js';
import { saveStockCountBatch, stockCountBatchInput } from '../services/stockCountBatch.js';
import { InventoryError } from '../services/inventory.js';

const router = Router({ caseSensitive: true });
const objectId = z.string().regex(/^[a-f\d]{24}$/i).toLowerCase();
const submission = z.object({
  requestId: z.uuid(),
  checkerName: z.string().trim().min(1).max(120).regex(/^[^\r\n]+$/).optional(),
  warehouseId: objectId,
  productId: objectId,
  quantity: z.number().nonnegative().max(Number.MAX_SAFE_INTEGER),
  packaging: z.string().trim().min(1).max(500),
}).strict();

router.get('/', async (req, res) => {
  const day = z.iso.date().safeParse(req.query.day);
  if (!day.success) return res.status(400).json({ error: 'Vui lòng chọn ngày kiểm kê hợp lệ.' });
  try {
    const rows = await StockCount.find({ day: day.data }).sort({ createdAt: -1, _id: -1 }).select('-staffId').lean();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Chưa tải được lịch sử kiểm kê.' });
  }
});

router.get('/report', async (req, res) => {
  const day = z.iso.date().safeParse(req.query.day);
  if (!day.success) return res.status(400).json({ error: 'Vui lòng chọn ngày báo cáo hợp lệ.' });
  try {
    const buffer = stockCountWorkbook(day.data, await dailyStockCountRows(day.data));
    res.attachment('Kiem-ke-' + day.data + '.xlsx').send(buffer);
  } catch {
    res.status(500).json({ error: 'Chưa xuất được báo cáo kiểm kê.' });
  }
});

router.post('/report/test-email', async (_req, res) => {
  try {
    res.json({ status: await sendStockCountTest() });
  } catch (err) {
    if (err instanceof StockReportMailError) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'Chưa xác nhận được email thử.' });
  }
});

router.post('/report/email', async (req, res) => {
  const input = z.object({ day: z.iso.date(), count: z.number().int().positive(), latestId: z.uuid() }).strict().safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Chọn báo cáo có lượt kiểm để gửi.' });
  try {
    const { day, count, latestId } = input.data;
    const results = await sendStockCountMail(day, String(req.adminUser._id), count, latestId);
    res.json({ results });
  } catch (err) {
    if (err instanceof StockReportMailError) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'Chưa xác nhận được kết quả gửi báo cáo.' });
  }
});

router.post('/batch', async (req, res) => {
  const input = stockCountBatchInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Kiểm tra số lượng từ 0, quy cách và tên người kiểm. Mỗi sản phẩm chỉ nhập một dòng, tối đa 200 dòng.' });
  try {
    res.json(await saveStockCountBatch(input.data, req.adminUser));
  } catch (err) {
    if (err instanceof InventoryError) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'Chưa xác nhận được phiếu kiểm kê. Giữ nguyên bảng và thử lưu lại.' });
  }
});

router.post('/', async (req, res) => {
  const input = submission.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Vui lòng kiểm tra kho, sản phẩm, số lượng và quy cách đóng gói.' });
  const { requestId, warehouseId, productId, quantity, packaging, checkerName } = input.data;
  const staffId = String(req.adminUser._id);
  const replay = async () => {
    const entry = await StockCount.findById(requestId).lean();
    if (!entry) return false;
    if (entry.staffId === staffId && entry.warehouseId === warehouseId && entry.productId === productId &&
        entry.quantity === quantity && entry.packaging === packaging && entry.checkerName === checkerName) res.json({ id: entry._id, day: entry.day });
    else res.status(409).json({ error: 'Mã lượt kiểm đã được dùng cho nội dung khác.' });
    return true;
  };
  try {
    if (await replay()) return;
    const [warehouse, product] = await Promise.all([
      Warehouse.findOne({ _id: warehouseId, active: { $ne: false } }, 'name').lean(),
      Product.findOne({ _id: productId, archived: { $ne: true } }, 'name sku unit').lean(),
    ]);
    if (!warehouse || !product) return res.status(409).json({ error: 'Kho hoặc sản phẩm đã ngừng sử dụng. Vui lòng chọn lại.' });
    const createdAt = new Date();
    const day = stockCountDay(createdAt);
    try {
      await StockCount.create({ _id: requestId, warehouseId, warehouseName: warehouse.name, productId,
        productName: product.name, sku: product.sku || '', unit: product.unit || 'đơn vị', quantity, packaging,
        staffId, countedBy: req.adminUser.name || req.adminUser.username, checkerName, createdAt, day });
    } catch (err) {
      if (err?.code === 11000 && await replay()) return;
      throw err;
    }
    res.status(201).json({ id: requestId, day });
  } catch {
    res.status(500).json({ error: 'Chưa xác nhận được lượt kiểm. Vui lòng thử lưu lại.' });
  }
});

export default router;
