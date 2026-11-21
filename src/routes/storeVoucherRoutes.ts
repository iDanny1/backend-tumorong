import { Router } from 'express';
import { Voucher } from '../models/StoreVoucher.js';
import { createDefaultVouchers } from '../data/defaultVouchers.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    let docs = await Voucher.find({}).sort({ createdAt: -1 });
    if (docs.length === 0) {
      await Voucher.create(createDefaultVouchers());
      docs = await Voucher.find({}).sort({ createdAt: -1 });
    }
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải voucher' });
  }
});

router.post('/', async (req, res) => {
  try {
    const voucher = await Voucher.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      createdAt: new Date().toISOString()
    });
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo voucher' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Voucher.findByIdAndUpdate(req.params.id, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật voucher' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa voucher' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ message: "Vui lòng nhập mã voucher" });
    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
    if (!voucher) return res.status(400).json({ message: "Mã không tồn tại hoặc đã bị tắt" });

    const total = Number(orderTotal) || 0;
    if (total < (voucher.minOrderValue || 0)) {
      return res.status(400).json({ 
        message: `Đơn hàng chưa đạt giá trị tối thiểu (${(voucher.minOrderValue || 0).toLocaleString()}đ)` 
      });
    }

    let discountAmount = 0;
    if (voucher.type === 'percentage') {
      const pct = voucher.discountPercentage || 0;
      discountAmount = total * (pct / 100);
      if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
      }
    } else {
      discountAmount = voucher.discountAmount || voucher.discount || 0;
    }

    discountAmount = Math.min(discountAmount, total);

    res.json({
      success: true,
      voucher,
      discountAmount,
      finalTotal: Math.max(0, total - discountAmount)
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi kiểm tra voucher' });
  }
});

export default router;
