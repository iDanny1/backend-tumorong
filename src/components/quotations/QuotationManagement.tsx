import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, FileText, Plus, Printer, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { freshQuote, isQuoteImageUrl, normalizeQuote, quoteCompanies, quotePricing, quoteSalutations, quoteVatRates, type QuoteData, type QuoteLine, type SavedQuote } from '../../lib/quotation';
import { money } from '../../lib/stockIssue';
import type { Customer, Product, User } from '../../types';
import { DocumentTypeSelect } from '../stock-issues/DocumentTypeSelect';
import { QuotationPaper } from './QuotationPaper';
import { TetGiftEditor } from './TetGiftEditor';
import { giftPrice } from '../../lib/quotation';
import '../stock-issues/stock-issues.css';
import './quotation-management.css';
import './quotation-paper.css';

type Props = {
  products: Product[];
  customers: Customer[];
  user: User;
  onCustomersChanged?: () => void | Promise<void>;
  onDocumentTypeChange: (type: 'stock-issue' | 'receipt' | 'handover') => void;
};
type Draft = { form: QuoteData; requestId: string; pricesChecked: boolean };
type Preview = { data: QuoteData; record?: SavedQuote };

function emptyDraft(creator: string): Draft {
  return { form: freshQuote(creator), requestId: crypto.randomUUID(), pricesChecked: false };
}

function recoverDraft(key: string, creator: string): Draft {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || 'null');
    const form = draft?.form;
    if (typeof draft?.requestId === 'string' && form && Array.isArray(form.items) &&
      ['companyId', 'salutation', 'customerName', 'customerId', 'date', 'validUntil', 'creator'].every(key => typeof form[key] === 'string') &&
      form.items.every((line: QuoteLine) => line &&
        ['name', 'unit', 'packaging', 'imageUrl', 'productId', 'discountType'].every(key => typeof line[key] === 'string') &&
        (line.quantity === null || Number.isFinite(line.quantity)) &&
        ['unitPrice', 'discount', 'vatRate'].every(key => Number.isFinite(line[key])))) {
      const pricingChanged = form.items.some((line: QuoteLine) => line.gift && line.gift.pricing !== 'gift-total');
      if (pricingChanged) {
        form.items = form.items.map((line: QuoteLine) => line.gift
          ? { ...line, gift: { ...line.gift, pricing: 'gift-total' } } : line);
      }
      return { form, requestId: pricingChanged ? crypto.randomUUID() : draft.requestId,
        pricesChecked: !pricingChanged && draft.pricesChecked === true };
    }
  } catch { /* Local storage may be unavailable. */ }
  return emptyDraft(creator);
}

function searchKey(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').trim().toLowerCase();
}

function productPhotos(images: string[] = []) {
  if (!Array.isArray(images)) return [];
  return images.filter(url => typeof url === 'string').map(url => url.trim()).filter(isQuoteImageUrl);
}

function Field({ name, children }: { name: string; children: ReactNode }) {
  return <label className="issue-field"><span>{name}</span>{children}</label>;
}

function Amount({ label, value }: { label: string; value: number | null }) {
  return <div className="issue-line-total"><span>{label}</span><strong>{value === null ? '—' : `${money(value)} đ`}</strong></div>;
}

function QuoteHistory({ onOpen }: { onOpen: (record: SavedQuote) => void }) {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<{ items: SavedQuote[]; hasMore: boolean }>({ items: [], hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.get(`/api/quotations?q=${encodeURIComponent(query.trim())}&offset=${offset}`);
        if (active) setPage(result);
      } catch {
        if (active) setError('Chưa tải được lịch sử báo giá.');
      } finally {
        if (active) setLoading(false);
      }
    }, query ? 220 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [query, offset, attempt]);
  return <section className="issue-card">
    <h2>Báo giá đã lưu</h2>
    <Field name="Tìm báo giá"><input type="search" maxLength={150} value={query} placeholder="Số báo giá hoặc tên khách hàng" onChange={event => { setQuery(event.target.value); setOffset(0); }} /></Field>
    {loading ? <p className="issue-hint" role="status">Đang tải báo giá…</p> : error ? <div role="alert" className="issue-error">{error} <button className="issue-button secondary" onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div> :
      <div className="issue-history quotation-history">
        {page.items.map(record => {
          const { total } = quotePricing(record);
          return <button key={record._id} onClick={() => onOpen(record)}>
          <span><strong>{record.salutation} {record.customerName}</strong><small>{record.number} · {record.date} · {record.companyName}</small></span>
          {total !== null && <b>{money(total)} đ</b>}
        </button>; })}
        {!page.items.length && <p className="issue-hint">Không tìm thấy báo giá.</p>}
        {(offset > 0 || page.hasMore) && <div className="quotation-buttons">
          <button className="issue-button secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 25))}>Trang trước</button>
          <button className="issue-button secondary" disabled={!page.hasMore} onClick={() => setOffset(value => value + 25)}>Trang sau</button>
        </div>}
      </div>}
  </section>;
}

function QuoteLineEditor({ line, index, net, vat, images, products, pricesIncludeVat, update, remove }: {
  products: Product[]; pricesIncludeVat?: boolean;
  line: QuoteLine; index: number; net: number | null; vat: number | null; images: string[]; update: (changes: Partial<QuoteLine>) => void; remove: () => void;
}) {
  const [failedUrl, setFailedUrl] = useState('');
  const photos = [...new Set(productPhotos(images))];
  if (line.imageUrl && !photos.includes(line.imageUrl)) photos.push(line.imageUrl);
  return <section className="issue-line" aria-label={`Dòng báo giá ${index + 1}`}>
    <div className="issue-section-title"><h3>{index + 1}. {line.gift?.box.name || line.name}{line.gift?.toppings.map(part => part.name).map((name, i) => <span key={i}> + {name}</span>)}</h3>
      <button type="button" className="issue-remove" onClick={remove}><Trash2 size={16} />Bỏ dòng</button></div>
    {line.gift && <TetGiftEditor gift={line.gift} products={products} pricesIncludeVat={pricesIncludeVat}
      onChange={gift => update({ gift: { ...gift, pricing: 'gift-total' }, unitPrice: giftPrice(gift) })} />}
    <div className="quotation-line">
      <div className="quotation-photo">
        {isQuoteImageUrl(line.imageUrl) && failedUrl !== line.imageUrl ? <img key={line.imageUrl} src={line.imageUrl} alt={line.name} referrerPolicy="no-referrer" onError={() => setFailedUrl(line.imageUrl)} /> :
          <span>{line.imageUrl ? 'Ảnh chưa tải được' : 'Chưa có ảnh'}</span>}
      </div>
      <div className="issue-line-grid">
        <Field name="ĐVT"><input value={line.unit} onChange={event => update({ unit: event.target.value })} placeholder="Hộp, chai…" /></Field>
        <Field name="Số lượng"><input type="number" min="0.001" step="any" placeholder="Có thể để trống" value={line.quantity ?? ''} onChange={event => update({ quantity: event.target.value === '' ? null : Number(event.target.value) })} /></Field>
        <Field name={pricesIncludeVat ? (line.gift ? 'Giá hộp + topping đã gồm VAT (đ)' : 'Đơn giá đã gồm VAT (đ)') : line.gift ? 'Giá hộp + topping chưa VAT (đ)' : 'Đơn giá chưa VAT (đ)'}><input type="number" readOnly={!!line.gift} min="0" step="1" placeholder={line.gift ? 'Chờ đủ giá thành phần' : 'Nhập đơn giá'} value={line.unitPrice < 0 ? '' : line.unitPrice} onChange={event => update({ unitPrice: event.target.value === '' ? -1 : Number(event.target.value) })} /></Field>
        <Field name={line.gift ? 'VAT hộp + topping' : 'VAT'}><select aria-label="VAT" value={line.vatRate} onChange={event => update({ vatRate: Number(event.target.value) })}>
          <option value={-1}>Chọn VAT</option>{quoteVatRates.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
        </select></Field>
        <Field name={pricesIncludeVat ? 'Chiết khấu trước VAT' : line.gift ? 'Chiết khấu hộp + topping' : 'Chiết khấu'}><input type="number" min="0" step={line.discountType === 'amount' ? 1 : 0.01} value={line.discount} onChange={event => update({ discount: Number(event.target.value) })} /></Field>
        <Field name="Đơn vị chiết khấu"><select value={line.discountType} onChange={event => update({ discountType: event.target.value as QuoteLine['discountType'], discount: 0 })}>
          <option value="amount">đ / dòng</option><option value="percent">%</option>
        </select></Field>
        <Amount label="Thành tiền (-VAT)" value={net} />
        <Amount label="Thành tiền (+VAT)" value={net !== null && vat !== null ? net + vat : null} />
        <div className="issue-wide"><Field name="Ghi chú / Quy cách đóng gói"><textarea rows={2} maxLength={500} value={line.packaging} placeholder="Nhập ghi chú hoặc quy cách đóng gói" onChange={event => update({ packaging: event.target.value })} /></Field></div>
        <div className="issue-wide"><Field name="Hình ảnh sản phẩm"><select value={line.imageUrl} onChange={event => update({ imageUrl: event.target.value })}>
          <option value="">Không dùng ảnh</option>
          {photos.map((url, i) => <option key={url} value={url}>Ảnh {i + 1}</option>)}
        </select></Field></div>
        {line.gift && <div className="issue-wide"><Field name="Link ảnh quà Tết">
          <input type="url" maxLength={4096} value={line.imageUrl} placeholder="Dán link ảnh https://..."
            onChange={event => { setFailedUrl(''); update({ imageUrl: event.target.value.trim() }); }} />
          <small>Dán link trực tiếp đến ảnh. Ảnh sẽ tự co vừa khung trên báo giá.</small>
          {line.imageUrl && !isQuoteImageUrl(line.imageUrl) && <small role="alert">Vui lòng nhập link ảnh HTTP hoặc HTTPS hợp lệ.</small>}
        </Field></div>}
      </div>
    </div>
  </section>;
}

const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

async function waitForPrintAssets(root: HTMLElement) {
  await document.fonts.ready;
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('.quotation-paper img'));
  await Promise.all(images.map(async image => {
    let timer: number;
    try {
      await Promise.race([image.decode(), new Promise<never>((_, reject) => { timer = window.setTimeout(reject, 8000); })]);
    } catch {
      image.dispatchEvent(new Event('error'));
    } finally {
      clearTimeout(timer);
    }
  }));
  await nextPaint();
}

export function QuotationManagement({ products, customers, user, onDocumentTypeChange, onCustomersChanged }: Props) {
  const storageKey = `quotation-draft-v1:${user.username}`;
  const [draft, setDraft] = useState(() => recoverDraft(storageKey, user.name));
  const { form, requestId, pricesChecked } = draft;
  const [saved, setSaved] = useState<SavedQuote | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [history, setHistory] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [error, setError] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<number | null>(null);
  const busyRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!preview || !root) return;
    let active = true;
    setFailedPhotos(null);
    void waitForPrintAssets(root).then(() => {
      const expected = preview.data.items.filter(item => item.imageUrl).length;
      const loaded = Array.from(root.querySelectorAll<HTMLImageElement>('.quotation-paper img')).filter(img => img.complete && img.naturalWidth > 0).length;
      if (active) setFailedPhotos(Math.max(0, expected - loaded));
    });
    return () => { active = false; };
  }, [preview]);
  useEffect(() => {
    try {
      if (saved || JSON.stringify(form) === JSON.stringify(freshQuote(user.name))) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(draft));
      setStorageNotice('');
    } catch {
      setStorageNotice('Trình duyệt chưa lưu được bản nháp trên máy này.');
    }
  }, [storageKey, draft, saved, user.name, form]);

  function edit(changes: Partial<QuoteData>, resetPrices = false) {
    setDraft(prev => ({ form: { ...prev.form, ...changes }, requestId: crypto.randomUUID(), pricesChecked: prev.pricesChecked && !resetPrices }));
    setError('');
  }
  function addProduct(product: Product) {
    const line: QuoteLine = {
      productId: product._id, name: product.name, unit: product.unit || '', quantity: null,
      unitPrice: product.price > 0 ? product.price : -1, discount: 0, discountType: 'amount', vatRate: -1,
      imageUrl: productPhotos(product.images)[0] || '', packaging: product.packaging || '',
    };
    edit({ items: [...form.items, line] }, true);
    setProductQuery('');
  }
  function newQuote() {
    if (!saved && JSON.stringify(form) !== JSON.stringify(freshQuote(user.name)) && !window.confirm('Bỏ bản nháp đang soạn để lập báo giá mới?')) return;
    setDraft(emptyDraft(user.name));
    setSaved(null); setHistory(false); setError(''); setProductQuery(''); setCustomerQuery('');
  }
  function openPreview() {
    setError('');
    if (saved) { setPreview({ data: saved, record: saved }); return; }
    try {
      const data = normalizeQuote(form);
      if (!pricesChecked) throw new Error('Vui lòng xác nhận giá đã nhập đúng với chế độ VAT đã chọn.');
      setPreview({ data });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Vui lòng kiểm tra thông tin báo giá.');
    }
  }

  async function finish(print: boolean) {
    if (!preview || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError('');
    try {
      if (!preview.record) {
        const record: SavedQuote = await api.post('/api/quotations', { ...preview.data, requestId });
        setSaved(record); setPreview({ data: record, record });
        void Promise.resolve().then(() => onCustomersChanged?.()).catch(() => {});
      }
      if (print) {
        await nextPaint();
        if (!rootRef.current) return;
        await waitForPrintAssets(rootRef.current);
        if (rootRef.current) window.print();
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(!message || /fetch|network|load failed/i.test(message) ? 'Chưa kết nối được máy chủ. Hãy thử lại.' : message);
    } finally {
      setBusy(false); busyRef.current = false;
    }
  }
  const totals = quotePricing(form);
  const customerMatches = customers.filter(c => searchKey([c.name, c.phone, c.address, c.contactName].join(' ')).includes(searchKey(customerQuery))).slice(0, 8);
  const productMatches = products.filter(p => searchKey([p.name, p.sku, p.barcode].join(' ')).includes(searchKey(productQuery))).slice(0, 8);

  return <div className="issue-app">
    <header className="issue-heading">
      <h1>Báo giá tùy chỉnh</h1>
      <div className="quotation-buttons">
        <button className="issue-button secondary" onClick={newQuote}><Plus size={18} />Lập báo giá mới</button>
        <button className="issue-button secondary" onClick={() => { setHistory(!history); setError(''); }}><FileText size={18} />{history ? 'Về báo giá đang lập' : 'Báo giá đã lưu'}</button>
      </div>
    </header>
    <section className="issue-card">
      <DocumentTypeSelect value="quotation" onChange={type => { if (type !== 'quotation') onDocumentTypeChange(type); }} />
    </section>
    {history ? <QuoteHistory onOpen={record => { setPreview({ data: record, record }); setError(''); }} /> : <>
      {storageNotice && <p className="issue-error" role="alert">{storageNotice}</p>}
      {saved && <p className="issue-success" role="status">Đã lưu báo giá {saved.number}.</p>}
      <fieldset className="issue-form-fields" disabled={!!saved}>
        <section className="issue-card"><h2>Thông tin báo giá</h2>
          <div className="issue-grid">
            <div className="issue-wide"><Field name="Công ty gửi báo giá"><select value={form.companyId} onChange={event => edit({ companyId: event.target.value as QuoteData['companyId'] })}>
              <option value="">Chọn công ty</option>{quoteCompanies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select></Field></div>
            <Field name="Ngày báo giá"><input type="date" value={form.date} onChange={event => edit({ date: event.target.value })} /></Field>
            <Field name="Hiệu lực đến (nếu có)"><input type="date" min={form.date} value={form.validUntil} onChange={event => edit({ validUntil: event.target.value })} /></Field>
            <div className="issue-wide"><Field name="Tìm khách hàng"><input type="search" value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} placeholder="Tên, số điện thoại hoặc địa chỉ" /></Field>
              {customerQuery.trim() && <div className="issue-results">{customerMatches.map(c => <button type="button" key={c._id} onClick={() => { edit({ customerId: c._id, customerName: c.name }); setCustomerQuery(''); }}>
                <strong>{c.name}</strong><small>{[c.phone, c.address].filter(Boolean).join(' · ')}</small>
              </button>)}{!customerMatches.length && <p>Có thể nhập trực tiếp tên khách hàng bên dưới.</p>}</div>}
            </div>
            <p className="issue-hint issue-wide">Tên khách mới sẽ được lưu vào danh mục khi lưu báo giá.</p>
            <Field name="Danh xưng"><select value={form.salutation} onChange={event => edit({ salutation: event.target.value as QuoteData['salutation'] })}>
              {quoteSalutations.map(value => <option key={value}>{value}</option>)}
            </select></Field>
            <Field name="Tên khách hàng"><input maxLength={300} value={form.customerName} placeholder="Tên người nhận hoặc doanh nghiệp" onChange={event => edit({ customerName: event.target.value, customerId: '' })} /></Field>
            {form.customerName && <p className="issue-wide quotation-recipient">Kính gửi: <strong>{form.salutation} {form.customerName}</strong></p>}
          </div>
        </section>
        <section className="issue-card"><h2>Sản phẩm báo giá</h2>
          <label className="quotation-check"><input type="checkbox" checked={!!form.pricesIncludeVat}
            onChange={event => edit({ pricesIncludeVat: event.target.checked }, true)} />Giá đã gồm VAT</label>
          {form.pricesIncludeVat && <p className="issue-hint">Áp dụng cho toàn bộ báo giá. Chọn VAT để tách thuế từ giá đã nhập; chiết khấu trừ trên giá chưa VAT.</p>}
          <button type="button" className="issue-button secondary" disabled={form.items.length >= 100}
            onClick={() => edit({ items: [...form.items, {
              productId: '', name: 'Hộp quà Tết tự chọn', unit: 'Hộp', quantity: 1, unitPrice: -1,
              vatRate: -1, discount: 0, discountType: 'amount', packaging: '', imageUrl: '',
              gift: { pricing: 'gift-total', box: { name: '', price: -1 }, toppings: [] },
            }] }, true)}><Plus size={16} />Thêm quà Tết</button>
          <Field name="Tìm sản phẩm"><input type="search" value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Tên sản phẩm, SKU hoặc mã vạch" /></Field>
          {productQuery.trim() && <div className="issue-results">{productMatches.map(p => <button type="button" key={p._id} disabled={form.items.length >= 100} onClick={() => addProduct(p)}>
            <strong>{p.name}</strong><small>{[p.sku || p.barcode, p.unit, p.price > 0 ? money(p.price) + ' đ' : 'Liên hệ'].filter(Boolean).join(' · ')}</small>
          </button>)}{!productMatches.length && <p>Không tìm thấy sản phẩm.</p>}</div>}
          <div className="issue-lines">{form.items.map((line, index) => <QuoteLineEditor key={index} products={products} pricesIncludeVat={form.pricesIncludeVat} line={line} index={index} net={totals.taxable[index]} vat={totals.lineVat[index]} images={products.find(p => p._id === line.productId)?.images || []}
            update={changes => edit({ items: form.items.map((item, i) => i === index ? { ...item, ...changes } : item) }, changes.unitPrice !== undefined)}
            remove={() => edit({ items: form.items.filter((_, i) => i !== index) })} />)}</div>
          {totals.subtotal !== null && <div className="quotation-summary">
            <Amount label="Chiết khấu" value={totals.productDiscount} />
            <Amount label="Tổng chưa VAT" value={totals.subtotal - totals.productDiscount} />
            <Amount label="VAT" value={totals.vat} />
            <Amount label="Tổng có VAT" value={totals.total} />
          </div>}
          <label className="quotation-check"><input type="checkbox" checked={pricesChecked} onChange={event => { setDraft(prev => ({ ...prev, pricesChecked: event.target.checked })); setError(''); }} />{form.pricesIncludeVat ? 'Tôi đã kiểm tra đơn giá từng dòng là giá đã gồm VAT.' : 'Tôi đã kiểm tra đơn giá từng dòng là giá chưa VAT.'}</label>
        </section>
      </fieldset>
      {error && !preview && <div role="alert" className="issue-error">{error}</div>}
      <footer className="issue-action-bar">{totals.total !== null && <div><small>Tổng báo giá (+VAT)</small><strong>{money(totals.total)} đ</strong></div>}
        <button className="issue-button primary" onClick={openPreview}><Printer size={20} />Xem báo giá &amp; in</button></footer>
    </>}
    {preview && createPortal(<div role="dialog" aria-modal="true" aria-label="Xem trước báo giá" className="quotation-preview-root" ref={rootRef}
      onKeyDown={event => {
        if (event.key === 'Escape' && !busy) { setPreview(null); setError(''); }
        if (event.key === 'Tab' && rootRef.current) {
          const buttons = Array.from(rootRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="issue-preview-toolbar quotation-print-hide">
        <button autoFocus className="issue-button secondary" disabled={busy} onClick={() => { setPreview(null); setError(''); }}><ChevronLeft size={18} />Quay lại</button>
        <div><strong>{preview.record?.number || 'Xem trước báo giá'}</strong><small>{preview.data.pricesIncludeVat ? 'A4 ngang' : 'A4 dọc'} · Chọn “Lưu dưới dạng PDF” trong cửa sổ in.</small></div>
        <div className="issue-preview-actions">{!preview.record && <button className="issue-button secondary" disabled={busy} onClick={() => finish(false)}>Lưu báo giá</button>}
          <button className="issue-button primary" disabled={busy || failedPhotos === null} onClick={() => finish(true)}><Printer size={18} />{busy || failedPhotos === null ? 'Đang chuẩn bị…' : preview.record ? 'In / Lưu PDF' : 'Lưu & in PDF'}</button></div>
      </div>
      {failedPhotos > 0 && <p role="status" className="issue-error quotation-print-hide">{failedPhotos} ảnh sản phẩm chưa tải được. Bạn có thể in với ô ảnh trống{preview.record ? '.' : ' hoặc quay lại chọn ảnh khác.'}</p>}
      {error && <div role="alert" className="issue-error quotation-print-hide">{error}</div>}
      <div className="quotation-paper-scroll"><QuotationPaper data={preview.data} number={preview.record?.number} /></div>
    </div>, document.body)}
  </div>;
}
