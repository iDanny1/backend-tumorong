import type { ContractTemplate } from './contractTypes';

export const contractTemplates: ContractTemplate[] = [
  {
    id: "tmr-purchase",
    name: "Hợp đồng nguyên tắc mua hàng TMR",
    description: "Tu Mơ Rông mua hàng của nhà cung cấp theo từng đơn đặt hàng.",
    title: "HỢP ĐỒNG NGUYÊN TẮC MUA BÁN HÀNG HÓA",
    issuerName: "CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM",
    companyRole: "Bên mua",
    partnerRole: "Bên bán",
    fields: [
      {
        key: "contractNumber",
        label: "Số hợp đồng đầy đủ",
        group: "contract",
        hint: "Định dạng: số thứ tự/năm/HĐNT-TMR"
      },
      {
        key: "signingDate",
        label: "Ngày ký hợp đồng",
        group: "contract",
        type: "date"
      },
      {
        key: "companyPhone",
        label: "Điện thoại giao dịch của TMR",
        group: "company",
        type: "tel"
      },
      {
        key: "companyEmail",
        label: "Email giao dịch của TMR",
        group: "company",
        type: "email"
      },
      {
        key: "partnerName",
        label: "Tên doanh nghiệp theo đăng ký",
        group: "partner"
      },
      {
        key: "partnerTaxId",
        label: "Mã số doanh nghiệp",
        group: "partner"
      },
      {
        key: "partnerAddress",
        label: "Địa chỉ trụ sở",
        group: "partner"
      },
      {
        key: "partnerPhone",
        label: "Điện thoại giao dịch",
        group: "partner",
        type: "tel"
      },
      {
        key: "partnerEmail",
        label: "Email giao dịch",
        group: "partner",
        type: "email"
      },
      {
        key: "partnerAccount",
        label: "Số tài khoản ngân hàng",
        group: "partner"
      },
      {
        key: "partnerBank",
        label: "Ngân hàng và chi nhánh",
        group: "partner"
      },
      {
        key: "partnerRepresentative",
        label: "Họ và tên người đại diện",
        group: "partner"
      },
      {
        key: "partnerPosition",
        label: "Chức vụ người đại diện",
        group: "partner"
      }
    ],
    intro: [
      "- Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 24/11/2015;",
      "- Căn cứ Luật Thương mại số 36/2005/QH11 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 14/06/2005;",
      "- Căn cứ Luật Bảo vệ quyền lợi người tiêu dùng, Luật An toàn thực phẩm và các văn bản hướng dẫn thi hành;",
      "- Căn cứ nhu cầu, năng lực và sự thỏa thuận tự nguyện của Hai Bên.",
      "Hôm nay, ngày [[signingDate]], tại Văn phòng Công ty Cổ phần Sâm Ngọc Linh Tu Mơ Rông Kon Tum, chúng tôi gồm có:"
    ],
    parties: {
      a: [
        "Tên doanh nghiệp: CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM",
        "Mã số doanh nghiệp: 6101196670",
        "Địa chỉ trụ sở: Làng Ko Xía 2, Xã Măng Ri, Tỉnh Quảng Ngãi, Việt Nam",
        "Văn phòng / Kho nhận: 38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, TP. Hồ Chí Minh",
        "Điện thoại: [[companyPhone]] | Email giao dịch: [[companyEmail]]",
        "Tài khoản ngân hàng: 5101201003917 – Ngân hàng Agribank - CN Đắk Tô",
        "Người đại diện: Ông TRẦN ĐỨC AN | Chức vụ: Chủ tịch HĐQT kiêm Giám đốc"
      ],
      b: [
        "Tên doanh nghiệp: [[partnerName]]",
        "Mã số doanh nghiệp: [[partnerTaxId]]",
        "Địa chỉ trụ sở: [[partnerAddress]]",
        "Điện thoại: [[partnerPhone]] | Email giao dịch: [[partnerEmail]]",
        "Tài khoản ngân hàng: [[partnerAccount]] tại [[partnerBank]]",
        "Người đại diện: [[partnerRepresentative]] | Chức vụ: [[partnerPosition]]"
      ]
    },
    partyIntro: "Sau khi bàn bạc, Hai Bên thống nhất ký kết Hợp đồng nguyên tắc mua bán hàng hóa (sau đây gọi là “Hợp đồng”) với các điều khoản và điều kiện sau:",
    companyRepresentative: "TRẦN ĐỨC AN",
    articles: [
      {
        id: "article-1",
        title: "Đối tượng Hợp đồng và Cam kết chất lượng, Pháp lý hàng hóa",
        paragraphs: [],
        children: [
          {
            id: "article-1-clause-1",
            title: "",
            paragraphs: [
              "Bên A đồng ý mua và Bên B đồng ý cung cấp các mặt hàng theo từng Đơn đặt hàng (PO) cụ thể do Bên A phát hành và được xác nhận qua văn bản/email giao dịch. Hợp đồng nguyên tắc này không áp đặt nghĩa vụ đặt mua sản lượng tối thiểu hay cam kết độc quyền đối với Bên A."
            ],
            children: []
          },
          {
            id: "article-1-clause-2",
            title: "",
            paragraphs: [
              "Bên B cam kết và chịu trách nhiệm pháp lý tuyệt đối rằng hàng hóa cung cấp là hàng mới 100%, đúng mẫu đối chứng Hai Bên đã ký duyệt, có nguồn gốc xuất xứ hợp pháp, đầy đủ hồ sơ công bố/kiểm nghiệm chất lượng, nhãn hàng hóa theo quy định tại Nghị định 43/2017/NĐ-CP và Nghị định 111/2021/NĐ-CP, không xâm phạm quyền sở hữu trí tuệ của bất kỳ bên thứ ba nào."
            ],
            children: []
          },
          {
            id: "article-1-clause-3",
            title: "",
            paragraphs: [
              "Thời hạn sử dụng còn lại của hàng hóa tại thời điểm bàn giao cho Bên A phải đạt tối thiểu 80% tổng thời hạn sử dụng ghi trên bao bì (trừ khi Đơn đặt hàng có thỏa thuận khác bằng văn bản)."
            ],
            children: []
          },
          {
            id: "article-1-clause-4",
            title: "",
            paragraphs: [
              "Bảo hành chất lượng và Lỗi ẩn: Bên B chịu trách nhiệm hoàn toàn đối với chất lượng hàng hóa trong suốt thời hạn sử dụng cam kết. Mọi rủi ro suy giảm chất lượng, biến chất hoặc lỗi kỹ thuật tiềm ẩn (“Lỗi ẩn”) không thể phát hiện bằng mắt thường tại thời điểm nhận hàng — ngay cả khi Bên A đã ký Biên bản giao nhận và đã thanh toán — nếu không xuất phát từ lỗi bảo quản sai quy chuẩn của Bên A, đều do Bên B chịu trách nhiệm đổi trả mới 100% và bồi thường toàn bộ thiệt hại thực tế phát sinh."
            ],
            children: []
          },
          {
            id: "article-1-clause-5",
            title: "",
            paragraphs: [
              "Miễn trừ và Bồi hoàn pháp lý: Trường hợp cơ quan nhà nước có thẩm quyền xử phạt, thu hồi hàng hóa hoặc bên thứ ba khiếu kiện Bên A do lỗi chất lượng, nhãn mác, nguồn gốc xuất xứ hoặc quyền sở hữu trí tuệ của hàng hóa do Bên B cung cấp, Bên B có nghĩa vụ đứng ra giải quyết và bồi hoàn 100% các khoản tiền phạt, chi phí thu hồi, kiểm nghiệm và thiệt hại thương hiệu cho Bên A."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-2",
        title: "Đặt hàng, Vận chuyển, Giao nhận và Chuyển giao rủi ro",
        paragraphs: [],
        children: [
          {
            id: "article-2-clause-1",
            title: "",
            paragraphs: [
              "Địa điểm giao hàng: Giao tại kho của Bên A tại số 38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, TP. Hồ Chí Minh (hoặc địa điểm khác theo chỉ định trên từng Đơn đặt hàng)."
            ],
            children: []
          },
          {
            id: "article-2-clause-2",
            title: "",
            paragraphs: [
              "Thời hạn giao hàng: Trong vòng 48 giờ làm việc (không tính Thứ Bảy, Chủ Nhật và ngày nghỉ lễ) kể từ thời điểm Bên B xác nhận Đơn đặt hàng của Bên A, trừ trường hợp Đơn đặt hàng có quy định thời hạn khác."
            ],
            children: []
          },
          {
            id: "article-2-clause-3",
            title: "",
            paragraphs: [
              "Chi phí vận chuyển và Chuyển giao rủi ro: Bên B chịu 100% chi phí đóng gói, vận chuyển, bảo hiểm hàng hóa đến địa điểm giao hàng của Bên A. Chi phí bốc dỡ tại kho của Bên nào thì Bên đó chịu. Mọi rủi ro về mất mát, hư hỏng, bể vỡ hàng hóa chỉ chuyển sang Bên A sau khi đại diện có thẩm quyền của Bên A ký xác nhận vào Biên bản giao nhận hàng hóa đạt yêu cầu."
            ],
            children: []
          },
          {
            id: "article-2-clause-4",
            title: "",
            paragraphs: [
              "Kiểm nhận và Đổi trả hàng lỗi: Tại thời điểm giao hàng, Bên A kiểm tra ngoại quan và số lượng kiện. Đối với hàng đóng thùng kín, Bên A có quyền kiểm tra chi tiết bên trong trong vòng 05 (năm) ngày làm việc kể từ ngày nhận hàng. Việc ký nhận trên vận đơn/phiếu giao hàng không mặc nhiên xác lập nghiệm thu chất lượng. Nếu phát hiện hàng hóa sai quy cách, thiếu hụt, bể vỡ hoặc không đúng mẫu duyệt, Bên A thông báo (kèm hình ảnh/video) và có quyền từ chối nhận hoặc yêu cầu đổi trả; Bên B có nghĩa vụ tự chi trả chi phí thu hồi hàng lỗi và giao bù đủ hàng đạt chuẩn cho Bên A trong vòng 03 (ba) ngày làm việc kể từ khi nhận thông báo."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-3",
        title: "Giá cả, Hồ sơ thanh toán và Quyền cấn trừ",
        paragraphs: [],
        children: [
          {
            id: "article-3-clause-1",
            title: "",
            paragraphs: [
              "Đơn giá hàng hóa và thuế suất thuế GTGT được xác định cụ thể trên từng Đơn đặt hàng hoặc Bảng báo giá được Bên A phê duyệt bằng văn bản/email. Bên B không được tự ý tăng giá đối với các Đơn đặt hàng đã xác nhận."
            ],
            children: []
          },
          {
            id: "article-3-clause-2",
            title: "",
            paragraphs: [
              "Thời hạn và Phương thức thanh toán: Trừ khi Đơn đặt hàng có thỏa thuận khác về đặt cọc, Bên A thanh toán 100% giá trị hàng hóa thực nhận đạt chuẩn bằng chuyển khoản vào tài khoản ngân hàng hợp pháp đứng tên pháp nhân Bên B trong vòng 15 (mười lăm) ngày làm việc kể từ ngày Bên A nhận đủ hàng hóa đạt yêu cầu và nhận đủ Bộ hồ sơ thanh toán hợp lệ."
            ],
            children: []
          },
          {
            id: "article-3-clause-3",
            title: "",
            paragraphs: [
              "Bộ hồ sơ thanh toán hợp lệ do Bên B cung cấp bao gồm: (i) Đơn đặt hàng (PO) đã được xác nhận; (ii) Biên bản giao nhận và nghiệm thu hàng hóa có chữ ký xác nhận của hai bên (không có ghi chú hàng lỗi chưa khắc phục); (iii) Hóa đơn GTGT điện tử hợp pháp, hợp lệ theo đúng quy định tại Nghị định 123/2020/NĐ-CP và Nghị định 70/2025/NĐ-CP; và (iv) Bản sao y chứng nhận chất lượng/xuất xứ lô hàng (COA/hồ sơ công bố nếu có yêu cầu). Nếu hồ sơ thiếu hoặc sai sót, thời hạn thanh toán được tính lại từ ngày Bên B bổ sung hoàn chỉnh mà Bên A không phải chịu bất kỳ khoản lãi chậm trả nào."
            ],
            children: []
          },
          {
            id: "article-3-clause-4",
            title: "",
            paragraphs: [
              "Quyền tạm giữ và Cấn trừ công nợ: Theo Điều 378 Bộ luật Dân sự 2015, trường hợp hàng hóa có sai lệch chất lượng hoặc Bên B phát sinh nghĩa vụ trả tiền phạt vi phạm, bồi thường thiệt hại, chi phí đổi trả cho Bên A, Bên A có toàn quyền tạm giữ khoản thanh toán tương ứng hoặc tự động khấu trừ/cấn trừ trực tiếp các khoản tiền này vào bất kỳ khoản công nợ nào phải trả cho Bên B sau khi gửi thông báo bằng văn bản/email."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-4",
        title: "Đặt cọc, Phạt vi phạm và Bồi thường thiệt hại",
        paragraphs: [],
        children: [
          {
            id: "article-4-clause-1",
            title: "",
            paragraphs: [
              "Trường hợp Bên B vi phạm bất kỳ nghĩa vụ nào về tiến độ, số lượng, chất lượng hoặc hồ sơ pháp lý hàng hóa theo Hợp đồng và Đơn đặt hàng, Bên A có quyền áp dụng mức phạt vi phạm là 08% (tám phần trăm) giá trị phần nghĩa vụ hợp đồng bị vi phạm và yêu cầu Bên B bồi thường toàn bộ thiệt hại thực tế, trực tiếp phát sinh (bao gồm chi phí lưu kho, kiểm định độc lập, thu hồi, thiệt hại do gián đoạn kinh doanh hoặc bị đối tác của Bên A phạt)."
            ],
            children: []
          },
          {
            id: "article-4-clause-2",
            title: "",
            paragraphs: [
              "Xử lý vi phạm tiến độ và Tiền đặt cọc: Trường hợp Đơn đặt hàng có thỏa thuận Bên A đặt cọc cho Bên B, nếu Bên B chậm giao hàng hoặc chậm giao bù hàng đạt chuẩn quá 07 (bảy) ngày làm việc so với thời hạn cam kết (không do Sự kiện bất khả kháng), Bên A có quyền đơn phương hủy Đơn đặt hàng ngay lập tức; khi đó Bên B phải hoàn trả 100% số tiền đặt cọc đã nhận và chịu một khoản tiền phạt cọc tương đương số tiền đặt cọc (theo Điều 328 Bộ luật Dân sự 2015) hoặc chịu phạt 8% giá trị đơn hàng hủy kèm bồi thường thiệt hại thực tế theo lựa chọn của Bên A trong vòng 05 (năm) ngày làm việc kể từ ngày nhận thông báo."
            ],
            children: []
          },
          {
            id: "article-4-clause-3",
            title: "",
            paragraphs: [
              "Thời hạn thanh toán tiền phạt và bồi thường thiệt hại là 07 (bảy) ngày làm việc kể từ ngày Bên bị vi phạm gửi thông báo yêu cầu kèm căn cứ xác định vi phạm."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-5",
        title: "Giải quyết tranh chấp và Giá trị chứng cứ điện tử",
        paragraphs: [],
        children: [
          {
            id: "article-5-clause-1",
            title: "",
            paragraphs: [
              "Giá trị pháp lý của dữ liệu điện tử: Hai Bên thống nhất mọi thông báo, Đơn đặt hàng, xác nhận mẫu, khiếu nại hàng lỗi kèm hình ảnh/video được gửi qua địa chỉ Email hoặc tài khoản liên lạc của người đại diện/đầu mối được chỉ định tại Hợp đồng này là Thông điệp dữ liệu hợp pháp theo Luật Giao dịch điện tử 2023 và là nguồn chứng cứ hợp lệ trước Tòa án mà không cần lập vi bằng bổ sung."
            ],
            children: []
          },
          {
            id: "article-5-clause-2",
            title: "",
            paragraphs: [
              "Khi phát sinh tranh chấp, Hai Bên ưu tiên thương lượng giải quyết trong vòng 15 (mười lăm) ngày kể từ ngày một Bên thông báo bằng văn bản. Trường hợp thương lượng không thành, căn cứ Điểm g Khoản 1 Điều 40 Bộ luật Tố tụng dân sự 2015, Hai Bên thống nhất lựa chọn Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh (nơi thực hiện Hợp đồng giao nhận hàng hóa) để giải quyết."
            ],
            children: []
          },
          {
            id: "article-5-clause-3",
            title: "",
            paragraphs: [
              "Án phí, chi phí giám định/kiểm nghiệm độc lập, chi phí thẩm định tại chỗ và các chi phí tố tụng hợp lệ do Bên thua kiện chịu."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-6",
        title: "Hiệu lực, Chấm dứt hợp đồng và Điều khoản chung",
        paragraphs: [],
        children: [
          {
            id: "article-6-clause-1",
            title: "",
            paragraphs: [
              "Hợp đồng này có hiệu lực 01 (một) năm kể từ ngày ký và tự động gia hạn từng kỳ 01 (một) năm tiếp theo nếu trước ngày hết hạn ít nhất 15 (mười lăm) ngày không Bên nào gửi văn bản thông báo chấm dứt."
            ],
            children: []
          },
          {
            id: "article-6-clause-2",
            title: "",
            paragraphs: [
              "Một Bên có quyền đơn phương chấm dứt Hợp đồng trước thời hạn bằng văn bản thông báo trước ít nhất 15 (mười lăm) ngày làm việc, hoặc chấm dứt ngay lập tức nếu Bên kia vi phạm nghiêm trọng nghĩa vụ chất lượng/pháp lý hàng hóa mà không khắc phục trong 05 (năm) ngày làm việc. Khi chấm dứt Hợp đồng, các nghĩa vụ bảo hành chất lượng hàng hóa còn hạn sử dụng, thanh toán/hoàn cọc và bồi thường vẫn tiếp tục có hiệu lực thi hành."
            ],
            children: []
          },
          {
            id: "article-6-clause-3",
            title: "",
            paragraphs: [
              "Mọi sửa đổi, bổ sung Hợp đồng phải lập thành Phụ lục bằng văn bản có chữ ký hợp lệ của đại diện có thẩm quyền Hai Bên. Bên B không được chuyển giao quyền, nghĩa vụ theo Hợp đồng cho bên thứ ba nếu chưa có chấp thuận bằng văn bản của Bên A."
            ],
            children: []
          },
          {
            id: "article-6-clause-4",
            title: "",
            paragraphs: [
              "Hợp đồng được lập thành 04 (bốn) bản chính bằng tiếng Việt có giá trị pháp lý như nhau, mỗi Bên giữ 02 (hai) bản để thực hiện."
            ],
            children: []
          }
        ]
      }
    ],
    closing: [],
    annexes: []
  },
  {
    id: "tmr-processing",
    name: "Hợp đồng khung gia công TMR",
    description: "Tu Mơ Rông đặt gia công, kèm phụ lục kỹ thuật và đơn đặt gia công.",
    title: "HỢP ĐỒNG KHUNG GIA CÔNG HÀNG HÓA",
    issuerName: "CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM",
    companyRole: "Bên đặt gia công",
    partnerRole: "Bên nhận gia công",
    fields: [
      {
        key: "contractNumber",
        label: "Số hợp đồng đầy đủ",
        group: "contract",
        hint: "Định dạng: số thứ tự/năm/HĐKGC-TMR"
      },
      {
        key: "signingDate",
        label: "Ngày ký hợp đồng",
        group: "contract",
        type: "date"
      },
      {
        key: "signingLocation",
        label: "Địa điểm ký hợp đồng",
        group: "contract"
      },
      {
        key: "companyPhone",
        label: "Điện thoại giao dịch của TMR",
        group: "company",
        type: "tel"
      },
      {
        key: "companyEmail",
        label: "Email giao dịch của TMR",
        group: "company",
        type: "email"
      },
      {
        key: "partnerName",
        label: "Tên doanh nghiệp theo đăng ký",
        group: "partner"
      },
      {
        key: "partnerTaxId",
        label: "Mã số doanh nghiệp",
        group: "partner"
      },
      {
        key: "partnerAddress",
        label: "Địa chỉ trụ sở",
        group: "partner"
      },
      {
        key: "partnerPhone",
        label: "Điện thoại giao dịch",
        group: "partner",
        type: "tel"
      },
      {
        key: "partnerEmail",
        label: "Email giao dịch",
        group: "partner",
        type: "email"
      },
      {
        key: "partnerAccount",
        label: "Số tài khoản ngân hàng",
        group: "partner"
      },
      {
        key: "partnerBank",
        label: "Ngân hàng và chi nhánh",
        group: "partner"
      },
      {
        key: "partnerRepresentative",
        label: "Họ và tên người đại diện",
        group: "partner"
      },
      {
        key: "partnerPosition",
        label: "Chức vụ người đại diện",
        group: "partner"
      },
      {
        key: "factoryAddress",
        label: "Địa chỉ nhà máy sản xuất",
        group: "partner"
      },
      {
        key: "annexDate",
        label: "PL01 · Ngày lập phụ lục",
        group: "annex",
        type: "date"
      },
      {
        key: "productCode",
        label: "PL01 · Mã sản phẩm",
        group: "annex"
      },
      {
        key: "formulaVersion",
        label: "PL01 · Phiên bản công thức",
        group: "annex",
        type: "text",
        defaultValue: "v1.0"
      },
      {
        key: "productName",
        label: "PL01 · Tên thương mại của sản phẩm",
        group: "annex"
      },
      {
        key: "productCategory",
        label: "PL01 · Nhóm pháp lý sản phẩm",
        group: "annex"
      },
      {
        key: "factoryLicense",
        label: "PL01 · Số giấy chứng nhận hoặc giấy phép nhà máy",
        group: "annex"
      },
      {
        key: "formulaCode",
        label: "PL01 · Mã công thức",
        group: "annex"
      },
      {
        key: "formulaApprovalDate",
        label: "PL01 · Ngày duyệt công thức",
        group: "annex",
        type: "date"
      },
      {
        key: "referenceSampleCode",
        label: "PL01 · Mã mẫu đối chứng lưu tại hai bên",
        group: "annex"
      },
      {
        key: "packageFill",
        label: "PL01 · Thể tích hoặc khối lượng đóng gói (ví dụ 750 ml)",
        group: "annex"
      },
      {
        key: "packageUnits",
        label: "PL01 · Số đơn vị/hộp",
        group: "annex"
      },
      {
        key: "cartonBoxes",
        label: "PL01 · Số hộp/thùng",
        group: "annex"
      },
      {
        key: "shelfLifeMonths",
        label: "PL01 · Hạn sử dụng (tháng)",
        group: "annex"
      },
      {
        key: "storageTemperature",
        label: "PL01 · Nhiệt độ bảo quản tối đa (°C)",
        group: "annex"
      },
      {
        key: "storageHumidity",
        label: "PL01 · Độ ẩm bảo quản tối đa (%)",
        group: "annex"
      },
      {
        key: "retainedSampleCount",
        label: "PL01 · Số mẫu đối chứng tối thiểu mỗi lô",
        group: "annex"
      },
      {
        key: "companyQaName",
        label: "PL01 · Họ tên đầu mối QA Bên A",
        group: "annex"
      },
      {
        key: "companyQaContact",
        label: "PL01 · Điện thoại hoặc email đầu mối QA Bên A",
        group: "annex"
      },
      {
        key: "partnerQaName",
        label: "PL01 · Họ tên đầu mối QA Bên B",
        group: "annex"
      },
      {
        key: "partnerQaContact",
        label: "PL01 · Điện thoại hoặc email đầu mối QA Bên B",
        group: "annex"
      },
      {
        key: "ginsengRate",
        label: "PL01 · Định mức nguyên liệu sâm trên một sản phẩm (ví dụ 5 g)",
        group: "annex"
      },
      {
        key: "ginsengLoss",
        label: "PL01 · Hao hụt sâm tối đa (%)",
        group: "annex"
      },
      {
        key: "auxiliarySupplier",
        label: "PL01 · Bên cấp phụ liệu hoặc nền rượu (A hoặc B)",
        group: "annex",
        choices: ["A", "B"]
      },
      {
        key: "auxiliaryRate",
        label: "PL01 · Định mức phụ liệu trên một sản phẩm (ví dụ 100 ml)",
        group: "annex"
      },
      {
        key: "auxiliaryLoss",
        label: "PL01 · Hao hụt phụ liệu tối đa (%)",
        group: "annex"
      },
      {
        key: "bottleSupplier",
        label: "PL01 · Bên cấp chai, lọ, nắp, màng co (A hoặc B)",
        group: "annex",
        choices: ["A", "B"]
      },
      {
        key: "bottleLoss",
        label: "PL01 · Hao hụt chai, lọ, nắp, màng co tối đa (%)",
        group: "annex"
      },
      {
        key: "labelSupplier",
        label: "PL01 · Bên cấp tem, nhãn (A hoặc B)",
        group: "annex",
        choices: ["A", "B"]
      },
      {
        key: "cartonSupplier",
        label: "PL01 · Bên cấp hộp, thùng carton (A hoặc B)",
        group: "annex",
        choices: ["A", "B"]
      },
      {
        key: "cartonLoss",
        label: "PL01 · Hao hụt hộp, thùng tối đa (%)",
        group: "annex"
      },
      {
        key: "purchaseOrderNumber",
        label: "PL02 · Số đơn đặt gia công đầy đủ",
        group: "annex",
        hint: "Định dạng: số thứ tự/năm/PO-TMR"
      },
      {
        key: "materialHandoverDate",
        label: "PL02 · Ngày bàn giao vật tư",
        group: "annex",
        type: "date"
      },
      {
        key: "finishedGoodsDueDate",
        label: "PL02 · Hạn giao thành phẩm và hồ sơ lô",
        group: "annex",
        type: "date"
      },
      {
        key: "quantityTolerance",
        label: "PL02 · Dung sai số lượng (%)",
        group: "annex"
      },
      {
        key: "freightParty",
        label: "PL02 · Bên chịu phí vận chuyển (A hoặc B)",
        group: "annex",
        choices: ["A", "B"]
      },
      {
        key: "advancePercent",
        label: "PL02 · Tỷ lệ tạm ứng (%)",
        group: "annex"
      },
      {
        key: "advanceAmount",
        label: "PL02 · Số tiền tạm ứng (VNĐ)",
        group: "annex"
      },
      {
        key: "settlementPercent",
        label: "PL02 · Tỷ lệ quyết toán (%)",
        group: "annex"
      },
      {
        key: "firstItemName",
        label: "PL02 · Dòng 1 · Tên thành phẩm",
        group: "annex"
      },
      {
        key: "firstItemStandard",
        label: "PL02 · Dòng 1 · Mã tiêu chuẩn",
        group: "annex"
      },
      {
        key: "firstItemUnit",
        label: "PL02 · Dòng 1 · Đơn vị tính",
        group: "annex",
        type: "text",
        defaultValue: "Chai/Hộp"
      },
      {
        key: "firstItemQuantity",
        label: "PL02 · Dòng 1 · Số lượng đặt",
        group: "annex"
      },
      {
        key: "firstItemUnitPrice",
        label: "PL02 · Dòng 1 · Đơn giá chưa thuế (VNĐ)",
        group: "annex"
      },
      {
        key: "firstItemAmount",
        label: "PL02 · Dòng 1 · Thành tiền chưa thuế (VNĐ)",
        group: "annex"
      },
      {
        key: "secondItemName",
        label: "PL02 · Dòng 2 · Tên thành phẩm",
        group: "annex"
      },
      {
        key: "secondItemStandard",
        label: "PL02 · Dòng 2 · Mã tiêu chuẩn",
        group: "annex"
      },
      {
        key: "secondItemUnit",
        label: "PL02 · Dòng 2 · Đơn vị tính",
        group: "annex",
        type: "text",
        defaultValue: "Chai/Hộp"
      },
      {
        key: "secondItemQuantity",
        label: "PL02 · Dòng 2 · Số lượng đặt",
        group: "annex"
      },
      {
        key: "secondItemUnitPrice",
        label: "PL02 · Dòng 2 · Đơn giá chưa thuế (VNĐ)",
        group: "annex"
      },
      {
        key: "secondItemAmount",
        label: "PL02 · Dòng 2 · Thành tiền chưa thuế (VNĐ)",
        group: "annex"
      },
      {
        key: "subtotal",
        label: "PL02 · Cộng tiền dịch vụ gia công chưa thuế (VNĐ)",
        group: "annex"
      },
      {
        key: "vatRate",
        label: "PL02 · Thuế suất GTGT (%)",
        group: "annex"
      },
      {
        key: "vatAmount",
        label: "PL02 · Tiền thuế GTGT (VNĐ)",
        group: "annex"
      },
      {
        key: "totalAmount",
        label: "PL02 · Tổng giá trị đã gồm thuế (VNĐ)",
        group: "annex"
      }
    ],
    intro: [
      "- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;",
      "- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 06 năm 2005;",
      "- Căn cứ Luật An toàn thực phẩm, Nghị định 15/2018/NĐ-CP, Nghị định 43/2017/NĐ-CP và Nghị định 111/2021/NĐ-CP về nhãn hàng hóa;",
      "- Căn cứ nhu cầu đặt gia công của Bên A và năng lực sản xuất đủ điều kiện pháp lý của Bên B.",
      "Hôm nay, ngày [[signingDate]], tại [[signingLocation]], chúng tôi gồm có:"
    ],
    parties: {
      a: [
        "Tên doanh nghiệp: CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM",
        "Mã số doanh nghiệp: 6101196670",
        "Địa chỉ trụ sở: Làng Ko Xía 2, Xã Măng Ri, Tỉnh Quảng Ngãi, Việt Nam",
        "Địa chỉ nhận hàng/GD: 38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, TP. Hồ Chí Minh",
        "Điện thoại: [[companyPhone]] | Email giao dịch: [[companyEmail]]",
        "Tài khoản ngân hàng: 5101201003917 – Ngân hàng Agribank - CN Đắk Tô",
        "Người đại diện: Ông TRẦN ĐỨC AN | Chức vụ: Chủ tịch HĐQT kiêm Giám đốc"
      ],
      b: [
        "Tên doanh nghiệp: [[partnerName]]",
        "Mã số doanh nghiệp: [[partnerTaxId]]",
        "Địa chỉ trụ sở: [[partnerAddress]]",
        "Địa chỉ nhà máy SX: [[factoryAddress]]",
        "Điện thoại: [[partnerPhone]] | Email giao dịch: [[partnerEmail]]",
        "Tài khoản ngân hàng: [[partnerAccount]] tại [[partnerBank]]",
        "Người đại diện: [[partnerRepresentative]] | Chức vụ: [[partnerPosition]]"
      ]
    },
    partyIntro: "Hai Bên thống nhất ký kết Hợp đồng khung gia công hàng hóa (sau đây gọi là “Hợp đồng”) với các điều khoản chặt chẽ sau:",
    companyRepresentative: "TRẦN ĐỨC AN",
    articles: [
      {
        id: "article-1",












        
        title: "Giải thích từ ngữ và Thứ tự ưu tiên áp dụng hồ sơ",
        paragraphs: [],
        children: [
          {
            id: "article-1-clause-1",
            title: "",
            paragraphs: [
              "“Hợp đồng” gồm văn bản Hợp đồng khung này, các Phụ lục sửa đổi/bổ sung được ký hợp lệ, Phụ lục 01 (Thông số sản phẩm & Phân công trách nhiệm) và các Đơn đặt gia công (Phụ lục 02) đã được xác nhận theo Điều [[ref:article-2]]."
            ],
            children: []
          },
          {
            id: "article-1-clause-2",
            title: "",
            paragraphs: [
              "“Đơn hàng” là Đơn đặt gia công do Bên A phát hành và Bên B xác nhận, ghi rõ số lượng, đơn giá, lịch giao cho một hoặc nhiều lô sản xuất. “Ngày làm việc” là các ngày từ Thứ Hai đến Thứ Sáu, trừ ngày nghỉ lễ, Tết theo quy định pháp luật Việt Nam."
            ],
            children: []
          },
          {
            id: "article-1-clause-3",
            title: "",
            paragraphs: [
              "“Vật tư” gồm nguyên liệu quý (Sâm Ngọc Linh, dược liệu và các nguyên liệu quý khác), phụ liệu, bao bì, chai lọ, tem nhãn và vật liệu đóng gói. “Lô” là lượng sản phẩm sản xuất trong cùng điều kiện xác định và có mã riêng để truy xuất nguồn gốc. “Thành phẩm” là hàng hóa hoàn thành đầy đủ các công đoạn gia công, đóng gói đạt chuẩn theo thỏa thuận."
            ],
            children: []
          },
          {
            id: "article-1-clause-4",
            title: "",
            paragraphs: [
              "“Tiêu chuẩn sản phẩm” là bộ tài liệu được Hai Bên phê duyệt tại Phụ lục 01 cho từng mã hàng, gồm công thức, định lượng hoạt chất/hàm lượng Sâm, quy cách, mẫu đối chứng, chỉ tiêu kiểm nghiệm, nhãn duyệt, điều kiện bảo quản, hạn sử dụng và hồ sơ công bố."
            ],
            children: []
          },
          {
            id: "article-1-clause-5",
            title: "",
            paragraphs: [
              "“COA” là phiếu kết quả kiểm nghiệm/phân tích theo lô. “Lỗi ẩn” là bất kỳ sai lệch chất lượng, an toàn, tạp chất, vi sinh hoặc sai hụt hàm lượng nào bắt nguồn từ Vật tư do Bên B cấp hoặc quá trình gia công của Bên B trước khi bàn giao nhưng khó phát hiện bằng kiểm tra cảm quan thông thường khi nhận hàng."
            ],
            children: []
          },
          {
            id: "article-1-clause-6",
            title: "",
            paragraphs: [
              "Thứ tự ưu tiên: Trường hợp có mâu thuẫn giữa các tài liệu, thứ tự ưu tiên áp dụng giảm dần như sau: (i) Phụ lục sửa đổi điều khoản chung do đại diện pháp luật Hai Bên ký; (ii) Hợp đồng khung này; (iii) Phụ lục 01 (Thông số sản phẩm); và (iv) Đơn hàng đã xác nhận (chỉ chi phối về số lượng, lịch giao, đơn giá của đợt đó, không làm thay đổi trách nhiệm pháp lý tại Hợp đồng khung)."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-2",
        title: "Phạm vi gia công và Xác nhận Đơn hàng",
        paragraphs: [],
        children: [
          {
            id: "article-2-clause-1",
            title: "",
            paragraphs: [
              "Bên A đặt và Bên B nhận gia công, chế biến, chiết rót, đóng gói hoàn thiện Thành phẩm theo từng Đơn hàng. Hợp đồng khung này không tạo ra cam kết sản lượng đặt hàng tối thiểu hay quyền gia công độc quyền cho Bên B."
            ],
            children: []
          },
          {
            id: "article-2-clause-2",
            title: "",
            paragraphs: [
              "Trước khi sản xuất thương mại, Hai Bên phải ký Phụ lục 01 và xác nhận Đơn hàng (theo mẫu Phụ lục 02) bằng văn bản hoặc qua email đầu mối được ủy quyền. Mọi dự báo nhu cầu (forecast), báo giá đơn phương hoặc sự im lặng của Bên A không làm phát sinh nghĩa vụ đặt hàng."
            ],
            children: []
          },
          {
            id: "article-2-clause-3",
            title: "",
            paragraphs: [
              "Mọi đề xuất điều chỉnh lịch giao, nguồn vật tư hoặc quy trình phải được Bên A chấp thuận trước bằng văn bản. Khi có nguy cơ chậm tiến độ, Bên B phải cảnh báo bằng văn bản trong vòng 24 giờ kể từ khi phát sinh sự kiện kèm phương án khắc phục nhưng không miễn trừ trách nhiệm chậm giao hàng của Bên B."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-3",
        title: "Quản lý Vật tư, Chứng từ đi đường, Định mức hao hụt và Tiêu hủy",
        paragraphs: [],
        children: [
          {
            id: "article-3-clause-1",
            title: "",
            paragraphs: [
              "Chứng từ bàn giao và Kiểm nhận Vật tư: Phụ lục 01 xác định rõ danh mục Vật tư do mỗi Bên cung cấp. Khi Bên A xuất Vật tư (đặc biệt là nguyên liệu Sâm Ngọc Linh, dược liệu, bao bì) giao cho Bên B, Bên A lập Phiếu xuất kho kiêm vận chuyển nội bộ/gửi gia công hợp lệ (theo Nghị định 123/2020/NĐ-CP) kèm Biên bản bàn giao và hồ sơ nguồn gốc lô nguyên liệu để lưu thông hợp pháp trên đường và lưu kho tại nhà máy Bên B. Bên B có nghĩa vụ kiểm tra số lượng, niêm phong, cảm quan, hồ sơ ngay khi nhận; nếu phát hiện bất thường phải lập biên bản cách ly và báo ngay cho Bên A trước khi đưa vào sản xuất."
            ],
            children: []
          },
          {
            id: "article-3-clause-2",
            title: "",
            paragraphs: [
              "Đối với Vật tư do Bên B cung ứng: Bên B chịu trách nhiệm 100% về nguồn gốc xuất xứ, hóa đơn chứng từ đầu vào, tiêu chuẩn vệ sinh an toàn thực phẩm (đạt chuẩn dùng cho thực phẩm/dược phẩm), kể cả khi nhà cung cấp đó nằm trong danh sách được Bên A chấp thuận. Nghiêm cấm tự ý thay đổi nhà cung cấp hoặc thông số kỹ thuật Vật tư khi chưa có văn bản đồng ý của Bên A."
            ],
            children: []
          },
          {
            id: "article-3-clause-3",
            title: "",
            paragraphs: [
              "Bảo lưu quyền sở hữu Vật tư: Toàn bộ nguyên liệu, bao bì, tem nhãn, khuôn mẫu do Bên A bàn giao thuộc quyền sở hữu tuyệt đối của Bên A trong suốt quá trình nằm tại kho/nhà máy của Bên B. Bên B phải lưu trữ tại khu vực riêng biệt, gắn thẻ nhận diện theo mã lô của Bên A, mở sổ theo dõi nhập - xuất - tồn độc lập và chịu trách nhiệm bồi thường 100% theo giá thị trường tại thời điểm đền bù nếu để xảy ra mất mát, thất thoát, đánh tráo hoặc hư hỏng do bảo quản sai điều kiện."
            ],
            children: []
          },
          {
            id: "article-3-clause-4",
            title: "",
            paragraphs: [
              "Đối soát định mức hao hụt và Quy trình tiêu hủy chuẩn Thuế – Môi trường: Kết thúc mỗi lô sản xuất, Bên B phải lập Bảng quyết toán Vật tư (đầu vào - thực dùng - hao hụt - thành phẩm đạt - phế phẩm - tồn cuối). Mọi tỷ lệ hao hụt vượt quá Ngưỡng hao hụt cho phép tại Phụ lục 01 đều do Bên B bồi thường bằng nguyên liệu cùng phẩm cấp được Bên A duyệt hoặc khấu trừ trực tiếp bằng tiền theo giá mua mới có hóa đơn của Bên A. Toàn bộ phế phẩm, bán thành phẩm lỗi và bao bì/nhãn mác dư hỏng mang thương hiệu Bên A phải được niêm phong cách ly, hoàn trả cho Bên A hoặc tiêu hủy thông qua đơn vị có chức năng xử lý chất thải môi trường hợp pháp theo chỉ định bằng văn bản của Bên A (bắt buộc có Quyết định tiêu hủy, Biên bản kiểm kê tiêu hủy có chữ ký hai bên, video giám sát hủy biến dạng hoàn toàn nhãn mác và Hóa đơn xử lý chất thải hợp lệ để phục vụ quyết toán Thuế)."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-4",
        title: "Điều kiện sản xuất, Ghi nhãn OEM và Quyền kiểm tra đột xuất",
        paragraphs: [],
        children: [
          {
            id: "article-4-clause-1",
            title: "",
            paragraphs: [
              "Bên B cam kết duy trì đầy đủ và còn hiệu lực toàn bộ Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm / chứng nhận GMP / ISO / Giấy phép sản xuất rượu (tùy nhóm sản phẩm gia công) trong suốt thời hạn Hợp đồng, thực hiện nghiêm chế độ kiểm soát vệ sinh, chống nhiễm chéo và lưu mẫu đối chứng tối thiểu bằng thời hạn sử dụng cộng thêm 06 tháng."
            ],
            children: []
          },
          {
            id: "article-4-clause-2",
            title: "",
            paragraphs: [
              "Nghiêm cấm gia công lại (Sub-contracting): Bên B tuyệt đối không được thay đổi công thức, rút bớt định lượng nguyên liệu của Bên A, đổi địa điểm nhà máy hoặc giao một phần/toàn bộ công đoạn gia công cho bất kỳ bên thứ ba nào nếu không có văn bản chấp thuận trước của đại diện pháp luật Bên A."
            ],
            children: []
          },
          {
            id: "article-4-clause-3",
            title: "",
            paragraphs: [
              "Quyền kiểm tra, giám sát tại chỗ: Đại diện Bên A có quyền trực tiếp có mặt giám sát công đoạn phối trộn/nạp nguyên liệu Sâm quý và kiểm tra kho bãi, hồ sơ lô sản xuất tại nhà máy của Bên B (báo trước 24 giờ đối với kiểm tra định kỳ hoặc kiểm tra ngay lập tức khi có dấu hiệu vi phạm chất lượng/tráo đổi nguyên liệu). Việc Bên A kiểm tra hoặc duyệt mẫu không làm miễn trừ hay giảm nhẹ trách nhiệm pháp lý của Bên B về chất lượng sản phẩm."
            ],
            children: []
          },
          {
            id: "article-4-clause-4",
            title: "",
            paragraphs: [
              "Pháp lý Công bố và Ghi nhãn hàng hóa đúng chuẩn Nghị định 43/2017/NĐ-CP & 111/2021/NĐ-CP: Bên A là thương nhân đứng tên Bản tự công bố / Giấy tiếp nhận đăng ký bản công bố sản phẩm (nếu ủy quyền cho Bên B nộp hồ sơ hành chính thì Bên A vẫn là chủ thể đứng tên trên hồ sơ). Nội dung nhãn sản phẩm tại Phụ lục 01 bắt buộc thể hiện đầy đủ, minh bạch cả thông tin “Thương nhân chịu trách nhiệm về chất lượng và phân phối sản phẩm (Bên A)” và “Sản xuất tại / Cơ sở sản xuất (Bên B)” khớp 100% với hồ sơ công bố."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-5",
        title: "Giao hàng, Nghiệm thu chặt chẽ và Trách nhiệm Lỗi ẩn",
        paragraphs: [],
        children: [
          {
            id: "article-5-clause-1",
            title: "",
            paragraphs: [
              "Bên B giao Thành phẩm đúng tiến độ, địa điểm, hạn sử dụng còn lại tối thiểu đạt 90% và kèm đầy đủ bộ hồ sơ lô gồm: (i) Phiếu xuất kho/Biên bản bàn giao theo mã lô; (ii) Phiếu kết quả kiểm nghiệm đạt chuẩn (COA) của phòng kiểm nghiệm đạt chuẩn ISO/IEC 17025 theo Phụ lục 01; và (iii) Bảng quyết toán đối soát Vật tư, tem nhãn của lô hàng. Bên B chịu mọi rủi ro cho đến khi bàn giao xong lên phương tiện/kho nhận của Bên A tại địa điểm thỏa thuận."
            ],
            children: []
          },
          {
            id: "article-5-clause-2",
            title: "",
            paragraphs: [
              "Quy trình nghiệm thu (Im lặng không đồng nghĩa chấp nhận):",
              "a) Phiếu giao nhận tại kho chỉ xác nhận số lượng kiện ngoại quan, không có giá trị xác nhận nghiệm thu chất lượng. Trong thời hạn nghiệm thu chuẩn dưới đây kể từ ngày nhận đủ hàng và đủ hồ sơ lô hợp lệ, Bên A tiến hành kiểm tra chất lượng và gửi Văn bản xác nhận nghiệm thu hoặc Thông báo sai lệch:",
              "• Thời hạn nghiệm thu của Bên A: 07 (bảy) ngày làm việc (hoặc kéo dài hơn theo thời gian chờ kết quả kiểm nghiệm độc lập nếu Bên A lấy mẫu gửi kiểm).",
              "• Thời hạn Bên A phản hồi khi Bên B gửi văn bản nhắc xác nhận nghiệm thu: 03 (ba) ngày làm việc. Hết thời hạn trên mà chưa có văn bản nghiệm thu cũng không mặc nhiên coi là hàng hóa đã đạt chất lượng nếu thực tế hàng hóa không đạt Tiêu chuẩn sản phẩm."
            ],
            children: []
          },
          {
            id: "article-5-clause-3",
            title: "",
            paragraphs: [
              "Xử lý tranh chấp chất lượng và Giám định độc lập: Khi nhận Thông báo sai lệch của Bên A, Bên A có quyền cách ly lô hàng và tạm dừng thanh toán khoản tiền tương ứng. Bên B phải phản hồi và cử đại diện có mặt lập biên bản niêm phong mẫu đối chứng theo thời hạn dưới đây. Nếu hai bên không thống nhất được nguyên nhân, mẫu lưu đối chứng sẽ được gửi tới Trung tâm kiểm nghiệm độc lập có chức năng nhà nước chỉ định (như Viện Kiểm nghiệm ATVSTP Quốc gia, Viện Pasteur, CASE hoặc Quatest 3); kết quả của đơn vị này là phán quyết kỹ thuật cuối cùng, bên có lỗi chịu 100% chi phí kiểm nghiệm:",
              "• Thời hạn Bên B phải phản hồi và phối hợp kiểm tra sai lệch: 02 (hai) ngày làm việc kể từ khi nhận thông báo."
            ],
            children: []
          },
          {
            id: "article-5-clause-4",
            title: "",
            paragraphs: [
              "Khắc phục hàng lỗi và Hoàn tiền: Đối với lô hàng không đạt chuẩn do lỗi của Bên B, Bên A có toàn quyền yêu cầu gia công bù lô mới (bằng chi phí Vật tư và nhân công của Bên B) hoặc từ chối toàn bộ lô hàng lỗi, yêu cầu Bên B hoàn trả tiền tạm ứng và bồi thường giá trị Vật tư của Bên A đã đưa vào lô hàng hỏng đó theo thời hạn dưới đây, đồng thời Bên B chịu 100% chi phí vận chuyển thu hồi, lưu kho và tiêu hủy:",
              "• Thời hạn Bên B hoàn trả tiền đã nhận và bồi hoàn giá trị Vật tư hỏng: 05 (năm) ngày làm việc kể từ ngày xác định lỗi."
            ],
            children: []
          },
          {
            id: "article-5-clause-5",
            title: "",
            paragraphs: [
              "Trách nhiệm xuyên suốt hạn sử dụng đối với Lỗi ẩn: Bên B chịu trách nhiệm pháp lý và tài chính đối với chất lượng, độ an toàn và hàm lượng của Thành phẩm trong suốt toàn bộ thời hạn sử dụng của từng lô đối với mọi sai lệch/Lỗi ẩn phát sinh từ công đoạn gia công hoặc Vật tư của Bên B, kể cả sau khi Bên A đã ký nghiệm thu, đã thanh toán đủ hoặc sau khi Hợp đồng này đã chấm dứt hiệu lực."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-6",
        title: "Xử lý sự cố an toàn thực phẩm và Thu hồi sản phẩm",
        paragraphs: [],
        children: [
          {
            id: "article-6-clause-1",
            title: "",
            paragraphs: [
              "Khi phát hiện nguy cơ mất an toàn thực phẩm hoặc có yêu cầu kiểm tra/thu hồi từ cơ quan quản lý nhà nước, bên biết thông tin phải thông báo khẩn cấp qua điện thoại ngay lập tức và gửi văn bản/email trong vòng 12 giờ. Bên B phải cung cấp toàn bộ hồ sơ gốc của lô sản xuất và dữ liệu truy xuất trong vòng 24 giờ kể từ khi Bên A yêu cầu."
            ],
            children: []
          },
          {
            id: "article-6-clause-2",
            title: "",
            paragraphs: [
              "Trường hợp nguyên nhân thu hồi hoặc bị xử phạt hành chính xuất phát từ lỗi sản xuất, vệ sinh nhà xưởng, nhiễm chéo hoặc Vật tư của Bên B, Bên B phải hoàn trả 100% giá trị lô hàng thu hồi (gồm cả giá trị nguyên liệu của Bên A và phí gia công), thanh toán toàn bộ chi phí truyền thông thu hồi, vận chuyển gom hàng, kiểm nghiệm, tiêu hủy, tiền phạt hành chính và bồi thường thiệt hại thực tế cho Bên A."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-7",
        title: "Giá gia công, Hóa đơn, Thanh toán và Quyền cấn trừ",
        paragraphs: [],
        children: [
          {
            id: "article-7-clause-1",
            title: "",
            paragraphs: [
              "Đơn giá gia công, thuế GTGT và lịch tạm ứng/thanh toán cụ thể được ghi tại từng Đơn hàng (Phụ lục 02). Đơn giá đã chốt tại Đơn hàng là trọn gói, không phát sinh bất kỳ phụ phí nào nếu không có văn bản chấp thuận trước của Bên A."
            ],
            children: []
          },
          {
            id: "article-7-clause-2",
            title: "",
            paragraphs: [
              "Khoản thanh toán quyết toán của mỗi Đơn hàng chỉ đến hạn sau khi Bên A nhận đủ: (i) Thành phẩm đạt chuẩn; (ii) Văn bản xác nhận nghiệm thu đạt yêu cầu của Bên A; (iii) Bảng quyết toán Vật tư không còn chênh lệch tồn đọng; và (iv) Hóa đơn GTGT điện tử hợp pháp do Bên B phát hành đúng quy định pháp luật."
            ],
            children: []
          },
          {
            id: "article-7-clause-3",
            title: "",
            paragraphs: [
              "Quyền cấn trừ tự động (Điều 378 Bộ luật Dân sự 2015): Bên A có toàn quyền tự động khấu trừ/cấn trừ các khoản tiền bồi thường hao hụt Vật tư vượt định mức, tiền hàng lỗi, tiền phạt vi phạm và thiệt hại thực tế do Bên B gây ra vào bất kỳ khoản phí gia công hoặc khoản thanh toán nào đang đến hạn trả cho Bên B sau khi gửi thông báo đối trừ bằng văn bản."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-8",
        title: "Quyền Sở hữu trí tuệ, Bí mật công thức và Chống tuồn hàng",
        paragraphs: [],
        children: [
          {
            id: "article-8-clause-1",
            title: "",
            paragraphs: [
              "Toàn bộ nhãn hiệu, tên thương mại, kiểu dáng bao bì, công thức phối chế, quy trình chiết xuất Sâm Ngọc Linh và dữ liệu kỹ thuật do Bên A giao hoặc do Bên A đặt hàng phát triển riêng đều thuộc quyền sở hữu trí tuệ độc quyền của Bên A."
            ],
            children: []
          },
          {
            id: "article-8-clause-2",
            title: "",
            paragraphs: [
              "Nghiêm cấm tuyệt đối hành vi sản xuất khống, tuồn hàng hoặc nhái công thức: Bên B tuyệt đối không được tự ý đăng ký bảo hộ, tiết lộ cho bên thứ ba, sử dụng công thức/nguyên liệu của Bên A để gia công sản phẩm tương tự cho đối tác khác, hoặc sản xuất vượt số lượng Đơn hàng để đưa hàng mang nhãn/công thức của Bên A ra thị trường dưới mọi hình thức. Nếu vi phạm Điều [[ref:article-8-clause-2]] này, ngoài mức phạt tối đa 8% giá trị Hợp đồng/Đơn hàng, Bên B phải bồi thường toàn bộ thiệt hại thực tế và khoản lợi nhuận bất chính thu được, đồng thời chịu trách nhiệm hình sự/hành chính về hành vi sản xuất hàng giả, xâm phạm quyền sở hữu công nghiệp."
            ],
            children: []
          },
          {
            id: "article-8-clause-3",
            title: "",
            paragraphs: [
              "Nghĩa vụ bảo mật thông tin: Bên B có nghĩa vụ bảo mật tuyệt đối mọi thông tin kỹ thuật, giá thành, sản lượng và bí mật kinh doanh của Bên A trong suốt thời gian thực hiện Hợp đồng và tiếp tục duy trì sau khi Hợp đồng chấm dứt theo thời hạn dưới đây:",
              "• Thời hạn bảo mật sau khi Hợp đồng chấm dứt: 05 (năm) năm đối với thông tin thương mại chung, và VÔ THỜI HẠN đối với công thức sản phẩm, quy trình chế biến và bí mật kinh doanh chừng nào thông tin đó chưa được Bên A công bố công khai."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-9",
        title: "Phạt vi phạm, Bồi thường thiệt hại và Bất khả kháng",
        paragraphs: [],
        children: [
          {
            id: "article-9-clause-1",
            title: "",
            paragraphs: [
              "Trường hợp một Bên vi phạm bất kỳ nghĩa vụ nào theo Hợp đồng và Đơn hàng, Bên bị vi phạm có quyền áp dụng mức phạt vi phạm dưới đây tính trên giá trị phần nghĩa vụ hợp đồng bị vi phạm, đồng thời yêu cầu Bên vi phạm bồi thường 100% giá trị tổn thất thực tế, trực tiếp và khoản lợi trực tiếp mà Bên bị vi phạm đáng lẽ được hưởng theo Điều 301, 302 Luật Thương mại 2005:",
              "• Mức phạt vi phạm hợp đồng: 08% (tám phần trăm) giá trị phần nghĩa vụ hợp đồng bị vi phạm (lưu ý: giá trị nghĩa vụ bị vi phạm đối với lô hàng gia công hỏng/chậm bao gồm cả phí gia công và giá trị Vật tư của Bên A nằm trong lô hàng đó)."
            ],
            children: []
          },
          {
            id: "article-9-clause-2",
            title: "",
            paragraphs: [
              "Sự kiện bất khả kháng thực hiện theo Điều 156 Bộ luật Dân sự 2015 (không bao gồm việc mất điện/hỏng máy thông thường, thiếu nhân công hay chậm nguồn cung vật tư của Bên B). Bên bị ảnh hưởng phải thông báo bằng văn bản trong vòng 03 ngày làm việc kèm xác nhận của cơ quan có thẩm quyền. Nếu Sự kiện bất khả kháng kéo dài liên tục vượt quá thời hạn dưới đây, Bên A có quyền chấm dứt Đơn hàng bị ảnh hưởng và nhận lại toàn bộ Vật tư, tiền tạm ứng chưa thực hiện:",
              "• Thời gian bất khả kháng liên tục cho phép chấm dứt Đơn hàng: 30 (ba mươi) ngày dương lịch."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-10",
        title: "Thời hạn hiệu lực, Tạm ngừng và Chấm dứt hợp đồng",
        paragraphs: [],
        children: [
          {
            id: "article-10-clause-1",
            title: "",
            paragraphs: [
              "Hợp đồng có hiệu lực kể từ ngày ký theo thời hạn dưới đây và có thể gia hạn bằng Phụ lục văn bản. Khi Hợp đồng hết hạn, các Đơn hàng đã xác nhận trước đó vẫn tiếp tục được thực hiện theo các điều khoản của Hợp đồng này cho đến khi hoàn tất nghiệm thu, quyết toán:",
              "• Thời hạn hiệu lực của Hợp đồng khung: 24 (hai mươi bốn) tháng kể từ ngày ký."
            ],
            children: []
          },
          {
            id: "article-10-clause-2",
            title: "",
            paragraphs: [
              "Tạm ngừng và Đơn phương chấm dứt do vi phạm:",
              "a) Bên A có quyền yêu cầu dừng sản xuất ngay lập tức và chấm dứt Hợp đồng/Đơn hàng ngay khi phát thông báo (không cần chờ thời gian khắc phục) nếu Bên B bị thu hồi/hết hạn giấy phép đủ điều kiện sản xuất, tự ý gia công lại cho bên thứ ba, đánh tráo nguyên liệu của Bên A, vi phạm Điều [[ref:article-8]] về sở hữu trí tuệ hoặc gây sự cố mất an toàn thực phẩm nghiêm trọng.",
              "b) Đối với các vi phạm khác hoặc trường hợp chậm thanh toán khoản tiền không có tranh chấp, các thời hạn khắc phục trước khi chấm dứt/tạm ngừng được quy định tách biệt như sau:",
              "• Thời hạn để Bên vi phạm khắc phục vi phạm nghĩa vụ trước khi Bên bị vi phạm đơn phương chấm dứt Hợp đồng/Đơn hàng: 07 (bảy) ngày làm việc kể từ ngày nhận thông báo.",
              "• Thời hạn để Bên A khắc phục khoản thanh toán quá hạn (đối với khoản nợ đã nghiệm thu, không có tranh chấp) trước khi Bên B được quyền tạm ngừng công việc tương ứng: 10 (mười) ngày làm việc kể từ ngày nhận thông báo nhắc nợ bằng văn bản."
            ],
            children: []
          },
          {
            id: "article-10-clause-3",
            title: "",
            paragraphs: [
              "Quyết toán và Hoàn trả tài sản khi chấm dứt Hợp đồng: Ngoài các trường hợp trên, Bên A có quyền chấm dứt Hợp đồng khung trước hạn bằng văn bản báo trước 30 ngày (không ảnh hưởng đến các Đơn hàng đang sản xuất dở dang hợp lệ). Khi Hợp đồng chấm dứt vì bất kỳ lý do gì, Hai Bên thực hiện kiểm kê, bàn giao trả lại toàn bộ Vật tư tồn kho, khuôn mẫu, nhãn mác của Bên A và quyết toán tài chính theo 02 mốc thời hạn độc lập dưới đây:",
              "• Thời hạn Hai Bên lập Biên bản kiểm kê Vật tư và đối soát công nợ kể từ ngày chấm dứt Hợp đồng: 05 (năm) ngày làm việc.",
              "• Thời hạn Bên B bàn giao trả sạch Vật tư/tài sản của Bên A, hoàn trả tiền tạm ứng dư và thanh toán các khoản công nợ không tranh chấp kể từ ngày ký Biên bản đối soát: 05 (năm) ngày làm việc."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-11",
        title: "Thông báo điện tử và Giải quyết tranh chấp",
        paragraphs: [],
        children: [
          {
            id: "article-11-clause-1",
            title: "",
            paragraphs: [
              "Mọi thông báo, Đơn hàng, biên bản kỹ thuật gửi qua địa chỉ Email giao dịch nêu tại đầu Hợp đồng hoặc Phụ lục 01 có giá trị pháp lý và giá trị chứng cứ tương đương văn bản gốc theo Luật Giao dịch điện tử 2023. Riêng văn bản chấm dứt Hợp đồng và yêu cầu phạt/bồi thường phải đồng thời gửi bản cứng qua bưu điện chuyển phát nhanh có báo phát tới địa chỉ trụ sở."
            ],
            children: []
          },
          {
            id: "article-11-clause-2",
            title: "",
            paragraphs: [
              "Luật áp dụng và Cơ quan giải quyết tranh chấp: Hợp đồng được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp được giải quyết theo trình tự và thẩm quyền chốt cứng dưới đây:",
              "• Thời hạn thương lượng tối đa kể từ ngày một Bên gửi văn bản thông báo tranh chấp: 15 (mười lăm) ngày làm việc.",
              "• Phương thức và Cơ quan giải quyết tranh chấp có thẩm quyền: Giải quyết tại Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh (nơi thực hiện giao nhận hàng hóa theo Điểm g Khoản 1 Điều 40 Bộ luật Tố tụng dân sự 2015) hoặc Tòa án nhân dân nơi Nguyên đơn có trụ sở chính theo quyền lựa chọn của Nguyên đơn (theo Điểm b Khoản 1 Điều 39 Bộ luật Tố tụng dân sự 2015). Toàn bộ án phí, chi phí kiểm nghiệm/giám định và chi phí tố tụng do Bên thua kiện chịu."
            ],
            children: []
          },
          {
            id: "article-11-clause-3",
            title: "",
            paragraphs: [
              "Hợp đồng được lập thành 04 (bốn) bản chính bằng tiếng Việt có giá trị pháp lý như nhau, mỗi Bên giữ 02 (hai) bản để thực hiện."
            ],
            children: []
          }
        ]
      }
    ],
    closing: [],
    annexes: [
      {
        title: "Phụ lục 01 · Thông số kỹ thuật sản phẩm và phân công trách nhiệm",
        blocks: [
          {
            text: "Số: PL01 - Kèm Hợp đồng khung số: [[contractNumber]]"
          },
          {
            text: "Ngày lập: [[annexDate]] | Mã sản phẩm: [[productCode]] | Phiên bản công thức: [[formulaVersion]]"
          },
          {
            text: "I. BẢNG THÔNG SỐ KỸ THUẬT, PHÁP LÝ VÀ TIÊU CHUẨN SẢN PHẨM"
          },
          {
            rows: [
              [
                "HẠNG MỤC KIỂM SOÁT",
                "NỘI DUNG CHI TIẾT THỎA THUẬN",
                "BÊN CHỊU TRÁCH NHIỆM"
              ],
              [
                "1. Tên thương mại & Nhóm pháp lý sản phẩm",
                "Tên SP: [[productName]]\nNhóm pháp lý: [[productCategory]]",
                "Hai Bên thống nhất"
              ],
              [
                "2. Địa điểm nhà máy & Giấy phép đủ điều kiện",
                "Nhà máy SX tại: [[factoryAddress]]\nGiấy CN ATTP / GMP / GP SX Rượu số: [[factoryLicense]]",
                "Bên B duy trì hiệu lực"
              ],
              [
                "3. Công thức & Mẫu chuẩn đối chứng",
                "Mã công thức: [[formulaCode]]  Ngày duyệt: [[formulaApprovalDate]]\nMã mẫu đối chứng lưu tại 2 bên: [[referenceSampleCode]]",
                "Bên A sở hữu công thức;\nBên B tuân thủ 100%"
              ],
              [
                "4. Quy cách đóng gói & Hạn sử dụng",
                "Quy cách: [[packageFill]] x [[packageUnits]] đơn vị/hộp x [[cartonBoxes]] hộp/thùng\nHạn sử dụng: [[shelfLifeMonths]] tháng; Hạn còn lại khi giao: ≥ 90%",
                "Bên B thực hiện"
              ],
              [
                "5. Hồ sơ công bố & Ghi nhãn OEM (NĐ 43 & 111)",
                "- Pháp nhân đứng tên Bản công bố: BÊN A\n- Ghi rõ trên nhãn: “Thương nhân chịu trách nhiệm: Bên A” và “Sản xuất tại: Nhà máy Bên B”",
                "Bên A duyệt nội dung;\nBên B in/dán đúng mẫu"
              ],
              [
                "6. Chỉ tiêu COA & Phòng kiểm nghiệm độc lập",
                "Chỉ tiêu bắt buộc trên COA mỗi lô: Vi sinh, Kim loại nặng, Độ cồn/Methanol (nếu là rượu), Định tính/Định lượng Saponin/MR2 và các chỉ tiêu liên quan tại Phòng KN chuẩn ISO 17025.",
                "Bên B cung cấp COA theo từng lô giao hàng"
              ],
              [
                "7. Điều kiện bảo quản, vận chuyển & Lưu mẫu",
                "Nhiệt độ ≤ [[storageTemperature]] °C, độ ẩm ≤ [[storageHumidity]] %, tránh nắng trực tiếp.\nLưu mẫu đối chứng mỗi lô: tối thiểu [[retainedSampleCount]] đơn vị SP.",
                "Bên B lưu mẫu hết HSD + 06 tháng"
              ],
              [
                "8. Đầu mối Chất lượng (QA) & Thu hồi khẩn cấp",
                "- QA Bên A: [[companyQaName]]  SĐT/Email: [[companyQaContact]]\n- QA Bên B: [[partnerQaName]]  SĐT/Email: [[partnerQaContact]]",
                "Phản hồi sự cố ≤ 12h"
              ]
            ]
          },
          {
            text: "II. BẢNG PHÂN CÔNG CUNG ỨNG VẬT TƯ VÀ ĐỊNH MỨC HAO HỤT CHO PHÉP"
          },
          {
            rows: [
              [
                "STT",
                "TÊN VẬT TƯ / BAO BÌ",
                "BÊN CẤP",
                "CHỨNG TỪ KÈM THEO",
                "ĐỊNH MỨC / ĐV SP",
                "HAO HỤT TỐI ĐA (%)"
              ],
              [
                "1",
                "Nguyên liệu Sâm Ngọc Linh / Dịch chiết",
                "Bên A",
                "Phiếu XK vận chuyển nội bộ, Hồ sơ nguồn gốc, BB bàn giao",
                "[[ginsengRate]]",
                "≤ [[ginsengLoss]] %"
              ],
              [
                "2",
                "Phụ liệu / Nền rượu đạt chuẩn QCVN",
                "Bên [[auxiliarySupplier]]",
                "COA lô nguyên liệu, Hóa đơn chứng từ hợp pháp",
                "[[auxiliaryRate]]",
                "≤ [[auxiliaryLoss]] %"
              ],
              [
                "3",
                "Chai / Lọ / Nắp / Màng co niêm phong",
                "Bên [[bottleSupplier]]",
                "Chứng nhận ATTP bao bì tiếp xúc trực tiếp thực phẩm",
                "01 bộ / SP",
                "≤ [[bottleLoss]] %"
              ],
              [
                "4",
                "Tem nhãn chính, Nhãn phụ, Tem rượu/QR",
                "Bên [[labelSupplier]]",
                "Bản thiết kế duyệt ký, Biên bản bàn giao số seri tem",
                "01 bộ / SP",
                "≤ 0,5 % (thu hồi xác tem lỗi)"
              ],
              [
                "5",
                "Hộp giấy đơn & Thùng carton ngoại",
                "Bên [[cartonSupplier]]",
                "Mẫu hộp ký duyệt tiêu chuẩn độ cứng/in ấn",
                "Theo quy cách",
                "≤ [[cartonLoss]] %"
              ]
            ]
          },
          {
            text: "Ghi chú: Mọi hao hụt vượt tỷ lệ tối đa ở cột 6 (đặc biệt đối với Sâm Ngọc Linh và Tem rượu/Tem chống giả), Bên B phải giải trình, bàn giao toàn bộ xác tem/bao bì hỏng và bồi hoàn 100% phần vượt định mức cho Bên A."
          },
          {
            rows: [
              [
                "ĐẠI DIỆN BÊN A",
                "ĐẠI DIỆN BÊN B"
              ],
              [
                "(Ký, ghi rõ họ tên và đóng dấu)",
                "(Ký, ghi rõ họ tên và đóng dấu)"
              ],
              [
                "TRẦN ĐỨC AN",
                "[[partnerRepresentative]]"
              ]
            ]
          }
        ]
      },
      {
        title: "Phụ lục 02 · Đơn đặt gia công hàng hóa (Purchase Order)",
        blocks: [
          {
            text: "Số PO: [[purchaseOrderNumber]] (Kèm HĐ số: [[contractNumber]])"
          },
          {
            text: "Căn cứ Hợp đồng khung gia công số [[contractNumber]] và Phụ lục 01 mã sản phẩm [[productCode]], Bên A chính thức đặt Bên B gia công lô hàng với các điều kiện cụ thể như sau:"
          },
          {
            rows: [
              [
                "STT",
                "TÊN THÀNH PHẨM GIA CÔNG",
                "MÃ TIÊU CHUẨN (PL01)",
                "ĐVT",
                "SỐ LƯỢNG ĐẶT",
                "ĐƠN GIÁ GIA CÔNG (-VAT)",
                "THÀNH TIỀN (-VAT)"
              ],
              [
                "1",
                "[[firstItemName]]",
                "[[firstItemStandard]]",
                "[[firstItemUnit]]",
                "[[firstItemQuantity]]",
                "[[firstItemUnitPrice]]",
                "[[firstItemAmount]]"
              ],
              [
                "2",
                "[[secondItemName]]",
                "[[secondItemStandard]]",
                "[[secondItemUnit]]",
                "[[secondItemQuantity]]",
                "[[secondItemUnitPrice]]",
                "[[secondItemAmount]]"
              ]
            ]
          },
          {
            rows: [
              [
                "Cộng tiền dịch vụ gia công (chưa VAT)",
                "[[subtotal]]"
              ],
              [
                "Thuế GTGT (theo thuế suất hiện hành [[vatRate]]%)",
                "[[vatAmount]]"
              ],
              [
                "TỔNG GIÁ TRỊ ĐƠN ĐẶT GIA CÔNG (ĐÃ GỒM VAT)",
                "[[totalAmount]]"
              ]
            ]
          },
          {
            text: "1. Ngày Bên A dự kiến bàn giao Vật tư cho Bên B: Ngày [[materialHandoverDate]] (kèm Phiếu xuất kho kiêm vận chuyển nội bộ)."
          },
          {
            text: "2. Thời hạn Bên B bắt buộc bàn giao đủ Thành phẩm và hồ sơ lô (COA, Bảng quyết toán Vật tư): Chậm nhất ngày [[finishedGoodsDueDate]] (Dung sai số lượng cho phép: ± [[quantityTolerance]]%)."
          },
          {
            text: "3. Địa điểm giao Thành phẩm: Kho Bên A tại 38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, TP. Hồ Chí Minh (Chi phí vận chuyển do Bên [[freightParty]] chịu)."
          },
          {
            text: "4. Điều kiện thanh toán của Đơn hàng này: Đợt 1 tạm ứng [[advancePercent]]% tương đương [[advanceAmount]] VNĐ trong vòng 03 ngày làm việc sau khi ký PO và bàn giao Vật tư; Đợt 2 quyết toán [[settlementPercent]]% còn lại trong vòng 10 ngày làm việc sau khi Bên A ký Văn bản xác nhận nghiệm thu đạt chuẩn, chốt xong quyết toán hao hụt Vật tư và nhận Hóa đơn GTGT hợp lệ."
          },
          {
            rows: [
              [
                "XÁC NHẬN CỦA BÊN ĐẶT GIA CÔNG (BÊN A)",
                "XÁC NHẬN NHẬN ĐƠN CỦA BÊN B"
              ],
              [
                "(Ký, ghi rõ họ tên và đóng dấu)",
                "(Ký, ghi rõ họ tên và đóng dấu)"
              ],
              [
                "TRẦN ĐỨC AN",
                "[[partnerRepresentative]]"
              ]
            ]
          }
        ]
      }
    ]
  },
  {
    id: "atuagin-sale",
    name: "Hợp đồng nguyên tắc bán hàng Atuagin",
    description: "Atuagin bán hàng theo đơn đặt hàng hoặc phụ lục báo giá.",
    title: "HỢP ĐỒNG NGUYÊN TẮC MUA BÁN HÀNG HÓA",
    issuerName: "CÔNG TY CỔ PHẦN RƯỢU SÂM VIỆT NAM ATUAGIN",
    companyRole: "Bên bán",
    partnerRole: "Bên mua",
    fields: [
      {
        key: "contractNumber",
        label: "Số hợp đồng đầy đủ",
        group: "contract",
        hint: "Định dạng: số thứ tự/năm/HĐNT-ATUAGIN"
      },
      {
        key: "signingDate",
        label: "Ngày ký hợp đồng",
        group: "contract",
        type: "date"
      },
      {
        key: "partnerName",
        label: "Tên doanh nghiệp theo đăng ký",
        group: "partner"
      },
      {
        key: "partnerTaxId",
        label: "Mã số doanh nghiệp",
        group: "partner"
      },
      {
        key: "partnerAddress",
        label: "Địa chỉ trụ sở",
        group: "partner"
      },
      {
        key: "partnerPhone",
        label: "Điện thoại giao dịch",
        group: "partner",
        type: "tel"
      },
      {
        key: "partnerEmail",
        label: "Email giao dịch",
        group: "partner",
        type: "email"
      },
      {
        key: "partnerAccount",
        label: "Số tài khoản ngân hàng",
        group: "partner"
      },
      {
        key: "partnerBank",
        label: "Ngân hàng và chi nhánh",
        group: "partner"
      },
      {
        key: "partnerRepresentative",
        label: "Họ và tên người đại diện",
        group: "partner"
      },
      {
        key: "partnerPosition",
        label: "Chức vụ người đại diện",
        group: "partner"
      },
      {
        key: "deliveryAddress",
        label: "Địa chỉ kho nhận hàng của Bên B",
        group: "partner"
      }
    ],
    intro: [
      "- Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 24/11/2015;",
      "- Căn cứ Luật Thương mại số 36/2005/QH11 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 14/06/2005;",
      "- Căn cứ Luật Phòng, chống tác hại của rượu, bia số 44/2019/QH14; Nghị định số 105/2017/NĐ-CP và Nghị định số 17/2020/NĐ-CP về kinh doanh rượu;",
      "- Căn cứ Nghị định số 123/2020/NĐ-CP và Nghị định số 70/2025/NĐ-CP quy định về hóa đơn, chứng từ;",
      "- Căn cứ nhu cầu mua bán hàng hóa và sự thỏa thuận tự nguyện của Hai Bên.",
      "Hôm nay, ngày [[signingDate]], tại Văn phòng Công ty Cổ phần Rượu Sâm Việt Nam Atuagin, chúng tôi gồm có:"
    ],
    parties: {
      a: [
        "Tên doanh nghiệp: CÔNG TY CỔ PHẦN RƯỢU SÂM VIỆT NAM ATUAGIN",
        "Mã số doanh nghiệp: 0318645641",
        "Địa chỉ trụ sở: Tòa nhà Bitexco, Số 02 Đường Hải Triều, Phường Sài Gòn, TP. Hồ Chí Minh",
        "Điện thoại: 0974 30 37 34 | Email: admin@tumorong.com",
        "Tài khoản ngân hàng: 060325189048 – Ngân hàng Sacombank - TP.HCM",
        "Người đại diện: Ông NGUYỄN NHẬT TRƯỜNG | Chức vụ: Tổng Giám đốc"
      ],
      b: [
        "Tên doanh nghiệp: [[partnerName]]",
        "Mã số doanh nghiệp: [[partnerTaxId]]",
        "Địa chỉ trụ sở: [[partnerAddress]]",
        "Điện thoại: [[partnerPhone]] | Email giao dịch: [[partnerEmail]]",
        "Tài khoản ngân hàng: [[partnerAccount]] tại [[partnerBank]]",
        "Người đại diện: [[partnerRepresentative]] | Chức vụ: [[partnerPosition]]"
      ]
    },
    partyIntro: "Sau khi bàn bạc, Hai Bên thống nhất ký kết Hợp đồng nguyên tắc mua bán hàng hóa (sau đây gọi là “Hợp đồng”) với các điều khoản và điều kiện sau:",
    companyRepresentative: "NGUYỄN NHẬT TRƯỜNG",
    articles: [
      {
        id: "article-1",
        title: "Hàng hóa, Hồ sơ pháp lý và Điều kiện kinh doanh",
        paragraphs: [],
        children: [
          {
            id: "article-1-clause-1",
            title: "",
            paragraphs: [
              "Bên A đồng ý bán và Bên B đồng ý mua các sản phẩm do Bên A sản xuất/phân phối theo từng Đơn đặt hàng (PO) hoặc Phụ lục báo giá được Hai Bên xác nhận."
            ],
            children: []
          },
          {
            id: "article-1-clause-2",
            title: "",
            paragraphs: [
              "Bên A bảo đảm hàng hóa cung cấp là hàng chính hãng, mới 100%, đạt tiêu chuẩn chất lượng đã công bố và có nguồn gốc xuất xứ hợp pháp. Theo yêu cầu hợp lý của Bên B, Bên A cung cấp bản sao (có đóng dấu xác nhận của Bên A hoặc bản điện tử hợp lệ) hồ sơ tự công bố sản phẩm và chứng từ chất lượng liên quan để Bên B lưu hồ sơ."
            ],
            children: []
          },
          {
            id: "article-1-clause-3",
            title: "",
            paragraphs: [
              "Trách nhiệm chất lượng của Bên A chỉ áp dụng trong trường hợp Bên B tuân thủ nghiêm ngặt hướng dẫn bảo quản của nhà sản xuất (bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và va đập). Bên A được miễn trừ hoàn toàn trách nhiệm nếu hàng hóa bị hư hỏng, biến chất, rách tem rượu hoặc bể vỡ do lỗi vận chuyển, lưu kho, trưng bày của Bên B hoặc bên thứ ba sau thời điểm bàn giao."
            ],
            children: []
          },
          {
            id: "article-1-clause-4",
            title: "",
            paragraphs: [
              "Đối với các mặt hàng đồ uống có cồn, Bên B cam kết đáp ứng đầy đủ điều kiện kinh doanh bán buôn/bán lẻ hoặc bán rượu tiêu dùng tại chỗ theo Nghị định 105/2017/NĐ-CP (sửa đổi bởi Nghị định 17/2020/NĐ-CP) và tự chịu trách nhiệm trước pháp luật đối với hoạt động trưng bày, bán lại hoặc truyền thông tại cơ sở của Bên B."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-2",
        title: "Giao nhận, Kiểm hàng và Bảo lưu quyền sở hữu",
        paragraphs: [],
        children: [
          {
            id: "article-2-clause-1",
            title: "",
            paragraphs: [
              "Địa điểm giao hàng: Giao tại kho của Bên B tại địa chỉ: [[deliveryAddress]]. Thời gian giao hàng dự kiến tại nội thành TP. Hồ Chí Minh là trong vòng 48 giờ làm việc (không tính Thứ Bảy, Chủ Nhật, ngày lễ) kể từ khi Bên A xác nhận Đơn đặt hàng và nhận đủ tiền đặt cọc (nếu có)."
            ],
            children: []
          },
          {
            id: "article-2-clause-2",
            title: "",
            paragraphs: [
              "Chi phí vận chuyển đến địa điểm giao hàng trong nội thành TP. Hồ Chí Minh do Bên A chi trả (trừ trường hợp Đơn đặt hàng ngoại tỉnh hoặc đơn hàng dưới hạn mức tối thiểu có thỏa thuận khác). Chi phí bốc xếp vào kho của Bên B do Bên B tự chi trả."
            ],
            children: []
          },
          {
            id: "article-2-clause-3",
            title: "",
            paragraphs: [
              "Quy trình kiểm nhận chặt chẽ và Chuyển giao rủi ro: Đại diện Bên B có nghĩa vụ kiểm tra số lượng, chủng loại, tình trạng nguyên đai nguyên kiện và ngoại quan ngay tại thời điểm nhận hàng và ký xác nhận vào Phiếu giao hàng/Biên bản bàn giao. Toàn bộ rủi ro về mất mát, bể vỡ hàng hóa chuyển sang cho Bên B ngay thời điểm ký nhận. Riêng đối với hàng đóng thùng nguyên niêm phong của Bên A mà bị bể vỡ ẩn bên trong do lỗi đóng gói ban đầu, Bên B phải gửi thông báo kèm video quay liền mạch quá trình mở thùng trong vòng 24 giờ kể từ lúc nhận hàng; nếu hợp lệ, Bên A sẽ thu hồi hàng lỗi và giao đổi hàng đạt chuẩn cho Bên B trong vòng 03 (ba) ngày làm việc. Quá thời hạn 24 giờ nêu trên hoặc không có video đối chứng hợp lệ, hàng hóa mặc nhiên được coi là đã giao đủ, nguyên vẹn 100%."
            ],
            children: []
          },
          {
            id: "article-2-clause-4",
            title: "",
            paragraphs: [
              "Bảo lưu quyền sở hữu (theo Điều 331 Bộ luật Dân sự 2015): Quyền sở hữu đối với toàn bộ lô hàng đã giao vẫn thuộc về Bên A cho đến khi Bên B thanh toán đủ 100% giá trị lô hàng đó. Trường hợp Bên B vi phạm nghĩa vụ thanh toán quá 15 (mười lăm) ngày, Bên A có toàn quyền thu hồi lại số hàng hóa chưa thanh toán còn tồn tại kho của Bên B mà không bị coi là vi phạm, đồng thời Bên B vẫn phải chịu chi phí vận chuyển thu hồi, khấu hao và tiền phạt vi phạm."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-3",
        title: "Xuất hóa đơn đúng thời điểm, Đối chiếu công nợ và Thanh toán",
        paragraphs: [],
        children: [
          {
            id: "article-3-clause-1",
            title: "",
            paragraphs: [
              "Xuất hóa đơn tuân thủ pháp luật Thuế: Để tuân thủ nghiêm quy định tại Nghị định 123/2020/NĐ-CP và Nghị định 70/2025/NĐ-CP về thời điểm lập hóa đơn khi bán hàng hóa, ngay tại mỗi đợt giao hàng thực tế, Bên A lập Phiếu giao hàng có chữ ký nhận của đại diện/nhân sự kho Bên B và phát hành Hóa đơn GTGT điện tử hợp lệ gửi qua email đăng ký của Bên B tương ứng với lượng hàng đã giao."
            ],
            children: []
          },
          {
            id: "article-3-clause-2",
            title: "",
            paragraphs: [
              "Đối chiếu công nợ và Cơ chế mặc nhiên xác nhận: Vào ngày cuối cùng của mỗi tháng, Bên A lập và gửi Biên bản đối chiếu công nợ tổng hợp các đợt giao hàng và Hóa đơn GTGT đã phát hành trong tháng qua văn bản hoặc email cho Bên B. Trong vòng 03 (ba) ngày làm việc kể từ ngày Bên A gửi Biên bản đối chiếu công nợ, nếu Bên B không gửi văn bản phản hồi nêu rõ sai lệch kèm chứng từ chứng minh hợp lệ, thì số liệu công nợ trên Biên bản do Bên A lập mặc nhiên được coi là đã được Bên B xác nhận chính xác và không có tranh chấp trước Tòa án."
            ],
            children: []
          },
          {
            id: "article-3-clause-3",
            title: "",
            paragraphs: [
              "Thời hạn và Phương thức thanh toán: Bên B có nghĩa vụ thanh toán 100% tổng giá trị công nợ phát sinh trong tháng bằng hình thức chuyển khoản vào tài khoản ngân hàng của Bên A nêu tại phần đầu Hợp đồng trong thời hạn tối đa 20 (hai mươi) ngày dương lịch (bao gồm cả ngày nghỉ, lễ, Tết) kể từ ngày cuối tháng phát sinh đơn hàng (hoặc thời hạn ngắn hơn nếu ghi trên Đơn đặt hàng). Mọi khoản thanh toán bằng tiền mặt cho cá nhân nhân viên kinh doanh đều không có giá trị giải trừ nghĩa vụ nợ với Bên A."
            ],
            children: []
          },
          {
            id: "article-3-clause-4",
            title: "",
            paragraphs: [
              "Hạn mức công nợ và Quyền tạm ngừng giao hàng: Trường hợp Bên B có bất kỳ khoản nợ quá hạn nào chưa thanh toán, Bên A có quyền lập tức tạm ngừng giao các đơn hàng tiếp theo, thu hồi mọi khoản chiết khấu thương mại/ưu đãi của kỳ đó mà không bị coi là vi phạm Hợp đồng."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-4",
        title: "Đặt cọc, Lãi chậm thanh toán và Phạt vi phạm",
        paragraphs: [],
        children: [
          {
            id: "article-4-clause-1",
            title: "",
            paragraphs: [
              "Phạt vi phạm và Lãi chậm thanh toán: Trường hợp Bên B chậm thanh toán bất kỳ khoản công nợ nào so với thời hạn tại Điều [[ref:article-3-clause-3]], Bên B đồng thời phải chịu: (i) Tiền lãi chậm trả trên số tiền chậm trả tương ứng với thời gian chậm trả theo mức lãi suất nợ quá hạn trung bình trên thị trường của ít nhất 03 ngân hàng thương mại (Vietcombank, VietinBank, Agribank) tại thời điểm thanh toán theo Điều 306 Luật Thương mại 2005 và Án lệ số 09/2016/AL; VÀ (ii) Khoản phạt vi phạm hợp đồng bằng 08% (tám phần trăm) giá trị khoản tiền chậm thanh toán, cùng toàn bộ thiệt hại thực tế phát sinh."
            ],
            children: []
          },
          {
            id: "article-4-clause-2",
            title: "",
            paragraphs: [
              "Xử lý tiền đặt cọc (áp dụng khi Đơn đặt hàng/Phụ lục có thỏa thuận đặt cọc):",
              "a) Nếu Bên B đơn phương hủy Đơn đặt hàng, thay đổi chủng loại hàng đặt riêng hoặc từ chối nhận hàng quá 05 (năm) ngày kể từ ngày Bên A thông báo sẵn sàng giao hàng, Bên A có quyền đơn phương hủy Đơn đặt hàng, tịch thu 100% số tiền đặt cọc thuộc sở hữu của Bên A và yêu cầu Bên B thanh toán chi phí vận chuyển hai chiều, lưu kho thực tế phát sinh.",
              "b) Ngược lại, nếu Bên A chậm giao hàng quá 10 (mười) ngày làm việc so với cam kết mà không do Sự kiện bất khả kháng hoặc lỗi của Bên B, Bên B có quyền hủy phần hàng chậm giao và Bên A có trách nhiệm hoàn trả lại 100% số tiền đặt cọc tương ứng đã nhận."
            ],
            children: []
          },
          {
            id: "article-4-clause-3",
            title: "",
            paragraphs: [
              "Thời hạn thanh toán tiền phạt, tiền lãi chậm trả và bồi thường thiệt hại là 05 (năm) ngày làm việc kể từ ngày Bên A gửi thông báo yêu cầu thanh toán."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-5",
        title: "Thủ tục giải quyết tranh chấp và Thẩm quyền Tòa án",
        paragraphs: [],
        children: [
          {
            id: "article-5-clause-1",
            title: "",
            paragraphs: [
              "Hai Bên công nhận giá trị chứng cứ hợp pháp trước Tòa án đối với toàn bộ Email, tin nhắn điện tử, Hóa đơn điện tử, vận đơn của đơn vị vận chuyển và Phiếu giao hàng có chữ ký của người thực tế tiếp nhận hàng tại kho của Bên B."
            ],
            children: []
          },
          {
            id: "article-5-clause-2",
            title: "",
            paragraphs: [
              "Khi phát sinh tranh chấp, Hai Bên ưu tiên thương lượng trong vòng 10 (mười) ngày kể từ ngày phát sinh. Nếu thương lượng không thành, căn cứ Điểm b Khoản 1 Điều 39 Bộ luật Tố tụng dân sự 2015, Hai Bên thống nhất thỏa thuận chọn Tòa án nhân dân có thẩm quyền nơi Nguyên đơn đặt trụ sở chính (nếu Bên A khởi kiện là Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh) để giải quyết."
            ],
            children: []
          },
          {
            id: "article-5-clause-3",
            title: "",
            paragraphs: [
              "Toàn bộ án phí, lệ phí Tòa án, chi phí xem xét thẩm định, giám định và các chi phí thu hồi nợ hợp pháp do Bên thua kiện chịu."
            ],
            children: []
          }
        ]
      },
      {
        id: "article-6",
        title: "Hiệu lực và Điều khoản chung",
        paragraphs: [],
        children: [
          {
            id: "article-6-clause-1",
            title: "",
            paragraphs: [
              "Hợp đồng có hiệu lực 01 (một) năm kể từ ngày ký và tự động gia hạn thêm từng kỳ 01 (một) năm nếu trước ngày hết hạn ít nhất 15 (mười lăm) ngày không có Bên nào thông báo chấm dứt bằng văn bản."
            ],
            children: []
          },
          {
            id: "article-6-clause-2",
            title: "",
            paragraphs: [
              "Hợp đồng có thể chấm dứt trước hạn theo thỏa thuận bằng văn bản hoặc khi một Bên gửi văn bản thông báo trước ít nhất 15 (mười lăm) ngày làm việc. Ngay khi chấm dứt Hợp đồng vì bất kỳ lý do gì, toàn bộ các khoản công nợ chưa đến hạn của Bên B lập tức được coi là đến hạn thanh toán trong vòng 05 (năm) ngày làm việc kể từ ngày chấm dứt."
            ],
            children: []
          },
          {
            id: "article-6-clause-3",
            title: "",
            paragraphs: [
              "Mọi sửa đổi, bổ sung Hợp đồng phải lập thành Phụ lục bằng văn bản có chữ ký của đại diện có thẩm quyền Hai Bên. Bên B không được chuyển nhượng quyền hoặc nghĩa vụ theo Hợp đồng cho bên thứ ba nếu không có sự đồng ý trước bằng văn bản của Bên A."
            ],
            children: []
          },
          {
            id: "article-6-clause-4",
            title: "",
            paragraphs: [
              "Hợp đồng được lập thành 04 (bốn) bản chính bằng tiếng Việt có giá trị pháp lý như nhau; mỗi Bên giữ 02 (hai) bản để thực hiện và lưu trữ hồ sơ kế toán – pháp lý."
            ],
            children: []
          }
        ]
      }
    ],
    closing: [],
    annexes: []
  }
];
