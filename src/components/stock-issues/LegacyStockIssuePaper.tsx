import React from 'react';
import { money, moneyInWords, stockIssueTotals, type StockIssueData } from '../../lib/stockIssue';

export function LegacyStockIssuePaper({ data, number }: { data: StockIssueData; number?: string }) {
  const totals = stockIssueTotals(data.items, data.vatRate);
  const [year, month, day] = data.date.split('-');
  return <article className="stock-paper" aria-label="Bản in phiếu xuất kho">
    <div className="paper-letterhead">
      <div><strong>{data.companyName}</strong><div>{data.companyAddress}</div></div>
      <div className="paper-template"><strong>Mẫu số: 02 - VT</strong><em>(Ban hành theo Thông tư số 133/2016/TT-BTC Ngày 26/08/2016 của Bộ Tài chính)</em></div>
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
      <colgroup><col style={{ width: '5%' }} /><col style={{ width: '29%' }} /><col style={{ width: '12%' }} /><col style={{ width: '8%' }} /><col style={{ width: '8%' }} /><col style={{ width: '8%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /></colgroup>
      <thead>
        <tr><th rowSpan={2}>STT</th><th rowSpan={2}>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hóa</th><th rowSpan={2}>Mã số</th><th rowSpan={2}>Đơn vị tính</th><th colSpan={2}>Số lượng</th><th rowSpan={2}>Đơn giá</th><th rowSpan={2}>Thành tiền</th></tr>
        <tr><th>Yêu cầu</th><th>Thực xuất</th></tr>
        <tr>{['A', 'B', 'C', 'D', '1', '2', '3', '4'].map(label => <th key={label}>{label}</th>)}</tr>
      </thead>
      <tbody>
        {data.items.map((item, index) => <tr key={index}>
          <td className="center">{index + 1}</td><td>{item.name}</td><td className="center">{item.sku}</td><td className="center">{item.unit}</td>
          <td className="numeric">{money(item.requested)}</td><td className="numeric">{money(item.quantity)}</td><td className="numeric">{money(item.unitPrice)}</td><td className="numeric">{money(totals.lines[index])}</td>
        </tr>)}
        <tr className="paper-total"><td /><th colSpan={6}>Cộng</th><td className="numeric">{money(totals.subtotal)}</td></tr>
        <tr className="paper-total"><td /><th colSpan={5}>Thuế VAT</th><td className="numeric">{data.vatRate}%</td><td className="numeric">{money(totals.vat)}</td></tr>
        <tr className="paper-total"><th colSpan={7}>Tổng tiền thanh toán</th><td className="numeric">{money(totals.total)}</td></tr>
      </tbody>
    </table>
    <div className="paper-ending">
      <div>Tổng số tiền (Viết bằng chữ): {moneyInWords(totals.total)}</div>
      <div>- Số chứng từ gốc kèm theo: {data.attachments || '........................'}</div>
      <div className="paper-signatures">
        {[
          ['Người lập biểu', '(Ký, họ tên)', data.creator],
          ['Người nhận hàng', '(Ký, họ tên)', data.receiver],
          ['Thủ kho', '(Ký, họ tên)', data.keeper],
          ['Kế toán trưởng', '(Ký, họ tên)', data.accountant],
          ['Giám đốc', '(Ký, họ tên, đóng dấu)', data.director],
        ].map(([title, instruction, name]) => <div key={title}><strong>{title}</strong>{title === 'Kế toán trưởng' && <div className="paper-accountant-note">(Hoặc bộ phận có nhu cầu nhập)</div>}<em>{instruction}</em><div className="signature-name">{name}</div></div>)}
      </div>
    </div>
  </article>;
}
