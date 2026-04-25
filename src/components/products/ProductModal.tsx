import React, { useRef } from 'react';
import { X, Upload, Image as ImageIcon, Star } from 'lucide-react';
import { Category } from '../../types';
import { NumberInput } from '../ui/NumberInput';

interface ProductModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newProduct: any;
  setNewProduct: (product: any) => void;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  onClose,
  onSubmit,
  newProduct,
  setNewProduct,
  categories
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrls, setImageUrls] = React.useState<string[]>(
    newProduct.images && newProduct.images.length > 0 ? newProduct.images : ['']
  );

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    
    if (value.trim() !== '' && index === imageUrls.length - 1 && imageUrls.length < 5) {
      newUrls.push('');
    }
    
    setImageUrls(newUrls);
    setNewProduct((prev: any) => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const removeUrl = (index: number) => {
    if (imageUrls.length === 1) {
      setImageUrls(['']);
      setNewProduct((prev: any) => ({ ...prev, images: [] }));
      return;
    }
    const newUrls = imageUrls.filter((_, i) => i !== index);
    if (newUrls.length === 0) newUrls.push('');
    else if (newUrls[newUrls.length - 1].trim() !== '' && newUrls.length < 5) newUrls.push('');
    
    setImageUrls(newUrls);
    setNewProduct((prev: any) => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Thêm sản phẩm mới</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tên sản phẩm</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Giá (VNĐ)</label>
              <NumberInput 
                required
                value={newProduct.price}
                onChange={val => setNewProduct({...newProduct, price: val})}
              />
              <p className="text-10 text-slate-400 mt-1">* Nhập 0 để hiển thị "Liên hệ"</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Danh mục (Chọn nhiều)</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                {categories.map(cat => (
                  <label key={cat._id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-emerald-700">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={newProduct.categoryIds?.includes(cat._id)}
                      onChange={e => {
                        const checked = e.target.checked;
                        const currentIds = newProduct.categoryIds || [];
                        const currentNames = newProduct.categoryNames || [];
                        
                        if (checked) {
                          setNewProduct({
                            ...newProduct, 
                            categoryIds: [...currentIds, cat._id],
                            categoryNames: [...currentNames, cat.name]
                          });
                        } else {
                          setNewProduct({
                            ...newProduct, 
                            categoryIds: currentIds.filter(id => id !== cat._id),
                            categoryNames: currentNames.filter(name => name !== cat.name)
                          });
                        }
                      }}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setNewProduct({...newProduct, isFeatured: !newProduct.isFeatured})}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                newProduct.isFeatured 
                  ? 'bg-amber-50 border-amber-500 shadow-sm shadow-amber-100' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`p-2 rounded-lg ${newProduct.isFeatured ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Star className={`w-5 h-5 ${newProduct.isFeatured ? 'fill-current' : ''}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${newProduct.isFeatured ? 'text-amber-900' : 'text-slate-700'}`}>
                    Nêu bật sản phẩm
                  </div>
                  <div className="text-10 text-slate-500">Hiển thị ưu tiên lên đầu danh sách</div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors ${newProduct.isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newProduct.isFeatured ? 'left-7' : 'left-1'}`} />
              </div>
            </button>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                checked={newProduct.active !== false}
                onChange={e => setNewProduct({...newProduct, active: e.target.checked})}
              />
              <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                Kích hoạt sản phẩm (Hiển thị cho khách hàng)
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Mô tả sản phẩm</label>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm min-h-[100px]"
              value={newProduct.description}
              onChange={e => setNewProduct({...newProduct, description: e.target.value})}
              placeholder="Nhập mô tả sản phẩm..."
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-600">Link hình ảnh (Tối đa 5 link)</label>
              {imageUrls.length < 5 && imageUrls[imageUrls.length - 1].trim() !== '' && (
                <button 
                  type="button"
                  onClick={() => setImageUrls([...imageUrls, ''])}
                  className="text-10 font-bold text-emerald-700 uppercase hover:underline"
                >
                  + Thêm link
                </button>
              )}
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      placeholder={`Dán link ảnh ${idx + 1} (ví dụ: https://...)...`}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                      value={url}
                      onChange={e => handleUrlChange(idx, e.target.value)}
                    />
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {imageUrls.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeUrl(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {newProduct.images && newProduct.images.length > 0 && (
              <div className="mt-4">
                <label className="block text-10 font-bold text-slate-400 uppercase mb-2">Xem trước</label>
                <div className="flex flex-wrap gap-2">
                  {newProduct.images.map((img: string, idx: number) => (
                    <div key={idx} className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50">
                      <img 
                        src={img} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mt-4 active:scale-[0.98]">
            Lưu sản phẩm
          </button>
        </form>
      </div>
    </div>
  );
};
