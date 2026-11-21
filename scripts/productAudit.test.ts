// Exercise the real modules with isolated model doubles.
// No dotenv, server startup, live MongoDB connection or production writes.
import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import * as xlsx from 'xlsx';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import productRouter from '../src/routes/productRoutes.js';
import spreadsheetRouter from '../src/routes/spreadsheetRoutes.js';
import { syncOrderInventory } from '../src/services/orderInventory.js';
import { routeRoles } from '../src/security/admin.js';

function handlers(context: TestContext, model: Record<string, any>) {
  for (const [method, implementation] of Object.entries(model)) {
    context.mock.method(Product, method as any, implementation);
  }
  const routes = new Map<string, Function>();
  for (const [router, prefix] of [[productRouter, '/api/products'], [spreadsheetRouter, '']] as const) {
    for (const layer of router.stack) {
      if (!layer.route) continue;
      const route = layer.route as typeof layer.route & { methods: Record<string, boolean> };
      const path = prefix + (prefix && route.path === '/' ? '' : route.path);
      for (const method of Object.keys(route.methods)) {
        routes.set(`${method} ${path}`, route.stack.at(-1)!.handle);
      }
    }
  }
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

test('Excel import preserves zero stock', async context => {
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ 'Tên': 'Audit zero', 'Giá': 10, 'Tồn kho': 0 }]), 'Products');
  const rows: any[] = [];
  const call = handlers(context, { create: async (row: any) => rows.push(row) });
  const response = await call('post /api/products/import', { file: { buffer: xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) } });
  assert.equal(response.status, 200);
  assert.equal(rows[0].stock, 0);
});

test('sales product updates cannot write warehouse inventory', async context => {
  assert.ok(routeRoles('PUT', '/api/products/p').includes('sales'));
  let written: any;
  await handlers(context, { findByIdAndUpdate: async (_id: string, change: any) => { written = change.$set; } })('put /api/products/:id', {
    adminUser: { role: 'sales' }, body: { name: 'Audit', stock: 999, warehouseStock: { warehouseA: 999 } },
  });
  assert.equal(written?.stock, undefined);
  assert.equal(written?.warehouseStock, undefined);
});

test('updating a nonexistent product returns 404', async context => {
  const result = await handlers(context, { findByIdAndUpdate: async () => null })('put /api/products/:id', { body: { name: 'Audit' } });
  assert.equal(result.status, 404);
});

function inventory(context: TestContext, initialStock: number) {
  let stock = initialStock;
  context.mock.method(Product, 'findById', async () => ({ stock }) as any);
  context.mock.method(Product, 'findByIdAndUpdate', async (_id: string, change: any) => { stock = change.$set.stock; });
  context.mock.method(Order, 'findByIdAndUpdate', async () => {});
  context.mock.method(console, 'log', () => {});
  context.mock.method(console, 'error', () => {});
  return { sync: syncOrderInventory, stock: () => stock };
}
const order = (id: string, quantity: number) => ({ _id: id, items: [{ id: 'product-a', quantity }], stockDeducted: false });

test('confirm and cancel a fully stocked order restores initial stock', async context => {
  const f = inventory(context, 10), doc = order('a', 3);
  await f.sync(doc, 'confirmed'); assert.equal(f.stock(), 7);
  await f.sync(doc, 'cancelled'); assert.equal(f.stock(), 10);
});

test('cancel after an insufficient-stock confirmation never creates inventory', async context => {
  const f = inventory(context, 2), doc = order('a', 5);
  await f.sync(doc, 'confirmed');
  await f.sync(doc, 'cancelled');
  assert.equal(f.stock(), 2);
});

test('concurrent confirmations deduct both orders', async context => {
  const f = inventory(context, 10);
  await Promise.all([f.sync(order('a', 3), 'confirmed'), f.sync(order('b', 3), 'confirmed')]);
  assert.equal(f.stock(), 4);
});
