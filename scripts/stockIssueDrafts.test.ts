import assert from 'node:assert/strict';
import { test } from 'node:test';
import { archiveIssueDraft, freshIssue, hasIssueContent, readIssueDrafts, recoverIssueDraft } from '../src/lib/stockIssueDrafts.js';
import { warehouseAddress, warehouseInput } from '../src/lib/warehouse.js';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

test('archives unfinished input for later recovery without replacing other drafts', () => {
  const storage = memoryStorage();
  const form = { ...freshIssue('Nhân viên'), recipient: 'Khách A', warehouseLocation: 'Địa chỉ kho A', items: [{ productId: 'p', name: 'Chưa hoàn tất', sku: '', unit: '', requested: 2, quantity: 1, unitPrice: 1000, vatRate: -1, discount: 0, discountType: 'amount' as const }] };
  archiveIssueDraft(storage, 'drafts', { form, requestId: 'a' }, 'Nhân viên');
  archiveIssueDraft(storage, 'drafts', { form: { ...form, recipient: 'Khách B' }, requestId: 'b' }, 'Nhân viên');
  const restored = readIssueDrafts(storage, 'drafts', 'Nhân viên');
  assert.equal(restored.length, 2);
  assert.equal(restored[1].requestId, 'a');
  assert.deepEqual(restored[1].form, form);
  archiveIssueDraft(storage, 'drafts', { form: { ...form, phone: '0901234567' }, requestId: 'a' }, 'Nhân viên');
  assert.equal(readIssueDrafts(storage, 'drafts', 'Nhân viên').length, 2);
  assert.equal(readIssueDrafts(storage, 'drafts', 'Nhân viên')[0].form.phone, '0901234567');
});

test('fresh forms clear customer, items and warehouse; detect edits beyond recipient', () => {
  const form = freshIssue('Nhân viên');
  assert.equal(hasIssueContent(form, 'Nhân viên'), false);
  assert.equal(hasIssueContent({ ...form, warehouseLocation: 'Kho đã nhập' }, 'Nhân viên'), true);
  assert.equal(hasIssueContent({ ...form, receiver: 'Người ký' }, 'Nhân viên'), true);
  assert.equal(form.warehouseId, ''); assert.equal(form.warehouseLocation, '');
  assert.equal(form.recipient, ''); assert.deepEqual(form.items, []);
});

test('failed storage leaves existing drafts intact and damaged storage is not overwritten', () => {
  const storage = memoryStorage();
  storage.setItem('drafts', '{bad json');
  assert.throws(() => archiveIssueDraft(storage, 'drafts', { form: freshIssue(''), requestId: 'a' }, ''));
  assert.equal(storage.getItem('drafts'), '{bad json');
  assert.equal(recoverIssueDraft({ form: {} }, ''), null);
  assert.throws(() => archiveIssueDraft({ getItem: () => '[]', setItem: () => { throw new Error('Quota exceeded'); } }, 'drafts', { form: freshIssue(''), requestId: 'a' }, ''));
});

test('warehouse addresses accept both payloads, trim values and reject invalid types', () => {
  assert.deepEqual(warehouseInput({ name: ' Kho mới ', location: ' 123 Đường A ' }), { name: 'Kho mới', address: '123 Đường A', location: '123 Đường A' });
  assert.deepEqual(warehouseInput({ address: 'Địa chỉ mới' }), { address: 'Địa chỉ mới', location: 'Địa chỉ mới' });
  assert.equal(warehouseAddress({ address: '', location: 'Địa chỉ cũ' }), 'Địa chỉ cũ');
  assert.equal(warehouseAddress({ address: 'Địa chỉ mới', location: 'Địa chỉ cũ' }), 'Địa chỉ mới');
  assert.throws(() => warehouseInput({ location: 42 }));
  assert.throws(() => warehouseInput({ name: ' ' }));
});
