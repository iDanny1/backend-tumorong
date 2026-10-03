import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StockIssuePaper } from '../src/components/stock-issues/StockIssuePaper.js';
import { newStockIssue, upgradeStockIssue, normalizeStockIssue, stockIssuePricing } from '../src/lib/stockIssue.js';
const sample = { ...upgradeStockIssue(newStockIssue()), recipient: 'Khách thử', warehouseName: 'Kho thử', billDiscount: 1000, items: [
  { productId: '', name: 'Hàng thử', sku: 'SP', unit: 'Hộp', requested: 2, quantity: 2, unitPrice: 100000, vatRate: 8, discount: 10000, discountType: 'amount' as const },
] };
test('four display modes keep payment, quantities and table columns consistent', () => {
  const expected = stockIssuePricing(sample).total;
  for (const hideVat of [false, true]) for (const hideDiscount of [false, true]) {
    const data = normalizeStockIssue({ ...sample, hideVat, hideDiscount });
    assert.equal(stockIssuePricing(data).total, expected);
    const html = renderToStaticMarkup(<StockIssuePaper data={data} />);
    assert.equal(html.includes('Tiền VAT (đ)'), !hideVat);
    assert.equal(html.includes('VAT %'), !hideVat);
    assert.equal(html.includes('Chiết khấu (đ)'), !hideDiscount);
    assert.equal(html.includes('Chiết khấu tổng bill'), !hideDiscount);
    assert.equal((html.match(/<col style=/g) ?? []).length, 8 + (hideVat ? 0 : 2) + (hideDiscount ? 0 : 1));
    assert.ok(html.includes(`colSpan="${7 + (hideVat ? 0 : 2) + (hideDiscount ? 0 : 1)}"`));
    assert.ok(html.includes('Đơn giá'));
    assert.ok(html.includes('Thành tiền'));
    assert.ok(html.includes('Cộng tiền hàng'));
    assert.ok(html.includes('Tổng tiền thanh toán'));
    assert.ok(html.includes('204.120'));
    assert.ok(!html.includes('CK sản phẩm'));
  }
});
test('display settings persist only as booleans and old v2 records keep their shape', () => {
  assert.equal(normalizeStockIssue({ ...sample, hideVat: true }).hideVat, true);
  for (const value of ['false', 0, null]) assert.throws(() => normalizeStockIssue({ ...sample, hideVat: value }));
  const { hideVat, hideDiscount, ...old } = sample;
  const data = normalizeStockIssue(old);
  assert.ok(!('hideVat' in data));
  assert.ok(!('hideDiscount' in data));
});
