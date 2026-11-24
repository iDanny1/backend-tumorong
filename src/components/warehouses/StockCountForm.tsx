import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { stockCountMenu, type StockCountRecord } from '../../lib/stockCount';
import type { Product, Warehouse } from '../../types';
import { StockCountHistory } from './StockCountHistory';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-emerald-600';
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

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
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [packaging, setPackaging] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const quantityInput = useRef<HTMLInputElement>(null);
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

  function selectProduct(next: Product, pack = next.packaging || '') {
    setProduct(next);
    setPackaging(pack);
    setQuantity('');
    setQuery('');
    setError('');
    setNotice('');
    requestAnimationFrame(() => quantityInput.current?.focus());
  }

  function recount(row: StockCountRecord) {
    const item = products.find(p => p._id === row.productId);
    if (!item || !warehouses.some(w => w._id === row.warehouseId)) {
      setError('Kho hoặc sản phẩm chưa có trong danh mục hiện tại. Vui lòng kiểm tra lại.');
      return;
    }
    setWarehouseId(row.warehouseId);
    selectProduct(item, row.packaging);
    setHistory(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !product || !warehouseId) return;
    const amount = Number(quantity.replace(',', '.'));
    if (!/^\d+(?:[.,]\d+)?$/.test(quantity.trim()) || !Number.isFinite(amount) || amount > Number.MAX_SAFE_INTEGER || !packaging.trim()) {
      setError('Nhập số lượng từ 0 trở lên và quy cách đóng gói.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    const payload = { warehouseId, productId: product._id, quantity: amount, packaging: packaging.trim(), checkerName: checkerName.trim() };
    try {
      const key = JSON.stringify(payload);
      if (attempt.current?.key !== key) attempt.current = { key, id: crypto.randomUUID() };
      await api.post('/api/stock-counts', { ...payload, requestId: attempt.current.id });
      attempt.current = null;
      setNotice(`Đã lưu ${product.name} · ${quantity} ${product.unit || 'đơn vị'}.`);
      setProduct(null);
      setQuantity('');
      setPackaging('');
      setQuery('');
      requestAnimationFrame(() => search.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa xác nhận được lượt kiểm. Vui lòng thử lại.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <section aria-label={stockCountMenu} className="mx-auto max-w-3xl space-y-5 p-3 text-slate-800 md:p-6">
    <header>
      <h1 className="text-2xl font-bold">{stockCountMenu}</h1>
      <p className="mt-1 text-sm text-slate-600">Mỗi lượt lưu ghi nhận số đếm thực tế của một sản phẩm tại một kho.</p>
    </header>
    <div className="flex gap-2">
      {['Nhập tồn thực tế', 'Lịch sử kiểm kê'].map((label, i) => <button key={label} type="button"
        aria-pressed={history === Boolean(i)} disabled={saving} onClick={() => { setHistory(Boolean(i)); setError(''); setNotice(''); }}
        className={`rounded-lg px-4 py-2 font-semibold ${history === Boolean(i) ? 'bg-emerald-700 text-white' : 'border bg-white'}`}>{label}</button>)}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
      <p role="status">{notice}</p>
      <button type="button" className="font-semibold underline" onClick={() => { setHistory(true); setNotice(''); }}>Kiểm xong · Xem báo cáo để gửi</button>
    </div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      {history ? <StockCountHistory onRecount={recount} /> : <form onSubmit={save}>
        <fieldset disabled={saving} className="space-y-5">
          <label className="grid gap-1 font-semibold">Kho kiểm kê
            <select required className={field} value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
              <option value="">{warehouseStatus === 'loading' ? 'Đang tải kho…' : 'Chọn kho'}</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-semibold">Người trực tiếp kiểm kê
            <input className={field} value={checkerName} required maxLength={120} placeholder="Họ tên người đếm hàng"
              onChange={e => setCheckerName(e.target.value)} />
          </label>
          {warehouseStatus === 'error' && <p role="alert">Chưa tải được kho. <button type="button" className="underline" onClick={() => setReload(n => n + 1)}>Thử lại</button></p>}
          {warehouseStatus === 'ready' && !warehouses.length && <p>Hãy tạo kho tại mục Quản lý kho để bắt đầu kiểm kê.</p>}
          {!product ? <div className="space-y-2">
            <label className="grid gap-1 font-semibold">Tìm sản phẩm
              <input ref={search} className={field} type="search" value={query} placeholder="Nhập tên, SKU hoặc mã vạch"
                onChange={e => setQuery(e.target.value)} />
            </label>
            {catalogStatus === 'error' ? <p role="alert">Chưa tải được sản phẩm. <button type="button" className="underline" onClick={reloadCatalog}>Thử lại</button></p> :
              term && (catalogStatus === 'loading' ? <p>Đang tải sản phẩm…</p> : matches.length ? <ul className="max-h-72 overflow-auto divide-y rounded-lg border">
                {matches.map(p => <li key={p._id}><button type="button" onClick={() => selectProduct(p)}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 focus:bg-emerald-50">
                  <span className="block font-semibold">{p.name}</span><small>{[p.sku, p.unit, p.packaging].filter(Boolean).join(' · ')}</small>
                </button></li>)}
              </ul> : <p>Không tìm thấy sản phẩm phù hợp.</p>)}
          </div> : <>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
              <div><strong>{product.name}</strong><p className="text-sm text-slate-600">{product.sku}</p></div>
              <button type="button" className="shrink-0 text-sm font-semibold text-emerald-800" onClick={() => { setProduct(null); setError(''); requestAnimationFrame(() => search.current?.focus()); }}>Đổi món</button>
            </div>
            <label className="grid gap-1 font-semibold">Số lượng thực đếm ({product.unit || 'đơn vị'})
              <input ref={quantityInput} className={field} inputMode="decimal" required value={quantity} onChange={e => setQuantity(e.target.value)} />
            </label>
            <label className="grid gap-1 font-semibold">Quy cách đóng gói
              <input className={field} required maxLength={500} value={packaging} placeholder="Ví dụ 1 hộp gồm 10 gói"
                onChange={e => setPackaging(e.target.value)} />
            </label>
            <button type="submit" className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              disabled={!warehouseId || !checkerName.trim() || !quantity.trim() || !packaging.trim()}>{saving ? 'Đang lưu…' : 'Lưu và kiểm món tiếp theo'}</button>
          </>}
        </fieldset>
      </form>}
    </div>
  </section>;
}
