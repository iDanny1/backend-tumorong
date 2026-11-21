import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import spinRouter from './src/routes/spinRoutes.js';
import advancedVoucherRouter from './src/routes/voucherRoutes.js';
import stockIssueRouter, { StockIssue } from './src/routes/stockIssueRoutes.js';
import quotationRouter from './src/routes/quotationRoutes.js';
import productRouter from './src/routes/productRoutes.js';
import orderRouter from './src/routes/orderRoutes.js';
import categoryRouter from './src/routes/categoryRoutes.js';
import articleRouter from './src/routes/articleRoutes.js';
import staffRouter from './src/routes/staffRoutes.js';
import storeVoucherRouter from './src/routes/storeVoucherRoutes.js';
import warehouseRouter from './src/routes/warehouseRoutes.js';
import campaignRouter from './src/routes/campaignRoutes.js';
import customerRouter from './src/routes/customerRoutes.js';
import spreadsheetRouter from './src/routes/spreadsheetRoutes.js';
import createIntegrationRouter from './src/routes/integrationRoutes.js';
import { Customer, prepareCustomerIndexes } from './src/models/Customer.js';
import { User } from './src/models/User.js';
import { startAppSheetSync, appSheetSyncStatus } from './src/services/appSheetSync.js';
import { seedData, migratePasswords } from './src/services/databaseMaintenance.js';
import { securityConfig } from './src/security/config.js';
import { installAdminSecurity } from './src/security/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('case sensitive routing', true);
app.disable('x-powered-by');

async function startServer() {
  const config = securityConfig();
  if (config.production && !process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình.');
  const PORT = process.env.PORT || 8080;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tumorong';

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    process.exit(1);
  }

  await prepareCustomerIndexes();

  // Seed data
  if (!config.production) await seedData();

  // Development-only legacy migration; production credentials are rotated explicitly.
  if (!config.production) await migratePasswords();

  // Middleware
  // Whitelist domain Zalo Mini App + mọi origin cho API public
  const allowedOrigins = [
    'https://h5.zdn.vn',
    'https://zaui.zdn.vn',
    'https://miniapp.tumorong.com',
    /\.zdn\.vn$/,
    /\.zalo\.me$/
  ];
  app.use(cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      callback(null, isAllowed || config.origins.has(origin) ? origin : false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'access_token', 'x-zalo-id', 'X-CSRF-Token'],
    credentials: true
  }));
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const defaultJson = express.json({ limit: '256kb' });
  app.use((req, res, next) => {
    // Long per-product image links are parsed on the quotation route after staff authentication.
    if (req.method === 'POST' && /^\/api\/quotations\/?$/.test(req.path)) return next();
    defaultJson(req, res, next);
  });
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  installAdminSecurity(app, User, config);
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

  app.use('/api/spin', spinRouter);
  app.use('/api/vouchers-v2', advancedVoucherRouter);
  app.use('/api/stock-issues', stockIssueRouter);
  app.use('/api/quotations', express.json({ limit: '3mb' }), quotationRouter);

  // Register spreadsheet endpoints before customer /:id routes.
  app.use(spreadsheetRouter);
  app.use('/api/products', productRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/news', articleRouter);
  app.use('/api', staffRouter);
  app.use('/api/vouchers', storeVoucherRouter);
  app.use('/api/warehouses', warehouseRouter);
  app.use('/api/campaigns', campaignRouter);
  app.use(createIntegrationRouter(__dirname));
  app.use('/api/customers', customerRouter);

  app.get('/api/integrations/appsheet/status', (_req, res) => res.json(appSheetSyncStatus()));

  startAppSheetSync(Customer, StockIssue);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API không tồn tại.' });
  });

  // --- VITE MIDDLEWARE ---
  // Kiểm tra folder dist tồn tại để phân biệt production/dev
  // (tránh trang trắng khi NODE_ENV=development nhưng đã deploy)
  const distPath = path.join(__dirname, 'dist');
  const fs = await import('fs');
  const isBuilt = fs.existsSync(path.join(distPath, 'index.html'));

  if (isBuilt) {
    // Production: serve static files từ dist/
    console.log('📦 Serving production build from dist/');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development: dùng Vite Dev Server
    if (config.production) throw new Error('Thiếu bản build giao diện production.');
    console.log('⚡ Starting Vite dev server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = error?.code === 'LIMIT_FILE_SIZE' || error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError || error instanceof multer.MulterError ? 400 : 500;
    res.status(status).json({ message: status === 413 ? 'Dữ liệu vượt giới hạn cho phép.' : 'Không thể xử lý yêu cầu.' });
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(() => {
  console.error('Không khởi động được: kiểm tra cấu hình và kết nối trong môi trường vận hành.');
  process.exit(1);
});
