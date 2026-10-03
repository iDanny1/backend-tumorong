export interface StockIssueLine {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  requested: number;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount?: number;
  discountType?: "amount" | "percent";
}

export interface StockIssueData {
  date: string;
  companyName: string;
  companyAddress: string;
  customerId: string;
  recipient: string;
  phone: string;
  address: string;
  deliveryAddress: string;
  reason: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  debitAccount: string;
  creditAccount: string;
  attachments: string;
  creator: string;
  receiver: string;
  keeper: string;
  accountant: string;
  director: string;
  vatRate: number; // Legacy fallback only. New forms require a rate on each line.
  pricingVersion?: 2;
  hideVat?: boolean;
  hideDiscount?: boolean;
  billDiscount?: number;
  billDiscountType?: "amount" | "percent";
  items: StockIssueLine[];
}

export interface SavedStockIssue extends StockIssueData {
  _id: string;
  number: string;
  requestId: string;
  createdAt: string;
}

export const COMPANY_NAME = 'CÔNG TY CỔ PHẦN RƯỢU SÂM VIỆT NAM ATUAGIN';
export const COMPANY_ADDRESS = 'Tòa nhà Bitexco, Số 02, Đường Hải Triều, Phường Sài Gòn, TP. Hồ Chí Minh';
export const STOCK_ISSUE_COMPANIES = [
  { name: COMPANY_NAME, address: COMPANY_ADDRESS },
  { name: 'CÔNG TY CỔ PHẦN SÂM NGỌC LINH TU MƠ RÔNG KON TUM', address: 'Làng Ko Xía 2, Xã Măng Ri, Tỉnh Quảng Ngãi, Việt Nam' },
] as const;

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function newStockIssue(creator = ''): StockIssueData {
  return {
    date: localDate(), companyName: COMPANY_NAME, companyAddress: COMPANY_ADDRESS,
    customerId: '', recipient: '', phone: '', address: '', deliveryAddress: '',
    reason: 'Xuất kho bán hàng', warehouseId: '', warehouseName: '', warehouseLocation: '',
    debitAccount: '632', creditAccount: '156', attachments: '',
    creator, receiver: '', keeper: '', accountant: '', director: '', vatRate: 10, items: [],
  };
}

export function stockIssueTotals(items: StockIssueLine[], vatRate: number) {
  const lines = items.map(item => Math.round(item.quantity * item.unitPrice));
  const subtotal = lines.reduce((sum, value) => sum + value, 0);
  const vat = Math.round(subtotal * vatRate / 100);
  return { lines, subtotal, vat, total: subtotal + vat };
}

export function upgradeStockIssue(data: StockIssueData): StockIssueData {
  return { ...data, pricingVersion: 2, hideVat: data.hideVat ?? false, hideDiscount: data.hideDiscount ?? false, billDiscount: data.billDiscount ?? 0, billDiscountType: data.billDiscountType ?? 'amount',
    items: data.items.map(item => ({ ...item, vatRate: item.vatRate ?? data.vatRate, discount: item.discount ?? 0, discountType: item.discountType ?? 'amount' })) };
}

// Discounts are commercial discounts before VAT. Allocate whole VND with the
// largest remainder method; the allocation always adds up to the bill discount.
export function stockIssuePricing(data: StockIssueData) {
  const gross = data.items.map(item => Math.round(item.quantity * item.unitPrice));
  const discounts = data.items.map((item, i) => Math.round(item.discountType === 'percent' ? gross[i] * (item.discount ?? 0) / 100 : (item.discount ?? 0)));
  const net = gross.map((value, i) => Math.max(0, value - discounts[i]));
  const netTotal = net.reduce((a, b) => a + b, 0);
  const billDiscount = Math.round(data.billDiscountType === 'percent' ? netTotal * (data.billDiscount ?? 0) / 100 : (data.billDiscount ?? 0));
  const shares = net.map(value => netTotal ? billDiscount * value / netTotal : 0);
  const allocated = shares.map(Math.floor);
  const remainder = billDiscount - allocated.reduce((a, b) => a + b, 0);
  shares.map((value, i) => ({ i, fraction: value - allocated[i] })).sort((a, b) => b.fraction - a.fraction || a.i - b.i).slice(0, Math.max(0, remainder)).forEach(({ i }) => allocated[i]++);
  const taxable = net.map((value, i) => Math.max(0, value - allocated[i]));
  const rates = data.items.map(item => item.vatRate ?? data.vatRate);
  const lineVat = taxable.map((value, i) => Math.round(value * rates[i] / 100));
  const subtotal = gross.reduce((a, b) => a + b, 0);
  const productDiscount = discounts.reduce((a, b) => a + b, 0);
  const vat = lineVat.reduce((a, b) => a + b, 0);
  const total = taxable.reduce((a, b) => a + b, 0) + vat;
  const taxGroups = [...new Set(rates)].sort((a,b) => a-b).map(rate => ({ rate,
    taxable: taxable.reduce((sum, value, i) => sum + (rates[i] === rate ? value : 0), 0),
    vat: lineVat.reduce((sum, value, i) => sum + (rates[i] === rate ? value : 0), 0) }));
  return { lines: gross, subtotal, discounts, productDiscount, billDiscount, allocated, taxable, lineVat, vat, total, taxGroups };
}

export function stockIssueAmounts(data: StockIssueData) {
  return data.pricingVersion === 2 ? stockIssuePricing(data) : stockIssueTotals(data.items, data.vatRate);
}

export const money = (value: number) => value.toLocaleString('vi-VN');

const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function readHundreds(value: number, full: boolean) {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor(value % 100 / 10);
  const one = value % 10;
  const words: string[] = [];
  if (hundred || full) words.push(digits[hundred], 'trăm');
  if (ten > 1) words.push(digits[ten], 'mươi');
  else if (ten === 1) words.push('mười');
  else if (one && (hundred || full)) words.push('lẻ');
  if (one) words.push(one === 1 && ten > 1 ? 'mốt' : one === 5 && ten > 0 ? 'lăm' : digits[one]);
  return words.join(' ');
}

export function moneyInWords(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999_999_999_999) return '';
  if (value === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const groups: number[] = [];
  for (let n = value; n > 0; n = Math.floor(n / 1000)) groups.push(n % 1000);
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i]) words.push(readHundreds(groups[i], i < groups.length - 1), units[i]);
  }
  const result = words.filter(Boolean).join(' ') + ' đồng';
  return result[0].toUpperCase() + result.slice(1);
}

// Shared validation: the server independently validates and recomputes every amount.
export function normalizeStockIssue(raw: unknown): StockIssueData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Phiếu không hợp lệ.');
  const input = raw as Record<string, unknown>;
  const text = (key: string, label: string, required = false, max = 500) => {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max) throw new Error(`${label} không hợp lệ (tối đa ${max} ký tự).`);
    if (required && !value.trim()) throw new Error(`Vui lòng nhập ${label.toLowerCase()}.`);
    return value.trim();
  };
  const date = text('date', 'Ngày xuất', true, 10);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Ngày xuất không hợp lệ.');
  const numeric = (value: unknown, label: string, max: number, positive = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || (positive && value === 0)) throw new Error(`${label} phải ${positive ? 'lớn hơn 0' : 'từ 0'} và không quá ${money(max)}.`);
    return value;
  };
  const vatRate = numeric(input.vatRate, 'Thuế VAT (%)', 100);
  if (input.pricingVersion !== undefined && input.pricingVersion !== 2) throw new Error('Phiên bản phiếu không hợp lệ.');
  const modern = input.pricingVersion === 2;
  const display: Pick<StockIssueData, 'hideVat' | 'hideDiscount'> = {};
  for (const key of ['hideVat', 'hideDiscount'] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'boolean') throw new Error('Tùy chọn hiển thị phiếu không hợp lệ.');
      display[key] = input[key];
    }
  }
  const discountType = (value: unknown): 'amount' | 'percent' => {
    if (value !== 'amount' && value !== 'percent') throw new Error('Kiểu chiết khấu không hợp lệ.');
    return value;
  };
  const billDiscountType = modern ? discountType(input.billDiscountType) : undefined;
  const billDiscount = modern ? numeric(input.billDiscount, 'Chiết khấu tổng bill', billDiscountType === 'percent' ? 100 : 999_999_999_999) : undefined;
  if (billDiscountType === 'amount' && !Number.isInteger(billDiscount)) throw new Error('Chiết khấu phải là số đồng nguyên.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) throw new Error('Vui lòng thêm từ 1 đến 100 mặt hàng.');
  const items: StockIssueLine[] = input.items.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`Dòng ${index + 1} không hợp lệ.`);
    const field = (key: string, required = false) => {
      const value = entry[key] ?? '';
      if (typeof value !== 'string' || value.length > 300 || (required && !value.trim())) throw new Error(`Vui lòng kiểm tra tên hàng, mã hàng và đơn vị tính ở dòng ${index + 1}.`);
      return value.trim();
    };
    const requested = numeric(entry.requested, `Số lượng yêu cầu dòng ${index + 1}`, 1_000_000, true);
    const quantity = numeric(entry.quantity, `Số lượng thực xuất dòng ${index + 1}`, 1_000_000);
    if (quantity > requested) throw new Error(`Thực xuất dòng ${index + 1} không được vượt số lượng yêu cầu.`);
    const unitPrice = numeric(entry.unitPrice, `Đơn giá dòng ${index + 1}`, 1_000_000_000);
    if (!Number.isInteger(unitPrice)) throw new Error(`Đơn giá dòng ${index + 1} phải là số đồng nguyên.`);
    const extras: Partial<StockIssueLine> = {};
    if (modern) {
      extras.vatRate = numeric(entry.vatRate, `VAT dòng ${index + 1}`, 100);
      if (![0, 5, 8, 10].includes(extras.vatRate)) throw new Error(`Chọn VAT 0%, 5%, 8% hoặc 10% ở dòng ${index + 1}.`);
      extras.discountType = discountType(entry.discountType);
      extras.discount = numeric(entry.discount, `Chiết khấu dòng ${index + 1}`, extras.discountType === 'percent' ? 100 : 999_999_999_999);
      if (extras.discountType === 'amount' && (!Number.isInteger(extras.discount) || extras.discount > Math.round(quantity * unitPrice))) throw new Error(`Chiết khấu dòng ${index + 1} không được vượt tiền hàng và phải là số đồng nguyên.`);
    }
    return { ...extras, productId: field('productId'), name: field('name', true), sku: field('sku'), unit: field('unit', true), requested, quantity, unitPrice };
  });
  if (!items.some(item => item.quantity > 0)) throw new Error('Cần ít nhất một mặt hàng có số lượng thực xuất lớn hơn 0.');
  const pricing = modern ? { pricingVersion: 2 as const, billDiscount, billDiscountType } : {};
  if (modern) {
    const afterLineDiscounts = items.reduce((sum, item) => { const gross = Math.round(item.quantity * item.unitPrice); return sum + gross - Math.round(item.discountType === 'percent' ? gross * item.discount! / 100 : item.discount!); }, 0);
    if (billDiscountType === 'amount' && billDiscount! > afterLineDiscounts) throw new Error('Chiết khấu tổng bill không được vượt tiền hàng sau chiết khấu sản phẩm.');
  }
  if (items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice), 0) > 999_999_999_999) throw new Error('Tiền hàng vượt giới hạn 999.999.999.999 đồng.');
  if (stockIssueAmounts({ items, vatRate, ...pricing } as StockIssueData).total > 999_999_999_999) throw new Error('Tổng phiếu vượt giới hạn 999.999.999.999 đồng.');
  return {
    ...pricing, ...display, date, companyName: text('companyName', 'Tên công ty', true), companyAddress: text('companyAddress', 'Địa chỉ công ty', true),
    customerId: text('customerId', 'Mã khách hàng'), recipient: text('recipient', 'Người / đơn vị nhận hàng', true), phone: text('phone', 'Số điện thoại', false, 30),
    address: text('address', 'Địa chỉ'), deliveryAddress: text('deliveryAddress', 'Địa điểm giao hàng'),
    reason: text('reason', 'Lý do xuất', true), warehouseId: text('warehouseId', 'Mã kho'), warehouseName: text('warehouseName', 'Kho xuất', true), warehouseLocation: text('warehouseLocation', 'Địa điểm kho'),
    debitAccount: text('debitAccount', 'Tài khoản Nợ', false, 30), creditAccount: text('creditAccount', 'Tài khoản Có', false, 30), attachments: text('attachments', 'Chứng từ kèm theo'),
    creator: text('creator', 'Người lập phiếu'), receiver: text('receiver', 'Người nhận ký'), keeper: text('keeper', 'Thủ kho'), accountant: text('accountant', 'Kế toán trưởng'), director: text('director', 'Giám đốc'), vatRate, items,
  };
}
