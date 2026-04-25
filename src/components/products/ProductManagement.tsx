import React, { useState } from 'react';
import { Plus, Pencil, RotateCcw, Filter, Trash2, Search } from 'lucide-react';
import { Product } from '../../types';

interface ProductManagementProps {
  products: Product[];
  searchQuery: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRefresh: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  searchQuery,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefresh
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const filteredProducts = products.filter(product => {
    const searchStr = (searchQuery || localSearch).toLowerCase();
    return (
      product.name.toLowerCase().includes(searchStr) ||
      product._id.toLowerCase().includes(searchStr) ||
      (product.sku && product.sku.toLowerCase().includes(searchStr))
    );
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Quản lý sản phẩm</span>
            <span>/</span>
            <span className="text-slate-600">Sản phẩm</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
            title="Lọc"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={onRefresh}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
            title="Làm mới"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm theo tên, SKU hoặc ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Hiển thị {filteredProducts.length} sản phẩm</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 w-10">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID / SKU</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hình ảnh</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Danh mục <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Giá <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Tồn kho <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 text-nowrap">
                    Trạng thái <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 text-nowrap">
                    Loại sản phẩm <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Nền tảng <Filter className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-mono text-slate-400">#{product._id.slice(-6).toUpperCase()}</div>
                    {product.sku && <div className="text-10 text-slate-500 mt-0.5">{product.sku}</div>}
                  </td>
                  <td className="p-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 relative group/img">
                      <img 
                        src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-10 text-white font-bold">Xem t...</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-slate-700 max-w-[200px]">{product.name}</div>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-9 font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase w-fit">
                          Nêu bật
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {product.categoryNames?.map((name, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-slate-500 text-white text-9 font-bold rounded uppercase tracking-tight">
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      {product.price === 0 ? 'Liên hệ' : `${product.price.toLocaleString()}đ`}
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors"
                        title="Sửa giá"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      {product.stock || 10000}
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors"
                        title="Sửa tồn kho"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.active !== false ? (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-10 font-bold">
                        Bật
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-10 font-bold">
                        Tắt
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600">{product.type || 'Vật lý'}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-600">{product.platform || 'Mini App'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all text-11 font-bold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        CHỈNH SỬA
                      </button>
                      <button 
                        onClick={() => onDeleteProduct(product._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-all text-11 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        XÓA
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
