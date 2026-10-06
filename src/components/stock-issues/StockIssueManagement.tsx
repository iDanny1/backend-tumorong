import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, Copy, FileText, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { money, STOCK_ISSUE_COMPANIES, normalizeStockIssue, stockIssueAmounts, stockIssuePricing, upgradeStockIssue, type SavedStockIssue, type StockIssueData, type StockIssueLine } from '../../lib/stockIssue';
import type { Customer, Product, User, Warehouse } from '../../types';
import { StockIssuePaper } from './StockIssuePaper';
import './stock-issues.css';
import { archiveIssueDraft, freshIssue, hasIssueContent, readIssueDrafts, recoverIssueDraft, type IssueDraft } from '../../lib/stockIssueDrafts';
import { warehouseAddress } from '../../lib/warehouse';

type Props = { products: Product[]; customers: Customer[]; user: User };
const findText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const blankLine = (): StockIssueLine => ({ productId: '', name: '', sku: '', unit: '', requested: 1, quantity: 1, unitPrice: 0, vatRate: -1, discount: 0, discountType: 'amount' });
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const readableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  return !message || /failed to fetch|networkerror|load failed/i.test(message)
    ? 'Chưa kết nối được máy chủ. Nội dung phiếu vẫn được giữ; vui lòng thử lại.' : message;
};

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`issue-field ${wide ? 'issue-wide' : ''}`}><span>{label}</span>{children}</label>;
}

export function StockIssueManagement({ products, customers, user }: Props) {
  const draftKey = `stock-issue-draft-v1:${user.username}`;
  const archiveKey = `stock-issue-saved-drafts-v1:${user.username}`;
  const [initial] = useState(() => {
    try {
      const stored = recoverIssueDraft(JSON.parse(localStorage.getItem(draftKey) || 'null'), user.name);
      if (stored) return { ...stored, recovered: true };
    } catch { /* A damaged or disabled browser store must not stop the form. */ }
    return { form: freshIssue(user.name), requestId: crypto.randomUUID(), recovered: false };
  });
  const [form, setForm] = useState<StockIssueData>(initial.form);
  const [requestId, setRequestId] = useState(initial.requestId);
  const [drafts, setDrafts] = useState<IssueDraft[]>(() => {
    try { return readIssueDrafts(localStorage, archiveKey, user.name); } catch { return []; }
  });
  const [draftNotice, setDraftNotice] = useState(initial.recovered ? 'Đã mở lại nội dung đang soạn.' : '');
  const [pendingAction, setPendingAction] = useState<{ kind: 'new'; copy?: StockIssueData; draft?: IssueDraft } | { kind: 'delete' } | null>(null);
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const catalogRequest = useRef(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseError, setWarehouseError] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ state: string; message: string } | null>(null);
  const [storageError, setStorageError] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<SavedStockIssue | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [view, setView] = useState<'form' | 'history'>('form');
  const [history, setHistory] = useState<SavedStockIssue[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyReload, setHistoryReload] = useState(0);
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [preview, setPreview] = useState<{ data: StockIssueData; record: SavedStockIssue | null } | null>(null);
  const [paperScale, setPaperScale] = useState(() => Math.min(1, (window.innerWidth - 48) / (210 * 96 / 25.4)));
  const totals = stockIssuePricing(form);

  useEffect(() => {
    let active = true;
    const refresh = () => api.get('/api/integrations/appsheet/status').then(value => { if (active) setSyncStatus(value); }).catch(() => { if (active) setSyncStatus({ state: 'error', message: 'Chưa kiểm tra được kết nối AppSheet. Bạn vẫn có thể lập và in phiếu.' }); });
    void refresh();
    const timer = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    const fitPaper = () => setPaperScale(Math.min(1, (window.innerWidth - 48) / (210 * 96 / 25.4)));
    window.addEventListener('resize', fitPaper);
    return () => window.removeEventListener('resize', fitPaper);
  }, []);

  useEffect(() => { setCatalogProducts(products); }, [products]);
  const refreshCatalog = useCallback(async () => {
    const request = ++catalogRequest.current;
    setCatalogLoading(true);
    const [productResult, warehouseResult] = await Promise.allSettled([api.get('/api/products'), api.get('/api/warehouses')]);
    if (catalogRequest.current !== request) return;
    if (productResult.status === 'fulfilled') { setCatalogProducts(productResult.value); setCatalogError(''); }
    else setCatalogError('Chưa tải được sản phẩm mới. Chọn “Tải lại danh mục” để thử lại.');
    if (warehouseResult.status === 'fulfilled') { setWarehouses(warehouseResult.value); setWarehouseError(''); }
    else setWarehouseError('Chưa tải được danh sách kho. Bạn vẫn có thể nhập tên và địa chỉ kho bên dưới.');
    setCatalogLoading(false);
  }, []);
  useEffect(() => {
    void refreshCatalog();
    const refresh = () => { void refreshCatalog(); };
    window.addEventListener('focus', refresh);
    return () => { catalogRequest.current++; window.removeEventListener('focus', refresh); };
  }, [refreshCatalog]);

  useEffect(() => {
    if (saved) return;
    try {
      if (hasIssueContent(form, user.name)) localStorage.setItem(draftKey, JSON.stringify({ form, requestId }));
      else localStorage.removeItem(draftKey);
      setStorageError('');
    }
    catch { setStorageError('Trình duyệt chưa giữ được bản nháp. Hãy lưu phiếu trước khi đóng trang.'); }
  }, [form, requestId, saved, draftKey, user.name]);

  useEffect(() => {
    if (view !== 'history') return;
    let active = true;
    setHistoryLoading(true); setHistoryError('');
    api.get(`/api/stock-issues?q=${encodeURIComponent(historyQuery)}`).then(data => { if (active) setHistory(data); })
      .catch((err: Error) => { if (active) setHistoryError(readableError(err)); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [view, historyQuery, historyReload]);

  useEffect(() => {
    if (!preview || pendingAction) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) setPreview(null);
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.issue-preview-root button:not(:disabled)'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, pendingAction]);

  useEffect(() => {
    if (!pendingAction) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPendingAction(null); setError(''); }
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.issue-confirm button'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [pendingAction]);

  const change = <K extends keyof StockIssueData>(key: K, value: StockIssueData[K]) => { setForm(prev => ({ ...prev, [key]: value })); setError(''); };
  const updateLine = (index: number, value: Partial<StockIssueLine>) => setForm(prev => ({ ...prev, items: prev.items.map((line, i) => i === index ? { ...line, ...value } : line) }));
  const chooseCustomer = (customer: Customer) => {
    setForm(prev => ({ ...prev, customerId: customer._id, recipient: customer.name, phone: customer.phone || '', address: customer.address || '', deliveryAddress: customer.deliveryAddress || customer.address || '' }));
    setCustomerQuery(''); setError('');
  };
  const addProduct = (product: Product) => {
    setForm(prev => {
      const index = prev.items.findIndex(item => item.productId === product._id);
      if (index >= 0) return { ...prev, items: prev.items.map((item, i) => i === index ? { ...item, requested: item.requested + 1, quantity: item.quantity + 1 } : item) };
      return { ...prev, items: [...prev.items, { productId: product._id, name: product.name, sku: product.sku || product.barcode || '', unit: product.unit || '', requested: 1, quantity: 1, unitPrice: product.price || 0, vatRate: -1, discount: 0, discountType: 'amount' }] };
    });
    setProductQuery(''); setError('');
  };

  const replaceCurrent = (action: { copy?: StockIssueData; draft?: IssueDraft }, notice = '') => {
    setForm(action.draft?.form || (action.copy ? upgradeStockIssue(action.copy) : freshIssue(user.name)));
    setRequestId(action.draft?.requestId || crypto.randomUUID()); setSaved(null); setPreview(null); setPendingAction(null); setError(''); setProductQuery(''); setCustomerQuery(''); setView('form'); setDraftNotice(notice);
  };
  const beginNew = (copy?: StockIssueData, draft?: IssueDraft) => {
    if (!saved && (hasIssueContent(form, user.name) || (!copy && !draft))) { setPendingAction({ kind: 'new', copy, draft }); return; }
    replaceCurrent({ copy, draft }, draft ? 'Đã mở bản nháp đã lưu.' : 'Đã tạo phiếu mới.');
  };
  const completeAction = (keepDraft: boolean) => {
    if (!pendingAction || savingRef.current) return;
    try {
      let nextDrafts: IssueDraft[];
      if (keepDraft && !saved) nextDrafts = archiveIssueDraft(localStorage, archiveKey, { form, requestId }, user.name);
      else {
        nextDrafts = readIssueDrafts(localStorage, archiveKey, user.name).filter(draft => draft.requestId !== requestId);
        localStorage.setItem(archiveKey, JSON.stringify(nextDrafts));
      }
      localStorage.removeItem(draftKey);
      setDrafts(nextDrafts);
      if (pendingAction.kind === 'delete') {
        replaceCurrent({}, 'Đã xóa nội dung phiếu hiện tại.');
      } else replaceCurrent(pendingAction, keepDraft ? 'Đã lưu bản nháp trên máy này và mở phiếu mới.' : 'Đã mở phiếu mới.');
    } catch {
      setError('Chưa cập nhật được bản nháp trên máy này. Phiếu hiện tại vẫn được giữ; vui lòng thử lại.');
    }
  };
  const openPreview = () => {
    try { setPreview({ data: normalizeStockIssue(form), record: saved }); setError(''); }
    catch (err) { setError((err as Error).message); }
  };

  const saveAndPrint = async (print: boolean) => {
    if (!preview || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError('');
    try {
      let record = preview.record;
      if (!record) {
        record = await api.post('/api/stock-issues', { ...preview.data, requestId });
        setSaved(record); setPreview({ data: record!, record });
        try { localStorage.removeItem(draftKey); } catch { /* The saved server record remains available. */ }
        try {
          const nextDrafts = readIssueDrafts(localStorage, archiveKey, user.name).filter(draft => draft.requestId !== record!.requestId);
          localStorage.setItem(archiveKey, JSON.stringify(nextDrafts)); setDrafts(nextDrafts);
        } catch { setStorageError('Phiếu đã lưu vào hệ thống, nhưng chưa dọn được bản nháp trên máy này.'); }
        setHistoryReload(value => value + 1);
      }
      if (print) { await nextFrame(); await document.fonts.ready; window.print(); }
    } catch (err) { setError(readableError(err)); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const matches = <T,>(entries: T[], query: string, label: (entry: T) => string) => entries.filter(entry => findText(label(entry)).includes(findText(query.trim()))).slice(0, 8);

  return <div className="issue-app">
    <header className="issue-heading"><div><div className="issue-eyebrow">BÁN TẠI CỬA HÀNG</div><h1>Lập phiếu xuất kho</h1><p>Chọn người nhận, thêm hàng rồi xem phiếu và in.</p></div><button type="button" className="issue-button secondary" onClick={() => { setView(view === 'form' ? 'history' : 'form'); setError(''); }}><FileText size={20} />{view === 'form' ? 'Phiếu đã lưu' : 'Về phiếu đang lập'}</button></header>
    {syncStatus && <p role="status" className={syncStatus.state === 'error' ? 'issue-error' : 'issue-draft'}><strong>Kết nối AppSheet: </strong>{syncStatus.message}</p>}
    <div className="issue-current-actions">
      <button type="button" className="issue-button secondary" disabled={saving} onClick={() => beginNew()}><Plus size={18} />Tạo phiếu mới</button>
      <button type="button" className="issue-button danger" disabled={saving} onClick={() => setPendingAction({ kind: 'delete' })}><Trash2 size={18} />Xóa phiếu hiện tại</button>
      <button type="button" className="issue-button secondary" disabled={catalogLoading} onClick={() => { void refreshCatalog(); }}>{catalogLoading ? 'Đang tải danh mục…' : 'Tải lại danh mục'}</button>
    </div>
    {drafts.length > 0 && <details className="issue-card issue-draft-list"><summary>Bản nháp đã lưu trên máy này ({drafts.length})</summary><div className="issue-history">{drafts.map(draft => <button type="button" key={draft.requestId} onClick={() => beginNew(undefined, draft)}><span><strong>{draft.form.recipient || 'Chưa nhập người nhận'}</strong><small>{draft.form.date} · {draft.form.items.length} mặt hàng · {draft.form.warehouseName || 'Chưa chọn kho'}</small></span><span>Mở bản nháp</span></button>)}</div></details>}
    {view === 'history' ? <section className="issue-card">
      <div className="issue-section-title"><h2>Phiếu đã lưu</h2><span>50 kết quả gần nhất</span></div>
      <form className="issue-search-row" onSubmit={event => { event.preventDefault(); setHistoryQuery(historySearch); setHistoryReload(value => value + 1); }}><input aria-label="Tìm phiếu đã lưu" placeholder="Nhập số phiếu, tên khách hoặc số điện thoại" value={historySearch} onChange={event => setHistorySearch(event.target.value)} /><button className="issue-button secondary" type="submit"><Search size={18} />Tìm phiếu</button></form>
      {historyLoading ? <p role="status">Đang tải phiếu…</p> : historyError ? <p role="alert" className="issue-error">{historyError}</p> : history.length === 0 ? <p className="issue-empty">Chưa có phiếu phù hợp. Phiếu lưu xong sẽ xuất hiện tại đây.</p> : <div className="issue-history">{history.map(record => <button type="button" key={record._id} onClick={() => { setPreview({ data: record, record }); setError(''); }}><span><strong>{record.number}</strong><span>{record.recipient}</span><small>{record.date.split('-').reverse().join('/')} · {record.warehouseName}</small></span><span><strong>{money(stockIssueAmounts(record).total)} đ</strong><small>Xem / in lại →</small></span></button>)}</div>}
    </section> : <>
      <div className="issue-steps"><span><b>1</b> Người nhận & kho</span><span><b>2</b> Hàng xuất</span><span><b>3</b> Xem phiếu & in</span></div>
      {saved ? <div className="issue-success" role="status"><Check size={20} /><span>Đã lưu <strong>{saved.number}</strong>. Bạn có thể in lại hoặc lập phiếu tiếp theo.</span></div> : <p className="issue-draft" role="status">{storageError || `${draftNotice} Bản nháp được tự giữ trên máy này khi bạn nhập. Chọn “Lưu phiếu” để lưu vào hệ thống.`}</p>}
      <fieldset disabled={!!saved || saving} className="issue-form-fields">
        <section className="issue-card"><h2><span className="issue-step">1</span> Người nhận & kho xuất</h2>
          <div className="issue-grid">
            <div className="issue-wide"><Field label="Tìm khách hàng có sẵn"><div className="issue-search"><Search size={19} /><input placeholder="Gõ tên hoặc số điện thoại…" value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} /></div></Field>
              {customerQuery.trim() && <div className="issue-results">{matches(customers, customerQuery, c => `${c.name} ${c.phone || ''} ${c.deliveryAddress || c.address || ''}`).map(customer => <button type="button" key={customer._id} onClick={() => chooseCustomer(customer)}><strong>{customer.name}</strong><small>{customer.phoneRaw || customer.phone || 'Chưa có SĐT'} {(customer.deliveryAddress || customer.address) ? `· ${customer.deliveryAddress || customer.address}` : ''}</small></button>)}{!matches(customers, customerQuery, c => `${c.name} ${c.phone || ''} ${c.deliveryAddress || c.address || ''}`).length && <p>Chưa tìm thấy khách. Bạn có thể nhập thông tin bên dưới.</p>}</div>}
            </div>
            <Field label="Người / đơn vị nhận hàng *"><input value={form.recipient} onChange={event => { change('recipient', event.target.value); change('customerId', ''); }} placeholder="Nhập tên khách hoặc tên công ty" /></Field>
            <Field label="Số điện thoại"><input type="tel" value={form.phone} onChange={event => change('phone', event.target.value)} placeholder="Số điện thoại liên hệ" /></Field>
            <Field label="Địa chỉ người nhận" wide><input value={form.address} onChange={event => { const value = event.target.value; setForm(prev => ({ ...prev, address: value, deliveryAddress: prev.deliveryAddress === prev.address ? value : prev.deliveryAddress })); }} placeholder="Số nhà, đường, phường, tỉnh / thành phố" /></Field>
            <Field label="Chọn kho có sẵn"><select value={form.warehouseId} onChange={event => { const warehouse = warehouses.find(w => w._id === event.target.value); setForm(prev => ({ ...prev, warehouseId: warehouse?._id || '', warehouseName: warehouse?.name || '', warehouseLocation: warehouseAddress(warehouse) })); }}><option value="">Nhập kho bên cạnh hoặc chọn tại đây</option>{warehouses.map(warehouse => <option value={warehouse._id} key={warehouse._id}>{warehouse.name}{warehouseAddress(warehouse) ? ` · ${warehouseAddress(warehouse)}` : ' · Chưa có địa chỉ'}</option>)}</select></Field>
            <Field label="Tên kho xuất *"><input value={form.warehouseName} onChange={event => { change('warehouseName', event.target.value); change('warehouseId', ''); }} placeholder="Ví dụ: Kho quận 1" /></Field>
            <Field label="Địa chỉ kho xuất" wide><input value={form.warehouseLocation} onChange={event => change('warehouseLocation', event.target.value)} placeholder="Địa chỉ này sẽ hiện trên phiếu in" /></Field>
            {form.warehouseId && !form.warehouseLocation && <p className="issue-hint issue-wide">Kho này chưa có địa chỉ. Nhập địa chỉ cho phiếu hoặc cập nhật trong Quản lý kho.</p>}
            {warehouseError && <p className="issue-hint issue-wide">{warehouseError}</p>}
            <Field label="Ngày xuất *"><input type="date" value={form.date} onChange={event => change('date', event.target.value)} /></Field>
            <Field label="Lý do xuất *"><input value={form.reason} onChange={event => change('reason', event.target.value)} /></Field>
          </div>
        </section>
        <section className="issue-card"><h2><span className="issue-step">2</span> Hàng cần xuất</h2>
          <Field label="Tìm sản phẩm"><div className="issue-search"><Search size={19} /><input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Gõ tên hàng, mã hàng hoặc mã vạch…" /></div></Field>
          {catalogError && <p role="alert" className="issue-error">{catalogError}</p>}
          {productQuery.trim() && <div className="issue-results">{matches(catalogProducts, productQuery, p => `${p.name} ${p.sku || ''} ${p.barcode || ''}`).map(product => <button type="button" key={product._id} onClick={() => addProduct(product)}><strong>{product.name}</strong><small>{product.sku || product.barcode || 'Chưa có mã'} · Giá danh mục: {money(product.price || 0)} đ{product.active === false ? ' · Đang ẩn trên cửa hàng' : ''}</small></button>)}{!matches(catalogProducts, productQuery, p => `${p.name} ${p.sku || ''} ${p.barcode || ''}`).length && <p>{catalogLoading ? 'Đang tải sản phẩm…' : 'Chưa có trong danh mục. Thử tải lại danh mục hoặc chọn “Thêm hàng bằng tay”.'}</p>}</div>}
          <p className="issue-hint">Kiểm tra đơn vị tính, giá bán chưa VAT và thuế suất từng sản phẩm trước khi in. Chọn lại cùng sản phẩm sẽ tăng số lượng thêm 1.</p>
          {!form.items.length && <div className="issue-empty"><FileText size={30} /><p>Chưa có hàng trên phiếu</p><small>Tìm sản phẩm ở trên hoặc thêm hàng bằng tay.</small></div>}
          <div className="issue-lines">{form.items.map((item, index) => <section className="issue-line" key={index} aria-label={`Mặt hàng ${index + 1}`}>
            <div className="issue-section-title"><h3>Mặt hàng {index + 1}</h3><button type="button" className="issue-remove" aria-label={`Xóa mặt hàng ${index + 1}`} onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}><Trash2 size={16} />Bỏ dòng</button></div>
            <div className="issue-line-grid">
              <Field label="Tên hàng *" wide><input value={item.name} onChange={event => updateLine(index, { name: event.target.value })} placeholder="Tên sản phẩm trên phiếu" /></Field>
              <Field label="Mã hàng"><input value={item.sku} onChange={event => updateLine(index, { sku: event.target.value })} /></Field>
              <Field label="Đơn vị tính *"><input list="issue-units" placeholder="Chai, hộp, thùng…" value={item.unit} onChange={event => updateLine(index, { unit: event.target.value })} /></Field>
              <Field label="Số lượng yêu cầu *"><input type="number" min="0.001" max="1000000" step="any" value={item.requested || ''} onChange={event => { const requested = Number(event.target.value); updateLine(index, { requested, quantity: item.quantity === item.requested ? requested : item.quantity }); }} /></Field>
              <Field label="Số lượng thực xuất *"><input type="number" min="0" max={item.requested} step="any" value={item.quantity} onChange={event => updateLine(index, { quantity: Number(event.target.value) })} /></Field>
              <Field label="Đơn giá (đ) *"><input type="number" min="0" max="1000000000" step="1" value={item.unitPrice} onChange={event => updateLine(index, { unitPrice: Number(event.target.value) })} /></Field>
              <Field label="VAT *"><select value={item.vatRate} onChange={event => updateLine(index, { vatRate: Number(event.target.value) })}><option value={-1}>Chọn thuế suất</option>{[0, 5, 8, 10].map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select></Field>
              <Field label="Chiết khấu"><div className="issue-discount-input"><input aria-label={`Chiết khấu ${index + 1}`} type="number" min="0" step={item.discountType === 'percent' ? '0.01' : '1'} max={item.discountType === 'percent' ? 100 : totals.lines[index]} value={item.discount ?? 0} onChange={event => updateLine(index, { discount: Number(event.target.value) })} /><select aria-label={`Đơn vị chiết khấu từng dòng ${index + 1}`} value={item.discountType ?? 'amount'} onChange={event => updateLine(index, { discountType: event.target.value as 'amount' | 'percent', discount: 0 })}><option value="amount">đ</option><option value="percent">%</option></select></div></Field>
              <div className="issue-line-total"><span>Thành tiền</span><strong>{money(totals.lines[index])} đ</strong></div>
              <div className="issue-line-total"><span>VAT sau các chiết khấu</span><strong>{item.vatRate! >= 0 ? `${money(totals.lineVat[index])} đ` : 'Chọn VAT'}</strong></div>
            </div>
          </section>)}</div>
          <datalist id="issue-units">{['Chai', 'Hộp', 'Thùng', 'Gói', 'Cái', 'Bộ', 'Kg', 'Lít'].map(unit => <option value={unit} key={unit} />)}</datalist>
          <button type="button" className="issue-button secondary" disabled={form.items.length >= 100} onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, blankLine()] }))}><Plus size={20} />Thêm hàng bằng tay</button>
          <div className="issue-totals">
            <Field label="Chiết khấu tổng bill"><div className="issue-discount-input"><input aria-label="Chiết khấu tổng bill" type="number" min="0" max={form.billDiscountType === 'percent' ? 100 : totals.subtotal - totals.productDiscount} step={form.billDiscountType === 'percent' ? '0.01' : '1'} value={form.billDiscount ?? 0} onChange={event => change('billDiscount', Number(event.target.value))} /><select aria-label="Đơn vị chiết khấu tổng bill" value={form.billDiscountType ?? 'amount'} onChange={event => { change('billDiscountType', event.target.value as 'amount' | 'percent'); change('billDiscount', 0); }}><option value="amount">đ</option><option value="percent">%</option></select></div></Field>
            <div><span>Tiền hàng</span><strong>{money(totals.subtotal)} đ</strong></div>
            <div><span>Chiết khấu</span><strong>{money(totals.productDiscount)} đ</strong></div>
            <div><span>Chiết khấu tổng bill</span><strong>{money(totals.billDiscount)} đ</strong></div>
            <div className="issue-grand-total"><span>Tổng tiền thanh toán</span><strong>{form.items.some(item => item.vatRate! < 0) ? 'Chọn đủ VAT' : `${money(totals.total)} đ`}</strong></div>
          </div>
          <p className="issue-hint">Chiết khấu áp dụng trước VAT; chiết khấu tổng bill phân bổ theo tiền hàng sau chiết khấu từng dòng. Chọn thuế suất theo từng mặt hàng.</p>
        </section>
        <section className="issue-card issue-display-options"><h2><span className="issue-step">3</span> Hiển thị trên phiếu</h2>
          <label><input type="checkbox" checked={form.hideVat ?? false} onChange={event => change('hideVat', event.target.checked)} />Ẩn VAT (cột thuế suất và tiền VAT)</label>
          <label><input type="checkbox" checked={form.hideDiscount ?? false} onChange={event => change('hideDiscount', event.target.checked)} />Ẩn chiết khấu (cột và dòng tổng bill)</label>
          <p className="issue-hint">Tùy chọn áp dụng cho bản xem trước và bản in. Tổng tiền thanh toán vẫn tính đầy đủ VAT và chiết khấu đã nhập.</p>
        </section>
        <details className="issue-card issue-options"><summary>Thông tin công ty, giao hàng & người ký <span>Chỉ mở khi cần thay đổi</span></summary><div className="issue-grid">
          <Field label="Chọn công ty lập phiếu" wide><select value={STOCK_ISSUE_COMPANIES.find(company => company.name === form.companyName && company.address === form.companyAddress)?.name ?? ''} onChange={event => { const company = STOCK_ISSUE_COMPANIES.find(company => company.name === event.target.value); if (company) { setForm(prev => ({ ...prev, companyName: company.name, companyAddress: company.address })); setError(''); } }}>
            {!STOCK_ISSUE_COMPANIES.some(company => company.name === form.companyName && company.address === form.companyAddress) && <option value="">Thông tin công ty đang nhập</option>}
            {STOCK_ISSUE_COMPANIES.map(company => <option key={company.name} value={company.name}>{company.name}</option>)}
          </select></Field>
          <Field label="Tên công ty *" wide><input value={form.companyName} onChange={event => change('companyName', event.target.value)} /></Field>
          <Field label="Địa chỉ công ty *" wide><input value={form.companyAddress} onChange={event => change('companyAddress', event.target.value)} /></Field>
          <Field label="Địa điểm giao hàng" wide><input value={form.deliveryAddress} onChange={event => change('deliveryAddress', event.target.value)} /></Field>
          <Field label="Chứng từ gốc kèm theo"><input value={form.attachments} onChange={event => change('attachments', event.target.value)} /></Field>
          <Field label="Tài khoản Nợ"><input value={form.debitAccount} onChange={event => change('debitAccount', event.target.value)} /></Field>
          <Field label="Tài khoản Có"><input value={form.creditAccount} onChange={event => change('creditAccount', event.target.value)} /></Field>
          {([['creator', 'Người lập biểu'], ['receiver', 'Người nhận hàng ký'], ['keeper', 'Thủ kho'], ['accountant', 'Kế toán trưởng'], ['director', 'Giám đốc']] as const).map(([key, label]) => <Field label={label} key={key}><input value={form[key]} onChange={event => change(key, event.target.value)} placeholder="Có thể để trống để ký tay" /></Field>)}
        </div></details>
      </fieldset>
      <p className="issue-hint">Mục này lập và in chứng từ; tồn kho vẫn được cập nhật theo quy trình quản lý kho hiện tại.</p>
      <footer className="issue-action-bar"><div><small>Tổng tiền thanh toán</small><strong>{form.items.some(item => item.vatRate! < 0) ? 'Chọn đủ VAT' : `${money(totals.total)} đ`}</strong></div><button type="button" className="issue-button primary" onClick={openPreview}><Printer size={22} />Xem phiếu & in</button></footer>
    </>}
    {pendingAction && createPortal(<div className="issue-confirm-overlay"><section className="issue-confirm" role="dialog" aria-modal="true" aria-labelledby="issue-confirm-title">
      <h2 id="issue-confirm-title">{pendingAction.kind === 'delete' ? 'Bạn có chắc muốn xóa phiếu hiện tại?' : 'Lưu nháp hay bỏ phiếu đang soạn?'}</h2>
      <p>{pendingAction.kind === 'delete' ? 'Nội dung đang mở và bản nháp tương ứng trên máy này sẽ được xóa. Phiếu đã lưu trong hệ thống vẫn nằm trong lịch sử.' : 'Chọn lưu nháp để mở lại sau, hoặc bỏ nội dung đang soạn trước khi mở phiếu khác.'}</p>
      {error && <p role="alert" className="issue-error">{error}</p>}
      <div className="issue-confirm-actions"><button autoFocus type="button" className="issue-button secondary" onClick={() => { setPendingAction(null); setError(''); }}>Hủy</button>{pendingAction.kind === 'new' && <button type="button" className="issue-button primary" onClick={() => completeAction(true)}>Lưu nháp</button>}<button type="button" className="issue-button danger" onClick={() => completeAction(false)}>{pendingAction.kind === 'delete' ? 'Chắc chắn xóa' : 'Bỏ phiếu đang soạn'}</button></div>
    </section></div>, document.body)}
    {error && !preview && !pendingAction && <div className="issue-error issue-error-fixed" role="alert">{error}<button aria-label="Đóng thông báo" onClick={() => setError('')}><X size={18} /></button></div>}
    {preview && createPortal(<div className="issue-preview-root" role="dialog" aria-modal="true" aria-label="Xem trước phiếu xuất kho">
      <div className="issue-preview-toolbar"><button autoFocus type="button" className="issue-button secondary" disabled={saving} onClick={() => { setPreview(null); setError(''); }}><ChevronLeft size={20} />Quay lại</button><div><strong>{preview.record ? preview.record.number : 'Kiểm tra phiếu trước khi in'}</strong><small>Khổ A4 · Chọn “Lưu dưới dạng PDF” trong cửa sổ in để tải PDF.</small></div><div className="issue-preview-actions">{preview.record ? <button type="button" className="issue-button secondary" disabled={saving} onClick={() => beginNew(preview.data)}><Copy size={18} />Sao chép để sửa</button> : <button type="button" className="issue-button secondary" disabled={saving} onClick={() => saveAndPrint(false)}>Lưu phiếu</button>}<button type="button" className="issue-button primary" disabled={saving} onClick={() => saveAndPrint(true)}><Printer size={20} />{saving ? 'Đang chuẩn bị…' : preview.record ? 'In phiếu / Lưu PDF' : 'Lưu phiếu & in'}</button></div></div>
      {error && <div className="issue-error" role="alert">{error}</div>}
      {preview.data.pricingVersion === 2 && <div className="issue-print-options">
        <strong>Hiển thị trên phiếu</strong>
        {([['hideVat', 'Ẩn VAT'], ['hideDiscount', 'Ẩn chiết khấu']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={preview.data[key] ?? false} onChange={event => { const checked = event.target.checked; setPreview(prev => prev ? { ...prev, data: { ...prev.data, [key]: checked } } : prev); if (!preview.record) change(key, checked); }} />{label}</label>)}
        {preview.record && <small>Lựa chọn cho lần in này; nội dung phiếu đã lưu giữ nguyên.</small>}
      </div>}
      {preview.record && <p className="issue-preview-notice" role="status"><Check size={16} />Phiếu đã được lưu. In lại không tạo thêm phiếu.</p>}
      <div className="issue-paper-scroll"><div className="issue-paper-fit" style={{ zoom: paperScale }}><StockIssuePaper data={preview.data} number={preview.record?.number} /></div></div>
    </div>, document.body)}
  </div>;
}
