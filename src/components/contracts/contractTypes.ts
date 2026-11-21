export interface ContractField {
  key: string;
  label: string;
  group: 'contract' | 'company' | 'partner' | 'annex';
  type?: 'text' | 'date' | 'email' | 'tel' | 'textarea';
  defaultValue?: string;
  hint?: string;
  choices?: string[];
}

export type ContractValues = Record<string, string>;

export interface ContractClause {
  id: string;
  title: string;
  paragraphs: string[];
  children: ContractClause[];
}

export interface ContractAnnex {
  title: string;
  blocks: Array<{ text: string } | { rows: string[][] }>;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  issuerName: string;
  companyRole: string;
  partnerRole: string;
  companyRepresentative: string;
  fields: ContractField[];
  intro: string[];
  parties: { a: string[]; b: string[] };
  partyIntro: string;
  articles: ContractClause[];
  closing: string[];
  annexes: ContractAnnex[];
}

const token = /\[\[([^\[\]]+)\]\]/g;
const emptyMarker = /(?:…|\.(?:\s*\.){2,}|_{2,}|\[\[|\]\]|\b(?:tbd|todo)\b|\[\s*(?:điền|chưa điền)[^\]]*\])/iu;

export function hasPlaceholder(text: string) {
  return emptyMarker.test(text);
}

function clauseNumbers(clauses: ContractClause[], prefix = '', numbers = new Map<string, string>()) {
  clauses.forEach((clause, index) => {
    const number = prefix ? `${prefix}.${index + 1}` : String(index + 1);
    numbers.set(clause.id, number);
    clauseNumbers(clause.children, number, numbers);
  });
  return numbers;
}

export function renderContractText(text: string, values: ContractValues, articles: ContractClause[]) {
  let numbers: Map<string, string> | undefined;
  return text.replace(token, (match, key: string) => {
    if (key.startsWith('ref:')) {
      numbers ??= clauseNumbers(articles);
      return numbers.get(key.slice(4)) ?? match;
    }
    return Object.hasOwn(values, key) ? values[key].trim() || match : match;
  });
}

export function formatContractValues(template: ContractTemplate, values: ContractValues) {
  return Object.fromEntries(template.fields.map(field => {
    const value = values[field.key]?.trim() ?? '';
    const date = field.type === 'date' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
    return [field.key, date ? `${date[3]}/${date[2]}/${date[1]}` : value];
  }));
}

function clauseText(clauses: ContractClause[]): string[] {
  return clauses.flatMap(clause => [clause.title, ...clause.paragraphs, ...clauseText(clause.children)]);
}

export function contractText(template: ContractTemplate, articles: ContractClause[]) {
  return [
    template.title, ...template.intro, ...template.parties.a, ...template.parties.b, template.partyIntro,
    ...clauseText(articles), ...template.closing,
    ...template.annexes.flatMap(annex => [
      annex.title,
      ...annex.blocks.flatMap(block => 'text' in block ? [block.text] : block.rows.flat()),
    ]),
  ];
}

export function findInvalidReferences(template: ContractTemplate, articles: ContractClause[]) {
  const numbers = clauseNumbers(articles);
  const missing = new Set<string>();
  for (const text of contractText(template, articles)) {
    for (const [, key] of text.matchAll(token)) {
      if (key.startsWith('ref:') && !numbers.has(key.slice(4))) missing.add(key.slice(4));
    }
  }
  return [...missing];
}

export function validateContractField(field: ContractField, value = '') {
  const trimmed = value.trim();
  if (!trimmed || /^[\s\p{P}\p{S}]+$/u.test(trimmed) || hasPlaceholder(trimmed)) {
    return 'Vui lòng điền thông tin đầy đủ.';
  }
  if (field.choices && !field.choices.includes(trimmed)) {
    return 'Vui lòng chọn một giá trị trong danh sách.';
  }
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(trimmed)) {
    return 'Vui lòng nhập email hợp lệ.';
  }
  if (field.type === 'tel' && (!/^\+?[\d\s().-]+$/u.test(trimmed) || trimmed.replace(/\D/g, '').length < 7)) {
    return 'Vui lòng nhập số điện thoại hợp lệ.';
  }
  if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/u.test(trimmed) ||
      !Number.isFinite(Date.parse(trimmed)) || new Date(trimmed).toISOString().slice(0, 10) !== trimmed)) {
    return 'Vui lòng chọn ngày hợp lệ.';
  }
  return '';
}
