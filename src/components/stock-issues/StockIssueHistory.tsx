import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, FileText, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { money, stockIssueAmounts, type SavedStockIssue } from '../../lib/stockIssue';
import { issueDayLabel, type StockIssueDay } from '../../lib/stockIssueHistory';

type OpenIssue = (issue: SavedStockIssue) => void;
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Chưa tải được phiếu. Vui lòng thử lại.';

function DayIssues({ day, query, onOpen }: { day: StockIssueDay; query: string; onOpen: OpenIssue }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedStockIssue[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError('');
    api.get(`/api/stock-issues/day?date=${day.date}&q=${encodeURIComponent(query)}&offset=${offset}`)
      .then((result: { items: SavedStockIssue[]; hasMore: boolean }) => {
        if (!active) return;
        setItems(previous => offset === 0 ? result.items : [...previous.filter(item => !result.items.some(next => next._id === item._id)), ...result.items]);
        setHasMore(result.hasMore); setLoaded(true);
      })
      .catch(error => { if (active) setError(errorText(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, day.date, query, offset, retry]);

  return <details className="issue-day" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>
      <span className="issue-day-icon"><CalendarDays size={22} /></span>
      <span className="issue-day-title"><strong>{issueDayLabel(day.date)}</strong><small>Bấm để xem danh sách phiếu xuất</small></span>
      <span className="issue-day-count">{day.count} phiếu xuất</span>
      <ChevronDown size={20} className="issue-day-chevron" />
    </summary>
    <div className="issue-day-content">
      <div className="issue-history issue-saved-list">{items.map(record => <button type="button" key={record._id} onClick={() => onOpen(record)}>
        <span className="issue-saved-name"><strong>{record.recipient}</strong><small>{record.number} · {record.warehouseName}</small></span>
        <span className="issue-saved-amount"><strong>{money(stockIssueAmounts(record).total)} đ</strong><small>Xem phiếu / In lại →</small></span>
      </button>)}</div>
      {loading && <p role="status" className="issue-hint">Đang tải phiếu…</p>}
      {error && <div role="alert" className="issue-error">{error}<button type="button" className="issue-button secondary" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>}
      {loaded && !loading && !error && items.length === 0 && <p className="issue-empty">Chưa có phiếu phù hợp trong ngày này.</p>}
      {hasMore && !error && <button type="button" className="issue-button secondary issue-history-more" disabled={loading} onClick={() => setOffset(items.length)}>Xem thêm phiếu trong ngày</button>}
    </div>
  </details>;
}

function HistoryDays({ query, onOpen }: { query: string; onOpen: OpenIssue }) {
  const [days, setDays] = useState<StockIssueDay[]>([]);
  const [before, setBefore] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get(`/api/stock-issues/days?q=${encodeURIComponent(query)}${before ? `&before=${before}` : ''}`)
      .then((result: { days: StockIssueDay[]; hasMore: boolean }) => {
        if (!active) return;
        setDays(previous => before ? [...previous.filter(day => !result.days.some(next => next.date === day.date)), ...result.days] : result.days);
        setHasMore(result.hasMore);
      })
      .catch(error => { if (active) setError(errorText(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, before, retry]);

  return <>
    <div className="issue-day-list">{days.map(day => <DayIssues key={day.date} day={day} query={query} onOpen={onOpen} />)}</div>
    {loading && <p role="status" className="issue-hint">Đang tải danh sách ngày…</p>}
    {error && <div role="alert" className="issue-error">{error}<button type="button" className="issue-button secondary" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>}
    {!loading && !error && days.length === 0 && <div className="issue-empty"><FileText size={30} /><strong>{query ? 'Không tìm thấy phiếu phù hợp' : 'Chưa có phiếu đã lưu từ tháng 9/2026'}</strong><small>{query ? 'Thử tìm bằng số phiếu, tên khách hoặc số điện thoại khác.' : 'Phiếu lưu xong sẽ được xếp vào đúng ngày xuất.'}</small></div>}
    {hasMore && !error && <button type="button" className="issue-button secondary issue-history-more" disabled={loading} onClick={() => setBefore(days[days.length - 1].date)}>Xem thêm ngày trước</button>}
  </>;
}

export function StockIssueHistory({ onOpen }: { onOpen: OpenIssue }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [revision, setRevision] = useState(0);
  return <section className="issue-card issue-history-card">
    <div className="issue-history-heading"><span className="issue-archive-icon"><FileText size={26} /></span><div><h2>Phiếu đã lưu</h2><p>Từ tháng 9/2026 · Xếp theo ngày xuất, mới nhất trước</p></div></div>
    <form className="issue-search-row" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setRevision(value => value + 1); }}>
      <div className="issue-search"><Search size={19} /><input aria-label="Tìm phiếu đã lưu" placeholder="Tìm số phiếu, tên khách hoặc số điện thoại…" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <button className="issue-button primary" type="submit">Tìm phiếu</button>
      {query && <button className="issue-button secondary" type="button" onClick={() => { setSearch(''); setQuery(''); setRevision(value => value + 1); }}>Xem tất cả</button>}
    </form>
    {query && <p className="issue-history-search-note" role="status">Kết quả cho “{query}” · Số phiếu mỗi ngày là số phiếu khớp tìm kiếm.</p>}
    <HistoryDays key={`${query}:${revision}`} query={query} onOpen={onOpen} />
  </section>;
}
