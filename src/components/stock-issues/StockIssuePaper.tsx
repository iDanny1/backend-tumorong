import React from 'react';
import { money, moneyInWords, stockIssuePricing, type StockIssueData } from '../../lib/stockIssue';

import { LegacyStockIssuePaper } from './LegacyStockIssuePaper';

export function StockIssuePaper({ data, number }: { data: StockIssueData; number?: string }) {
  if (data.pricingVersion !== 2) return <LegacyStockIssuePaper data={data} number={number} />;
  const totals = stockIssuePricing(data);
  const showVat = !data.hideVat;
  const showDiscount = !data.hideDiscount;
  const widths = [4, 20, 9, 6, 6, 6, 12, ...(showDiscount ? [10] : []), ...(showVat ? [5, 10] : []), 12];
  const widthTotal = widths.reduce((sum, width) => sum + width, 0);
  const summarySpan = widths.length - 1;
  const [year, month, day] = data.date.split('-');
  return <article className="stock-paper stock-paper-v2" aria-label="Bản in phiếu xuất kho">
    <div className="paper-letterhead">
      <div><strong>{data.companyName}</strong><div>{data.companyAddress}</div></div>
      <div className="paper-template"><strong>Mẫu nội bộ</strong><em>Tham khảo mẫu 02 - VT<br />Bổ sung thông tin bán hàng</em></div>
    </div>
    <div className="paper-title">
      <h1>PHIẾU XUẤT KHO</h1>
      <strong><em>Ngày {day} tháng {month} năm {year}</em></strong>
      <div>Số: {number || 'Chưa cấp — bản xem trước'}</div>
      <div className="paper-accounts"><div>Nợ: {data.debitAccount}</div><div>Có: {data.creditAccount}</div></div>
    </div>
    <div className="paper-information">
      <div>Họ và tên người nhận hàng: {data.recipient}</div>
      <div>Địa chỉ (bộ phận): {data.address || '................................................................................'}</div>
      <div>Lý do xuất kho: {data.reason}</div>
      <div className="paper-warehouse"><span>Xuất tại kho (ngăn lô): {data.warehouseName}</span><span>Địa điểm: {data.warehouseLocation}</span></div>
      <div>Địa điểm giao hàng: {data.deliveryAddress || data.address || '................................................................................'}</div>
      {data.phone && <div>Điện thoại liên hệ: {data.phone}</div>}
    </div>
    <table className="paper-table">
      <colgroup>{widths.map((width, i) => <col key={i} style={{ width: `${width / widthTotal * 100}%` }} />)}</colgroup>
      <thead>
        <tr><th rowSpan={2}>STT</th><th rowSpan={2}>Tên, nhãn hiệu, quy cách, phẩm chất hàng hóa</th><th rowSpan={2}>Mã số</th><th rowSpan={2}>ĐVT</th><th colSpan={2}>Số lượng</th><th rowSpan={2}>Đơn giá</th>{showDiscount && <th rowSpan={2}>Chiết khấu (đ)</th>}{showVat && <><th rowSpan={2}>VAT %</th><th rowSpan={2}>Tiền VAT (đ)</th></>}<th rowSpan={2}>Thành tiền</th></tr>
        <tr><th>Yêu cầu</th><th>Thực xuất</th></tr>
      </thead>
      <tbody>
        {data.items.map((item, index) => <tr key={index}>
          <td className="center">{index + 1}</td><td>{item.name}</td><td className="center">{item.sku}</td><td className="center">{item.unit}</td>
          <td className="numeric">{money(item.requested)}</td><td className="numeric">{money(item.quantity)}</td><td className="numeric">{money(item.unitPrice)}</td>{showDiscount && <td className="numeric">{money(totals.discounts[index])}</td>}{showVat && <><td className="numeric">{item.vatRate}%</td><td className="numeric">{money(totals.lineVat[index])}</td></>}<td className="numeric">{money(totals.lines[index])}</td>
        </tr>)}
        <tr className="paper-total"><th colSpan={summarySpan}>Cộng tiền hàng</th><td className="numeric">{money(totals.subtotal)}</td></tr>
        {showDiscount && <tr className="paper-total"><th colSpan={summarySpan}>Chiết khấu tổng bill{data.billDiscountType === 'percent' ? ` (${data.billDiscount}%)` : ''}</th><td className="numeric">{money(totals.billDiscount)}</td></tr>}
        <tr className="paper-total"><th colSpan={summarySpan}>Tổng tiền thanh toán</th><td className="numeric">{money(totals.total)}</td></tr>
      </tbody>
    </table>
    <div className="paper-ending">
      <p className="paper-pricing-note">Tổng tiền thanh toán đã tính đầy đủ các khoản áp dụng. Thông tin giá bán phục vụ đối chiếu thanh toán; giá trị xuất kho hạch toán theo sổ kế toán. Phiếu nội bộ không thay thế hóa đơn.</p>
      <div>Tổng số tiền (Viết bằng chữ): {moneyInWords(totals.total)}</div>
      <div>- Số chứng từ gốc kèm theo: {data.attachments || '........................'}</div>
      <div className="paper-signatures">
        {[
          ['Người lập biểu', '(Ký, họ tên)', data.creator],
          ['Người nhận hàng', '(Ký, họ tên)', data.receiver],
          ['Thủ kho', '(Ký, họ tên)', data.keeper],
          ['Kế toán trưởng', '(Ký, họ tên)', data.accountant],
          ['Giám đốc', '(Ký, họ tên, đóng dấu)', data.director],
        ].map(([title, instruction, name]) => <div key={title}><strong>{title}</strong>{title === 'Kế toán trưởng' && <div className="paper-accountant-note">(Hoặc người được ủy quyền)</div>}<em>{instruction}</em><div className="signature-name">{name}</div></div>)}
      </div>
    </div>
  </article>;
}
