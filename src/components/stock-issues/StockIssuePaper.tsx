import React from 'react';
import { money, moneyInWords, stockIssuePricing, type StockIssueData } from '../../lib/stockIssue';

import { LegacyStockIssuePaper } from './LegacyStockIssuePaper';

export function StockIssuePaper({ data, number }: { data: StockIssueData; number?: string }) {
  if (data.pricingVersion !== 2) return <LegacyStockIssuePaper data={data} number={number} />;
  const totals = stockIssuePricing(data);
  const showVat = !data.hideVat;
  const showDiscount = !data.hideDiscount;
  const showNotes = data.items.some(item => item.note?.trim());
  const widths = [4, 19, 8, 5, 6, 6, 10, ...(showDiscount ? [10] : []), 12, ...(showVat ? [5, 10] : []), 13, ...(showNotes ? [11] : [])];
  const widthTotal = widths.reduce((sum, width) => sum + width, 0);
  const summarySpan = widths.length - 1 - Number(showNotes);
  const summaries = [
    ...(showDiscount ? [{ label: 'Tổng chiết khấu', amount: totals.productDiscount + totals.billDiscount }] : []),
    { label: 'Cộng thành tiền chưa VAT', amount: totals.total - totals.vat },
    ...(showVat ? [{ label: 'Tổng VAT', amount: totals.vat }] : []),
    { label: 'Tổng tiền thanh toán', amount: totals.total },
  ];
  const blank = '........................';
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
      <section><strong>Thông tin bên xuất kho</strong>
        <div className="paper-contact"><span>Người lập phiếu: {data.creator || blank}</span><span>SĐT: {data.creatorPhone || blank}</span></div>
        <div>Kho xuất: {data.warehouseName}</div>
        <div>Địa chỉ kho: {data.warehouseLocation || blank}</div>
        <div>Lý do xuất kho: {data.reason}</div>
      </section>
      <section><strong>Thông tin bên nhận hàng</strong>
        <div className="paper-contact"><span>Họ và tên người nhận hàng: {data.recipient || blank}</span><span>SĐT: {data.phone || blank}</span></div>
        {data.isOrganization && <>
          <div>Tên đơn vị: {data.organizationName || blank}</div>
          <div>Địa chỉ đơn vị nhận hàng: {data.address || blank}</div>
        </>}
        {data.isOrganization === undefined && data.address && <div>Địa chỉ (bộ phận): {data.address}</div>}
        <div>Địa chỉ nhận hàng: {data.deliveryAddress || (data.isOrganization === undefined && data.address) || blank}</div>
      </section>
    </div>
    <table className="paper-table">
      <colgroup>{widths.map((width, i) => <col key={i} style={{ width: `${width / widthTotal * 100}%` }} />)}</colgroup>
      <thead>
        <tr>
          <th rowSpan={2}>STT</th><th rowSpan={2}>Tên, nhãn hiệu, quy cách, phẩm chất hàng hóa</th>
          <th rowSpan={2}>SKU (Mã số)</th><th rowSpan={2}>ĐVT</th><th colSpan={2}>Số lượng</th><th rowSpan={2}>Đơn giá (đ)</th>
          {showDiscount && <th rowSpan={2}>Chiết khấu (đ)</th>}
          <th rowSpan={2}>Thành tiền chưa VAT (đ)</th>
          {showVat && <><th rowSpan={2}>VAT %</th><th rowSpan={2}>Tiền VAT (đ)</th></>}
          <th rowSpan={2}>Thành tiền đã VAT (đ)</th>
          {showNotes && <th rowSpan={2}>Ghi chú</th>}
        </tr>
        <tr><th>Yêu cầu</th><th>Thực xuất</th></tr>
      </thead>
      <tbody>
        {data.items.map((item, index) => <tr key={index}>
          <td className="center">{index + 1}</td><td>{item.name}</td><td className="center">{item.sku}</td><td className="center">{item.unit}</td>
          <td className="numeric">{money(item.requested)}</td><td className="numeric">{money(item.quantity)}</td><td className="numeric">{money(item.unitPrice)}</td>
          {showDiscount && <td className="numeric">{money(totals.discounts[index] + totals.allocated[index])}</td>}
          <td className="numeric">{money(totals.taxable[index])}</td>
          {showVat && <><td className="numeric">{item.vatRate ?? data.vatRate}%</td><td className="numeric">{money(totals.lineVat[index])}</td></>}
          <td className="numeric">{money(totals.taxable[index] + totals.lineVat[index])}</td>
          {showNotes && <td>{item.note?.trim()}</td>}
        </tr>)}
        {summaries.map(({ label, amount }) => <tr className="paper-total" key={label}>
          <th colSpan={summarySpan}>{label}</th><td className="numeric">{money(amount)}</td>{showNotes && <td />}
        </tr>)}
      </tbody>
    </table>
    <div className="paper-ending">
      <div>Tổng số tiền (Viết bằng chữ): {moneyInWords(totals.total)}</div>
      <div className="paper-write-in"><span>- Thông tin thanh toán: {data.paymentInfo}</span></div>
      <div className="paper-write-in"><span>- Số chứng từ gốc kèm theo: {data.attachments}</span></div>
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
