import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SpinUser, ISpinUser } from '../models/SpinUser.js';
import { Voucher } from '../models/Voucher.js';
import { getCustomerTotalSpent, isTestSpinUser, normalizePhone, PRODUCT_PRIZE_MIN_SPENT } from '../services/spinPlayer.js';

// Helper lấy Customer model an toàn
function getCustomerModel() {
  if (mongoose.models.Customer) return mongoose.models.Customer;
  const customerSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true },
    email: String,
    address: String,
    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    remainingPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    tags: [String],
    type: { type: String, default: 'retail' },
    lastAccess: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() },
  });
  return mongoose.model('Customer', customerSchema);
}

// ================================================
// GET /api/spin/user-info
// Lấy trạng thái hiện tại của người chơi
// ================================================

export async function getSpinInfo(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    const queryPhone = normalizePhone(req.query.phone as string);

    if (!zaloId && !queryPhone) {
      res.status(400).json({ success: false, message: 'Thiếu x-zalo-id header hoặc phone' });
      return;
    }

    let user: ISpinUser | null = null;
    if (queryPhone) {
      user = await SpinUser.findOne({ phone: queryPhone });
    }
    if (!user && zaloId) {
      user = await SpinUser.findOne({ zaloId });
    }

    const isTest = isTestSpinUser(user, queryPhone || zaloId);

    const golfCount = await Voucher.countDocuments({ code: { $regex: '^VOUCHER_GOLF' } });
    const outOfGolf = golfCount >= 25;

    // Kiểm tra điều kiện nhận quà vật phẩm
    const phone = user?.phone || queryPhone || '';
    const totalSpent = (!isTest && phone) ? await getCustomerTotalSpent(phone) : 0;
    const isEligibleForProduct = isTest || totalSpent >= PRODUCT_PRIZE_MIN_SPENT;

    if (!user) {
      res.json({
        success: true,
        data: {
          registered: false,
          zaloId: zaloId || '',
          phone: '',
          name: '',
          quizStatus: 'none',
          spinsLeft: 0,
          hasSpun: false,
          outOfGolf,
          isTestUser: isTest,
          isEligibleForProduct,
          totalSpent: 0,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        registered: Boolean(user.phone),
        zaloId: user.zaloId,
        phone: user.phone || '',
        name: user.name || '',
        quizStatus: user.quizStatus || 'none',
        spinsLeft: isTest ? 999 : user.spinsLeft,
        hasSpun: Boolean(user.hasSpun),
        voucherCode: user.voucherCode || '',
        prizeLabel: user.prizeLabel || '',
        prizeIndex: user.prizeIndex ?? -1,
        outOfGolf,
        isTestUser: isTest,
        isEligibleForProduct,
        totalSpent,
      },
    });
  } catch (err: any) {
    console.error('[getSpinInfo]');
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// ================================================
// POST /api/spin/register-participant
// Bước 1: Thu thập / Xác thực Họ tên & Số điện thoại
// ================================================
export async function registerParticipant(req: Request, res: Response): Promise<void> {
  try {
    const { zaloId: rawZaloId, name: rawName, phone: rawPhone, phoneToken, accessToken } = req.body;
    const zaloId = (rawZaloId || (req.headers['x-zalo-id'] as string) || '').trim();

    let phone = rawPhone ? normalizePhone(rawPhone) : '';

    // Nếu có token từ Zalo SDK -> giải mã lấy SĐT
    if (!phone && phoneToken && accessToken && process.env.ZALO_SECRET_KEY) {
      try {
        const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
          headers: {
            'access_token': accessToken,
            'code': phoneToken,
            'secret_key': process.env.ZALO_SECRET_KEY,
          },
        });
        const data: any = await response.json();
        if (data?.data?.number) {
          phone = normalizePhone(data.data.number);
        }
      } catch (tokenErr) {
        console.warn('[registerParticipant] Lỗi giải mã Zalo token:');
      }
    }

    if (!phone || phone.length < 9) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại hợp lệ (từ 10 chữ số)',
      });
      return;
    }

    const customerName = (rawName || 'Khách Vòng Quay').trim();
    const isTest = isTestSpinUser(undefined, phone);

    // 1. Lưu hoặc cập nhật thông tin trong bảng Customer của Admin
    const CustomerModel: any = getCustomerModel();
    let customer = await CustomerModel.findOne({ phone });
    if (customer) {
      if (rawName && (customer.name === 'Khách Vòng Quay' || !customer.name)) {
        customer.name = customerName;
      }
      if (!customer.tags) customer.tags = [];
      if (!customer.tags.includes('Vòng quay may mắn')) {
        customer.tags.push('Vòng quay may mắn');
      }
      customer.lastAccess = new Date().toISOString();
      await customer.save();
    } else {
      await CustomerModel.create({
        name: customerName,
        phone,
        address: '',
        type: 'retail',
        tags: ['Vòng quay may mắn'],
        lastAccess: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Kiểm tra xem Số điện thoại này đã từng tham gia minigame chưa
    let existingSpinUser = await SpinUser.findOne({ phone });

    // Nếu đã tham gia và không phải test -> Trả về kết quả hiện tại
    if (existingSpinUser && !isTest) {
      if (zaloId && existingSpinUser.zaloId !== zaloId) {
        existingSpinUser.zaloId = zaloId;
        if (rawName) existingSpinUser.name = customerName;
        await existingSpinUser.save();
      }

      res.json({
        success: true,
        message: 'Thông tin đã được ghi nhận!',
        data: {
          registered: true,
          zaloId: existingSpinUser.zaloId,
          phone: existingSpinUser.phone,
          name: existingSpinUser.name,
          quizStatus: existingSpinUser.quizStatus || 'pending',
          spinsLeft: existingSpinUser.spinsLeft,
          hasSpun: Boolean(existingSpinUser.hasSpun),
          voucherCode: existingSpinUser.voucherCode || '',
          prizeLabel: existingSpinUser.prizeLabel || '',
          prizeIndex: existingSpinUser.prizeIndex ?? -1,
          isTestUser: false,
        },
      });
      return;
    }

    // 3. Tạo mới hoặc cập nhật SpinUser
    const effectiveZaloId = zaloId || `spin_${phone}_${Date.now()}`;
    let spinUser = await SpinUser.findOne({ phone });
    if (!spinUser && zaloId) {
      spinUser = await SpinUser.findOne({ zaloId });
    }

    if (!spinUser) {
      spinUser = await SpinUser.create({
        phone,
        name: customerName,
        zaloId: effectiveZaloId,
        quizStatus: isTest ? 'passed' : 'pending',
        spinsLeft: isTest ? 999 : 0,
        hasSpun: false,
        isTestUser: isTest,
      });
    } else {
      spinUser.phone = phone;
      spinUser.name = customerName;
      spinUser.zaloId = effectiveZaloId;
      spinUser.isTestUser = isTest;
      if (isTest) {
        spinUser.spinsLeft = 999;
        spinUser.quizStatus = 'passed';
      }
      await spinUser.save();
    }

    res.json({
      success: true,
      message: 'Đăng ký thành công! Hãy tham gia câu hỏi Lịch sử để nhận lượt quay 🎁',
      data: {
        registered: true,
        zaloId: spinUser.zaloId,
        phone: spinUser.phone,
        name: spinUser.name,
        quizStatus: spinUser.quizStatus || 'pending',
        spinsLeft: isTest ? 999 : spinUser.spinsLeft,
        hasSpun: Boolean(spinUser.hasSpun),
        isTestUser: isTest,
      },
    });
  } catch (err: any) {
    console.error('[registerParticipant]');
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký người chơi' });
  }
}

// Endpoint cũ hướng người chơi sang đăng ký và trả lời câu hỏi lịch sử.
export async function claimOASpin(req: Request, res: Response): Promise<void> {
  res.status(410).json({ success: false, message: 'Vui lòng tham gia thử thách câu hỏi Lịch sử để nhận lượt quay' });
}
