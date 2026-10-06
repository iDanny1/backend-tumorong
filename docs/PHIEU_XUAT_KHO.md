# Lập và in phiếu xuất kho

Trong trang quản trị, chọn **Bán tại cửa hàng**. Tài khoản quản trị, bán hàng và kho đều thấy mục này.

1. Tìm khách bằng tên / số điện thoại, hoặc nhập người nhận trực tiếp.
   Có thể tìm thêm theo địa chỉ để phân biệt các khách cùng tên. Chọn khách sẽ điền địa chỉ khách hàng và địa chỉ giao hàng riêng, nếu có.
2. Chọn kho, kiểm tra ngày và lý do xuất.
   Địa chỉ kho tự điền từ danh mục, hiện ngay trong bước này và trên bản in. Có thể sửa địa chỉ cho phiếu đang lập. Trong **Quản lý kho**, dùng nút sửa kho để lưu tên/địa chỉ vào danh mục. Phiếu đã lưu giữ địa chỉ tại thời điểm lập.
3. Tìm sản phẩm theo tên / SKU / barcode. Nếu thiếu sản phẩm, chọn **Thêm hàng bằng tay**.
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
- **Phiếu đã lưu** tìm theo số phiếu, tên người nhận, số điện thoại và hiển thị 50 kết quả gần nhất.
- **In phiếu / Lưu PDF** in lại cùng phiếu. **Sao chép để sửa** tạo phiếu mới với số mới; phiếu gốc giữ nguyên.
- Lưu lặp lại cùng yêu cầu không tạo bản ghi thứ hai. Bộ đếm có thể bỏ qua số nếu một yêu cầu lưu thất bại hoặc gửi đồng thời.

## Phạm vi

Đây là chức năng lập chứng từ, **không tự trừ tồn kho, tạo đơn hàng, tăng doanh thu hay thay đổi hồ sơ khách**. Không đồng bộ AppSheet trong bản này. Chức năng dùng danh mục khách / sản phẩm / kho của backend hiện tại. Đơn vị tính và các dòng nhập tay được giữ trên phiếu.

API: `GET /api/stock-issues?q=...`, `POST /api/stock-issues`. Dữ liệu phiếu và bộ đếm nằm trong collection riêng; không sửa collection đơn hàng / sản phẩm. Việc triển khai lên môi trường thật cần giữ các biện pháp bảo vệ API của hệ thống; API này chưa bổ sung một cơ chế đăng nhập mới.

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
