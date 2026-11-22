# Lập và in phiếu xuất kho

Trong trang quản trị, chọn **Bán tại cửa hàng**. Tài khoản quản trị, bán hàng và kho đều thấy mục này.

1. Tìm khách bằng tên / số điện thoại, hoặc nhập người nhận trực tiếp.
   Có thể tìm thêm theo địa chỉ để phân biệt các khách cùng tên. Chọn khách sẽ điền địa chỉ khách hàng và địa chỉ giao hàng riêng, nếu có.
2. Chọn kho, kiểm tra ngày và lý do xuất.
   Địa chỉ kho tự điền từ danh mục, hiện ngay trong bước này và trên bản in. Có thể sửa địa chỉ cho phiếu đang lập. Trong **Quản lý kho**, dùng nút sửa kho để lưu tên/địa chỉ vào danh mục. Phiếu đã lưu giữ địa chỉ tại thời điểm lập.
3. Tìm sản phẩm theo tên / SKU / barcode. Mỗi dòng ghi sổ cần chọn một sản phẩm trong danh mục. Hãy tạo sản phẩm còn thiếu rồi tải lại danh mục.
   Danh mục xuất kho bao gồm cả sản phẩm đang ẩn trên cửa hàng. Trạng thái hiển thị cho khách không quyết định việc xuất kho. Danh mục được tải lại khi vào trang hoặc quay lại cửa sổ; dùng **Tải lại danh mục** nếu vừa thêm sản phẩm/kho ở nơi khác. Đơn vị tính của sản phẩm được lưu và điền vào dòng hàng.
4. Kiểm tra đơn vị tính, số lượng yêu cầu, thực xuất và **đơn giá chưa VAT**. Giá danh mục được điền sẵn nhưng cần đối chiếu vì hệ thống cũ chưa khai báo rõ giá đã gồm VAT hay chưa.
5. Chọn **Xem phiếu & in**, kiểm tra mẫu, sau đó **Lưu phiếu & in**.
6. Trong cửa sổ in của trình duyệt, chọn máy in hoặc **Lưu dưới dạng PDF**. Dùng khổ A4, tỉ lệ 100% và tắt đầu/chân trang của trình duyệt nếu có.

Số phiếu được cấp tự động dạng `PXKYYYYMMDD-0001`. Đơn vị tính phải nhập khi danh mục chưa có. Số tiền dùng số lượng **thực xuất**, làm tròn đến đồng. Phiếu mới chọn VAT từng sản phẩm và tính VAT sau chiết khấu sản phẩm, chiết khấu tổng bill phân bổ. Số tiền bằng chữ được tự tạo. Xem [đối chiếu pháp lý và cách tính](DOI_CHIEU_PHIEU_XUAT_2026.md).

**Hiển thị trên phiếu:** chọn **Ẩn VAT** để bỏ cột thuế suất và tiền VAT; chọn **Ẩn chiết khấu** để bỏ cột chiết khấu và dòng chiết khấu tổng bill. Bảng tự giãn theo các cột còn lại. Tổng tiền thanh toán vẫn tính đầy đủ các khoản đã nhập. Các lựa chọn được lưu cùng phiếu mới. Khi in lại phiếu đã lưu theo mẫu mới, có thể đổi lựa chọn cho lần in đó mà không sửa nội dung đã lưu. Phiếu theo mẫu cũ vẫn in nguyên mẫu cũ.

Tên cột: **Đơn giá** là giá một đơn vị; **Thành tiền** là số lượng thực xuất nhân đơn giá, trước chiết khấu. Các dòng tổng dùng **Cộng tiền hàng**, **Chiết khấu tổng bill**, **Tổng tiền thanh toán**.

Thông tin công ty và các vị trí ký theo mẫu được cung cấp. Mục **Thông tin công ty, giao hàng & người ký** cho phép điều chỉnh trước khi lưu. Người nhận là đơn vị / khách hàng; tên người ký nhận là trường riêng, có thể để trống để ký tay.

Trong mục này, **Chọn công ty lập phiếu** có hai lựa chọn: **CÔNG TY CỔ PHẦN RƯỢU SÂM VIỆT NAM ATUAGIN** và **CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM**. Chọn một công ty sẽ tự điền tên và địa chỉ tương ứng. Công ty Tu Mơ Rông dùng địa chỉ **Làng Ko Xía 2, Xã Măng Ri, Tỉnh Quảng Ngãi, Việt Nam**. Phiếu chỉ hiển thị công ty đã chọn; thông tin được giữ nguyên khi lưu và in lại.

## Lưu, tìm và in lại

- Bản nháp được giữ trong trình duyệt theo tài khoản đang đăng nhập. Không đồng bộ bản nháp giữa các máy.
- **Tạo phiếu mới** mở lựa chọn **Lưu nháp / Bỏ phiếu đang soạn / Hủy** khi chưa lưu. Lưu nháp giữ cả các dòng chưa nhập xong trong **Bản nháp đã lưu trên máy này** để mở lại. Phiếu mới có thông tin khách, kho và hàng trống, không lấy nội dung phiếu cũ.
- **Xóa phiếu hiện tại** hỏi xác nhận và xóa nội dung đang mở cùng bản nháp tương ứng trên máy này. Hủy giữ nguyên nội dung. Chức năng này không xóa chứng từ đã lưu trong lịch sử hệ thống.
- Phiếu hoàn chỉnh lưu trong MongoDB, giữ nguyên nội dung tại thời điểm lưu kể cả khi danh mục thay đổi.
- **Phiếu đã lưu** xếp theo ngày xuất từ **01/09/2026**, ngày mới nhất trước. Mỗi ngày hiện **Ngày … tháng … năm …** và số phiếu xuất; bấm để mở danh sách tên người nhận, số phiếu, kho và tổng thanh toán. Chỉ hiện các ngày có phiếu. Phiếu trước mốc này vẫn được giữ trong hệ thống.
- Tìm theo số phiếu, tên người nhận hoặc số điện thoại trên toàn bộ lịch sử từ mốc trên; số đếm theo ngày phản ánh kết quả tìm kiếm. Mỗi lần tải tối đa 30 ngày và 50 phiếu trong một ngày, dùng **Xem thêm ngày trước** / **Xem thêm phiếu trong ngày** để tải tiếp. Số đếm tính trên toàn bộ phiếu phù hợp, không giới hạn ở các phiếu đã tải.
- **In phiếu / Lưu PDF** in lại cùng phiếu. **Sao chép để sửa** tạo phiếu mới với số mới; phiếu gốc giữ nguyên.
- Lưu lặp lại cùng yêu cầu không tạo bản ghi thứ hai. Bộ đếm có thể bỏ qua số nếu một yêu cầu lưu thất bại hoặc gửi đồng thời.

## Phạm vi

Quản trị viên và nhân viên kho ghi sổ chứng từ. Phiếu nhập (PNK) cộng số lượng thực nhập vào kho đã chọn. Phiếu xuất (PXK) và biên bản bàn giao độc lập (BBBG) trừ số lượng thực giao. Bản nháp, bản xem trước và lần in lại giữ nguyên số dư. Phiếu lập trước khi triển khai có thể xem và in lại mà không hồi tố số lượng.

Khi lập biên bản cho một phiếu xuất đã ghi sổ, liên kết với phiếu gốc và giữ đúng kho, sản phẩm, số lượng. Nếu giao hàng cho một đơn đã trừ tồn, liên kết chứng từ đầu tiên với mã đơn có phân bổ khớp kho và số lượng. Các chứng từ liên kết sử dụng lần trừ kho gốc. Phiếu được ghi cùng biến động tồn trong một giao dịch MongoDB. Cần replica set hoặc cụm MongoDB hỗ trợ giao dịch. Nếu bất kỳ dòng nào thiếu tồn, toàn bộ chứng từ bị từ chối.

`POST /api/stock-issues` ghi sổ. Các API đọc gồm `GET /api/stock-issues?q=...`, `GET /api/stock-issues/days?q=...&before=YYYY-MM-DD` và `GET /api/stock-issues/day?date=YYYY-MM-DD&q=...&offset=0`.

## Chạy thử riêng

`npm run demo:stock-issue` mở bản thử tại `http://127.0.0.1:5180`.

Bản thử có danh mục mẫu và lưu phiếu trong bộ nhớ đến khi tắt tiến trình. Không kết nối MongoDB và ép API về địa chỉ nội bộ, không sử dụng `VITE_API_URL` của môi trường thật. Bản nháp có mã tài khoản riêng `stock-issue-demo`.

## Nhập danh sách khách hàng

Trong **Khách hàng**, chọn nhập Excel. Hỗ trợ các cột `Họ và tên khách`, `Địa chỉ (bộ phận)`, `Địa điểm giao hàng`, `Số điện thoại` và mẫu xuất khách hàng hiện có. Khách chưa có số điện thoại vẫn được nhập; không tự bổ sung số hoặc địa chỉ còn thiếu. Thông tin liên hệ gốc được lưu cùng số đã bỏ dấu chấm/khoảng trắng và tên liên hệ.

Chạy từ backend: `npm run customers:import -- "đường dẫn file.xlsx"`. Thêm `--dry-run` để kiểm tra file trước khi kết nối database. Dùng `MONGODB_URI` đang cấu hình trong `.env`. Nhập lại cùng hồ sơ không tạo khách trùng hoặc ghi đè doanh thu, điểm và lịch sử. Các đơn vị khác nhau dùng chung số liên hệ được giữ riêng; số điện thoại không còn là khóa duy nhất của hồ sơ khách hàng. Mã nhập riêng có ràng buộc duy nhất. Backend cần khởi động lại để nhận mã mới.

Các số có độ dài bất thường được giữ nguyên và báo dòng cần kiểm tra. Khi chọn khách trên phiếu xuất kho, kiểm tra thông tin trước khi lưu/in.

## Kiểm tra và chạy bản tích hợp

- `npm run lint`
- `npm run test:stock-issue`: phép tính, tiền bằng chữ, đầu vào không hợp lệ, API với lưu trữ giả lập, chống lưu lặp. Chưa thay thế kiểm tra với MongoDB thực tế.
- `npm run build`

Sau khi đưa code lên môi trường mong muốn, cần khởi động lại backend để nạp API mới. Không dùng `npm run preview` để thay thế backend Express.
