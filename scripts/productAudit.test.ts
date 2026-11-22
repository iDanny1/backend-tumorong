// Exercise the real modules with isolated model doubles.
// No dotenv, server startup, live MongoDB connection or production writes.
import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import * as xlsx from 'xlsx';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import productRouter from '../src/routes/productRoutes.js';
import spreadsheetRouter from '../src/routes/spreadsheetRoutes.js';
import { updateOrder, linkDeductedOrder } from '../src/services/orderInventory.js';
import { applyWarehouseMovement, inventoryTransaction } from '../src/services/inventory.js';
import { Warehouse } from '../src/models/Warehouse.js';
import mongoose from 'mongoose';
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

test('sales product updates cannot write warehouse inventory', async context => {
  assert.ok(routeRoles('PUT', '/api/products/p').includes('sales'));
  const response = await handlers(context, { findOneAndUpdate: async () => assert.fail('unexpected catalog write') })('put /api/products/:id', {
    adminUser: { role: 'sales' }, body: { name: 'Audit', stock: 999, warehouseStock: { warehouseA: 999 } },
  });
  assert.equal(response.status, 400);
});

test('updating a nonexistent product returns 404', async context => {
  const result = await handlers(context, { findOneAndUpdate: async () => null })('put /api/products/:id', { body: { name: 'Audit' } });
  assert.equal(result.status, 404);
});

const productId = '507f1f77bcf86cd799439011';
const khoA = '507f1f77bcf86cd799439012';
const khoB = '507f1f77bcf86cd799439013';

// This double models commit/rollback, not Mongo's retry implementation. Each route still
// runs the actual allocation, availability, document-link and transition logic.
function inventory(context: TestContext, stock: number, warehouseStock: Record<string, number>, qty: number) {
  const initialOrder = { items: [{ id: productId, quantity: qty }], status: 'pending', stockDeducted: false };
  let committed = { product: { stock, warehouseStock, name: 'Sản phẩm A' }, orders: { DH1: initialOrder, DH2: initialOrder } };
  let queue = Promise.resolve();
  context.mock.method(mongoose.connection, 'transaction', ((work: any) => {
    const run = queue.then(async () => {
      const tx = structuredClone(committed);
      const result = await work(tx);
      committed = tx;
      return result;
    });
    queue = run.catch(() => {});
    return run;
  }) as any);
  context.mock.method(Warehouse, 'find', (() => ({ lean: async () => [{ _id: khoA }, { _id: khoB }] })) as any);
  context.mock.method(Warehouse, 'updateOne', (async (filter: any) => ({ matchedCount: Number([khoA, khoB].includes(filter._id)) })) as any);
  context.mock.method(Product, 'findById', ((id: string, _fields: string, { session }: any) => ({
    lean: async () => id === productId ? structuredClone(session.product) : null,
  })) as any);
  context.mock.method(Product, 'updateOne', (async (_filter: any, { $set }: any, { session }: any) => {
    Object.assign(session.product, $set);
  }) as any);
  context.mock.method(Order, 'findOne', (async ({ orderCode }: any, _fields: any, { session }: any) => {
    const row = session.orders[orderCode];
    if (!row) return null;
    return { ...structuredClone(row),
      set(changes: any) { Object.assign(this, changes); },
      save() { const { save, set, ...record } = this; session.orders[orderCode] = record; },
    };
  }) as any);
  return { state: () => committed, status: (status: string, id = 'DH1') => updateOrder(id, { status }) };
}

test('confirm/cancel restores the exact split across two warehouses and legacy unallocated stock', async context => {
  const f = inventory(context, 10, { [khoA]: 2, [khoB]: 3 }, 7);
  await f.status('confirmed');
  assert.deepEqual(f.state().product, { stock: 3, warehouseStock: { [khoA]: 0, [khoB]: 0 }, name: 'Sản phẩm A' });
  await f.status('shipping');
  await f.status('cancelled');
  await f.status('cancelled');
  assert.deepEqual(f.state().product, { stock: 10, warehouseStock: { [khoA]: 2, [khoB]: 3 }, name: 'Sản phẩm A' });
});

test('insufficient stock aborts confirmation and subsequent cancellation never creates inventory', async context => {
  const f = inventory(context, 2, {}, 5);
  await assert.rejects(f.status('confirmed'), /thiếu/);
  assert.equal(f.state().orders.DH1.status, 'pending');
  await f.status('cancelled');
  assert.equal(f.state().product.stock, 2);
});

test('concurrent confirmations deduct both orders and a repeated confirmation is idempotent', async context => {
  const f = inventory(context, 10, { [khoA]: 10 }, 3);
  await Promise.all([f.status('confirmed', 'DH1'), f.status('confirmed', 'DH2')]);
  await f.status('confirmed', 'DH1');
  assert.equal(f.state().product.stock, 4);
  assert.equal(f.state().product.warehouseStock[khoA], 4);
});

test('a warehouse never spends unallocated stock and receipts preserve that balance', async context => {
  const f = inventory(context, 8, { [khoA]: 1 }, 1);
  const move = (n: number, direction: 'in'|'out') => inventoryTransaction(session => applyWarehouseMovement(session, khoA, [{ productId, quantity: n }], direction));
  await assert.rejects(move(2, 'out'), /chỉ còn 1/);
  await move(0.3, 'in'); await move(0.1, 'out'); await move(0.2, 'out');
  assert.equal(f.state().product.stock, 8);
  assert.equal(f.state().product.warehouseStock[khoA], 1);
});

test('a linked warehouse document matches the deducted order and cannot double-consume or return the shipment', async context => {
  const f = inventory(context, 5, { [khoA]: 5 }, 2);
  await f.status('confirmed');
  const link = (quantity: number, id: string) => inventoryTransaction(session =>
    linkDeductedOrder(session, 'DH1', khoA, [{ productId, quantity }], id));
  await assert.rejects(link(1, 'paper-a'), /phải khớp/);
  await link(2, 'paper-a');
  await assert.rejects(link(2, 'paper-b'), /chứng từ kho khác/);
  await assert.rejects(f.status('cancelled'), /phiếu nhập/);
  assert.equal(f.state().product.stock, 3);
});
