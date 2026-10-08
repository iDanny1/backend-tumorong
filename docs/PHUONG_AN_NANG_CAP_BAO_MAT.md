# Phương án nâng cấp bảo mật backend

Ngày: 08/10/2026. Đối tượng: backend Express/TypeScript/MongoDB và giao diện React trong repository này, phục vụ quản trị và Zalo Mini App. Hosting người dùng xác nhận là Render Free, dịch vụ `srv-d9c4mv1kh4rs73c2cffg`, tên miền `https://miniapp.tumorong.com`. Mục tiêu: bảo vệ dữ liệu và giao dịch trước khi nhận thêm dữ liệu WooCommerce, Shopee, Messenger.

Tài liệu này ghi nhận kiểm tra và thiết kế trước bản sửa, không phải xác nhận hệ thống đã được bảo mật đầy đủ. Bản sửa đợt 1 đã có trong mã cục bộ; kết quả, giới hạn và cấu hình cần triển khai nằm trong [Hướng dẫn triển khai Render](TRIEN_KHAI_BAO_MAT_RENDER.md). Chưa thay mật khẩu/khóa thật hoặc triển khai lên máy chủ. Chưa xác minh Mini App đang phát hành và cấu hình production. Các số dòng trong bảng phát hiện tham chiếu phiên bản trước sửa; các mốc triển khai bên dưới là đề xuất cần kiểm chứng trên staging.

## 1. Các phát hiện cụ thể và mức ưu tiên

P0: xử lý trước khi mở rộng dữ liệu; P1: xử lý trong đợt nâng cấp đầu; P2: tăng cường sau khi nền tảng đã bảo vệ được truy cập và giao dịch.

| Ưu tiên | Phát hiện trong mã | Hệ quả có thể xảy ra | Vị trí |
| --- | --- | --- | --- |
| P0 | Login chỉ trả hồ sơ; chưa có middleware phiên/quyền cho API quản trị | Đọc/xuất dữ liệu khách, sửa/xóa đơn, nhân viên, kho hoặc voucher mà không cần đăng nhập ứng dụng | `server.ts:1250`, các route quản trị; `src/App.tsx:80`, `src/lib/api.ts` |
| P0 | GET staff trả toàn bộ User; POST staff trả nguyên document vừa tạo | Phản hồi chứa hash mật khẩu, tăng khả năng dò mật khẩu nếu dữ liệu bị lấy | `server.ts:1176`, `server.ts:1186` |
| P0 | Bí mật/mật khẩu cố định trong file Git theo dõi và code dự phòng; seed/migration tài khoản khi khởi động | Người có bản sao mã có thể biết thông tin truy cập; khởi động có thể tái tạo tài khoản yếu hoặc thay mật khẩu admin cũ | `app.yaml`, `.env.example`, `server.ts:456`, `server.ts:584`, các cấu hình tích hợp |
| P0 | Webhook Zalo xóa hồ sơ theo phone trước khi xác minh nguồn gửi | Yêu cầu giả có thể xóa/ẩn dữ liệu | `server.ts:1515` |
| P0 | Tổng tiền, giá dòng hàng, giảm giá lấy từ client; trạng thái khác chuỗi `cod` bị coi là đã thanh toán | Có thể sửa giá/giảm giá, ghi nhận thanh toán sai; cả frontend hiện gửi tên COD dài nên dễ bị phân loại sai | `server.ts:855`, `server.ts:917`, `src/components/CustomerUI.tsx:113` |
| P0 | GHN create-order nhận body và gọi dịch vụ bằng token backend mà chưa có quyền server | Có thể phát sinh vận đơn không được nhân viên cho phép | `server.ts:1473` |
| P1 | Thông tin người chơi/voucher nhận phone, zaloId hoặc userId từ client chưa được xác thực | Giả danh người khác để xem voucher hoặc tác động lượt chơi/lượt dùng | Các controller spin/quiz/voucher |
| P1 | submitQuiz đang được route gọi ghi lại đáp án và đặt lại spinsLeft; test user có cơ chế đặc quyền dựa vào số điện thoại/cờ DB | Có đường lạm dụng cấp lại lượt; chế độ test có thể áp dụng trên production nếu không bị chặn | `src/controllers/quizController.ts:65`, `src/controllers/spinUserController.ts:39`, `src/controllers/spinController.ts:66` |
| P1 | confirm-usage cho client tự tăng lượt voucher; POST đơn cũng tăng lượt | Ghi nhận lượt không gắn giao dịch thật hoặc tính hai lần | `src/controllers/voucherController.ts:246`, `server.ts:928` |
| P1 | Nhiều route dùng trực tiếp req.body làm dữ liệu tạo/sửa; query có chỗ chưa bắt buộc scalar | Sửa trường nội bộ ngoài quyền nghiệp vụ; cần kiểm thử đối tượng truy vấn thay cho chuỗi, không dựa vào việc ép kiểu của Mongoose | Customer/Product/Order/Voucher CRUD, login/filter |
| P1 | Multer memoryStorage chưa có giới hạn file; parser JSON toàn ứng dụng cho phép 10 MB; danh sách khách/đơn chưa phân trang | Tiêu thụ RAM/CPU và làm chậm toàn bộ ứng dụng | `server.ts:26`, `server.ts:667`, GET customers/orders, import Excel |
| P1 | CORS cho origin ngoài danh sách thành `*`, đồng thời bật credentials; chưa thấy CSRF/rate limit | Chính sách truy cập không rõ ràng; không bảo vệ được thao tác server. Trình duyệt có thể chặn cấu hình wildcard+credentials, nhưng client ngoài trình duyệt vẫn gọi được API | `server.ts:654` |
| P1 | Log form đăng nhập, webhook nguyên body, URL query; một số lỗi trả String(err) | Lộ mật khẩu/PII/token trong console, log hoặc phản hồi lỗi | `src/App.tsx:162`, `server.ts:669`, `server.ts:1517` và nhiều catch |
| P2 | Chưa có audit đầy đủ, cơ chế thu hồi phiên và bằng chứng restore backup | Khó phát hiện, truy vết và phục hồi sự cố | Cần bổ sung |

Các phát hiện là kết quả đọc mã, chưa phải khai thác thử trên production. Không ghi lại giá trị bí mật trong tài liệu. Hiện đã có bcrypt và DOMPurify cho bài viết công khai; giữ và cải thiện các biện pháp này, không thay bằng cơ chế tự viết.

## 2. Thiết kế truy cập: tách ba nhóm

### Quản trị viên và nhân viên

Đề xuất phiên đăng nhập server lưu trong MongoDB, cookie `HttpOnly`, `Secure` trên HTTPS và `SameSite` phù hợp tên miền. Admin và API ưu tiên cùng origin để giảm phụ thuộc cookie liên miền. Session dùng thư viện được duy trì và session store bền vững; không dùng MemoryStore trên production.

- Khi đăng nhập thành công: thay ID phiên, lưu userId phía server; frontend lấy hồ sơ qua `/api/auth/me`. Hồ sơ localStorage có thể phục vụ hiển thị nhưng không quyết định quyền và không lưu token đăng nhập.
- Middleware kiểm tra phiên, tài khoản còn hoạt động và quyền hiện tại trước mọi API nội bộ. Thu hồi phiên khi đăng xuất, đổi/reset mật khẩu, khóa tài khoản hoặc đổi quyền; không giữ quyền cũ đến hết phiên.
- Đề xuất timeout không hoạt động 30 phút, tối đa phiên 12 giờ; xác minh lại mật khẩu/MFA cho xuất dữ liệu nhạy cảm, đổi quyền và thao tác phá hủy. TTL của MongoDB chỉ hỗ trợ dọn dữ liệu: ứng dụng vẫn kiểm tra expiresAt ở mỗi yêu cầu.
- Chống CSRF cho thao tác dùng cookie, gồm login/logout và import multipart, kết hợp kiểm tra Origin theo chính sách đã chốt. SameSite là lớp bổ sung, không thay CSRF.
- Chặn dò mật khẩu bằng giới hạn theo tài khoản và IP cùng thời gian chờ tăng dần; thông báo sai tài khoản/mật khẩu thống nhất. Không khóa vĩnh viễn theo request của người lạ để tránh họ gây mất truy cập.
- Model User mặc định không chọn password; login chọn hash riêng để so sánh. Mọi phản hồi staff/auth dùng danh sách trường được phép, kể cả POST/PUT; không trả hash, token reset hoặc dữ liệu phiên.
- Tài khoản tạo mới/reset dùng luồng mời hoặc mật khẩu tạm ngẫu nhiên hết hạn, buộc đổi lần đầu. Không seed tài khoản/mật khẩu mặc định trên production. Tách migration ra lệnh quản trị có kiểm soát; không đổi mật khẩu admin lúc server khởi động.
- MFA cho admin là phần tăng cường trong rollout; cần recovery code và quy trình phục hồi trước khi bắt buộc. Bảo đảm không thể tự vô hiệu hóa/hạ quyền tài khoản admin cuối cùng mà không có phương án quản trị khác.

Nếu admin và API bắt buộc khác site, phải thử cookie trong trình duyệt thực tế và cấu hình credentials/CORS/CSRF trước khi chốt. Không mặc định bật SameSite=None cho mọi môi trường. Trong dev có thể cho phép HTTP localhost qua cấu hình riêng; production luôn dùng HTTPS.

Nguồn: [OWASP quản lý phiên](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### Người mua trên Zalo hoặc luồng mua công khai

Không bắt người mua dùng tài khoản nhân viên. API danh mục công khai và API thao tác của người mua có hợp đồng riêng.

- Xác minh người dùng theo cơ chế Zalo dành cho đúng sản phẩm/phiên bản trước khi cấp phiên/token backend ngắn hạn có quyền người mua. Không coi `x-zalo-id`, SĐT hoặc access token chưa được kiểm chứng là bằng chứng danh tính.
- Mỗi yêu cầu đọc đơn/voucher/điểm dùng danh tính đã xác minh ở server và kiểm tra chủ sở hữu bản ghi. Không lấy phone/userId từ request làm khóa quyền. Địa chỉ/SĐT người nhận có thể khác người mua và không tự trở thành danh tính đăng nhập.
- Mini App dùng token người mua với phạm vi hạn chế nếu cần; không nhúng khóa dùng chung của backend vào app. Token xác thực admin và khách không được dùng thay nhau.
- Nếu luồng website cần guest checkout, chỉ cấp quyền tạo đơn hạn chế và theo dõi đúng đơn qua token theo dõi đủ ngẫu nhiên, hết hạn; không cho truy vấn đơn theo SĐT/mã đoán được. Quyết định guest cần căn cứ luồng thật, không tự mở rộng endpoint nội bộ.
- Phải xem mã Mini App đang phát hành và thử xác thực trên Zalo thật. Tài liệu OA, Mini App và thanh toán có hợp đồng khác nhau; không suy ra cơ chế Mini App từ một ví dụ OA.

Đây là đầu việc cần xác minh nền tảng, chưa lựa chọn endpoint xác thực Zalo hoặc thuật toán chữ ký khi chưa có tài liệu đúng luồng.

### Webhook và dịch vụ tích hợp

Webhook không dùng phiên nhân viên/CSRF cookie. Xác minh chữ ký và định danh ứng dụng/shop theo đúng hợp đồng nền tảng, trên raw body nếu nền tảng yêu cầu; đặt parser phù hợp trước JSON middleware.

- So sánh chữ ký an toàn, giới hạn payload; timestamp/nonce chỉ dùng khi có trong hợp đồng nền tảng. Lưu ID sự kiện/receipt chống xử lý lặp; sự kiện gửi lại hợp lệ được phản hồi theo hợp đồng nhưng không tạo tác động lần nữa.
- Webhook xóa dữ liệu phải định danh qua ánh xạ đã xác minh, không tin phone tự gửi để xóa. Nếu chưa xác minh được, không thực hiện hành động phá hủy; xử lý trạng thái lỗi đúng hợp đồng thay vì báo đã hoàn tất.
- Lưu sự kiện bền vững trước khi xác nhận nhận thành công, worker xử lý sau; nội dung xóa/ẩn có audit và phạm vi rõ ràng.
- Tương lai WooCommerce/Meta/Shopee mỗi kết nối có bí mật, quyền và receipt riêng; không mở một API write tổng quát cho mọi nguồn. IP allowlist chỉ là lớp bổ sung nếu nền tảng có dải IP chính thức, không thay chữ ký.

## 3. Ma trận API cần bảo vệ

| Nhóm endpoint hiện tại | Chính sách sau nâng cấp |
| --- | --- |
| GET products/categories/news | Công khai với trường và điều kiện công khai do server áp dụng; không cho query mở sản phẩm/bài nháp hoặc dữ liệu kho nội bộ. Tách contract nếu admin cần thêm trường. |
| POST/PATCH lượt xem bài viết | Công khai có validation/rate limit; không cấp quyền sửa nội dung qua alias này. |
| `/api/login`, auth/me/logout/reset | Luồng auth riêng; me cần phiên, reset có token một lần/TTL; chống dò và CSRF phù hợp từng endpoint. |
| customers CRUD/export/import | Phiên nhân viên + quyền riêng theo thao tác. Xuất/nhập hàng loạt là quyền đặc biệt, không mặc định cấp cho mọi sales. |
| GET orders và GET orders/:id | Danh sách quản trị cần quyền; người mua chỉ thấy đơn mình sở hữu qua luồng có xác thực. Mã đơn không phải bí mật dùng làm quyền truy cập. |
| POST orders | Người mua/guest theo luồng được phép, hoặc nhân viên tạo thủ công qua quyền riêng; giá, trạng thái và chủ sở hữu do server quyết định. |
| PUT/PATCH/DELETE orders | Nhân viên có quyền; whitelist trường/trạng thái. Người mua muốn hủy dùng thao tác chuyên biệt kiểm tra quyền sở hữu và điều kiện, không gọi PUT tổng quát. |
| staff CRUD | Admin quản lý tài khoản; dữ liệu phản hồi không có password/hash. |
| products/categories/news write, campaigns, warehouses | Quyền quản trị riêng theo nhóm. Kho chỉ được thay đổi tồn/phiếu nếu được cấp; không sửa giá hoặc tài khoản bằng quyền kho. |
| `/api/stock-issues` | Nhân viên có quyền đọc/lập phiếu, giữ tính chống lưu lặp hiện có; không để dữ liệu chứng từ công khai. |
| vouchers legacy và `/api/vouchers-v2/admin/*` | API danh sách quản trị và CRUD cần quyền voucher. Danh sách công khai chỉ mã public, trường được phép; không để route legacy làm lộ mã secret. |
| `/api/vouchers-v2/apply`, validate | Kiểm tra từ giỏ hàng server, danh tính khách đã xác minh và giới hạn dò mã. Báo giá không tự tăng lượt dùng. |
| `/api/vouchers-v2/confirm-usage` | Loại bỏ quyền client tự tăng; nếu giữ tương thích phải gắn đơn hợp lệ và receipt duy nhất. Tác động thực hiện bởi dịch vụ đơn, không một bộ đếm công khai. |
| `/api/spin/user-info`, register, get-quiz, submit-quiz, do-spin, my-vouchers | Danh tính người mua, kiểm tra chủ sở hữu; lượt/ngày do server kiểm soát nguyên tử. Bản câu hỏi công khai có thể tách riêng khỏi thông tin lượt của cá nhân. |
| `/api/spin/admin/*` | Quyền quản trị minigame, có audit. |
| `/api/ghn/create-order` và status | Quyền vận hành giao hàng; tạo từ đơn backend đã được phép, không proxy body tùy ý. Status chỉ trả dữ liệu cần thiết, không raw thông tin người nhận công khai. |
| `/api/zalo/phone` | Xác minh theo contract nền tảng, giới hạn gọi; chỉ trả dữ liệu liên hệ cần thiết cho đúng phiên. Không log token. |
| `/api/zalo-webhook` | Chính sách xác minh nguồn như phần trên trước mọi tác động. |
| download báo cáo/hướng dẫn, integrations/appsheet/status | Phiên/quyền phù hợp nội dung; báo cáo nội bộ không mặc định công khai. |
| health/readiness | Public liveness tối giản; thông tin DB/phiên bản/readiness chi tiết dành cho hạ tầng hoặc quyền nội bộ. |

Mặc định route nội bộ mới bị từ chối nếu chưa khai báo quyền. Kiểm kê cả alias, fallback, các router mount và mọi phương thức, tránh bảo vệ một URL nhưng còn đường vòng khác. Route register-customer đang xuất hiện cả ở spinRouter và server.ts; phải dọn/định tuyến rõ để không bỏ sót.

Phân quyền theo capability ở server, bước đầu ánh xạ ba role đang có: admin, sales, warehouse. Chốt thêm phạm vi bản ghi/cửa hàng nếu có nhiều chi nhánh; tên role tự gửi hoặc menu ẩn ở frontend không có giá trị cấp quyền. Tham chiếu [OWASP về kiểm tra quyền trên từng bản ghi](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).

## 4. Bảo vệ giá, thanh toán, voucher và lượt chơi

1. Khi tạo đơn: nhận ID hàng và số lượng đã kiểm tra; đọc giá/sản phẩm còn bán từ DB; tính tiền, giảm giá và vận chuyển ở server. Không dùng totalAmount/price/discountAmount của client làm số liệu chính thức. Nếu giá đổi sau báo giá, trả thông tin để khách xác nhận lại.
2. Chuẩn hóa phương thức thanh toán bằng enum và ánh xạ tên COD cũ trong thời gian chuyển đổi. Đơn mới mặc định chưa thanh toán; trạng thái đã thanh toán chỉ từ xác nhận nhà cung cấp đã xác minh hoặc thao tác nhân viên đủ quyền có audit. Không đánh dấu trả tiền chỉ vì tên phương thức khác `cod`.
3. Nội dung ký thanh toán được tạo từ số liệu server đã chốt; kiểm tra callbacks, trạng thái với đúng tài liệu payment đang sử dụng. Không log MAC/payload nhạy cảm. Đối chiếu orderId, tiền, tiền tệ và ID giao dịch; chống phát lại.
4. Request tạo đơn có idempotency key gắn chủ thể, unique index và hash nội dung. Gửi lại cùng yêu cầu trả cùng kết quả; dùng lại key với nội dung khác bị từ chối. Đơn, voucher và sự kiện tác động dùng transaction/receipt hoặc quy trình phục hồi phù hợp MongoDB thực tế.
5. Voucher có quy tắc ngày, hạn mức toàn hệ thống/cá nhân, sở hữu mã riêng; giữ/chốt lượt nguyên tử gắn orderId. Hủy/hoàn/timeout chỉ giải phóng lượt một lần. Không cho cả frontend confirm-usage và POST order cùng cộng lượt.
6. Quiz ghi nhận một lần theo người đã xác minh + ngày và kiểm tra câu hỏi hợp lệ cho ngày đó. Trả lời lại không reset lượt; quay claim lượt nguyên tử và tạo phần thưởng một lần dù hai request đồng thời hoặc mất phản hồi. Chế độ test bị chặn hoàn toàn trên production bằng cấu hình server; không kích hoạt qua SĐT hoặc header công khai.
7. Khi tạo GHN: kiểm tra quyền, đơn đủ điều kiện và chống tạo vận đơn lặp; payload lấy từ đơn đã lưu và lựa chọn vận chuyển đã kiểm tra. Có timeout và đối soát khi dịch vụ đã nhận nhưng mất phản hồi; không retry mù tạo đơn.

## 5. Validation, giới hạn tải, CORS và giao diện

- Dùng schema validation cho body/query/params trước DB. Bắt buộc string cho username/ID/filter; không nhận object toán tử Mongo thay cho giá trị. Chỉ dựng filter/update từ trường được phép; bật kiểm tra Mongoose khi update như lớp bổ sung. Không chuyển thẳng req.body vào create/update hoặc cho client sửa role, stockDeducted, tổng chi tiêu/điểm, source/customerId nội bộ ngoài quyền tương ứng.
- Đề xuất JSON thông thường 100–256 KB theo endpoint; không áp 10 MB cho toàn hệ thống. Giới hạn số dòng hàng, độ dài ghi chú/địa chỉ, số lượng, tiền hữu hạn và enum trạng thái; chặn số âm/Infinity và dữ liệu sai kiểu.
- Upload Excel: auth trước parser, một file, đề xuất tối đa 5 MB và 5.000 dòng/lần ban đầu; kiểm tra định dạng/nội dung, số sheet/cell và kích thước sau giải nén. Parse có ngân sách CPU/RAM, ưu tiên worker; không chỉ dựa vào MIME hoặc tên đuôi file. File lớn xử lý job/lô theo nhu cầu thật. Xuất spreadsheet không biến dữ liệu người dùng thành công thức thực thi.
- Phân trang khách/đơn với giới hạn trên, export có quyền và ngân sách riêng. Rate limit theo endpoint: login, giải mã SĐT, đặt đơn, dò voucher, quay và import có mức riêng; tính theo chủ thể và IP. Ngưỡng cụ thể đo trên staging để tránh chặn nhiều khách dùng cùng mạng.
- Đa instance cần store limiter dùng chung; không coi limiter trong RAM là bảo vệ toàn cụm. `trust proxy` chỉ tin proxy thật đã xác minh, tránh người gọi giả X-Forwarded-For để lách hạn mức. Giới hạn tải tại hosting/proxy bổ sung lớp ứng dụng.
- CORS trả đúng origin từ allowlist cụ thể; loại fallback wildcard với credentials. Origin không có không tự được cấp quyền admin; API server/native phải có credential riêng. Public read có thể dùng chính sách riêng. Dev localhost chỉ tồn tại trong cấu hình dev.
- Header bảo mật qua Helmet/cấu hình tương đương, tắt X-Powered-By, HTTPS/HSTS sau khi tên miền đã sẵn sàng. CSP thử ở report-only rồi enforce sau khi kiểm tra Vite production, editor, hình ảnh và in phiếu; không bật một cấu hình làm hỏng giao diện. Không để Vite dev/HMR phục vụ production.
- Giữ DOMPurify cho HTML bài viết, kiểm tra các điểm render HTML khác. `vite.config.ts` có define GEMINI_API_KEY: loại việc đưa bí mật server vào khả năng thay thế bundle, kiểm tra build có thực sự chứa bí mật không; chưa kết luận key đã bị bundle khi không có tham chiếu frontend.
- Error handler thống nhất trả mã lỗi/requestId và thông báo an toàn; log nội bộ đã che password/hash/token/cookie/URI, bỏ raw webhook, full query có dữ liệu cá nhân và form login. API/exports có dữ liệu nhạy cảm dùng cache policy phù hợp, thường `no-store`.

Giới hạn file cần kiểm chứng với file thực tế; không chỉ đặt fileSize vì XLSX có thể phình lớn sau giải nén. Nguồn: [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [Express production security](https://expressjs.com/en/advanced/best-practice-security/).

## 6. Bí mật, dữ liệu, hạ tầng và audit

- Lập danh sách khóa MongoDB, Zalo, payment, GHN và các dịch vụ sắp tích hợp, xác minh hiệu lực mà không xuất giá trị vào báo cáo. Bí mật đã xuất hiện trong mã phải được thay nếu còn hiệu lực; xóa khỏi file hiện tại không làm mất bản sao/lịch sử Git.
- Đổi khóa theo runbook: backup cấu hình an toàn → tạo cấu hình/khóa mới nếu dịch vụ cho phép → thử trên staging → triển khai → xác nhận luồng hoạt động → thu hồi khóa cũ. Nếu chỉ hỗ trợ một khóa, lên lịch chuyển đổi riêng. Việc đổi thông tin và thu hồi production cần quyền chủ tài khoản; không tự đổi khi mới lập phương án.
- `.env.example` chỉ placeholder; production yêu cầu đủ cấu hình và fail closed cho chức năng thiếu bí mật, không dùng fallback thật. Tách khóa dev/staging/production; service account ít quyền, không đưa vào biến VITE, frontend, Git hay log. Tham chiếu [OWASP quản lý bí mật](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- MongoDB: tài khoản ứng dụng chỉ quyền DB cần dùng, TLS, kết nối mạng giới hạn theo hạ tầng thực tế; không cấp quyền quản trị cluster cho ứng dụng. Quyền đọc/ghi cần kiểm chứng với job đồng bộ, session và migration. Chỉ migration có quyền thay đổi đặc biệt khi cần.
- Backup tự động, mã hóa và quyền riêng; lưu ngoài cây file được web phục vụ, thời hạn giữ và lịch restore. Chốt mục tiêu mất dữ liệu/thời gian phục hồi theo vận hành, không đưa con số SLA chưa thử.
- Audit tối thiểu: actor, hành động, đối tượng, trường thay đổi đã lọc, thời gian, requestId, kết quả. Ghi đăng nhập/khóa tài khoản, đổi quyền, xuất/nhập, sửa trạng thái/giá, vận đơn, xóa dữ liệu và cấu hình tích hợp. Không sao chép password/token/full customer vào audit; nhân viên không có API sửa/xóa audit.
- Cảnh báo có ngưỡng về đăng nhập thất bại, chữ ký sai, export bất thường, bị từ chối quyền hàng loạt và giao dịch trùng; có người nhận và runbook xử lý. Không tạo cảnh báo mọi request bình thường.
- Kiểm tra advisory cho dependencies từ registry/nguồn chính thức, phân biệt phần chạy production với dev; cập nhật có kiểm thử tương thích. Không dùng nâng cấp ép hàng loạt làm gãy React/editor/Express. CI chạy kiểm tra kiểu, test quyền, scan bí mật và audit dependency; không công bố CVE cụ thể khi chưa xác minh phiên bản thực tế và advisory.
- AppSheet và bản sao dữ liệu khác phải có phạm vi quyền/retention riêng; API CRM được bảo vệ không tự làm dữ liệu đã xuất ra Sheets trở nên an toàn. Quy trình xóa/ẩn theo định danh đã xác minh phải tính cả bản sao, log và hồ sơ liên quan.

## 7. Cách triển khai để giảm gián đoạn

| Đợt | Nội dung | Ước lượng ngày công | Điều kiện chuyển đợt |
| --- | --- | --- | --- |
| 0. Chuẩn bị và ngăn lộ thêm | Kiểm kê production, backup/restore, bỏ log nhạy cảm và hash trong phản hồi, runbook khóa, chặn hành động webhook chưa xác minh | 1 | Có cấu hình thử và kế hoạch thay khóa; không làm thay đổi dữ liệu thật trong khảo sát |
| 1. Đăng nhập và quyền | Session, CSRF, capability/route matrix, auth/me/logout, sửa mọi chỗ fetch/export/import frontend, thu hồi phiên và bỏ seed production | 2–3 | Request thiếu/sai quyền bị từ chối ở server; admin/sales/kho hợp lệ dùng được |
| 2. Giao dịch và Mini App | Xác thực Zalo, kiểm tra chủ sở hữu, giá/payment, voucher/quiz/spin/idempotency, GHN, chữ ký webhook | 2–4 | Không giả danh, sửa giá, tăng lượt hoặc tạo tác động hai lần; Mini App thật qua smoke test |
| 3. Gia cố vận hành | Schema validation toàn API, rate limit, upload, CORS/header/CSP, audit, dependency và cấu hình DB/backup | 2–3 | Thử sai kiểu/quá tải hợp lý, file lớn, origin lạ và log không lộ dữ liệu |
| 4. Kiểm thử phát hành | Hồi quy, thử phục hồi, triển khai đồng bộ API/admin/Mini App khi cần, xác nhận khóa cũ thu hồi, theo dõi | 1–2 | Đủ tiêu chí nghiệm thu dưới đây |

Tổng sơ bộ 8–13 ngày công cho một người triển khai có quyền/môi trường sẵn sàng, chưa gồm chờ Zalo, hosting, đổi khóa bên ngoài, MFA phức tạp hoặc giải quyết vấn đề dữ liệu lớn. Sau đợt 1, API quản trị được bảo vệ; sau đợt 2 mới xử lý được các đường lạm dụng giao dịch quan trọng. Không coi chỉ đợt 1 là hoàn tất bảo mật cho việc mở rộng đa kênh.

Tách `createApp()` khỏi việc connect/seed/listen để test quyền không chạm Mongo production. Đề xuất các module: cấu hình an toàn; auth/session; authorization; validation; xử lý lỗi/audit; xác minh Zalo/webhook; dịch vụ giá/đơn/voucher. Giữ endpoint cũ khi có thể và đặt kiểm tra quyền trước handler, không viết lại cả ứng dụng.

API client chung phải hỗ trợ phiên/CSRF và xử lý 401/403. Sửa cả các fetch riêng trong CustomerManagement, ProductManagement, OrderManagement; chỉ sửa `src/lib/api.ts` sẽ bỏ sót import/export. Khi reload, xác minh phiên ở server; khi hết phiên giữ bản nháp và cho đăng nhập lại. Webhook có parser riêng, không bị middleware CSRF admin chặn nhầm.

Chuyển đổi API và frontend cùng đợt trên staging, phát hành Mini App tương ứng khi cần. Có thể giữ alias cũ có cùng bảo vệ trong thời gian chuyển đổi, không có bypass dựa phiên bản client/header. Nếu rollback, quay về bản vẫn có bảo vệ hoặc tạm dừng chức năng bị ảnh hưởng; không mở lại API không xác thực để khôi phục giao diện. Migration bổ sung, không xóa khách/đơn lịch sử; dữ liệu lỗi trạng thái thanh toán cũ cần báo cáo đối chiếu, không tự sửa hàng loạt từ suy đoán.

## 8. Điều chỉnh cho Render đã được xác nhận

`app.yaml` trong repository không chứng minh hệ thống đang chạy App Engine; người dùng xác nhận Render nên dùng cấu hình Render thực tế làm căn cứ triển khai.

1. **Khóa và biến môi trường:** đặt thông tin MongoDB, Zalo, payment, GHN và secret phiên trong Environment của đúng Render service; tách staging/production và giới hạn người có quyền Dashboard. File private key nếu cần dùng Secret Files. Không dùng `app.yaml` chứa giá trị thật làm nguồn bí mật và không chép khóa sang `render.yaml` nếu bổ sung Blueprint. Thay đổi Environment bằng “Save only” chưa được tiến trình dùng đến khi deploy; runbook thay khóa phải bao gồm deploy và kiểm tra. [Render Environment](https://render.com/docs/configure-environment-variables).
2. **Tên miền và cookie:** lấy URL Render/custom domain thực tế, xác định admin cùng Web Service hay Static Site riêng. Nếu cùng ứng dụng, frontend gọi API tương đối và dùng cookie cùng origin. Nếu tách frontend, ưu tiên bố trí cùng origin qua lớp định tuyến hoặc kiểm chứng thiết kế phiên cho tên miền đó; không giả định hai subdomain onrender.com gửi được cookie như cùng site. Render hỗ trợ managed TLS; kiểm tra HTTPS, secure cookie và cấu hình proxy thực tế trước rollout. [Render Web Services](https://render.com/docs/web-services).
3. **Trạng thái bền vững:** phiên, audit, receipt và dữ liệu chính lưu MongoDB bên ngoài, không lưu vào RAM hoặc file `.db` trên filesystem tạm. Nếu có tài liệu/upload cần giữ lâu dài, chọn lưu trữ bền vững riêng. Chỉ có persistent disk khi cấu hình rõ, không mặc định Render tự giữ file sau deploy/restart. [Render về filesystem](https://render.com/docs/free).
4. **Gói instance và worker:** xác minh Free hay paid. Free Web Service có thể ngủ sau 15 phút không có inbound traffic và mất thời gian khởi động lại; nếu đang dùng Free cần tính lại độ tin cậy webhook, lịch đồng bộ và giới hạn RAM/CPU trước khi cam kết vận hành. Không dùng timer tự chạy trong Web Service ngủ để bảo đảm việc đồng bộ. Phương án instance/worker luôn hoạt động được chốt theo nhu cầu và chi phí sau khi có tải; đây không phải thông tin đã biết về gói hiện tại. [Render Free limitations](https://render.com/docs/free).
5. **MongoDB network:** kiểm tra Outbound IP ranges của đúng service/region trong Dashboard, thử kết nối staging rồi mới thu hẹp allowlist ở DB; không cắt kết nối đang hoạt động dựa vào IP phỏng đoán. Các range có thể dùng chung, vẫn cần tài khoản DB ít quyền và TLS; allowlist không thay credential. [Render Outbound IP](https://render.com/docs/outbound-ip-addresses).
6. **Build và phát hành:** xác nhận branch, Build Command, Start Command và NODE_ENV production; build React trước khi chạy server, bind PORT do Render cung cấp. Bổ sung lệnh start production rõ ràng nếu cần; không lấy tên script dev làm bằng chứng đang dùng Vite dev khi NODE_ENV thực tế chưa biết. Health check chỉ sẵn sàng sau khi cấu hình, DB và middleware đã chuẩn bị xong. Kiểm tra cách Render health check/rollout áp dụng cho loại service này. [Render Deploys](https://render.com/docs/deploys).
7. **Triển khai và phục hồi:** chạy staging với DB/khóa riêng, phát hành API + admin tương thích, chạy smoke test Mini App và quan sát lỗi 401/403/429 cùng lỗi dịch vụ. Lưu release có bảo vệ để rollback; config bí mật/khóa đã thu hồi và migration DB không được giả định sẽ tự trở lại khi rollback code. Bật MFA tài khoản quản trị Render và rà soát người có quyền deploy/đọc cấu hình.

Nhóm cấu hình mới dự kiến: session secret, admin origin allowlist, thời hạn phiên, cấu hình limiter, tắt seed/test mode ở production, log level và CSP. Tên/định dạng sẽ được chốt khi triển khai; tài liệu không yêu cầu thêm biến không được code sử dụng. Session secret phải được tạo ngẫu nhiên và đặt trực tiếp trong Environment, không đưa giá trị vào báo cáo.

## 9. Tiêu chí nghiệm thu

1. Thiếu phiên/token hợp lệ không đọc được dữ liệu CRM, hash, voucher cá nhân, phiếu hoặc báo cáo; role sai bị từ chối. Thay localStorage/header/role trong request không tăng quyền.
2. Đăng xuất/khóa tài khoản/đổi mật khẩu hoặc quyền khiến phiên cũ không dùng được; cookie có cờ đúng; CSRF thiếu/sai bị từ chối trên thao tác cookie. Login/reset chịu được kiểm thử dò mật khẩu phù hợp.
3. Khách A không đọc/sửa đơn/voucher/lượt của B dù biết SĐT/ID; Mini App thực tế vẫn đăng ký, xem hàng, đặt COD và dùng voucher được.
4. Giá/tổng tiền/giảm giá/paid do client tự sửa không được chấp nhận; COD không bị gắn đã thanh toán; callback sai chữ ký hoặc sai số tiền không chuyển paid.
5. Request trùng/đồng thời không tạo hai đơn, hai vận đơn, hai voucher thưởng, cấp lại lượt quiz hoặc ghi nhận hai lần. Lỗi giữa chừng có cách phục hồi an toàn.
6. Webhook thiếu/sai chữ ký không xóa dữ liệu; replay hợp lệ không xử lý hai lần; định danh xóa đúng chủ thể và có audit.
7. File quá lớn/sai định dạng, object query bất thường, trường nội bộ ngoài whitelist, origin lạ và payload sai kiểu bị từ chối có kiểm soát; lỗi không trả stack/secret.
8. Scan file theo dõi và bundle production không phát hiện bí mật thật; log/response không chứa password/hash/token. Khóa cũ đã đổi được thu hồi và cấu hình mới được xác nhận hoạt động.
9. CRUD theo quyền, phiếu xuất/in/bản nháp, nhập/xuất được cấp quyền và AppSheet vẫn đúng; test hiện có cùng test bảo mật mới đạt. Restore thử thành công; có runbook xử lý phiên/khóa bị lộ.

## 10. Thông tin cần trước khi triển khai thật

- URL admin/API, Render service type/region và gói instance để chốt cookie, CORS, trust proxy, HTTPS và giới hạn toàn cụm. Hosting Render đã được xác nhận, không cần hỏi lại nền tảng hosting.
- Mã Mini App đang phát hành, phiên bản SDK và luồng thanh toán đang dùng để xác minh đúng danh tính/chữ ký và chuyển đổi tương thích.
- Quyền của admin/sales/kho đối với xuất khách, sửa đơn, vận đơn, voucher, minigame và quản lý tồn; nếu chưa chốt, áp quyền tối thiểu như ma trận đề xuất trên staging.
- Quyền cấu hình bí mật, tài khoản dịch vụ và MongoDB; môi trường thử, backup và cửa sổ triển khai. Không gửi giá trị khóa/mật khẩu trong chat.

Những phần có thể làm trước khi có hosting: tách ứng dụng để test, chuẩn hóa phản hồi không chứa hash, bỏ log nhạy cảm, thiết kế schema/whitelist và ma trận quyền, sửa cấu hình mẫu, viết test truy cập và giao dịch. Những phần cần phối hợp máy chủ/tài khoản: đổi và thu hồi khóa, DNS/TLS/proxy, hạn chế mạng DB, phát hành Mini App, backup/restore và rollout production.
