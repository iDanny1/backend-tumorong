import React, { useState } from 'react';
import { quoteCompanies, quotePricing, type QuoteData } from '../../lib/quotation';
import { money, moneyInWords } from '../../lib/stockIssue';

type PaperData = QuoteData & { companyName?: string; companyAddress?: string };

// Format a calendar date without introducing a time zone conversion.
function paperDate(value: string) {
  return value.split('-').reverse().join('/');
}

function ProductImage({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <span className="quote-paper-image-note">{url ? 'Ảnh chưa tải được' : '—'}</span>;
  }
  return <img src={url} alt={name} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

function QuoteTotals({ pricing, creator }: { pricing: ReturnType<typeof quotePricing>; creator: string }) {
  return <div className="quote-paper-ending">
    <div className="quote-paper-notes">
      <p><b>Bằng chữ</b><br />{moneyInWords(pricing.total)}</p>
      {creator && <p><b>Người lập báo giá</b><br />{creator}</p>}
    </div>
    <dl className="quote-paper-totals">
      <div><dt>Tiền hàng</dt><dd>{money(pricing.subtotal)}</dd></div>
      {pricing.productDiscount > 0 && <div><dt>Chiết khấu</dt><dd>{money(pricing.productDiscount)}</dd></div>}
      <div><dt>Tổng chưa VAT</dt><dd>{money(pricing.total - pricing.vat)}</dd></div>
      <div className="quote-paper-grand"><dt>Tổng cộng</dt><dd>{money(pricing.total)} đ</dd></div>
    </dl>
  </div>;
}

export function QuotationPaper({ data, number }: { data: PaperData; number?: string }) {
  const issuer = quoteCompanies.find(company => company.id === data.companyId);
  const pricing = quotePricing(data);
  const showQuantity = data.items.some(item => item.quantity != null);
  const showDiscount = data.items.some(item => item.discount > 0);
  const splitDiscount = data.items.some(item => item.discountType === 'percent' && item.discount > 0);
  const weights = [3.5, ...(showQuantity ? [15.5, 5] : [20.5]), 5, 10.5,
    ...(splitDiscount ? [6, 10] : showDiscount ? [10] : []), 12, 12, 15, 12.5];
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return <article className="quotation-paper" lang="vi" aria-label="Báo giá">
    <header className="quote-paper-header">
      <div className="quote-paper-issuer">
        <strong>{data.companyName ?? issuer?.name}</strong>
        <p>Địa chỉ: {data.companyAddress ?? issuer?.address}</p>
      </div>
      <div className="quote-paper-heading">
        <h1>BẢNG GIÁ SẢN PHẨM</h1>
        <p className="quote-paper-dates">
          {number && <span>Số {number}</span>}
          <span>Ngày {paperDate(data.date)}</span>
          {data.validUntil && <span>Hiệu lực đến {paperDate(data.validUntil)}</span>}
        </p>
      </div>
    </header>
    <section className="quote-paper-info">
      <p className="quote-paper-recipient"><span>Kính gửi:</span> <strong>{data.salutation} {data.customerName}</strong></p>
      <p>Chúng tôi trân trọng gửi Quý khách bảng giá sản phẩm như sau.</p>
    </section>
    <table className="quote-paper-lines" aria-label="Chi tiết sản phẩm">
      <caption>Đơn vị tiền: đồng (VND)</caption>
      <colgroup>{weights.map((weight, index) =>
        <col key={index} style={{ width: (weight / totalWeight * 100) + '%' }} />)}</colgroup>
      <thead><tr>
        <th scope="col">STT</th><th scope="col">Tên sản phẩm</th>
        {showQuantity && <th scope="col">SL</th>}<th scope="col">ĐVT</th>
        <th scope="col">Đơn giá<br />(-VAT)</th>
        {showDiscount && <th scope={splitDiscount ? 'colgroup' : 'col'} colSpan={splitDiscount ? 2 : 1}>Chiết khấu</th>}
        <th scope="col">Thành tiền <br />(-VAT)</th>
        <th scope="col">Thành tiền <br />(+VAT)</th>
        <th scope="col">Hình ảnh</th><th scope="col">Quy cách đóng gói</th>
      </tr></thead>
      {data.items.map((item, index) => <tbody key={index}><tr>
        <td className="quote-paper-center">{index + 1}</td>
        <td className="quote-paper-name">{item.gift ? <>
          <strong>{item.gift.box.name}</strong>
          {item.gift.toppings.map((part, i) => <div key={i}>- {part.name}</div>)}
        </> : item.name}</td>
        {showQuantity && <td className="quote-paper-center">{item.quantity?.toLocaleString('vi-VN', { maximumFractionDigits: 20 })}</td>}
        <td className="quote-paper-center">{item.unit}</td>
        <td className="quote-paper-numeric">{money(item.unitPrice)}</td>
        {showDiscount && (item.discountType === 'percent' && item.discount > 0 ? <>
          <td className="quote-paper-center quote-paper-discount">{money(item.discount)}%</td>
          <td className="quote-paper-numeric quote-paper-discount">{pricing.discounts[index] != null && money(pricing.discounts[index])}</td>
        </> : <td className="quote-paper-numeric quote-paper-discount" colSpan={splitDiscount ? 2 : 1}>
          {item.discount > 0 && money(item.discount)}
        </td>)}
        <td className="quote-paper-numeric">{pricing.taxable[index] != null && money(pricing.taxable[index])}</td>
        <td className="quote-paper-numeric">{pricing.lineVat[index] != null && money(pricing.taxable[index] + pricing.lineVat[index])}</td>
        <td className="quote-paper-image"><div className="quote-paper-image-frame"><ProductImage key={item.imageUrl} url={item.imageUrl} name={item.name} /></div></td>
        <td className="quote-paper-packaging">{item.packaging || '—'}</td>
      </tr>
      {index === data.items.length - 1 && pricing.total !== null && <tr><td colSpan={weights.length} className="quote-paper-summary-cell">
        <QuoteTotals pricing={pricing} creator={data.creator} />
      </td></tr>}</tbody>)}
    </table>
    {pricing.total === null && data.creator && <p className="quote-paper-notes">Người lập báo giá: {data.creator}</p>}
  </article>;
}
