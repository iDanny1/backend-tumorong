import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuotationPaper } from '../src/components/quotations/QuotationPaper';
import { freshQuote, type QuoteData } from '../src/lib/quotation';

test('quote paper prints frozen seller, recipient, packaging and discounted line amounts', () => {
  const quote = {
    ...freshQuote('Người lập thử'), companyId: 'tmr', salutation: 'Chị', customerName: 'An',
    companyName: 'Pháp nhân tại ngày lập', companyAddress: 'Địa chỉ tại ngày lập',
    date: '2026-11-18', validUntil: '2026-11-25',
    items: [{ productId: '1', name: 'Sản phẩm thử', unit: 'Hộp', quantity: 2, unitPrice: 14_000,
      discountType: 'percent', discount: 10, vatRate: 8, imageUrl: 'https://example.test/hop.png',
      packaging: 'Hộp 10 gói' }],
  } satisfies QuoteData & {companyName: string; companyAddress: string};
  const html = renderToStaticMarkup(<QuotationPaper data={quote} number="BG-001" />);
  for (const text of ['BG-001', quote.companyName, quote.companyAddress, 'Chị An', '18/11/2026',
    '25/11/2026', 'Hộp 10 gói', 'src="https://example.test/hop.png"', '>SL</th><th scope="col">ĐVT<', 'Thành tiền <br/>(-VAT)', 'Thành tiền <br/>(+VAT)',
    '2.800', '>10%</td>', '25.200', '27.216', 'Người lập thử']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /TU MƠ RÔNG|Phiếu xuất kho|Kế toán trưởng|Chữ ký|Tiền VAT|VAT 8%/);

  const blank = { ...quote.items[0], quantity: null };
  for (const items of [[blank], [blank, quote.items[0]]]) {
    const paper = renderToStaticMarkup(<QuotationPaper data={{ ...quote, items }} />);
    const mixed = items.length === 2;
    assert.equal(paper.includes('>SL</th>'), mixed);
    assert.equal(paper.includes('<td class="quote-paper-center"></td><td class="quote-paper-center">Hộp</td>'), mixed);
    assert.match(paper, />ĐVT<\/th>/);
    const expectedColumns = mixed ? 11 : 10;
    assert.equal((paper.match(/<col style=/g) ?? []).length, expectedColumns);
    assert.equal((paper.match(/<td /g) ?? []).length, items.length * expectedColumns);
    assert.match(paper, /14\.000/);
    assert.doesNotMatch(paper, /Tổng cộng|Bằng chữ|Tổng chưa VAT/);
    assert.equal(paper.includes('27.216'), items.length === 2);
  }

  const amountLine = { ...quote.items[0], discountType: 'amount' as const, discount: 1300 };
  const render = (items: QuoteData['items']) => renderToStaticMarkup(<QuotationPaper data={{ ...quote, items }} />);
  const zero = render([{ ...quote.items[0], discount: 0 }, { ...amountLine, discount: 0 }]);
  assert.doesNotMatch(zero, /Chiết khấu|quote-paper-discount/);
  const fixed = render([amountLine]);
  assert.match(fixed, /colSpan="1">Chiết khấu<\/th>/i);
  assert.match(fixed, />1\.300<\/td>/);
  const combined = render([amountLine, quote.items[0]]);
  assert.match(combined, /colSpan="2">Chiết khấu<\/th>/i);
  assert.match(combined, /colSpan="2">1\.300<\/td>/i);
  assert.match(combined, />10%<\/td><td[^>]*>2\.800<\/td>/);
});

test('gift quote shows each topping name and only the combined price', () => {
  const data: QuoteData = { ...freshQuote(), items: [{
    productId: '', name: 'Gift', unit: 'Box', quantity: 1, unitPrice: 700,
    discount: 0, discountType: 'amount', vatRate: 0, imageUrl: '', packaging: 'Red wrap',
    gift: { box: { name: 'Spring box', price: 100 }, toppings: [100, 200, 300].map(price => ({ name: 'Tea', price })) },
  }] };
  const html = renderToStaticMarkup(<QuotationPaper data={data} />);
  const name = html.match(/<td class="quote-paper-name">([\s\S]*?)<\/td>/)?.[1] || '';
  assert.ok(name.includes('Spring box'));
  assert.equal((name.match(/<div>- Tea<\/div>/g) || []).length, 3);
  assert.doesNotMatch(name, /100|200|300/);
  assert.match(html, />700</);
  assert.match(html, /class="quote-paper-packaging">Red wrap<\/td>/);
});

test('inclusive quote paper shows the full unit-price breakdown and keeps thirteen columns aligned', () => {
  for (const quantity of [null, 8]) {
    for (const discountType of ['amount', 'percent'] as const) {
      const data: QuoteData = { ...freshQuote(), pricesIncludeVat: true, items: [{
        productId: '', name: 'Gift', unit: 'Box', quantity, unitPrice: 2643400,
        discount: 10, discountType, vatRate: 10, imageUrl: '', packaging: '',
      }] };
      const html = renderToStaticMarkup(<QuotationPaper data={data} />);
      assert.match(html, /Thành tiền<br\s*\/?>\(\+VAT\)/);
      assert.match(html, /Đơn giá<br\s*\/?>\(-VAT\)/);
      assert.match(html, /Giá bán \(-VAT\)<br\s*\/?>sau CK/);
      assert.match(html, /Giá bán \(\+VAT\)<br\s*\/?>sau CK/);
      assert.match(html, /Ghi chú \/ Quy cách đóng gói/);
      assert.match(html, /quotation-paper-wide/);
      assert.match(html, /Đơn giá<br\s*\/?>\(\+VAT\)/);
      assert.match(html, /2\.643\.400/);
      const count = discountType === 'percent' ? 14 : 13;
      assert.equal((html.match(/<col style=/g) || []).length, count);
      assert.equal((html.match(/<td /g) || []).length, count + (quantity == null ? 0 : 1));
      if (quantity != null) assert.match(html, new RegExp(`colSpan="${count}" class="quote-paper-summary-cell"`));
    }
  }
});

test('inclusive unit prices after a whole-line discount agree with the line total', () => {
  const data: QuoteData = { ...freshQuote(), pricesIncludeVat: true, items: [{
    productId: '', name: 'Gift', unit: 'Box', quantity: 8, unitPrice: 2640000,
    discount: 80000, discountType: 'amount', vatRate: 10, imageUrl: '', packaging: 'Handle with care',
  }] };
  const html = renderToStaticMarkup(<QuotationPaper data={data} />);
  const headers = [...html.matchAll(/<th scope="col">([\s\S]*?)<\/th>/g)].map(m => m[1]);
  assert.equal(headers.length, 13);
  assert.deepEqual(headers.slice(4, 11), ['Đơn giá<br/>(-VAT)', 'VAT', 'Đơn giá<br/>(+VAT)',
    'Chiết khấu', 'Giá bán (-VAT)<br/>sau CK', 'Giá bán (+VAT)<br/>sau CK', 'Thành tiền<br/>(+VAT)']);
  const row = html.match(/<tbody><tr>([\s\S]*?)<\/tr>/)![1];
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
  assert.deepEqual(cells.slice(2, 11), ['Box', '8', '2.400.000', '10%', '2.640.000',
    '80.000 đ / dòng', '2.390.000', '2.629.000', '21.032.000']);
  assert.equal(cells[12], 'Handle with care');
});

test('inclusive percentage discounts show the rate and pre-VAT money saved per item', () => {
  for (const quantity of [null, 8]) {
    const item: QuoteData['items'][number] = {
      productId: '', name: 'Gift', unit: 'Box', quantity, unitPrice: 2640000,
      discount: 30, discountType: 'percent', vatRate: 10, imageUrl: '', packaging: '',
    };
    const html = renderToStaticMarkup(<QuotationPaper data={{ ...freshQuote(), pricesIncludeVat: true, items: [item] }} />);
    assert.match(html, /<th scope="colgroup" colSpan="2">Chiết khấu<\/th>/);
    assert.doesNotMatch(html, /Tiền chiết khấu|Chiết khấu<br/);
    const row = html.match(/<tbody><tr>([\s\S]*?)<\/tr>/)![1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    assert.equal(cells.length, 14);
    assert.deepEqual(cells.slice(7, 9), ['30%', '720.000']);
    assert.equal(cells[9], '1.680.000');
    assert.equal(cells[10], '1.848.000');
    if (quantity != null) assert.equal(cells[11], '14.784.000');
  }
});
