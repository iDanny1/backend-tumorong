import 'dotenv/config';
import express from 'express';
import mongoose, { Schema, Document, Model } from 'mongoose';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import * as xlsx from 'xlsx';

// Configure multer for memory storage (for Excel uploads)
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ========================
// MONGOOSE SCHEMAS & MODELS
// ========================

// Product
interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  images?: string[];
  status?: string;
  stock?: number;
  warehouseStock?: number;
  isFeatured?: boolean;
  active?: boolean;
  categoryId?: string;
  createdAt: string;
}
const productSchema = new Schema<IProduct>({
  name: String,
  price: Number,
  description: String,
  images: [String],
  status: String,
  stock: Number,
  warehouseStock: Number,
  isFeatured: Boolean,
  active: Boolean,
  categoryId: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Product: Model<IProduct> = mongoose.model('Product', productSchema);

// Order
interface IOrder extends Document {
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  customer?: object;
  products?: any[];
  items?: any[];
  total?: number;
  totalAmount?: number;
  shippingFee?: number;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingUnit?: string;
  note?: string;
  invoice?: object;
  status?: string;
  paymentStatus?: string;
  platform?: string;
  address?: string;
  ghnOrderCode?: string;
  createdAt: string;
}
const orderSchema = new Schema<IOrder>({
  orderId: String,
  customerName: String,
  customerPhone: String,
  customer: Schema.Types.Mixed,
  products: [Schema.Types.Mixed],
  items: [Schema.Types.Mixed],
  total: Number,
  totalAmount: Number,
  shippingFee: Number,
  paymentMethod: String,
  shippingMethod: String,
  shippingUnit: String,
  note: String,
  invoice: Schema.Types.Mixed,
  status: String,
  paymentStatus: String,
  platform: String,
  address: String,
  ghnOrderCode: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Order: Model<IOrder> = mongoose.model('Order', orderSchema);

// User
interface IUser extends Document {
  username: string;
  password: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  createdAt: string;
}
const userSchema = new Schema<IUser>({
  username: { type: String, unique: true },
  password: String,
  name: String,
  role: String,
  email: String,
  phone: String,
  active: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const User: Model<IUser> = mongoose.model('User', userSchema);

// Customer
interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  ordersCount?: number;
  totalSpent?: number;
  remainingPoints?: number;
  totalPoints?: number;
  tags?: string[];
  type?: string;
  lastAccess?: string;
  createdAt: string;
}
const customerSchema = new Schema<ICustomer>({
  name: String,
  phone: { type: String, unique: true },
  email: String,
  address: String,
  ordersCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  remainingPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  tags: [String],
  type: { type: String, default: 'retail' }, // retail, wholesale
  lastAccess: { type: String, default: () => new Date().toISOString() },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Customer: Model<ICustomer> = mongoose.model('Customer', customerSchema);

// Category
interface ICategory extends Document {
  name: string;
  icon?: string;
  active?: boolean;
  createdAt: string;
}
const categorySchema = new Schema<ICategory>({
  name: String,
  icon: String,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Category: Model<ICategory> = mongoose.model('Category', categorySchema);

// Warehouse
interface IWarehouse extends Document {
  name: string;
  address?: string;
  phone?: string;
  active?: boolean;
  createdAt: string;
}
const warehouseSchema = new Schema<IWarehouse>({
  name: String,
  address: String,
  phone: String,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Warehouse: Model<IWarehouse> = mongoose.model('Warehouse', warehouseSchema);

// Voucher
interface IVoucher extends Document {
  code: string;
  discount?: number;
  discountType?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  isActive?: boolean;
  expiresAt?: string;
  usageLimit?: number;
  usedCount?: number;
  createdAt: string;
}
const voucherSchema = new Schema<IVoucher>({
  code: { type: String, unique: true },
  discount: Number,
  discountType: String,
  minOrderValue: Number,
  maxDiscount: Number,
  isActive: Boolean,
  expiresAt: String,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Voucher: Model<IVoucher> = mongoose.model('Voucher', voucherSchema);

// Article (News)
interface IArticle extends Document {
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  thumbnail?: string;
  category?: string;
  author?: string;
  status?: string;
  views?: number;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
const articleSchema = new Schema<IArticle>({
  title: String,
  slug: String,
  summary: String,
  content: String,
  thumbnail: String,
  category: String,
  author: String,
  status: String,
  views: { type: Number, default: 0 },
  tags: [String],
  publishedAt: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: String
});
const Article: Model<IArticle> = mongoose.model('Article', articleSchema);

// Campaign
interface ICampaign extends Document {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  discount?: number;
  active?: boolean;
  createdAt: string;
}
const campaignSchema = new Schema<ICampaign>({
  name: String,
  description: String,
  startDate: String,
  endDate: String,
  discount: Number,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
const Campaign: Model<ICampaign> = mongoose.model('Campaign', campaignSchema);

// ========================
// SEED FUNCTION
// ========================
async function seedData() {
  try {
    console.log('Checking database status...');

    // Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding categories...');
      await Category.insertMany([
        { name: 'Sâm Ngọc Linh', icon: 'https://img.icons8.com/color/144/natural-food.png', active: true },
        { name: 'Dược Liệu Quý', icon: 'https://img.icons8.com/color/144/pill.png', active: true }
      ]);
    }

    // Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding products...');
      await Product.insertMany([
        {
          name: "Sâm Ngọc Linh Tu Mơ Rông (Loại 1)",
          price: 15000000,
          description: "Sâm Ngọc Linh chuẩn vùng trồng Tu Mơ Rông, Kon Tum.",
          images: ["https://picsum.photos/seed/product1/600/600"],
          status: 'Còn hàng',
          stock: 50,
          isFeatured: true,
          active: true
        }
      ]);
    }

    // Seed Staff/Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default staff accounts...');
      await User.insertMany([
        { username: 'admin', password: 'admin123', name: 'Quản trị viên', role: 'admin', active: true },
        { username: 'kho01', password: '123', name: 'Nhân viên kho 01', role: 'warehouse', active: true },
        { username: 'sale01', password: '123', name: 'Nhân viên bán hàng 01', role: 'sales', active: true }
      ]);
      console.log('Staff accounts seeded.');
    }

    // Seed Articles
    const articleCount = await Article.countDocuments();
    if (articleCount === 0) {
      console.log('Seeding dummy articles...');
      await Article.insertMany([
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
          updatedAt: new Date().toISOString()
        }
      ]);
      console.log('Articles seeded.');
    }

    // Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('Seeding dummy orders...');
      await Order.insertMany([
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
          paymentStatus: "Chưa thanh toán"
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
      ]);
      console.log('Orders seeded.');
    }

    console.log('✅ Database seeding complete.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

// ========================
// SERVER STARTUP
// ========================
async function startServer() {
  const PORT = process.env.PORT || 8080;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tumorong';

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@'));
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }

  // Seed data
  await seedData();

  // Config
  const GHN_TOKEN = process.env.GHN_TOKEN || "c0e79cba-3ef4-11f1-9107-4a16704feeb7";
  const GHN_SHOP_ID = process.env.GHN_SHOP_ID || "5945053";
  const ZALO_SECRET_KEY = process.env.ZALO_SECRET_KEY || "G8yOT6fT2I7xOc6mV4Jw";

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // ========================
  // API ROUTES
  // ========================

  // Health
  app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

  // --- PRODUCTS ---
  app.get('/api/products', async (req, res) => {
    try {
      const docs = await Product.find({}).sort({ isFeatured: -1, createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const product = new Product({ ...req.body, createdAt: new Date().toISOString() });
      const saved = await product.save();
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      await Product.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.patch('/api/products/:id/stock', async (req, res) => {
    try {
      const { warehouseStock, stock } = req.body;
      await Product.findByIdAndUpdate(req.params.id, { $set: { warehouseStock, stock } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- ORDERS ---
  app.get('/api/orders', async (req, res) => {
    try {
      const docs = await Order.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const {
        customerName,
        customerPhone,
        address,
        items,
        totalAmount,
        note,
        shippingMethod,
        shippingFee,
        paymentMethod,
        invoice,
        zaloName,
        zaloPhone,
        zaloTokenName,
        zaloTokenPhone
      } = req.body;

      const orderData = {
        customerName: customerName || zaloName || zaloTokenName || 'Khách Zalo',
        customerPhone: customerPhone || zaloPhone || zaloTokenPhone || 'N/A',
        address: address || 'Zalo Mini App',
        products: items || [],
        totalAmount: Number(totalAmount) || 0,
        total: Number(totalAmount) || 0,
        shippingFee: shippingFee || 0,
        note: note || '',
        shippingMethod: shippingMethod || 'nhanh',
        paymentMethod: paymentMethod || 'cod',
        invoice: invoice || null,
        status: 'Chờ xác nhận',
        paymentStatus: paymentMethod === 'cod' ? 'Chưa thanh toán' : 'Đã thanh toán',
        platform: 'Zalo Mini App',
        createdAt: new Date().toISOString()
      };

      const newOrder = await Order.create(orderData);
      console.log('✅ Đơn hàng Zalo mới:', newOrder._id);

      // --- TỰ ĐỘNG LƯU KHÁCH HÀNG ---
      if (orderData.customerPhone && orderData.customerPhone !== 'N/A') {
        const existingCustomer = await Customer.findOne({ phone: orderData.customerPhone });
        if (existingCustomer) {
          // Cộng dồn
          existingCustomer.ordersCount = (existingCustomer.ordersCount || 0) + 1;
          existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + orderData.totalAmount;
          existingCustomer.lastAccess = new Date().toISOString();
          await existingCustomer.save();
        } else {
          // Tạo mới (không overwrite sau này)
          await Customer.create({
            name: orderData.customerName,
            phone: orderData.customerPhone,
            address: orderData.address,
            ordersCount: 1,
            totalSpent: orderData.totalAmount,
            type: 'retail',
            lastAccess: new Date().toISOString()
          });
        }
      }

      res.status(201).json({ message: "Chốt đơn thành công!", data: newOrder });
    } catch (err) {
      console.error('❌ Lỗi tạo đơn hàng:', err);
      res.status(500).json({ error: "Không thể lưu đơn hàng" });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const doc = await Order.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      await Order.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Lỗi khi xóa đơn hàng" });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', async (req, res) => {
    try {
      const docs = await Category.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải danh mục' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const category = await Category.create({ ...req.body, createdAt: new Date().toISOString() });
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo danh mục' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      await Category.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa danh mục' });
    }
  });

  // --- NEWS / ARTICLES ---
  app.get('/api/news', async (req, res) => {
    try {
      const docs = await Article.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải tin tức' });
    }
  });

  app.post('/api/news', async (req, res) => {
    try {
      const article = await Article.create({ ...req.body, views: 0, createdAt: new Date().toISOString() });
      res.status(201).json(article);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo bài viết' });
    }
  });

  app.put('/api/news/:id', async (req, res) => {
    try {
      await Article.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật bài viết' });
    }
  });

  app.delete('/api/news/:id', async (req, res) => {
    try {
      await Article.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa bài viết' });
    }
  });

  app.patch('/api/news/:slug/view', async (req, res) => {
    try {
      await Article.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tăng lượt xem' });
    }
  });

  // --- STAFF / USERS ---
  app.get('/api/staff', async (req, res) => {
    try {
      const users = await User.find({}).sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      console.error('CRITICAL: Error fetching staff:', err);
      res.status(500).json({ error: 'Lỗi tải danh sách nhân viên' });
    }
  });

  app.post('/api/staff', async (req, res) => {
    try {
      const { username, password, name, role, email, phone, active } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin tài khoản hoặc mật khẩu' });
      }
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }
      const newUser = await User.create({
        username, password, name, role, email, phone,
        active: active !== undefined ? active : true,
        createdAt: new Date().toISOString()
      });
      res.status(201).json(newUser);
    } catch (err) {
      console.error('Error creating staff:', err);
      res.status(500).json({ error: 'Lỗi khi tạo nhân viên' });
    }
  });

  app.put('/api/staff/:id', async (req, res) => {
    try {
      const { password, name, role, email, phone, active } = req.body;
      const updateData: any = { name, role, email, phone, active };
      if (password && password.trim() !== '') {
        updateData.password = password;
      }
      await User.findByIdAndUpdate(req.params.id, { $set: updateData });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
    }
  });

  app.delete('/api/staff/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      if (user.username === 'admin') return res.status(400).json({ error: 'Không thể xóa tài khoản admin hệ thống' });
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
    }
  });

  // --- AUTH ---
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu' });
    }
    try {
      console.log(`[${new Date().toISOString()}] Login attempt: "${username}"`);
      const user = await User.findOne({ username, password, active: true });
      if (!user) {
        console.warn(`Login failed: "${username}"`);
        return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
      }
      console.log(`Login successful: "${username}"`);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cơ sở dữ liệu hệ thống' });
    }
  });

  // --- VOUCHERS ---
  app.get('/api/vouchers', async (req, res) => {
    try {
      const docs = await Voucher.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải voucher' });
    }
  });

  app.post('/api/vouchers', async (req, res) => {
    try {
      const voucher = await Voucher.create({
        ...req.body,
        code: req.body.code.toUpperCase(),
        createdAt: new Date().toISOString()
      });
      res.status(201).json(voucher);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo voucher' });
    }
  });

  app.put('/api/vouchers/:id', async (req, res) => {
    try {
      await Voucher.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật voucher' });
    }
  });

  app.delete('/api/vouchers/:id', async (req, res) => {
    try {
      await Voucher.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa voucher' });
    }
  });

  app.post('/api/vouchers/validate', async (req, res) => {
    try {
      const { code, orderTotal } = req.body;
      const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
      if (!voucher) return res.status(400).json({ message: "Mã không tồn tại hoặc đã hết hạn" });
      if (orderTotal < (voucher.minOrderValue || 0)) return res.status(400).json({ message: "Đơn hàng chưa đạt giá trị tối thiểu" });
      res.json(voucher);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi kiểm tra voucher' });
    }
  });

  // --- WAREHOUSES ---
  app.get('/api/warehouses', async (req, res) => {
    try {
      const docs = await Warehouse.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải kho hàng' });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    try {
      const warehouse = await Warehouse.create({ ...req.body, createdAt: new Date().toISOString() });
      res.status(201).json(warehouse);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo kho hàng' });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    try {
      await Warehouse.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi cập nhật kho hàng' });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    try {
      await Warehouse.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Lỗi xóa kho hàng' });
    }
  });

  // --- CAMPAIGNS ---
  app.get('/api/campaigns', async (req, res) => {
    try {
      const docs = await Campaign.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tải chiến dịch' });
    }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      const campaign = await Campaign.create({ ...req.body, createdAt: new Date().toISOString() });
      res.status(201).json(campaign);
    } catch (err) {
      res.status(500).json({ error: 'Lỗi tạo chiến dịch' });
    }
  });

  // --- GHN SHIPPING ---
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
        res.json({ success: true, status: ghnStatus, statusName: systemStatus, trackingUrl, raw: data.data });
      } else {
        res.status(400).json(data);
      }
    } catch (e) { res.status(500).json({ error: "GHN Error" }); }
  });

  // --- ZALO ---
  app.post('/api/zalo/phone', async (req, res) => {
    try {
      const { phoneToken, accessToken } = req.body;
      const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
        headers: { 'access_token': accessToken, 'code': phoneToken, 'secret_key': ZALO_SECRET_KEY }
      });
      res.json(await response.json());
    } catch (e) { res.status(500).json({ error: "Zalo API Error" }); }
  });

  // --- DOWNLOAD ---
  app.get('/api/download/huong-dan-quan-tri', (req, res) => {
    try {
      const filePath = path.join(__dirname, 'HUONG_DAN_QUAN_TRI.docx');
      res.download(filePath, 'HUONG_DAN_QUAN_TRI.docx');
    } catch (err) {
      res.status(500).json({ error: "Không thể tải file hướng dẫn" });
    }
  });

  app.get('/api/download/bao-cao-he-thong', (req, res) => {
    try {
      const filePath = path.join(__dirname, 'BAO_CAO_HE_THONG.docx');
      res.download(filePath, 'BAO_CAO_HE_THONG.docx');
    } catch (err) {
      res.status(500).json({ error: "Không thể tải file báo cáo" });
    }
  });

  // ========================
  // CUSTOMER APIS
  // ========================
  app.get('/api/customers', async (req, res) => {
    try {
      const docs = await Customer.find({}).sort({ createdAt: -1 });
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const doc = await Customer.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const newCustomer = await Customer.create(req.body);
      res.status(201).json(newCustomer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const deleted = await Customer.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      res.json({ message: "Xóa thành công" });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ========================
  // EXPORT / IMPORT APIS
  // ========================
  
  // CUSTOMERS EXPORT
  app.get('/api/customers/export', async (req, res) => {
    try {
      const customers = await Customer.find({}).lean();
      const ws = xlsx.utils.json_to_sheet(customers.map(c => ({
        ID: c._id.toString(),
        Tên: c.name || '',
        'Số điện thoại': c.phone || '',
        'Địa chỉ': c.address || '',
        'Email': c.email || '',
        'Loại khách': c.type === 'wholesale' ? 'Sỉ' : 'Lẻ',
        'Tổng đơn': c.ordersCount || 0,
        'Tổng chi tiêu': c.totalSpent || 0,
        'Ngày tạo': c.createdAt
      })));
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Khách hàng");
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="customers.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // CUSTOMERS IMPORT
  app.post('/api/customers/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
      const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
      const wsname = wb.SheetNames[0];
      const data: any[] = xlsx.utils.sheet_to_json(wb.Sheets[wsname]);
      let count = 0;
      for (const row of data) {
        if (!row['Số điện thoại']) continue;
        const phone = String(row['Số điện thoại']).replace(/\s/g, '');
        const existing = await Customer.findOne({ phone });
        if (!existing) {
          await Customer.create({
            name: row['Tên'] || 'Khách Mới',
            phone: phone,
            address: row['Địa chỉ'] || '',
            email: row['Email'] || '',
            type: row['Loại khách'] === 'Sỉ' ? 'wholesale' : 'retail',
            ordersCount: Number(row['Tổng đơn']) || 0,
            totalSpent: Number(row['Tổng chi tiêu']) || 0,
          });
          count++;
        }
      }
      res.json({ message: `Nhập thành công ${count} khách hàng mới.` });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PRODUCTS EXPORT
  app.get('/api/products/export', async (req, res) => {
    try {
      const products = await Product.find({}).lean();
      const ws = xlsx.utils.json_to_sheet(products.map(p => ({
        ID: p._id.toString(),
        Tên: p.name || '',
        'Giá': p.price || 0,
        'Mô tả': p.description || '',
        'Tồn kho': p.stock || 0,
        'Trạng thái': p.status || '',
        'Nổi bật': p.isFeatured ? 'Có' : 'Không',
        'Ngày tạo': p.createdAt
      })));
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Sản phẩm");
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PRODUCTS IMPORT
  app.post('/api/products/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Không tìm thấy file" });
      const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
      const wsname = wb.SheetNames[0];
      const data: any[] = xlsx.utils.sheet_to_json(wb.Sheets[wsname]);
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
      res.status(500).json({ error: String(err) });
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
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});