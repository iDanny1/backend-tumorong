import { Router } from 'express';
import multer from 'multer';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { importCustomerRows } from '../lib/customerImport.js';
import { readSpreadsheet, sendSpreadsheet } from '../lib/spreadsheet.js';

interface ProductImportRow {
  'Tên'?: string;
  'Giá'?: number | string;
  'Mô tả'?: string;
  'Tồn kho'?: number | string;
  'Trạng thái'?: string;
  'Nổi bật'?: string;
}

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
    const products = await Product.find({}).lean();
    const rows = products.map(p => ({
      ID: p._id.toString(),
      Tên: p.name || '',
      'Giá': p.price || 0,
      'Mô tả': p.description || '',
      'Tồn kho': p.stock || 0,
      'Trạng thái': p.status || '',
      'Nổi bật': p.isFeatured ? 'Có' : 'Không',
      'Ngày tạo': p.createdAt
    }));
    sendSpreadsheet(res, rows, 'Sản phẩm', 'products.xlsx');
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

// PRODUCTS IMPORT
router.post('/api/products/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
    const data = readSpreadsheet<ProductImportRow>(req.file.buffer);
    let count = 0;
    for (const row of data) {
      if (!row['Tên']) continue;
      await Product.create({
        name: row['Tên'],
        price: Number(row['Giá']) || 0,
        description: row['Mô tả'] || '',
        stock: Number(row['Tồn kho']) || 1000,
        status: row['Trạng thái'] || 'Còn hàng',
        isFeatured: row['Nổi bật'] === 'Có'
      });
      count++;
    }
    res.json({ message: `Nhập thành công ${count} sản phẩm.` });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
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
