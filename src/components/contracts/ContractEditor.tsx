import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, List, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  findInvalidReferences,
  hasPlaceholder,
  renderContractText,
  type ContractClause,
  type ContractTemplate,
  type ContractValues,
} from './contractTypes';
import './contract-editor.css';

interface ContractEditorProps {
  template: ContractTemplate;
  values: ContractValues;
  articles: ContractClause[];
  onArticlesChange: (articles: ContractClause[]) => void;
  onBack: () => void;
}

type ClauseLocation = { articleId: string; clauseId?: string };

interface OpenMenu {
  target: ClauseLocation;
  x: number;
  y: number;
  trigger: HTMLElement | null;
}

interface ClauseForm {
  id: string;
  parentId?: string;
  afterId?: string;
  existing?: ContractClause;
  title: string;
  body: string;
}

function replaceOrInsert(clauses: ContractClause[], form: ClauseForm, clause: ContractClause) {
  if (form.existing) {
    return clauses.map((item) => (item.id === clause.id ? clause : item));
  }
  const afterIndex = form.afterId ? clauses.findIndex((item) => item.id === form.afterId) : -1;
  if (afterIndex === -1) return [...clauses, clause];
  return [
    ...clauses.slice(0, afterIndex + 1),
    clause,
    ...clauses.slice(afterIndex + 1),
  ];
}

function createClauseId() {
  return `added-${crypto.randomUUID()}`;
}

function SignatureLines({ rows }: { rows: string[][] }) {
  const [labels, notes, names] = rows;
  return (
    <div className="contract-signatures">
      {labels.map((label, index) => (
        <div key={index}>
          <p><strong>{label}</strong></p>
          <p><em>{notes[index]}</em></p>
          <p className="contract-signature-name"><strong>{names[index]}</strong></p>
        </div>
      ))}
    </div>
  );
}

function ClauseActions({
  open,
  onClose,
  children,
}: {
  open: OpenMenu;
  onClose: (restoreFocus?: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const left = Math.max(8, Math.min(open.x, window.innerWidth - element.offsetWidth - 8));
    const top = Math.max(8, Math.min(open.y, window.innerHeight - element.offsetHeight - 8));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    if (open.trigger) element.querySelector('button')?.focus({ preventScroll: true });

    const clickOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !element.contains(event.target) &&
        !event.target.closest('.contract-block-button')
      ) {
        onClose();
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(true);
    };
    document.addEventListener('pointerdown', clickOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', clickOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  return createPortal(
    <div
      className="contract-clause-actions"
      ref={ref}
      role="group"
      aria-label={open.target.clauseId ? 'Thao tác với khoản' : 'Thao tác với điều'}
    >
      {children}
    </div>,
    document.body,
  );
}

function ClauseDialog({
  form,
  error,
  onChange,
  onCancel,
  onSave,
  renderText,
}: {
  form: ClauseForm;
  error: string;
  onChange: (form: ClauseForm) => void;
  onCancel: () => void;
  onSave: () => void;
  renderText: (text: string) => string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const isSubclause = Boolean(form.parentId);
  const resolvedTitle = renderText(form.title);
  const resolvedBody = renderText(form.body);
  const showsFields = resolvedTitle !== form.title || resolvedBody !== form.body;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    titleRef.current?.focus();
    return () => dialog.close();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return createPortal(
    <dialog
      className="contract-clause-dialog"
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form onSubmit={submit} noValidate>
        <div className="contract-dialog-heading">
          <h2 id={headingId}>
            {form.existing ? 'Chỉnh sửa' : 'Thêm'} {isSubclause ? 'khoản' : 'điều'}
          </h2>
          <button className="contract-icon-button" type="button" onClick={onCancel} aria-label="Đóng">
            <X size={19} aria-hidden />
          </button>
        </div>
        <label>
          {isSubclause ? 'Tiêu đề (nếu có)' : 'Tiêu đề điều'}
          <input
            ref={titleRef}
            value={form.title}
            required={!isSubclause}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
          />
        </label>
        <label>
          Nội dung
          <textarea
            rows={7}
            value={form.body}
            onChange={(event) => onChange({ ...form, body: event.target.value })}
          />
        </label>
        {showsFields && (
          <>
            <p className="contract-dialog-hint">
              Giữ nguyên mã trong dấu [[ ]] để hợp đồng tự điền thông tin và số điều khoản.
            </p>
            <div className="contract-clause-sample" aria-label="Nội dung sau khi điền">
              {resolvedTitle && <strong>{resolvedTitle}</strong>}
              {resolvedBody && <p>{resolvedBody}</p>}
            </div>
          </>
        )}
        {error && <p className="contract-editor-error" role="alert">{error}</p>}
        <div className="contract-dialog-footer">
          <button className="contract-editor-button" type="button" onClick={onCancel}>Hủy</button>
          <button className="contract-editor-button contract-editor-primary" type="submit">
            {form.existing ? 'Lưu thay đổi' : 'Thêm vào hợp đồng'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

export function ContractEditor({
  template,
  values,
  articles,
  onArticlesChange,
  onBack,
}: ContractEditorProps) {
  const anchorPrefix = useId();
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const [form, setForm] = useState<ClauseForm | null>(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeAnchor, setActiveAnchor] = useState('');
  const formTrigger = useRef<HTMLElement | null>(null);
  const addArticleButton = useRef<HTMLButtonElement>(null);

  function resolve(text: string, currentArticles = articles) {
    return renderContractText(text, values, currentArticles);
  }

  function anchor(id: string) {
    return `${anchorPrefix}-${id}`;
  }

  function goTo(id: string) {
    const target = document.getElementById(anchor(id));
    if (!target) return;
    setActiveAnchor(id);
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }

  function dismissMenu(restoreFocus = false) {
    if (restoreFocus) menu?.trigger?.focus({ preventScroll: true });
    setMenu(null);
  }

  function openContextMenu(event: MouseEvent, target: ClauseLocation) {
    event.preventDefault();
    event.stopPropagation();
    const origin = event.currentTarget.getBoundingClientRect();
    const usesKeyboard = event.clientX === 0 && event.clientY === 0;
    setMenu({
      target,
      x: usesKeyboard ? origin.left : event.clientX,
      y: usesKeyboard ? origin.top : event.clientY,
      trigger: event.currentTarget instanceof HTMLElement ? event.currentTarget : null,
    });
  }

  function openActionButton(event: MouseEvent<HTMLButtonElement>, target: ClauseLocation) {
    if (menu?.target.articleId === target.articleId && menu.target.clauseId === target.clauseId) {
      dismissMenu();
      return;
    }
    const button = event.currentTarget.getBoundingClientRect();
    setMenu({ target, x: button.right - 209, y: button.bottom + 4, trigger: event.currentTarget });
  }

  function showForm(nextForm: ClauseForm) {
    formTrigger.current = menu?.trigger ?? addArticleButton.current;
    setForm(nextForm);
    setFormError('');
    setNotice('');
    dismissMenu();
  }

  function startEditing(target: ClauseLocation) {
    const article = articles.find((item) => item.id === target.articleId);
    const clause = target.clauseId ? article?.children.find((item) => item.id === target.clauseId) : article;
    if (!clause) return;
    showForm({
      id: clause.id,
      parentId: target.clauseId ? target.articleId : undefined,
      existing: clause,
      title: clause.title,
      body: clause.paragraphs.join('\n'),
    });
  }

  function startAdding(parentId?: string, afterId?: string) {
    showForm({ id: createClauseId(), parentId, afterId, title: '', body: '' });
  }

  function closeForm() {
    setForm(null);
    requestAnimationFrame(() => formTrigger.current?.focus({ preventScroll: true }));
  }

  function saveForm() {
    if (!form) return;
    const clause = {
      id: form.id,
      title: form.title.trim(),
      paragraphs: form.body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
      children: form.existing?.children ?? [],
    };
    if (!form.parentId && !clause.title) {
      setFormError('Nhập tiêu đề điều.');
      return;
    }
    if (form.parentId && !clause.title && clause.paragraphs.length === 0) {
      setFormError('Nhập tiêu đề hoặc nội dung khoản.');
      return;
    }
    const nextArticles = form.parentId
      ? articles.map((article) => (
        article.id === form.parentId
          ? { ...article, children: replaceOrInsert(article.children, form, clause) }
          : article
      ))
      : replaceOrInsert(articles, form, clause);
    if ([clause.title, ...clause.paragraphs].filter(Boolean).some((text) => {
      const rendered = resolve(text, nextArticles);
      return !rendered.trim() || hasPlaceholder(rendered);
    })) {
      setFormError('Điền đầy đủ nội dung hoặc sửa các mã thông tin và dẫn chiếu còn thiếu.');
      return;
    }
    onArticlesChange(nextArticles);
    closeForm();
    if (!form.existing) requestAnimationFrame(() => goTo(form.id));
  }

  function removeClause(target: ClauseLocation) {
    const nextArticles = target.clauseId
      ? articles.map((article) => (
        article.id === target.articleId
          ? { ...article, children: article.children.filter((clause) => clause.id !== target.clauseId) }
          : article
      ))
      : articles.filter((article) => article.id !== target.articleId);
    if (findInvalidReferences(template, nextArticles).length > 0) {
      setNotice('Còn điều khoản dẫn chiếu đến nội dung này. Hãy cập nhật dẫn chiếu trước khi xóa.');
      dismissMenu(true);
      return;
    }
    setNotice('');
    onArticlesChange(nextArticles);
    dismissMenu();
    requestAnimationFrame(() => {
      if (target.clauseId) goTo(target.articleId);
      else addArticleButton.current?.focus({ preventScroll: true });
    });
  }

  function renderParagraphs(paragraphs: string[]) {
    return paragraphs.map((paragraph, index) => <p key={index}>{resolve(paragraph)}</p>);
  }

  function actionButton(target: ClauseLocation, number: string) {
    return (
      <button
        className="contract-icon-button contract-block-button"
        type="button"
        aria-label={`Thao tác với ${number}`}
        aria-expanded={menu?.target.articleId === target.articleId && menu.target.clauseId === target.clauseId}
        onClick={(event) => openActionButton(event, target)}
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>
    );
  }

  function tocButton(id: string, text: string, child = false) {
    return (
      <button
        type="button"
        className={child ? 'contract-toc-child' : undefined}
        aria-current={activeAnchor === id ? 'location' : undefined}
        onClick={() => goTo(id)}
      >
        {text}
      </button>
    );
  }

  return (
    <div className="contract-editor">
      <div className="contract-editor-toolbar">
        <button className="contract-editor-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden /> Thông tin hợp đồng
        </button>
        <button
          className="contract-editor-button contract-editor-primary"
          type="button"
          ref={addArticleButton}
          onClick={() => startAdding()}
        >
          <Plus size={17} aria-hidden /> Thêm điều
        </button>
      </div>
      {notice && (
        <div className="contract-editor-notice">
          <p role="alert">{notice}</p>
          <button
            className="contract-icon-button"
            type="button"
            onClick={() => setNotice('')}
            aria-label="Đóng thông báo"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
      )}
      <div className="contract-editor-layout">
        <article className="contract-paper" aria-label="Nội dung hợp đồng">
          <header className="contract-paper-header">
            <div className="contract-paper-title">
              <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
              <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
              <h2>{resolve(template.title)}</h2>
              <p>Số {resolve('[[contractNumber]]')}</p>
            </div>
            {renderParagraphs(template.intro)}
          </header>
          <section className="contract-parties" id={anchor('parties')} tabIndex={-1} aria-label="Các bên">
            <div>
              <h3>BÊN A ({template.companyRole.toLocaleUpperCase('vi-VN')})</h3>
              {renderParagraphs(template.parties.a)}
            </div>
            <div>
              <h3>BÊN B ({template.partnerRole.toLocaleUpperCase('vi-VN')})</h3>
              {renderParagraphs(template.parties.b)}
            </div>
          </section>
          {template.partyIntro && <p>{resolve(template.partyIntro)}</p>}
          {articles.map((article, index) => (
            <section
              className="contract-article contract-block"
              id={anchor(article.id)}
              key={article.id}
              tabIndex={-1}
              onContextMenu={(event) => openContextMenu(event, { articleId: article.id })}
            >
              <div className="contract-block-heading">
                <h3>Điều {index + 1}. {resolve(article.title)}</h3>
                {actionButton({ articleId: article.id }, `Điều ${index + 1}`)}
              </div>
              {renderParagraphs(article.paragraphs)}
              {article.children.map((clause, subIndex) => {
                const target = { articleId: article.id, clauseId: clause.id };
                const number = `${index + 1}.${subIndex + 1}`;
                const [first, ...remaining] = clause.paragraphs;
                return (
                  <section
                    className="contract-subclause contract-block"
                    id={anchor(clause.id)}
                    key={clause.id}
                    tabIndex={-1}
                    aria-label={`Khoản ${number}`}
                    onContextMenu={(event) => openContextMenu(event, target)}
                  >
                    <div className="contract-block-heading">
                      {clause.title ? (
                        <h4>{number}. {resolve(clause.title)}</h4>
                      ) : (
                        <p><strong>{number}.</strong> {first && resolve(first)}</p>
                      )}
                      {actionButton(target, `Khoản ${number}`)}
                    </div>
                    {renderParagraphs(clause.title ? clause.paragraphs : remaining)}
                  </section>
                );
              })}
            </section>
          ))}
          <section className="contract-paper-closing" id={anchor('closing')} tabIndex={-1} aria-label="Phần ký">
            {renderParagraphs(template.closing)}
            <SignatureLines rows={[
              ['ĐẠI DIỆN BÊN A', 'ĐẠI DIỆN BÊN B'],
              ['(Ký, ghi rõ họ tên và đóng dấu)', '(Ký, ghi rõ họ tên và đóng dấu)'],
              [template.companyRepresentative, resolve('[[partnerRepresentative]]')],
            ]} />
          </section>
          {template.annexes.map((annex, index) => (
            <section className="contract-annex" id={anchor(`annex-${index}`)} tabIndex={-1} key={index}>
              <h3>{resolve(annex.title)}</h3>
              {annex.blocks.map((block, blockIndex) => {
                if ('text' in block) return <p key={blockIndex}>{resolve(block.text)}</p>;
                const rows = block.rows.map((row) => row.map((cell) => resolve(cell)));
                if (rows.length === 3 && rows[1].every((cell) => cell.startsWith('(Ký,'))) {
                  return <SignatureLines key={blockIndex} rows={rows} />;
                }
                return (
                  <div className="contract-table-scroll" key={blockIndex}>
                    <table>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </section>
          ))}
        </article>
        <aside className="contract-editor-aside">
          <nav className="contract-editor-toc" aria-label="Mục lục hợp đồng">
            <h2><List size={17} aria-hidden /> Mục lục</h2>
            <ul>
              <li>{tocButton('parties', 'Các bên')}</li>
              {articles.map((article, index) => (
                <li key={article.id}>
                  {tocButton(article.id, `Điều ${index + 1}. ${resolve(article.title)}`)}
                  {article.children.length > 0 && (
                    <ul>
                      {article.children.map((clause, subIndex) => {
                        const label = resolve(clause.title || clause.paragraphs[0] || '').replace(/\s+/g, ' ');
                        const excerpt = label.length > 76 ? `${label.slice(0, 73).trimEnd()}…` : label;
                        return (
                          <li key={clause.id}>
                            {tocButton(clause.id, `${index + 1}.${subIndex + 1}. ${excerpt}`, true)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
              <li>{tocButton('closing', 'Phần ký')}</li>
              {template.annexes.map((annex, index) => (
                <li key={index}>{tocButton(`annex-${index}`, resolve(annex.title))}</li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
      {menu && (
        <ClauseActions open={menu} onClose={dismissMenu}>
          <button type="button" onClick={() => startEditing(menu.target)}>
            <Pencil size={16} aria-hidden /> Chỉnh sửa
          </button>
          {menu.target.clauseId ? (
            <button type="button" onClick={() => startAdding(menu.target.articleId, menu.target.clauseId)}>
              <Plus size={16} aria-hidden /> Thêm khoản bên dưới
            </button>
          ) : (
            <>
              <button type="button" onClick={() => startAdding(menu.target.articleId)}>
                <Plus size={16} aria-hidden /> Thêm khoản
              </button>
              <button type="button" onClick={() => startAdding(undefined, menu.target.articleId)}>
                <Plus size={16} aria-hidden /> Thêm điều bên dưới
              </button>
            </>
          )}
          <button className="contract-clause-remove" type="button" onClick={() => removeClause(menu.target)}>
            <Trash2 size={16} aria-hidden /> Xóa {menu.target.clauseId ? 'khoản' : 'điều'}
          </button>
        </ClauseActions>
      )}
      {form && (
        <ClauseDialog
          form={form}
          error={formError}
          onChange={(nextForm) => {
            setForm(nextForm);
            setFormError('');
          }}
          onCancel={closeForm}
          onSave={saveForm}
          renderText={resolve}
        />
      )}
    </div>
  );
}
