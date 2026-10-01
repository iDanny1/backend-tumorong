import { createHash, createSign } from 'node:crypto';
import { stockIssueTotals, type SavedStockIssue } from '../lib/stockIssue.js';

// These worksheets belong exclusively to this integration. Existing sales sheets
// and their AppSheet keys/formulas are never rewritten.
export const bridgeTables = {
  customers: { title: 'CRM_KhachHang', headers: ['Mã KH', 'Tên KH', 'SĐT', 'Địa chỉ khách hàng', 'Email', 'Nhóm KH'] },
  issues: { title: 'CRM_PhieuXuat', headers: ['Mã phiếu', 'Số phiếu', 'Ngày xuất', 'Mã KH', 'Người nhận', 'SĐT', 'Địa chỉ khách hàng', 'Địa điểm giao hàng', 'Kho xuất', 'Lý do xuất', 'Tiền hàng', 'VAT %', 'Tiền VAT', 'Tổng thanh toán', 'Người lập'] },
  lines: { title: 'CRM_ChiTietXuat', headers: ['Mã dòng', 'Mã phiếu', 'STT', 'Mã sản phẩm', 'Tên sản phẩm', 'ĐVT', 'Yêu cầu', 'Thực xuất', 'Đơn giá', 'Thành tiền'] },
} as const;
export type TableName = keyof typeof bridgeTables;
export type SheetRow = (string | number)[];
export type BridgeConfig = { spreadsheetId: string; email: string; privateKey: string };
export function bridgeConfig(env: NodeJS.ProcessEnv = process.env): BridgeConfig | null {
  if (env.APPSHEET_SYNC_ENABLED !== 'true') return null;
  const spreadsheetId = env.APPSHEET_SPREADSHEET_ID?.trim() || '';
  const email = env.APPSHEET_SERVICE_ACCOUNT_EMAIL?.trim() || '';
  const privateKey = (env.APPSHEET_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!/^[\w-]{20,}$/.test(spreadsheetId) || !email.endsWith('.iam.gserviceaccount.com') || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Chưa đủ cấu hình kết nối Google Sheets. Xem hướng dẫn kết nối AppSheet.');
  }
  return { spreadsheetId, email, privateKey };
}
export const rowHash = (rows: SheetRow[]) => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
export function customerRow(customer: any): SheetRow {
  return [String(customer._id), customer.name || '', customer.phone || '', customer.address || '', customer.email || '', customer.type === 'wholesale' ? 'Sỉ' : 'Lẻ'];
}
export function issueRows(issue: SavedStockIssue): { header: SheetRow; lines: SheetRow[] } {
  const total = stockIssueTotals(issue.items, issue.vatRate);
  return {
    header: [issue._id, issue.number, issue.date, issue.customerId, issue.recipient, issue.phone, issue.address, issue.deliveryAddress, issue.warehouseName, issue.reason, total.subtotal, issue.vatRate, total.vat, total.total, issue.creator],
    lines: issue.items.map((item, index) => [`${issue._id}:${index + 1}`, issue._id, index + 1, item.sku, item.name, item.unit, item.requested, item.quantity, item.unitPrice, total.lines[index]]),
  };
}
const quote = (title: string) => `'${title.replaceAll("'", "''")}'`;
const lastColumn = (table: TableName) => String.fromCharCode(64 + bridgeTables[table].headers.length);
export type WriteRow = { table: TableName; row: number; values: SheetRow };

export class GoogleSheetsBridge {
  private token = '';
  private tokenExpires = 0;
  constructor(readonly config: BridgeConfig, private http: typeof fetch = fetch) {}

  private async accessToken() {
    if (this.token && Date.now() < this.tokenExpires) return this.token;
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const claim = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: this.config.email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
    let signature: string;
    try { signature = createSign('RSA-SHA256').update(claim).sign(this.config.privateKey, 'base64url'); }
    catch { throw new Error('Khóa kết nối Google chưa hợp lệ.'); }
    const response = await this.http('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${claim}.${signature}` }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Google chưa chấp nhận tài khoản kết nối. Kiểm tra email, khóa và giờ máy chủ.');
    const data = await response.json();
    if (!data.access_token) throw new Error('Google chưa cấp quyền kết nối.');
    this.token = data.access_token;
    this.tokenExpires = Date.now() + Math.max(0, (Number(data.expires_in) || 3600) - 60) * 1000;
    return this.token;
  }

  private async request(suffix: string, body?: unknown) {
    const token = await this.accessToken();
    const response = await this.http(`https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}${suffix}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      if (response.status === 401) this.tokenExpires = 0;
      throw new Error(response.status === 403 ? 'Chưa có quyền ghi Google Sheets hoặc chưa bật Google Sheets API.' : response.status === 404 ? 'Không tìm thấy bảng Google Sheets đã cấu hình.' : `Google Sheets chưa đồng bộ được (HTTP ${response.status}). Hệ thống sẽ thử lại.`);
    }
    return response.json();
  }

  async validateTables() {
    const params = new URLSearchParams();
    for (const table of Object.values(bridgeTables)) params.append('ranges', `${quote(table.title)}!1:1`);
    const result = await this.request(`/values:batchGet?${params}`);
    Object.values(bridgeTables).forEach((table, index) => {
      const header = result.valueRanges?.[index]?.values?.[0] || [];
      if (JSON.stringify(header) !== JSON.stringify(table.headers)) throw new Error(`Bảng ${table.title} chưa đúng cấu trúc. Chạy thiết lập kết nối trước khi đồng bộ.`);
    });
  }

  // Explicit operator setup, never invoked by a public API or normal page load.
  async setup() {
    const existing = await this.request('?fields=sheets.properties');
    const additions = Object.values(bridgeTables).filter(table => !existing.sheets?.some((sheet: any) => sheet.properties.title === table.title));
    if (additions.length) {
      await this.request(':batchUpdate', { requests: additions.map(table => ({ addSheet: { properties: { title: table.title, gridProperties: { rowCount: 1000, columnCount: table.headers.length, frozenRowCount: 1 } } } })) });
    }
    // Only initialize wholly empty managed tabs. Never overwrite an existing header.
    for (const [key, table] of Object.entries(bridgeTables)) {
      const result = await this.request(`/values/${encodeURIComponent(`${quote(table.title)}!A:${lastColumn(key as TableName)}`)}`);
      if (!result.values?.length) {
        await this.request('/values:batchUpdate', { valueInputOption: 'RAW', data: [{ range: `${quote(table.title)}!A1`, values: [[...table.headers]] }] });
      } else if (JSON.stringify(result.values[0]) !== JSON.stringify(table.headers)) {
        throw new Error(`Bảng ${table.title} đã có dữ liệu khác. Dừng thiết lập để bảo vệ dữ liệu.`);
      }
    }
    await this.validateTables();
  }

  async write(rows: WriteRow[]) {
    if (!rows.length) return;
    for (const row of rows) {
      if (!Number.isSafeInteger(row.row) || row.row < 2 || !bridgeTables[row.table] || row.values.length !== bridgeTables[row.table].headers.length) throw new Error('Dòng đồng bộ không hợp lệ.');
    }
    const metadata = await this.request('?fields=sheets.properties');
    const requests: object[] = [];
    for (const key of Object.keys(bridgeTables) as TableName[]) {
      const max = Math.max(0, ...rows.filter(row => row.table === key).map(row => row.row));
      if (!max) continue;
      const sheet = metadata.sheets?.find((s: any) => s.properties.title === bridgeTables[key].title)?.properties;
      if (!sheet) throw new Error('Thiếu bảng đồng bộ. Cần chạy thiết lập kết nối.');
      if (max > sheet.gridProperties.rowCount) requests.push({ updateSheetProperties: { properties: { sheetId: sheet.sheetId, gridProperties: { rowCount: max + 100 } }, fields: 'gridProperties.rowCount' } });
    }
    if (requests.length) await this.request(':batchUpdate', { requests });
    const ranges = rows.map(row => {
      return `${quote(bridgeTables[row.table].title)}!A${row.row}:${lastColumn(row.table)}${row.row}`;
    });
    const params = new URLSearchParams();
    ranges.forEach(range => params.append('ranges', range));
    const existing = await this.request(`/values:batchGet?${params}`);
    rows.forEach((row, index) => {
      const cells = existing.valueRanges?.[index]?.values?.[0] || [];
      if (cells.some((cell: unknown) => cell !== '') && String(cells[0]) !== String(row.values[0])) {
        throw new Error(`Dòng ${row.row} trong ${bridgeTables[row.table].title} đã bị di chuyển hoặc có dữ liệu khác. Dừng ghi để tránh đè dữ liệu.`);
      }
    });
    // Fixed Mongo-allocated row addresses make retries after lost responses safe.
    // RAW preserves phone leading zeros and stores user input as text, never formulas.
    await this.request('/values:batchUpdate', { valueInputOption: 'RAW', data: rows.map((row, index) => ({ range: ranges[index], values: [row.values] })) });
  }
}
