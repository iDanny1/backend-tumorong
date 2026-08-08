import { Request, Response } from 'express';
import { SpinUser } from '../models/SpinUser.js';

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
    const user = await SpinUser.findOneAndUpdate(
      { zaloId },
      { $setOnInsert: { zaloId, spinsLeft: 0, hasClaimedOASpin: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      data: {
        zaloId: user.zaloId,
        spinsLeft: user.spinsLeft,
        hasClaimedOASpin: user.hasClaimedOASpin,
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
    // Nếu đã claim rồi → từ chối, bất kể họ có unfollow/follow lại
    if (user.hasClaimedOASpin) {
      res.status(409).json({
        success: false,
        message: 'Bạn đã nhận lượt quay tân thủ rồi',
        data: {
          spinsLeft: user.spinsLeft,
          hasClaimedOASpin: user.hasClaimedOASpin,
        },
      });
      return;
    }

    // Cộng 1 lượt quay + đánh dấu đã claim (atomic update)
    const updated = await SpinUser.findOneAndUpdate(
      { zaloId, hasClaimedOASpin: false }, // điều kiện double-check để tránh race condition
      { $inc: { spinsLeft: 1 }, $set: { hasClaimedOASpin: true } },
      { new: true }
    );

    if (!updated) {
      // Race condition: đã bị claim bởi request khác cùng lúc
      res.status(409).json({
        success: false,
        message: 'Bạn đã nhận lượt quay tân thủ rồi',
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
