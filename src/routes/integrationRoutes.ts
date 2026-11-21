import { Router } from 'express';
import path from 'node:path';

export default function createIntegrationRouter(rootDir: string) {
  const router = Router({ caseSensitive: true });
  const GHN_TOKEN = process.env.GHN_TOKEN || '';
  const GHN_SHOP_ID = process.env.GHN_SHOP_ID || '';
  const ZALO_SECRET_KEY = process.env.ZALO_SECRET_KEY || '';

  const GHN_STATUS_MAP: Record<string, string> = {
    'ready_to_pick': 'Chờ lấy hàng',
    'picking': 'Đang lấy hàng',
    'cancel': 'Đã hủy',
    'picked': 'Đã lấy hàng',
    'storing': 'Nhập kho',
    'transporting': 'Đang luân chuyển',
    'sorting': 'Đang phân loại',
    'delivering': 'Đang giao hàng',
    'money_collect_delivering': 'Đang thu tiền',
    'delivered': 'Đã giao hàng',
    'delivery_fail': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ xác nhận chuyển hoàn',
    'return': 'Đang chuyển hoàn',
    'return_transporting': 'Đang luân chuyển hoàn',
    'return_sorting': 'Đang phân loại hoàn',
    'returning': 'Đang trả hàng',
    'returned': 'Đã trả hàng'
  };

  router.post('/api/ghn/create-order', async (req, res) => {
    if (!GHN_TOKEN || !GHN_SHOP_ID) return res.status(503).json({ message: 'Chưa cấu hình vận chuyển.' });
    try {
      const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': GHN_TOKEN, 'ShopId': GHN_SHOP_ID },
        body: JSON.stringify(req.body)
      });
      res.json(await response.json());
    } catch (e) { res.status(500).json({ error: "GHN Error" }); }
  });

  router.get('/api/ghn/status/:order_code', async (req, res) => {
    if (!GHN_TOKEN) return res.status(503).json({ message: 'Chưa cấu hình vận chuyển.' });
    try {
      const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': GHN_TOKEN },
        body: JSON.stringify({ order_code: req.params.order_code })
      });
      const data = await response.json();
      if (data.code === 200 && data.data) {
        const ghnStatus = data.data.status;
        const systemStatus = GHN_STATUS_MAP[ghnStatus] || ghnStatus;
        const trackingUrl = `https://donhang.ghn.vn/?order_code=${req.params.order_code}`;
        res.json({ success: true, status: ghnStatus, statusName: systemStatus, trackingUrl, raw: data.data });
      } else {
        res.status(400).json(data);
      }
    } catch (e) { res.status(500).json({ error: "GHN Error" }); }
  });

  // --- ZALO ---
  router.post('/api/zalo/phone', async (req, res) => {
    if (!ZALO_SECRET_KEY) return res.status(503).json({ message: 'Chưa cấu hình Zalo.' });
    if (typeof req.body.phoneToken !== 'string' || typeof req.body.accessToken !== 'string' || req.body.phoneToken.length > 4096 || req.body.accessToken.length > 4096) return res.status(400).json({ message: 'Token không hợp lệ.' });
    try {
      const { phoneToken, accessToken } = req.body;
      const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
        headers: { 'access_token': accessToken, 'code': phoneToken, 'secret_key': ZALO_SECRET_KEY }
      });
      res.json(await response.json());
    } catch (e) { res.status(500).json({ error: "Zalo API Error" }); }
  });

  // Webhook nhận sự kiện từ Zalo Mini App (Xóa dữ liệu, Rút quyền...)
  // Disabled until the correct Mini App webhook signature contract is verified.
  // Never execute a destructive request authenticated only by its supplied phone.
  router.post('/api/zalo-webhook', (_req, res) => {
    res.status(503).json({ error: 'Webhook chưa được cấu hình xác thực. Chưa xử lý sự kiện.' });
  });

  router.get('/api/download/huong-dan-quan-tri', (req, res) => {
    try {
      const filePath = path.join(rootDir, 'HUONG_DAN_QUAN_TRI.docx');
      res.download(filePath, 'HUONG_DAN_QUAN_TRI.docx');
    } catch (err) {
      res.status(500).json({ error: "Không thể tải file hướng dẫn" });
    }
  });

  router.get('/api/download/bao-cao-he-thong', (req, res) => {
    try {
      const filePath = path.join(rootDir, 'BAO_CAO_HE_THONG.docx');
      res.download(filePath, 'BAO_CAO_HE_THONG.docx');
    } catch (err) {
      res.status(500).json({ error: "Không thể tải file báo cáo" });
    }
  });

  return router;
}
