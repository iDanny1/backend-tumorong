import { Request, Response } from 'express';
import crypto from 'crypto';
import { SpinUser } from '../models/SpinUser.js';
import { Voucher } from '../models/Voucher.js';

// ================================================
// Danh sách phần thưởng trên vòng quay (8 ô)
// prizeIndex tương ứng với vị trí ô trên Frontend
// ================================================
const PRIZES = [
  { prizeIndex: 0, label: 'Voucher 10%',  discountAmount: 10  },
  { prizeIndex: 1, label: 'Voucher 20%',  discountAmount: 20  },
  { prizeIndex: 2, label: 'Voucher 15%',  discountAmount: 15  },
  { prizeIndex: 3, label: 'Voucher 50%',  discountAmount: 50  },
  { prizeIndex: 4, label: 'Voucher 5%',   discountAmount: 5   },
  { prizeIndex: 5, label: 'Voucher 30%',  discountAmount: 30  },
  { prizeIndex: 6, label: 'Voucher 25%',  discountAmount: 25  },
  { prizeIndex: 7, label: 'Voucher 100%', discountAmount: 100 },
];

// Tỉ lệ trúng (weights, tổng = 100)
const WEIGHTS = [30, 20, 20, 2, 10, 8, 7, 3];

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
// Thực hiện quay — Backend random, trừ lượt, tạo Voucher
// Header: x-zalo-id: <zaloId>
// ================================================
export async function doSpin(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    if (!zaloId) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header' });
      return;
    }

    // Atomic: trừ 1 spinsLeft chỉ khi spinsLeft > 0
    const user = await SpinUser.findOneAndUpdate(
      { zaloId, spinsLeft: { $gt: 0 } },
      { $inc: { spinsLeft: -1 } },
      { new: true }
    );

    if (!user) {
      // User không tồn tại hoặc hết lượt
      const existing = await SpinUser.findOne({ zaloId });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
      } else {
        res.status(403).json({
          success: false,
          message: 'Bạn đã sử dụng hết lượt quay tân thủ',
          data: { spinsLeft: 0, hasClaimedOASpin: existing.hasClaimedOASpin },
        });
      }
      return;
    }

    // Random phần thưởng trên Backend (100% trúng Voucher)
    const prize = pickPrize();
    const code  = generateVoucherCode(zaloId);

    // Lưu Voucher vào database
    const voucher = await Voucher.create({
      code,
      discountAmount: prize.discountAmount,
      userId: zaloId,
      isUsed: false,
    });

    res.json({
      success: true,
      message: `Chúc mừng! Bạn trúng ${prize.label} 🎉`,
      data: {
        prizeIndex:     prize.prizeIndex,
        prizeLabel:     prize.label,
        discountAmount: prize.discountAmount,
        voucher: {
          id:             voucher._id,
          code:           voucher.code,
          discountAmount: voucher.discountAmount,
          isUsed:         voucher.isUsed,
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
