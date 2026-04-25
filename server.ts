import express from 'express';
import Datastore from '@seald-io/nedb';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cấu hình Giao Hàng Nhanh (GHN)
  const GHN_TOKEN = "c0e79cba-3ef4-11f1-9107-4a16704feeb7";
  const GHN_SHOP_ID = "5945053";
  const ZALO_SECRET_KEY = "G8yOT6fT2I7xOc6mV4Jw";

  // Khởi tạo Databases
  const productDB = new Datastore({ filename: path.join(process.cwd(), 'products.db'), autoload: true });
  const orderDB = new Datastore({ filename: path.join(process.cwd(), 'orders.db'), autoload: true });
  const userDB = new Datastore({ filename: path.join(process.cwd(), 'users.db'), autoload: true });
  const categoryDB = new Datastore({ filename: path.join(process.cwd(), 'categories.db'), autoload: true });
  const warehouseDB = new Datastore({ filename: path.join(process.cwd(), 'warehouses.db'), autoload: true });
  const voucherDB = new Datastore({ filename: path.join(process.cwd(), 'vouchers.db'), autoload: true });
  const articleDB = new Datastore({ filename: path.join(process.cwd(), 'news.db'), autoload: true });
  const campaignDB = new Datastore({ filename: path.join(process.cwd(), 'campaigns.db'), autoload: true });

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed Data (Admin & Dummy Orders)
  userDB.findOne({ username: 'admin' }, (err, doc) => {
    if (!doc) {
      userDB.insert({
        username: 'admin',
        password: '123',
        name: 'Quản trị viên',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      });
    }
  });

  orderDB.count({}, (err, count) => {
    if (count === 0) {
      const dummyOrders = [
        {
          orderId: "ORD-001",
          customerName: "Nguyễn Văn A",
          customerPhone: "0901234567",
          customer: { name: "Nguyễn Văn A", phone: "0901234567", address: "123 Đường Lê Lợi, Quận 1, TP.HCM" },
          products: [{ id: "p1", name: "Sản phẩm thử nghiệm A", quantity: 2, price: 150000 }],
          total: 300000,
          paymentMethod: "COD",
          shippingUnit: "GHN",
          status: "Chờ xác nhận",
          paymentStatus: "Chưa thanh toán",
          createdAt: new Date().toISOString()
        },
        {
          orderId: "ORD-002",
          customerName: "Trần Thị B",
          customerPhone: "0912345678",
          customer: { name: "Trần Thị B", phone: "0912345678", address: "456 Đường Nguyễn Huệ, Quận Hải Châu, Đà Nẵng" },
          products: [{ id: "p2", name: "Sản phẩm thử nghiệm B", quantity: 1, price: 500000 }],
          total: 500000,
          paymentMethod: "ZaloPay",
          shippingUnit: "GHTK",
          status: "Đang giao",
          paymentStatus: "Đã thanh toán",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      orderDB.insert(dummyOrders);
    }
  });

  // --- API ROUTES ---

  // Health
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Products
  app.get('/api/products', (req, res) => {
    productDB.find({}).sort({ isFeatured: -1, createdAt: -1 }).exec((err, docs) => {
      if (err) return res.status(500).json({ error: err });
      res.json(docs);
    });
  });

  app.post('/api/products', (req, res) => {
    const product = { ...req.body, createdAt: new Date().toISOString() };
    productDB.insert(product, (err, newDoc) => {
      if (err) return res.status(500).json({ error: err });
      res.json(newDoc);
    });
  });

  app.put('/api/products/:id', (req, res) => {
    productDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    });
  });

  app.delete('/api/products/:id', (req, res) => {
    productDB.remove({ _id: req.params.id }, {}, (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    });
  });

  app.patch('/api/products/:id/stock', (req, res) => {
    const { warehouseStock, stock } = req.body;
    productDB.update({ _id: req.params.id }, { $set: { warehouseStock, stock } }, {}, (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    });
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    orderDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
      if (err) return res.status(500).json({ error: err });
      res.json(docs);
    });
  });

  app.post('/api/orders', (req, res) => {
    const { products, totalAmount, discountApplied, voucherCode, orderDate, status, customer } = req.body;
    const orderData = { 
      products, totalAmount, total: totalAmount, discountApplied, voucherCode,
      orderDate: orderDate || new Date().toISOString(),
      status: status === 'pending' ? 'Chờ xác nhận' : (status || 'Chờ xác nhận'),
      customer: customer || { name: 'Khách Zalo', phone: 'N/A', address: 'Zalo Mini App' },
      customerName: (customer?.name) || 'Khách Zalo',
      customerPhone: (customer?.phone) || 'N/A',
      paymentMethod: 'Zalo Pay / COD',
      paymentStatus: 'Chưa thanh toán',
      createdAt: new Date().toISOString() 
    };
    orderDB.insert(orderData, (err, newDoc) => {
      if (err) return res.status(500).json({ error: "Không thể lưu đơn hàng" });
      res.status(201).json({ message: "Chốt đơn thành công!", data: newDoc });
    });
  });

  app.get('/api/orders/:id', (req, res) => {
    orderDB.findOne({ _id: req.params.id }, (err, doc) => {
      if (err || !doc) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.json(doc);
    });
  });

  app.put('/api/orders/:id', (req, res) => {
    orderDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    });
  });

  app.delete('/api/orders/:id', (req, res) => {
    orderDB.remove({ _id: req.params.id }, {}, (err) => {
      if (err) return res.status(500).json({ error: "Lỗi khi xóa đơn hàng" });
      res.json({ success: true });
    });
  });

  // GHN API
  app.post('/api/ghn/create-order', async (req, res) => {
    try {
      const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': GHN_TOKEN, 'ShopId': GHN_SHOP_ID },
        body: JSON.stringify(req.body)
      });
      res.json(await response.json());
    } catch (e) { res.status(500).json({ error: "GHN Error" }); }
  });

  const GHN_STATUS_MAP: Record<string, string> = {
    'ready_to_pick': 'Chờ lấy hàng',
    'picking': 'Đang lấy hàng',
    'cancel': 'Đã hủy',
    'picked': 'Đã lấy hàng',
    'storing': 'Nhập kho',
    'transporting': 'Đang luân chuyển',
    'sorting': 'Đang phân loại',
    'delivering': 'Đang giao hàng',
    'money_collect_delivering': 'Đang thu tiền',
    'delivered': 'Đã giao hàng',
    'delivery_fail': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ xác nhận chuyển hoàn',
    'return': 'Đang chuyển hoàn',
    'return_transporting': 'Đang luân chuyển hoàn',
    'return_sorting': 'Đang phân loại hoàn',
    'returning': 'Đang trả hàng',
    'returned': 'Đã trả hàng'
  };

  app.get('/api/ghn/status/:order_code', async (req, res) => {
    try {
      const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': GHN_TOKEN },
        body: JSON.stringify({ order_code: req.params.order_code })
      });
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const ghnStatus = data.data.status;
        const systemStatus = GHN_STATUS_MAP[ghnStatus] || ghnStatus;
        const trackingUrl = `https://donhang.ghn.vn/?order_code=${req.params.order_code}`;
        
        res.json({
          success: true,
          status: ghnStatus,
          statusName: systemStatus,
          trackingUrl: trackingUrl,
          raw: data.data
        });
      } else {
        res.status(400).json(data);
      }
    } catch (e) { res.status(500).json({ error: "GHN Error" }); }
  });

  // Zalo Phone Decryption
  app.post('/api/zalo/phone', async (req, res) => {
    try {
      const { phoneToken, accessToken } = req.body;
      const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
        headers: { 'access_token': accessToken, 'code': phoneToken, 'secret_key': ZALO_SECRET_KEY }
      });
      res.json(await response.json());
    } catch (e) { res.status(500).json({ error: "Zalo API Error" }); }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    categoryDB.find({}, (err, docs) => res.json(docs));
  });

  // Auth
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    userDB.findOne({ username, password, active: true }, (err, user) => {
      if (err || !user) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
      res.json(user);
    });
  });

  // Vouchers (Ported logic)
  app.get('/api/vouchers', (req, res) => {
    voucherDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => res.json(docs));
  });
  
  app.post('/api/vouchers/validate', (req, res) => {
    const { code, orderTotal } = req.body;
    voucherDB.findOne({ code: code.toUpperCase(), isActive: true }, (err, voucher) => {
      if (err || !voucher) return res.status(400).json({ message: "Mã không tồn tại" });
      if (orderTotal < voucher.minOrderValue) return res.status(400).json({ message: "Đơn hàng chưa đạt giá trị tối thiểu" });
      res.json(voucher);
    });
  });

  // Catch-all API 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.url} not found` });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
