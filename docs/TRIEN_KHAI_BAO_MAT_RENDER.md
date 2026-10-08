# Bản sửa bảo mật đợt 1 — Render

Ngày 08/10/2026. Đã kiểm tra dashboard dịch vụ `tumorong-miniapp` (`srv-d9c4mv1kh4rs73c2cffg`), gói Free, Node, Singapore; tên miền quản trị/API `https://miniapp.tumorong.com`. Render đang chạy commit `58ab5ab` trên nhánh `main`, tự triển khai khi có commit mới. Bản sửa bảo mật cục bộ chưa commit/push hoặc triển khai.

Đã lưu bằng **Save only**: `NODE_ENV=production`, `ADMIN_ALLOWED_ORIGINS=https://miniapp.tumorong.com`, `TRUST_PROXY_HOPS=1` và bốn giá trị `ZALO_SECRET_KEY`, `ZALO_PRIVATE_KEY`, `GHN_TOKEN`, `GHN_SHOP_ID` từ `.env` theo cho phép của người dùng để dùng tạm. `MONGODB_URI` có sẵn được giữ nguyên. Việc lưu chưa kích hoạt deploy; các khóa cũ vẫn phải thay. `SESSION_SECRET` mới đang là trường trống trong biểu mẫu, chưa được lưu: người dùng cần bấm **Generate**, rồi **Save only**. Quy tắc công cụ trình duyệt yêu cầu người dùng tự tạo/nhập và lưu khóa xác thực mới.

Cấu hình lệnh thực tế hiện tại: Build `npm install --legacy-peer-deps && npm run build`, Start `npx tsx server.ts`; Health Check chưa đặt. Chưa đổi các lệnh này. Chỉ chuyển sang các lệnh đề xuất bên dưới khi repository đã có bản sửa tương ứng. Cookie và chuỗi proxy thật vẫn cần kiểm tra sau khi triển khai; sự hiện diện của biến chưa chứng minh đăng nhập hoặc tích hợp Zalo/GHN hoạt động.

## Những thay đổi đã có trong mã

- API nội bộ kiểm tra phiên MongoDB và quyền nhân viên; hồ sơ localStorage không còn quyết định quyền. Phiên thay ID khi đăng nhập, mất hiệu lực khi logout/đổi mật khẩu/đổi quyền/khóa tài khoản, hết hạn sau 30 phút không hoạt động hoặc 12 giờ tuyệt đối. Cookie production `__Host-tumorong.sid`, HttpOnly, Secure, SameSite=Lax.
- Login/logout và thao tác nhân viên cần CSRF token cùng Origin quản trị chính xác. Frontend/import/export dùng cùng cơ chế phiên.
- Giới hạn đăng nhập chia sẻ trong MongoDB: 10 lần/tài khoản và 100 lần/IP mỗi cửa sổ 15 phút. Khi kho phiên/giới hạn lỗi, từ chối yêu cầu; không bỏ qua xác thực.
- Không trả mật khẩu/hash trong hồ sơ nhân viên. Mật khẩu mới tối thiểu 12 ký tự, tối đa 72 byte UTF-8; không tạo tài khoản có mật khẩu cố định khi boot. Production không chạy seed dữ liệu hoặc migration mật khẩu tự động.
- Chặn ghi chỉ số chi tiêu/điểm qua CRUD khách hàng. Nhân viên kho chỉ xem thông tin liên hệ cần cho giao hàng và chỉ sửa địa chỉ.
- JSON tối đa 256 KB; upload Excel tối đa 5 MB, một tệp; cập nhật thư viện liên quan bảo mật. Không nạp Vite development server trong production thiếu build.
- Bỏ khóa cố định khỏi mã, `.env.example`, `app.yaml`; bỏ việc đưa Gemini key vào bundle trình duyệt. Các tệp `.db` cũ đã bỏ theo dõi Git, vẫn giữ trên máy. Không thay dữ liệu MongoDB thực tế.
- Webhook xóa dữ liệu Zalo trả 503 và không thực hiện xóa cho tới khi xác minh đúng chữ ký của loại webhook đang dùng. Đơn mới luôn “Chưa thanh toán”; không dựa vào lựa chọn phương thức của client để đánh dấu đã trả tiền.
- Đặc quyền số điện thoại thử nghiệm không còn áp dụng trên production. Endpoint `/api/vouchers-v2/confirm-usage` không còn công khai. Mini App được đọc mã đã kiểm tra không gọi endpoint này.

## Quyền hiện tại

| Nhóm thao tác | Admin | Sales | Warehouse |
| --- | --- | --- | --- |
| Tài khoản nhân viên / câu hỏi minigame quản trị | Có | Không | Không |
| Nhập/xuất dữ liệu hàng loạt | Có | Không | Không |
| Đơn hàng, GHN, voucher, nội dung, marketing | Có | Có | Không |
| Tạo/sửa sản phẩm | Có | Có | Không |
| Cập nhật tồn kho / quản lý kho | Có | Không | Có |
| Phiếu xuất kho | Có | Có | Có |
| Khách hàng | Đầy đủ | Đầy đủ, trừ nhập/xuất hàng loạt | Liên hệ và sửa địa chỉ |

GET sản phẩm/danh mục/tin và các endpoint hiện có cho checkout/vòng quay vẫn có phân loại public để phối hợp nâng cấp với Mini App. Kiểm thử đợt 1 xác minh middleware không chặn các hợp đồng này, chưa chứng minh các nghiệp vụ public đã an toàn đầy đủ.

## Việc cần làm trước khi lên môi trường thật

1. Tạo bản sao lưu MongoDB, kiểm tra tài khoản admin hiện có và xác nhận có thể phục hồi. Không dùng các tệp `.db` cũ thay cho backup MongoDB.
2. Đổi thông tin truy cập MongoDB, GHN, Zalo secret/private key và mọi khóa đã từng nằm trong repository. Xóa giá trị ở phiên bản hiện tại không thu hồi khóa trong lịch sử Git. Kiểm tra Gemini/service account nếu chúng đã được chia sẻ hoặc commit. Không ghi giá trị vào chat, tài liệu, lệnh CLI hoặc log.
3. Đổi mật khẩu các tài khoản đã dùng mật khẩu mẫu, khóa tài khoản không còn dùng. Công cụ `npm run admin:manage -- --username TEN_TAI_KHOAN --reset` đổi mật khẩu tài khoản hiện có; bỏ `--reset` chỉ tạo admin khi chưa có admin. Công cụ đọc `MONGODB_URI` và `BOOTSTRAP_ADMIN_PASSWORD` từ môi trường trong shell tin cậy, hash bcrypt; không hiển thị mật khẩu và không mở API bootstrap. Xóa biến mật khẩu khỏi shell sau khi chạy. Không chạy tự động khi build hoặc mỗi lần server boot.
4. Tạo bản staging dùng database riêng và khóa thử nghiệm. Giao diện và API phải cùng origin; không cấu hình giao diện tên miền chính gọi API qua một tên miền khác bằng `VITE_API_URL`.
5. Đặt các biến trong **Environment** trên Render, không trong repository:

| Biến | Giá trị/cách đặt |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | URI mới của MongoDB, quyền chỉ database ứng dụng |
| `SESSION_SECRET` | Ngẫu nhiên ít nhất 32 ký tự; Render Generate hoặc công cụ tạo bí mật; mỗi môi trường khác nhau |
| `ADMIN_ALLOWED_ORIGINS` | `https://miniapp.tumorong.com`; staging dùng đúng origin staging |
| `TRUST_PROXY_HOPS` | `1` nếu xác nhận đúng một reverse proxy Render tới Express; không dùng `true`; nếu có thêm proxy cần kiểm chứng chuỗi trước khi chọn |
| `VITE_API_URL` | Để trống; admin client mới luôn gọi API cùng origin và không dùng override này |
| `ZALO_SECRET_KEY`, `ZALO_PRIVATE_KEY` | Khóa mới của đúng app/môi trường |
| `GHN_TOKEN`, `GHN_SHOP_ID` | Cấu hình vận chuyển cần dùng; thiếu thì API trả 503 |
| AppSheet | Giữ cấu hình hiện có: `APPSHEET_SYNC_ENABLED`, `APPSHEET_SPREADSHEET_ID`, `APPSHEET_SERVICE_ACCOUNT_EMAIL`, `APPSHEET_PRIVATE_KEY`; không bật thử trên bảng thật |

Theo [Render Web Services](https://render.com/docs/web-services), Render kết thúc TLS ở load balancer rồi chuyển HTTP tới ứng dụng. Vì vậy cần cấu hình proxy đúng để cookie Secure được phát, và kiểm tra cả tên miền riêng lẫn địa chỉ `.onrender.com` để tránh tin header giả. Chưa có bằng chứng chuỗi proxy thật của dịch vụ này.

6. Build Command: `npm ci --include=dev && npm run build`; Start Command: `npm start`; Health Check: `/api/health`. Giữ `PORT` do Render cung cấp. Thiếu SESSION_SECRET/MONGODB_URI hoặc build production, server chủ động không khởi động; kiểm tra staging trước khi deploy.
7. Kiểm tra đăng nhập, reload còn phiên, đổi mật khẩu mất phiên, logout, quyền sales/warehouse, tạo khách, upload/export và phiếu xuất. Xác minh cookie Secure/HttpOnly, yêu cầu không phiên bị 401, sai quyền 403, Origin ngoài danh sách bị từ chối. Thử checkout COD/chuyển khoản và SDK trong **Zalo Mini App thật** với dữ liệu thử; không coi trả 201 là bằng chứng tiền đã thanh toán.
8. Deploy sau khi chuẩn bị bí mật/tài khoản và kiểm thử staging. Tránh rollback về mã cũ mở toàn bộ API; nếu lỗi, sửa bản mới hoặc đưa dịch vụ vào chế độ bảo trì theo khả năng của gói hosting.

## Phần chưa hoàn tất, cần xử lý tiếp

- Xác thực danh tính người mua từ Zalo phía server rồi ràng buộc quyền xem voucher/vòng quay vào danh tính ấy. Hiện phone, x-zalo-id/userId client vẫn chưa là bằng chứng xác thực. Không đóng các endpoint này bằng phiên nhân viên vì sẽ chặn Mini App.
- Tính tiền đơn, giá dòng hàng, vận chuyển và voucher từ dữ liệu server; ghi nhận voucher/đơn bằng transaction hoặc cơ chế bảo đảm nhất quán và idempotency. Hiện client vẫn cung cấp tổng tiền/giảm giá và đơn mới còn cập nhật số liệu khách. Đây là hạn chế bảo mật nghiệp vụ, chưa được giải quyết bởi việc thêm phiên quản trị.
- Callback thanh toán có chữ ký và chống phát lại, webhook Zalo đúng hợp đồng, giới hạn minigame/quiz nguyên tử và chống gửi lại. Không tái bật webhook xóa dữ liệu chỉ để tránh 503.
- Giới hạn tốc độ API public/CSRF, phân trang danh sách, chống tệp nén phình lớn ngoài giới hạn dung lượng upload, audit thao tác, CSP đã kiểm chứng tương thích, MFA cho admin và chính sách backup/restore. Helmet hiện chưa bật CSP; đợt này không tuyên bố đã chống mọi XSS.
- `npm audit` còn hai cảnh báo mức thấp cùng liên quan Quill 2.0.3/React wrapper; [advisory](https://github.com/advisories/GHSA-v3m3-f69x-jf25) chưa có bản vá. NewsPublicUI đã lọc HTML qua DOMPurify; không coi điều đó là xử lý mọi đường XSS. Cần thay/kiểm tra editor ở đợt tiếp theo; không hạ thư viện tùy tiện để làm số cảnh báo về 0.
- Render Free và vòng đồng bộ AppSheet chạy timer không bảo đảm hoạt động liên tục. Chọn worker/queue bền vững khi triển khai đồng bộ đa kênh và chuyển cloud; việc đó độc lập với quyền API ở bản sửa này.

## Kiểm chứng cục bộ

`npm run lint`, `npm run build`, `npm run test:security`, `npm run test:stock-issue`, `npm run test:customers-import`, `npm run test:appsheet`. Các kiểm thử dùng dữ liệu giả; không đăng nhập tài khoản thật, không ghi MongoDB hoặc gọi GHN/Zalo thật. Test bảo mật dùng MemoryStore riêng, production sử dụng MongoStore.

Kết quả đợt 1: TypeScript và build thành công; 38 kiểm thử đạt (10 bảo mật, 18 phiếu xuất, 4 nhập khách hàng, 6 AppSheet). Kiểm tra giao diện cục bộ đã xác minh login, duy trì phiên sau reload, logout rồi reload không còn quyền, và nhập văn bản trong editor mới. Chưa kiểm thử database/SDK/token thật trên staging hoặc production. Bundle có cảnh báo dung lượng lớn, chưa tối ưu trong đợt bảo mật.
