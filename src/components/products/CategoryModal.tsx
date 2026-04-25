import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface CategoryModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newCategory: any;
  setNewCategory: (category: any) => void;
  isEditing?: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  onClose,
  onSubmit,
  newCategory,
  setNewCategory,
  isEditing = false
}) => {
  const [imageUrls, setImageUrls] = React.useState<string[]>(newCategory.images || [newCategory.icon] || ['']);

  // Sync imageUrls if newCategory changes (e.g. when switching between edit/add)
  React.useEffect(() => {
    const initialImages = newCategory.images && newCategory.images.length > 0 
      ? [...newCategory.images] 
      : (newCategory.icon ? [newCategory.icon] : ['']);
    
    if (initialImages[initialImages.length - 1] !== '' && initialImages.length < 5) {
      initialImages.push('');
    }
    setImageUrls(initialImages);
  }, [newCategory._id]);

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    
    if (value.trim() !== '' && index === imageUrls.length - 1 && imageUrls.length < 5) {
      newUrls.push('');
    }
    
    setImageUrls(newUrls);
    const filteredUrls = newUrls.filter(url => url.trim() !== '');
    setNewCategory((prev: any) => ({
      ...prev,
      images: filteredUrls,
      icon: filteredUrls[0] || prev.icon // Use first image as icon
    }));
  };

  const removeUrl = (index: number) => {
    if (imageUrls.length === 1) {
      const empty = [''];
      setImageUrls(empty);
      setNewCategory((prev: any) => ({ ...prev, images: [], icon: '' }));
      return;
    }
    const newUrls = imageUrls.filter((_, i) => i !== index);
    if (newUrls.length === 0) newUrls.push('');
    else if (newUrls[newUrls.length - 1].trim() !== '' && newUrls.length < 5) newUrls.push('');
    
    setImageUrls(newUrls);
    const filteredUrls = newUrls.filter(url => url.trim() !== '');
    setNewCategory((prev: any) => ({
      ...prev,
      images: filteredUrls,
      icon: filteredUrls[0] || ''
    }));
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tên danh mục</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              value={newCategory.name}
              onChange={e => setNewCategory({...newCategory, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Mô tả</label>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-20"
              value={newCategory.description || ''}
              onChange={e => setNewCategory({...newCategory, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Hình ảnh danh mục (Tối đa 5 link)</label>
            <div className="space-y-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      placeholder={`Dán link ảnh ${idx + 1}...`}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                      value={url}
                      onChange={e => handleUrlChange(idx, e.target.value)}
                    />
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {url.trim() !== '' && (
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

            {newCategory.images && newCategory.images.length > 0 && (
              <div className="mt-4">
                <label className="block text-10 font-bold text-slate-400 uppercase mb-2">Xem trước</label>
                <div className="flex flex-wrap gap-2">
                  {newCategory.images.map((img: string, idx: number) => (
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
            {isEditing ? 'Cập nhật danh mục' : 'Lưu danh mục'}
          </button>
        </form>
      </div>
    </div>
  );
};
