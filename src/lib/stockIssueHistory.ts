export const STOCK_ISSUE_HISTORY_START = '2026-09-01';
export const STOCK_ISSUE_HISTORY_PAGE_SIZE = 30;
export const STOCK_ISSUE_DAY_PAGE_SIZE = 50;

export type StockIssueDay = { date: string; count: number };

export function issueDayLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `Ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}
