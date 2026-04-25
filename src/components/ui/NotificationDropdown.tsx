import React from 'react';
import { Bell, ShoppingCart } from 'lucide-react';
import { Order } from '../../types';

interface NotificationDropdownProps {
  orders: Order[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  onSelectOrder: (order: Order) => void;
  onViewAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  orders,
  showNotifications,
  setShowNotifications,
  onSelectOrder,
  onViewAll
}) => {
  const newOrders = orders.filter(o => o.status === 'Chờ xác nhận');

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 hover:bg-slate-100 rounded-full relative transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {newOrders.length > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-10 font-bold flex items-center justify-center rounded-full border-2 border-white">
            {newOrders.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Thông báo đơn hàng</h3>
              <span className="text-10 font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                Mới
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {newOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500">Không có đơn hàng mới nào</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {newOrders.map((order) => (
                    <div 
                      key={order._id}
                      onClick={() => onSelectOrder(order)}
                      className="p-4 hover:bg-blue-50/50 cursor-pointer transition-colors flex gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          Đơn hàng từ {order.customerName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tổng: <span className="font-bold text-blue-600">{order.total?.toLocaleString()}đ</span>
                        </p>
                        <p className="text-10 text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN')} - {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <button 
                onClick={onViewAll}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Xem tất cả đơn hàng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
