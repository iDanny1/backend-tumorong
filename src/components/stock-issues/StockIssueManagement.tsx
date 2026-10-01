import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, Copy, FileText, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { money, newStockIssue, normalizeStockIssue, stockIssueTotals, type SavedStockIssue, type StockIssueData, type StockIssueLine } from '../../lib/stockIssue';
import type { Customer, Product, User, Warehouse } from '../../types';
import { StockIssuePaper } from './StockIssuePaper';
import './stock-issues.css';

type Props = { products: Product[]; customers: Customer[]; user: User };
const findText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const blankLine = (): StockIssueLine => ({ productId: '', name: '', sku: '', unit: '', requested: 1, quantity: 1, unitPrice: 0 });
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
  const [initial] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (stored?.form && typeof stored.requestId === 'string' && Array.isArray(stored.form.items)) {
        const defaults = newStockIssue(user.name);
        // Recover partial input, including unfinished rows, without trusting the saved shape.
        const form = { ...defaults };
        for (const key of Object.keys(defaults) as (keyof StockIssueData)[]) {
          if (key !== 'items' && typeof stored.form[key] === typeof defaults[key]) (form as any)[key] = stored.form[key];
        }
        form.items = stored.form.items.slice(0, 100).map((entry: any) => {
          const line = blankLine();
          for (const key of Object.keys(line) as (keyof StockIssueLine)[]) if (typeof entry?.[key] === typeof line[key]) (line as any)[key] = entry[key];
          return line;
        });
        return { form, requestId: stored.requestId, recovered: true };
      }
    } catch { /* A damaged or disabled browser store must not stop the form. */ }
    return { form: newStockIssue(user.name), requestId: crypto.randomUUID(), recovered: false };
  });
  const [form, setForm] = useState<StockIssueData>(initial.form);
  const [requestId, setRequestId] = useState(initial.requestId);
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
  const totals = stockIssueTotals(form.items, form.vatRate);

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

  useEffect(() => {
    let active = true;
    api.get('/api/warehouses').then(data => { if (active) setWarehouses(data); }).catch(() => { if (active) setWarehouseError('Chưa tải được danh sách kho. Bạn vẫn có thể nhập tên kho bên dưới.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (saved) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ form, requestId })); setStorageError(''); }
    catch { setStorageError('Trình duyệt chưa giữ được bản nháp. Hãy lưu phiếu trước khi đóng trang.'); }
  }, [form, requestId, saved, draftKey]);

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
    if (!preview) return;
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
  }, [preview]);

  const change = <K extends keyof StockIssueData>(key: K, value: StockIssueData[K]) => { setForm(prev => ({ ...prev, [key]: value })); setError(''); };
  const updateLine = (index: number, value: Partial<StockIssueLine>) => setForm(prev => ({ ...prev, items: prev.items.map((line, i) => i === index ? { ...line, ...value } : line) }));
  const chooseCustomer = (customer: Customer) => {
    setForm(prev => ({ ...prev, customerId: customer._id, recipient: customer.name, phone: customer.phone || '', address: customer.address || '', deliveryAddress: customer.address || '' }));
    setCustomerQuery(''); setError('');
  };
  const addProduct = (product: Product) => {
    setForm(prev => {
      const index = prev.items.findIndex(item => item.productId === product._id);
      if (index >= 0) return { ...prev, items: prev.items.map((item, i) => i === index ? { ...item, requested: item.requested + 1, quantity: item.quantity + 1 } : item) };
      return { ...prev, items: [...prev.items, { productId: product._id, name: product.name, sku: product.sku || product.barcode || '', unit: product.unit || '', requested: 1, quantity: 1, unitPrice: product.price || 0 }] };
    });
    setProductQuery(''); setError('');
  };

  const beginNew = (copy?: StockIssueData) => {
    if (!saved && (form.recipient || form.items.length) && !window.confirm('Bạn đang có phiếu chưa lưu. Thay bằng phiếu mới?')) return;
    const next = copy ? { ...copy, items: copy.items.map(item => ({ ...item })) } : { ...newStockIssue(user.name), companyName: form.companyName, companyAddress: form.companyAddress, warehouseId: form.warehouseId, warehouseName: form.warehouseName, warehouseLocation: form.warehouseLocation };
    setForm(next); setRequestId(crypto.randomUUID()); setSaved(null); setPreview(null); setError(''); setProductQuery(''); setCustomerQuery(''); setView('form');
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
    {view === 'history' ? <section className="issue-card">
      <div className="issue-section-title"><h2>Phiếu đã lưu</h2><span>50 kết quả gần nhất</span></div>
      <form className="issue-search-row" onSubmit={event => { event.preventDefault(); setHistoryQuery(historySearch); setHistoryReload(value => value + 1); }}><input aria-label="Tìm phiếu đã lưu" placeholder="Nhập số phiếu, tên khách hoặc số điện thoại" value={historySearch} onChange={event => setHistorySearch(event.target.value)} /><button className="issue-button secondary" type="submit"><Search size={18} />Tìm phiếu</button></form>
      {historyLoading ? <p role="status">Đang tải phiếu…</p> : historyError ? <p role="alert" className="issue-error">{historyError}</p> : history.length === 0 ? <p className="issue-empty">Chưa có phiếu phù hợp. Phiếu lưu xong sẽ xuất hiện tại đây.</p> : <div className="issue-history">{history.map(record => <button type="button" key={record._id} onClick={() => { setPreview({ data: record, record }); setError(''); }}><span><strong>{record.number}</strong><span>{record.recipient}</span><small>{record.date.split('-').reverse().join('/')} · {record.warehouseName}</small></span><span><strong>{money(stockIssueTotals(record.items, record.vatRate).total)} đ</strong><small>Xem / in lại →</small></span></button>)}</div>}
    </section> : <>
      <div className="issue-steps"><span><b>1</b> Người nhận & kho</span><span><b>2</b> Hàng xuất</span><span><b>3</b> Xem phiếu & in</span></div>
      {saved ? <div className="issue-success" role="status"><Check size={20} /><span>Đã lưu <strong>{saved.number}</strong>. Bạn có thể in lại hoặc lập phiếu tiếp theo.</span><button type="button" onClick={() => beginNew()} className="issue-button secondary">Lập phiếu mới</button></div> : <p className="issue-draft">{storageError || (initial.recovered ? 'Đã mở lại nội dung đang soạn. Bản nháp được giữ trên máy này.' : 'Bản nháp được tự giữ trên máy này khi bạn nhập. Chọn “Lưu phiếu” để lưu vào hệ thống.')}</p>}
      <fieldset disabled={!!saved || saving} className="issue-form-fields">
        <section className="issue-card"><h2><span className="issue-step">1</span> Người nhận & kho xuất</h2>
          <div className="issue-grid">
            <div className="issue-wide"><Field label="Tìm khách hàng có sẵn"><div className="issue-search"><Search size={19} /><input placeholder="Gõ tên hoặc số điện thoại…" value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} /></div></Field>
              {customerQuery.trim() && <div className="issue-results">{matches(customers, customerQuery, c => `${c.name} ${c.phone}`).map(customer => <button type="button" key={customer._id} onClick={() => chooseCustomer(customer)}><strong>{customer.name}</strong><small>{customer.phone} {customer.address ? `· ${customer.address}` : ''}</small></button>)}{!matches(customers, customerQuery, c => `${c.name} ${c.phone}`).length && <p>Chưa tìm thấy khách. Bạn có thể nhập thông tin bên dưới.</p>}</div>}
            </div>
            <Field label="Người / đơn vị nhận hàng *"><input value={form.recipient} onChange={event => { change('recipient', event.target.value); change('customerId', ''); }} placeholder="Nhập tên khách hoặc tên công ty" /></Field>
            <Field label="Số điện thoại"><input type="tel" value={form.phone} onChange={event => change('phone', event.target.value)} placeholder="Số điện thoại liên hệ" /></Field>
            <Field label="Địa chỉ người nhận" wide><input value={form.address} onChange={event => { const value = event.target.value; setForm(prev => ({ ...prev, address: value, deliveryAddress: prev.deliveryAddress === prev.address ? value : prev.deliveryAddress })); }} placeholder="Số nhà, đường, phường, tỉnh / thành phố" /></Field>
            <Field label="Chọn kho có sẵn"><select value={form.warehouseId} onChange={event => { const warehouse = warehouses.find(w => w._id === event.target.value); setForm(prev => ({ ...prev, warehouseId: warehouse?._id || '', warehouseName: warehouse?.name || '', warehouseLocation: (warehouse as any)?.address || warehouse?.location || '' })); }}><option value="">Nhập kho bên cạnh hoặc chọn tại đây</option>{warehouses.map(warehouse => <option value={warehouse._id} key={warehouse._id}>{warehouse.name}</option>)}</select></Field>
            <Field label="Tên kho xuất *"><input value={form.warehouseName} onChange={event => { change('warehouseName', event.target.value); change('warehouseId', ''); }} placeholder="Ví dụ: Kho quận 1" /></Field>
            {warehouseError && <p className="issue-hint issue-wide">{warehouseError}</p>}
            <Field label="Ngày xuất *"><input type="date" value={form.date} onChange={event => change('date', event.target.value)} /></Field>
            <Field label="Lý do xuất *"><input value={form.reason} onChange={event => change('reason', event.target.value)} /></Field>
          </div>
        </section>
        <section className="issue-card"><h2><span className="issue-step">2</span> Hàng cần xuất</h2>
          <Field label="Tìm sản phẩm"><div className="issue-search"><Search size={19} /><input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Gõ tên hàng, mã hàng hoặc mã vạch…" /></div></Field>
          {productQuery.trim() && <div className="issue-results">{matches(products.filter(p => p.active !== false), productQuery, p => `${p.name} ${p.sku || ''} ${p.barcode || ''}`).map(product => <button type="button" key={product._id} onClick={() => addProduct(product)}><strong>{product.name}</strong><small>{product.sku || product.barcode || 'Chưa có mã'} · Giá danh mục: {money(product.price || 0)} đ</small></button>)}{!matches(products.filter(p => p.active !== false), productQuery, p => `${p.name} ${p.sku || ''} ${p.barcode || ''}`).length && <p>Chưa có trong danh mục. Chọn “Thêm hàng bằng tay”.</p>}</div>}
          <p className="issue-hint">Kiểm tra đơn vị tính và đơn giá chưa VAT trước khi in. Chọn lại cùng sản phẩm sẽ tăng số lượng thêm 1.</p>
          {!form.items.length && <div className="issue-empty"><FileText size={30} /><p>Chưa có hàng trên phiếu</p><small>Tìm sản phẩm ở trên hoặc thêm hàng bằng tay.</small></div>}
          <div className="issue-lines">{form.items.map((item, index) => <section className="issue-line" key={index} aria-label={`Mặt hàng ${index + 1}`}>
            <div className="issue-section-title"><h3>Mặt hàng {index + 1}</h3><button type="button" className="issue-remove" aria-label={`Xóa mặt hàng ${index + 1}`} onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}><Trash2 size={16} />Bỏ dòng</button></div>
            <div className="issue-line-grid">
              <Field label="Tên hàng *" wide><input value={item.name} onChange={event => updateLine(index, { name: event.target.value })} placeholder="Tên sản phẩm trên phiếu" /></Field>
              <Field label="Mã hàng"><input value={item.sku} onChange={event => updateLine(index, { sku: event.target.value })} /></Field>
              <Field label="Đơn vị tính *"><input list="issue-units" placeholder="Chai, hộp, thùng…" value={item.unit} onChange={event => updateLine(index, { unit: event.target.value })} /></Field>
              <Field label="Số lượng yêu cầu *"><input type="number" min="0.001" max="1000000" step="any" value={item.requested || ''} onChange={event => { const requested = Number(event.target.value); updateLine(index, { requested, quantity: item.quantity === item.requested ? requested : item.quantity }); }} /></Field>
              <Field label="Số lượng thực xuất *"><input type="number" min="0" max={item.requested} step="any" value={item.quantity} onChange={event => updateLine(index, { quantity: Number(event.target.value) })} /></Field>
              <Field label="Đơn giá chưa VAT (đ) *"><input type="number" min="0" max="1000000000" step="1" value={item.unitPrice} onChange={event => updateLine(index, { unitPrice: Number(event.target.value) })} /></Field>
              <div className="issue-line-total"><span>Thành tiền</span><strong>{money(totals.lines[index])} đ</strong></div>
            </div>
          </section>)}</div>
          <datalist id="issue-units">{['Chai', 'Hộp', 'Thùng', 'Gói', 'Cái', 'Bộ', 'Kg', 'Lít'].map(unit => <option value={unit} key={unit} />)}</datalist>
          <button type="button" className="issue-button secondary" disabled={form.items.length >= 100} onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, blankLine()] }))}><Plus size={20} />Thêm hàng bằng tay</button>
          <div className="issue-totals"><Field label="Thuế VAT (%)"><input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={event => change('vatRate', Number(event.target.value))} /></Field><div><span>Tiền hàng</span><strong>{money(totals.subtotal)} đ</strong></div><div><span>Tiền VAT</span><strong>{money(totals.vat)} đ</strong></div><div className="issue-grand-total"><span>Tổng thanh toán</span><strong>{money(totals.total)} đ</strong></div></div>
        </section>
        <details className="issue-card issue-options"><summary>Thông tin công ty, giao hàng & người ký <span>Chỉ mở khi cần thay đổi</span></summary><div className="issue-grid">
          <Field label="Tên công ty *" wide><input value={form.companyName} onChange={event => change('companyName', event.target.value)} /></Field>
          <Field label="Địa chỉ công ty *" wide><input value={form.companyAddress} onChange={event => change('companyAddress', event.target.value)} /></Field>
          <Field label="Địa điểm giao hàng" wide><input value={form.deliveryAddress} onChange={event => change('deliveryAddress', event.target.value)} /></Field>
          <Field label="Địa điểm kho"><input value={form.warehouseLocation} onChange={event => change('warehouseLocation', event.target.value)} /></Field>
          <Field label="Chứng từ gốc kèm theo"><input value={form.attachments} onChange={event => change('attachments', event.target.value)} /></Field>
          <Field label="Tài khoản Nợ"><input value={form.debitAccount} onChange={event => change('debitAccount', event.target.value)} /></Field>
          <Field label="Tài khoản Có"><input value={form.creditAccount} onChange={event => change('creditAccount', event.target.value)} /></Field>
          {([['creator', 'Người lập biểu'], ['receiver', 'Người nhận hàng ký'], ['keeper', 'Thủ kho'], ['accountant', 'Kế toán trưởng'], ['director', 'Giám đốc']] as const).map(([key, label]) => <Field label={label} key={key}><input value={form[key]} onChange={event => change(key, event.target.value)} placeholder="Có thể để trống để ký tay" /></Field>)}
        </div></details>
      </fieldset>
      <p className="issue-hint">Mục này lập và in chứng từ; tồn kho vẫn được cập nhật theo quy trình quản lý kho hiện tại.</p>
      <footer className="issue-action-bar"><div><small>Tổng thanh toán</small><strong>{money(totals.total)} đ</strong></div><button type="button" className="issue-button primary" onClick={openPreview}><Printer size={22} />Xem phiếu & in</button></footer>
    </>}
    {error && !preview && <div className="issue-error issue-error-fixed" role="alert">{error}<button aria-label="Đóng thông báo" onClick={() => setError('')}><X size={18} /></button></div>}
    {preview && createPortal(<div className="issue-preview-root" role="dialog" aria-modal="true" aria-label="Xem trước phiếu xuất kho">
      <div className="issue-preview-toolbar"><button autoFocus type="button" className="issue-button secondary" disabled={saving} onClick={() => { setPreview(null); setError(''); }}><ChevronLeft size={20} />Quay lại</button><div><strong>{preview.record ? preview.record.number : 'Kiểm tra phiếu trước khi in'}</strong><small>Khổ A4 · Chọn “Lưu dưới dạng PDF” trong cửa sổ in để tải PDF.</small></div><div className="issue-preview-actions">{preview.record ? <button type="button" className="issue-button secondary" disabled={saving} onClick={() => beginNew(preview.data)}><Copy size={18} />Sao chép để sửa</button> : <button type="button" className="issue-button secondary" disabled={saving} onClick={() => saveAndPrint(false)}>Lưu phiếu</button>}<button type="button" className="issue-button primary" disabled={saving} onClick={() => saveAndPrint(true)}><Printer size={20} />{saving ? 'Đang chuẩn bị…' : preview.record ? 'In phiếu / Lưu PDF' : 'Lưu phiếu & in'}</button></div></div>
      {error && <div className="issue-error" role="alert">{error}</div>}
      {preview.record && <p className="issue-preview-notice" role="status"><Check size={16} />Phiếu đã được lưu. In lại không tạo thêm phiếu.</p>}
      <div className="issue-paper-scroll"><div className="issue-paper-fit" style={{ zoom: paperScale }}><StockIssuePaper data={preview.data} number={preview.record?.number} /></div></div>
    </div>, document.body)}
  </div>;
}
