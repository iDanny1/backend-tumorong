import React, { useState, useEffect } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  Plus, 
  Trash2, 
  MapPin, 
  Package, 
  Search, 
  RefreshCw,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Box
} from 'lucide-react';
import { Warehouse, Product } from '../../types';
import { NumberInput } from '../ui/NumberInput';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface WarehouseManagementProps {
  products: Product[];
  onUpdateProductStock: (productId: string, warehouseStock: { [key: string]: number }, totalStock: number) => void;
}

const WarehouseManagement: React.FC<WarehouseManagementProps> = ({ products, onUpdateProductStock }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>('total');
  const [searchQuery, setSearchQuery] = useState('');

  const TOTAL_WAREHOUSE_ID = 'total';
  const totalWarehouse: Warehouse = {
    _id: TOTAL_WAREHOUSE_ID,
    name: 'Kho tổng',
    location: 'Tất cả khu vực',
    orderCount: warehouses.reduce((sum, w) => sum + (w.orderCount || 0), 0),
    createdAt: new Date().toISOString()
  };

  const allWarehouses = [totalWarehouse, ...warehouses];

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/warehouses');
      setWarehouses(data);
      if (!selectedWarehouseId) {
        setSelectedWarehouseId(TOTAL_WAREHOUSE_ID);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.name) return;
    try {
      await api.post('/api/warehouses', newWarehouse);
      setShowAddModal(false);
      setNewWarehouse({ name: '', location: '' });
      fetchWarehouses();
    } catch (err) {
      console.error("Error adding warehouse:", err);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kho này?')) return;
    try {
      await api.delete(`/api/warehouses/${id}`);
      if (selectedWarehouseId === id) setSelectedWarehouseId(null);
      fetchWarehouses();
    } catch (err) {
      console.error("Error deleting warehouse:", err);
    }
  };

  const handleUpdateStock = (productId: string, warehouseId: string, newStock: number) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const currentWarehouseStock = product.warehouseStock || {};
    const updatedWarehouseStock = { ...currentWarehouseStock, [warehouseId]: newStock };
    
    // Calculate total stock across all warehouses
    const totalStock = Object.values(updatedWarehouseStock).reduce((sum: number, val: number) => sum + val, 0);
    
    onUpdateProductStock(productId, updatedWarehouseStock, totalStock);
  };

  const selectedWarehouse = allWarehouses.find(w => w._id === selectedWarehouseId);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 lg:p-3 space-y-4 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <WarehouseIcon className="w-8 h-8 text-emerald-600" />
            QUẢN LÝ KHO
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý tồn kho và phân phối sản phẩm theo từng khu vực</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Thêm kho mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Warehouse List Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Box className="w-4 h-4" />
                Danh sách kho ({allWarehouses.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {allWarehouses.map((w) => (
                <div 
                  key={w._id}
                  onClick={() => setSelectedWarehouseId(w._id)}
                  className={`p-4 cursor-pointer transition-all flex items-center justify-between group ${
                    selectedWarehouseId === w._id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedWarehouseId === w._id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {w._id === TOTAL_WAREHOUSE_ID ? <TrendingUp className="w-5 h-5" /> : <WarehouseIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{w.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {w.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className="text-xs font-bold text-emerald-600">{w.orderCount} đơn</div>
                      <div className="text-10 text-slate-400">Đã xử lý</div>
                    </div>
                    {w._id !== TOTAL_WAREHOUSE_ID && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteWarehouse(w._id); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Management Area */}
        <div className="lg:col-span-8 space-y-4">
          {selectedWarehouse ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[600px]">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    Tồn kho tại: {selectedWarehouse.name}
                  </h2>
                  <p className="text-xs text-slate-500">Điều chỉnh số lượng sản phẩm thực tế tại kho này</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-11 uppercase font-bold tracking-wider">
                      <th className="p-4 border-b border-slate-100">Sản phẩm</th>
                      <th className="p-4 border-b border-slate-100">SKU</th>
                      <th className="p-4 border-b border-slate-100">Tổng tồn</th>
                      <th className="p-4 border-b border-slate-100 w-40">Số lượng tại kho</th>
                      <th className="p-4 border-b border-slate-100">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map((product) => {
                      const isTotalWarehouse = selectedWarehouse._id === TOTAL_WAREHOUSE_ID;
                      const stockInThisWarehouse = isTotalWarehouse ? product.stock : (product.warehouseStock?.[selectedWarehouse._id] || 0);
                      return (
                        <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.images?.[0] || 'https://picsum.photos/seed/p/40/40'} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                              <div className="font-bold text-slate-700 text-sm">{product.name}</div>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500">{product.sku || 'N/A'}</td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-slate-600">{product.stock}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <NumberInput 
                                className={cn("w-24", isTotalWarehouse && "bg-slate-50 cursor-not-allowed")}
                                value={stockInThisWarehouse}
                                disabled={isTotalWarehouse}
                                onChange={(val) => !isTotalWarehouse && handleUpdateStock(product._id, selectedWarehouse._id, val)}
                              />
                              <span className="text-10 text-slate-400 font-medium">{product.unit || 'Cái'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {stockInThisWarehouse > 10 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-10 font-bold">An toàn</span>
                            ) : stockInThisWarehouse > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-10 font-bold">Sắp hết</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-10 font-bold">Hết hàng</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-12 text-center min-h-[600px]">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <WarehouseIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Chọn một kho hàng</h3>
              <p className="text-slate-500 max-w-xs mt-2">Vui lòng chọn một kho hàng từ danh sách bên trái để quản lý tồn kho chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-6 h-6 text-emerald-600" />
                THÊM KHO HÀNG MỚI
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Tên kho hàng</label>
                <input 
                  type="text" 
                  placeholder="VD: Kho Bình Thạnh"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={newWarehouse.name}
                  onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Địa chỉ / Vị trí</label>
                <input 
                  type="text" 
                  placeholder="VD: 123 Xô Viết Nghệ Tĩnh, P.17"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={newWarehouse.location}
                  onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddWarehouse}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all"
              >
                Tạo kho ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;