import { localDate, STOCK_ISSUE_COMPANIES, stockIssuePricing } from './stockIssue.js';

const [atuagin, tmr] = STOCK_ISSUE_COMPANIES;
export const quoteCompanies = [
  { id: 'tmr', name: tmr.name, address: tmr.address },
  { id: 'atuagin', name: atuagin.name, address: atuagin.address },
] as const;

export const quoteSalutations = ['Anh', 'Chị', 'Quý Doanh Nghiệp'] as const;
export const quoteVatRates = [0, 5, 8, 10] as const;
export const quoteHistoryPageSize = 25;
export interface GiftPart {
  name: string;
  price: number;
}
export interface TetGift {
  pricing?: 'box-plus-toppings';
  box: GiftPart;
  toppings: GiftPart[];
}

export function giftPrice(gift: TetGift) {
  const parts = [gift.box, ...gift.toppings];
  if (parts.some(part => !Number.isSafeInteger(part.price) || part.price < 0)) return -1;
  return parts.reduce((total, part) => total + part.price, 0);
}

export interface QuoteLine {
  gift?: TetGift;
  productId: string;
  name: string;
  unit: string;
  quantity: number | null;
  unitPrice: number;
  vatRate: number;
  discount: number;
  discountType: 'amount' | 'percent';
  imageUrl: string;
  packaging: string;
}

export interface QuoteData {
  companyId: '' | (typeof quoteCompanies)[number]['id'];
  salutation: (typeof quoteSalutations)[number];
  customerName: string;
  customerId: string;
  date: string;
  validUntil: string;
  creator: string;
  items: QuoteLine[];
}

export interface SavedQuote extends QuoteData {
  _id: string;
  number: string;
  requestId: string;
  companyName: string;
  companyAddress: string;
  createdAt: string;
}

export function freshQuote(creator = ''): QuoteData {
  return {
    companyId: '', salutation: 'Anh', customerName: '', customerId: '',
    date: localDate(), validUntil: '', creator, items: [],
  };
}

export function quoteNumber(date: string, sequence: number) {
  return 'BG' + date.replaceAll('-', '') + '-' + String(sequence).padStart(4, '0');
}

export function quoteRequestId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) throw new Error('Mã lưu báo giá không hợp lệ.');
  return value;
}

export function quotePricing(data: Pick<QuoteData, 'items'>) {
  const priced = data.items.map(item => {
    if (item.quantity == null || item.quantity <= 0 || item.unitPrice < 0) return null;
    const separate = item.gift?.pricing === 'box-plus-toppings';
    const unitPrice = separate ? item.gift.box.price : item.unitPrice;
    const priced = stockIssuePricing({ items: [{ ...item, quantity: item.quantity, unitPrice }], vatRate: 0 });
    if (separate) {
      const toppings = Math.round((item.unitPrice - unitPrice) * item.quantity);
      priced.subtotal += toppings;
      priced.taxable[0] += toppings;
      priced.total += toppings;
    }
    return priced;
  });
  const complete = priced.length > 0 && priced.every(row => row !== null);
  const taxesReady = complete && data.items.every(item => item.vatRate >= 0);
  return {
    lines: priced.map(row => row?.subtotal ?? null),
    discounts: priced.map(row => row?.productDiscount ?? null),
    taxable: priced.map(row => row?.taxable[0] ?? null),
    lineVat: priced.map((row, i) => data.items[i].vatRate >= 0 ? row?.vat ?? null : null),
    subtotal: complete ? priced.reduce((sum, row) => sum + row.subtotal, 0) : null,
    productDiscount: complete ? priced.reduce((sum, row) => sum + row.productDiscount, 0) : null,
    vat: taxesReady ? priced.reduce((sum, row) => sum + row.vat, 0) : null,
    total: taxesReady ? priced.reduce((sum, row) => sum + row.total, 0) : null,
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' không hợp lệ.');
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined) value = '';
  if (typeof value !== 'string' || value.length > max) throw new Error(label + ' không hợp lệ.');
  if (required && !value.trim()) throw new Error('Vui lòng nhập ' + label.toLowerCase() + '.');
  return value.trim();
}

function dateField(value: unknown, label: string, required: boolean) {
  const date = text(value, label, 10, required);
  if (!date) return '';
  const parsed = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(label + ' không hợp lệ.');
  }
  return date;
}

function nonnegative(value: unknown, label: string, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(label + ' phải từ 0 đến ' + max.toLocaleString('vi-VN') + '.');
  }
  return value;
}

// Keep the exact URL, including any query string required by the image host.
export function isQuoteImageUrl(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function normalizeLine(raw: unknown, index: number): QuoteLine {
  const row = ' dòng ' + (index + 1);
  const line = record(raw, 'Mặt hàng' + row);
  let gift: TetGift | undefined;
  if (line.gift !== undefined) {
    const config = record(line.gift, 'Hộp quà Tết' + row);
    const part = (value: unknown, label: string): GiftPart => {
      const item = record(value, label);
      const price = nonnegative(item.price, 'Giá ' + label, 1_000_000_000);
      if (!Number.isSafeInteger(price)) throw new Error('Giá thành phần phải là số đồng nguyên.');
      return { name: text(item.name, label, 300, true), price };
    };
    if (!Array.isArray(config.toppings) || config.toppings.length < 3) {
      throw new Error('Mỗi hộp quà Tết cần ít nhất 3 topping' + row + '.');
    }
    gift = { box: part(config.box, 'mẫu hộp'), toppings: config.toppings.map(t => part(t, 'topping')) };
    if (config.pricing === 'box-plus-toppings') gift.pricing = config.pricing;
    if (line.unitPrice !== giftPrice(gift)) throw new Error('Đơn giá hộp phải bằng tổng giá hộp và các topping.');
  }
  const quantity = line.quantity == null || line.quantity === '' ? null : nonnegative(line.quantity, 'Số lượng' + row, 1_000_000);
  if (quantity === 0) throw new Error('Số lượng' + row + ' phải lớn hơn 0.');
  const unitPrice = nonnegative(line.unitPrice, 'Đơn giá' + row, 1_000_000_000);
  if (!Number.isInteger(unitPrice)) throw new Error('Đơn giá' + row + ' phải là số đồng nguyên.');
  const vatRate = quoteVatRates.find(rate => rate === line.vatRate);
  if (vatRate === undefined) throw new Error('Chọn VAT 0%, 5%, 8% hoặc 10% ở' + row + '.');
  const discountType = line.discountType;
  if (discountType !== 'amount' && discountType !== 'percent') throw new Error('Chọn đơn vị chiết khấu ở' + row + '.');
  const discountBase = gift?.pricing === 'box-plus-toppings' ? gift.box.price : unitPrice;
  const amountLimit = quantity === null ? 999_999_999_999 : Math.round(quantity * discountBase);
  const discount = nonnegative(line.discount, 'Chiết khấu' + row, discountType === 'percent' ? 100 : amountLimit);
  if (discountType === 'amount' && !Number.isInteger(discount)) throw new Error('Chiết khấu' + row + ' phải là số đồng nguyên.');
  const imageUrl = text(line.imageUrl, 'Link hình ảnh' + row, 4096);
  if (imageUrl && !isQuoteImageUrl(imageUrl)) throw new Error('Link hình ảnh' + row + ' phải là địa chỉ HTTP hoặc HTTPS.');
  return {
    productId: text(line.productId, 'Mã sản phẩm' + row, 150),
    ...(gift ? { gift } : {}),
    name: text(line.name, 'Tên sản phẩm' + row, 300, true),
    unit: text(line.unit, 'Đơn vị tính' + row, 100, true),
    quantity, unitPrice, vatRate, discountType, discount, imageUrl,
    packaging: text(line.packaging, 'Quy cách đóng gói' + row, 500),
  };
}

export function normalizeQuote(raw: unknown): QuoteData {
  const input = record(raw, 'Báo giá');
  const company = quoteCompanies.find(option => option.id === input.companyId);
  if (!company) throw new Error('Vui lòng chọn công ty gửi báo giá.');
  const salutation = quoteSalutations.find(value => value === input.salutation);
  if (!salutation) throw new Error('Vui lòng chọn danh xưng khách hàng.');
  const customerName = text(input.customerName, 'Tên khách hàng', 300, true);
  const date = dateField(input.date, 'Ngày báo giá', true);
  const validUntil = dateField(input.validUntil, 'Ngày hết hiệu lực', false);
  if (validUntil && validUntil < date) throw new Error('Ngày hết hiệu lực phải từ ngày báo giá trở đi.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) {
    throw new Error('Vui lòng thêm từ 1 đến 100 mặt hàng.');
  }
  const items = input.items.map(normalizeLine);
  const { lines, taxable, lineVat, subtotal, total } = quotePricing({ items });
  const limit = 999_999_999_999;
  if (subtotal > limit || total > limit || lines.some((gross, i) => gross != null && (gross > limit || taxable[i] + lineVat[i] > limit))) {
    throw new Error('Giá trị báo giá vượt 999.999.999.999 đồng.');
  }
  return {
    companyId: company.id, salutation, customerName,
    customerId: text(input.customerId, 'Mã khách hàng', 150),
    date, validUntil, creator: text(input.creator, 'Người lập báo giá', 200), items,
  };
}
