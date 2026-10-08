import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import express from 'express';
import session from 'express-session';
import { installAdminSecurity, signInAdmin, staffProfile, routeRoles } from '../src/security/admin.js';
import { securityConfig } from '../src/security/config.js';
import { loginLimiter } from '../src/security/loginLimit.js';
import { loginInput, staffInput, customerInput, validateBody } from '../src/security/validation.js';

const origin = 'http://localhost:8080';
async function fixture(role = 'admin', production = false) {
  const user: any = { _id: 'staff-1', username: 'operator', password: 'hash-v1', active: true, role, name: 'Operator', privateKey: 'must-not-leak' };
  const store = new session.MemoryStore(); // Isolated test double, never used in production.
  let unavailable = false;
  const User = { findById: () => ({ select: async () => { if (unavailable) throw Error('db unavailable'); return user; } }) };
  const config = securityConfig({ NODE_ENV: production ? 'production' : 'test', SESSION_SECRET: 'test-only-secret-with-more-than-32-characters', ADMIN_ALLOWED_ORIGINS: production ? 'https://miniapp.tumorong.com' : origin, TRUST_PROXY_HOPS: production ? '1' : '0' });
  const app = express(); app.set('case sensitive routing', true); app.use(express.json());
  installAdminSecurity(app, User, config, store);
  app.post('/api/login', validateBody(loginInput), async (req, res) => { await signInAdmin(req, user); res.json(staffProfile(user)); });
  // Handlers intentionally carry no security; real middleware must protect them.
  app.all('/api/*', (req, res) => res.json({ reached: true }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = '', token = '';
  const request = async (path: string, method = 'GET', body?: any, headers: Record<string, string> = {}) => {
    if (['GET', 'HEAD'].includes(method)) body = undefined;
    const response = await fetch(base + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const set = response.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return response;
  };
  const login = async () => {
    const csrf = await request('/api/auth/csrf'); token = (await csrf.json()).csrfToken;
    const before = cookie;
    const response = await request('/api/login', 'POST', { username: 'operator', password: 'example' }, { Origin: origin, 'X-CSRF-Token': token });
    assert.equal(response.status, 200); assert.notEqual(cookie, before);
    token = (await (await request('/api/auth/csrf')).json()).csrfToken;
    return response;
  };
  return { user, store, config, request, login, get cookie() { return cookie; }, get token() { return token; }, failDatabase: () => unavailable = true,
    close: async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}

test('anonymous clients cannot read CRM, orders, staff, integrations or mutate catalog', async () => {
  const f = await fixture();
  try {
    for (const [method, path] of [['GET','/api/customers'],['GET','/api/customers/abc'],['GET','/api/orders'],['GET','/api/staff'],['POST','/api/products'],['POST','/api/customers/import'],['POST','/api/ghn/create-order'],['POST','/api/spin/admin/quiz'],['POST','/api/vouchers-v2/admin/create'],['GET','/api/integrations/appsheet/status']]) {
      assert.equal((await f.request(path, method, {}, { Authorization: 'Bearer fake', 'x-zalo-id': 'admin' })).status, 401, path);
    }
    assert.equal((await f.request('/api/unregistered')).status, 404);
    assert.equal((await f.request('/api/Customers')).status, 404);
    assert.equal((await f.request('/api/customers%2fexport')).status, 404);
  } finally { await f.close(); }
});

test('existing public Mini App catalog and checkout contracts reach their handlers', async () => {
  const f = await fixture();
  try {
    for (const [method, path] of [['GET','/api/products'],['GET','/api/categories'],['GET','/api/news'],['GET','/api/vouchers-v2/public'],['POST','/api/orders'],['POST','/api/vouchers/validate'],['POST','/api/vouchers-v2/apply'],['POST','/api/spin/register-participant'],['GET','/api/spin/user-info']]) {
      assert.equal((await f.request(path, method, {}, { Origin: 'https://h5.zdn.vn' })).status, 200, path);
    }
    assert.notEqual(routeRoles('POST', '/api/vouchers-v2/confirm-usage'), 'public');
  } finally { await f.close(); }
});

test('login requires an exact trusted origin and synchronizer token, and rotates the session', async () => {
  const f = await fixture();
  try {
    const body = { username: 'operator', password: 'example' };
    const csrf = await f.request('/api/auth/csrf'); const token = (await csrf.json()).csrfToken;
    assert.equal((await f.request('/api/login','POST',body)).status,403);
    assert.equal((await f.request('/api/login','POST',body,{ Origin: 'http://localhost:8080.attacker.invalid', 'X-CSRF-Token': token })).status,403);
    assert.equal((await f.request('/api/login','POST',body,{ Origin: origin, 'X-CSRF-Token': 'é'.repeat(64) })).status,403);
    const response = await f.login(); const profile = await response.json();
    assert.equal(profile.role, 'admin'); assert.equal('password' in profile,false); assert.equal('privateKey' in profile,false);
    assert.equal((await f.request('/api/customers')).status,200);
    assert.equal((await f.request('/api/customers','POST',{})).status,403);
    assert.equal((await f.request('/api/customers','POST',{}, { Origin: origin, 'X-CSRF-Token': f.token })).status,200);
    assert.equal((await f.request('/api/customers','POST',{}, { Origin: 'https://evil.invalid', 'X-CSRF-Token': f.token })).status,403);
  } finally { await f.close(); }
});

test('sales and warehouse rights are enforced independently of frontend buttons', async () => {
  for (const role of ['sales','warehouse']) {
    const f = await fixture(role);
    try {
      await f.login(); const headers = { Origin: origin, 'X-CSRF-Token': f.token };
      assert.equal((await f.request('/api/staff')).status,403);
      assert.equal((await f.request('/api/customers/export')).status,403);
      assert.equal((await f.request('/api/orders')).status,role === 'sales' ? 200 : 403);
      assert.equal((await f.request('/api/products/abc/stock','PATCH',{},headers)).status,role === 'warehouse' ? 200 : 403);
      assert.equal((await f.request('/api/products','POST',{},headers)).status,role === 'sales' ? 200 : 403);
      assert.equal((await f.request('/api/stock-issues','POST',{},headers)).status,200);
    } finally { await f.close(); }
  }
});

test('logout invalidates a captured cookie', async () => {
  const f = await fixture();
  try {
    await f.login(); const captured = f.cookie;
    assert.equal((await f.request('/api/auth/logout','POST',{}, { Origin: origin, 'X-CSRF-Token': f.token })).status,200);
    assert.equal((await f.request('/api/customers','GET',undefined,{ Cookie: captured })).status,401);
  } finally { await f.close(); }
});

test('password, role and account activation changes revoke existing sessions', async () => {
  for (const change of [{ password: 'hash-v2' },{ role: 'warehouse' },{ active: false }]) {
    const f = await fixture();
    try { await f.login(); Object.assign(f.user,change); assert.equal((await f.request('/api/auth/me')).status,401); }
    finally { await f.close(); }
  }
});

test('absolute lifetime and database errors cannot bypass authorization', async () => {
  const f = await fixture();
  try {
    await f.login();
    const sessions = await new Promise<any>((resolve,reject) => f.store.all((error,data) => error ? reject(error) : resolve(data)));
    const [id,data] = Object.entries(sessions)[0] as [string,any]; data.issuedAt = Date.now() - f.config.absoluteMs - 1;
    await new Promise<void>((resolve,reject) => f.store.set(id,data,error => error ? reject(error) : resolve()));
    assert.equal((await f.request('/api/customers')).status,401);
    await f.login(); f.failDatabase(); assert.equal((await f.request('/api/customers')).status,503);
  } finally { await f.close(); }
});

test('production cookies are Secure, HttpOnly, SameSite and never trust arbitrary proxy configuration', async () => {
  assert.throws(() => securityConfig({NODE_ENV:'production'}));
  assert.throws(() => securityConfig({NODE_ENV:'production', SESSION_SECRET:'x'.repeat(32),ADMIN_ALLOWED_ORIGINS:'https://*.invalid'}));
  assert.throws(() => securityConfig({TRUST_PROXY_HOPS:'true'}));
  const f = await fixture('admin',true);
  try {
    assert.equal((await f.request('/api/auth/csrf')).headers.get('set-cookie'),null);
    const response = await f.request('/api/auth/csrf','GET',undefined, {'X-Forwarded-Proto':'https'});
    const cookie = response.headers.get('set-cookie')!;
    assert.match(cookie,/__Host-tumorong\.sid=/); assert.match(cookie,/HttpOnly/); assert.match(cookie,/Secure/); assert.match(cookie,/SameSite=Lax/); assert.match(cookie,/Path=\//); assert.doesNotMatch(cookie,/Domain=/);
  } finally { await f.close(); }
});

test('schemas reject query operators, forged counters, unknown fields and weak new passwords', () => {
  assert.equal(loginInput.safeParse({ username:{$ne:null},password:'x' }).success,false);
  assert.equal(customerInput.safeParse({ name:'Buyer',totalSpent:999999,remainingPoints:999 }).success,false);
  assert.equal(customerInput.safeParse({ $set:{name:'Buyer'} }).success,false);
  assert.equal(staffInput.safeParse({username:'new',password:'weak',role:'admin'}).success,false);
  assert.equal(staffInput.safeParse({username:'new',password:'á'.repeat(37),role:'sales'}).success,false);
  assert.equal(staffInput.safeParse({username:'new',password:'a-long-test-password',role:'superadmin'}).success,false);
  assert.equal(customerInput.safeParse({name:'Buyer',phone:'0900000000',address:'Street'}).success,true);
});

test('shared login limit survives new middleware instances, window rollover and write errors', async () => {
  const counters = new Map<string,number>(); let time = 1000, fail = false;
  const model = { findOneAndUpdate: async ({_id}: any) => { if (fail) throw Error('db down'); const count = (counters.get(_id)||0)+1; counters.set(_id,count); return {count}; } };
  async function run(username: string) {
    let status = 200, nextCalled = false, retry = '';
    const res: any = { setHeader: (_key: string,value: string) => retry = value, status: (value: number) => { status = value; return res; }, json: () => res };
    await loginLimiter(model,() => time)({ip:'127.0.0.1',body:{username}} as any,res,() => { nextCalled = true; });
    return {status,nextCalled,retry};
  }
  for(let i=0;i<10;i++) assert.equal((await run('operator')).nextCalled,true);
  const limited = await run('OPERATOR'); assert.equal(limited.status,429); assert.ok(Number(limited.retry)>0); assert.equal(limited.nextCalled,false);
  time += 15*60*1000; assert.equal((await run('operator')).status,200);
  fail = true; assert.equal((await run('other')).status,503);
});
