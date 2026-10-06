import assert from 'node:assert/strict';
import { test } from 'node:test';
import { customerFromRow, importCustomerRows } from '../src/lib/customerImport.js';

function fakeModel() {
  const records: any[] = [];
  return {
    records,
    findOne: async (query: any) => records.find(record => record.importKey === query.$or[0].importKey ||
      (!record.importKey && record.name === query.$or[1].name && record.phone === query.$or[1].phone && record.address === query.$or[1].address &&
        (!query.$or[1].$or || !record.deliveryAddress || record.deliveryAddress === query.$or[1].$or[0].deliveryAddress))),
    create: async (record: any) => { records.push({ ...record, _id: String(records.length + 1) }); },
    updateOne: async (query: any, update: any) => { Object.assign(records.find(r => r._id === query._id), update.$set); },
  };
}

test('maps supplied headers, missing phones, department and delivery addresses', () => {
  const customer = customerFromRow({ 'Họ và tên khách': 'Khách sạn', 'Địa chỉ (bộ phận)': 'Bộ phận mua hàng', 'Địa điểm giao hàng': '30 Trần Phú' });
  assert.equal(customer!.name, 'Khách sạn');
  assert.equal(customer!.phone, '');
  assert.equal(customer!.address, 'Bộ phận mua hàng');
  assert.equal(customer!.deliveryAddress, '30 Trần Phú');
  assert.equal(customerFromRow({ 'Số điện thoại': '0901234567' }), null);
});

test('retains original contact and never repairs irregular numbers by guessing', () => {
  const customer = customerFromRow({ 'Tên': 'Nhà hàng', 'Số điện thoại': '0779.525.552 - Anh Thạc' });
  assert.equal(customer!.phone, '0779525552');
  assert.equal(customer!.phoneRaw, '0779.525.552 - Anh Thạc');
  assert.equal(customer!.contactName, 'Anh Thạc');
  assert.equal(customerFromRow({ 'Tên': 'Chị Nở', 'Số điện thoại': '093312052-Chị Phương' })!.phone, '093312052');
});

test('keeps shared contacts and distinct destinations; reimport adds no duplicates', async () => {
  const model = fakeModel();
  const rows = [
    { 'Tên': 'Đơn vị A', 'Số điện thoại': '0966559865', 'Địa điểm giao hàng': '261 Võ Thị Sáu' },
    { 'Tên': 'Kho Hà Nội', 'Số điện thoại': '0966559865', 'Địa điểm giao hàng': '261 Võ Thị Sáu' },
    { 'Tên': 'Kho Hà Nội', 'Địa điểm giao hàng': '100 Võ Chí Công' },
    { 'Tên': 'Khách chưa có số' },
    { 'Tên': 'Đơn vị A', 'Số điện thoại': '0966559865', 'Địa chỉ': '261 Võ Thị Sáu', 'Địa điểm giao hàng': 'Điểm giao khác' },
  ];
  assert.equal((await importCustomerRows(rows, model)).inserted, 5);
  assert.equal((await importCustomerRows(rows, model)).existing, 5);
  assert.equal(model.records.length, 5);
});

test('does not overwrite existing history; reports skipped rows and irregular phones', async () => {
  const model = fakeModel();
  model.records.push({ _id: 'existing', name: 'Khách cũ', phone: '0901234567', address: 'Địa chỉ cũ', totalSpent: 500000, ordersCount: 2 });
  const result = await importCustomerRows([
    { 'Tên': 'Khách cũ', 'Số điện thoại': '0901234567', 'Địa chỉ': 'Địa chỉ cũ', 'Tổng chi tiêu': 0 },
    { 'Tên': 'Số cần kiểm tra', 'Số điện thoại': '086881088' },
    { 'Tên': '' },
  ], model);
  assert.equal(result.existing, 1);
  assert.equal(result.inserted, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.warnings[0].row, 3);
  assert.equal(model.records[0].totalSpent, 500000);
  assert.equal(model.records[0].ordersCount, 2);
  assert.ok(model.records[0].importKey);
});
