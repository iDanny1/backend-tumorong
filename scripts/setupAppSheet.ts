import 'dotenv/config';
import { bridgeConfig, GoogleSheetsBridge } from '../src/services/appSheetBridge.js';

try {
  const config = bridgeConfig();
  if (!config) throw new Error('Điền cấu hình và đặt APPSHEET_SYNC_ENABLED=true trước khi thiết lập.');
  await new GoogleSheetsBridge(config).setup();
  console.log('Đã kiểm tra/tạo ba bảng CRM_KhachHang, CRM_PhieuXuat, CRM_ChiTietXuat. Chưa gửi dữ liệu khách hoặc phiếu. Thêm các bảng này vào AppSheet rồi khởi động backend.');
} catch (error) {
  console.error(error instanceof Error && !/fetch|ENOTFOUND/i.test(error.message) ? error.message : 'Chưa kết nối được Google Sheets. Kiểm tra mạng và cấu hình.');
  process.exitCode = 1;
}
