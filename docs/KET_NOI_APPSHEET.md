# Kết nối CRM với AppSheet

## Trạng thái và phạm vi

Code đã có trong backend. Chưa bật trên máy chủ thật vì chưa cấu hình tài khoản Google dành cho backend. Kết nối Google Drive trong Codex giúp làm việc với file Sheets; kết nối đó **không tự cấp quyền cho chương trình backend** khi chạy độc lập.

Nguồn người dùng đã cung cấp:
[BÁO CÁO BÁN HÀNG HÀNG NGÀY](https://docs.google.com/spreadsheets/d/1nR9iNl1PaGyHIC6vAoQcjqY2QjUaHxxk7hRTPlnl24A/edit).

Luồng một chiều: **backend → Google Sheets → AppSheet**. Hồ sơ khách và địa chỉ sửa tại CRM; chọn khách trong “Bán tại cửa hàng” sẽ điền địa chỉ vào phiếu. Phiếu là bản chụp tại lúc lưu, địa chỉ khách sửa sau này không thay đổi phiếu cũ.

Ba tab mới trong cùng file nguồn, do backend quản lý:

| Tab | Nội dung | Key AppSheet |
| --- | --- | --- |
| CRM_KhachHang | Mã, tên, số điện thoại, địa chỉ, email, nhóm khách | Mã KH |
| CRM_PhieuXuat | Số phiếu, khách, kho, địa chỉ, tiền hàng, VAT, tổng thanh toán | Mã phiếu |
| CRM_ChiTietXuat | Hàng hóa và số lượng từng dòng | Mã dòng |

Các bảng cũ “Thông tin KH”, “SKU”, “Doanh Thu Hằng Ngày Tháng 8” giữ nguyên. Khách backend dùng ID MongoDB; chưa ghép tự động với mã khách ở bảng “Thông tin KH”. Không đẩy phiếu sang bảng doanh thu cũ vì một phiếu có nhiều dòng và chưa phải chứng từ xác nhận bán hàng. Chưa đồng bộ ngược, chưa đồng bộ xóa, chưa ghi giảm tồn kho.

## Cấu hình kết nối một lần

1. Trong Google Cloud, bật Google Sheets API, tạo hoặc chọn service account dành cho backend. Không cần cấp quyền quản trị cả dự án hoặc ủy quyền cả tên miền.
2. Chủ file chia sẻ **đúng file nguồn trên** cho email service account với quyền Editor. Kiểm tra danh sách người có quyền xem file trước khi gửi hồ sơ khách và địa chỉ từ CRM.
3. Lưu private key trong cấu hình bí mật của máy chủ; khi chạy local dùng `.env` đã được Git bỏ qua. Không gửi khóa trong chat, không để khóa trong React hoặc biến `VITE_*`, không đưa vào Git.
4. Thêm bốn biến sau (thay email và khóa bằng giá trị thật):

```dotenv
APPSHEET_SYNC_ENABLED=true
APPSHEET_SPREADSHEET_ID=1nR9iNl1PaGyHIC6vAoQcjqY2QjUaHxxk7hRTPlnl24A
APPSHEET_SERVICE_ACCOUNT_EMAIL=crm-sync@YOUR_PROJECT.iam.gserviceaccount.com
APPSHEET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

5. Chạy `npm run appsheet:setup`. Lệnh tạo ba tab còn thiếu, đặt tiêu đề cho tab trống, từ chối ghi đè dữ liệu hoặc tiêu đề khác. Lệnh này chưa gửi khách hàng hoặc phiếu.
6. Trong AppSheet, Data → Tables → Add new table, chọn ba tab trên trong file nguồn. Đặt cả ba bảng **Read-only**. Cấu hình Key như bảng trên; “Mã KH” của phiếu tham chiếu CRM_KhachHang (cho phép trống với khách nhập tay); “Mã phiếu” của chi tiết tham chiếu CRM_PhieuXuat. Đặt SĐT kiểu Phone, địa chỉ kiểu Address, ngày xuất kiểu Date, tiền kiểu Price, số lượng kiểu Decimal. “VAT %” là **Number** (10 nghĩa là 10%), không phải Percent (0.1).
7. Save app. Build và khởi động backend với cấu hình mới. Lần đầu sẽ gửi các khách và phiếu đã có; mỗi bản ghi thay đổi cách nhau 3 giây để hạn chế số yêu cầu Google. Các lần tiếp theo chỉ gửi dữ liệu thay đổi; thử lại sau lỗi theo chu kỳ 60 giây. Trong AppSheet bấm Sync để đọc dữ liệu mới.

Để chạy tự động liên tục, backend/worker cần được duy trì hoạt động. Nếu hosting dừng tiến trình khi không có truy cập hoặc không cấp CPU chạy nền, cần cấu hình worker luôn hoạt động trước khi cam kết đồng bộ theo thời gian. Chưa triển khai máy chủ thật trong thay đổi này.

## Nhân viên sử dụng

- Vào **Khách hàng**, bấm tên khách, nhập **Địa chỉ khách hàng**, bấm **Lưu địa chỉ**. Chỉ báo đã lưu sau khi máy chủ lưu thành công; lỗi mạng giữ lại nội dung.
- Vào **Bán tại cửa hàng**, chọn khách, thêm hàng, xem phiếu, lưu và in. Địa chỉ giao khác có thể sửa riêng trên phiếu.
- Trạng thái kết nối nằm đầu màn hình lập phiếu. Lưu/in phiếu không phụ thuộc Google.
- Xuất Excel có cột “Địa chỉ khách hàng”. Nhập Excel chấp nhận cả tên cột mới và tên cũ “Địa chỉ”; cơ chế nhập hiện có chỉ thêm khách mới, không cập nhật khách đã tồn tại.

## Bảo trì và kiểm thử

- Không chèn, xóa hoặc sắp xếp vật lý các dòng trong ba tab CRM; sắp xếp ở giao diện AppSheet hoặc dùng filter view. Backend cấp vị trí dòng cố định trong MongoDB để lần gửi lại không tạo bản sao. Nếu phát hiện dòng mang mã khác, dừng ghi và báo lỗi.
- Sao lưu cả dữ liệu CRM và các collection AppSheetPosition, AppSheetRowCounter, AppSheetReceipt, AppSheetLease. Không xóa riêng bộ nhớ vị trí đồng bộ.
- Không sửa thủ công các tab đầu ra. Khi cần chỉnh địa chỉ, sửa trong CRM. Phiếu đã lưu không sửa, tạo phiếu mới nếu cần.
- API trạng thái: `GET /api/integrations/appsheet/status`, không trả khóa/email tài khoản kết nối. Không có API công khai để cấp quyền hoặc thay cấu hình.
- Tắt bằng `APPSHEET_SYNC_ENABLED=false`, khởi động lại backend. Dữ liệu đã gửi vẫn còn trên Sheets.
- `npm run test:appsheet`: giả lập Google, kiểm tra ký/xác thực, dữ liệu địa chỉ, số 0 đầu, nhiều dòng hàng, tổng tiền, gửi lại sau mất phản hồi, bảo vệ dòng và lỗi quyền.
- `npm run test:stock-issue`: kiểm tra phiếu và lưu chống trùng bằng dữ liệu giả.
- `npm run demo:stock-issue`: bản thử tại http://127.0.0.1:5180, không MongoDB, không gửi Google. Địa chỉ mẫu và phiếu chỉ giữ đến khi tắt bản thử.

Tài liệu Google dùng để triển khai: [Sheets values / RAW](https://developers.google.com/workspace/sheets/api/guides/values), [service account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account), [AppSheet Sync](https://support.google.com/appsheet/answer/10108301?hl=en).
