import { Router, type RequestHandler } from 'express';
import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { Voucher } from '../models/StoreVoucher.js';
import { AdvancedVoucher } from '../models/AdvancedVoucher.js';
import { UserVoucherUsage } from '../models/UserVoucherUsage.js';
import { customerFromOrder, syncDocumentCustomer } from '../services/documentCustomer.js';
import { updateOrder, deleteOrder, orderLines } from '../services/orderInventory.js';
import { InventoryError } from '../services/inventory.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const filter: any = {};
    // Lọc theo status nếu có: ?status=pending hoặc ?status=confirmed,...
    if (req.query.status) {
      filter.status = req.query.status;
    }
    // Lọc theo platform nếu cần: ?platform=Zalo+Mini+App
    if (req.query.platform) {
      filter.platform = req.query.platform;
    }
    const docs = await Order.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      address,
      items,
      totalAmount,
      note,
      shippingMethod,
      shippingFee,
      paymentMethod,
      invoice,
      zaloName,
      zaloPhone,
      zaloTokenName,
      zaloTokenPhone,
      voucherCode,
      discountAmount
    } = req.body;

    // ── VALIDATION ──────────────────────────────────────────────────────────
    const resolvedName  = customerName  || zaloName  || zaloTokenName  || '';
    const resolvedPhone = customerPhone || zaloPhone || zaloTokenPhone || '';
    const resolvedAddr  = address || '';

    if (!resolvedName.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên khách hàng' });
    }
    if (!resolvedPhone.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại' });
    }
    if (!resolvedAddr.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ giao hàng' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }
    orderLines(items);
    const parsedTotal = Number(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Tổng tiền đơn hàng không hợp lệ' });
    }

    // ── TẠO MÃ ĐƠN HÀNG (DH + timestamp) ──────────────────────────────────
    const orderCode = `DH${Date.now()}`;

    // ── BUILD ORDER DATA ────────────────────────────────────────────────────
    const orderData = {
      orderCode,
      customerName: resolvedName,
      customerPhone: resolvedPhone,
      address: resolvedAddr,
      items: items || [],
      products: items || [],   // backward-compat với admin panel
      totalAmount: parsedTotal,
      total: parsedTotal,
      shippingFee: Number(shippingFee) || 0,
      note: note || '',
      shippingMethod: shippingMethod || 'nhanh',
      paymentMethod: paymentMethod || 'cod',
      invoice: invoice || null,
      status: 'pending',         // mặc định: chờ xử lý
      paymentStatus: 'Chưa thanh toán', // Only a verified payment event or authorized staff can mark paid.
      platform: 'Zalo Mini App',
      voucherCode: voucherCode || '',
      discountAmount: Number(discountAmount) || 0,
      createdAt: new Date().toISOString()
    };

    const newOrder = await Order.create(orderData);
    console.log(`✅ Đơn hàng Zalo mới: ${orderCode} | _id: ${newOrder._id}`);


    // ── CẬP NHẬT LƯỢT DÙNG VOUCHER (ĐỒNG BỘ ADVANCED, LEGACY & USER USAGE) ──
    if (voucherCode) {
      const code = String(voucherCode).trim().toUpperCase();

      // 1. Cập nhật lượt sử dụng toàn hệ thống trong AdvancedVoucher
      await AdvancedVoucher.findOneAndUpdate(
        { code },
        { $inc: { usedCount: 1 } }
      ).catch(err => console.error("Lỗi update AdvancedVoucher:"));

      // 2. Cập nhật lượt sử dụng của từng User (UserVoucherUsage)
      const targetUserId = (req.body.userId || resolvedPhone || '').trim();
      if (targetUserId) {
        await UserVoucherUsage.findOneAndUpdate(
          { userId: targetUserId, voucherCode: code },
          { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date() } },
          { upsert: true, new: true }
        ).catch(err => console.error("Lỗi update UserVoucherUsage:"));
      }

      // 3. Cập nhật legacy Voucher model
      await Voucher.findOneAndUpdate(
        { code },
        { $inc: { usedCount: 1 } }
      ).catch(err => console.error("Lỗi update legacy Voucher:"));
    }

    // ── TỰ ĐỘNG LƯU / CẬP NHẬT KHÁCH HÀNG ─────────────────────────────────
    const orderCustomer = await syncDocumentCustomer(customerFromOrder(newOrder));
    if (orderCustomer) {
      await Customer.updateOne({ _id: orderCustomer._id }, {
        $inc: { ordersCount: 1, totalSpent: parsedTotal },
        $set: { lastAccess: new Date().toISOString() },
      });
    }

    // ── TẠO CHỮ KÝ ZALO PAYMENT (HMAC-SHA256) ──────────────────────────────
    // Bắt buộc theo yêu cầu Zalo: dùng cho Payment.createOrder phía Mini App
    let mac: string | undefined;
    const ZALO_PRIVATE_KEY = process.env.ZALO_PRIVATE_KEY || '';
    if (ZALO_PRIVATE_KEY) {
      try {
        const macData: Record<string, string> = {
          amount:     String(parsedTotal),
          desc:       `Đặt hàng - Mã đơn: ${orderCode}`,
          extradata:  JSON.stringify({ orderId: orderCode, customerName: resolvedName, customerPhone: resolvedPhone }),
          item:       JSON.stringify(items.map((i: any) => ({ id: String(i.id), amount: i.price * i.quantity }))),
          method:     JSON.stringify({ id: 'COD', isCustom: false }),
        };
        // Zalo yêu cầu sắp xếp key A→Z, nối key=value&...
        const dataString = Object.keys(macData).sort().map(k => `${k}=${macData[k]}`).join('&');
        mac = crypto.createHmac('sha256', ZALO_PRIVATE_KEY).update(dataString).digest('hex');
      } catch (macErr) {
        console.error('⚠️ Lỗi tạo MAC Zalo Payment:');
      }
    } else {
      console.error('❌ ZALO_PRIVATE_KEY chưa được cấu hình — MAC không được tạo!');
    }

    // ── PHẢN HỒI THÀNH CÔNG ─────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      orderCode,
      ...(mac !== undefined && { mac }),
      message: 'Đặt hàng thành công'
    });
  } catch (err) {
    if (err instanceof InventoryError) return res.status(err.status).json({ success: false, message: err.message });
    console.error('❌ Lỗi tạo đơn hàng:');
    return res.status(500).json({ success: false, message: 'Không thể lưu đơn hàng, vui lòng thử lại' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hỗ trợ tìm theo orderCode (DH...) hoặc MongoDB _id
    let doc = id.startsWith('DH')
      ? await Order.findOne({ orderCode: id })
      : null;
    if (!doc) {
      // Thử tìm theo _id (bắt lỗi ObjectId không hợp lệ)
      try { doc = await Order.findById(id); } catch (_) {}
    }
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

const updateStatus: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const data = await updateOrder(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof InventoryError) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Không thể lưu thay đổi đơn hàng. Vui lòng thử lại.' });
  }
};
router.patch('/:id', updateStatus);
router.put('/:id', updateStatus);

router.delete('/:id', async (req, res) => {
  try {
    await deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof InventoryError) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ error: 'Lỗi khi xóa đơn hàng' });
  }
});

export default router;
