// Isolated manual preview: no dotenv, MongoDB, production API or stock mutations.
import express from 'express';
import { createServer } from 'vite';
import { randomUUID } from 'node:crypto';
import { normalizeStockIssue, type SavedStockIssue } from '../src/lib/stockIssue.js';
import { demoCustomer, demoProducts } from './stockIssueDemoData.js';

const app = express();
const records: SavedStockIssue[] = [];
let customer = { ...demoCustomer };
app.use(express.json());
app.get('/api/customers', (_req, res) => res.json([customer]));
app.get('/api/products', (_req, res) => res.json(demoProducts));
app.put('/api/customers/:id', (req, res) => {
  if (req.params.id !== customer._id) return res.status(404).json({ message: 'Không tìm thấy khách mẫu.' });
  if (typeof req.body.address === 'string') customer.address = req.body.address.trim();
  if (req.body.type === 'wholesale' || req.body.type === 'retail') customer.type = req.body.type;
  res.json(customer);
});
app.get('/api/integrations/appsheet/status', (_req, res) => res.json({ enabled: false, state: 'disabled', message: 'Bản thử chưa gửi dữ liệu lên Google Sheets hoặc AppSheet.' }));
app.get('/api/warehouses', (_req, res) => res.json([{ _id: 'demo-warehouse', name: 'Kho quận 1', address: '38/15 Nguyễn Giản Thanh, Phường Hòa Hưng, Thành phố Hồ Chí Minh' }]));
app.get('/api/stock-issues', (req, res) => {
  const q = String(req.query.q || '').toLocaleLowerCase();
  res.json(records.filter(record => `${record.number} ${record.recipient} ${record.phone}`.toLocaleLowerCase().includes(q)).slice(0, 50));
});
app.post('/api/stock-issues', (req, res) => {
  try {
    const data = normalizeStockIssue(req.body);
    const existing = records.find(record => record.requestId === req.body.requestId);
    if (existing) return res.json(existing);
    const record = { ...data, _id: randomUUID(), number: `PXK${data.date.replaceAll('-', '')}-${String(records.length + 1).padStart(4, '0')}`, requestId: req.body.requestId, createdAt: new Date().toISOString() };
    records.unshift(record); res.status(201).json(record);
  } catch (error) { res.status(400).json({ message: (error as Error).message }); }
});
const vite = await createServer({
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },
  server: { middlewareMode: true, hmr: false }, appType: 'custom',
});
app.use(vite.middlewares);
app.get('/', async (_req, res) => {
  const html = '<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chạy thử — Phiếu xuất kho</title></head><body><div id="root"></div><script type="module" src="/scripts/stock-issue-demo.tsx"></script></body></html>';
  res.type('html').send(await vite.transformIndexHtml('/', html));
});
app.listen(5180, '127.0.0.1', () => console.log('Bản chạy thử phiếu xuất kho: http://127.0.0.1:5180'));
