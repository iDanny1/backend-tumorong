import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { SpinUser } from '../models/SpinUser.js';
import { Voucher } from '../models/Voucher.js';
import { AdvancedVoucher } from '../models/AdvancedVoucher.js';
import { isTestSpinUser, normalizePhone } from './spinUserController.js';

// ================================================
// Danh sách phần thưởng trên vòng quay (6 ô)
// ================================================
export const PRIZES = [
  { prizeIndex: 0, label: 'Voucher 50K (Đơn từ 100K)', type: 'VOUCHER_50K', isProduct: false, discountValue: 50000, minOrderValue: 100000 },
  { prizeIndex: 1, label: '1 Hộp Cà Phê Sâm Ngọc Linh',       type: 'PRODUCT_CF',   isProduct: true,  discountValue: 0, minOrderValue: 0 },
  { prizeIndex: 2, label: '1 Hộp Trà Ô Long Sâm Ngọc Linh',   type: 'PRODUCT_TEA',  isProduct: true,  discountValue: 0, minOrderValue: 0 },
  { prizeIndex: 3, label: 'Voucher Golf Tân Sơn Nhất',          type: 'VOUCHER_GOLF', isProduct: false, discountValue: 0, minOrderValue: 0 },
  { prizeIndex: 4, label: '1 Chai Dầu Gió Nhân Sâm',           type: 'PRODUCT_OIL',  isProduct: true,  discountValue: 0, minOrderValue: 0 },
  { prizeIndex: 5, label: '1 Chai Nước Hồng Đẳng Sâm',         type: 'PRODUCT_HDS',  isProduct: true,  discountValue: 0, minOrderValue: 0 },
];

// Ngưỡng tổng chi tiêu tối thiểu để được NHẬN quà vật phẩm (sau khi đã quay trúng)
const PRODUCT_PRIZE_MIN_SPENT = 200_000;

// Tỉ lệ trúng thưởng (%) — áp dụng như nhau cho mọi người
//  [Voucher50K | CF | Tea | Golf | Dầu Gió | HĐS]
const WEIGHTS = [50, 10, 10, 5, 15, 10];

/**
 * Chọn giải thưởng ngẫu nhiên theo trọng số — giống nhau cho mọi user
 */
function pickPrize(): typeof PRIZES[number] {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return PRIZES[i];
  }
  return PRIZES[WEIGHTS.findIndex(w => w > 0)] ?? PRIZES[0];
}

/**
 * Lấy tổng chi tiêu của user từ collection Customer theo số điện thoại
 */
async function getCustomerTotalSpent(phone: string): Promise<number> {
  try {
    const CustomerModel = mongoose.models['Customer']
      ?? mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const customer = await (CustomerModel as any).findOne({ phone }).select('totalSpent').lean();
    return Number((customer as any)?.totalSpent ?? 0);
  } catch {
    return 0;
  }
}

function generateVoucherCode(prefix: string = 'LUCKY'): string {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-3);
  return `${prefix}-${ts}-${rand}`;
}

// ================================================
// POST /api/spin/do-spin
// ================================================
export async function doSpin(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.body?.zaloId || (req.headers['x-zalo-id'] as string) || '').trim();
    const queryPhone = req.body?.phone ? normalizePhone(req.body.phone) : '';

    if (!zaloId && !queryPhone) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin người chơi (x-zalo-id hoặc phone)' });
      return;
    }

    let user = await SpinUser.findOne({ $or: [{ phone: queryPhone || '___' }, { zaloId: zaloId || '___' }] });
    const isTest = isTestSpinUser(user, queryPhone || zaloId);

    if (isTest) {
      if (!user) {
        user = await SpinUser.create({
          zaloId: zaloId || `test_${Date.now()}`,
          phone: queryPhone || '0974543740',
          name: 'Khách Test Vòng Quay',
          spinsLeft: 999,
          quizStatus: 'passed',
          isTestUser: true,
        });
      } else {
        user.spinsLeft = 999;
        user.quizStatus = 'passed';
        user.isTestUser = true;
        await user.save();
      }
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'Tài khoản chưa đăng ký tham gia' });
      return;
    }

    // Kiểm tra lượt quay và điều kiện câu hỏi lịch sử
    if (!isTest) {
      if (user.quizStatus !== 'passed') {
        res.status(403).json({
          success: false,
          message: 'Bạn chưa hoàn thành câu hỏi Lịch sử để nhận lượt quay',
          data: { quizStatus: user.quizStatus, spinsLeft: user.spinsLeft },
        });
        return;
      }

      if (user.spinsLeft <= 0 || user.hasSpun) {
        res.status(403).json({
          success: false,
          message: 'Bạn đã sử dụng hết lượt quay may mắn',
          data: {
            spinsLeft: 0,
            hasSpun: true,
            voucherCode: user.voucherCode,
            prizeLabel: user.prizeLabel,
            prizeIndex: user.prizeIndex,
          },
        });
        return;
      }
    }

    // ── Kiểm tra điều kiện nhận quà vật phẩm ──────────────────────────────
    // Test user luôn được nhận full pool để kiểm tra giao diện
    let isEligibleForProduct = isTest;
    if (!isTest && user.phone) {
      const totalSpent = await getCustomerTotalSpent(user.phone);
      isEligibleForProduct = totalSpent >= PRODUCT_PRIZE_MIN_SPENT;
    }

    // Trừ lượt quay ngay lập tức (Atomic update)
    if (!isTest) {
      user.spinsLeft = Math.max(0, user.spinsLeft - 1);
    }

    // Chọn giải thưởng — pool giống nhau cho mọi người
    let prize = pickPrize();

    // Giới hạn giải Golf Tân Sơn Nhất tối đa 25 suất
    if (prize.type === 'VOUCHER_GOLF') {
      const golfCount = await Voucher.countDocuments({ code: { $regex: '^VOUCHER_GOLF' } });
      if (golfCount >= 25) {
        prize = PRIZES[0]; // Chuyển sang Voucher 50K
      }
    }

    const code = generateVoucherCode(prize.type === 'VOUCHER_GOLF' ? 'GOLF' : 'LUCKY');
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    let voucherId = '';

    // ========================================================
    // TẠO VOUCHER ĐỒNG BỘ VÀO CẢ AdvancedVoucher LẪN Voucher
    // Để khách dùng được ngay lập tức tại Giỏ hàng hoặc Quầy
    // ========================================================
    try {
      // 1. Tạo trong AdvancedVoucher (Dùng cho Giỏ hàng Mini App)
      const adv = await AdvancedVoucher.create({
        code,
        description: `🎰 Vòng Quay May Mắn — ${prize.label} (hạn 30 ngày)`,
        visibility: 'SECRET',
        discountType: 'FIXED_AMOUNT',
        discountValue: prize.discountValue,
        maxDiscountAmount: 0,
        minOrderValue: prize.minOrderValue,
        usageLimit: 1,
        usedCount: 0,
        userLimit: 1,
        startDate: now,
        endDate: expiry,
        isActive: true,
      });
      voucherId = adv._id.toString();
    } catch (advErr) {
      console.warn('[doSpin] AdvancedVoucher create notice:', advErr);
    }

    try {
      // 2. Tạo trong Voucher (Legacy fallback & đồng bộ lịch sử)
      const legacy = await Voucher.create({
        code,
        discountAmount: prize.discountValue || 0,
        userId: user.zaloId || user.phone || 'spin_user',
        isUsed: false,
      });
      if (!voucherId && legacy) voucherId = (legacy as any)._id?.toString() || '';
    } catch (legErr) {
      console.warn('[doSpin] Voucher create notice:', legErr);
    }

    // Cập nhật kết quả vào SpinUser
    user.hasSpun = true;
    user.voucherCode = code;
    user.prizeLabel = prize.label;
    user.prizeIndex = prize.prizeIndex;
    await user.save();

    res.json({
      success: true,
      message: `🎉 Chúc mừng bạn đã trúng ${prize.label}!`,
      data: {
        prizeIndex: prize.prizeIndex,
        prizeLabel: prize.label,
        prizeType: prize.type,
        isProduct: prize.isProduct,
        isEligibleForProduct,
        voucher: {
          id: voucherId,
          code: code,
          discountAmount: prize.discountValue,
          minOrderValue: prize.minOrderValue,
          description: prize.label,
          isUsed: false,
        },
        spinsLeft: isTest ? 999 : user.spinsLeft,
        isTestUser: isTest,
      },
    });
  } catch (err: any) {
    console.error('[doSpin]', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi thực hiện quay' });
  }
}

// ================================================
// GET /api/spin/my-vouchers
// Lấy danh sách voucher trúng thưởng của user
// ================================================
export async function getMyVouchers(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    const queryPhone = req.query.phone ? normalizePhone(req.query.phone as string) : '';

    if (!zaloId && !queryPhone) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header hoặc phone' });
      return;
    }

    const vouchers = await Voucher.find({
      $or: [
        ...(zaloId ? [{ userId: zaloId }] : []),
        ...(queryPhone ? [{ userId: queryPhone }] : []),
        { code: { $regex: '^LUCKY' } },
        { code: { $regex: '^GOLF' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: vouchers });
  } catch (err: any) {
    console.error('[getMyVouchers]', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách voucher' });
  }
}
