import React, { useState, useEffect } from 'react';
import { 
  TicketPercent, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Tag,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NumberInput } from '../ui/NumberInput';

interface Voucher {
  _id?: string;
  code: string;
  description: string;
  type: 'fixed' | 'percentage';
  discountAmount?: number;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'fixed' | 'percentage'>('fixed');
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: '',
    description: '',
    type: 'fixed',
    discountAmount: 0,
    discountPercentage: 0,
    maxDiscountAmount: 0,
    minOrderValue: 0,
    usageLimit: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers');
      const data = await res.json();
      setVouchers(data);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVoucher ? `/api/vouchers/${editingVoucher._id}` : '/api/vouchers';
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingVoucher(null);
        setFormData({
          code: '',
          description: '',
          discountAmount: 0,
          minOrderValue: 0,
          usageLimit: 100,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true
        });
        fetchVouchers();
      } else {
        const error = await res.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVouchers();
    } catch (err) {
      alert('Lỗi khi xóa voucher');
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.type === activeTypeTab && (
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getStatus = (v: Voucher) => {
    const now = new Date();
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);

    if (!v.isActive) return { label: 'Tạm dừng', color: 'bg-slate-100 text-slate-600', icon: XCircle };
    if (now < start) return { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-600', icon: Clock };
    if (now > end) return { label: 'Hết hạn', color: 'bg-red-50 text-red-600', icon: AlertCircle };
    if (v.usedCount >= v.usageLimit) return { label: 'Hết lượt', color: 'bg-amber-50 text-amber-600', icon: AlertCircle };
    return { label: 'Đang chạy', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 };
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Khuyến mãi</span>
            <span>/</span>
            <span className="text-slate-600">Mã giảm giá</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Khuyến mãi</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchVouchers}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
            title="Làm mới"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setEditingVoucher(null);
              setFormData({
                code: '',
                description: '',
                type: activeTypeTab,
                discountAmount: 0,
                discountPercentage: 0,
                maxDiscountAmount: 0,
                minOrderValue: 0,
                usageLimit: 100,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                isActive: true
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
          >
            <Plus className="w-4 h-4" />
            Thêm mã mới
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Filters & Tabs Row */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTypeTab('fixed')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTypeTab === 'fixed' ? "bg-emerald-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Tiền mặt
            </button>
            <button
              onClick={() => setActiveTypeTab('percentage')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTypeTab === 'percentage' ? "bg-emerald-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Phần trăm (%)
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm mã hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Voucher List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Voucher</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giảm giá</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Điều kiện</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sử dụng</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Không tìm thấy mã giảm giá nào</td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const status = getStatus(v);
                  return (
                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-900 text-sm tracking-wider uppercase">{v.code}</span>
                          <span className="text-10 text-slate-400 mt-0.5 line-clamp-1">{v.description}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700 text-sm">
                          {v.type === 'fixed' 
                            ? `${(v.discountAmount || 0).toLocaleString()}đ` 
                            : `${v.discountPercentage}% (Tối đa ${(v.maxDiscountAmount || 0).toLocaleString()}đ)`
                          }
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-500">
                          Đơn từ: <span className="font-bold text-slate-700">{v.minOrderValue.toLocaleString()}đ</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 transition-all" 
                              style={{ width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }}
                            />
                          </div>
                          <span className="text-10 text-slate-400 font-medium">
                            {v.usedCount}/{v.usageLimit} lượt
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-10 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(v.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-10 text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-9 font-bold uppercase tracking-wider border",
                          status.color.replace('bg-', 'bg-').replace('text-', 'text-').replace('bg-emerald-50', 'bg-emerald-50 border-emerald-100').replace('bg-blue-50', 'bg-blue-50 border-blue-100').replace('bg-red-50', 'bg-red-50 border-red-100').replace('bg-amber-50', 'bg-amber-50 border-amber-100').replace('bg-slate-100', 'bg-slate-50 border-slate-200')
                        )}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingVoucher(v);
                              setFormData({
                                ...v,
                                startDate: new Date(v.startDate).toISOString().split('T')[0],
                                endDate: new Date(v.endDate).toISOString().split('T')[0]
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg border border-transparent hover:border-emerald-100 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => v._id && handleDelete(v._id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingVoucher ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
                {editingVoucher ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'fixed'})}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      formData.type === 'fixed' ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500"
                    )}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'percentage'})}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      formData.type === 'percentage' ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500"
                    )}
                  >
                    Phần trăm (%)
                  </button>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Mã Voucher</label>
                  <input 
                    type="text"
                    required
                    placeholder="VD: SAMNGOCLINH50"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-black uppercase tracking-widest"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Mô tả</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                    placeholder="Nhập mô tả cho chương trình khuyến mãi..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {formData.type === 'fixed' ? (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Số tiền giảm (đ)</label>
                    <NumberInput 
                      required
                      value={formData.discountAmount || 0}
                      onChange={val => setFormData({...formData, discountAmount: val})}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Phần trăm giảm (%)</label>
                      <NumberInput 
                        required
                        value={formData.discountPercentage || 0}
                        onChange={val => setFormData({...formData, discountPercentage: val})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Giảm tối đa (đ)</label>
                      <NumberInput 
                        required
                        value={formData.maxDiscountAmount || 0}
                        onChange={val => setFormData({...formData, maxDiscountAmount: val})}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Đơn tối thiểu (đ)</label>
                  <NumberInput 
                    required
                    value={formData.minOrderValue || 0}
                    onChange={val => setFormData({...formData, minOrderValue: val})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Ngày bắt đầu</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Ngày kết thúc</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-11 font-bold text-slate-500 uppercase tracking-wider">Giới hạn sử dụng</label>
                  <NumberInput 
                    required
                    value={formData.usageLimit || 0}
                    onChange={val => setFormData({...formData, usageLimit: val})}
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">Kích hoạt mã</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  {editingVoucher ? 'Lưu thay đổi' : 'Tạo Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
