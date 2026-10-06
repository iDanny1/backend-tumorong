import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StockIssueManagement } from '../src/components/stock-issues/StockIssueManagement';
import type { Product, Customer } from '../src/types';
import { CustomerManagement } from '../src/components/customers/CustomerManagement';
import { CustomerDetail } from '../src/components/customers/CustomerDetail';
import { api } from '../src/lib/api';
import { demoCustomer, demoProducts as products } from './stockIssueDemoData';
import '../src/index.css';

function Demo() {
  const [customers, setCustomers] = useState<Customer[]>([demoCustomer]);
  const [view, setView] = useState<'issues' | 'customers'>('issues');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  useEffect(() => { api.get('/api/customers').then(setCustomers); }, []);
  return <>
  <div style={{ background: '#fef3c7', color: '#78350f', padding: '10px 20px', textAlign: 'center', fontSize: 14 }}>BẢN CHẠY THỬ · Dữ liệu mẫu · Phiếu lưu tạm đến khi tắt bản thử · Không tác động dữ liệu đang dùng</div>
  <nav className="flex gap-3 px-5 py-4 border-b bg-white" aria-label="Chạy thử CRM">
    <button onClick={() => setView('issues')} className={`px-4 py-2 rounded-lg ${view === 'issues' ? 'bg-emerald-800 text-white' : 'bg-slate-100'}`}>Bán tại cửa hàng</button>
    <button onClick={() => setView('customers')} className={`px-4 py-2 rounded-lg ${view === 'customers' ? 'bg-emerald-800 text-white' : 'bg-slate-100'}`}>Khách hàng</button>
  </nav>
  <main style={{ padding: '16px 20px' }}>{view === 'issues' ? <StockIssueManagement products={products} customers={customers} user={{ username: 'stock-issue-demo', name: '', role: 'admin', avatar: '' }} /> : selected ? <CustomerDetail customer={selected} onBack={() => setSelected(null)} onUpdate={updated => { setCustomers(values => values.map(value => value._id === updated._id ? updated : value)); setSelected(updated); }} /> : <CustomerManagement customers={customers} searchQuery={search} setSearchQuery={setSearch} onSelectCustomer={setSelected} />}</main>
</>;
}
createRoot(document.getElementById('root')!).render(<Demo />);
