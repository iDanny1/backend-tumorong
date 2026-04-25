import React from 'react';
import { X, User, Phone, MapPin, Calendar, CreditCard, Package, Download, MessageSquare } from 'lucide-react';
import { Order } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  onClose,
  onUpdateStatus
}) => {
  if (!order) return null;

  const statuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành', 'Đã hủy'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Đang chuẩn bị': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Đang giao': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hoàn thành': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Đã hủy': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Hóa đơn {order.orderId || `#${order._id?.slice(-6).toUpperCase()}`}
              </h2>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border",
                getStatusColor(order.status)
              )}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(order.createdAt), 'dd MMMM, yyyy HH:mm', { locale: vi })}
              </span>
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                {order.platform || 'Zalo Mini App'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Khách hàng
              </h3>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <div>
                  <p className="text-sm font-black text-slate-800">{order.customerName || order.customer?.name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {order.customerPhone || order.customer?.phone}
                  </p>
                </div>
                {(order.customer?.address || order.shippingUnit) && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Địa chỉ giao hàng</p>
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {order.customer?.address || 'Tại cửa hàng'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Thanh toán
              </h3>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full flex flex-col justify-center gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Phương thức:</span>
                  <span className="text-sm font-bold text-slate-700">{order.paymentMethod || 'Chưa xác định'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Trạng thái:</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded",
                    order.paymentStatus === 'Đã thanh toán' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {order.paymentStatus || 'Chờ thanh toán'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4" /> Danh sách sản phẩm
            </h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3 text-left">Sản phẩm</th>
                    <th className="px-5 py-3 text-center w-24">SL</th>
                    <th className="px-5 py-3 text-right">Đơn giá</th>
                    <th className="px-5 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.products?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{item.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">ID: {item.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-600">
                        {item.price?.toLocaleString()}đ
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">
                        {(item.quantity * item.price)?.toLocaleString()}đ
                      </td>
                    </tr>
                  ))}
                  {(!order.products || order.products.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400 italic">
                        Không có thông tin chi tiết sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Box */}
          <div className="flex justify-end">
            <div className="w-full md:w-72 bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100 shadow-inner">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-medium">{(order.totalAmount || order.total)?.toLocaleString()}đ</span>
              </div>
              {order.discountApplied ? (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}:</span>
                  <span className="font-medium">-{order.discountApplied.toLocaleString()}đ</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm text-slate-500">
                <span>Phí vận chuyển:</span>
                <span className="font-medium font-mono text-[10px]">MIỄN PHÍ</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base font-black text-slate-800">Tổng cộng:</span>
                <span className="text-xl font-black text-blue-600">
                  {((order.totalAmount || order.total) - (order.discountApplied || 0)).toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:flex-1">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Cập nhật trạng thái đơn hàng
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(order._id, status)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-sm",
                      order.status === status
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all hover:shadow-md active:scale-95" title="In hóa đơn">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all hover:shadow-md active:scale-95" title="Nhắn tin khách hàng">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
