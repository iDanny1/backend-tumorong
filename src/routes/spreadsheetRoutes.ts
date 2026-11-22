import { productRow, importCatalog } from '../services/productSpreadsheet.js';
import { InventoryError } from '../services/inventory.js';
import { Router } from 'express';
import multer from 'multer';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { importCustomerRows } from '../lib/customerImport.js';
import { readSpreadsheet, sendSpreadsheet } from '../lib/spreadsheet.js';

interface OrderImportRow {
  'Mã đơn hàng'?: string;
  'Khách hàng'?: string;
  'SĐT'?: string;
  'Địa chỉ'?: string;
  'Tổng tiền'?: number | string;
  'Trạng thái'?: string;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter: (_req, file, done) => done(null, /\.(xlsx|xls)$/i.test(file.originalname)),
});

const router = Router({ caseSensitive: true });

// CUSTOMERS EXPORT
router.get('/api/customers/export', async (req, res) => {
  try {
    const customers = await Customer.find({}).lean();
    const rows = customers.map(c => ({
      ID: c._id.toString(),
      Tên: c.name || '',
      'Số điện thoại': c.phone || '',
      'Địa chỉ khách hàng': c.address || '',
      'Địa chỉ (bộ phận)': c.departmentAddress || '',
      'Địa điểm giao hàng': c.deliveryAddress || '',
      'Thông tin liên hệ gốc': c.phoneRaw || c.phone || '',
      'Email': c.email || '',
      'Loại khách': c.type === 'wholesale' ? 'Sỉ' : 'Lẻ',
      'Tổng đơn': c.ordersCount || 0,
      'Tổng chi tiêu': c.totalSpent || 0,
      'Ngày tạo': c.createdAt
    }));
    sendSpreadsheet(res, rows, 'Khách hàng', 'customers.xlsx');
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

// CUSTOMERS IMPORT
router.post('/api/customers/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
    const data = readSpreadsheet<Record<string, unknown>>(req.file.buffer, { raw: false, defval: '' });
    const result = await importCustomerRows(data, Customer);
    const warning = result.warnings.length ? ` Có ${result.warnings.length} số điện thoại cần kiểm tra.` : '';
    res.json({ ...result, message: `Nhập thành công ${result.inserted} khách hàng mới; ${result.existing} hồ sơ đã có; bỏ qua ${result.skipped} dòng thiếu tên.${warning}` });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

// PRODUCTS EXPORT
router.get('/api/products/export', async (req, res) => {
  try {
    const rows = (await Product.find({ archived: { $ne: true } }).lean()).map(productRow);
    sendSpreadsheet(res, rows, 'Sản phẩm', 'products.xlsx');
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

// PRODUCTS IMPORT
router.post('/api/products/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
    const { inserted, updated } = await importCatalog(readSpreadsheet<Record<string,unknown>>(req.file.buffer));
    res.json({inserted, updated, message: `Đã thêm ${inserted}, cập nhật ${updated} sản phẩm. Tồn kho được ghi qua phiếu.`});
  } catch (err: any) {
    if (err instanceof InventoryError) return res.status(err.status).json({error:err.message});
    if (err.code === 11000) return res.status(409).json({error:'SKU trùng. Chưa nhập dòng nào.'});
    res.status(500).json({ error: 'Chưa nhập được danh mục sản phẩm.' });
  }
});
// ORDERS IMPORT
router.post('/api/orders/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
    const data = readSpreadsheet<OrderImportRow>(req.file.buffer);
    let count = 0;
    for (const row of data) {
      if (!row['Khách hàng']) continue;
      const total = Number(row['Tổng tiền']) || 0;
      await Order.create({
        orderId: row['Mã đơn hàng'] || `DH${Date.now()}${count}`,
        orderCode: row['Mã đơn hàng'] || `DH${Date.now()}${count}`,
        customerName: row['Khách hàng'],
        customerPhone: row['SĐT'] || '',
        address: row['Địa chỉ'] || '',
        total,
        totalAmount: total,
        status: row['Trạng thái'] || 'Chờ xác nhận',
        paymentStatus: 'Chưa thanh toán',
        products: [],
        items: []
      });
      count++;
    }
    res.json({ message: `Nhập thành công ${count} đơn hàng.` });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

export default router;
