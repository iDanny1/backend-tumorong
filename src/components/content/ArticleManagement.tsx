import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Clock,
  Image as ImageIcon,
  Tag,
  ChevronLeft,
  Save,
  Send,
  X as XIcon,
  Layout
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '../../lib/utils';
import { Article } from '../../types';
import { api } from '../../lib/api';

export const ArticleManagement: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    thumbnail: '',
    category: 'Tin tức',
    author: 'Quản trị viên',
    status: 'draft',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/news');
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    if (!formData.title) {
      alert('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    try {
      const payload = {
        ...formData,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : formData.publishedAt
      };

      if (editingArticle) {
        await api.put(`/api/news/${editingArticle._id}`, payload);
      } else {
        await api.post('/api/news', payload);
      }

      setShowEditor(false);
      setEditingArticle(null);
      setFormData({
        title: '',
        slug: '',
        summary: '',
        content: '',
        thumbnail: '',
        category: 'Tin tức',
        author: 'Quản trị viên',
        status: 'draft',
        tags: []
      });
      fetchArticles();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await api.delete(`/api/news/${id}`);
      fetchArticles();
    } catch (err) {
      alert('Lỗi khi xóa bài viết');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...(formData.tags || []), tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tagToRemove)
    });
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }]
    ],
  };

  if (showEditor) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] animate-in slide-in-from-right duration-300">
        {/* Editor Header */}
        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setShowEditor(false);
                setEditingArticle(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingArticle ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
              </h2>
              <p className="text-xs text-slate-500">Người viết: {formData.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Lưu nháp
            </button>
            <button 
              onClick={() => handleSubmit('published')}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-900 text-white font-bold text-sm hover:bg-emerald-950 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              <Send className="w-4 h-4" />
              Xuất bản bài viết
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto">
              <input 
                type="text"
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full text-3xl font-black text-slate-900 placeholder:text-slate-300 outline-none border-none focus:ring-0"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <div className="flex gap-4 items-center text-sm text-slate-500 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5 ring-1 ring-slate-200 px-3 py-1 rounded-full bg-slate-50">
                  <Layout className="w-3.5 h-3.5" />
                  <span>{formData.category}</span>
                </div>
                <div className="flex items-center gap-1.5 ring-1 ring-slate-200 px-3 py-1 rounded-full bg-slate-50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Tóm tắt ngắn (Summary)</label>
                  <textarea 
                    rows={3}
                    placeholder="Mô tả ngắn gọn nội dung bài viết..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm italic text-slate-600"
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  />
                </div>

                <div className="min-h-[400px]">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Nội dung chi tiết</label>
                  <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData({...formData, content})}
                    modules={modules}
                    className="h-[350px] mb-12"
                    placeholder="Bắt đầu viết nội dung bài báo của bạn tại đây..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="w-80 space-y-4 overflow-y-auto pr-1">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">Cài đặt bài viết</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Hình ảnh đại diện (Thumbnail)</label>
                <div 
                  className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all overflow-hidden group"
                  onClick={() => {
                    const url = prompt('Nhập URL hình ảnh:');
                    if (url) setFormData({...formData, thumbnail: url});
                  }}
                >
                  {formData.thumbnail ? (
                    <img src={formData.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2" />
                      <span className="text-xs text-slate-400">Tải ảnh lên</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Chuyên mục</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Tin tức">Tin tức</option>
                  <option value="Khuyến mãi">Khuyến mãi</option>
                  <option value="Kiến thức">Kiến thức</option>
                  <option value="Sự kiện">Sự kiện</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Đường dẫn bài viết (URL/Slug)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Thẻ (Tags)</label>
                <input 
                  type="text"
                  placeholder="Nhập và ấn Enter..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg group">
                      {tag}
                      <XIcon 
                        className="w-3 h-3 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => removeTag(tag)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Chiến dịch</span>
            <span>/</span>
            <span className="text-slate-600">Bài viết & Tin tức</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Trình viết báo & Content</h1>
        </div>
        <button 
          onClick={() => {
            setEditingArticle(null);
            setFormData({
              title: '',
              slug: '',
              summary: '',
              content: '',
              thumbnail: '',
              category: 'Tin tức',
              author: 'Quản trị viên',
              status: 'draft',
              tags: []
            });
            setShowEditor(true);
          }}
          className="flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Bài viết</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Chuyên mục</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tác giả</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Thống kê</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">Đang tải dữ liệu bài viết...</td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">Chưa có bài viết nào</td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          {article.thumbnail ? (
                            <img src={article.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm line-clamp-1">{article.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">/{article.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {article.category}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-medium text-slate-600">{article.author}</div>
                      <div className="text-xs text-slate-400">{new Date(article.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{article.views || 0} lượt xem</span>
                      </div>
                    </td>
                    <td className="p-6">
                      {article.status === 'published' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingArticle(article);
                            setFormData(article);
                            setShowEditor(true);
                          }}
                          className="p-2 hover:bg-emerald-50 text-emerald-700 rounded-lg border border-transparent hover:border-emerald-100 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => article._id && handleDelete(article._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
 