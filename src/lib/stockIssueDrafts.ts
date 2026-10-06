import { newStockIssue, upgradeStockIssue, type StockIssueData, type StockIssueLine } from './stockIssue';

export type IssueDraft = { form: StockIssueData; requestId: string; savedAt?: string };
export const freshIssue = (creator: string) => upgradeStockIssue(newStockIssue(creator));
export const hasIssueContent = (form: StockIssueData, creator: string) => JSON.stringify(form) !== JSON.stringify(freshIssue(creator));

export function recoverIssueDraft(value: unknown, creator: string): IssueDraft | null {
  const stored = value as any;
  if (!stored?.form || typeof stored.requestId !== 'string' || !Array.isArray(stored.form.items)) return null;
  const form = freshIssue(creator);
  for (const key of Object.keys(form) as (keyof StockIssueData)[]) {
    if (key !== 'items' && typeof stored.form[key] === typeof form[key]) (form as any)[key] = stored.form[key];
  }
  form.items = stored.form.items.slice(0, 100).map((entry: any) => {
    const line: StockIssueLine = { productId: '', name: '', sku: '', unit: '', requested: 1, quantity: 1, unitPrice: 0, vatRate: stored.form.pricingVersion === 2 ? -1 : form.vatRate, discount: 0, discountType: 'amount' };
    for (const key of Object.keys(line) as (keyof StockIssueLine)[]) if (typeof entry?.[key] === typeof line[key]) (line as any)[key] = entry[key];
    return line;
  });
  return { form, requestId: stored.requestId, savedAt: typeof stored.savedAt === 'string' ? stored.savedAt : undefined };
}

export function readIssueDrafts(storage: Pick<Storage, 'getItem'>, key: string, creator: string) {
  const stored = JSON.parse(storage.getItem(key) || '[]');
  if (!Array.isArray(stored)) throw new Error('Danh sách nháp bị lỗi. Chưa thể ghi đè bản nháp cũ.');
  return stored.map(value => recoverIssueDraft(value, creator)).filter((value): value is IssueDraft => !!value);
}

export function archiveIssueDraft(storage: Pick<Storage, 'getItem' | 'setItem'>, key: string, draft: IssueDraft, creator: string) {
  const drafts = readIssueDrafts(storage, key, creator).filter(value => value.requestId !== draft.requestId);
  const next = [{ ...draft, savedAt: new Date().toISOString() }, ...drafts];
  storage.setItem(key, JSON.stringify(next));
  return next;
}
