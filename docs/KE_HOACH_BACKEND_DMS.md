# Kế hoạch sửa chữa và phát triển backend theo tài liệu DMS

Ngày rà soát: 04/11/2026. Phạm vi: mã nguồn trong checkout hiện tại và 7 PDF trong `DMS/` (110 trang). Đây là kế hoạch kỹ thuật; chưa triển khai thay đổi nghiệp vụ hoặc chạy migration trên dữ liệu thật.

## 1. Kết luận và phạm vi đề xuất

Backend có nền tảng dùng tiếp được: Express, TypeScript, MongoDB/Mongoose, giao diện quản trị React, phiên đăng nhập lưu MongoDB, phân quyền admin/sales/warehouse, nhập khách hàng, phiếu xuất có chống lưu lặp và cầu nối AppSheet. Hướng phù hợp là tách thành các module nghiệp vụ trong cùng ứng dụng rồi phát triển dần.

Ưu tiên đầu tiên là sửa tính đúng của đơn hàng, giá, voucher, tồn kho và số liệu khách hàng. Sau đó xây lõi DMS gồm phân bổ hàng, xuất giao, lập hóa đơn, công nợ, thu tiền và đối soát. Tuyến bán hàng, ngân sách nhân viên, trưng bày và tích lũy triển khai trên lõi này.

Giả định để lập kế hoạch: xây chức năng DMS nội bộ cho hệ thống hiện tại, tham khảo quy trình Masan. Tích hợp trực tiếp với Siebel/eMobiz là một nhánh riêng: bộ PDF không có hợp đồng API, cơ chế xác thực hoặc đặc tả trao đổi dữ liệu đủ để triển khai connector. Chưa đưa việc viết lại toàn bộ bằng NestJS, chuyển database, xây app tablet mới hoặc kết nối thêm sàn vào phạm vi lõi.

Các mốc 16:15, 21:00, 24 giờ, 2 giờ và 3 ngày trong PDF là quy tắc lịch sử cần xác nhận với đơn vị vận hành trước khi bật. Tài liệu từ 2014-2015 không đủ để khẳng định đây là quy định hiện hành của doanh nghiệp.

## 2. Tài liệu nguồn và yêu cầu rút ra

Các đường dẫn dưới đây tương đối với file kế hoạch để có thể mở trong repository.

| Mã | Nguồn | Trang | Yêu cầu dùng cho thiết kế |
| --- | --- | ---: | --- |
| D1 | [Quy định xử lý đơn hàng](../DMS/HƯỚNG%20DẪN%20CÁC%20BƯỚC%20CẦN%20XỬ%20LÝ%20ĐƠN%20HÀNG%20TRÊN%20HỆ%20THỐNG%20DMS.pdf) | 3 | Phân biệt Pending, Promotion Applied, Allocated, Shipped, Invoiced, Paid, Cancelled; tác động riêng lên kho, hàng đang giao và công nợ. Approved mô tả một nghiệp vụ thu hồi/trả hàng đặc biệt. |
| D2 | [Công văn vận hành](../DMS/CV%20huong%20dan%20cach%20van%20hanh_DMS.pdf) | 4 | Tuyến/khách đúng nhân viên, đồng bộ đầu/cuối ngày, xử lý đơn treo, nhập ASN, ngân sách khuyến mãi và cập nhật nhân sự. Trang 3 trống, trang 4 chỉ có phần mẫu đầu trang. |
| D3 | [Hướng dẫn GSBH](../DMS/5.M1_Huong%20dan%20GSBH%20su%20dung%20cho%20CT%20Trung%20bay%20&%20Tich%20luy_ver0%201.pdf) | 37 | Duyệt đăng ký, đánh giá ảnh, phê duyệt kết quả đủ điều kiện, theo dõi trả thưởng theo chương trình/cửa hàng/NVBH. |
| D4 | [Hướng dẫn NVBH](../DMS/M1_Huong%20dan%20NVBH%20su%20dung%20cho%20CT%20Trung%20bay%20&%20Tich%20luy_ver0%201.pdf) | 40 | Đăng ký, ba cách tích lũy, mục tiêu hàng/tiền, ba cửa sổ thời gian, tối đa 6 ảnh/lần đánh giá, chỉ hóa đơn đủ điều kiện mới tích lũy; thưởng tiền không vượt giá trị đơn sau khuyến mãi. |
| D5 | [Khởi tạo và cấp mã NVBH](../DMS/Quy%20trinh%20khoi%20tao%20&%20cap%20ma%20cho%20NVBH%20moi.pdf) | 1 | Quy trình Sales Sup → Sales Ops → MDM → GSBH/Admin NPP; cấp mã và điều chỉnh ngân sách theo ngày hiệu lực. |
| D6 | [Thay đổi thông tin NVBH](../DMS/Quy%20trinh%20thay%20doi%20thong%20tin%20NVBH.pdf) | 1 | Sơ đồ bàn giao giữa các vai trò; cần lưu lịch sử thay đổi và hiệu lực. File là ảnh, đã đọc bằng bản render. |
| D7 | [Nâng cấp eMobiz](../DMS/Huong%20dan%20nang%20cap%20phan%20mem%20Emobiz.pdf) | 24 | Tham khảo nhu cầu quản lý phiên bản thiết bị và đồng bộ lại. Quy trình eMobiz 78.3/PartyCode là tài liệu lưu trữ, không áp dụng nguyên trạng cho backend mới. |

Hai điểm cần diễn giải đúng: đơn có thể bắt đầu ở Pending hoặc đã Promotion Applied tùy nguồn; thao tác sửa mới đưa từ Promotion Applied về Pending. Invoiced là đã lập hóa đơn và có thể còn nợ; Paid là đã thu đủ tiền, không phải hai trạng thái đồng nghĩa.

## 3. Hiện trạng và lỗi cần xử lý

P0: sửa trước khi mở rộng luồng giao dịch. P1: hoàn tất trong bản lõi DMS. P2: mở rộng sau khi lõi đã đối soát được. Các vị trí mã là số dòng tại ngày rà soát.

| Mã | Mức | Bằng chứng | Vấn đề và hướng sửa |
| --- | --- | --- | --- |
| B01 | P0 | `server.ts:748-817` | Tạo đơn nhận `items`, `totalAmount`, `shippingFee`, `discountAmount` từ client; chưa đọc lại giá và kiểm tra từng dòng ở server. Xây dịch vụ báo giá/checkout dùng giá, SKU, đơn vị tính và quyền giảm giá do server kiểm soát. |
| B02 | P0 | `server.ts:138-267` | Kho đọc-sửa-ghi từng sản phẩm rồi mới đặt `stockDeducted`; không có transaction/khóa phiên bản. Hai yêu cầu có thể trừ trùng hoặc ghi đè nhau; `Math.max(0, ...)` che thiếu hàng, số lượng âm có thể đảo tác động. Cần kiểm tra số lượng, cập nhật có điều kiện và sổ biến động. |
| B03 | P0 | `server.ts:174,224`; schema `server.ts:109-134` | Logic kho đọc `store/warehouseId` nhưng schema đơn chưa khai báo hai trường này. Khi không biết kho, hệ thống trừ nhiều kho rồi có thể hoàn hết về kho đầu. Lưu phân bổ theo từng dòng/kho và hoàn đúng phân bổ gốc. |
| B04 | P0 | `server.ts:242-261,821-845`; `src/controllers/voucherController.ts:112-239` | Checkout không gọi lại kiểm tra voucher; bộ đếm tăng ở nhiều nơi, định danh lúc dùng và lúc hoàn có thể khác nhau. Gửi lại trạng thái hủy tiếp tục giảm lượt của mã dùng chung. Tạo bản ghi sử dụng gắn orderId, kiểm tra hạn mức và consume/release đúng một lần. |
| B05 | P0 | `src/security/admin.ts:29-35`; `src/controllers/spinUserController.ts:65-80,142-165,207-212`; `src/controllers/spinController.ts:67-70,242-264` | API cá nhân Mini App còn public và nhận Zalo ID/SĐT do client tự khai. Đăng ký còn có thể đổi liên kết Zalo ID khi trùng SĐT. Cần xác minh danh tính phía server, liên kết chủ sở hữu và giới hạn tần suất; phối hợp bản Mini App để chuyển đổi tương thích. |
| B06 | P1 | `server.ts:83-134,926-974`; `src/types.ts:8-36` | Trạng thái là chuỗi tự do; PUT nhận nhiều trường nội bộ, gồm dữ liệu tiền/kho; có thể xóa đơn đã phát sinh tác động. Chuẩn hóa schema, whitelist, lệnh chuyển trạng thái có điều kiện và lưu lịch sử; khóa đơn đã ghi sổ, dùng chứng từ điều chỉnh. |
| B07 | P1 | `server.ts:848-867`; `src/models/Customer.ts:4-6`; `src/components/customers/CustomerDetail.tsx:213-217` | Cộng tổng chi tiêu ngay khi đơn pending, không có đối ứng khi hủy/hoàn; cập nhật bằng read-save dễ mất số cộng. `findOne({phone})` không phân biệt các hồ sơ chung số liên hệ. Gắn customerId/outletId và tách giá trị đặt, giá trị hóa đơn, đã thu, đã hoàn; hiển thị lịch sử đơn thật. |
| B08 | P1 | `src/routes/stockIssueRoutes.ts:29-65`; `src/lib/stockIssue.ts` | Phiếu xuất hiện là chứng từ snapshot, chủ đích không tạo đơn/trừ kho. Cần giữ hành vi phiếu cũ, thêm liên kết và thao tác ghi sổ riêng cho phiếu nghiệp vụ mới; tránh vừa lưu phiếu vừa trừ lần thứ hai ở đơn. |
| B09 | P1 | `src/components/orders/OrderDetail.tsx:50-81`; `server.ts:807,129,1365-1394` | GHN dùng quận/phường, kích thước cố định; `cod_amount` kiểm tra `COD` trong khi đơn mặc định là `cod`. UI lưu `order_code` nhưng schema là `ghnOrderCode`; tạo vận đơn và lưu đơn là hai request, thiếu chống tạo lặp. Server cần dựng yêu cầu từ đơn đã lưu, xác minh địa chỉ và ghi nhận vận đơn bền vững. |
| B10 | P1 | `server.ts:1241-1273,1533-1587` | Validate voucher legacy chưa kiểm tra ngày/hạn mức; import sản phẩm biến tồn bằng 0 thành 1000 vì `|| 1000`; import đơn luôn tạo mới và thiếu chi tiết hàng. Thống nhất dịch vụ voucher, sửa xử lý số 0, thêm dry-run và khóa nhập lặp; đơn thiếu dòng chỉ dùng đối soát lịch sử. |
| B11 | P1 | `src/controllers/spinController.ts:111-204`; `src/models/Voucher.ts:46-48`; `src/controllers/quizController.ts:72-113` | Trừ lượt quay bằng đọc-sửa-save, tạo thưởng rời rạc; đếm mã Golf bằng tiền tố `VOUCHER_GOLF` nhưng sinh mã `GOLF-...`. Hạn thưởng cố định 30/09/2026 đã qua ngày rà soát; gửi lại quiz có thể cấp lại `spinsLeft` dù `hasSpun` vẫn chặn quay tuần tự. Nếu chiến dịch còn mở: chuyển sang cấu hình chiến dịch, khóa nhận thưởng và quota; nếu kết thúc: đóng cấp mới, giữ lịch sử. |
| B12 | P1 | `server.ts:1171-1202,600-621,664,730-742`; `src/services/appSheetSync.ts:84-106` | GET voucher còn tự seed khi trống; startup còn thay index; health luôn 200 dù DB mất kết nối; danh sách chưa phân trang. Đồng bộ chạy timer và quét toàn bộ dữ liệu, chưa có luồng nhập DMS. Tách migration/seed khỏi phục vụ, thêm readiness, phân trang, job bền vững và đối soát. |
| B13 | P2 | `server.ts:271-329,406-424`; `src/security/admin.ts` | Chưa có NPP/điểm bán/tuyến/viếng thăm, quyền GSBH/kế toán theo phạm vi, nhận ASN, sổ công nợ, ngân sách theo nhân viên, đăng ký/chấm/trả thưởng DMS. Thiết kế thành module riêng thay vì mở rộng chuỗi trạng thái tùy ý. |

Phần đã làm tốt cần giữ: mật khẩu không nằm trong hồ sơ trả về; session MongoDB, CSRF, kiểm tra role ở server, thu hồi phiên khi đổi tài khoản; validation cho staff/customer; webhook Zalo chưa xác minh đang trả 503 và không xử lý; phiếu xuất có requestId duy nhất, snapshot và tính lại tiền ở server; AppSheet có receipt/hash/lease để thử lại.

Một số tài liệu cũ trong `docs/` mô tả thời điểm API chưa có xác thực hoặc phiếu chưa đồng bộ AppSheet. Mã hiện tại đã bổ sung hai phần này; dùng kết quả rà soát ngày 04/11/2026 cho quyết định phát triển, đồng thời cập nhật tài liệu cũ trong đợt ổn định.

## 4. Thiết kế lõi DMS

### 4.1. Đơn, giao hàng, hóa đơn và thanh toán

Tách trạng thái xử lý đơn, trạng thái giao hàng và số dư thanh toán. Không dùng nhãn tiếng Việt của giao diện để kích hoạt biến động tồn kho. `Paid` có thể hiển thị theo DMS nhưng được suy ra từ chứng từ thu tiền/số dư, không nhận tùy ý từ payload.

| Lệnh/điểm nghiệp vụ | Tồn và hàng đang giao | Tiền và kiểm soát |
| --- | --- | --- |
| Tạo Pending | Không đổi tồn | Không ghi doanh số hóa đơn hoặc chi tiêu đủ điều kiện; server tính giá và snapshot. |
| Áp khuyến mãi → Promotion Applied | Không đổi tồn | Khóa phiên bản báo giá/quy tắc khuyến mãi đã áp dụng. |
| Allocate → Allocated | Giữ hàng ở đúng kho; `available = onHand - reserved` | Từ chối thiếu hàng; lưu phân bổ theo dòng/kho. |
| Ship → Shipped | Giảm onHand và reserved ở kho xuất; tăng hàng đang giao tại vị trí/nhân viên giao | Chỉ ghi khi thực xuất; giao từng phần theo số lượng thực tế. |
| Ghi hóa đơn → Invoiced | Kết chuyển lượng hàng tương ứng khỏi hàng đang giao theo quy trình DMS | Ghi doanh số vận hành và công nợ từ chứng từ đã ghi sổ; tách yêu cầu xuất hóa đơn của khách khỏi hóa đơn thực sự phát hành. |
| Thu tiền đủ → Paid | Không đổi tồn | Phiếu thu/phân bổ vào hóa đơn làm giảm nợ; thu một phần vẫn còn dư nợ. |
| Hủy trước ghi sổ | Giải phóng giữ hàng; nếu đã xuất cần xác nhận hoàn hàng đúng nơi | Một lần hoàn quyền dùng voucher; có lý do và lịch sử, không xóa chứng từ. |
| Trả/thu hồi sau ghi sổ | Phiếu nhập trả riêng, hàng đạt/lỗi về đúng vị trí | Chứng từ giảm trừ/hoàn tiền nếu cần; tác động công nợ theo chính sách được chốt, không suy diễn từ chữ Approved. |

Luồng thường: `pending → promotion_applied → allocated → shipped → invoiced`; paid được xác định từ số dư. Sửa trước xuất cần deallocate và tính lại khuyến mãi; unship chỉ cho phép khi hàng thực tế được xác nhận quay về. Sau ghi hóa đơn dùng chứng từ điều chỉnh/trả hàng, không đưa đơn lùi về pending.

Mỗi lần chuyển có actor, quyền, lý do, version dự kiến và khóa chống lặp. Đơn nhiều lần giao/lập hóa đơn phải theo dõi số lượng ordered/reserved/shipped/delivered/invoiced/returned theo dòng; trạng thái đầu đơn là tổng hợp. Nhập ASN ghi received/damaged/short riêng, hỗ trợ nhận từng phần và không nhận vượt.

### 4.2. Tính nhất quán và mô hình dữ liệu

Các cập nhật Order, Reservation, StockBalance/Movement, VoucherRedemption, Invoice/Payment và Outbox liên quan phải dùng cùng giao dịch database khi phát sinh cùng một nghiệp vụ. Xác minh MongoDB hiện tại hỗ trợ transaction (replica set/sharded deployment), không chỉ đặt một cờ boolean để coi là đã an toàn. Nếu môi trường không hỗ trợ, coi việc chuẩn bị DB phù hợp là điều kiện triển khai; không âm thầm chạy nhiều bước thiếu bảo đảm.

| Nhóm | Dữ liệu bổ sung chính | Ràng buộc cần có |
| --- | --- | --- |
| Đơn | `customerId`, `outletId`, `source`, `externalOrderId`, `salesRepId`, lines chuẩn, báo giá snapshot, `version`, timestamps nghiệp vụ | Mã nội bộ duy nhất; unique nguồn/kết nối/mã ngoài khi có; không unique mã ngoài rỗng. |
| Kho | StockBalance theo product/warehouse; StockReservation; StockMovement với số lượng và vị trí nguồn/đích | Không âm ngoài nghiệp vụ được cho phép rõ; movement duy nhất theo nghiệp vụ+dòng; hoàn dựa movement gốc. |
| Nhận/giao | GoodsReceipt/ASN, Shipment, ShipmentLine, ReturnReceipt; liên kết đơn và phiếu xuất | Kiểm soát phần còn lại được nhận/giao/trả, không chỉ trạng thái đầu đơn. |
| Tiền | Invoice, Payment, PaymentAllocation, CreditAdjustment/Refund | Số tiền VND nguyên; không phân bổ quá khoản thu hoặc dư nợ; mã tham chiếu nhà cung cấp duy nhất. |
| Khuyến mãi | VoucherDefinition, VoucherRedemption và lịch sử chuyển đổi từ legacy/advanced/spin | Một nguồn quyết định hiệu lực; redemption gắn khách đã xác minh và orderId, không chỉ SĐT. |
| Nhân sự/phạm vi | Distributor, Outlet, SalesRoute, RouteAssignment, Visit, StaffChangeRequest, BudgetAllocation | Có khoảng hiệu lực; dữ liệu nhân sự cũ vẫn gắn với chứng từ cũ; kiểm tra phạm vi NPP/tuyến/kho ở server. |
| Hạ tầng | IdempotencyRequest, AuditEvent, OutboxEvent, Job/Checkpoint | Unique actor/phạm vi/action/key; cùng key khác nội dung trả 409; lịch sử có thể truy vết. |

Customer hiện cho phép chung SĐT; tiếp tục dùng ID hồ sơ, không khôi phục unique phone. Trường hợp nhiều doanh nghiệp/điểm giao chung số phải được chọn/đối soát, không tự gộp. Các tổng `ordersCount/totalSpent` là dữ liệu có thể tính lại; phân biệt số lịch sử nhập tay với số suy ra từ chứng từ để tránh cộng hai nguồn.

Thời gian lưu UTC, chốt ngày và hiển thị theo Asia/Ho_Chi_Minh. Báo cáo có cả ngày đặt và ngày ghi hóa đơn/thu tiền, quy tắc chốt kỳ rõ ràng. Chỉ số vận hành theo DMS không mặc nhiên thay thế quy tắc kế toán, thuế hoặc hợp đồng tích hợp hóa đơn điện tử.

### 4.3. Tổ chức mã và hợp đồng API

Tách `createApp()` khỏi `connect/listen`, đưa seed và migration ra lệnh riêng có dry-run. Đề xuất cấu trúc, thực hiện theo từng phần khi sửa nghiệp vụ:

```text
src/backend/
  app.ts, bootstrap.ts
  modules/
    auth, customers, catalog, orders, inventory
    shipments, invoicing, payments, promotions
    distributors, sales-routes, staff-workflows, trade-programs
  integrations/
    zalo, ghn, appsheet
  jobs/, audit/, shared/
```

Giữ `/api/*` hiện tại bằng lớp tương thích, bổ sung `/api/v2/*` cho nghiệp vụ mới. Không để handler cũ vượt qua các ràng buộc mới. Trong giai đoạn chuyển đổi, không ghi song song hai kho độc lập; mỗi nghiệp vụ chỉ có một nơi ghi chính, bản tương thích dùng cùng service.

API dự kiến: báo giá/checkout; `orders/:id/allocate`, `ship`, `cancel`; tạo/ghi sổ goods-receipts, invoices, payments, returns; xem balances/movements; reports/pending-orders và receivables. Các endpoint ghi nhận nghiệp vụ nhận idempotency key và expectedVersion; định danh/giá/phạm vi do server xác định. Bổ sung OpenAPI cho client, mã lỗi 400/401/403/404/409/422 thống nhất và phân trang có giới hạn.

GHN: tạo từ orderId, chọn địa chỉ đã xác minh, tính tiền COD còn cần thu; lưu ShippingAttempt và tham chiếu trước/sau gọi. Timeout hoặc mất phản hồi chuyển sang đối soát theo khả năng API thực tế, không bấm tạo lại vô điều kiện. Kiểm chứng tài liệu GHN/Zalo hiện hành và payload Mini App trước khi triển khai adapter; chưa xác nhận hợp đồng tích hợp trong lần lập kế hoạch này.

Outbox được ghi cùng giao dịch nội bộ; worker gọi GHN/AppSheet và thử lại sau commit, không giữ giao dịch MongoDB mở trong lúc chờ bên ngoài. Job quá hạn/đồng bộ có checkpoint/lease, quan sát được số việc chờ/lỗi và có lệnh đối soát. Giữ cầu nối AppSheet hiện có, thêm phạm vi xuất và xử lý cập nhật/xóa; chạy lịch bền vững phù hợp hosting thực tế.

## 5. Quyền, SLA và chức năng mở rộng

Giữ admin/sales/warehouse hiện tại khi chuyển đổi. Bổ sung capability cho GSBH duyệt, kế toán ghi hóa đơn/thu tiền và nhân viên giao hàng xác nhận giao; kiểm tra cả vai trò và NPP/tuyến/kho được giao. Người lập đăng ký/trả thưởng không tự duyệt cho chính mình theo ma trận được chốt. Phiếu cũ vẫn có thể xem/in theo quyền hiện tại; chứng từ DMS mới có ranh giới lập/duyệt/ghi sổ rõ ràng.

Theo D1/D2, cần màn hình đơn chưa lập hóa đơn, cảnh báo giao trễ và nhập hàng chậm. D1 lấy mốc 3 ngày từ ngày order, D2 còn nêu từ ngày xuất kho: lưu riêng cả hai tuổi đơn và cấu hình chính sách theo quy trình đã thống nhất. Bản đầu cảnh báo và giao việc xử lý; không tự hủy đơn đang giao rồi tự tăng tồn. Báo cáo doanh số phải dựa chứng từ đủ điều kiện, tách khoản đã thu và công nợ.

Quy trình nhân viên gồm đề nghị → xác minh → cấp mã → thông báo → chuyển tuyến/ngân sách → có hiệu lực; lưu người duyệt và lịch sử. Ngày đổi NVBH không làm mất mã người bán trên đơn lịch sử hoặc chuyển ngân sách hai lần.

Chương trình trưng bày/tích lũy gồm đối tượng, thời gian đăng ký/tham gia/trả thưởng, mức/suất, mục tiêu tiền hoặc hàng, ngân sách và loại thưởng. Ba chế độ tích lũy cần bộ quy tắc riêng: giới hạn theo suất đã đăng ký; vượt suất tới trần chương trình; vượt mức để xét hạng tiếp theo. Công thức chuyển hạng và xử lý hoàn hàng/chốt kỳ phải được cụ thể hóa bằng ví dụ trước khi code.

Chỉ hóa đơn đủ điều kiện được tính tích lũy; chống tính hai lần và có bút toán đảo khi điều chỉnh. Đăng ký, ảnh đánh giá (giới hạn 6 ảnh/lần theo tài liệu), kết quả tổng hợp và trả thưởng đều có luồng duyệt. Ảnh lưu ở nơi lưu trữ bền vững với quyền truy cập; tiền thưởng không vượt đơn sau khuyến mãi, hàng thưởng có biến động kho và hạn mức ngân sách riêng. Mã ngân sách không đổi trong thời gian hiệu lực theo D3/D4; thưởng đã cấp/đã giao/đã chi tách biệt.

## 6. Lộ trình triển khai và nghiệm thu

Ước lượng sơ bộ cho 1 lập trình viên triển khai toàn thời gian, có người phụ trách nghiệp vụ phản hồi và môi trường thử sẵn. Đơn vị là ngày công; chưa gồm chờ quyền nền tảng, làm sạch dữ liệu lớn, hóa đơn điện tử, app mobile mới hoặc giao diện quản trị được thiết kế lại toàn bộ.

| Đợt | Công việc cụ thể | Đầu ra và điều kiện qua đợt | Ngày công |
| --- | --- | --- | ---: |
| 0. Chốt dữ liệu và thiết kế | Xuất báo cáo chỉ đọc đơn/khách/kho/voucher; xác minh DB/hosting, backup/restore; chốt định nghĩa hóa đơn/chi tiêu, chính sách kho và quyền; kiểm kê API Mini App | Sơ đồ dữ liệu, danh sách bất thường, bộ ví dụ nghiệp vụ, môi trường thử riêng; không tự sửa số lịch sử | 2-3 |
| 1. Sửa nền giao dịch | Tách app để test, schema/whitelist; server tính giá; xác minh khách; idempotency; chuẩn hóa method/status/kho; thống nhất voucher và sửa GHN/COD/import 0; xử lý chiến dịch hết hạn | B01-B05 được kiểm thử; request lặp không tăng tác động; không sửa giá hay nhận voucher của người khác; Mini App/admin còn dùng được | 6-9 |
| 2. Đơn và kho DMS | Lệnh allocate/ship/cancel; reservation, balance/movement; receipt/ASN, hàng đang giao, giao/nhận từng phần; phiếu xuất liên kết; version và audit | Cạnh tranh mua hàng cuối không âm tồn; lỗi giữa bước rollback; hủy/hoàn đúng kho và đúng lượng; phiếu cũ không bị tự trừ tồn | 8-12 |
| 3. Hóa đơn, thu tiền và báo cáo | Invoice/payment/allocation, công nợ, credit/refund; tổng hợp chỉ số khách; lịch sử đơn thật; cảnh báo quá hạn và báo cáo đối soát | Pending không được tính thành doanh số hóa đơn; thu một phần còn nợ, thu đủ mới paid; trả hàng/hoàn tiền có đối ứng và truy vết | 5-8 |
| 4. Tổ chức bán hàng | NPP/điểm bán, tuyến, phân công/viếng thăm; vai trò GSBH/kế toán; cấp mã/đổi nhân viên và ngân sách theo hiệu lực | Người dùng chỉ xử lý phạm vi được giao; đổi tuyến/nhân viên không làm thay lịch sử hoặc nhân đôi ngân sách | 6-9 |
| 5. Trưng bày và tích lũy | Khai báo chương trình, đăng ký/duyệt, ảnh/chấm, engine ba chế độ, ngân sách, trả thưởng tiền/hàng và báo cáo | Ví dụ D3/D4 ra kết quả đúng; chưa duyệt/ngoài thời gian không trả thưởng; retry không trả hai lần; hủy/điều chỉnh có tính lại | 8-12 |
| 6. Chạy thử và phát hành | Job/outbox/checkpoint, phân trang/index, health/readiness, CI; diễn tập restore, chuyển dữ liệu, kiểm thử người dùng và rollout từng chức năng | Đủ đối soát đơn-kho-tiền; test hồi quy đạt; có cách xử lý lỗi/khôi phục; tài liệu vận hành phản ánh mã mới | 3-5 |

Mốc lõi gồm đợt 0-3 và phần ổn định tương ứng của đợt 6: khoảng 24-37 ngày công, tương đương 5-8 tuần làm việc. Toàn bộ phạm vi bảng trên: 38-58 ngày công, khoảng 8-12 tuần. Đợt 6 thực hiện liên tục theo từng release; không cộng hai lần khi ước lượng tổng. Cần cập nhật ước lượng sau đợt 0, đặc biệt với dữ liệu cũ và chính sách hóa đơn.

Thứ tự phụ thuộc: dữ liệu/quy tắc → giao dịch an toàn → kho → hóa đơn/công nợ → tích lũy/trả thưởng. Có thể khảo sát tuyến và chương trình sớm, nhưng không cấp thưởng dựa trên số liệu chi tiêu hiện tại chưa đối soát.

## 7. Chuyển đổi dữ liệu và phát hành

1. Lưu bản sao và thử restore trong môi trường riêng; thống kê dữ liệu trước thay đổi. Không chạy server chính trong bước khảo sát vì startup có thay index và có seed/migrate khi không ở production.
2. Viết migration có mã phiên bản, dry-run, checkpoint và báo cáo; thêm trường trước, chưa xóa trường cũ. Chuẩn hóa status/paymentMethod/items/định danh kho và mã vận đơn qua bảng ánh xạ tường minh; giá trị không nhận diện chuyển vào danh sách cần xem xét.
3. Gán customerId chỉ khi đủ căn cứ; hồ sơ chung SĐT cần đối soát. Đơn import không có dòng hàng không tự sinh biến động kho hoặc tính tích lũy từ suy đoán.
4. Đối chiếu tồn vật lý và số liệu hiện có để lập số dư đầu kỳ. Không backfill sổ kho bằng cách chạy lại `syncOrderInventory` cho tất cả đơn lịch sử; cờ `stockDeducted` không chứng minh kho nào đã thực sự xuất. Không tự kéo trạng thái cũ lên Invoiced/Paid để làm đẹp báo cáo.
5. Tính thử lại thống kê từ chứng từ, tách lịch sử nhập tay và ghi nhận chênh lệch cho người phụ trách xác nhận. Chạy báo cáo song song trước khi thay nguồn chỉ số trên UI.
6. Bật luồng mới theo feature flag cho nhóm thử/NPP/kho đã chọn; adapter cũ gọi chung service. Dừng ghi nghiệp vụ bị ảnh hưởng trong cửa sổ chốt số dư nếu cần; đánh dấu điểm chuyển để không trừ kho hai lần.
7. Rollback theo release và khả năng đọc dữ liệu mới. Tắt chức năng ghi mới khi cần, giữ chứng từ đã commit; xử lý bằng nghiệp vụ bù có audit. Không khôi phục dữ liệu cũ đè mất giao dịch mới hoặc mở lại đường cập nhật tự do.

## 8. Kiểm thử bắt buộc cho các thay đổi

| Nhóm | Tình huống nghiệm thu chính |
| --- | --- |
| Giá/checkout | Sửa giá/tổng/giảm giá ở client; số lượng âm/0/quá lớn/không hữu hạn; SKU mất/ẩn; đơn vị quy đổi; báo giá hết hạn; tài khoản không sở hữu voucher. |
| Chống lặp/đồng thời | Retry trước/sau commit, cùng key khác payload, hai request xác nhận, hai đơn mua hàng cuối, hai worker, mất phản hồi GHN; không tạo thêm đơn/stock movement/voucher/payment. |
| Kho | Allocate chưa giảm tồn vật lý; ship đúng vị trí; thiếu một mặt hàng không cập nhật dở dang; hủy lặp; nhận/giao/trả từng phần; lỗi sau khi ghi dòng đầu; hoàn đúng kho; ghi sổ phiếu không tác động hai lần. |
| Tiền | Hóa đơn và yêu cầu xuất hóa đơn khác nhau; thu một phần/nhiều lần, phân bổ nhiều hóa đơn, refund một phần; callback giả/sai số tiền/replay không chuyển paid; biên ngày/tháng Việt Nam. |
| Khách/quyền | Hai doanh nghiệp chung SĐT; khách thiếu SĐT; Zalo giả; đổi liên kết cần chứng minh; sai role/phạm vi; logout/đổi quyền; đọc lịch sử đúng customerId. |
| Chương trình | Ba option và chuyển hạng, hết thời gian, vượt suất/ngân sách, 7 ảnh bị từ chối, chưa duyệt, phát thưởng lặp, hóa đơn bị điều chỉnh và trả hàng sau chốt kỳ. |
| Vận hành | DB mất kết nối/readiness, restart worker, backoff lỗi/429, lease hết hạn, migration chạy lại, restore, danh sách lớn có phân trang, AppSheet lỗi không chặn giao dịch nội bộ. |

Các test transaction/unique index/cạnh tranh phải chạy với MongoDB thử hỗ trợ transaction; mock thuần không chứng minh các bảo đảm này. Không dùng DB production cho test. CI tối thiểu chạy typecheck, test hiện có, test nghiệp vụ mới và build khi thay đổi phần giao diện/bản phát hành.

## 9. Kết quả kiểm tra trong lần lập kế hoạch

- `npm run lint`: đạt, mã thoát 0.
- Chạy 7 file test hiện có: 38 ca. Lần đầu 29 đạt, 9 ca HTTP bị chặn kết nối localhost với `EACCES`; đây là hạn chế môi trường chạy.
- Chạy lại `scripts/security.test.ts` và `scripts/stockIssue.test.ts` với quyền kết nối nội bộ: 17/17 đạt, gồm cả 9 ca bị chặn. Tổng hợp hai lượt, cả 38 ca hiện có đều đạt.
- Test bảo mật dùng app giả lập và MemoryStore; test phiếu dùng model giả lập; test Google dùng phản hồi giả. Chưa có bộ test chứng minh luồng Order-Inventory-Invoice-Payment trên MongoDB thực tế.
- Chưa chạy server chính, chưa truy cập MongoDB thật, chưa gửi yêu cầu GHN/Zalo/Google thật hoặc kiểm tra production. Chưa chạy build trong lần lập kế hoạch vì chưa sửa mã chạy/giao diện.
- Chỉ bổ sung file kế hoạch này. Giữ các thay đổi đang có trong `docs/TRIEN_KHAI_BAO_MAT_RENDER.md`, thư mục DMS và ảnh triển khai của người dùng.

## 10. Backlog có thể bắt đầu ngay

1. Tách `createApp` và models của đơn/sản phẩm khỏi bootstrap, tạo fixture DB riêng cho kiểm thử; đưa index/seed vào lệnh vận hành tường minh.
2. Viết schema checkout/order update; thống nhất items và paymentMethod; dựng dịch vụ báo giá, khóa idempotency và hợp đồng Mini App trước khi đổi API.
3. Xây transaction cho đặt đơn/voucher và cập nhật tồn có điều kiện; triển khai kiểm thử cạnh tranh, thiếu hàng và hoàn lặp. Chặn sửa trực tiếp các trường làm vô hiệu hóa kiểm soát.
4. Sửa GHN: tạo theo orderId, địa chỉ thật, COD còn phải thu, lưu đúng `ghnOrderCode`, timeout/đối soát; sửa import tồn 0 và import đơn trùng.
5. Lập báo cáo chênh lệch customerId/kho/chi tiêu và chọn dữ liệu thí điểm, rồi bắt đầu reservation/stock ledger và chứng từ DMS.

Các quyết định cần chốt ở đợt 0: số NPP/kho/người dùng; có bán âm hoặc quy đổi thùng/chai không; ý nghĩa giá danh mục gồm/chưa VAT; nguồn hóa đơn/thu tiền thực tế; quyền GSBH/kế toán; chính sách trả hàng/chốt kỳ; chiến dịch vòng quay còn mở không; có cần tích hợp Siebel/eMobiz thật hay chỉ tham khảo quy trình. Những thông tin này điều chỉnh thiết kế chi tiết, không ngăn việc chuẩn bị test, schema và báo cáo chỉ đọc.
