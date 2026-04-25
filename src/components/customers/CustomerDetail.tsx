import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit2, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Plus, 
  Tag, 
  Clock, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Heart,
  Inbox
} from 'lucide-react';
import { Customer } from '../../types';
import { cn } from '../../lib/utils';

interface CustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onUpdate: (customer: Customer) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onBack, onUpdate }) => {
  const [isWholesale, setIsWholesale] = useState(customer.type === 'wholesale');

  // Sync local state when customer prop changes
  React.useEffect(() => {
    setIsWholesale(customer.type === 'wholesale');
  }, [customer.type]);

  const toggleWholesale = () => {
    const newType = !isWholesale ? 'wholesale' : 'retail';
    setIsWholesale(!isWholesale);
    onUpdate({
      ...customer,
      type: newType
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Chi tiết khách hàng</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                {customer.avatar ? (
                  <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
                  <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{customer.phone}</span>
                    <button className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>-</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>-</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Trạng thái khách hàng</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Giá trị đơn hàng trung bình</span>
                    <span className="font-medium text-slate-700">0 đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Đã đặt:</span>
                    <span className="font-medium text-slate-700">{customer.ordersCount} đơn hàng</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Số tiền đã chi:</span>
                    <span className="font-medium text-slate-700">{customer.totalSpent.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Điểm tích lũy:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{customer.remainingPoints} điểm</span>
                      <button className="text-blue-600 hover:underline">Chi tiết</button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cài đặt điểm:</span>
                    <button className="text-blue-600 hover:underline">Cài đặt</button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Cập nhật khách sỉ:</span>
                <button 
                  onClick={toggleWholesale}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-200 outline-none",
                    isWholesale ? "bg-blue-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm",
                    isWholesale ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">Tags (0)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
                  <Plus className="w-3 h-3" /> Gán tag
                </button>
                <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
                  <Plus className="w-3 h-3" /> Tạo tag
                </button>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs text-slate-400 italic">Chưa có tag nào</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Ghi chú</h3>
            </div>
            <div className="p-4">
              <textarea 
                placeholder="Viết ghi chú ở đây"
                className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Đơn hàng (0)</h3>
            </div>
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Trống</p>
            </div>
          </div>

          {/* Viewed Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Sản phẩm đã xem</h3>
            </div>
            <div className="p-8">
              <p className="text-xs text-slate-400 italic">Chưa có sản phẩm nào</p>
            </div>
          </div>

          {/* Referred Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Người dùng đã giới thiệu</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">Tên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ngày sinh</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">SĐT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="py-12">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Inbox className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">Trống</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Favorite Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Sản phẩm yêu thích</h3>
            </div>
            <div className="p-8">
              <p className="text-xs text-slate-400 italic">Chưa có sản phẩm nào</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
