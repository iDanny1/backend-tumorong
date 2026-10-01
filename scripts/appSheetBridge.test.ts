import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { bridgeConfig, bridgeTables, customerRow, GoogleSheetsBridge, issueRows, rowHash, type WriteRow } from '../src/services/appSheetBridge.js';
import { newStockIssue } from '../src/lib/stockIssue.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const config = { spreadsheetId: 'test-spreadsheet-id-000000', email: 'test@test.iam.gserviceaccount.com', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const metadata = () => ({ sheets: Object.values(bridgeTables).map((table, index) => ({ properties: { title: table.title, sheetId: index, gridProperties: { rowCount: 1000 } } })) });

test('disabled by default; rejects partial configuration without leaking credentials', () => {
  assert.equal(bridgeConfig({}), null);
  assert.throws(() => bridgeConfig({ APPSHEET_SYNC_ENABLED: 'true', APPSHEET_PRIVATE_KEY: 'SECRET' }), /Chưa đủ/);
  assert.deepEqual(bridgeConfig({ APPSHEET_SYNC_ENABLED: 'true', APPSHEET_SPREADSHEET_ID: config.spreadsheetId, APPSHEET_SERVICE_ACCOUNT_EMAIL: config.email, APPSHEET_PRIVATE_KEY: config.privateKey.replaceAll('\n', '\\n') }), config);
});

test('customer mapping preserves Vietnamese addresses, leading zeros and stable identity', () => {
  const row = customerRow({ _id: 'kh-01', name: 'Khách thử', phone: '0901234567', address: '19 Nguyễn Thị Diệu', type: 'wholesale' });
  assert.deepEqual(row, ['kh-01', 'Khách thử', '0901234567', '19 Nguyễn Thị Diệu', '', 'Sỉ']);
  assert.notEqual(rowHash([row]), rowHash([[...row.slice(0, 3), 'Địa chỉ mới', ...row.slice(4)]]));
});

test('multiple issue lines have distinct keys and exact totals from the supplied form', () => {
  const issue = { ...newStockIssue('NV'), _id: 'px-01', requestId: 'request-01', createdAt: '', number: 'PXK20261001-0001', address: 'Địa chỉ KH', deliveryAddress: 'Địa chỉ giao khác', items: [
    { productId: '', name: 'Atuagin Black', sku: 'AT-BLACK', unit: 'Chai', requested: 12, quantity: 12, unitPrice: 600000 },
    { productId: '', name: 'Trà', sku: 'TRA', unit: 'Hộp', requested: 3, quantity: 3, unitPrice: 250000 },
  ] };
  const { header, lines } = issueRows(issue);
  assert.equal(header[6], 'Địa chỉ KH'); assert.equal(header[7], 'Địa chỉ giao khác');
  assert.deepEqual(header.slice(10, 14), [7950000, 10, 795000, 8745000]);
  assert.deepEqual(lines.map(row => row[0]), ['px-01:1', 'px-01:2']);
  assert.deepEqual(lines.map(row => row[9]), [7200000, 750000]);
});

test('signs scoped JWT correctly and retries lost write responses at the same cells using RAW', async () => {
  const cells = new Map<string, any[]>();
  let tokenRequests = 0; let writes = 0;
  const mock = async (input: any, init: any) => {
    const url = String(input);
    if (url.includes('oauth2.googleapis.com')) {
      tokenRequests++;
      const jwt = new URLSearchParams(init.body).get('assertion')!.split('.');
      assert.ok(verify('RSA-SHA256', Buffer.from(jwt.slice(0, 2).join('.')), publicKey, Buffer.from(jwt[2], 'base64url')));
      const claim = JSON.parse(Buffer.from(jwt[1], 'base64url').toString());
      assert.equal(claim.scope, 'https://www.googleapis.com/auth/spreadsheets');
      return json({ access_token: 'TEST-TOKEN', expires_in: 3600 });
    }
    assert.equal(init.headers.Authorization, 'Bearer TEST-TOKEN');
    if (url.includes('?fields=')) return json(metadata());
    if (url.includes('/values:batchGet')) return json({ valueRanges: new URL(url).searchParams.getAll('ranges').map(range => ({ values: cells.has(range) ? [cells.get(range)] : [] })) });
    assert.ok(url.endsWith('/values:batchUpdate'));
    const body = JSON.parse(init.body);
    assert.equal(body.valueInputOption, 'RAW');
    body.data.forEach((entry: any) => cells.set(entry.range, entry.values[0]));
    if (++writes === 1) throw new Error('lost response after Google committed');
    return json({});
  };
  const bridge = new GoogleSheetsBridge(config, mock as typeof fetch);
  const rows: WriteRow[] = [{ table: 'customers', row: 2, values: customerRow({ _id: 'kh1', name: '=1+1', phone: '0901234567', address: 'Địa chỉ' }) }];
  await assert.rejects(bridge.write(rows), /lost response/);
  await bridge.write(rows);
  assert.equal(writes, 2); assert.equal(cells.size, 1); assert.equal(tokenRequests, 1);
  assert.equal([...cells.values()][0][1], '=1+1');
  assert.equal([...cells.values()][0][2], '0901234567');
});

test('refuses to overwrite moved rows or mismatched headers', async () => {
  let writes = 0;
  const mock = async (url: any, init: any) => {
    if (String(url).includes('oauth2.googleapis.com')) return json({ access_token: 'TEST' });
    if (String(url).includes('?fields=')) return json(metadata());
    if (init.method === 'POST') writes++;
    return json({ valueRanges: [{ values: [['different-customer', 'Existing user']] }] });
  };
  const bridge = new GoogleSheetsBridge(config, mock as typeof fetch);
  await assert.rejects(bridge.write([{ table: 'customers', row: 2, values: customerRow({ _id: 'new-customer' }) }]), /Dừng ghi/);
  await assert.rejects(bridge.validateTables(), /chưa đúng cấu trúc/);
  assert.equal(writes, 0);
});

test('setup refuses existing unrelated data and Google errors do not echo secrets', async () => {
  let writes = 0;
  const mock = async (url: any, init: any) => {
    if (String(url).includes('oauth2.googleapis.com')) return json({ access_token: 'TEST' });
    if (String(url).includes('?fields=')) return json(metadata());
    if (init.method === 'POST') writes++;
    return json({ values: [['OLD HEADER'], ['KEEP ME']] });
  };
  await assert.rejects(new GoogleSheetsBridge(config, mock as typeof fetch).setup(), /bảo vệ dữ liệu/);
  assert.equal(writes, 0);
  const denied = async (url: any) => String(url).includes('oauth2.googleapis.com') ? json({ access_token: 'TEST' }) : json({ error: 'SECRET' }, 403);
  await assert.rejects(new GoogleSheetsBridge(config, denied as typeof fetch).validateTables(), error => /Chưa có quyền/.test(String(error)) && !String(error).includes('SECRET'));
});
