import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { stockCountMenu, type StockCountRecord } from '../../lib/stockCount';
import type { Product, Warehouse } from '../../types';
import { StockCountHistory } from './StockCountHistory';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-emerald-600';
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
type CountRow = { product: Product; quantity: string; packaging: string };
interface Props {
  products: Product[];
  catalogStatus: 'loading' | 'ready' | 'error';
  reloadCatalog: () => void;
}

export function StockCountForm({ products, catalogStatus, reloadCatalog }: Props) {
  const [history, setHistory] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [checkerName, setCheckerName] = useState('');
  const [warehouseStatus, setWarehouseStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<CountRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const quantityInputs = useRef(new Map<string, HTMLInputElement>());
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const busy = useRef(false);
  const term = normalize(query);
  const matches = term ? products.filter(p => normalize([p.name, p.sku, p.barcode].join(' ')).includes(term)).slice(0, 25) : [];

  useEffect(() => {
    let current = true;
    setWarehouseStatus('loading');
    api.get('/api/warehouses').then((data: Warehouse[]) => {
      if (!current) return;
      setWarehouses(data);
      if (data.length === 1) setWarehouseId(data[0]._id);
      setWarehouseStatus('ready');
    }).catch(() => { if (current) setWarehouseStatus('error'); });
    return () => { current = false; };
  }, [reload]);

  useEffect(() => {
    if (!rows.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [rows.length]);

  function selectProduct(product: Product, packaging = product.packaging || '') {
    if (!rows.some(row => row.product._id === product._id)) {
      if (rows.length >= 200) { setError('Một phiếu tối đa 200 sản phẩm. Lưu phiếu để nhập tiếp.'); return; }
      setRows(previous => [...previous, { product, quantity: '', packaging }]);
    }
    setQuery('');
    setError('');
    setNotice('');
    requestAnimationFrame(() => quantityInputs.current.get(product._id)?.focus());
  }

  function recount(row: StockCountRecord) {
    const product = products.find(p => p._id === row.productId);
    if (!product || !warehouses.some(w => w._id === row.warehouseId)) {
      setError('Kho hoặc sản phẩm chưa có trong danh mục hiện tại. Vui lòng kiểm tra lại.');
      return;
    }
    if (rows.length && warehouseId !== row.warehouseId) {
      setError('Bảng đang có món của kho khác. Lưu bảng hiện tại trước khi kiểm lại kho này.');
      return;
    }
    setWarehouseId(row.warehouseId);
    selectProduct(product, row.packaging);
    setHistory(false);
  }

  function editRow(id: string, changes: Partial<Pick<CountRow, 'quantity' | 'packaging'>>) {
    setRows(previous => previous.map(row => row.product._id === id ? { ...row, ...changes } : row));
    setError('');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !rows.length || !warehouseId) return;
    const invalid = rows.find(row => !/^\d+(?:[.,]\d+)?$/.test(row.quantity.trim()) ||
      !Number.isFinite(Number(row.quantity.replace(',', '.'))) ||
      Number(row.quantity.replace(',', '.')) > Number.MAX_SAFE_INTEGER || !row.packaging.trim());
    if (invalid || !checkerName.trim()) {
      setError(invalid ? `Kiểm tra số lượng và quy cách của ${invalid.product.name}.` : 'Nhập tên người kiểm kê.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    const payload = { warehouseId, checkerName: checkerName.trim(), items: rows.map(row => ({
      productId: row.product._id, quantity: Number(row.quantity.replace(',', '.')), packaging: row.packaging.trim(),
    })) };
    try {
      const key = JSON.stringify(payload);
      if (attempt.current?.key !== key) attempt.current = { key, id: crypto.randomUUID() };
      const result = await api.post('/api/stock-counts/batch', { ...payload, requestId: attempt.current.id });
      attempt.current = null;
      setNotice(`Đã lưu phiếu gồm ${result.count} sản phẩm.`);
      setRows([]);
      setQuery('');
      requestAnimationFrame(() => search.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa xác nhận được phiếu. Thử lưu lại bảng này.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <section aria-label={stockCountMenu} className="mx-auto max-w-5xl space-y-5 p-3 text-slate-800 md:p-6">
    <header>
      <h1 className="text-2xl font-bold">{stockCountMenu}</h1>
      <p className="mt-1 text-sm text-slate-600">Chọn từng món, nhập số lượng vào bảng rồi lưu phiếu khi kiểm xong.</p>
    </header>
    <div className="flex gap-2">
      {['Nhập tồn thực tế', 'Lịch sử kiểm kê'].map((label, i) => <button key={label} type="button"
        aria-pressed={history === Boolean(i)} disabled={saving} onClick={() => { setHistory(Boolean(i)); setError(''); }}
        className={`rounded-lg px-4 py-2 font-semibold ${history === Boolean(i) ? 'bg-emerald-700 text-white' : 'border bg-white'}`}>{label}</button>)}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
      <p role="status">{notice}</p>
      <button type="button" className="font-semibold underline" onClick={() => { setHistory(true); setNotice(''); }}>Xem báo cáo để gửi</button>
    </div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      {history ? <StockCountHistory onRecount={recount} /> : <form onSubmit={save}>
        <fieldset disabled={saving} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 font-semibold">Kho kiểm kê
              <select required className={field} disabled={rows.length > 0} value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                <option value="">{warehouseStatus === 'loading' ? 'Đang tải kho…' : 'Chọn kho'}</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-semibold">Người trực tiếp kiểm kê
              <input className={field} value={checkerName} required maxLength={120} placeholder="Họ tên người đếm hàng"
                onChange={e => setCheckerName(e.target.value)} />
            </label>
          </div>
          {warehouseStatus === 'error' && <p role="alert">Chưa tải được kho. <button type="button" className="underline" onClick={() => setReload(n => n + 1)}>Thử lại</button></p>}
          {warehouseStatus === 'ready' && !warehouses.length && <p>Hãy tạo kho tại mục Quản lý kho để bắt đầu kiểm kê.</p>}
          <div className="relative space-y-2">
            <label className="grid gap-1 font-semibold">Thêm sản phẩm
              <input ref={search} className={field} type="search" value={query} disabled={!warehouseId} placeholder="Nhập tên, SKU hoặc mã vạch"
                onChange={e => setQuery(e.target.value)} onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); if (catalogStatus === 'ready' && matches[0]) selectProduct(matches[0]); }
                  if (e.key === 'Escape') setQuery('');
                }} />
            </label>
            {catalogStatus === 'error' ? <p role="alert">Chưa tải được sản phẩm. <button type="button" className="underline" onClick={reloadCatalog}>Thử lại</button></p> :
              term && (catalogStatus === 'loading' ? <p>Đang tải sản phẩm…</p> : matches.length ?
                <ul className="absolute z-10 max-h-72 w-full overflow-auto divide-y rounded-lg border bg-white shadow-lg">
                  {matches.map(p => <li key={p._id}><button type="button" onClick={() => selectProduct(p)}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 focus:bg-emerald-50">
                    <span className="block font-semibold">{p.name}</span>
                    <small>{[p.sku, p.unit, p.packaging].filter(Boolean).join(' · ')}{rows.some(row => row.product._id === p._id) ? ' · Đã thêm, chọn để sửa' : ''}</small>
                  </button></li>)}
                </ul> : <p>Không tìm thấy sản phẩm phù hợp.</p>)}
          </div>
          {rows.length > 0 && <>
            <div className="space-y-3">
              {rows.map(row => <div key={row.product._id} className="grid items-end gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1.3fr_0.7fr_1fr_auto]">
                <div><strong>{row.product.name}</strong><p className="text-sm text-slate-500">{row.product.sku}</p></div>
                <label className="grid gap-1 text-sm font-semibold">Số lượng ({row.product.unit || 'đơn vị'})
                  <input className={field} inputMode="decimal" required value={row.quantity}
                    ref={element => { if (element) quantityInputs.current.set(row.product._id, element); else quantityInputs.current.delete(row.product._id); }}
                    onChange={e => editRow(row.product._id, { quantity: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search.current?.focus(); } }} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">Quy cách đóng gói
                  <input className={field} required maxLength={500} value={row.packaging} placeholder="Ví dụ 10 gói/hộp"
                    onChange={e => editRow(row.product._id, { packaging: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search.current?.focus(); } }} />
                </label>
                <button type="button" aria-label={`Xóa ${row.product.name} khỏi bảng`} className="rounded-lg px-3 py-2.5 text-red-700"
                  onClick={() => setRows(previous => previous.filter(item => item.product._id !== row.product._id))}>Xóa</button>
              </div>)}
            </div>
            <p className="text-sm text-slate-600">{rows.length} sản phẩm chưa lưu. Có thể sửa trực tiếp hoặc xóa dòng chọn nhầm. Nhấn Enter trong ô số lượng để tìm món tiếp theo.</p>
            <button type="submit" className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              disabled={!warehouseId || !checkerName.trim()}>{saving ? 'Đang lưu…' : `Lưu phiếu kiểm kê (${rows.length} sản phẩm)`}</button>
          </>}
        </fieldset>
      </form>}
    </div>
  </section>;
}
