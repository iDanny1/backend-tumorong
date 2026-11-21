import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';
import express from 'express';
import * as xlsx from 'xlsx';
import { Product } from '../src/models/Product.js';
import { Customer } from '../src/models/Customer.js';
import productRouter from '../src/routes/productRoutes.js';
import customerRouter from '../src/routes/customerRoutes.js';
import spreadsheetRouter from '../src/routes/spreadsheetRoutes.js';
import createIntegrationRouter from '../src/routes/integrationRoutes.js';

// Real middleware and routers, isolated model doubles, and localhost only.
async function fixture(context: TestContext, options: { role?: string; rootDir?: string } = {}) {
  const app = express();
  app.set('case sensitive routing', true);
  app.use(express.json());
  app.use((req, _res, next) => {
    req.adminUser = { role: options.role || 'admin' };
    next();
  });
  app.use(spreadsheetRouter);
  app.use('/api/products', productRouter);
  app.use('/api/customers', customerRouter);
  if (options.rootDir) app.use(createIntegrationRouter(options.rootDir));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return (route: string, init?: RequestInit) => fetch(`http://127.0.0.1:${address.port}${route}`, init);
}

test('product router preserves catalog filtering, sorting, and generic database errors', async context => {
  const filters: unknown[] = [];
  const sorting: unknown[] = [];
  let unavailable = false;
  context.mock.method(Product, 'find', ((filter: unknown) => {
    filters.push(filter);
    return { sort: async (sort: unknown) => {
      sorting.push(sort);
      if (unavailable) throw new Error('private database detail');
      return [{ _id: 'product-1', name: 'Sâm Ngọc Linh', price: 120000 }];
    } };
  }) as any);
  const request = await fixture(context);
  const response = await request('/api/products?categoryId=category-1&active=false');
  assert.equal(response.status, 200);
  assert.deepEqual(filters, [{ categoryIds: 'category-1', active: false }]);
  assert.deepEqual(sorting, [{ isFeatured: -1, createdAt: -1 }]);
  assert.equal((await response.json())[0].name, 'Sâm Ngọc Linh');

  unavailable = true;
  const failed = await request('/api/products');
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
});

test('customer Excel export and multipart reimport retain Vietnamese text, phones, and delivery addresses', async context => {
  const customer = {
    _id: 'customer-1', name: 'Công ty Hoa Mai', phone: '0901234567',
    phoneRaw: '0901234567 - Chị Lan', address: '12 Lê Lợi',
    departmentAddress: 'Phòng Kế toán', deliveryAddress: 'Kho Đà Nẵng',
    email: 'lan@example.com', type: 'wholesale', ordersCount: 3, totalSpent: 450000,
    createdAt: '2026-11-01T00:00:00.000Z',
  };
  const imported: any[] = [];
  context.mock.method(Customer, 'find', (() => ({ lean: async () => [customer] })) as any);
  context.mock.method(Customer, 'findOne', (async () => null) as any);
  context.mock.method(Customer, 'create', (async (row: any) => { imported.push(row); return row; }) as any);
  const request = await fixture(context);
  const response = await request('/api/customers/export');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition') || '', /customers\.xlsx/);
  assert.equal(response.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const buffer = await response.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: 'array' });
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
  assert.equal(rows[0]['Số điện thoại'], '0901234567');
  assert.equal(rows[0]['Địa điểm giao hàng'], 'Kho Đà Nẵng');

  const form = new FormData();
  form.append('file', new Blob([buffer]), 'customers.xlsx');
  const restored = await request('/api/customers/import', { method: 'POST', body: form });
  assert.equal(restored.status, 200);
  const result = await restored.json();
  assert.equal(result.inserted, 1);
  assert.equal(result.existing, 0);
  assert.equal(result.skipped, 0);
  assert.equal(imported[0].name, customer.name);
  assert.equal(imported[0].phone, customer.phone);
  assert.equal(imported[0].phoneRaw, customer.phoneRaw);
  assert.equal(imported[0].contactName, 'Chị Lan');
  assert.equal(imported[0].address, customer.address);
  assert.equal(imported[0].departmentAddress, customer.departmentAddress);
  assert.equal(imported[0].deliveryAddress, customer.deliveryAddress);
  assert.equal(imported[0].ordersCount, customer.ordersCount);
  assert.equal(imported[0].totalSpent, customer.totalSpent);
});

test('customer list keeps warehouse contact access and hides financial history', async context => {
  context.mock.method(Customer, 'find', (() => ({ sort: async () => [{
    _id: 'customer-1', name: 'Hoa Mai', phone: '0901234567', phoneRaw: '0901234567 - Chị Lan',
    contactName: 'Chị Lan', address: '12 Lê Lợi', departmentAddress: 'Kế toán', deliveryAddress: 'Kho A',
    type: 'wholesale', ordersCount: 6, totalSpent: 900000, remainingPoints: 50, totalPoints: 100,
    tags: ['VIP'], email: 'private@example.com',
  }] })) as any);
  const request = await fixture(context, { role: 'warehouse' });
  const response = await request('/api/customers');
  assert.equal(response.status, 200);
  const [customer] = await response.json();
  assert.equal(customer.contactName, 'Chị Lan');
  assert.equal(customer.deliveryAddress, 'Kho A');
  assert.equal(customer.totalSpent, 0);
  assert.equal(customer.ordersCount, 0);
  assert.equal(customer.remainingPoints, 0);
  assert.equal(customer.totalPoints, 0);
  assert.deepEqual(customer.tags, []);
  assert.equal('email' in customer, false);
});

test('spreadsheet imports still reject requests without files', async context => {
  const request = await fixture(context);
  for (const route of ['/api/customers/import', '/api/products/import', '/api/orders/import']) {
    const response = await request(route, { method: 'POST' });
    assert.equal(response.status, 400, route);
    assert.deepEqual(await response.json(), { error: 'Không tìm thấy file' });
  }
});

test('download routes resolve documents from the configured server root', async context => {
  const directory = await mkdtemp(path.join(tmpdir(), 'backend-download-test-'));
  const document = path.join(directory, 'HUONG_DAN_QUAN_TRI.docx');
  await writeFile(document, 'isolated download fixture');
  context.after(async () => { await rm(document); await rmdir(directory); });
  const request = await fixture(context, { rootDir: directory });
  const response = await request('/api/download/huong-dan-quan-tri');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition') || '', /HUONG_DAN_QUAN_TRI\.docx/);
  assert.equal(await response.text(), 'isolated download fixture');
});
