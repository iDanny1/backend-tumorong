import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StockIssuePaper } from '../src/components/stock-issues/StockIssuePaper.js';
import { newStockIssue, upgradeStockIssue, normalizeStockIssue, stockIssuePricing } from '../src/lib/stockIssue.js';
const sample = { ...upgradeStockIssue(newStockIssue()), recipient: 'Khách thử', warehouseName: 'Kho thử', billDiscount: 1000, items: [
  { productId: '', name: 'Hàng thử', sku: 'SP', unit: 'Hộp', requested: 2, quantity: 2, unitPrice: 100000, vatRate: 8, discount: 10000, discountType: 'amount' as const },
] };
test('all sixteen combinations control columns and total rows independently', () => {
  const expected = stockIssuePricing(sample).total;
  for (let mask = 0; mask < 16; mask++) {
    const [hideVat, hideVatTotal, hideDiscount, hideDiscountTotal] = [1, 2, 4, 8].map(bit => Boolean(mask & bit));
    const data = normalizeStockIssue({ ...sample, hideVat, hideDiscount, hideVatTotal, hideDiscountTotal });
    assert.equal(stockIssuePricing(data).total, expected);
    const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
    assert.equal(html.includes('Tiền VAT (đ)'), !hideVat);
    assert.equal(html.includes('VAT %'), !hideVat);
    assert.equal(html.includes('Chiết khấu (đ)'), !hideDiscount);
    assert.equal(html.includes('Tổng chiết khấu'), !hideDiscountTotal);
    assert.equal(html.includes('Tổng VAT'), !hideVatTotal);
    assert.equal((html.match(/<col style=/g) ?? []).length, 9 + (hideVat ? 0 : 2) + (hideDiscount ? 0 : 1));
    assert.ok(html.includes(`colSpan="${8 + (hideVat ? 0 : 2) + (hideDiscount ? 0 : 1)}"`));
    assert.ok(html.includes('Đơn giá'));
    assert.ok(html.includes('Thành tiền'));
    assert.ok(html.includes('Cộng thành tiền chưa VAT'));
    assert.ok(html.includes('Tổng tiền thanh toán'));
    assert.ok(html.includes('204.120'));
    assert.ok(!html.includes('CK sản phẩm'));
  }
});
test('old combined print options still apply when reprinting or copying an existing issue', () => {
  const { hideVatTotal, hideDiscountTotal, ...old } = sample;
  const data = { ...old, hideVat: true, hideDiscount: true };
  const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
  assert.ok(!html.includes('Tổng VAT') && !html.includes('Tổng chiết khấu'));
  const copy = upgradeStockIssue(data);
  assert.equal(copy.hideVatTotal, true);
  assert.equal(copy.hideDiscountTotal, true);
});
test('an issue with no issuing company keeps the left header empty and prints its saved payment text', () => {
  const data = normalizeStockIssue({ ...sample, noCompany: true, paymentInfo: 'Sacombank – STK 0889479189' });
  assert.equal(data.companyName, '');
  assert.equal(data.companyAddress, '');
  const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
  assert.ok(html.includes('class="paper-letterhead"><div></div><div class="paper-template"'));
  assert.ok(html.includes('Sacombank – STK 0889479189'));
});
test('display settings persist only as booleans and old v2 records keep their shape', () => {
  assert.equal(normalizeStockIssue({ ...sample, hideVat: true }).hideVat, true);
  for (const value of ['false', 0, null]) assert.throws(() => normalizeStockIssue({ ...sample, hideVat: value }));
  const { hideVat, hideDiscount, ...old } = sample;
  const data = normalizeStockIssue(old);
  assert.ok(!('hideVat' in data));
  assert.ok(!('hideDiscount' in data));
});

test('warehouse address survives validation and appears on both printable templates', () => {
  const warehouseLocation = '38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, Thành phố Hồ Chí Minh';
  for (const data of [normalizeStockIssue({ ...sample, warehouseLocation }), normalizeStockIssue({ ...newStockIssue(), recipient: sample.recipient, warehouseName: 'Kho Q10', warehouseLocation, items: sample.items })]) {
    assert.equal(data.warehouseLocation, warehouseLocation);
    const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
    assert.ok(html.includes(warehouseLocation));
  }
});

test('notes follow their own lines and the column disappears when the last note is cleared', () => {
  const item = sample.items[0];
  for (const note of ['', '  ', '  Giao riêng  ']) {
    const data = normalizeStockIssue({ ...sample, items: [item, { ...item, note }] });
    const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
    const rows = html.match(/<tbody>(.*?)<\/tbody>/s)![1].split('</tr>');
    assert.equal(html.includes('Ghi chú</th>'), Boolean(note.trim()));
    assert.ok(!rows[0].includes('Giao riêng'));
    assert.equal(rows[1].includes('>Giao riêng</td>'), Boolean(note.trim()));
    assert.equal(rows[0].match(/<td\b/g)?.length, note.trim() ? 13 : 12);
  }
});

test('company details, optional contact and printable amounts survive save normalization', () => {
  const data = normalizeStockIssue({ ...sample, recipient: '', isOrganization: true, organizationName: 'Đơn vị ABC',
    creatorPhone: '0900000001', phone: '0900000002', address: 'Văn phòng ABC', deliveryAddress: 'Kho giao ABC', paymentInfo: 'Chuyển khoản' });
  const render = (input: typeof data) => renderToStaticMarkup(<StockIssuePaper data={normalizeStockIssue(input)} />);
  const html = render(data);
  for (const value of ['Đơn vị ABC', 'Văn phòng ABC', 'Kho giao ABC', '0900000001', '0900000002', 'Chuyển khoản', '11.000', '189.000', '15.120', '204.120']) assert.ok(html.includes(value), value);
  assert.ok(!html.includes('Khách đơn vị'));
  const individual = render({ ...data, isOrganization: false });
  assert.ok(!individual.includes('Đơn vị ABC') && !individual.includes('Văn phòng ABC'));
  assert.ok(individual.includes('Kho giao ABC'));
});
