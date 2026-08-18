import { Request, Response } from 'express';
import crypto from 'crypto';
import { SpinUser } from '../models/SpinUser.js';
import { Voucher } from '../models/Voucher.js';
import { AdvancedVoucher } from '../models/AdvancedVoucher.js';

// ================================================
// Danh sách phần thưởng trên vòng quay (6 ô)
// ================================================
const PRIZES = [
  { prizeIndex: 0, label: 'Voucher 50K (Đơn từ 200K)', type: 'VOUCHER_50K', discountValue: 50000, minOrderValue: 200000 },
  { prizeIndex: 1, label: '1 Hộp Cà Phê Sâm Ngọc Linh 8 gói', type: 'PRODUCT_CF' },
  { prizeIndex: 2, label: '1 Hộp Trà Ô Long Sâm Ngọc Linh 10 gói', type: 'PRODUCT_TEA' },
  { prizeIndex: 3, label: '1 Chai Hồng Đẳng Sâm Ngọc Linh', type: 'PRODUCT_HDS' },
  { prizeIndex: 4, label: 'Dầu Gió Nhân Sâm', type: 'PRODUCT_OIL' },
  { prizeIndex: 5, label: 'Voucher Golf Tân Sơn Nhất', type: 'VOUCHER_GOLF' },
];

// Tỉ lệ trúng (weights)
const WEIGHTS = [30, 20, 20, 10, 10, 10];

function pickPrize(): typeof PRIZES[number] {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return PRIZES[i];
  }
  return PRIZES[0];
}

function generateVoucherCode(zaloId: string): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  const ts   = Date.now().toString(36).toUpperCase().slice(-4);
  return `LUCKY-${ts}-${rand}`;
}

// ================================================
// POST /api/spin/do-spin
// ================================================
export async function doSpin(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    if (!zaloId) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header' });
      return;
    }

    const user = await SpinUser.findOneAndUpdate(
      { zaloId, spinsLeft: { $gt: 0 } },
      { $inc: { spinsLeft: -1 } },
      { new: true }
    );

    if (!user) {
      const existing = await SpinUser.findOne({ zaloId });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
      } else {
        res.status(403).json({
          success: false,
          message: 'Bạn đã sử dụng hết lượt quay ',
          data: { spinsLeft: 0, hasClaimedOASpin: existing.hasClaimedOASpin },
        });
      }
      return;
    }

    const prize = pickPrize();
    const code  = generateVoucherCode(zaloId);
    let voucherId = '';

    const now = new Date();
    
    // Xử lý tạo voucher hoặc record dựa trên loại phần thưởng
    if (prize.type === 'VOUCHER_50K') {
      const legacyVoucher = await Voucher.create({
        code,
        discountAmount: prize.discountValue,
        userId: zaloId,
        isUsed: false,
      });
      voucherId = legacyVoucher._id.toString();

      const expiry = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 ngày
      await AdvancedVoucher.create({
        code,
        description: `🎰 Vòng Quay May Mắn — ${prize.label} (hạn 3 ngày, dùng tại quầy hoặc Zalo Mini App)`,
        visibility: 'SECRET',
        discountType: 'FIXED',
        discountValue: prize.discountValue,
        maxDiscountAmount: 0,
        minOrderValue: prize.minOrderValue,
        usageLimit: 1,
        usedCount: 0,
        userLimit: 1,
        startDate: now,
        endDate: expiry,
        isActive: true,
      }).catch(err => console.error(err));
    } else {
      // Cho các phần thưởng hiện vật hoặc Voucher Golf
      // Lưu vào Voucher collection để hiển thị danh sách, nhưng set discount=0
      const prizeRecord = await Voucher.create({
        code: `${prize.type}-${code}`,
        discountAmount: 0,
        userId: zaloId,
        isUsed: false,
      });
      voucherId = prizeRecord._id.toString();
      
      // Tạo một document đặc biệt lưu thêm thông tin nếu là Golf hoặc hiện vật (dùng model mongoose native object)
      if (prize.type === 'VOUCHER_GOLF') {
        console.log(`[GOLF_VOUCHER] Đặc biệt: Người dùng ${zaloId} trúng Voucher Golf. Lưu log vào backend.`);
        // Note: Could insert into a SpecialPrize collection here.
      }
    }

    res.json({
      success: true,
      message: `Chúc mừng! Bạn trúng ${prize.label} 🎉`,
      data: {
        prizeIndex: prize.prizeIndex,
        prizeLabel: prize.label,
        prizeType: prize.type,
        voucher: {
          id: voucherId,
          code: code,
          discountAmount: prize.discountValue || 0,
          isUsed: false,
        },
        spinsLeft: user.spinsLeft,
      },
    });
  } catch (err: any) {
    console.error('[doSpin]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// ================================================
// GET /api/spin/my-vouchers
// Lấy danh sách voucher của user
// Header: x-zalo-id: <zaloId>
// ================================================
export async function getMyVouchers(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    if (!zaloId) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header' });
      return;
    }

    const vouchers = await Voucher.find({ userId: zaloId }).sort({ createdAt: -1 });
    res.json({ success: true, data: vouchers });
  } catch (err: any) {
    console.error('[getMyVouchers]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}
