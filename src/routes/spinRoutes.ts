import { Router } from 'express';
import {
  getSpinInfo,
  registerParticipant,
  getQuiz,
  submitQuiz,
  claimOASpin,
} from '../controllers/spinUserController.js';
import { doSpin, getMyVouchers } from '../controllers/spinController.js';

const spinRouter = Router();

// Lấy thông tin trạng thái của người chơi
// GET /api/spin/user-info
spinRouter.get('/user-info', getSpinInfo);

// Bước 1: Thu thập / Xác thực Họ tên và Số điện thoại
// POST /api/spin/register-participant
spinRouter.post('/register-participant', registerParticipant);

// Fallback tương thích ngược
// POST /api/spin/register-customer
spinRouter.post('/register-customer', registerParticipant);

// Bước 2: Lấy 1 câu hỏi Lịch sử ngẫu nhiên
// GET /api/spin/get-quiz
spinRouter.get('/get-quiz', getQuiz);

// Bước 2: Nộp câu trả lời câu hỏi Lịch sử (kiểm tra đúng/sai và cấp lượt quay)
// POST /api/spin/submit-quiz
spinRouter.post('/submit-quiz', submitQuiz);

// Bước 3: Thực hiện quay vòng may mắn
// POST /api/spin/do-spin
spinRouter.post('/do-spin', doSpin);

// Lấy danh sách voucher trúng thưởng của user
// GET /api/spin/my-vouchers
spinRouter.get('/my-vouchers', getMyVouchers);

// Fallback tương thích cũ
spinRouter.post('/claim-oa-spin', claimOASpin);

export default spinRouter;
