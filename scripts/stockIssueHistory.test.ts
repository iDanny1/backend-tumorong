import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import stockIssueRouter from '../src/routes/stockIssueRoutes.js';
import { issueDayLabel } from '../src/lib/stockIssueHistory.js';

test('history groups all papers from September, searches literally and paginates days and papers independently', async context => {
  const records = Array.from({ length: 55 }, (_, i) => ({
    _id: String(i), number: `PXK20261104-${i}`, requestId: `request-${i}`,
    createdAt: new Date(2026, 10, 4, 0, i).toISOString(),
    data: { date: '2026-11-04', recipient: i === 0 ? 'Khách .*' : 'Khách thường', phone: '0900000000' },
  }));
  records.push(...Array.from({ length: 30 }, (_, i) => ({
    ...records[1], _id: `september-${i}`, data: { ...records[1].data, date: `2026-09-${String(i + 1).padStart(2, '0')}` },
  })), { ...records[0], _id: 'old', data: { ...records[0].data, date: '2026-08-31' } });
  const matches = (row: any, filter: any) => {
    const date = filter['data.date'];
    if (typeof date === 'string' && row.data.date !== date) return false;
    if (date?.$gte && row.data.date < date.$gte) return false;
    if (date?.$lt && row.data.date >= date.$lt) return false;
    return !filter.$or || filter.$or.some((entry: any) => {
      const [field, search] = Object.entries(entry)[0] as [string, any];
      const value = field.startsWith('data.') ? row.data[field.slice(5)] : row[field];
      return new RegExp(search.$regex, search.$options).test(value);
    });
  };
  const Model = mongoose.model('StockIssue');
  context.mock.method(Model, 'aggregate', async (pipeline: any[]) => {
    assert.deepEqual(pipeline.map(stage => Object.keys(stage)[0]), ['$match', '$group', '$sort', '$limit', '$project']);
    assert.deepEqual(pipeline[1], { $group: { _id: '$data.date', count: { $sum: 1 } } });
    const counts = new Map<string, number>();
    records.filter(row => matches(row, pipeline[0].$match)).forEach(row => counts.set(row.data.date, (counts.get(row.data.date) || 0) + 1));
    return [...counts].sort(([a], [b]) => b.localeCompare(a)).slice(0, pipeline[3].$limit).map(([date, count]) => ({ date, count }));
  });
  context.mock.method(Model, 'find', (filter: any) => ({ sort: () => ({ skip: (offset: number) => ({ limit: (limit: number) => ({
    lean: async () => records.filter(row => matches(row, filter)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(offset, offset + limit),
  }) }) }) }));
  const app = express(); app.use('/api/stock-issues', stockIssueRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  context.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/stock-issues`;
  const get = async (path: string) => { const response = await fetch(url + path); assert.equal(response.status, 200); return response.json(); };
  const first = await get('/days');
  assert.equal(first.days.length, 30);
  assert.equal(first.hasMore, true);
  assert.deepEqual(first.days[0], { date: '2026-11-04', count: 55 }, 'count includes papers beyond the old 50-paper limit');
  const last = await get(`/days?before=${first.days.at(-1).date}`);
  assert.deepEqual(last, { days: [{ date: '2026-09-01', count: 1 }], hasMore: false });
  const search = await get('/days?q=' + encodeURIComponent('.*'));
  assert.deepEqual(search, { days: [{ date: '2026-11-04', count: 1 }], hasMore: false });
  const day = await get('/day?date=2026-11-04');
  assert.equal(day.items.length, 50); assert.equal(day.hasMore, true);
  assert.ok(day.items.every((row: any) => row.date === '2026-11-04'));
  const next = await get('/day?date=2026-11-04&offset=50');
  assert.equal(next.items.length, 5); assert.equal(next.hasMore, false);
  assert.equal(new Set([...day.items, ...next.items].map(row => row._id)).size, 55);
  const daySearch = await get('/day?date=2026-11-04&q=' + encodeURIComponent('.*'));
  assert.equal(daySearch.items.length, 1); assert.equal(daySearch.items[0].recipient, 'Khách .*');
  for (const path of ['/days?before=2026-02-30', '/day?date=2026-08-31', '/day?date=2026-09-31', '/day?date=2026-11-04&offset=-1', '/day?date=2026-11-04&offset=abc', '/day']) {
    assert.equal((await fetch(url + path)).status, 400, path);
  }
});

test('history dates have clear Vietnamese labels across months and years', () => {
  assert.equal(issueDayLabel('2026-09-01'), 'Ngày 1 tháng 9 năm 2026');
  assert.equal(issueDayLabel('2027-01-02'), 'Ngày 2 tháng 1 năm 2027');
});
