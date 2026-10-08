import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import session, { type Store } from 'express-session';
import MongoStore from 'connect-mongo';
import type { SecurityConfig } from './config.js';

declare module 'express-session' {
  interface SessionData { userId?: string; fingerprint?: string; issuedAt?: number; csrf?: string }
}
declare global {
  namespace Express { interface Request { adminUser?: any } }
}

export const staffProfile = (user: any) => ({
  _id: String(user._id), username: user.username, name: user.name || '', role: user.role,
  email: user.email || '', phone: user.phone || '', active: user.active, createdAt: user.createdAt,
});
const fingerprint = (user: any) => createHash('sha256')
  .update(JSON.stringify([String(user._id), user.password, user.role, user.active])).digest('hex');
const equals = (left: unknown, right: string) => {
  if (typeof left !== 'string') return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const everybody = ['admin', 'sales', 'warehouse'];

// Explicit public contracts. Unknown routes are never implicitly public.
export function routeRoles(method: string, path: string): string[] | 'public' | null {
  path = path.replace(/\/+$/, '') || '/';
  if (['/api/health', '/api/auth/csrf', '/api/login', '/api/auth/logout'].includes(path)) return 'public';
  if (path === '/api/auth/me') return everybody;
  if (['GET', 'HEAD'].includes(method) && ['/api/products', '/api/categories', '/api/news', '/api/vouchers-v2/public'].includes(path)) return 'public';
  if (method === 'POST' && ['/api/orders', '/api/vouchers/validate', '/api/vouchers-v2/apply', '/api/zalo/phone', '/api/zalo-webhook'].includes(path)) return 'public';
  // Buyer authentication requires the companion Mini App release; these existing
  // contracts remain separately classified and are not treated as admin routes.
  if (/^\/api\/spin\/(user-info|register-participant|register-customer|get-quiz|submit-quiz|do-spin|my-vouchers|claim-oa-spin)$/.test(path)) return 'public';
  if (method === 'PATCH' && /^\/api\/news\/[^/]+\/view$/.test(path)) return 'public';
  if (/^\/api\/staff(?:\/[^/]+)?$/.test(path) || /^\/api\/spin\/admin\//.test(path)) return ['admin'];
  if (['/api/customers/export', '/api/customers/import', '/api/orders/import', '/api/products/import', '/api/products/export'].includes(path)) return ['admin'];
  if (/^\/api\/customers(?:\/[^/]+)?$/.test(path)) return safeMethods.has(method) || method === 'PUT' ? everybody : ['admin', 'sales'];
  if (/^\/api\/orders(?:\/[^/]+)?$/.test(path)) return ['admin', 'sales'];
  if (/^\/api\/products(?:\/[^/]+)?$/.test(path)) return ['admin', 'sales'];
  if (method === 'PATCH' && /^\/api\/products\/[^/]+\/stock$/.test(path)) return ['admin', 'warehouse'];
  if (/^\/api\/(categories|news|campaigns)(?:\/[^/]+)?$/.test(path)) return ['admin', 'sales'];
  if (/^\/api\/warehouses(?:\/[^/]+)?$/.test(path)) return safeMethods.has(method) ? everybody : ['admin', 'warehouse'];
  if (/^\/api\/stock-issues(?:\/[^/]+)?$/.test(path)) return everybody;
  if (/^\/api\/vouchers(?:\/[^/]+)?$/.test(path) || /^\/api\/vouchers-v2\/admin\//.test(path)) return ['admin', 'sales'];
  if (/^\/api\/ghn\//.test(path)) return ['admin', 'sales'];
  if (/^\/api\/download\//.test(path) || path === '/api/integrations/appsheet/status') return everybody;
  return null;
}

export function installAdminSecurity(app: Express, User: any, config: SecurityConfig, store?: Store) {
  app.set('trust proxy', config.proxyHops);
  const cookie = { httpOnly: true, secure: config.production, sameSite: 'lax' as const, path: '/', maxAge: config.idleMs };
  app.use(session({ name: config.cookieName, secret: config.secret, resave: false,
    saveUninitialized: false, rolling: true, cookie,
    store: store || MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/tumorong', collectionName: 'admin_sessions' }) }));

  app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      if (req.session.userId) {
        const user = await User.findById(req.session.userId).select('+password');
        if (!user || !user.active || !everybody.includes(user.role) ||
            !req.session.issuedAt || Date.now() - req.session.issuedAt >= config.absoluteMs ||
            !equals(req.session.fingerprint, fingerprint(user))) {
          await new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
          res.clearCookie(config.cookieName, { ...cookie, maxAge: undefined });
          return res.status(401).json({ message: 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.' });
        }
        req.adminUser = user;
      }
      const path = `${req.baseUrl}${req.path}`.replace(/\/+$/, '');
      const roles = routeRoles(req.method, path);
      if (roles === null) return res.status(404).json({ message: 'API không tồn tại.' });
      if (roles !== 'public') {
        if (!req.adminUser) return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
        if (!roles.includes(req.adminUser.role)) return res.status(403).json({ message: 'Tài khoản chưa được cấp quyền thao tác này.' });
      }
      const adminWrite = !safeMethods.has(req.method) &&
        (roles !== 'public' || req.adminUser || path === '/api/login' || path === '/api/auth/logout');
      if (adminWrite) {
        if (!config.origins.has(req.get('origin') || '') || !req.session.csrf ||
            !equals(req.get('x-csrf-token'), req.session.csrf)) {
          return res.status(403).json({ message: 'Yêu cầu xác thực không hợp lệ. Vui lòng tải lại trang.' });
        }
      }
      next();
    } catch { res.status(503).json({ message: 'Chưa xác minh được phiên đăng nhập. Vui lòng thử lại.' }); }
  });

  app.get('/api/auth/csrf', (req, res) => {
    req.session.csrf ||= randomBytes(32).toString('hex');
    res.json({ csrfToken: req.session.csrf });
  });
  app.get('/api/auth/me', (req, res) => res.json(staffProfile(req.adminUser)));
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(error => {
      if (error) return res.status(503).json({ message: 'Chưa đăng xuất được. Vui lòng thử lại.' });
      res.clearCookie(config.cookieName, { ...cookie, maxAge: undefined });
      res.json({ success: true });
    });
  });
}

export async function signInAdmin(req: Request, user: any) {
  await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  req.session.userId = String(user._id);
  req.session.fingerprint = fingerprint(user);
  req.session.issuedAt = Date.now();
  req.session.csrf = randomBytes(32).toString('hex');
  await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
}
