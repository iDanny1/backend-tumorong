import React, { useRef } from 'react';
import { X, Upload, Image as ImageIcon, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Link, Type, ChevronLeft, Star } from 'lucide-react';
import { Product, Category } from '../../types';
import { NumberInput } from '../ui/NumberInput';

interface ProductEditPageProps {
  product: Product;
  categories: Category[];
  onSave: (updatedProduct: Product) => void;
  onCancel: () => void;
}

export const ProductEditPage: React.FC<ProductEditPageProps> = ({
  product,
  categories,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = React.useState<Product>({ ...product });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrls, setImageUrls] = React.useState<string[]>(
    formData.images && formData.images.length > 0 ? formData.images : ['']
  );

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    
    // If we changed a value and it's not empty, and it's the last one, and we have less than 5
    if (value.trim() !== '' && index === imageUrls.length - 1 && imageUrls.length < 5) {
      newUrls.push('');
    }
    
    setImageUrls(newUrls);
    setFormData(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const removeUrl = (index: number) => {
    if (imageUrls.length === 1) {
      setImageUrls(['']);
      setFormData(prev => ({ ...prev, images: [] }));
      return;
    }
    const newUrls = imageUrls.filter((_, i) => i !== index);
    // Ensure there's always at least one input, and if the last one isn't empty, add an empty one
    if (newUrls.length === 0) newUrls.push('');
    else if (newUrls[newUrls.length - 1].trim() !== '' && newUrls.length < 5) newUrls.push('');
    
    setImageUrls(newUrls);
    setFormData(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Quản lý sản phẩm</span>
            <span>/</span>
            <span>Sản phẩm</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Chỉnh sửa sản phẩm</span>
          </div>
        </div>
        <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Column - Main Info */}
        <div className="col-span-9 space-y-6">
          {/* Thông tin sản phẩm */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Thông tin sản phẩm</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">* Tên sản phẩm</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-emerald-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-11 font-bold text-slate-500 uppercase mb-1">SKU sản phẩm</label>
                  <input 
                    type="text" 
                    placeholder="Nhập SKU"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-emerald-500 outline-none"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Mã vạch sản phẩm</label>
                  <input 
                    type="text" 
                    placeholder="Nhập dữ liệu"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:border-emerald-500 outline-none"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">* Mô tả sản phẩm</label>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-4">
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-4">
                      <select className="bg-transparent text-xs font-medium outline-none"><option>Normal</option></select>
                    </div>
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                      <Bold className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <Italic className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <Underline className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                      <List className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <AlignLeft className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <AlignCenter className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <AlignRight className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                      <Type className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
                    </div>
                  </div>
                  <textarea 
                    className="w-full p-4 text-sm outline-none min-h-[200px] leading-relaxed"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả sản phẩm..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Đa phương tiện (Link ảnh) */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-800">Đa phương tiện (Link hình ảnh)</h2>
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
            <p className="text-10 text-slate-400 mb-4">Dán link hình ảnh vào ô bên dưới (ví dụ: https://...). Tối đa 5 hình.</p>
            
            <div className="space-y-3">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      placeholder={`Dán link hình ảnh ${idx + 1}...`}
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm focus:border-emerald-500 outline-none"
                      value={url}
                      onChange={e => handleUrlChange(idx, e.target.value)}
                    />
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {imageUrls.length > 1 && (
                    <button 
                      onClick={() => removeUrl(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formData.images && formData.images.length > 0 && (
              <div className="mt-6">
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Xem trước hình ảnh</label>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group relative">
                      <img 
                        src={img} 
                        alt={`Preview ${idx}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Lỗi+ảnh';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Giá sản phẩm */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Giá sản phẩm</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">* Giá bán sản phẩm</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm z-10">đ</span>
                  <NumberInput 
                    className="pl-8"
                    value={formData.price}
                    onChange={val => setFormData({...formData, price: val})}
                  />
                  <p className="text-10 text-slate-400 mt-1">* Nhập 0 để hiển thị "Liên hệ"</p>
                </div>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Giá niêm yết sản phẩm (giá gạch)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm z-10">đ</span>
                  <NumberInput 
                    className="pl-8"
                    value={formData.originalPrice || 0}
                    onChange={val => setFormData({...formData, originalPrice: val})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Thiết lập số lượng */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Thiết lập số lượng</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Số lượng tồn kho</label>
                <NumberInput 
                  value={formData.stock}
                  onChange={val => setFormData({...formData, stock: val})}
                />
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Đơn vị tính</label>
                <input 
                  type="text" 
                  placeholder="cái/phòng/chiếc..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Số lượt bán hiển thị</label>
                <input 
                  type="text" 
                  placeholder="Nhập số lượt bán hiển thị"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold"
                />
              </div>
            </div>
          </section>

          {/* Kích thước & vận chuyển */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Kích thước & vận chuyển</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Trọng lượng sản phẩm (gram)</label>
                <NumberInput 
                  value={formData.weight || 0}
                  onChange={val => setFormData({...formData, weight: val})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Chiều dài (cm)</label>
                  <NumberInput value={formData.length || 0} onChange={val => setFormData({...formData, length: val})} />
                </div>
                <div>
                  <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Chiều rộng (cm)</label>
                  <NumberInput value={formData.width || 0} onChange={val => setFormData({...formData, width: val})} />
                </div>
                <div>
                  <label className="block text-11 font-bold text-slate-500 uppercase mb-1">Chiều cao (cm)</label>
                  <NumberInput value={formData.height || 0} onChange={val => setFormData({...formData, height: val})} />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Status & Settings */}
        <div className="col-span-3 space-y-6">
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Trạng thái</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none"
                  value={formData.active ? 'Bật' : 'Tắt'}
                  onChange={e => setFormData({...formData, active: e.target.value === 'Bật'})}
                >
                  <option>Bật</option>
                  <option>Tắt</option>
                </select>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Nêu bật sản phẩm</label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                  className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all ${
                    formData.isFeatured 
                      ? 'bg-amber-50 border-amber-400 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className={`p-1.5 rounded ${formData.isFeatured ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Star className={`w-4 h-4 ${formData.isFeatured ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${formData.isFeatured ? 'text-amber-900' : 'text-slate-700'}`}>
                        Nêu bật sản phẩm
                      </div>
                      <div className="text-9 text-slate-500">Hiển thị ưu tiên lên đầu danh sách</div>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Sản phẩm tư vấn</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="radio" checked={formData.isConsultant} onChange={() => setFormData({...formData, isConsultant: true})} /> Bật
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="radio" checked={!formData.isConsultant} onChange={() => setFormData({...formData, isConsultant: false})} /> Tắt
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Loại sản phẩm</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none"
                  value={formData.type || 'Sản phẩm vật lý'}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option>Sản phẩm vật lý</option>
                  <option>Sản phẩm số</option>
                </select>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Đặt lịch</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none"
                  value={formData.allowBooking ? 'Cho phép đặt lịch' : 'Không cho phép'}
                  onChange={e => setFormData({...formData, allowBooking: e.target.value === 'Cho phép đặt lịch'})}
                >
                  <option>Cho phép đặt lịch</option>
                  <option>Không cho phép</option>
                </select>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Danh mục sản phẩm (Chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 border border-slate-200 rounded-lg bg-slate-50">
                  {categories.map(cat => (
                    <label key={cat._id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-emerald-700">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={formData.categoryIds?.includes(cat._id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          const currentIds = formData.categoryIds || [];
                          const currentNames = formData.categoryNames || [];
                          
                          if (checked) {
                            setFormData({
                              ...formData, 
                              categoryIds: [...currentIds, cat._id],
                              categoryNames: [...currentNames, cat.name]
                            });
                          } else {
                            setFormData({
                              ...formData, 
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
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Thương hiệu</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none"
                  value={formData.brand || 'Thương hiệu'}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                >
                  <option>Thương hiệu</option>
                  <option>Hoàn Kim Mã</option>
                  <option>Agrivietnam</option>
                </select>
              </div>
              <div>
                <label className="block text-11 font-bold text-slate-500 uppercase mb-2">Thứ tự hiển thị sản phẩm</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none"
                  value={formData.displayOrder}
                  onChange={e => setFormData({...formData, displayOrder: Number(e.target.value)})}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-end z-50">
        <button 
          onClick={() => onSave(formData)}
          className="bg-emerald-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-emerald-950 shadow-lg shadow-emerald-900/20"
        >
          Cập nhật sản phẩm
        </button>
      </div>
    </div>
  );
};
