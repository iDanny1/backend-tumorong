import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newStockIssue, upgradeStockIssue, normalizeStockIssue, stockIssuePricing, stockIssueAmounts } from '../src/lib/stockIssue.js';
import { issueRows } from '../src/services/appSheetBridge.js';
const sample = () => ({ ...upgradeStockIssue(newStockIssue()), date: '2026-10-03', recipient: 'Khách thử', warehouseName: 'Kho thử', items: [
  { productId: '', name: 'Hàng 5%', sku: 'A', unit: 'Hộp', requested: 2, quantity: 2, unitPrice: 100000, vatRate: 5, discount: 10, discountType: 'percent' as const },
  { productId: '', name: 'Hàng 8%', sku: 'B', unit: 'Hộp', requested: 1, quantity: 1, unitPrice: 120000, vatRate: 8, discount: 10000, discountType: 'amount' as const },
], billDiscount: 29000 });
test('mixed VAT after line discounts and proportional bill discount', () => {
  const data = normalizeStockIssue(sample()); const totals = stockIssuePricing(data);
  assert.deepEqual(totals.discounts, [20000, 10000]);
  assert.deepEqual(totals.allocated, [18000, 11000]);
  assert.deepEqual(totals.taxable, [162000, 99000]);
  assert.deepEqual(totals.lineVat, [8100, 7920]);
  assert.equal(totals.total, 277020);
  assert.equal(totals.taxGroups.length, 2);
  const rows = issueRows({ ...data, _id: 'test', number: 'PXK-TEST', requestId: 'request', createdAt: '' });
  assert.equal(rows.header[13], 277020);
  assert.deepEqual(rows.lines.map(row => row[10]), [5, 8]);
  assert.deepEqual(rows.lines.map(row => row[14]), [8100, 7920]);
});
test('rounding allocations, percent bill discount, partial and free deliveries', () => {
  const data = sample(); data.items.forEach(item => { item.quantity = 1; item.unitPrice = 1; item.discount = 0; }); data.billDiscount = 1;
  assert.deepEqual(stockIssuePricing(normalizeStockIssue(data)).allocated, [1, 0]);
  data.billDiscount = 100; data.billDiscountType = 'percent';
  assert.equal(stockIssuePricing(normalizeStockIssue(data)).total, 0);
  data.items[0].quantity = 0; data.items[1].unitPrice = 0;
  assert.equal(stockIssuePricing(normalizeStockIssue(data)).total, 0);
});
test('rejects missing VAT, negative/oversized discounts and fractional dong', () => {
  for (const rate of [-1, 7, NaN, undefined]) { const data: any = sample(); data.items[0].vatRate = rate; assert.throws(() => normalizeStockIssue(data)); }
  for (const discount of [-1, 101, Infinity, '10']) { const data: any = sample(); data.items[0].discount = discount; assert.throws(() => normalizeStockIssue(data)); }
  for (const discount of [290001, 0.5]) assert.throws(() => normalizeStockIssue({ ...sample(), billDiscount: discount }));
  const data = sample(); data.items[1].discount = 120001; assert.throws(() => normalizeStockIssue(data));
});
test('legacy records keep aggregate VAT rounding when reprinted', () => {
  const legacy = { ...newStockIssue(), items: sample().items.map(({ vatRate, discount, discountType, ...item }) => ({ ...item, unitPrice: 5, quantity: 1 })), vatRate: 10 };
  assert.equal(stockIssueAmounts(legacy).vat, 1);
  assert.equal(stockIssuePricing(upgradeStockIssue(legacy)).vat, 2);
});
