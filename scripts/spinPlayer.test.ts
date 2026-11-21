import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { getCustomerTotalSpent, isTestSpinUser, normalizePhone } from '../src/services/spinPlayer.js';

function setEnvironment(t: TestContext, values: Record<string, string | undefined>) {
  const original = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function setCustomerModel(t: TestContext, model?: unknown) {
  const original = mongoose.models.Customer;
  if (model === undefined) delete mongoose.models.Customer;
  else mongoose.models.Customer = model as typeof original;
  t.after(() => {
    if (original === undefined) delete mongoose.models.Customer;
    else mongoose.models.Customer = original;
  });
}

function spendingModel(read: () => unknown | Promise<unknown>) {
  return {
    findOne(filter: unknown) {
      assert.deepEqual(filter, { phone: '0974543740' });
      return {
        select(fields: string) {
          assert.equal(fields, 'totalSpent');
          return { lean: read };
        },
      };
    },
  };
}

test('normalizes Vietnamese country codes and formatted phone numbers', () => {
  for (const phone of ['+84 974-543-740', '84974543740', '0974 543 740', '  (0974) 543.740  ']) {
    assert.equal(normalizePhone(phone), '0974543740');
  }
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(undefined as unknown as string), '');
});

test('recognizes configured test phones outside production from either player or supplied identity', t => {
  setEnvironment(t, { NODE_ENV: 'test', TEST_PHONES: ' 0974543740, 0900000000, ' });
  assert.equal(isTestSpinUser({ phone: '0974543740' }), true);
  assert.equal(isTestSpinUser(undefined, '0900000000'), true);
  assert.equal(isTestSpinUser({ phone: '0911111111' }, '0974543740'), true);
  assert.equal(isTestSpinUser(null, '0911111111'), false);
  assert.equal(isTestSpinUser(), false);
});

test('production never enables test privileges even when TEST_PHONES matches', t => {
  setEnvironment(t, { NODE_ENV: 'production', TEST_PHONES: '0974543740' });
  assert.equal(isTestSpinUser({ phone: '0974543740' }), false);
  assert.equal(isTestSpinUser(null, '0974543740'), false);
});

test('missing TEST_PHONES grants no test privileges', t => {
  setEnvironment(t, { NODE_ENV: 'test', TEST_PHONES: undefined });
  assert.equal(isTestSpinUser({ phone: '0974543740' }, '0974543740'), false);
});

test('reads spending from the registered customer model and defaults absent values to zero', async t => {
  let customer: unknown = { totalSpent: 250000 };
  setCustomerModel(t, spendingModel(async () => customer));
  for (const [value, expected] of [
    [{ totalSpent: 250000 }, 250000],
    [{ totalSpent: '200000' }, 200000],
    [{ totalSpent: 0 }, 0],
    [{}, 0],
    [null, 0],
  ] as const) {
    customer = value;
    assert.equal(await getCustomerTotalSpent('0974543740'), expected);
  }
});

test('uses the fallback customer model when none is registered without connecting to a database', async t => {
  setCustomerModel(t);
  const fallback = spendingModel(async () => ({ totalSpent: 300000 }));
  const createModel = t.mock.method(mongoose, 'model', () => fallback as unknown as mongoose.Model<unknown>);
  assert.equal(await getCustomerTotalSpent('0974543740'), 300000);
  assert.equal(createModel.mock.callCount(), 1);
  assert.equal(createModel.mock.calls[0].arguments[0], 'Customer');
});

test('customer lookup failures return zero rather than rejecting spin eligibility checks', async t => {
  setCustomerModel(t, spendingModel(async () => { throw new Error('Database unavailable'); }));
  assert.equal(await getCustomerTotalSpent('0974543740'), 0);
});
