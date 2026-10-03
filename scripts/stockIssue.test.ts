import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moneyInWords, newStockIssue, normalizeStockIssue, stockIssueTotals, upgradeStockIssue } from '../src/lib/stockIssue.js';
import express from 'express';
import mongoose from 'mongoose';
import stockIssueRouter from '../src/routes/stockIssueRoutes.js';

const sample = () => ({ ...newStockIssue('Nhân viên'), date: '2026-09-24', recipient: 'Khách mẫu', warehouseName: 'Kho quận 1', items: [{ productId: '', name: 'Rượu Sâm Ngọc Linh Atuagin Black', sku: '', unit: 'Chai', requested: 12, quantity: 12, unitPrice: 600000 }] });

test('matches supplied paper: 12 bottles, 10% VAT and Vietnamese words', () => {
  const data = normalizeStockIssue(sample());
  assert.deepEqual(stockIssueTotals(data.items, data.vatRate), { lines: [7200000], subtotal: 7200000, vat: 720000, total: 7920000 });
  assert.equal(moneyInWords(7920000), 'Bảy triệu chín trăm hai mươi nghìn đồng');
});

test('uses actual quantities, permits partial delivery and rounds VND', () => {
  const input = sample();
  input.items[0] = { ...input.items[0], requested: 5, quantity: 2.5, unitPrice: 101 };
  input.vatRate = 8;
  assert.deepEqual(stockIssueTotals(normalizeStockIssue(input).items, input.vatRate), { lines: [253], subtotal: 253, vat: 20, total: 273 });
});

test('rejects malformed and dangerous monetary input', () => {
  for (const invalid of [-1, NaN, Infinity, '600000', 1e15]) {
    const input: any = sample(); input.items[0].unitPrice = invalid;
    assert.throws(() => normalizeStockIssue(input));
  }
  assert.throws(() => normalizeStockIssue({ ...sample(), vatRate: 101 }));
  assert.throws(() => normalizeStockIssue({ ...sample(), items: [] }));
  assert.throws(() => normalizeStockIssue({ ...sample(), items: [null] }));
  assert.throws(() => normalizeStockIssue({ ...sample(), date: '2026-02-30' }));
  assert.throws(() => normalizeStockIssue({ ...sample(), recipient: ' ' }));
  assert.throws(() => normalizeStockIssue({ ...sample(), warehouseName: '' }));
});

test('requires a real unit and does not allow over-delivery or empty delivery', () => {
  const input = sample(); input.items[0].quantity = 13;
  assert.throws(() => normalizeStockIssue(input), /Thực xuất/);
  input.items[0].quantity = 0;
  assert.throws(() => normalizeStockIssue(input), /ít nhất/);
  input.items[0].quantity = 1; input.items[0].unit = '';
  assert.throws(() => normalizeStockIssue(input), /đơn vị tính/);
});

test('ignores client totals, document numbers and inventory instructions', () => {
  const input = sample();
  const normalized = normalizeStockIssue({ ...input, total: 1, number: 'FAKE', stockDeducted: true, '$set': { stock: 0 } });
  assert.deepEqual(normalized, input);
  assert.equal(stockIssueTotals(normalized.items, normalized.vatRate).total, 7920000);
});

test('Vietnamese words handle zero, gaps, special endings and billions', () => {
  const cases = new Map([[0, 'Không đồng'], [15, 'Mười lăm đồng'], [21, 'Hai mươi mốt đồng'], [105, 'Một trăm lẻ năm đồng'], [1005, 'Một nghìn không trăm lẻ năm đồng'], [1000000001, 'Một tỷ không trăm lẻ một đồng']]);
  for (const [value, expected] of cases) assert.equal(moneyInWords(value), expected);
  assert.equal(moneyInWords(-1), '');
  assert.equal(moneyInWords(1e12), '');
});

test('HTTP routes validate, persist snapshots, deduplicate retries and search without a live database', async context => {
  const records: any[] = [];
  let sequence = 0;
  const Model = mongoose.model('StockIssue');
  const Counter = mongoose.model('StockIssueCounter');
  context.mock.method(Model, 'init', async () => Model);
  context.mock.method(Counter, 'init', async () => Counter);
  context.mock.method(Model, 'findOne', (query: any) => ({ lean: async () => records.find(row => row.requestId === query.requestId) || null }));
  context.mock.method(Counter, 'findOneAndUpdate', async () => ({ value: ++sequence }));
  context.mock.method(Model, 'create', async (entry: any) => {
    if (records.some(row => row.requestId === entry.requestId)) throw Object.assign(new Error('Duplicate'), { code: 11000 });
    const doc = { ...entry, _id: String(records.length + 1), createdAt: new Date().toISOString() };
    records.push(doc); return doc;
  });
  context.mock.method(Model, 'find', (filter: any) => ({ sort: () => ({ limit: () => ({ lean: async () => {
    if (!filter.$or) return records;
    const search = filter.$or[0].number.$regex;
    const regex = new RegExp(search, 'i');
    return records.filter(row => regex.test(row.number) || regex.test(row.data.recipient) || regex.test(row.data.phone));
  } }) }) }));
  const app = express(); app.use(express.json()); app.use('/api/stock-issues', stockIssueRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  context.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}/api/stock-issues`;
  const payload = { ...sample(), requestId: 'test-request-00000001' };
  const post = (data: any) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const response = await post(payload);
  assert.equal(response.status, 201);
  const first: any = await response.json();
  assert.equal(first.number, 'PXK20260924-0001');
  assert.equal(records[0].totals.total, 7920000);
  assert.equal((await post(payload)).status, 200);
  assert.equal(records.length, 1);
  assert.equal((await post({ ...payload, recipient: 'Khách khác' })).status, 409);
  assert.equal((await post({ ...payload, requestId: 'test-request-00000002', items: [] })).status, 400);
  const concurrent = await Promise.all([post({ ...payload, requestId: 'test-request-00000003' }), post({ ...payload, requestId: 'test-request-00000003' })]);
  assert.ok(concurrent.every(result => [200, 201].includes(result.status)));
  assert.equal(records.length, 2);
  const all: any = await (await fetch(url)).json(); assert.equal(all.length, 2);
  const literalSearch: any = await (await fetch(`${url}?q=${encodeURIComponent('.*')}`)).json();
  assert.equal(literalSearch.length, 0, 'Search treats regex syntax as literal input');
  const modern = { ...upgradeStockIssue(sample()), hideVat: true, hideDiscount: false, requestId: 'test-request-00000004', billDiscount: 100000, items: [
    { ...sample().items[0], vatRate: 5, discount: 10, discountType: 'percent' },
    { ...sample().items[0], name: 'Hàng 8%', quantity: 1, requested: 1, unitPrice: 200000, vatRate: 8, discount: 0, discountType: 'amount' },
  ] };
  const modernResponse = await post({ ...modern, totals: { total: 1 } });
  assert.equal(modernResponse.status, 201);
  const modernRecord: any = await modernResponse.json();
  assert.equal(modernRecord.pricingVersion, 2);
  assert.equal(modernRecord.hideVat, true);
  assert.equal(modernRecord.hideDiscount, false);
  assert.deepEqual(modernRecord.items.map((item: any) => item.vatRate), [5, 8]);
  assert.equal(records.at(-1).totals.billDiscount, 100000);
  assert.ok(records.at(-1).totals.total > 1);
  assert.equal((await post(modern)).status, 200);
  assert.equal(records.length, 3);
  assert.equal((await post({ ...modern, requestId: 'test-request-00000005', billDiscount: 999999999 })).status, 400);
});
