import React, { useState } from 'react';
import { Product, Order } from '../types';
import { ShoppingCart, Eye, X, Plus, Minus, CheckCircle2 } from 'lucide-react';

interface CustomerUIProps {
  products: Product[];
  onProductClick: (productId: string) => void;
  onBackToAdmin: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const CustomerUI: React.FC<CustomerUIProps> = ({ 
  products, 
  onProductClick,
  onBackToAdmin 
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product._id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrder: Partial<Order> = {
      orderId: `ORD-${Math.floor(Math.random() * 1000000)}`,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      total: cartTotal,
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      shippingUnit: 'Giao hàng nhanh',
      store: 'Cửa hàng chính',
      status: 'Chờ xác nhận',
      paymentStatus: 'Chưa thanh toán',
      platform: 'Mini App',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        setCart([]);
        setShowCheckout(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (err) {
      alert('Lỗi khi đặt hàng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Cửa hàng</h1>
            <p className="text-slate-500 mt-1">Chào mừng bạn đến với trải nghiệm mua sắm tuyệt vời</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ShoppingCart className="w-6 h-6 text-slate-700" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-10 font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={onBackToAdmin}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              Quay lại Admin
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.filter(p => p.active !== false).map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer"
              onClick={() => onProductClick(product._id)}
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/400/400'} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                {product.isFeatured && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-amber-500 text-white text-10 font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Nêu bật
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-1">
                    {product.categoryNames?.map((name, i) => (
                      <span key={i} className="text-9 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-10 text-slate-400">
                    <Eye className="w-3 h-3" />
                    <span>{product.views || 0}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-lg font-black text-slate-900">
                    {product.price === 0 ? 'Liên hệ' : `${product.price.toLocaleString()}đ`}
                  </p>
                  <button 
                    onClick={(e) => addToCart(product, e)}
                    className="p-2 bg-emerald-900 text-white rounded-xl hover:bg-emerald-950 transition-colors shadow-lg shadow-emerald-900/10"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Giỏ hàng của bạn
              </h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <ShoppingCart className="w-16 h-16 opacity-20" />
                  <p className="font-medium">Giỏ hàng trống</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="text-emerald-700 font-bold text-sm uppercase hover:underline"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product._id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                      <img 
                        src={item.product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.product.name}</h4>
                        <p className="text-emerald-700 font-bold text-sm mt-1">
                          {item.product.price.toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.product._id, -1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product._id, 1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-xs text-red-500 font-medium hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tổng cộng</span>
                  <span className="text-2xl font-black text-slate-900">{cartTotal.toLocaleString()}đ</span>
                </div>
                <button 
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="w-full bg-emerald-900 text-white font-bold py-4 rounded-2xl hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                >
                  Thanh toán ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thông tin đặt hàng</h2>
            <p className="text-slate-500 text-sm mb-8">Vui lòng điền thông tin để chúng tôi giao hàng sớm nhất</p>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Họ và tên</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Nguyễn Văn A"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Số điện thoại</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="090..."
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Địa chỉ nhận hàng</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={customerInfo.address}
                  onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Ghi chú (không bắt buộc)</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all min-h-[80px]"
                  placeholder="Ví dụ: Giao giờ hành chính..."
                  value={customerInfo.note}
                  onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})}
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-500">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-emerald-900">{cartTotal.toLocaleString()}đ</span>
                </div>
                <button className="w-full bg-emerald-900 text-white font-bold py-4 rounded-2xl hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
                  Xác nhận đặt hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-emerald-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-bold">Đặt hàng thành công!</span>
              <span className="text-xs text-emerald-200">Chúng tôi sẽ liên hệ với bạn sớm nhất.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
