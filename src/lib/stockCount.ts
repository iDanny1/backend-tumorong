export const stockCountMenu = 'Kiểm kê hằng ngày';
export const stockCountZone = 'Asia/Ho_Chi_Minh';
export const stockReportSender = 'q10@agrivietnam.org';
export const stockReportRecipients = [
  'cs.1@agrivietnam.org', 'cs.2@agrivietnam.org', 'ecom@agrivietnam.org', 'admin@agrivietnam.org',
] as const;
export const stockReportCc = ['info@agrivietnam.org'] as const;

const clock = new Intl.DateTimeFormat('en-GB', { timeZone: stockCountZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function stockReportTime(createdAt: Date | string) {
  return clock.format(new Date(createdAt)).replace(':', 'h');
}

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: stockCountZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function stockCountDay(date = new Date()) {
  return dayFormatter.format(date);
}

export interface StockCountRecord {
  _id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  packaging: string;
  quantity: number;
  countedBy: string;
  checkerName?: string;
  createdAt: string;
  day: string;
}

export function stockChecker(row: Pick<StockCountRecord, 'countedBy' | 'checkerName'>) {
  return row.checkerName || row.countedBy;
}
