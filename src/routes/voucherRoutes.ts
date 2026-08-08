import { Router } from 'express';
import {
  getPublicVouchers,
  applyVoucher,
  confirmVoucherUsage,
  adminListVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
} from '../controllers/voucherController.js';

const advancedVoucherRouter = Router();

// ─────────────────────────────────────
// PUBLIC ENDPOINTS (Mini App gọi)
// ─────────────────────────────────────

// GET  /api/vouchers-v2/public          — Danh sách mã PUBLIC
advancedVoucherRouter.get('/public', getPublicVouchers);

// POST /api/vouchers-v2/apply           — Kiểm tra & áp dụng mã
advancedVoucherRouter.post('/apply', applyVoucher);

// POST /api/vouchers-v2/confirm-usage   — Ghi nhận dùng sau khi đặt hàng
advancedVoucherRouter.post('/confirm-usage', confirmVoucherUsage);

// ─────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────

// GET    /api/vouchers-v2/admin/list
advancedVoucherRouter.get('/admin/list', adminListVouchers);

// POST   /api/vouchers-v2/admin/create
advancedVoucherRouter.post('/admin/create', adminCreateVoucher);

// PUT    /api/vouchers-v2/admin/:id
advancedVoucherRouter.put('/admin/:id', adminUpdateVoucher);

// DELETE /api/vouchers-v2/admin/:id
advancedVoucherRouter.delete('/admin/:id', adminDeleteVoucher);

export default advancedVoucherRouter;
