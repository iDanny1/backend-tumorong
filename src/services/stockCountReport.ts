import * as xlsx from 'xlsx';
import { stockChecker, stockCountZone, type StockCountRecord } from '../lib/stockCount.js';
import { StockCount } from '../models/StockCount.js';

type Observation = Omit<StockCountRecord, 'createdAt' | 'sku' | 'unit'> & { createdAt: Date; sku?: string; unit?: string };
const clock = new Intl.DateTimeFormat('vi-VN', {
  timeZone: stockCountZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

// The history and the summary use the same descending order, including ties.
export function stockCountWorkbook(day: string, newestFirst: Observation[]) {
  const columns = ['Ngày kiểm', 'Kho', 'SKU', 'Sản phẩm', 'Số lượng', 'Đơn vị', 'Quy cách', 'Người kiểm', 'Giờ kiểm (VN)'];
  const widths = [14, 24, 18, 42, 13, 12, 32, 24, 16];
  const summary = new Map<string, { values: (string | number)[]; count: number }>();
  const detail = newestFirst.map(row => {
    const values = [day, row.warehouseName, row.sku || '', row.productName, row.quantity, row.unit || '', row.packaging,
      stockChecker(row), clock.format(row.createdAt)];
    const key = row.warehouseId + ':' + row.productId;
    const entry = summary.get(key);
    if (entry) entry.count++;
    else summary.set(key, { values, count: 1 });
    return values;
  });
  const workbook = xlsx.utils.book_new();
  const sheets = [
    { name: 'Tổng hợp', headers: [...columns, 'Số lượt kiểm'], sizes: [...widths, 16],
      rows: Array.from(summary.values(), entry => [...entry.values, entry.count]) },
    { name: 'Chi tiết lượt kiểm', headers: columns, sizes: widths, rows: detail },
  ];
  for (const { name, headers, sizes, rows } of sheets) {
    const sheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = sizes.map(wch => ({ wch }));
    sheet['!autofilter'] = { ref: sheet['!ref']! };
    xlsx.utils.book_append_sheet(workbook, sheet, name);
  }
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
}

export function dailyStockCountRows(day: string) {
  return StockCount.find({ day }).sort({ createdAt: -1, _id: -1 }).lean();
}
