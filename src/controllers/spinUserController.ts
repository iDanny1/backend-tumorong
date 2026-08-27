import { Request, Response } from 'express';
import { SpinUser } from '../models/SpinUser.js';

import { Voucher } from '../models/Voucher.js';

// Helper kiểm tra user test (0974543740 hoặc dev ID)
export function isTestSpinUser(user?: any, zaloId?: string): boolean {
  const testPhones = (process.env.TEST_PHONES || '0974543740').split(',').map(p => p.trim());
  if (user) {
    if (user.isTestUser) return true;
    if (user.phone && testPhones.includes(user.phone)) return true;
  }
  if (zaloId) {
    if (zaloId.startsWith('dev_')) return true;
    for (const p of testPhones) {
      if (zaloId.includes(p)) return true;
    }
  }
  return false;
}

// ================================================
// GET /api/spin/user-info
// Lấy thông tin lượt quay của user (tạo mới nếu chưa tồn tại)
// Header: x-zalo-id: <zaloId>
// ================================================
export async function getSpinInfo(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    if (!zaloId) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header' });
      return;
    }

    // findOneAndUpdate với upsert để tạo user nếu chưa có (atomic)
    let user = await SpinUser.findOneAndUpdate(
      { zaloId },
      { $setOnInsert: { zaloId, spinsLeft: 0, hasClaimedOASpin: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const isTest = isTestSpinUser(user, zaloId);
    if (isTest && user.spinsLeft < 10) {
      user = await SpinUser.findOneAndUpdate(
        { zaloId },
        { $set: { spinsLeft: 999, isTestUser: true } },
        { new: true }
      ) || user;
    }

    const golfCount = await Voucher.countDocuments({ code: { $regex: '^VOUCHER_GOLF' } });
    const outOfGolf = golfCount >= 25;

    res.json({
      success: true,
      data: {
        zaloId: user.zaloId,
        spinsLeft: isTest ? 999 : user.spinsLeft,
        hasClaimedOASpin: user.hasClaimedOASpin,
        outOfGolf: outOfGolf,
        isTestUser: isTest,
      },
    });
  } catch (err: any) {
    console.error('[getSpinInfo]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// ================================================
// POST /api/spin/claim-oa-spin
// Nhận 1 lượt quay từ việc quan tâm OA
// Chống cheat: mỗi zaloId chỉ claim được 1 lần duy nhất
// Header: x-zalo-id: <zaloId>
// ================================================
export async function claimOASpin(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    if (!zaloId) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header' });
      return;
    }

    // Tìm user, upsert nếu chưa có
    let user = await SpinUser.findOne({ zaloId });
    if (!user) {
      user = await SpinUser.create({ zaloId, spinsLeft: 0, hasClaimedOASpin: false });
    }

    // === CHỐNG CHEAT ===
    const isTest = isTestSpinUser(user, zaloId);
    // Nếu đã claim rồi và không phải test → từ chối
    if (user.hasClaimedOASpin && !isTest) {
      res.status(409).json({
        success: false,
        message: 'Bạn đã nhận lượt quay rồi',
        data: {
          spinsLeft: user.spinsLeft,
          hasClaimedOASpin: user.hasClaimedOASpin,
        },
      });
      return;
    }

    // Cộng 1 lượt quay (hoặc 999 lượt cho test) + đánh dấu đã claim (atomic update)
    const updatePayload = isTest
      ? { $set: { spinsLeft: 999, hasClaimedOASpin: true, isTestUser: true } }
      : { $inc: { spinsLeft: 1 }, $set: { hasClaimedOASpin: true } };

    const updated = await SpinUser.findOneAndUpdate(
      { zaloId },
      updatePayload,
      { new: true }
    );

    if (!updated) {
      // Race condition: đã bị claim bởi request khác cùng lúc
      res.status(409).json({
        success: false,
        message: 'Bạn đã nhận lượt quay rồi',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Nhận lượt quay thành công! Hãy thử vận may của bạn 🎰',
      data: {
        spinsLeft: updated.spinsLeft,
        hasClaimedOASpin: updated.hasClaimedOASpin,
      },
    });
  } catch (err: any) {
    console.error('[claimOASpin]', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}
