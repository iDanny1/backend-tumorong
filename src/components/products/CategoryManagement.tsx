import React from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Category } from '../../types';

interface CategoryManagementProps {
  categories: Category[];
  searchQuery: string;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onToggleCategory: (category: Category) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  searchQuery,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleCategory
}) => {
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh mục sản phẩm</h1>
          <p className="text-slate-500 text-sm">Quản lý các nhóm sản phẩm trong cửa hàng của bạn</p>
        </div>
        <button 
          onClick={onAddCategory}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Icon</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên danh mục</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      <img 
                        src={category.icon || 'https://img.icons8.com/color/144/new-product.png'} 
                        alt={category.name}
                        className="w-8 h-8 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {category.name}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {category.description || 'Chưa có mô tả'}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => onToggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-10 font-bold transition-all ${
                        category.active !== false 
                          ? 'bg-green-50 text-green-600 border border-green-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {category.active !== false ? 'Đang bật' : 'Đã tắt'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEditCategory(category)}
                        className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteCategory(category._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-12 h-12 opacity-10" />
                      <p>Không tìm thấy danh mục nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
