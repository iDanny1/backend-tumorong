import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { stockChecker, stockCountDay, stockCountZone, stockReportCc, stockReportRecipients, stockReportSender, stockReportTime, type StockCountRecord } from '../../lib/stockCount';

const clock = new Intl.DateTimeFormat('vi-VN', {
  timeZone: stockCountZone, hour: '2-digit', minute: '2-digit', second: '2-digit',
});

export function StockCountHistory({ onRecount }: { onRecount: (row: StockCountRecord) => void }) {
  const [day, setDay] = useState(() => stockCountDay());
  const [rows, setRows] = useState<StockCountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [sending, setSending] = useState(false);
  const [mailMessage, setMailMessage] = useState('');

  async function send() {
    if (!rows.length || sending) return;
    setSending(true);
    setMailMessage('');
    try {
      const { results } = await api.post('/api/stock-counts/report/email', { day, count: rows.length, latestId: rows[0]._id });
      const labels = { sent: 'Đã gửi', failed: 'Gửi thất bại, có thể thử lại', sending: 'Đã yêu cầu gửi, đang chờ xác nhận', unknown: 'Chưa xác định, cần đối chiếu hộp thư' };
      setMailMessage(results.map((r: { recipient: string; status: keyof typeof labels }) => r.recipient + ' — ' + labels[r.status]).join('\n'));
    } catch (err) {
      setMailMessage(err instanceof Error ? err.message : 'Chưa gửi được báo cáo.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    if (day) api.get('/api/stock-counts?day=' + encodeURIComponent(day)).then(data => {
      if (current) setRows(data);
    }).catch(err => {
      if (current) setError(err.message);
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [day, refresh]);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold">Ngày kiểm kê
        <input type="date" value={day} disabled={sending} max={stockCountDay()} onChange={e => { setLoading(true); setMailMessage(''); setDay(e.target.value); }}
          className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button type="button" disabled={sending} className="rounded-lg border px-3 py-2 text-sm" onClick={() => { setMailMessage(''); setRefresh(n => n + 1); }}>Tải lại</button>
      {day && <a className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"
        href={'/api/stock-counts/report?day=' + encodeURIComponent(day)} download>Xuất báo cáo Excel</a>}
    </div>
    {!day ? <p>Chọn ngày để xem các lượt kiểm.</p> : loading ? <p>Đang tải lịch sử…</p> : error ? <p role="alert">{error}</p> :
      rows.length === 0 ? <p>Chưa có lượt kiểm trong ngày này.</p> : <>
        <div className="space-y-2 rounded-lg border border-emerald-200 p-3">
          <p className="font-semibold">Gửi báo cáo tất cả kho ngày {day.split('-').reverse().join('/')}</p>
          <p className="text-sm">Từ: {stockReportSender}</p>
          <p className="text-sm">Đến: {stockReportRecipients.join(', ')}</p>
          <p className="text-sm">CC: {stockReportCc.join(', ')}</p>
          <p className="text-sm">Giờ kiểm gần nhất: {stockReportTime(rows[0].createdAt)}</p>
          <p className="text-sm">Người kiểm kê: {[...new Set(rows.map(stockChecker))].join(', ')}</p>
          <button type="button" disabled={sending} onClick={send}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {sending ? 'Đang gửi…' : 'Gửi báo cáo qua email'}
          </button>
          {mailMessage && <p role="status" className="whitespace-pre-line text-sm">{mailMessage}</p>}
        </div>
        <p className="text-sm text-slate-600">{rows.length} lượt kiểm · Mới nhất ở trên</p>
        <ul className="divide-y divide-slate-200">
          {rows.map(row => <li key={row._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 break-words">
              <p className="font-semibold">{row.productName} {row.sku && <small className="text-slate-500">{row.sku}</small>}</p>
              <p><strong>{row.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 16 })} {row.unit}</strong> · {row.packaging}</p>
              <p className="text-sm text-slate-600">{row.warehouseName} · {stockChecker(row)} · {clock.format(new Date(row.createdAt))}</p>
            </div>
            <button type="button" className="rounded-lg border px-3 py-2 text-sm font-semibold text-emerald-800" onClick={() => onRecount(row)}>Kiểm lại</button>
          </li>)}
        </ul>
      </>}
  </section>;
}
