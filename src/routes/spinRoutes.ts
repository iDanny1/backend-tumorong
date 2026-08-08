import { Router } from 'express';
import { getSpinInfo, claimOASpin } from '../controllers/spinUserController.js';
import { doSpin, getMyVouchers } from '../controllers/spinController.js';

const spinRouter = Router();

// Lấy thông tin lượt quay
// GET /api/spin/user-info
spinRouter.get('/user-info', getSpinInfo);

// Nhận lượt quay từ quan tâm OA (chỉ 1 lần)
// POST /api/spin/claim-oa-spin
spinRouter.post('/claim-oa-spin', claimOASpin);

// Thực hiện quay
// POST /api/spin/do-spin
spinRouter.post('/do-spin', doSpin);

// Lấy danh sách voucher của user
// GET /api/spin/my-vouchers
spinRouter.get('/my-vouchers', getMyVouchers);

export default spinRouter;
