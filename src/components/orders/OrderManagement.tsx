import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Settings, 
  Plus, 
  LayoutDashboard, 
  FileSpreadsheet,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Check,
  Download,
  Trash2,
  CreditCard
} from 'lucide-react';
import { Order } from '../../types';
import { cn } from '../../lib/utils';
import { 
  format, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  isValid
} from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface OrderManagementProps {
  orders: Order[];
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  loading,
  activeTab,
  setActiveTab,
  onSelectOrder,
  searchQuery,
  setSearchQuery,
  onRefresh,
  onDeleteOrder
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [exportStatuses, setExportStatuses] = useState<string[]>([]);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    createdAt: true,
    orderId: true,
    customer: true,
    total: true,
    paymentMethod: true,
    shippingUnit: true,
    store: true,
    status: true,
    paymentStatus: true,
    platform: true,
  });

  const settingsRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      createdAt: true,
      orderId: true,
      customer: true,
      total: true,
      paymentMethod: true,
      shippingUnit: true,
      store: true,
      status: true,
      paymentStatus: true,
      platform: true,
    });
  };

  const allColumnsSelected = Object.values(visibleColumns).every(v => v);

  const toggleAllColumns = () => {
    const newState = !allColumnsSelected;
    const next: Record<string, boolean> = {};
    Object.keys(visibleColumns).forEach(k => next[k] = newState);
    setVisibleColumns(next);
  };

  const columnLabels: Record<string, string> = {
    createdAt: 'Ngày tạo',
    orderId: 'Đơn hàng',
    customer: 'Khách hàng',
    total: 'Tổng tiền',
    paymentMethod: 'Hình thức thanh toán',
    shippingUnit: 'Đơn vị vận chuyển',
    store: 'Cửa hàng',
    status: 'Trạng thái đơn hàng',
    paymentStatus: 'Trạng thái thanh toán',
    platform: 'Nền tảng',
  };

  const datePresets = [
    { id: 'today', label: 'Hôm nay', getValue: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { id: 'yesterday', label: 'Hôm qua', getValue: () => ({ start: format(subDays(new Date(), 1), 'yyyy-MM-dd'), end: format(subDays(new Date(), 1), 'yyyy-MM-dd') }) },
    { id: 'this_week', label: 'Tuần này', getValue: () => ({ start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
    { id: 'last_7_days', label: '7 ngày qua', getValue: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { id: 'this_month', label: 'Tháng này', getValue: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
    { id: 'last_month', label: 'Tháng trước', getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
    }},
    { id: 'last_6_months', label: '6 tháng qua', getValue: () => ({ start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { id: 'last_year', label: '1 năm', getValue: () => ({ start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'Tất cả' || 
                      (activeTab === 'Chờ xác nhận' ? order.status?.includes('Chờ xác nhận') : order.status === activeTab);
    
    let matchesDate = true;
    try {
      let start: Date | null = null;
      let end: Date | null = null;

      if (selectedPreset) {
        const preset = datePresets.find(p => p.id === selectedPreset);
        if (preset) {
          const range = preset.getValue();
          start = startOfDay(parseISO(range.start));
          end = endOfDay(parseISO(range.end));
        }
      } else if (dateRange.start || dateRange.end) {
        if (dateRange.start) start = startOfDay(parseISO(dateRange.start));
        if (dateRange.end) end = endOfDay(parseISO(dateRange.end));
      }

      if (start || end) {
        const orderDate = parseISO(order.createdAt);
        if (isValid(orderDate)) {
          if (start && end) {
            matchesDate = isWithinInterval(orderDate, { start, end });
          } else if (start) {
            matchesDate = orderDate >= start;
          } else if (end) {
            matchesDate = orderDate <= end;
          }
        }
      }
    } catch (e) {
      console.error("Date filtering error:", e);
      matchesDate = true;
    }

    const matchesSearch = !searchQuery || 
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    
    return matchesTab && matchesDate && matchesSearch;
  });

  const getDateDisplay = () => {
    if (selectedPreset) {
      return datePresets.find(p => p.id === selectedPreset)?.label;
    }
    if (dateRange.start && dateRange.end) {
      return `${format(new Date(dateRange.start), 'dd/MM/yyyy')} - ${format(new Date(dateRange.end), 'dd/MM/yyyy')}`;
    }
    if (dateRange.start) {
      return `Từ ${format(new Date(dateRange.start), 'dd/MM/yyyy')}`;
    }
    if (dateRange.end) {
      return `Đến ${format(new Date(dateRange.end), 'dd/MM/yyyy')}`;
    }
    return 'Chọn thời gian';
  };

  const exportToExcel = (data: Order[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(order => ({
      'Mã đơn hàng': order.orderId,
      'Khách hàng': order.customerName,
      'Tổng tiền': order.total,
      'Trạng thái': order.status,
      'Ngày tạo': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
      'SĐT': order.customerPhone || '',
      'Địa chỉ': '' // Address is not in the Order type
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleExportFiltered = () => {
    let dataToExport = filteredOrders;
    if (exportStatuses.length > 0) {
      dataToExport = dataToExport.filter(o => exportStatuses.includes(o.status));
    }
    exportToExcel(dataToExport, `Don_hang_loc_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    setShowExportModal(false);
  };

  const handleExportAll = () => {
    exportToExcel(orders, `Tat_ca_don_hang_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    setShowExportModal(false);
  };

  const toggleExportStatus = (status: string) => {
    setExportStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const tabs = [
    { label: 'Tất cả', count: orders.length },
    { label: 'Chờ xác nhận', count: orders.filter(o => o.status?.includes('Chờ xác nhận')).length },
    { label: 'Đang chuẩn bị', count: orders.filter(o => o.status === 'Đang chuẩn bị').length },
    { label: 'Đang giao', count: orders.filter(o => o.status === 'Đang giao').length },
    { label: 'Hoàn thành', count: orders.filter(o => o.status === 'Hoàn thành').length },
    { label: 'Đã hủy', count: orders.filter(o => o.status === 'Đã hủy').length },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Đơn hàng</span>
            <span>/</span>
            <span className="text-slate-600">Danh sách đơn hàng</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Danh sách đơn hàng</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all shadow-sm",
                selectedPreset || dateRange.start ? "border-emerald-500 text-emerald-700 ring-1 ring-emerald-500/10" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{getDateDisplay()}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showDatePicker && "rotate-180")} />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-[480px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex h-[320px]">
                  {/* Presets */}
                  <div className="w-40 border-r border-slate-100 p-2 bg-slate-50/50">
                    {datePresets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          setDateRange({ start: '', end: '' });
                          setShowDatePicker(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-1",
                          selectedPreset === preset.id 
                            ? "bg-blue-500 text-white" 
                            : "text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Range */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-800">Tùy chọn ngày</h3>
                      <button 
                        onClick={() => {
                          setSelectedPreset(null);
                          setDateRange({ start: '', end: '' });
                        }}
                        className="text-xs text-emerald-700 hover:underline"
                      >
                        Xóa lọc
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-10 uppercase tracking-wider font-bold text-slate-400">Từ ngày</label>
                        <input 
                          type="date" 
                          value={dateRange.start}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                            setSelectedPreset(null);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-10 uppercase tracking-wider font-bold text-slate-400">Đến ngày</label>
                        <input 
                          type="date" 
                          value={dateRange.end}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                            setSelectedPreset(null);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-11 text-emerald-800 leading-relaxed">
                        <span className="font-bold">Mẹo:</span> Chọn khoảng thời gian để xem báo cáo chi tiết theo từng giai đoạn kinh doanh.
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => setShowDatePicker(false)}
                        className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/20"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Xuất file Excel</h2>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Trạng thái thanh toán</span>
                  <span className="text-sm font-bold text-slate-800">Tất cả trạng thái</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-3">Trạng thái đơn hàng <span className="text-xs font-normal text-slate-400">(Mặc định tất cả)</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành', 'Đã hủy'].map((status) => (
                      <label key={status} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-white cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          checked={exportStatuses.includes(status)}
                          onChange={() => toggleExportStatus(status)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded border",
                          status === 'Chờ xác nhận' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                          status === 'Đang chuẩn bị' ? "bg-purple-50 text-purple-600 border-purple-100" :
                          status === 'Đang giao' ? "bg-orange-50 text-orange-600 border-orange-100" :
                          status === 'Hoàn thành' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                  <span className="text-sm font-medium text-slate-500">Khoảng thời gian</span>
                  <span className="text-sm font-medium text-slate-600">
                    {dateRange.start ? `${format(parseISO(dateRange.start), 'dd/MM/yyyy')} - ${format(parseISO(dateRange.end), 'dd/MM/yyyy')}` : 'Tất cả thời gian'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Số lượng đơn hàng</span>
                  <span className="text-sm font-bold text-slate-800">
                    {exportStatuses.length > 0 
                      ? filteredOrders.filter(o => exportStatuses.includes(o.status)).length 
                      : filteredOrders.length} đơn hàng
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handleExportAll}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Xuất tất cả đơn hàng
              </button>
              <button 
                onClick={handleExportFiltered}
                className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Xuất theo bộ lọc hiện tại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-2 px-4 gap-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 order-2 sm:order-1">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.label)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.label 
                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" 
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 order-1 sm:order-2 self-end sm:self-auto">
            <button 
              onClick={onRefresh}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" 
              title="Làm mới"
            >
              <RotateCcw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors",
                  showSettings && "bg-slate-100 text-emerald-600"
                )} 
                title="Cài đặt hiển thị"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={allColumnsSelected}
                        onChange={toggleAllColumns}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Cột hiển thị</span>
                    </div>
                    <button 
                      onClick={resetColumns}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Làm lại
                    </button>
                  </div>
                  <div className="p-2 max-h-[400px] overflow-y-auto">
                    {Object.entries(columnLabels).map(([key, label]) => (
                      <label 
                        key={key} 
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity">
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                              <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={visibleColumns[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-y border-slate-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                {visibleColumns.createdAt && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>}
                {visibleColumns.orderId && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn hàng</th>}
                {visibleColumns.customer && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</th>}
                {visibleColumns.total && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tiền</th>}
                {visibleColumns.paymentMethod && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Phương thức TT</th>}
                {visibleColumns.paymentStatus && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Thanh toán</th>}
                {visibleColumns.status && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái đơn</th>}
                {visibleColumns.platform && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nền tảng</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">Không có đơn hàng nào trong mục này</td>
                </tr>
              ) : filteredOrders.map((order, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectOrder(order)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSelectOrder(order)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                        title="Xử lý đơn hàng"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteOrder?.(order._id)}
                        className="p-1 hover:bg-red-50 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                  </td>
                  {visibleColumns.createdAt && (
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                  )}
                  {visibleColumns.orderId && (
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-700">{order.orderId || `#${order._id?.slice(-6)}`}</span>
                    </td>
                  )}
                  {visibleColumns.customer && (
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          <img 
                            src={order.customerAvatar || `https://i.pravatar.cc/100?u=${order.customerPhone}`} 
                            alt="Customer" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700">{order.customerName}</div>
                          <div className="text-xs text-slate-400">{order.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.total && (
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-slate-700">{order.total?.toLocaleString()}đ</span>
                    </td>
                  )}
                  {visibleColumns.paymentMethod && (
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {order.paymentMethod?.toLowerCase() === 'cod' ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                            <CreditCard className="w-3 h-3" />
                            COD
                          </div>
                        ) : order.paymentMethod?.toLowerCase() === 'qr' ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-[11px] font-bold">
                            <Search className="w-3 h-3" />
                            Mã QR
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded text-[11px] font-bold">
                            <Check className="w-3 h-3" />
                            Ví ZaloPay
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.paymentStatus && (
                    <td className="px-4 py-4 text-center">
                       <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        order.paymentStatus === 'Chưa thanh toán' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                      )}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-4 py-4">
                      <span className={cn(
                        "text-[11px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider",
                        order.status?.includes('Chờ xác nhận') ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        order.status?.includes('Đã thanh toán') ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        order.status === 'Đang chuẩn bị' ? "bg-blue-50 text-blue-600 border-blue-200" :
                        order.status === 'Đang giao' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                        order.status === 'Hoàn thành' ? "bg-emerald-600 text-white border-emerald-700" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {order.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.platform && (
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{order.platform}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">1-{filteredOrders.length} trên {filteredOrders.length} mặt hàng</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-200 bg-white text-blue-600 text-sm font-medium">1</button>
            </div>
            <select className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>10 / trang</option>
              <option>20 / trang</option>
              <option>50 / trang</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
