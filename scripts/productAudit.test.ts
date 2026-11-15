// Execute the current server's schema, handlers and inventory helper in isolation.
// No dotenv, server startup, live MongoDB connection or production writes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import { routeRoles } from '../src/security/admin.js';

const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
function section(start: string, end: string) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Server source boundaries changed; update audit harness');
  return source.slice(from, to);
}
function execute(code: string, values: Record<string, any>) {
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  return new Function(...Object.keys(values), js)(...Object.values(values));
}
const schema = execute(section('const productSchema =', 'const Product:') + '\nreturn productSchema;', { Schema: mongoose.Schema });
const Product: any = mongoose.model('ProductAuditIsolated', schema);

function handlers(model: any) {
  const routes = new Map<string, Function>();
  const app = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method, (path: string, ...callbacks: Function[]) => routes.set(`${method} ${path}`, callbacks.at(-1)!)]));
  execute(section("  // --- PRODUCTS ---", '  // --- ORDERS ---') + section('  // PRODUCTS IMPORT', '  // ORDERS IMPORT'), {
    app, Product: model, xlsx, upload: { single: () => () => {} },
  });
  return async (route: string, req: any) => {
    let status = 200, body: any;
    const res: any = { status(value: number) { status = value; return res; }, json(value: any) { body = value; return res; } };
    await routes.get(route)!({ params: { id: '507f1f77bcf86cd799439011' }, query: {}, body: {}, ...req }, res);
    return { status, body };
  };
}

test('product schema rejects missing name and negative price/stock', async () => {
  const doc = new Product({ price: -10, stock: -5 });
  await assert.rejects(doc.validate(), 'Invalid product accepted by the real schema');
});

test('editor fields survive schema serialization', () => {
  const fields = { originalPrice: 200, brand: 'Brand', weight: 500, length: 10, width: 20, height: 30, displayOrder: 2, views: 7, type: 'Vật lý', platform: 'Mini App' };
  const stored = new Product({ name: 'Audit', price: 100, ...fields }).toObject();
  assert.deepEqual(Object.fromEntries(Object.keys(fields).map(key => [key, stored[key]])), fields);
});

test('Excel import preserves zero stock', async () => {
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ 'Tên': 'Audit zero', 'Giá': 10, 'Tồn kho': 0 }]), 'Products');
  const rows: any[] = [];
  const call = handlers({ create: async (row: any) => rows.push(row) });
  const response = await call('post /api/products/import', { file: { buffer: xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) } });
  assert.equal(response.status, 200);
  assert.equal(rows[0].stock, 0);
});

test('sales product updates cannot write warehouse inventory', async () => {
  assert.ok(routeRoles('PUT', '/api/products/p').includes('sales'));
  let written: any;
  await handlers({ findByIdAndUpdate: async (_id: string, change: any) => { written = change.$set; } })('put /api/products/:id', {
    adminUser: { role: 'sales' }, body: { name: 'Audit', stock: 999, warehouseStock: { warehouseA: 999 } },
  });
  assert.equal(written?.stock, undefined);
  assert.equal(written?.warehouseStock, undefined);
});

test('updating a nonexistent product returns 404', async () => {
  const result = await handlers({ findByIdAndUpdate: async () => null })('put /api/products/:id', { body: { name: 'Audit' } });
  assert.equal(result.status, 404);
});

function inventory(initialStock: number) {
  let stock = initialStock;
  const sync = execute(section('async function syncOrderInventory', '// User') + '\nreturn syncOrderInventory;', {
    Product: { findById: async () => ({ stock }), findByIdAndUpdate: async (_id: string, change: any) => { stock = change.$set.stock; } },
    Order: { findByIdAndUpdate: async () => {} }, console: { log() {}, error() {} },
  });
  return { sync, stock: () => stock };
}
const order = (id: string, quantity: number) => ({ _id: id, items: [{ id: 'product-a', quantity }], stockDeducted: false });

test('confirm and cancel a fully stocked order restores initial stock', async () => {
  const f = inventory(10), doc = order('a', 3);
  await f.sync(doc, 'confirmed'); assert.equal(f.stock(), 7);
  await f.sync(doc, 'cancelled'); assert.equal(f.stock(), 10);
});

test('cancel after an insufficient-stock confirmation never creates inventory', async () => {
  const f = inventory(2), doc = order('a', 5);
  await f.sync(doc, 'confirmed');
  await f.sync(doc, 'cancelled');
  assert.equal(f.stock(), 2);
});

test('concurrent confirmations deduct both orders', async () => {
  const f = inventory(10);
  await Promise.all([f.sync(order('a', 3), 'confirmed'), f.sync(order('b', 3), 'confirmed')]);
  assert.equal(f.stock(), 4);
});
