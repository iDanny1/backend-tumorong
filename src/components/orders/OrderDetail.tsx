import React, { useState } from 'react';
import { 
  ArrowLeft,
  ChevronLeft, 
  Copy, 
  ExternalLink, 
  User, 
  Store, 
  AlertTriangle, 
  Check, 
  Phone, 
  MapPin, 
  Truck, 
  CreditCard, 
  Package,
  ChevronRight,
  ChevronDown,
  Trash2,
  Bell
} from 'lucide-react';
import { Order } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onUpdate: (orderId: string, updates: Partial<Order>) => void;
  onDelete?: (orderId: string) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack, onUpdate, onDelete }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'Chưa thanh toán');
  const [note, setNote] = useState('');

  const handleUpdate = () => {
    onUpdate(order._id, { 
      status: currentStatus, 
      paymentStatus: paymentStatus 
    });
  };

  const statuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
  const pStatusOptions = ['Chưa thanh toán', 'Đã thanh toán', 'Đã hoàn tiền'];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Trở về danh sách
          </button>
          
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <span className="hover:text-blue-600 cursor-pointer">Đơn hàng</span>
            <span className="text-slate-300">/</span>
            <span className="hover:text-blue-600 cursor-pointer font-bold text-slate-900">Chi tiết đơn #{order.orderId || order._id?.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
            order.status?.includes('Chờ xác nhận') ? "bg-amber-50 text-amber-600 border-amber-200" : 
            order.status?.includes('Đã thanh toán') ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            "bg-blue-50 text-blue-600 border-blue-200"
          )}>
            {order.status}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Tạo ngày: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-20">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <h1 className="text-sm font-bold text-slate-800">
                Đơn hàng: <span className="text-blue-600 uppercase tracking-wide">{order.orderId || order._id?.slice(-8).toUpperCase()}</span>
                <button className="ml-2 p-1 hover:bg-slate-100 rounded">
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </h1>
              <button className="text-[13px] font-medium text-blue-600 hover:underline flex items-center gap-1.5">
                Chỉnh sửa đơn hàng <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-left w-1/2">Sản phẩm</th>
                    <th className="px-6 py-4 font-bold text-center">Số lượng</th>
                    <th className="px-6 py-4 font-bold text-right">Giá tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.products?.map((item, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-slate-50 rounded border border-slate-100 overflow-hidden shrink-0">
                            <img 
                              src={order.customerAvatar || `https://picsum.photos/seed/${item.name}/200/200`} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-blue-600 hover:underline cursor-pointer leading-tight mb-1">{item.name}</p>
                            <p className="text-xs font-bold text-slate-700">{item.price?.toLocaleString()}đ</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-slate-700 font-medium">1</td>
                      <td className="px-6 py-5 text-right text-slate-800 font-medium">{item.price?.toLocaleString()}đ</td>
                    </tr>
                  ))}
                  {/* Empty rows fallback match image style */}
                  <tr className="h-20"><td colSpan={3}></td></tr>
                </tbody>
              </table>

              <div className="px-6 py-6 border-t border-slate-100 space-y-2 bg-slate-50/10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Thanh toán ({order.paymentMethod || 'COD'})</span>
                  <span className="font-medium text-slate-800">{(order.totalAmount || order.total)?.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Tổng tiền</span>
                  <span className="font-bold text-slate-800">{(order.totalAmount || order.total)?.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-900 font-black">Tổng</span>
                  <span className="font-black text-slate-900">{(order.totalAmount || order.total)?.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Thông tin giao hàng</h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1">
                <label className="block text-[13px] font-black text-slate-800 mb-2">Người nhận</label>
                <p className="text-sm text-slate-600">{order.customerName || order.customer?.name}</p>
              </div>

              <div className="grid grid-cols-1">
                <label className="block text-[13px] font-black text-slate-800 mb-2 border-t border-slate-100 pt-8 mt-4">Số điện thoại</label>
                <p className="text-sm text-slate-600">{order.customerPhone || order.customer?.phone}</p>
              </div>

              <div className="grid grid-cols-1">
                <label className="block text-[13px] font-black text-slate-800 mb-2 border-t border-slate-100 pt-8 mt-4">Địa chỉ giao hàng</label>
                <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                  {order.customerName || order.customer?.name}, {order.customerPhone || order.customer?.phone}, {order.customer?.address || 'Tại cửa hàng'}
                </p>
              </div>

              <div className="grid grid-cols-1">
                <label className="block text-[13px] font-black text-slate-800 mb-2 border-t border-slate-100 pt-8 mt-4">Đơn vị vận chuyển</label>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded border border-slate-100 flex items-center justify-center p-1 font-black text-orange-600 text-[10px]">
                      GHN
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.shippingUnit || 'Tự vận chuyển'}</p>
                      {order.order_code && (
                        <p className="text-xs text-slate-500">Mã vận đơn: <span className="font-bold text-blue-600">{order.order_code}</span></p>
                      )}
                    </div>
                  </div>
                  {order.order_code && (
                    <a 
                      href={`https://donhang.ghn.vn/?order_code=${order.order_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-blue-600 hover:bg-white hover:border-blue-300 transition-all shadow-sm"
                    >
                      Tra cứu hành trình <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Sidebar */}
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-[13px] font-black text-slate-800 mb-6">Thông tin khách hàng</h3>
            <p className="text-[13px] font-bold text-blue-600 hover:underline cursor-pointer">
              {order.customerName || order.customer?.name} ({order.customerPhone || order.customer?.phone})
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-[13px] font-black text-slate-800 mb-6">Thông tin cửa hàng</h3>
            <div className="text-[13px] space-y-2 text-slate-600">
              <p className="font-bold text-slate-800">Head Office</p>
              <p>Kho: Kho mặc định</p>
            </div>
          </div>

          <div className="bg-[#FFF9E6] border border-[#FFE7A3] rounded-xl p-5 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-[#F59E0B] shrink-0" />
            <div className="text-[13px] text-[#92400E]">
              <p className="font-bold mb-1 leading-tight">Cảnh báo: Kho Kho mặc định không đủ tồn kho</p>
              <p className="opacity-80">Trà hòa tan Sâm Ngọc Linh (cần 1, còn 0)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-8">
            <div>
              <h3 className="text-[13px] font-black text-slate-800 mb-4">Trạng thái</h3>
              <div className="relative">
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded py-2 px-3 text-[13px] appearance-none focus:ring-0 focus:border-slate-300 outline-none pr-10 cursor-pointer"
                >
                  {pStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-black text-slate-800 mb-4">Xác nhận đơn</h3>
              <div className="relative">
                <select 
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded py-2 px-3 text-[13px] appearance-none focus:ring-0 focus:border-slate-300 outline-none pr-10 cursor-pointer"
                >
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-black text-slate-800 mb-4">Chú thích</h3>
              <p className="text-[13px] text-slate-500 italic">Không chú thích</p>
            </div>

            <div className="pt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => alert('Đã gửi thông báo cho khách hàng qua Zalo ZNS')}
                className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 font-bold py-2.5 px-6 rounded text-[13px] transition-all active:scale-95 flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Gửi thông báo cho khách
              </button>
              <button 
                onClick={() => onDelete?.(order._id)}
                className="bg-white hover:bg-red-50 text-red-500 border border-red-200 font-bold py-2.5 px-4 rounded text-[13px] transition-all active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đơn
              </button>
              <button 
                onClick={handleUpdate}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 px-8 rounded text-[13px] transition-all active:scale-95 shadow-sm"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
