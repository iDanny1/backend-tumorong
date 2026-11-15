import React from 'react';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { StockIssuePaper } from '../src/components/stock-issues/StockIssuePaper.js';
import { normalizeStockIssue } from '../src/lib/stockIssue.js';
import { freshIssue, recoverIssueDraft } from '../src/lib/stockIssueDrafts.js';

const sample = {
  ...freshIssue('Người lập'), documentType: 'handover' as const,
  warehouseName: 'Kho chính', keeper: 'Người giao', receiver: 'Người nhận',
  paymentInfo: 'SECRET-BANK', debitAccount: 'SECRET-DEBIT', creditAccount: 'SECRET-CREDIT',
  items: [{ productId: '', name: 'Sản phẩm thử', sku: 'SP01', unit: 'Hộp', requested: 3, quantity: 2, unitPrice: 1234567, vatRate: -1, discount: 99999999, note: 'Giao nguyên hộp' }],
};

test('handover prints no financial data even before normalization and with legacy pricing', () => {
  for (const pricingVersion of [undefined, 2] as const) {
    const html = renderToStaticMarkup(<StockIssuePaper data={{ ...sample, pricingVersion }} number="BBBG20261116-0001" />);
    assert.match(html, /BIÊN BẢN BÀN GIAO/);
    assert.match(html, /Sản phẩm thử/);
    assert.match(html, /Giao nguyên hộp/);
    assert.match(html, /BBBG20261116-0001/);
    assert.match(html, /Bên giao/);
    assert.match(html, /Bên nhận/);
    assert.match(html, /Người giao/);
    assert.equal((html.match(/class="signature-name"/g) || []).length, 2);
    assert.doesNotMatch(html, /Đơn giá|VAT|chiết khấu|Chiết khấu|Thành tiền|Tổng số tiền|thanh toán|SECRET-|1\.234\.567|Kế toán trưởng|Giám đốc/);
    assert.equal((html.match(/<col style=/g) || []).length, 7);
  }
});

test('handover saves without VAT selection and strips copied monetary values', () => {
  const data = normalizeStockIssue(sample);
  assert.equal(data.documentType, 'handover');
  assert.equal(data.items[0].quantity, 2);
  assert.equal(data.items[0].unitPrice, 0);
  assert.equal(data.items[0].vatRate, 0);
  assert.equal(data.items[0].discount, 0);
  assert.equal(data.paymentInfo, '');
  assert.equal(data.debitAccount, '');
  assert.equal(data.creditAccount, '');
  assert.equal(data.billDiscount, 0);
  assert.deepEqual(normalizeStockIssue(data), data);
  assert.throws(() => normalizeStockIssue({ ...sample, items: [{ ...sample.items[0], quantity: 4 }] }));
  assert.throws(() => normalizeStockIssue({ ...sample, documentType: 'invalid' }));
});

test('draft recovery and archived drafts retain handover type', () => {
  const draft = recoverIssueDraft({ form: sample, requestId: 'handover-draft-123' }, 'Người lập');
  assert.equal(draft?.form.documentType, 'handover');
  assert.equal(draft?.form.keeper, 'Người giao');
  assert.equal(draft?.form.receiver, 'Người nhận');
  assert.equal(normalizeStockIssue(draft!.form).documentType, 'handover');
  assert.equal(recoverIssueDraft({ form: freshIssue('A'), requestId: 'old-draft' }, 'A')?.form.documentType, undefined);
});
