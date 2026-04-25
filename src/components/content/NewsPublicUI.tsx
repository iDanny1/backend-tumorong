import React, { useState, useEffect } from 'react';
import { Clock, Eye, ChevronRight, BookOpen } from 'lucide-react';
import { Article } from '../../types';
import DOMPurify from 'dompurify';
import { api } from '../../lib/api';

export const NewsPublicUI: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await api.get('/api/news');
      // Only show published articles
      setArticles(data.filter((a: Article) => a.status === 'published'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const readArticle = async (slug: string) => {
    try {
      const data = await api.get(`/api/news/${slug}`);
      setSelectedArticle(data);
      // Update local views count for UI
      setArticles(prev => prev.map(a => a.slug === slug ? {...a, views: a.views + 1} : a));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Đang tải tin tức...</div>;

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedArticle(null)}
          className="mb-6 text-emerald-700 font-bold flex items-center gap-2 hover:underline"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Quay lại danh sách
        </button>
        
        <img 
          src={selectedArticle.thumbnail} 
          className="w-full h-64 object-cover rounded-2xl mb-8 shadow-lg" 
          alt={selectedArticle.title}
          referrerPolicy="no-referrer"
        />
        
        <div className="flex items-center gap-4 mb-4">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {selectedArticle.category}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            {new Date(selectedArticle.createdAt).toLocaleDateString('vi-VN')}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Eye className="w-3.5 h-3.5" />
            {selectedArticle.views} lượt xem
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{selectedArticle.title}</h1>
        
        <div className="flex items-center gap-3 mb-10 pb-10 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-white font-bold">
            {selectedArticle.author[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">{selectedArticle.author}</div>
            <div className="text-xs text-slate-400">Biên tập viên</div>
          </div>
        </div>

        <div 
          className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content) }}
        />

        <div className="mt-12 pt-12 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {selectedArticle.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tin Tức & Kiến Thức</h2>
        <p className="text-slate-500">Cập nhật những thông tin mới nhất về Sâm Ngọc Linh và ưu đãi của chúng tôi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Hiện chưa có bài viết nào được xuất bản</p>
          </div>
        ) : (
          articles.map(article => (
            <div 
              key={article._id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group cursor-pointer flex flex-col"
              onClick={() => readArticle(article.slug)}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={article.thumbnail || 'https://picsum.photos/seed/news/800/500'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={article.title}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-900 text-[10px] font-black rounded-lg shadow-sm uppercase">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                  <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400">Bởi {article.author}</span>
                  <span className="text-emerald-700 font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Đọc tiếp <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
