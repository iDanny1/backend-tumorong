import { Request, Response } from 'express';
import { AdvancedVoucher, IAdvancedVoucher } from '../models/AdvancedVoucher.js';
import { UserVoucherUsage } from '../models/UserVoucherUsage.js';

// ─────────────────────────────────────────────────────────
// HELPER: Format tiền VNĐ
// ─────────────────────────────────────────────────────────
function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ─────────────────────────────────────────────────────────
// HELPER: Tính số tiền giảm thực tế
// ─────────────────────────────────────────────────────────
function calcDiscount(voucher: IAdvancedVoucher, cartAmount: number): number {
  let discount = 0;

  if (voucher.discountType === 'PERCENTAGE') {
    discount = Math.floor((cartAmount * voucher.discountValue) / 100);
    // Áp dụng trần giảm giá nếu có
    if (voucher.maxDiscountAmount > 0) {
      discount = Math.min(discount, voucher.maxDiscountAmount);
    }
  } else {
    // FIXED_AMOUNT: không giảm nhiều hơn tổng đơn
    discount = Math.min(voucher.discountValue, cartAmount);
  }

  return discount;
}

// ─────────────────────────────────────────────────────────
// HELPER: Kiểm tra voucher còn hiệu lực
// ─────────────────────────────────────────────────────────
function isVoucherValid(v: IAdvancedVoucher): boolean {
  const now = new Date();
  return (
    v.isActive &&
    now >= new Date(v.startDate) &&
    now <= new Date(v.endDate)
  );
}

// ─────────────────────────────────────────────────────────
// HELPER: Còn lượt dùng toàn hệ thống
// ─────────────────────────────────────────────────────────
function hasGlobalUsage(v: IAdvancedVoucher): boolean {
  if (v.usageLimit === 0) return true;        // 0 = không giới hạn
  return v.usedCount < v.usageLimit;
}

// ─────────────────────────────────────────────────────────
// Sanitize: loại bỏ field nhạy cảm trước khi trả về client
// (loại bỏ usedCount raw, visibility, v.v. với PUBLIC list)
// ─────────────────────────────────────────────────────────
function sanitizeForPublic(v: IAdvancedVoucher) {
  return {
    _id:              v._id,
    code:             v.code,
    description:      v.description,
    discountType:     v.discountType,
    discountValue:    v.discountValue,
    maxDiscountAmount:v.maxDiscountAmount,
    minOrderValue:    v.minOrderValue,
    userLimit:        v.userLimit,
    startDate:        v.startDate,
    endDate:          v.endDate,
    // Còn lượt dùng (boolean, không expose số tuyệt đối)
    hasStock:         hasGlobalUsage(v),
  };
}

// =====================================================
// GET /api/vouchers/public
// Trả về danh sách mã PUBLIC còn hiệu lực
// KHÔNG BAO GIỜ trả về mã SECRET
// =====================================================
export async function getPublicVouchers(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();

    // Query chặt chẽ: CHỈ PUBLIC, isActive, còn hạn, còn lượt
    const vouchers = await AdvancedVoucher.find({
      visibility: 'PUBLIC',          // ← Hard-filter, không bao giờ trả SECRET
      isActive: true,
      startDate: { $lte: now },
      endDate:   { $gte: now },
      $or: [
        { usageLimit: 0 },                                // không giới hạn
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }, // còn lượt
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: vouchers.map(v => sanitizeForPublic(v as any)),
    });
  } catch (err: any) {
    console.error('[getPublicVouchers]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// =====================================================
// POST /api/vouchers/apply
// Body: { code, cartAmount, userId }
// Kiểm tra toàn bộ điều kiện và tính discountAmount
// KHÔNG tăng usedCount ở đây — chỉ tăng khi đặt hàng thành công
// =====================================================
export async function applyVoucher(req: Request, res: Response): Promise<void> {
  try {
    const {
      code: rawCode,
      cartAmount: rawCart,
      userId,
    } = req.body as { code?: string; cartAmount?: number; userId?: string };

    // ── Input validation ──
    if (!rawCode?.trim()) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
      return;
    }
    if (!userId?.trim()) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin người dùng' });
      return;
    }
    const cartAmount = Number(rawCart) || 0;
    if (cartAmount <= 0) {
      res.status(400).json({ success: false, message: 'Giỏ hàng trống hoặc không hợp lệ' });
      return;
    }

    const code = rawCode.trim().toUpperCase();

    // ══════════════════════════════════════════════
    // BƯỚC 1: Tìm voucher (tìm cả PUBLIC lẫn SECRET)
    // ══════════════════════════════════════════════
    const voucher = await AdvancedVoucher.findOne({ code });
    if (!voucher) {
      res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
      return;
    }

    // ══════════════════════════════════════════════
    // BƯỚC 2: Kiểm tra isActive & thời gian hiệu lực
    // ══════════════════════════════════════════════
    if (!isVoucherValid(voucher)) {
      const now = new Date();
      if (!voucher.isActive) {
        res.status(400).json({ success: false, message: 'Mã giảm giá đã bị vô hiệu hóa' });
      } else if (now < new Date(voucher.startDate)) {
        res.status(400).json({
          success: false,
          message: `Mã chưa có hiệu lực. Áp dụng từ ${new Date(voucher.startDate).toLocaleDateString('vi-VN')}`,
        });
      } else {
        res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn sử dụng' });
      }
      return;
    }

    // ══════════════════════════════════════════════
    // BƯỚC 3: Kiểm tra giá trị đơn tối thiểu
    // ══════════════════════════════════════════════
    if (voucher.minOrderValue > 0 && cartAmount < voucher.minOrderValue) {
      res.status(400).json({
        success: false,
        message: `Đơn hàng cần tối thiểu ${formatVND(voucher.minOrderValue)} để dùng mã này`,
        data: { minOrderValue: voucher.minOrderValue },
      });
      return;
    }

    // ══════════════════════════════════════════════
    // BƯỚC 4: Kiểm tra tổng lượt dùng toàn hệ thống
    // ══════════════════════════════════════════════
    if (!hasGlobalUsage(voucher)) {
      res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
      return;
    }

    // ══════════════════════════════════════════════
    // BƯỚC 5: Kiểm tra userLimit — số lần user này đã dùng
    // ══════════════════════════════════════════════
    if (voucher.userLimit > 0) {
      const usage = await UserVoucherUsage.findOne({
        userId: userId.trim(),
        voucherCode: code,
      });
      const userUsedCount = usage?.usedCount ?? 0;

      if (userUsedCount >= voucher.userLimit) {
        res.status(400).json({
          success: false,
          message:
            voucher.userLimit === 1
              ? 'Bạn đã sử dụng mã này rồi'
              : `Bạn đã hết lượt sử dụng mã này (tối đa ${voucher.userLimit} lần)`,
          data: { userUsedCount, userLimit: voucher.userLimit },
        });
        return;
      }
    }

    // ══════════════════════════════════════════════
    // Tất cả hợp lệ → Tính số tiền giảm
    // ══════════════════════════════════════════════
    const discountAmount = calcDiscount(voucher, cartAmount);
    const finalAmount    = Math.max(0, cartAmount - discountAmount);

    res.json({
      success: true,
      message: `Áp dụng mã thành công! Bạn được giảm ${formatVND(discountAmount)} 🎉`,
      data: {
        voucher: {
          code:             voucher.code,
          description:      voucher.description,
          discountType:     voucher.discountType,
          discountValue:    voucher.discountValue,
          maxDiscountAmount:voucher.maxDiscountAmount,
          minOrderValue:    voucher.minOrderValue,
          endDate:          voucher.endDate,
        },
        cartAmount,
        discountAmount,
        finalAmount,
        discountLabel:
          voucher.discountType === 'PERCENTAGE'
            ? `Giảm ${voucher.discountValue}%` + (voucher.maxDiscountAmount > 0 ? ` (tối đa ${formatVND(voucher.maxDiscountAmount)})` : '')
            : `Giảm ${formatVND(voucher.discountValue)}`,
      },
    });
  } catch (err: any) {
    console.error('[applyVoucher]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// =====================================================
// POST /api/vouchers/confirm-usage
// Gọi sau khi đặt hàng thành công để tăng usedCount
// Body: { code, userId }
// =====================================================
export async function confirmVoucherUsage(req: Request, res: Response): Promise<void> {
  try {
    const { code: rawCode, userId } = req.body as { code?: string; userId?: string };
    if (!rawCode?.trim() || !userId?.trim()) {
      res.status(400).json({ success: false, message: 'Thiếu code hoặc userId' });
      return;
    }
    const code = rawCode.trim().toUpperCase();

    // Atomic: tăng usedCount toàn hệ thống
    await AdvancedVoucher.findOneAndUpdate(
      { code },
      { $inc: { usedCount: 1 } }
    );

    // Upsert: tăng usedCount của user này
    await UserVoucherUsage.findOneAndUpdate(
      { userId: userId.trim(), voucherCode: code },
      {
        $inc: { usedCount: 1 },
        $set: { lastUsedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Ghi nhận sử dụng voucher thành công' });
  } catch (err: any) {
    console.error('[confirmVoucherUsage]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// =====================================================
// GET /api/vouchers/admin/list  (Admin — xem tất cả)
// Query: ?visibility=PUBLIC|SECRET&page=1&limit=20
// =====================================================
export async function adminListVouchers(req: Request, res: Response): Promise<void> {
  try {
    const { visibility, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (visibility === 'PUBLIC' || visibility === 'SECRET') filter.visibility = visibility;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AdvancedVoucher.countDocuments(filter);
    const docs  = await AdvancedVoucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err: any) {
    console.error('[adminListVouchers]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// =====================================================
// POST /api/vouchers/admin/create  (Admin — tạo mới)
// =====================================================
export async function adminCreateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const voucher = await AdvancedVoucher.create({
      ...req.body,
      code: String(req.body.code ?? '').trim().toUpperCase(),
      usedCount: 0,
    });
    res.status(201).json({ success: true, data: voucher });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: 'Mã voucher đã tồn tại' });
    } else {
      console.error('[adminCreateVoucher]', err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

// =====================================================
// PUT /api/vouchers/admin/:id  (Admin — cập nhật)
// =====================================================
export async function adminUpdateVoucher(req: Request, res: Response): Promise<void> {
  try {
    const updated = await AdvancedVoucher.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[adminUpdateVoucher]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// =====================================================
// DELETE /api/vouchers/admin/:id  (Admin — xóa)
// =====================================================
export async function adminDeleteVoucher(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await AdvancedVoucher.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
      return;
    }
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err: any) {
    console.error('[adminDeleteVoucher]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}
