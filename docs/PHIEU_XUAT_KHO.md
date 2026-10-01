# Lập và in phiếu xuất kho

Trong trang quản trị, chọn **Bán tại cửa hàng**. Tài khoản quản trị, bán hàng và kho đều thấy mục này.

1. Tìm khách bằng tên / số điện thoại, hoặc nhập người nhận trực tiếp.
2. Chọn kho, kiểm tra ngày và lý do xuất.
3. Tìm sản phẩm theo tên / SKU / barcode. Nếu thiếu sản phẩm, chọn **Thêm hàng bằng tay**.
4. Kiểm tra đơn vị tính, số lượng yêu cầu, thực xuất và **đơn giá chưa VAT**. Giá danh mục được điền sẵn nhưng cần đối chiếu vì hệ thống cũ chưa khai báo rõ giá đã gồm VAT hay chưa.
5. Chọn **Xem phiếu & in**, kiểm tra mẫu, sau đó **Lưu phiếu & in**.
6. Trong cửa sổ in của trình duyệt, chọn máy in hoặc **Lưu dưới dạng PDF**. Dùng khổ A4, tỉ lệ 100% và tắt đầu/chân trang của trình duyệt nếu có.

Số phiếu được cấp tự động dạng `PXKYYYYMMDD-0001`. Đơn vị tính phải nhập khi danh mục chưa có. Số tiền dùng số lượng **thực xuất**, làm tròn đến đồng; VAT tính trên cộng tiền hàng. Số tiền bằng chữ được tự tạo.

Thông tin công ty và các vị trí ký theo mẫu được cung cấp. Mục **Thông tin công ty, giao hàng & người ký** cho phép điều chỉnh trước khi lưu. Người nhận là đơn vị / khách hàng; tên người ký nhận là trường riêng, có thể để trống để ký tay.

## Lưu, tìm và in lại

- Bản nháp được giữ trong trình duyệt theo tài khoản đang đăng nhập. Không đồng bộ bản nháp giữa các máy.
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

## Kiểm tra và chạy bản tích hợp

- `npm run lint`
- `npm run test:stock-issue`: phép tính, tiền bằng chữ, đầu vào không hợp lệ, API với lưu trữ giả lập, chống lưu lặp. Chưa thay thế kiểm tra với MongoDB thực tế.
- `npm run build`

Sau khi đưa code lên môi trường mong muốn, cần khởi động lại backend để nạp API mới. Không dùng `npm run preview` để thay thế backend Express.
