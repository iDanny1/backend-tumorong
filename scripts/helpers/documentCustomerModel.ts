import type { TestContext } from 'node:test';
import { Customer } from '../../src/models/Customer.js';

const copy = <T,>(value: T): T => structuredClone(value);
const matches = (record: any, filter: any): boolean => Object.entries(filter).every(([field, expected]: [string, any]) => {
  if (field === '$or') return expected.some((part: any) => matches(record, part));
  if (field === '$and') return expected.every((part: any) => matches(record, part));
  const actual = record[field];
  if (expected instanceof RegExp) return expected.test(String(actual ?? ''));
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    return Object.entries(expected).every(([operator, operand]: [string, any]) => {
      if (operator === '$exists') return (actual !== undefined) === operand;
      if (operator === '$in') return operand.some((value: any) => Array.isArray(actual) ? actual.includes(value) : value === null ? actual == null : value === actual);
      if (operator === '$ne') return actual !== operand;
      if (operator === '$eq') return actual === operand;
      if (operator === '$regex') return new RegExp(operand, expected.$options).test(String(actual ?? ''));
      return operator === '$options';
    });
  }
  return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '') === String(expected ?? '');
});

// Isolate route tests from MongoDB while retaining atomic upserts and the unique key constraint.
export function mockDocumentCustomers(context: TestContext) {
  const records: any[] = [];
  let unavailable = false;
  const check = () => { if (unavailable) throw new Error('Customer database unavailable'); };
  context.mock.method(Customer, 'init', async () => { check(); return Customer; });
  context.mock.method(Customer, 'findOne', async (filter: any) => { check(); return copy(records.find(row => matches(row, filter)) ?? null); });
  context.mock.method(Customer, 'findById', async (id: any) => { check(); return copy(records.find(row => String(row._id) === String(id)) ?? null); });
  context.mock.method(Customer, 'find', async (filter: any) => { check(); return copy(records.filter(row => matches(row, filter))); });
  const update = (filter: any, changes: any, options: any = {}) => {
    check();
    let record = records.find(row => matches(row, filter));
    if (!record && !options.upsert) return null;
    const inserted = !record;
    if (!record) record = { _id: String(records.length + 1).padStart(24, '0'), ordersCount: 0, totalSpent: 0, remainingPoints: 0, totalPoints: 0, type: 'retail', tags: [], ...copy(changes.$setOnInsert ?? {}) };
    const next = { ...record, ...copy(changes.$set ?? {}) };
    for (const [field, value] of Object.entries(changes.$addToSet ?? {})) {
      const additions = (value as any)?.$each ?? [value];
      next[field] = [...new Set([...(record[field] ?? []), ...additions])];
    }
    for (const [field, value] of Object.entries(changes.$pull ?? {})) next[field] = (next[field] ?? []).filter((entry: any) => entry !== value);
    if (records.some(row => row !== record && row.documentKeys?.some((key: string) => next.documentKeys?.includes(key)))) {
      throw Object.assign(new Error('Duplicate customer key'), { code: 11000, keyPattern: { documentKeys: 1 } });
    }
    Object.assign(record, next);
    if (inserted) records.push(record);
    return copy(record);
  };
  context.mock.method(Customer, 'findOneAndUpdate', async (filter: any, changes: any, options: any) => update(filter, changes, options));
  context.mock.method(Customer, 'updateOne', async (filter: any, changes: any, options: any) => ({ acknowledged: true, matchedCount: update(filter, changes, options) ? 1 : 0 }));
  return { records, fail: () => { unavailable = true; }, recover: () => { unavailable = false; } };
}
