// backend/src/controllers/quizController.ts
import { Request, Response } from 'express';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { UserQuizLog } from '../models/UserQuizLog.js';
import { SpinUser } from '../models/SpinUser.js';
import { isTestSpinUser, normalizePhone } from './spinUserController.js';

// Helper tính toán ngày hôm nay theo múi giờ Việt Nam (UTC+7)
function getTodayInfo() {
  const now = new Date();
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = utc7.getDate(); // 1-31
  // Chu kỳ 30 ngày (ngày 31 sẽ dùng lại câu số 30 hoặc câu 31 nếu có cấu hình)
  const dayNumber = ((day - 1) % 30) + 1;
  const dateStr = utc7.toISOString().split('T')[0]; // YYYY-MM-DD
  return { dayNumber, dateStr };
}

/** GET /api/spin/get-quiz */
export async function getDailyQuiz(req: Request, res: Response) {
  try {
    const zaloId = (req.headers['x-zalo-id'] as string)?.trim() || (req.query.zaloId as string)?.trim();
    const phone = req.query.phone ? normalizePhone(req.query.phone as string) : '';

    const { dayNumber, dateStr } = getTodayInfo();
    let question = await QuizQuestion.findOne({ day: dayNumber }).lean();
    if (!question) {
      question = await QuizQuestion.findOne({ day: 1 }).lean();
    }
    if (!question) {
      return res.status(404).json({ success: false, message: 'Chưa có câu hỏi cho ngày hôm nay' });
    }

    // Nếu có định danh user, tìm log trả lời trong ngày
    let previousAnswer: string | undefined = undefined;
    let answeredCorrectly: boolean | undefined = undefined;

    const userKey = zaloId || phone;
    if (userKey) {
      const log = await UserQuizLog.findOne({ zaloId: userKey, date: dateStr }).lean();
      if (log) {
        previousAnswer = log.answerKey;
        answeredCorrectly = log.isCorrect;
      }
    }

    return res.json({
      success: true,
      data: {
        questionId: question.questionId,
        question: question.question,
        options: question.options,
        day: question.day,
        previousAnswer,
        answeredCorrectly,
      },
    });
  } catch (err: any) {
    console.error('[getDailyQuiz] error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tải câu hỏi hôm nay' });
  }
}

/** POST /api/spin/submit-quiz */
export async function submitQuiz(req: Request, res: Response) {
  try {
    const { questionId, answerKey, phone: rawPhone, zaloId: rawZaloId } = req.body;
    const zaloId = (rawZaloId || (req.headers['x-zalo-id'] as string) || '').trim();
    const phone = rawPhone ? normalizePhone(rawPhone) : '';

    if (!questionId || !answerKey) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin câu hỏi hoặc câu trả lời' });
    }

    let user = await SpinUser.findOne({ $or: [{ phone: phone || '___' }, { zaloId: zaloId || '___' }] });
    const isTest = isTestSpinUser(user, phone || zaloId);

    const question = await QuizQuestion.findOne({ questionId }).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi tương ứng' });
    }

    const { dayNumber, dateStr } = getTodayInfo();
    const isCorrect = String(answerKey).trim().toUpperCase() === question.correctKey.toUpperCase();

    // Ghi nhận log câu trả lời cho user hôm nay
    const userKey = zaloId || phone || 'anonymous';
    await UserQuizLog.updateOne(
      { zaloId: userKey, date: dateStr },
      {
        questionDay: question.day || dayNumber,
        questionId: question.questionId,
        answerKey: String(answerKey).trim().toUpperCase(),
        isCorrect,
      },
      { upsert: true }
    );

    // Cập nhật SpinUser
    if (user) {
      if (isTest) {
        user.spinsLeft = 999;
        user.quizStatus = 'passed';
      } else if (isCorrect) {
        user.spinsLeft = 1;
        user.quizStatus = 'passed';
      } else {
        user.spinsLeft = 0;
        user.quizStatus = 'failed';
      }
      user.quizAnsweredAt = new Date();
      await user.save();
    }

    return res.json({
      success: true,
      data: {
        isCorrect,
        message: isCorrect
          ? '🎉 Xuất sắc! Câu trả lời hoàn toàn chính xác. Bạn được tặng 1 lượt quay may mắn!'
          : '❌ Rất tiếc! Câu trả lời chưa chính xác. Hẹn bạn thử lại vào ngày mai nhé!',
        explanation: question.explanation || '',
        correctAnswerKey: question.correctKey,
        correctAnswerText: question.options.find(o => o.key === question.correctKey)?.text || '',
        spinsLeft: isTest ? 999 : (isCorrect ? 1 : 0),
        quizStatus: isCorrect ? 'passed' : 'failed',
      },
    });
  } catch (err: any) {
    console.error('[submitQuiz] error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi chấm điểm câu hỏi' });
  }
}

/** ADMIN: POST /api/spin/admin/quiz */
export async function adminUpsertQuiz(req: Request, res: Response) {
  try {
    const { day, questionId, question, options, correctKey, explanation } = req.body;
    if (!day || !questionId || !question || !options || !correctKey) {
      return res.status(400).json({ success: false, message: 'Thiếu các trường bắt buộc (day, questionId, question, options, correctKey)' });
    }

    const dayNum = Number(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      return res.status(400).json({ success: false, message: 'Ngày phải nằm trong khoảng từ 1 đến 31' });
    }

    const existing = await QuizQuestion.findOne({ day: dayNum });
    if (existing) {
      existing.questionId = questionId;
      existing.question = question;
      existing.options = options;
      existing.correctKey = correctKey;
      existing.explanation = explanation || '';
      await existing.save();
      return res.json({ success: true, message: `Đã cập nhật câu hỏi ngày ${dayNum} thành công` });
    }

    await QuizQuestion.create({
      day: dayNum,
      questionId,
      question,
      options,
      correctKey,
      explanation: explanation || '',
    });
    return res.json({ success: true, message: `Đã tạo mới câu hỏi ngày ${dayNum} thành công` });
  } catch (err: any) {
    console.error('[adminUpsertQuiz] error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server khi lưu câu hỏi admin' });
  }
}

/** ADMIN: DELETE /api/spin/admin/quiz/:day */
export async function adminDeleteQuiz(req: Request, res: Response) {
  try {
    const dayNum = Number(req.params.day);
    if (isNaN(dayNum)) {
      return res.status(400).json({ success: false, message: 'Ngày không hợp lệ' });
    }
    const result = await QuizQuestion.deleteOne({ day: dayNum });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy câu hỏi cho ngày ${dayNum}` });
    }
    return res.json({ success: true, message: `Đã xóa câu hỏi ngày ${dayNum} thành công` });
  } catch (err: any) {
    console.error('[adminDeleteQuiz] error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server khi xóa câu hỏi admin' });
  }
}

