import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  RotateCcw, 
  Printer, 
  ExternalLink, 
  Package, 
  User, 
  MapPin, 
  Phone,
  ArrowUpRight
} from 'lucide-react';
import { Order } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ShippingManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    'Tất cả', 
    'Chờ xử lý', 
    'Đã lấy hàng', 
    'Đang giao', 
    'Thành công', 
    'Hoàn hàng'
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToGHN = async (order: Order) => {
    if (!window.confirm(`Bạn có muốn đẩy đơn hàng ${order.orderId || order._id} sang Giao Hàng Nhanh?`)) return;

    try {
      // 1. Chuẩn bị dữ liệu theo chuẩn GHN (đơn giản hóa)
      // Lưu ý: Thực tế cần mapping chi tiết địa chỉ (DistrictId, WardCode)
      const ghnPayload = {
        payment_type_id: 2, // 2: Người nhận trả phí (thường là COD)
        note: `Đơn hàng ${order.orderId || order._id}`,
        required_note: "CHOXEMHANGGTC",
        to_name: order.customerName || order.customer?.name || "Khách hàng",
        to_phone: order.customerPhone || order.customer?.phone || "",
        to_address: order.customer?.address || "",
        to_ward_name: "Phường 1", // Cần field thật để mapDistrict/Ward
        to_district_name: "Quận 1",
        weight: 500, // Grams
        length: 10,
        width: 10,
        height: 10,
        service_type_id: 2, // 2: E-commerce service
        service_id: 0,
        cod_amount: order.paymentMethod === 'COD' ? order.total : 0,
        items: order.products?.map(p => ({
          name: p.name,
          quantity: p.quantity,
          weight: 200
        })) || []
      };

      const res = await fetch('/api/ghn/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ghnPayload)
      });

      const result = await res.json();

      if (result.code === 200 || result.data?.order_code) {
        const orderCode = result.data.order_code;
        
        // 2. Cập nhật trạng thái trong hệ thống của mình
        await fetch(`/api/orders/${order._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'Đang giao',
            shippingUnit: 'GHN',
            order_code: orderCode // Lưu mã vận đơn
          })
        });

        alert(`Đẩy đơn thành công! Mã vận đơn GHN: ${orderCode}`);
        fetchOrders(); // Tải lại danh sách
      } else {
        alert(`Lỗi từ GHN: ${result.message || 'Không xác định'}`);
      }
    } catch (err) {
      console.error('Error pushing to GHN:', err);
      alert('Lỗi khi kết nối với hệ thống GHN');
    }
  };

  const handleSyncGHN = async (order: Order) => {
    if (!order.order_code) return;
    
    try {
      const res = await fetch(`/api/ghn/status/${order.order_code}`);
      const result = await res.json();
      
      if (result.success) {
        const newStatus = result.statusName;
        
        // Cập nhật trạng thái trong hệ thống của mình
        await fetch(`/api/orders/${order._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: newStatus
          })
        });

        alert(`Đồng bộ thành công! Trạng thái hiện tại: ${newStatus}`);
        fetchOrders(); // Tải lại danh sách
      } else {
        alert(`Lỗi khi đồng bộ: ${result.message || 'Không xác định'}`);
      }
    } catch (err) {
      console.error('Error syncing with GHN:', err);
      alert('Lỗi khi kết nối với hệ thống GHN');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    // Basic search
    const matchesSearch = 
      (order.orderId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customerPhone?.includes(searchQuery));

    if (!matchesSearch) return false;

    // Filter by tab
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Chờ xử lý') return order.status === 'Chờ xác nhận' || order.status === 'Đang chuẩn bị';
    if (activeTab === 'Đã lấy hàng') return order.status === 'Đã lấy hàng';
    if (activeTab === 'Đang giao') return order.status === 'Đang giao';
    if (activeTab === 'Thành công') return order.status === 'Hoàn thành';
    if (activeTab === 'Hoàn hàng') return order.status === 'Đã hủy'; // Or a specific status if available

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận':
      case 'Đang chuẩn bị':
        return <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold rounded border border-amber-100 uppercase tracking-tighter">Chờ xử lý</span>;
      case 'Đang giao':
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded border border-blue-100 uppercase tracking-tighter">Đang giao</span>;
      case 'Hoàn thành':
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded border border-emerald-100 uppercase tracking-tighter">Thành công</span>;
      case 'Đã hủy':
        return <span className="px-2 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded border border-red-100 uppercase tracking-tighter">Hoàn hàng/Hủy</span>;
      default:
        return <span className="px-2 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded border border-slate-100 uppercase tracking-tighter">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              Quản lý Vận chuyển
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Theo dõi và điều phối giao hàng cho {orders.length} đơn hàng</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchOrders}
              className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-bold shadow-sm"
              title="Làm mới"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm mã ĐH, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-[13px] font-bold rounded-lg transition-all",
                activeTab === tab 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã ĐH</th>
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Tổng tiền (COD)</th>
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-8">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-slate-400 font-medium italic">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order._id} className="group hover:bg-blue-50/10 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 leading-none">{order.orderId || "#ORD-" + order._id.slice(-6).toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 mt-1 font-bold">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-slate-800 truncate leading-none mb-1">{order.customerName || order.customer?.name}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone className="w-3 h-3" />
                          <span className="text-[11px] font-medium">{order.customerPhone || order.customer?.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="text-[11px] font-medium truncate max-w-[200px]">{order.customer?.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 max-w-[250px]">
                      {order.products?.slice(0, 2).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="text-[11px] text-slate-600 font-medium truncate">
                            {p.name} <span className="text-slate-400 font-bold ml-1">x{p.quantity}</span>
                          </span>
                        </div>
                      ))}
                      {order.products && order.products.length > 2 && (
                        <span className="text-[10px] text-blue-500 font-black pl-5 italic">+ {order.products.length - 2} sản phẩm khác</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[14px] font-black text-emerald-600 leading-none">
                      {order.total.toLocaleString('vi-VN')}
                      <span className="text-[10px] ml-1 uppercase">đ</span>
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                      {order.paymentMethod || 'COD'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* logic for shipping buttons */}
                      {(!order.status || order.status === 'Chờ xác nhận' || order.status === 'Đang chuẩn bị') ? (
                        <button 
                          onClick={() => handlePushToGHN(order)}
                          className="px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-[11px] font-black rounded shadow-sm shadow-blue-200 transition-all active:scale-95 flex items-center gap-1.5"
                          title="Đẩy đơn sang GHN"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          ĐẨY ĐƠN GHN
                        </button>
                      ) : (
                        <>
                          <button 
                            className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-all font-bold shadow-sm"
                            title="In Tem"
                            onClick={() => alert(`Đang tải tem vận chuyển cho mã: ${order.order_code || 'N/A'}`)}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSyncGHN(order)}
                            className="p-1.5 bg-white border border-slate-200 rounded text-amber-600 hover:bg-amber-50 transition-all font-bold shadow-sm"
                            title="Lấy trạng thái mới nhất từ GHN"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <a 
                            href={`https://donhang.ghn.vn/?order_code=${order.order_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 transition-all font-bold shadow-sm"
                            title="Tra cứu hành trình"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
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
