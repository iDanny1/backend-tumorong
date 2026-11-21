import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { freshQuote, normalizeQuote, quotePricing, type QuoteData, type QuoteLine } from '../src/lib/quotation.js';
import router from '../src/routes/quotationRoutes.js';
import { routeRoles } from '../src/security/admin.js';
import { mockDocumentCustomers } from './helpers/documentCustomerModel.js';

const firstLine: QuoteLine = {
  productId: 'sp1', name: 'Trà sâm', unit: 'Hộp', quantity: 2.5, unitPrice: 101,
  discount: 10, discountType: 'percent', vatRate: 8, imageUrl: 'https://images.example/tra.jpg',
  packaging: 'Hộp 10 gói × 3 g',
};
function sample(): QuoteData {
  return {
    ...freshQuote('Người lập'), companyId: 'tmr', salutation: 'Quý Doanh Nghiệp',
    customerName: 'Ruby', date: '2026-11-18', validUntil: '2026-12-01', items: [
      { ...firstLine },
      { ...firstLine, quantity: 3, unitPrice: 111, discount: 33, discountType: 'amount', vatRate: 10 },
    ],
  };
}

test('quote totals use the quoted quantity, whole-line discounts, mixed VAT and whole VND', () => {
  const quote = normalizeQuote(sample());
  const amounts = quotePricing(quote);
  assert.deepEqual(amounts.lines, [253, 333]);
  assert.deepEqual(amounts.discounts, [25, 33]);
  assert.deepEqual(amounts.taxable, [228, 300]);
  assert.deepEqual(amounts.lineVat, [18, 30]);
  assert.equal(amounts.total, 576);
  assert.equal(quote.items[0].packaging, firstLine.packaging);
  assert.equal(quote.items[0].imageUrl, firstLine.imageUrl);
});

test('quote validation covers sender, expiry, row prices and image references', () => {
  for (const changes of [
    { companyId: '' }, { companyId: 'other' }, { salutation: '' }, { customerName: ' ' },
    { date: '2026-02-30' }, { validUntil: '2025-12-31' }, { items: [] },
  ]) {
    assert.throws(() => normalizeQuote({ ...sample(), ...changes }));
  }
  for (const changes of [
    { vatRate: -1 }, { discount: 101 }, { discountType: 'amount', discount: 254 },
    { quantity: 0 }, { unitPrice: 0.5 }, { imageUrl: 'file:///etc/hosts' }, { packaging: 'a'.repeat(501) },
  ]) {
    assert.throws(() => normalizeQuote({ ...sample(), items: [{ ...firstLine, ...changes }] }));
  }
  assert.equal(normalizeQuote({ ...sample(), items: [{ ...firstLine, imageUrl: '', packaging: '', unitPrice: 0 }] }).items[0].unitPrice, 0);
});

// Exercise the mounted Express router with isolated Mongoose methods. No database or socket is needed.
function request(method: string, body: unknown = {}, query: Record<string, string> = {}) {
  const req = { method, url: '/', body, query } as Request;
  return new Promise<{ status: number; result: any }>((resolve, reject) => {
    let status = 200;
    const res = {
      status(code: number) { status = code; return this; },
      json(result: unknown) { resolve({ status, result }); },
    } as Response;
    router(req, res, error => reject(error || new Error('Missing quote route')));
  });
}

test('quote creation is isolated, idempotent and reprints a frozen seller and product snapshot', async context => {
  const customers = mockDocumentCustomers(context);
  const Quote = mongoose.model('Quotation');
  const Counter = mongoose.model('QuotationCounter');
  const records: any[] = [];
  let sequence = 0;
  let failDocument = false;
  context.mock.method(Quote, 'init', async () => Quote);
  context.mock.method(Quote, 'findOne', (filter: any) => ({
    lean: async () => records.find(row => row.requestId === filter.requestId),
  }));
  context.mock.method(Counter, 'findOneAndUpdate', async () => ({ value: ++sequence }));
  context.mock.method(Quote, 'create', async (value: any) => {
    if (failDocument) throw new Error('Quotation database unavailable');
    if (records.some(row => row.requestId === value.requestId)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    const doc = { ...value, _id: new mongoose.Types.ObjectId(), createdAt: new Date() };
    records.push(doc);
    return doc;
  });
  context.mock.method(Quote, 'find', (filter: any) => ({
    sort: () => ({ skip: (offset: number) => ({ limit: (limit: number) => ({
      lean: async () => records.filter(doc => !filter.$or || filter.$or.some((condition: any) => {
        const [field, pattern] = Object.entries(condition)[0] as [string, any];
        const value = field === 'number' ? doc.number : doc.data.customerName;
        return new RegExp(pattern.$regex, pattern.$options).test(value);
      })).slice(offset, offset + limit),
    }) }) }),
  }));
  // Customer profiles are saved automatically; writes to orders, inventory or stock issues remain forbidden.
  mongoose.set('bufferCommands', false);
  context.after(() => mongoose.set('bufferCommands', true));
  for (const method of ['GET', 'POST']) {
    assert.deepEqual(routeRoles(method, '/api/quotations'), ['admin', 'sales', 'warehouse']);
  }
  const body = { ...sample(), companyName: 'Wrong sender', stockDeducted: true,
    number: 'FORGED', total: 1, requestId: 'quote-request-00000001' };
  const created = await request('POST', body);
  assert.equal(created.status, 201);
  assert.equal(created.result.number, 'BG20261118-0001');
  assert.match(created.result.companyName, /TU MƠ RÔNG/);
  assert.equal(created.result.stockDeducted, undefined);
  assert.equal(records[0].totals.total, 576);
  assert.equal(customers.records.length, 1);
  assert.equal(customers.records[0].name, body.customerName);
  assert.equal(customers.records[0].ordersCount, 0);
  assert.equal(customers.records[0].totalSpent, 0);
  assert.equal((await request('POST', body)).status, 200);
  assert.equal((await request('POST', { ...body, customerName: 'Other' })).status, 409);
  assert.equal((await request('POST', { ...body, items: [] })).status, 400);
  assert.equal(records.length, 1);
  assert.equal(customers.records.length, 1, 'Retries and rejected changes do not duplicate or create customers');

  const repeated = { ...body, companyId: 'atuagin', requestId: 'quote-request-00000002' };
  const results = await Promise.all([request('POST', repeated), request('POST', repeated)]);
  assert.deepEqual(results.map(response => response.status).sort(), [200, 201]);
  assert.equal(records.length, 2);
  assert.equal(customers.records.length, 1, 'Concurrent quote saves reuse the same customer');
  assert.match(results[0].result.companyName, /ATUAGIN/);

  body.items[0].unitPrice = 8888;
  body.items[0].packaging = 'Different packaging';
  records[0].companyName = 'Tên pháp nhân lúc lập';
  const history = await request('GET', {}, { q: created.result.number });
  assert.equal(history.result.hasMore, false);
  assert.equal(history.result.items.length, 1);
  assert.equal(history.result.items[0].items[0].unitPrice, 101);
  assert.equal(history.result.items[0].items[0].packaging, firstLine.packaging);
  assert.equal(history.result.items[0].companyName, records[0].companyName);
  assert.deepEqual((await request('GET', {}, { q: '.*' })).result.items, []);

  // Clearing one quantity still allows saving and reprinting the outstanding offer.
  const partial = { ...body, requestId: 'quote-request-00000003', items: [
    { ...firstLine, quantity: null, discountType: 'amount', discount: 200 },
    body.items[1],
  ] };
  assert.equal((await request('POST', partial)).status, 201);
  assert.equal((await request('POST', partial)).status, 200);
  const partialPricing = records.at(-1).totals;
  assert.equal(partialPricing.total, null);
  assert.deepEqual(partialPricing.taxable, [null, 300]);
  assert.equal(records.at(-1).data.items[0].quantity, null);

  failDocument = true;
  const failedSave = { ...sample(), customerName: 'Khách báo giá lỗi', requestId: 'quote-request-failed-save' };
  assert.equal((await request('POST', failedSave)).status, 500);
  assert.equal(customers.records.some(row => row.name === failedSave.customerName), false);
  failDocument = false;

  const recovery = { ...sample(), customerName: 'Khách báo giá mới', requestId: 'quote-request-recovery01' };
  const beforeFailure = records.length;
  customers.fail();
  const unavailable = await request('POST', recovery);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.result.documentSaved, true);
  assert.equal(unavailable.result.requestId, recovery.requestId);
  assert.equal(records.length, beforeFailure + 1);
  assert.equal(customers.records.some(row => row.name === recovery.customerName), false);
  customers.recover();
  assert.equal((await request('POST', recovery)).status, 200);
  assert.equal(records.length, beforeFailure + 1, 'Recovery does not create a second quotation');
  assert.equal(customers.records.filter(row => row.name === recovery.customerName).length, 1);
});

test('custom gift quotes preserve repeated toppings, enforce three and verify component prices', () => {
  const data = sample();
  const gift = { box: { name: 'Box', price: 10 }, toppings: Array.from({ length: 110 }, () => ({ name: 'Tea', price: 2 })) };
  data.items = [{ ...firstLine, quantity: 2, discount: 0, vatRate: 0, unitPrice: 230, gift }];
  const normalized = normalizeQuote(data);
  assert.deepEqual(normalized.items[0].gift, gift);
  assert.equal(quotePricing(normalized).total, 460);
  gift.toppings.splice(3);
  assert.throws(() => normalizeQuote(data));
  data.items[0].unitPrice = 16;
  assert.doesNotThrow(() => normalizeQuote(data));
  gift.toppings.pop();
  data.items[0].unitPrice = 14;
  assert.throws(() => normalizeQuote(data));
});

test('gift toppings add their quoted price per box after box-only discount and VAT', () => {
  const data = sample();
  const gift = {
    pricing: 'box-plus-toppings' as const, box: { name: 'Box', price: 100000 },
    toppings: [10000, 20000, 30000].map(price => ({ name: 'Tea', price })),
  };
  data.items = [{ ...firstLine, gift, quantity: 2, unitPrice: 160000, discount: 10, discountType: 'percent', vatRate: 10 }];
  const prices = quotePricing(normalizeQuote(data));
  assert.equal(prices.productDiscount, 20000);
  assert.equal(prices.vat, 18000);
  assert.equal(prices.total, 318000);
  data.items[0].discountType = 'amount';
  data.items[0].discount = 200001;
  assert.throws(() => normalizeQuote(data));
});
