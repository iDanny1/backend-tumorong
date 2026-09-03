import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SpinUser, ISpinUser } from '../models/SpinUser.js';
import { Voucher } from '../models/Voucher.js';
import { HISTORY_QUESTIONS } from '../data/historyQuestions.js';

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

// Helper chuẩn hóa số điện thoại VN (84xxx -> 0xxx)
export function normalizePhone(rawPhone: string): string {
  let p = String(rawPhone || '').trim().replace(/[^0-9+]/g, '');
  if (p.startsWith('+84')) {
    p = '0' + p.slice(3);
  } else if (p.startsWith('84') && p.length > 9) {
    p = '0' + p.slice(2);
  }
  return p.replace(/[^0-9]/g, '');
}

// Helper kiểm tra user test
export function isTestSpinUser(user?: any, phoneOrZaloId?: string): boolean {
  const testPhones = (process.env.TEST_PHONES || '0974543740').split(',').map(p => p.trim());
  if (user?.phone && testPhones.includes(user.phone)) return true;
  if (phoneOrZaloId && testPhones.includes(phoneOrZaloId)) return true;
  return false;
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
      },
    });
  } catch (err: any) {
    console.error('[getSpinInfo]', err);
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
        console.warn('[registerParticipant] Lỗi giải mã Zalo token:', tokenErr);
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
    console.error('[registerParticipant]', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký người chơi' });
  }
}

// ================================================
// GET /api/spin/get-quiz
// Bước 2: Lấy 1 câu hỏi Lịch sử ngẫu nhiên
// ================================================
export async function getQuiz(req: Request, res: Response): Promise<void> {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim();
    const queryPhone = normalizePhone(req.query.phone as string);

    // Chọn ngẫu nhiên 1 câu hỏi từ ngân hàng
    const randomIndex = Math.floor(Math.random() * HISTORY_QUESTIONS.length);
    const q = HISTORY_QUESTIONS[randomIndex];

    // Lưu quizQuestionId vào SpinUser nếu tìm thấy user
    if (queryPhone || zaloId) {
      await SpinUser.findOneAndUpdate(
        { $or: [{ phone: queryPhone }, { zaloId }] },
        { $set: { quizQuestionId: q.id } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        questionId: q.id,
        question: q.question,
        options: q.options,
      },
    });
  } catch (err: any) {
    console.error('[getQuiz]', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi' });
  }
}

// ================================================
// POST /api/spin/submit-quiz
// Bước 2: Nộp câu trả lời trắc nghiệm Lịch sử
// ================================================
export async function submitQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { questionId, answerKey, phone: rawPhone, zaloId: rawZaloId } = req.body;
    const zaloId = (rawZaloId || (req.headers['x-zalo-id'] as string) || '').trim();
    const phone = rawPhone ? normalizePhone(rawPhone) : '';

    if (!questionId || !answerKey) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin câu hỏi hoặc đáp án' });
      return;
    }

    let user = await SpinUser.findOne({ $or: [{ phone: phone || '___' }, { zaloId: zaloId || '___' }] });
    const isTest = isTestSpinUser(user, phone || zaloId);

    if (!user && !isTest) {
      res.status(404).json({ success: false, message: 'Vui lòng xác thực thông tin trước khi trả lời' });
      return;
    }

    // Chống cheat: Nếu đã từng trả lời rồi (passed hoặc failed) và không phải test -> Từ chối
    if (user && !isTest && user.quizStatus !== 'pending' && user.quizStatus !== 'none') {
      res.status(403).json({
        success: false,
        message:
          user.quizStatus === 'passed'
            ? 'Bạn đã hoàn thành câu hỏi và nhận lượt quay rồi!'
            : 'Bạn đã trả lời câu hỏi trước đó rồi.',
        data: {
          quizStatus: user.quizStatus,
          spinsLeft: user.spinsLeft,
          hasSpun: user.hasSpun,
        },
      });
      return;
    }

    const question = HISTORY_QUESTIONS.find(item => item.id === questionId);
    if (!question) {
      res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi tương ứng' });
      return;
    }

    const isCorrect = String(answerKey).trim().toUpperCase() === question.correctKey.toUpperCase();

    if (isCorrect) {
      // Trả lời ĐÚNG -> Cấp 1 lượt quay (hoặc 999 cho test)
      if (user) {
        user.quizStatus = 'passed';
        user.spinsLeft = isTest ? 999 : 1;
        user.quizAnsweredAt = new Date();
        await user.save();
      }

      res.json({
        success: true,
        data: {
          isCorrect: true,
          message: '🎉 Xuất sắc! Câu trả lời hoàn toàn chính xác. Bạn được tặng 1 lượt quay may mắn!',
          explanation: question.explanation,
          spinsLeft: isTest ? 999 : 1,
          quizStatus: 'passed',
        },
      });
    } else {
      // Trả lời SAI -> Ghi nhận thất bại, không có lượt quay
      if (user && !isTest) {
        user.quizStatus = 'failed';
        user.spinsLeft = 0;
        user.quizAnsweredAt = new Date();
        await user.save();
      }

      res.json({
        success: true,
        data: {
          isCorrect: false,
          message: '❌ Rất tiếc! Câu trả lời chưa chính xác. Bạn chưa đủ điều kiện nhận lượt quay.',
          correctAnswerKey: question.correctKey,
          correctAnswerText: question.options.find(o => o.key === question.correctKey)?.text || '',
          explanation: question.explanation,
          spinsLeft: 0,
          quizStatus: 'failed',
        },
      });
    }
  } catch (err: any) {
    console.error('[submitQuiz]', err);
    res.status(500).json({ success: false, message: 'Lỗi chấm điểm câu hỏi' });
  }
}

// Bỏ hàm claimOASpin cũ để tránh hack lượt, thay bằng registerParticipant + submitQuiz
export async function claimOASpin(req: Request, res: Response): Promise<void> {
  res.status(410).json({ success: false, message: 'Vui lòng tham gia thử thách câu hỏi Lịch sử để nhận lượt quay' });
}
