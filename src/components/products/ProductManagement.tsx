import { useEffect, useRef, useState } from 'react';
import { api, apiFetch } from '../../lib/api';
import type { Product, Warehouse } from '../../types';

type Props = {
  products: Product[]; role: string; searchQuery: string;
  onAddProduct: () => void; onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void; onRefresh: () => void;
};
const action = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const number = (value: number) => (value || 0).toLocaleString('vi-VN');

export function ProductManagement({ products, role, searchQuery, onAddProduct, onEditProduct, onDeleteProduct, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    api.get('/api/warehouses').then(rows => { if (active) setWarehouses(rows); }).catch(() => { if (active) setNotice('Chưa tải được tên các kho.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setPage(1); }, [search, searchQuery, status]);
  const canEdit = ['sales', 'admin'].includes(role);
  const filtered = products.filter(p => {
    const fields = [p.name, p.sku, p.barcode, p._id].join(' ').toLowerCase();
    return [search, searchQuery].every(q => fields.includes(q.trim().toLowerCase())) &&
      (!status || (p.active !== false) === (status === 'visible'));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 40));
  const current = Math.min(page, pages);
  const excel = async (file?: File) => {
    setBusy(true); setNotice('');
    try {
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const response = await apiFetch('/api/products/import', { method: 'POST', body: form });
        setNotice((await response.json()).message || 'Đã nhập danh mục sản phẩm.');
        onRefresh();
      } else {
        const response = await apiFetch('/api/products/export');
        const url = URL.createObjectURL(await response.blob());
        const a = document.createElement('a');
        a.href = url; a.download = 'products.xlsx'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Chưa xử lý được tệp Excel.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <section className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h1>
      <div className="flex flex-wrap gap-2">
        <button className={action} onClick={onRefresh}>Làm mới</button>
        {role === 'admin' && <><input hidden type="file" accept=".xls,.xlsx" ref={input} onChange={e => { const file = e.target.files?.[0]; if (file) void excel(file); }} />
          <button className={action} disabled={busy} onClick={() => input.current?.click()}>Nhập danh mục Excel</button>
          <button className={action} disabled={busy} onClick={() => void excel()}>Xuất Excel</button></>}
        {canEdit && <button className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white" onClick={onAddProduct}>Thêm sản phẩm</button>}
      </div></header>
    {notice && <p role="status" className="rounded-lg bg-slate-100 p-3">{notice}</p>}
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4"><input className={action} aria-label="Tìm sản phẩm" placeholder="Tên, mã SKU, mã vạch hoặc ID" value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Trạng thái hiển thị" className={action} value={status} onChange={e => setStatus(e.target.value)}><option value="">Mọi trạng thái</option><option value="visible">Đang hiển thị</option><option value="hidden">Đang ẩn</option></select>
        <span className="text-sm text-slate-500">{filtered.length} sản phẩm</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>
        {['Sản phẩm', 'Danh mục', 'Giá bán', 'Tồn kho', 'Hiển thị', ...(canEdit ? ['Thao tác'] : [])].map(s => <th key={s} className="px-4 py-3">{s}</th>)}
      </tr></thead><tbody className="divide-y divide-slate-100">{filtered.slice((current - 1) * 40, current * 40).map(p => {
        const balances = Object.entries(p.warehouseStock || {});
        const unassigned = (p.stock || 0) - balances.reduce((sum, [, quantity]) => sum + quantity, 0);
        return <tr key={p._id}><td className="p-4"><div className="flex items-center gap-3">{p.images?.[0] && <img className="h-10 w-10 rounded object-cover" src={p.images[0]} alt="" />}<div><strong>{p.name || 'Chưa có tên'}</strong>{p.isFeatured && <span className="ml-1 text-amber-700" title="Sản phẩm nổi bật">★</span>}<small className="block text-slate-500">{p.sku || p.barcode || p._id}</small></div></div></td>
          <td className="p-4">{p.categoryNames?.join(', ')}</td><td className="p-4">{number(p.price)} đ</td>
          <td className="p-4"><details><summary className="cursor-pointer">{number(p.stock)} {p.unit}</summary>{balances.map(([id, quantity]) => <div key={id}>{warehouses.find(w => w._id === id)?.name || id} · {number(quantity)}</div>)}{unassigned > 0 && <div>Chưa phân kho · {number(unassigned)}</div>}{!balances.length && !unassigned && <div>Chưa có hàng trong kho.</div>}</details></td>
          <td className="p-4">{p.active === false ? 'Đang ẩn' : 'Đang hiển thị'}</td>
          {canEdit && <td className="p-4"><div className="flex gap-2"><button className={action} onClick={() => onEditProduct(p)}>Sửa</button><button className={action} onClick={() => onDeleteProduct(p._id)}>Ngừng kinh doanh</button></div></td>}</tr>;
      })}</tbody></table></div>
      {filtered.length === 0 && <p className="p-4 text-slate-500">Không có sản phẩm phù hợp.</p>}
      {pages > 1 && <nav aria-label="Trang sản phẩm" className="flex items-center gap-3 p-4"><button className={action} disabled={current <= 1} onClick={() => setPage(current - 1)}>Trang trước</button> {current} / {pages} <button className={action} disabled={current >= pages} onClick={() => setPage(current + 1)}>Trang sau</button></nav>}
    </div>
  </section>;
}
