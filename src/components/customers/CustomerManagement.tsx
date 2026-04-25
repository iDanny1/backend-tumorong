import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Upload, 
  Plus, 
  RotateCcw, 
  BarChart3, 
  Settings,
  MessageCircle,
  User
} from 'lucide-react';
import { Customer } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface CustomerManagementProps {
  customers: Customer[];
  initialTab?: 'all' | 'wholesale';
  onSelectCustomer: (customer: Customer) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ 
  customers,
  initialTab = 'all',
  onSelectCustomer,
  searchQuery,
  setSearchQuery
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'wholesale'>(initialTab);

  // Update activeTab if initialTab changes (from sidebar)
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredCustomers = customers.filter(customer => {
    const matchesTab = activeTab === 'all' || customer.type === 'wholesale';
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         customer.phone.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          {/* Search is now handled by the global header */}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span className="whitespace-nowrap">Xuất file Excel</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span className="whitespace-nowrap">Nhập file Excel</span>
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10">
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Thêm khách hàng</span>
          </button>
          <div className="flex items-center gap-1 ml-auto lg:ml-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <BarChart3 className="w-5 h-5 rotate-90" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 p-4 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'all' 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Tất cả khách hàng ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('wholesale')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'wholesale' 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Khách mua sỉ ({customers.filter(c => c.type === 'wholesale').length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-y border-slate-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Liên hệ</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Số đơn đã đặt</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Số tiền đã chi</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Điểm làm nhiệm vụ còn lại</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Tổng điểm làm nhiệm vụ đã có</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thẻ tags</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lần cuối truy cập</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người giới thiệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectCustomer(customer)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                        {customer.avatar ? (
                          <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 hover:bg-emerald-50 rounded-full text-emerald-700 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-slate-700">{customer.ordersCount} đã đặt</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-slate-700">{customer.totalSpent.toLocaleString()}đ</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-slate-700">{customer.remainingPoints}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-slate-700">{customer.totalPoints}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-10 text-slate-400 italic">Chưa có tag</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-slate-600 font-medium">
                      {format(new Date(customer.createdAt), 'HH:mm:ss')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(new Date(customer.createdAt), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-slate-600 font-medium">
                      {format(new Date(customer.lastAccess), 'HH:mm:ss')} {format(new Date(customer.lastAccess), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-slate-400">-</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
