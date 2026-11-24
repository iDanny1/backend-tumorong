import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { Request, Response } from 'express';
import { stockCountDay } from '../src/lib/stockCount.js';
import { StockCount } from '../src/models/StockCount.js';
import { Product } from '../src/models/Product.js';
import { Warehouse } from '../src/models/Warehouse.js';
import router from '../src/routes/stockCountRoutes.js';
import { routeRoles } from '../src/security/admin.js';
import { stockCountWorkbook } from '../src/services/stockCountReport.js';
import * as xlsx from 'xlsx';
import mongoose from 'mongoose';
import { sendStockCountMail } from '../src/services/stockCountMail.js';
import { stockReportCc, stockReportRecipients } from '../src/lib/stockCount.js';

test('Gmail submits one message per reviewed report, retrying only a confirmed failure', async t => {
  const restore = ['STOCK_REPORT_GOOGLE_CLIENT_ID', 'STOCK_REPORT_GOOGLE_CLIENT_SECRET', 'STOCK_REPORT_GOOGLE_REFRESH_TOKEN'].map(key => [key, process.env[key]]);
  t.after(() => { for (const [key, value] of restore) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  for (const [key] of restore) process.env[key] = 'fixture';
  const day = '2026-11-24', id = randomUUID();
  const observations = ['Lan', 'Minh', 'Lan'].map((name, i) => ({
    _id: i ? randomUUID() : id, day, createdAt: new Date(day + (i ? 'T08:00:00Z' : 'T09:30:00Z')), quantity: 0, checkerName: name, countedBy: 'Nhân viên nhập liệu',
  }));
  t.mock.method(StockCount, 'find', () => ({ sort: () => ({ lean: async () => observations }) }));
  const delivery = mongoose.model('StockCountMailDelivery');
  const seen = new Map();
  t.mock.method(delivery, 'exists', async () => null);
  t.mock.method(delivery, 'updateOne', async (filter, update, options) => {
    const current = seen.get(filter._id);
    if (options?.upsert && current && current.status !== 'failed') throw Object.assign(Error(), { code: 11000 });
    seen.set(filter._id, { ...current, ...update.$set });
  });
  t.mock.method(delivery, 'findById', (key: string) => ({ lean: async () => seen.get(key) }));
  let attempts = 0;
  let outcome: 'failed' | 'sent' | 'unknown' = 'failed';
  const fake = async ({ sender, checkers, checkedTime, to, cc }) => {
    assert.equal(checkedTime, '16h30');
    assert.deepEqual(to, ['cs.1@agrivietnam.org', 'cs.2@agrivietnam.org', 'ecom@agrivietnam.org', 'admin@agrivietnam.org']);
    assert.deepEqual(cc, ['info@agrivietnam.org']);
    assert.deepEqual(checkers, ['Lan', 'Minh']);
    assert.equal(sender, 'q10@agrivietnam.org');
    attempts++;
    return outcome;
  };
  await assert.rejects(sendStockCountMail(day, 'staff', 2, id, fake), /Tải lại/);
  assert.equal(attempts, 0);
  const first = await sendStockCountMail(day, 'staff', observations.length, id, fake);
  assert.deepEqual(first.map(r => r.recipient), [...stockReportRecipients, ...stockReportCc]);
  assert.ok(first.every(r => r.status === 'failed'));
  outcome = 'sent';
  const second = await sendStockCountMail(day, 'staff', observations.length, id, fake);
  assert.ok(second.every(r => r.status === 'sent'));
  await sendStockCountMail(day, 'staff', observations.length, id, fake);
  assert.equal(attempts, 2);
  seen.clear();
  outcome = 'unknown';
  await Promise.all([1, 2].map(() => sendStockCountMail(day, 'staff', observations.length, id, fake)));
  await sendStockCountMail(day, 'staff', observations.length, id, fake);
  assert.equal(attempts, 3);
  assert.deepEqual(routeRoles('POST', '/api/stock-counts/report/email'), ['admin', 'warehouse']);
});

test('daily workbook keeps the latest count for each product and warehouse, with full history', () => {
  const day = '2026-11-24';
  const latest = {
    _id: '3', day, warehouseId: '1', warehouseName: 'Kho A', productId: '1', productName: 'Trà', sku: '001',
    quantity: 0, unit: 'hộp', packaging: '10 gói', countedBy: 'Lan', createdAt: new Date(day + 'T11:00:00Z'),
  };
  const rows = [latest, { ...latest, _id: '2', warehouseId: '2', warehouseName: 'Kho B', quantity: 3 },
    { ...latest, _id: '1', createdAt: new Date(day + 'T10:00:00Z'), quantity: 5 }];
  const workbook = xlsx.read(stockCountWorkbook(day, rows), { type: 'buffer' });
  const totals = xlsx.utils.sheet_to_json<any>(workbook.Sheets['Tổng hợp']);
  assert.deepEqual(totals.map(r => [r.Kho, r.SKU, r['Số lượng'], r['Số lượt kiểm'], r['Giờ kiểm (VN)']]),
    [['Kho A', '001', 0, 2, '18:00:00'], ['Kho B', '001', 3, 1, '18:00:00']]);
  assert.equal(xlsx.utils.sheet_to_json(workbook.Sheets['Chi tiết lượt kiểm']).length, 3);
  assert.equal(xlsx.read(stockCountWorkbook(day, [])).SheetNames.length, 2);
  assert.deepEqual(routeRoles('GET', '/api/stock-counts/report'), ['admin', 'warehouse']);
});

const request = (method: string, body: object = {}, query: object = {}) =>
  new Promise<{ status: number; data: any }>((resolve, reject) => {
    const req = { url: '/', method, body, query, adminUser: { _id: 'staff-1', name: 'Nhân viên kho' } };
    const res = {
      statusCode: 200,
      status(code: number) { this.statusCode = code; return this; },
      json(data: unknown) { resolve({ status: this.statusCode, data }); },
    };
    router(req as Request, res as Response, () => reject(Error('Missing route')));
  });

test('warehouse day follows midnight in Vietnam and access requires warehouse or admin', () => {
  assert.equal(stockCountDay(new Date('2026-11-24T16:59:59Z')), '2026-11-24');
  assert.equal(stockCountDay(new Date('2026-11-24T17:00:00Z')), '2026-11-25');
  for (const method of ['GET', 'POST']) assert.deepEqual(routeRoles(method, '/api/stock-counts'), ['admin', 'warehouse']);
  for (const method of ['PUT', 'DELETE']) assert.equal(routeRoles(method, '/api/stock-counts'), null);
});

test('counts preserve zero, history and actor, retries do not duplicate, recounts append', async t => {
  const records = new Map<string, any>();
  const base = { warehouseId: 'a'.repeat(24), productId: 'b'.repeat(24), packaging: 'Hộp 10 gói', quantity: 0, requestId: randomUUID() };
  t.mock.method(Product, 'findOne', () => ({ lean: async () => ({ name: 'Trà sâm', sku: 'TS', unit: 'hộp' }) }));
  t.mock.method(Warehouse, 'findOne', () => ({ lean: async () => ({ name: 'Kho A' }) }));
  t.mock.method(StockCount, 'findById', (id: string) => ({ lean: async () => records.get(id) }));
  t.mock.method(StockCount, 'create', async (row: any) => {
    if (records.has(row._id)) throw Object.assign(Error('duplicate'), { code: 11000 });
    records.set(row._id, row);
  });
  t.mock.method(StockCount, 'find', ({ day }: { day: string }) => ({
    sort: () => ({ select: () => ({ lean: async () => [...records.values()].filter(row => row.day === day) }) }),
  }));

  const results = await Promise.all([request('POST', base), request('POST', base)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
  assert.equal((await request('POST', { ...base, quantity: 4 })).status, 409);
  assert.equal(records.size, 1);
  const original = records.get(base.requestId);
  assert.equal(original.quantity, 0);
  assert.equal(original.countedBy, 'Nhân viên kho');
  assert.equal(original.productName, 'Trà sâm');
  assert.equal(original.packaging, 'Hộp 10 gói');
  original.day = '2026-01-03';
  const recount = { ...base, requestId: randomUUID(), quantity: 1.5, checkerName: 'Lan' };
  const next = await request('POST', recount);
  assert.equal(records.get(recount.requestId).checkerName, 'Lan');
  assert.equal(records.get(recount.requestId).countedBy, 'Nhân viên kho');
  assert.equal((await request('POST', { ...recount, checkerName: 'Minh' })).status, 409);
  assert.equal(next.status, 201);
  assert.equal(records.size, 2);
  const history = await request('GET', {}, { day: original.day });
  assert.deepEqual(history.data.map(row => row.quantity), [0]);
  assert.equal((await request('GET', {}, { day: '2026-02-30' })).status, 400);
  for (const fields of [{ quantity: -1 }, { quantity: '' }, { packaging: ' ' }, { countedBy: 'other' }, { day: '2026-01-03' }]) {
    assert.equal((await request('POST', { ...base, ...fields })).status, 400);
  }
});
