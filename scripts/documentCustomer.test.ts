import assert from 'node:assert/strict';
import { test } from 'node:test';
import { customerSchema } from '../src/models/Customer.js';
import { customerFromOrder, customerFromQuote, customerFromStockIssue, syncDocumentCustomer } from '../src/services/documentCustomer.js';

const copy = <T>(value: T): T => value == null ? value : structuredClone(value);

function fakeModel(initial: any[] = []) {
  const records = copy(initial);
  let sequence = records.length;
  let duplicateNextInsert = false;
  function matches(row: any, filter: any): boolean {
    return Object.entries(filter).every(([field, expected]: [string, any]) => {
      const actual = row[field];
      if (expected instanceof RegExp) return expected.test(actual || '');
      if (expected && typeof expected === 'object' && '$in' in expected) {
        return expected.$in.some((value: any) => value == null ? actual == null
          : Array.isArray(actual) ? actual.includes(value) : actual === value);
      }
      if (Array.isArray(actual)) return actual.includes(expected);
      return field === '_id' ? String(actual) === String(expected) : actual === expected;
    });
  }
  function apply(row: any, update: any) {
    if (update.$set) Object.assign(row, update.$set);
    for (const [field, value] of Object.entries(update.$addToSet || {})) {
      const current = row[field] || [];
      if (records.some(other => other !== row && other[field]?.includes(value))) {
        throw Object.assign(new Error('Duplicate key'), { code: 11000, keyPattern: { documentKeys: 1 } });
      }
      row[field] = [...new Set([...current, value])];
    }
    for (const [field, value] of Object.entries(update.$pull || {})) row[field] = row[field]?.filter((entry: any) => entry !== value);
  }
  return {
    records,
    simulateConcurrentInsert() { duplicateNextInsert = true; },
    init: async () => {},
    findOne: async (filter: any) => copy(records.find(row => matches(row, filter)) || null),
    findById: async (id: string) => copy(records.find(row => String(row._id) === id) || null),
    find: async (filter: any) => copy(records.filter(row => matches(row, filter))),
    updateOne: async (filter: any, update: any) => {
      const row = records.find(row => matches(row, filter));
      if (row) apply(row, update);
      return { matchedCount: row ? 1 : 0 };
    },
    findOneAndUpdate: async (filter: any, update: any, options: any = {}) => {
      let row = records.find(row => matches(row, filter));
      if (!row && options.upsert) {
        row = { _id: (++sequence).toString(16).padStart(24, '0'), ...copy(update.$setOnInsert) };
        records.push(row);
        if (duplicateNextInsert) {
          duplicateNextInsert = false;
          throw Object.assign(new Error('Concurrent insert won'), { code: 11000, keyPattern: { documentKeys: 1 } });
        }
      }
      if (!row) return null;
      apply(row, update);
      return copy(row);
    },
  };
}

test('normalizes Vietnamese whitespace and phone formats; retries and parallel saves reuse one customer', async () => {
  const model = fakeModel();
  const input = { name: '  Nguyễn   Văn An  ', phone: '+84 (901) 234-567', address: ' 12  Lê Lợi ', deliveryAddress: '12 Lê Lợi' };
  const first = await syncDocumentCustomer(input, model);
  assert.equal(first.name, 'Nguyễn Văn An');
  assert.equal(first.phone, '0901234567');
  assert.equal(first.phoneRaw, '+84 (901) 234-567');
  const repeated = await Promise.all(Array.from({ length: 8 }, () => syncDocumentCustomer({
    ...input, name: 'nguyễn văn an'.normalize('NFD'), phone: '84.901.234.567', address: '12 lê lợi', deliveryAddress: '12 lê lợi',
  }, model)));
  assert.ok(repeated.every(row => row._id === first._id));
  assert.equal(model.records.length, 1);
  assert.equal(model.records[0].name, 'Nguyễn Văn An');
});

test('matches legacy profiles without overwriting customer history or nonempty display values', async () => {
  const model = fakeModel([{
    _id: '000000000000000000000001', name: '  Công ty  Hoa Mai ', phone: '+84 901 234 567', address: '1 Lê Lợi',
    totalSpent: 500000, ordersCount: 4, remainingPoints: 12, totalPoints: 20, tags: ['VIP'], type: 'wholesale',
  }]);
  const customer = await syncDocumentCustomer({ name: 'công ty hoa mai', phone: '0901234567', address: '1 lê lợi',
    deliveryAddress: 'Kho B', contactName: 'Anh Minh', email: 'minh@example.com' }, model);
  assert.equal(model.records.length, 1);
  assert.equal(customer.phone, '+84 901 234 567');
  assert.equal(customer.address, '1 Lê Lợi');
  assert.equal(customer.deliveryAddress, 'Kho B');
  assert.equal(customer.contactName, 'Anh Minh');
  assert.equal(customer.email, 'minh@example.com');
  assert.equal(customer.ordersCount, 4);
  assert.equal(customer.totalSpent, 500000);
  assert.equal(customer.remainingPoints, 12);
  assert.equal(customer.totalPoints, 20);
  assert.deepEqual(customer.tags, ['VIP']);
  assert.equal(customer.type, 'wholesale');
  assert.equal(customer.documentKeys.length, 1);
});

test('shared phones, distinct destinations and conflicting details stay separate', async () => {
  const model = fakeModel();
  const customer = { name: 'Đơn vị A', phone: '0901234567', address: 'Trụ sở', deliveryAddress: 'Kho A', contactName: 'Anh An' };
  await syncDocumentCustomer(customer, model);
  for (const changes of [
    { name: 'Đơn vị B' }, { deliveryAddress: 'Kho B' }, { phone: '0907654321' },
    { address: 'Trụ sở mới' }, { contactName: 'Chị Bình' },
  ]) await syncDocumentCustomer({ ...customer, ...changes }, model);
  assert.equal(model.records.length, 6);
  assert.equal(model.records[0].deliveryAddress, 'Kho A');
  assert.equal(model.records[0].contactName, 'Anh An');
});

test('selected IDs are checked and ambiguous names do not select an arbitrary customer', async () => {
  const model = fakeModel([
    { _id: '000000000000000000000001', name: 'Khách A', phone: '0901234567' },
    { _id: '000000000000000000000002', name: 'Khách A', phone: '0907654321' },
  ]);
  const named = await syncDocumentCustomer({ name: 'Khách A' }, model);
  assert.equal(model.records.length, 3);
  assert.notEqual(named._id, model.records[0]._id);
  const explicitlyChosen = await syncDocumentCustomer({ customerId: model.records[1]._id, name: 'Khách A' }, model);
  assert.equal(explicitlyChosen._id, model.records[1]._id, 'An explicit choice takes precedence over an ambiguous name-only alias');
  const selected = await syncDocumentCustomer({ customerId: model.records[0]._id, name: 'Khách B', phone: '0901234567' }, model);
  assert.equal(selected.name, 'Khách B');
  assert.notEqual(selected._id, model.records[0]._id);
  assert.equal(model.records[0].name, 'Khách A');
  const invalid = await syncDocumentCustomer({ customerId: 'not-an-object-id', name: 'Khách B', phone: '0901234567' }, model);
  assert.equal(invalid._id, selected._id);
});

test('a name-only quotation can be enriched safely by a later document', async () => {
  const model = fakeModel();
  const quote = await syncDocumentCustomer(customerFromQuote({ customerName: 'Khách mới' }), model);
  const full = await syncDocumentCustomer({ name: 'Khách mới', phone: '0901234567', address: 'Địa chỉ mới' }, model);
  assert.equal(full._id, quote._id);
  assert.equal(full.phone, '0901234567');
  assert.equal(model.records.length, 1);
  assert.equal((await syncDocumentCustomer({ name: 'Khách mới' }, model))._id, quote._id);
});

test('identical canonical legacy profiles reuse a deterministic existing customer', async () => {
  const model = fakeModel([
    { _id: '000000000000000000000002', name: '  Khách   cũ ', phone: '+84 901 234 567', address: '1 Lê Lợi', totalSpent: 2000 },
    { _id: '000000000000000000000001', name: 'khách cũ', phone: '0901234567', address: '1 lê lợi', totalSpent: 1000 },
  ]);
  const chosen = await syncDocumentCustomer({ name: 'Khách cũ', phone: '0901234567', address: '1 Lê Lợi' }, model);
  assert.equal(chosen._id, '000000000000000000000001');
  assert.equal(chosen.totalSpent, 1000);
  assert.equal(model.records.length, 2);
  assert.equal((await syncDocumentCustomer({ name: 'Khách cũ', phone: '0901234567', address: '1 Lê Lợi' }, model))._id, chosen._id);
});

test('concurrent enrichment cannot overwrite another save and unique-key collisions are retried', async () => {
  const model = fakeModel([{ _id: '000000000000000000000001', name: 'Khách mới' }]);
  const results = await Promise.all([
    syncDocumentCustomer({ name: 'Khách mới', phone: '0901234567' }, model),
    syncDocumentCustomer({ name: 'Khách mới', phone: '0907654321' }, model),
  ]);
  assert.notEqual(results[0]._id, results[1]._id);
  assert.deepEqual(model.records.map(row => row.phone).sort(), ['0901234567', '0907654321']);
  const collision = fakeModel();
  collision.simulateConcurrentInsert();
  assert.equal((await syncDocumentCustomer({ name: 'Khách đồng thời' }, collision)).name, 'Khách đồng thời');
  assert.equal(collision.records.length, 1);
});

test('explicit profile edits retire stale aliases without reverting the edited profile', async () => {
  const model = fakeModel();
  const input = { name: 'Khách mới', phone: '0901234567' };
  const original = await syncDocumentCustomer(input, model);
  model.records[0].phone = '0907654321';
  const saved = await syncDocumentCustomer(input, model);
  assert.notEqual(saved._id, original._id);
  assert.equal(model.records[0].phone, '0907654321');
  assert.equal(model.records.length, 2);
});

test('maps customer fields from each document while ignoring seller and warehouse fields', () => {
  assert.deepEqual(customerFromStockIssue({ isOrganization: true, organizationName: 'Công ty mới', recipient: 'Anh An',
    customerId: 'kh1', phone: '0901234567', address: 'Trụ sở', deliveryAddress: 'Kho nhận', companyName: 'Người bán', warehouseName: 'Kho xuất' }), {
    customerId: 'kh1', name: 'Công ty mới', contactName: 'Anh An', phone: '0901234567', address: 'Trụ sở', deliveryAddress: 'Kho nhận',
  });
  const individual = customerFromStockIssue({ recipient: 'Khách lẻ', deliveryAddress: 'Nhà khách' });
  assert.equal(individual.name, 'Khách lẻ');
  assert.equal(individual.address, 'Nhà khách');
  for (const organizationName of [undefined, '', '   ']) {
    const fallback = customerFromStockIssue({ isOrganization: true, organizationName, recipient: 'Anh Bình', phone: '0901234567', deliveryAddress: 'Nhà khách' });
    assert.equal(fallback.name, 'Anh Bình');
    assert.equal(fallback.contactName, '');
    assert.equal(fallback.address, 'Nhà khách');
  }
  const order = customerFromOrder({ customerName: 'Tên đơn', customerPhone: '0901234567', address: 'Địa chỉ đơn',
    customer: { name: 'Tên phụ', phone: '0907654321', email: 'khach@example.com', contactName: 'Liên hệ', departmentAddress: 'Bộ phận', deliveryAddress: 'Điểm giao' } });
  assert.deepEqual(order, { customerId: undefined, name: 'Tên đơn', phone: '0901234567', address: 'Địa chỉ đơn',
    email: 'khach@example.com', contactName: 'Liên hệ', departmentAddress: 'Bộ phận', deliveryAddress: 'Điểm giao' });
});

test('missing names create no customer; storage failures propagate for document retry', async () => {
  const model = fakeModel();
  assert.equal(await syncDocumentCustomer({ phone: '0901234567', name: '  ' }, model), null);
  assert.equal(model.records.length, 0);
  model.findOne = async () => { throw new Error('Database unavailable'); };
  await assert.rejects(syncDocumentCustomer({ name: 'Khách mới' }, model), /Database unavailable/);
});

test('normalized document aliases have a sparse unique database index', () => {
  assert.ok(customerSchema.indexes().some(([keys, options]) => keys.documentKeys === 1 && options.unique && options.sparse));
  assert.equal(customerSchema.path('documentKeys').options.default, undefined);
});
