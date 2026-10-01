import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import mongoose, { Schema, type Model } from 'mongoose';
import { bridgeConfig, customerRow, GoogleSheetsBridge, issueRows, rowHash, type TableName, type WriteRow } from './appSheetBridge.js';

const positionSchema = new Schema({ destination: String, table: String, key: String, row: Number });
positionSchema.index({ destination: 1, table: 1, key: 1 }, { unique: true });
positionSchema.index({ destination: 1, table: 1, row: 1 }, { unique: true });
const Position = mongoose.model('AppSheetPosition', positionSchema);
const Counter = mongoose.model('AppSheetRowCounter', new Schema({ _id: String, value: Number }));
const Receipt = mongoose.model('AppSheetReceipt', new Schema({ _id: String, hash: String, syncedAt: Date }));
const Lease = mongoose.model('AppSheetLease', new Schema({ _id: String, owner: String, expiresAt: Date, lastSuccess: Date, lastError: String }));
export type SyncStatus = { enabled: boolean; state: 'disabled' | 'setup_required' | 'waiting' | 'syncing' | 'ok' | 'error'; message: string; lastSuccess?: string };
let status: SyncStatus = { enabled: false, state: 'disabled', message: 'Chưa bật kết nối AppSheet. Phiếu vẫn lưu và in bình thường.' };
export const appSheetSyncStatus = () => ({ ...status });

// Persist positions separately from the source records. A lost Google response or
// process restart always retries the SAME cells instead of appending duplicates.
async function allocateRow(destination: string, table: TableName, key: string) {
  const filter = { destination, table, key };
  const existing = await Position.findOne(filter).lean();
  if (existing) return existing.row;
  const counter = await Counter.findOneAndUpdate({ _id: `${destination}:${table}` }, { $inc: { value: 1 } }, { upsert: true, new: true });
  try { return (await Position.create({ ...filter, row: counter.value + 1 })).row; }
  catch (error: any) {
    if (error.code !== 11000) throw error;
    const winner = await Position.findOne(filter).lean();
    if (!winner) throw error;
    return winner.row;
  }
}

export function startAppSheetSync(Customer: Model<any>, StockIssue: Model<any>) {
  let config;
  try { config = bridgeConfig(); }
  catch (error) { status = { enabled: false, state: 'setup_required', message: (error as Error).message }; return () => {}; }
  if (!config) return () => {};
  const bridge = new GoogleSheetsBridge(config);
  const destination = config.spreadsheetId;
  const owner = randomUUID();
  let busy = false;
  let stopped = false;
  status = { enabled: true, state: 'waiting', message: 'Đang chờ kiểm tra kết nối Google Sheets.' };

  const tick = async () => {
    if (busy || stopped || mongoose.connection.readyState !== 1) return;
    busy = true;
    let acquired = false;
    try {
      await Promise.all([Position.init(), Counter.init(), Receipt.init(), Lease.init()]);
      try {
        const lease = await Lease.findOneAndUpdate({ _id: destination, $or: [{ expiresAt: { $lt: new Date() } }, { owner }] }, { $set: { owner, expiresAt: new Date(Date.now() + 180000) } }, { upsert: true, new: true });
        acquired = lease.owner === owner;
      } catch (error: any) { if (error.code !== 11000) throw error; }
      if (!acquired) {
        const other = await Lease.findById(destination).lean();
        status = { enabled: true, state: other?.lastError ? 'error' : 'waiting', message: other?.lastError || 'Máy chủ đang xử lý đồng bộ.', lastSuccess: other?.lastSuccess?.toISOString() };
        return;
      }
      status = { ...status, state: 'syncing', message: 'Đang đồng bộ dữ liệu sang Google Sheets cho AppSheet.' };
      await bridge.validateTables();
      // Renew ownership before every remote write; a stale instance cannot keep
      // writing after another backend instance acquires the integration lease.
      const renew = async () => {
        if (stopped) throw new Error('Đã dừng đồng bộ.');
        const result = await Lease.updateOne({ _id: destination, owner, expiresAt: { $gt: new Date() } }, { $set: { expiresAt: new Date(Date.now() + 180000) } });
        if (!result.matchedCount) throw new Error('Đã chuyển lượt đồng bộ sang máy chủ khác.');
      };
      const sync = async (key: string, rows: Omit<WriteRow, 'row'>[]) => {
        const id = `${destination}:${key}`;
        const hash = rowHash(rows.map(row => row.values));
        const receipt = await Receipt.findById(id).lean();
        if (receipt?.hash === hash) return;
        await renew();
        const writes: WriteRow[] = [];
        for (const row of rows) writes.push({ ...row, row: await allocateRow(destination, row.table, String(row.values[0])) });
        await renew();
        await bridge.write(writes);
        await Receipt.updateOne({ _id: id }, { $set: { hash, syncedAt: new Date() } }, { upsert: true });
        await delay(3000); // About 40 reads / 20 writes per minute per service account.
      };
      // Streaming avoids loading the whole CRM into memory. On error the next run
      // resumes by comparing durable receipts, including edits to old customers.
      for await (const customer of Customer.find({}).select('_id name phone address email type').sort({ _id: 1 }).lean().cursor()) {
        await sync(`customer:${customer._id}`, [{ table: 'customers', values: customerRow(customer) }]);
      }
      for await (const doc of StockIssue.find({}).sort({ _id: 1 }).lean().cursor()) {
        const issue = issueRows({ ...doc.data, _id: String(doc._id), number: doc.number, requestId: doc.requestId, createdAt: doc.createdAt });
        await sync(`issue:${doc._id}`, [{ table: 'issues', values: issue.header }, ...issue.lines.map(values => ({ table: 'lines' as const, values }))]);
      }
      const now = new Date();
      await Lease.updateOne({ _id: destination, owner }, { $set: { lastSuccess: now, lastError: '' } });
      status = { enabled: true, state: 'ok', message: 'Đã đồng bộ sang Google Sheets. Bấm Sync trong AppSheet để tải dữ liệu mới.', lastSuccess: now.toISOString() };
    } catch (error) {
      // Do not expose SDK errors, tokens, keys, database URIs or raw Google bodies.
      const message = error instanceof Error && /^(Google|Chưa|Không tìm|Bảng |Thiếu bảng|Dòng |Khóa |Đã |Dòng đồng bộ)/.test(error.message)
        ? error.message : 'Chưa đồng bộ được. Dữ liệu vẫn được giữ trong backend; hệ thống sẽ thử lại.';
      status = { ...status, state: 'error', message };
      if (acquired) await Lease.updateOne({ _id: destination, owner }, { $set: { lastError: message } }).catch(() => {});
    } finally {
      if (acquired) await Lease.updateOne({ _id: destination, owner }, { $set: { expiresAt: new Date(0) } }).catch(() => {});
      busy = false;
    }
  };
  // Retry failures automatically; printing and saving never wait for Google.
  const timer = setInterval(() => { void tick(); }, 60000);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
