# Đối chiếu và cập nhật mẫu “Bán tại cửa hàng”

Ngày rà soát: 03/10/2026.

## Đã tìm đúng mẫu

Mẫu hoạt động nằm trong ứng dụng `Zalo_Mini_App/backend`, tại `src/components/stock-issues/StockIssuePaper.tsx`; màn hình nhập liệu là `StockIssueManagement.tsx`. Tài liệu `docs/PHIEU_XUAT_KHO.md` xác nhận mục menu “Bán tại cửa hàng”. File `Documents/phiếu xuất kho.pdf` là mẫu giấy tham chiếu, có ghi Thông tư 133 và vị trí ký. File này có chữ ký sẵn nên được giữ nguyên.

Chức năng hiện tại lưu phiếu riêng, cấp số PXK và in qua trình duyệt; không có quy trình phát hành hóa đơn điện tử, ký số hay cấp mã thuế. Vì vậy, bản được sửa là phiếu nội bộ có thêm thông tin bán hàng.

## Căn cứ pháp lý

**Thông tư 99/2025/TT-BTC:** có hiệu lực từ 01/01/2026, áp dụng cho năm tài chính bắt đầu từ hoặc sau ngày này. Điều 9 cho phép tham khảo mẫu tại Phụ lục I và thiết kế thêm, sửa đổi, bổ sung chứng từ. Doanh nghiệp phải giữ nội dung theo Điều 16 Luật Kế toán và ban hành Quy chế hạch toán kế toán hoặc tài liệu tương đương, nêu lý do và trách nhiệm đối với phần sửa đổi. Điều 10 quy định lập, ký, kiểm soát chứng từ. Mẫu Phiếu xuất kho là 02-VT. Do đó, bổ sung VAT và chiết khấu không tự nó làm mẫu trái luật, nhưng cần đáp ứng các điều kiện trên. [Bản đăng Công báo](https://congbao.chinhphu.vn/van-ban/thong-tu-so-99-2025-tt-btc-46529/59631.htm), [toàn văn Điều 9–10](https://congluatviet.vn/van-ban/thong-tu-99-2025-tt-btc).

Mẫu cũ ghi Thông tư 133. Không đủ thông tin để xác định công ty đã chọn chế độ kế toán nào. Không tự đổi dòng căn cứ sang “ban hành theo Thông tư 99”. Mẫu mới ghi “Mẫu nội bộ — tham khảo mẫu 02-VT”, chờ kế toán xác nhận chế độ và tài liệu nội bộ áp dụng.

**Luật Kế toán:** Điều 16 yêu cầu tên/số chứng từ, ngày lập, tên/địa chỉ bên lập và bên nhận, nội dung nghiệp vụ, số lượng, đơn giá, số tiền, chữ ký/họ tên các bên liên quan. Điều 19 quy định thẩm quyền ký; Điều 20 dẫn chiếu hóa đơn sang pháp luật thuế. Mẫu mới giữ các trường nhận hàng, kho, số lượng yêu cầu/thực xuất và năm vị trí ký. Không đồng nhất giá bán với giá trị xuất kho hạch toán. [Luật Kế toán số 88/2015/QH13](https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=95924).

**Hóa đơn:** đã đối chiếu Điều 10 Nghị định 123/2020/NĐ-CP và phần sửa đổi bởi Nghị định 70/2025/NĐ-CP, có hiệu lực từ 01/06/2025. Hóa đơn GTGT phải thể hiện các chỉ tiêu thuế áp dụng; chiết khấu thương mại phải thể hiện rõ, căn cứ tính thuế theo luật VAT. Không áp dụng việc bỏ dòng VAT tổng của phiếu này cho hóa đơn GTGT điện tử. [Nghị định 123, Điều 10](https://thuvienphapluat.vn/van-ban/Ke-toan-Kiem-toan/Nghi-dinh-123-2020-ND-CP-quy-dinh-hoa-don-chung-tu-445980.aspx), [thay đổi theo Nghị định 70](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-70-2025-nd-cp-sua-doi-bo-sung-quy-dinh-noi-dung-cua-hoa-don-119250402145733568.htm).

**Cập nhật trong năm 2026:** Cổng Chính phủ công bố Nghị định 254/2026/NĐ-CP về hóa đơn điện tử, chứng từ điện tử, hiệu lực từ 01/07/2026. Nội dung hóa đơn tiếp tục có thuế suất, tổng thuế theo từng mức, tổng VAT và tổng thanh toán; có ngoại lệ theo loại hóa đơn. Vì ngày rà soát là 03/10/2026, không thể dùng riêng Nghị định 123 và 70 để kết luận quy định hóa đơn hiện hành. Phiếu nội bộ này không thay thế nghĩa vụ lập hóa đơn khi bán hàng. [Nghị định 254 trên Cổng Chính phủ và bản ký đính kèm](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm).

## Đã thay đổi

- VAT chọn theo từng sản phẩm: 0%, 5%, 8%, 10%; hàng mới phải chọn, không tự gán thuế suất. Mức 8% chỉ dùng khi mặt hàng đủ điều kiện, không áp dụng mặc định cho toàn bộ danh mục. Không dùng 0% để thay cho hàng không chịu thuế hoặc không phải kê khai.
- Chiết khấu sản phẩm và tổng bill nhập bằng số đồng hoặc %. Chuyển đơn vị nhập sẽ đưa chiết khấu về 0 để tránh hiểu sai.
- Chiết khấu sản phẩm tính trên tiền hàng thực xuất, trước VAT. Chiết khấu tổng bill tính tiếp trên tiền hàng sau chiết khấu sản phẩm, phân bổ theo tỷ trọng từng dòng. Phần lẻ phân bổ theo phương pháp phần dư lớn nhất, bảo đảm tổng phân bổ đúng số tiền chiết khấu.
- VAT tính trên từng dòng sau cả hai khoản chiết khấu; làm tròn đến đồng. Đây là quy ước tính của mẫu nội bộ. Khi phát hành hóa đơn, đối chiếu cách làm tròn và dữ liệu của nhà cung cấp hóa đơn.
- Bản in bỏ dòng VAT tổng và dòng tổng chiết khấu sản phẩm, giữ dòng chiết khấu tổng bill. Tên cột dùng “Đơn giá”, “Chiết khấu (đ)”, “Thành tiền”; dòng tổng dùng “Cộng tiền hàng”, “Tổng tiền thanh toán”.
- Có lựa chọn ẩn VAT (cột thuế suất và tiền VAT), ẩn chiết khấu (cột và dòng tổng bill). Bảng tự giãn; các tùy chọn chỉ đổi hiển thị, không đổi phép tính. Phiếu mới lưu cả tùy chọn; in lại phiếu theo mẫu mới có thể đổi riêng cho lần in mà không sửa bản ghi. Ghi chú trên phiếu xác nhận tổng tiền đã tính đầy đủ các khoản áp dụng.
- Giữ A4, kiểu chữ, phần đầu phiếu, thông tin giao nhận và vị trí ký. Giá bán được ghi rõ là thông tin đối chiếu thanh toán; giá trị xuất kho hạch toán theo sổ kế toán.
- Phiếu cũ giữ cách tính và bố cục khi in lại. Sao chép phiếu cũ để sửa tạo bản mới theo cách tính mới.
- Máy chủ kiểm tra VAT, chiết khấu và tính lại tiền; không nhận tổng tiền do trình duyệt gửi làm kết quả tin cậy.

## Kiểm tra và đưa vào sử dụng

Đã đạt kiểm tra kiểu dữ liệu, bản dựng ứng dụng và 19 kiểm tra tự động về phép tính, đầu vào, bốn chế độ hiển thị, API lưu phiếu, chống lưu lặp và ánh xạ AppSheet. Đã thử nhập và lưu phiếu trên giao diện với VAT 5%/8%, kiểm tra bố cục xem trước và ẩn các cột. Các kiểm tra API dùng lưu trữ giả lập, chưa kiểm tra MongoDB hoặc Google Sheets thật.

Ví dụ: tiền hàng 320.000đ; chiết khấu sản phẩm 30.000đ; chiết khấu bill 29.000đ; VAT từng dòng 8.100đ và 7.920đ; thanh toán 277.020đ.

Mã nguồn cục bộ đã cập nhật. Việc đưa lên máy chủ đang dùng cần triển khai lại giao diện và khởi động lại backend. Không phát hành hóa đơn hoặc chỉnh dữ liệu kinh doanh thật trong đợt này.

Nếu đang đồng bộ AppSheet, cấu trúc mới bổ sung cột ở cuối bảng, giữ nguyên vị trí cột cũ. Cần chạy quy trình thiết lập AppSheet của ứng dụng để thêm tiêu đề và cập nhật cấu trúc cột trong AppSheet trước khi tiếp tục đồng bộ. Không tự chạy thiết lập Google Sheets thật; cấu trúc chưa khớp sẽ báo lỗi kết nối, phiếu vẫn lưu trong ứng dụng.

Kế toán cần xác nhận chế độ kế toán đang áp dụng và ban hành tài liệu cho mẫu bổ sung trước khi dùng làm chứng từ chính thức. Đây là bước quản lý chứng từ của doanh nghiệp, không phải thủ tục xin phép chỉ để thêm cột.
