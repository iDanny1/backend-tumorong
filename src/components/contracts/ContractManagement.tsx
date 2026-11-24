import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { ContractEditor } from './ContractEditor';
import { contractTemplates } from './contractTemplates';
import { api } from '../../lib/api';
import {
  contractText, formatContractValues, hasPlaceholder, renderContractText, validateContractField,
  type ContractClause, type ContractField, type ContractTemplate, type ContractValues,
} from './contractTypes';

const groups: Array<{ key: ContractField['group']; title: string }> = [
  { key: 'contract', title: 'Thông tin hợp đồng' },
  { key: 'company', title: 'Bên A · Công ty của chúng ta' },
  { key: 'partner', title: 'Bên B · Khách hàng hoặc đối tác' },
  { key: 'annex', title: 'Thông tin phụ lục' },
];

const steps = ['Chọn loại hợp đồng', 'Điền thông tin', 'Xem và chỉnh sửa'];
interface LibraryRow {
  _id: string; revision: number; template: { name: string }; values: {contractNumber: string; partnerName: string};
}
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800';
const secondaryButton = 'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50';

export function ContractManagement() {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [values, setValues] = useState<ContractValues>({});
  const [articles, setArticles] = useState<ContractClause[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentError, setDocumentError] = useState('');
  const heading = React.useRef<HTMLHeadingElement>(null);
  const [record, setRecord] = useState(() => ({id: crypto.randomUUID() as string, revision: 0}));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [library, setLibrary] = useState<LibraryRow[]>([]);
  const [libraryVersion, refreshLibrary] = useState(0);
  const [deleteNotice, setDeleteNotice] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  React.useEffect(() => {
    if (step !== 0) return;
    let active = true;
    setLibraryError('');
    setLibrary([]);
    setHasMore(false);
    api.get('/api/contracts?offset=' + offset).then(page => {
      if (active) { setLibrary(page.items); setHasMore(page.hasMore); }
    }).catch(() => { if (active) setLibraryError('Chưa tải được danh sách hợp đồng đã lưu.'); });
    return () => { active = false; };
  }, [step, offset, libraryVersion]);
  const documentValues = template ? formatContractValues(template, values) : {};

  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.scrollIntoView({ block: 'start' });
      heading.current?.focus({ preventScroll: true });
    });
  }

  function selectTemplate(next: ContractTemplate, fresh = false) {
    if (fresh || next.id !== template?.id) {
      setRecord({id: crypto.randomUUID(), revision: 0});
      setStatus('');
      setTemplate(next);
      setValues(Object.fromEntries(next.fields.map(field => [field.key, field.defaultValue ?? ''])));
      setArticles(next.articles);
      setErrors({});
      setDocumentError('');
    }
    goToStep(1);
  }

  function updateField(field: ContractField, value: string) {
    setStatus('');
    setValues(current => ({ ...current, [field.key]: value }));
    if (errors[field.key]) {
      setErrors(current => ({ ...current, [field.key]: validateContractField(field, value) }));
    }
    setDocumentError('');
  }

  function openPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template) return;
    const nextErrors: Record<string, string> = {};
    for (const field of template.fields) {
      const error = validateContractField(field, values[field.key]);
      if (error) nextErrors[field.key] = error;
    }
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      setDocumentError('');
      document.getElementById(`contract-field-${firstError}`)?.focus();
      return;
    }
    if (contractText(template, articles).some(text => hasPlaceholder(renderContractText(text, documentValues, articles)))) {
      setDocumentError('Hợp đồng còn chỗ giữ chỗ hoặc tham chiếu chưa được điền. Vui lòng kiểm tra lại mẫu hợp đồng.');
      return;
    }
    setDocumentError('');
    goToStep(2);
  }

  async function save() {
    if (!template || busy) return;
    setBusy(true);
    setStatus('');
    try {
      const result = await api.put('/api/contracts/' + record.id, {revision: record.revision, templateId: template.id, values, articles});
      setRecord({...record, revision: result.revision});
      setStatus('Đã lưu hợp đồng ' + values.contractNumber + '.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Chưa lưu được hợp đồng.');
    } finally { setBusy(false); }
  }

  async function removeContract(row: LibraryRow) {
    if (busy || !window.confirm('Xóa hợp đồng ' + row.values.contractNumber + ' của ' + row.values.partnerName + '?')) return;
    setBusy(true);
    setDeleteNotice('');
    setLibraryError('');
    try {
      await api.delete('/api/contracts/' + row._id + '?revision=' + row.revision);
      if (record.id === row._id) setTemplate(null);
      if (offset && library.length === 1) setOffset(offset - 30);
      refreshLibrary(version => version + 1);
      setDeleteNotice('Đã xóa hợp đồng ' + row.values.contractNumber + '.');
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Chưa xóa được hợp đồng.');
    } finally { setBusy(false); }
  }

  async function reopen(id: string) {
    setBusy(true);
    try {
      const saved = await api.get('/api/contracts/' + id);
      setTemplate(saved.template);
      setValues(saved.values);
      setArticles(saved.articles);
      setRecord({id, revision: saved.revision});
      setErrors({});
      setDocumentError('');
      setStatus('');
      goToStep(2);
    } catch { setLibraryError('Chưa mở được hợp đồng. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }

  return (
    <div inert={busy} aria-busy={busy} className={step === 2 ? 'mx-auto w-full max-w-[96rem] pb-8' : 'mx-auto w-full max-w-5xl pb-8'}>
      <div className="mb-6">
        <h1 ref={heading} tabIndex={-1} className="scroll-mt-3 text-2xl font-bold text-slate-900 outline-none">Hợp đồng</h1>
        <ol aria-label="Các bước soạn hợp đồng" className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? 'step' : undefined}
              className={`flex items-center gap-2 ${index === step ? 'font-semibold text-emerald-800' : 'text-slate-500'}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${index === step ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <section aria-labelledby="contract-template-heading">
          <h2 id="contract-template-heading" className="mb-3 text-lg font-semibold text-slate-900">Chọn mẫu hợp đồng</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contractTemplates.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTemplate(item)}
                className="group flex h-full flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-emerald-500 hover:bg-emerald-50/50 focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <FileText className="size-5 text-emerald-700" aria-hidden="true" />
                <span className="font-semibold leading-snug text-slate-900">{item.name}</span>
                <span className="text-sm leading-relaxed text-slate-600">{item.description}</span>
                <span className="mt-auto flex items-center gap-2 pt-1 text-sm font-semibold text-emerald-800">
                  {template?.id === item.id ? 'Tiếp tục soạn' : 'Chọn mẫu'}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
          {template && <button type="button" className={secondaryButton + ' mt-3'} onClick={() => selectTemplate(contractTemplates.find(t => t.id === template.id)!, true)}>Tạo hợp đồng mới cùng mẫu</button>}
          <h2 className="mt-8 mb-3 text-lg font-semibold text-slate-900">Hợp đồng đã lưu</h2>
          {libraryError && <p role="alert">{libraryError}</p>}
          {deleteNotice && <p role="status">{deleteNotice}</p>}
          {library?.map(row => <div key={row._id} className="mb-2 flex items-center gap-2">
            <button type="button" onClick={() => reopen(row._id)}
            className="block min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-emerald-600">
            <strong>{row.values.contractNumber} · {row.values.partnerName}</strong>
            <span className="block text-sm text-slate-600">{row.template.name}</span>
            </button>
            <button type="button" className={secondaryButton + ' text-red-700'} aria-label={'Xóa hợp đồng ' + row.values.contractNumber}
              onClick={() => removeContract(row)}>Xóa</button>
          </div>)}
          {offset > 0 && <button type="button" className={secondaryButton} onClick={() => setOffset(offset - 30)}>Trang trước</button>}
          {hasMore && <button type="button" className={secondaryButton} onClick={() => setOffset(offset + 30)}>Trang sau</button>}
        </section>
      )}

      {step === 1 && template && (
        <form onSubmit={openPreview} noValidate className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{template.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Bên A · {template.issuerName} ({template.companyRole}). Bên B · {template.partnerRole}.</p>
              <p className="mt-1 text-sm text-slate-600">Tất cả trường dưới đây đều bắt buộc.</p>
            </div>
            <button type="button" onClick={() => goToStep(0)} className={secondaryButton}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Chọn mẫu
            </button>
          </div>
          {groups.map(group => {
            const fields = template.fields.filter(field => field.group === group.key);
            if (!fields.length) return null;
            return (
              <fieldset key={group.key} className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 pb-5 md:px-5">
                <legend className="px-2 text-sm font-semibold text-slate-900">{group.title}</legend>
                <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {fields.map(field => {
                    const id = `contract-field-${field.key}`;
                    const error = errors[field.key];
                    const props = {
                      id,
                      name: field.key,
                      value: values[field.key] ?? '',
                      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateField(field, event.target.value),
                      required: true,
                      'aria-invalid': Boolean(error),
                      'aria-describedby': [field.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined,
                      className: `mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${error ? 'border-red-500' : 'border-slate-300'}`,
                    };
                    return (
                      <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                        <label htmlFor={id} className="text-sm font-medium text-slate-700">{field.label}</label>
                        {field.choices ? (
                          <select {...props}>
                            <option value="">Chọn một giá trị</option>
                            {field.choices.map(choice => <option key={choice}>{choice}</option>)}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea {...props} rows={3} />
                        ) : (
                          <input {...props} type={field.type ?? 'text'} />
                        )}
                        {field.hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{field.hint}</p>}
                        {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          {documentError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{documentError}</p>}
          <div className="flex justify-end">
            <button type="submit" className={primaryButton}>Xem hợp đồng <ArrowRight className="size-4" aria-hidden="true" /></button>
          </div>
        </form>
      )}

      {step === 2 && template && (
        <ContractEditor template={template} values={documentValues} articles={articles}
          onArticlesChange={next => { setArticles(next); setStatus(''); }}
          onSave={save} status={busy ? 'Đang lưu…' : status}
          onLibrary={() => { setOffset(0); goToStep(0); }} onBack={() => goToStep(1)} />
      )}
    </div>
  );
}
