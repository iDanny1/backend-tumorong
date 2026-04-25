import express from 'express';
import Datastore from '@seald-io/nedb';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
app.use(cors()); 
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cấu hình Giao Hàng Nhanh (GHN)
  const GHN_TOKEN = process.env.GHN_TOKEN || "c0e79cba-3ef4-11f1-9107-4a16704feeb7";
  const GHN_SHOP_ID = process.env.GHN_SHOP_ID || "5945053";
  const ZALO_SECRET_KEY = process.env.ZALO_SECRET_KEY || "G8yOT6fT2I7xOc6mV4Jw";

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
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed Data (Admin & Dummy Orders & News)
  try {
    console.log('Initializing user database...');
    const adminUser = await new Promise((resolve, reject) => {
      userDB.findOne({ username: 'admin' }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    
    if (!adminUser) {
      console.log('Seeding admin user...');
      await new Promise((resolve, reject) => {
        userDB.insert({
          username: 'admin',
          password: '123',
          name: 'Quản trị viên',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      console.log('Admin user seeded.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error during user database initialization:', err);
  }

  try {
    const articleCount: any = await new Promise((resolve, reject) => {
      articleDB.count({}, (err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });

    if (articleCount === 0) {
      console.log('Seeding dummy articles...');
      const dummyArticles = [
        {
          title: "Sâm Ngọc Linh - Báu vật của đại ngàn",
          slug: "sam-ngoc-linh-bau-vat-cua-dai-ngan",
          summary: "Tìm hiểu về nguồn gốc và giá trị quý giá của Sâm Ngọc Linh đối với sức khỏe con người.",
          content: "<h3>Sâm Ngọc Linh là gì?</h3><p>Sâm Ngọc Linh là loại sâm quý nhất thế giới, được tìm thấy tại vùng núi Ngọc Linh thuộc tỉnh Kon Tum và Quảng Nam...</p>",
          thumbnail: "https://picsum.photos/seed/sam1/800/500",
          category: "Kiến thức",
          author: "Quản trị viên",
          status: "published",
          views: 125,
          tags: ["Sâm Ngọc Linh", "Sức khỏe"],
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Hướng dẫn phân biệt sâm Ngọc Linh thật giả",
          slug: "huong-dan-phan-biet-sam-ngoc-linh-that-gia",
          summary: "Cách nhận biết sâm Ngọc Linh chuẩn vùng trồng Tu Mơ Rông để không mua nhầm hàng kém chất lượng.",
          content: "<h3>Đặc điểm nhận dạng</h3><p>Sâm Ngọc Linh thật có những đặc điểm về đốt sâm, mùi vị và màu sắc rất đặc trưng...</p>",
          thumbnail: "https://picsum.photos/seed/sam2/800/500",
          category: "Kiến thức",
          author: "Quản trị viên",
          status: "published",
          views: 89,
          tags: ["Phân biệt thật giả", "Mua sắm"],
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      await new Promise((resolve, reject) => {
        articleDB.insert(dummyArticles, (err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      console.log('Dummy articles seeded.');
    }
  } catch (err) {
    console.error('Error during article seeding:', err);
  }

  try {
    const orderCount: any = await new Promise((resolve, reject) => {
      orderDB.count({}, (err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });
    
    if (orderCount === 0) {
      console.log('Seeding dummy orders...');
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
      await new Promise((resolve, reject) => {
        orderDB.insert(dummyOrders, (err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      console.log('Dummy orders seeded.');
    }
  } catch (err) {
    console.error('Error during order database initialization:', err);
  }

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

  app.post('/api/products', async (req, res) => {
    try {
      const product = { ...req.body, createdAt: new Date().toISOString() };
      const newDoc = await new Promise((resolve, reject) => {
        productDB.insert(product, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.json(newDoc);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        productDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        productDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.patch('/api/products/:id/stock', async (req, res) => {
    try {
      const { warehouseStock, stock } = req.body;
      await new Promise((resolve, reject) => {
        productDB.update({ _id: req.params.id }, { $set: { warehouseStock, stock } }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        orderDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
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
      
      const newDoc = await new Promise((resolve, reject) => {
        orderDB.insert(orderData, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json({ message: "Chốt đơn thành công!", data: newDoc });
    } catch (err) {
      res.status(500).json({ error: "Không thể lưu đơn hàng" });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const doc = await new Promise((resolve, reject) => {
        orderDB.findOne({ _id: req.params.id }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      if (!doc) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        orderDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        orderDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Lỗi khi xóa đơn hàng" });
    }
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
  app.get('/api/categories', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        categoryDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải danh mục' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const category = { ...req.body, createdAt: new Date().toISOString() };
      const newDoc = await new Promise((resolve, reject) => {
        categoryDB.insert(category, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo danh mục' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        categoryDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        categoryDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa danh mục' });
    }
  });

  // News / Articles
  app.get('/api/news', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        articleDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải tin tức' });
    }
  });

  app.post('/api/news', async (req, res) => {
    try {
      const article = { 
        ...req.body, 
        views: 0,
        createdAt: new Date().toISOString() 
      };
      const newDoc = await new Promise((resolve, reject) => {
        articleDB.insert(article, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo bài viết' });
    }
  });

  app.put('/api/news/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        articleDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật bài viết' });
    }
  });

  app.delete('/api/news/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        articleDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa bài viết' });
    }
  });

  app.patch('/api/news/:slug/view', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        articleDB.update({ slug: req.params.slug }, { $inc: { views: 1 } }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tăng lượt xem' });
    }
  });

  // Staff / Users Management
  app.get('/api/staff', async (req, res) => {
    try {
      console.log('GET /api/staff - Fetching all users');
      const users = await new Promise((resolve, reject) => {
        userDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(users);
    } catch (err) {
      console.error('CRITICAL: Error fetching staff:', err);
      res.status(500).json({ error: 'Lỗi tải danh sách nhân viên', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/staff', async (req, res) => {
    try {
      console.log('POST /api/staff - Creating new user:', req.body.username);
      const { username, password, name, role, email, phone, active } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin tài khoản hoặc mật khẩu' });
      }

      // Kiểm tra trùng username
      const existing = await new Promise((resolve, reject) => {
        userDB.findOne({ username }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });

      if (existing) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }

      const newUser = {
        username,
        password,
        name,
        role,
        email,
        phone,
        active: active !== undefined ? active : true,
        createdAt: new Date().toISOString()
      };

      const result = await new Promise((resolve, reject) => {
        userDB.insert(newUser, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });

      console.log('User created successfully:', username);
      res.status(201).json(result);
    } catch (err) {
      console.error('Error creating staff:', err);
      res.status(500).json({ error: 'Lỗi khi tạo nhân viên' });
    }
  });

  app.put('/api/staff/:id', async (req, res) => {
    try {
      console.log('PUT /api/staff/:id - Updating user:', req.params.id);
      const { password, name, role, email, phone, active } = req.body;
      const updateData: any = { name, role, email, phone, active };
      
      // Chỉ cập nhật mật khẩu nếu được cung cấp
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      const numUpdated = await new Promise((resolve, reject) => {
        userDB.update({ _id: req.params.id }, { $set: updateData }, {}, (err, num) => {
          if (err) reject(err);
          else resolve(num);
        });
      });

      console.log(`Updated ${numUpdated} user(s)`);
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating staff:', err);
      res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
    }
  });

  app.delete('/api/staff/:id', async (req, res) => {
    try {
      console.log('DELETE /api/staff/:id - Deleting user:', req.params.id);
      const user: any = await new Promise((resolve, reject) => {
        userDB.findOne({ _id: req.params.id }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });

      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
      if (user.username === 'admin') {
        return res.status(400).json({ error: 'Không thể xóa tài khoản admin hệ thống' });
      }

      await new Promise((resolve, reject) => {
        userDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      console.log('User deleted successfully');
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting staff:', err);
      res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
    }
  });

  // Auth
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    try {
      console.log(`[${new Date().toISOString()}] Login attempt for username: "${username}"`);
      
      const user = await new Promise((resolve, reject) => {
        userDB.findOne({ username, password, active: true }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      
      if (!user) {
        console.warn(`[${new Date().toISOString()}] Login failed: Invalid credentials for "${username}"`);
        return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
      }
      
      console.log(`[${new Date().toISOString()}] Login successful for: "${username}"`);
      res.json(user);
    } catch (err) {
      console.error('Database error during login:', err);
      res.status(500).json({ error: 'Lỗi cơ sở dữ liệu hệ thống' });
    }
  });

  // Vouchers
  app.get('/api/vouchers', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        voucherDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải voucher' });
    }
  });
  
  app.post('/api/vouchers', async (req, res) => {
    try {
      const voucher = { ...req.body, code: req.body.code.toUpperCase(), createdAt: new Date().toISOString() };
      const newDoc = await new Promise((resolve, reject) => {
        voucherDB.insert(voucher, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo voucher' });
    }
  });

  app.put('/api/vouchers/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        voucherDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật voucher' });
    }
  });

  app.delete('/api/vouchers/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        voucherDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa voucher' });
    }
  });

  app.post('/api/vouchers/validate', async (req, res) => {
    try {
      const { code, orderTotal } = req.body;
      const voucher: any = await new Promise((resolve, reject) => {
        voucherDB.findOne({ code: code.toUpperCase(), isActive: true }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });

      if (!voucher) return res.status(400).json({ message: "Mã không tồn tại hoặc đã hết hạn" });
      if (orderTotal < voucher.minOrderValue) return res.status(400).json({ message: "Đơn hàng chưa đạt giá trị tối thiểu" });
      res.json(voucher);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi kiểm tra voucher' });
    }
  });

  // Warehouses
  app.get('/api/warehouses', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        warehouseDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải kho hàng' });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    try {
      const warehouse = { ...req.body, createdAt: new Date().toISOString() };
      const newDoc = await new Promise((resolve, reject) => {
        warehouseDB.insert(warehouse, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo kho hàng' });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        warehouseDB.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật kho hàng' });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    try {
      await new Promise((resolve, reject) => {
        warehouseDB.remove({ _id: req.params.id }, {}, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa kho hàng' });
    }
  });

  // Campaigns
  app.get('/api/campaigns', async (req, res) => {
    try {
      const docs = await new Promise((resolve, reject) => {
        campaignDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
      });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải chiến dịch' });
    }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      const campaign = { ...req.body, createdAt: new Date().toISOString() };
      const newDoc = await new Promise((resolve, reject) => {
        campaignDB.insert(campaign, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      res.status(201).json(newDoc);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo chiến dịch' });
    }
  });

  // --- GHN SHIPPING APIS ---
  app.post('/api/ghn/create-order', async (req, res) => {
    try {
      const ghnToken = process.env.GHN_TOKEN || 'c0e79cba-3ef4-11f1-9107-4a16704feeb7';
      const shopId = process.env.GHN_SHOP_ID || '5945053';

      const response = await fetch('https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': ghnToken,
          'ShopId': shopId
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/ghn/status/:order_code', async (req, res) => {
    try {
      const ghnToken = process.env.GHN_TOKEN || 'c0e79cba-3ef4-11f1-9107-4a16704feeb7';
      const { order_code } = req.params;

      const response = await fetch('https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': ghnToken
        },
        body: JSON.stringify({ order_code })
      });

      const data = await response.json();
      if (data.code === 200) {
        res.json({ success: true, status: data.data.status, statusName: data.data.status });
      } else {
        res.status(400).json({ success: false, message: data.message });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
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

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
