import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose, { Schema } from 'mongoose';
import { stockChecker, stockReportCc, stockReportRecipients, stockReportSender, stockReportTime } from '../lib/stockCount.js';
import { dailyStockCountRows, stockCountWorkbook } from './stockCountReport.js';

const Delivery = mongoose.model('StockCountMailDelivery', new Schema({
  _id: String, day: String, recipient: String, status: String, requestedBy: String, updatedAt: Date,
}));
type Outcome = 'sent' | 'unknown' | 'failed';
const mailScript = fileURLToPath(new URL('../../scripts/sendStockCountEmail.py', import.meta.url));

interface MailPayload {
  day: string; sender: string; to: readonly string[]; cc: readonly string[];
  deliveryId: string; checkedTime: string; checkers: string[]; xlsx: string;
}
function deliver(payload: MailPayload): Promise<Outcome> {
  return new Promise(resolve => {
    const child = execFile(process.env.STOCK_REPORT_PYTHON || 'python3', ['-X', 'utf8', mailScript],
      { windowsHide: true, timeout: 65000, env: {
        PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
        STOCK_REPORT_GOOGLE_CLIENT_ID: process.env.STOCK_REPORT_GOOGLE_CLIENT_ID,
        STOCK_REPORT_GOOGLE_CLIENT_SECRET: process.env.STOCK_REPORT_GOOGLE_CLIENT_SECRET,
        STOCK_REPORT_GOOGLE_REFRESH_TOKEN: process.env.STOCK_REPORT_GOOGLE_REFRESH_TOKEN,
      } }, (error, stdout) => {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return resolve('failed');
        const status = stdout.trim();
        resolve(!error && ['sent', 'failed'].includes(status) ? status as Outcome : 'unknown');
      });
    child.stdin.on('error', () => { /* The process callback reports the outcome. */ });
    child.stdin.end(JSON.stringify(payload));
  });
}

export class StockReportMailError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function sendStockCountMail(day: string, requestedBy: string, expectedCount: number, latestId: string, transport = deliver) {
  if (!process.env.STOCK_REPORT_GOOGLE_CLIENT_ID || !process.env.STOCK_REPORT_GOOGLE_CLIENT_SECRET || !process.env.STOCK_REPORT_GOOGLE_REFRESH_TOKEN) {
    throw new StockReportMailError(503, 'Chưa cấu hình quyền gửi Gmail cho q10@agrivietnam.org trên máy chủ.');
  }
  const rows = await dailyStockCountRows(day);
  if (!rows.length || rows.length !== expectedCount || rows[0]._id !== latestId) {
    throw new StockReportMailError(409, 'Dữ liệu kiểm kê đã thay đổi. Bấm Tải lại để xem báo cáo trước khi gửi.');
  }
  const xlsx = stockCountWorkbook(day, rows).toString('base64');
  const checkers = [...new Set(rows.map(stockChecker))];
  const revision = createHash('sha256').update(rows.map(row => row._id).join(',')).digest('hex');
  const checkedTime = stockReportTime(rows[0].createdAt);
  const recipients = [...stockReportRecipients, ...stockReportCc];
  const results = (status: string) => recipients.map(recipient => ({ recipient, status }));
  const legacyIds = recipients.map(recipient => createHash('sha256').update([day, revision, recipient].join('/')).digest('hex'));
  if (await Delivery.exists({ _id: { $in: legacyIds }, status: { $ne: 'failed' } })) {
    throw new StockReportMailError(409, 'Báo cáo này đã có lượt gửi bằng SMTP. Vui lòng đối chiếu trước khi gửi lại.');
  }
  const id = 'gmail:' + revision;
  const claim = { $set: { day, recipient: recipients.join(', '), status: 'sending', requestedBy, updatedAt: new Date() } };
  try {
    await Delivery.updateOne({ _id: id, status: 'failed' }, claim, { upsert: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await Delivery.findById(id).lean();
    const stale = existing?.status === 'sending' && Date.now() - existing.updatedAt.getTime() > 120000;
    return results(stale ? 'unknown' : existing?.status || 'unknown');
  }
  const status = await transport({ day, sender: stockReportSender, to: stockReportRecipients,
    cc: stockReportCc, deliveryId: revision, checkedTime, checkers, xlsx });
  await Delivery.updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
  return results(status);
}
