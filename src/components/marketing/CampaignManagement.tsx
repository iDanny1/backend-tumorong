import React from 'react';
import { Megaphone, Plus, Search, Calendar, ChevronRight } from 'lucide-react';

export const CampaignManagement: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Chiến dịch</span>
            <span>/</span>
            <span className="text-slate-600">Chiến dịch Marketing</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Chiến dịch</h1>
        </div>
        <button className="flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10">
          <Plus className="w-4 h-4" />
          Tạo chiến dịch mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800">Chiến dịch đang chạy</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm chiến dịch..."
                className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 group cursor-pointer hover:bg-emerald-50 transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                <Megaphone className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-slate-800 text-sm">Sale Hè Rực Rỡ 2024</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Đang chạy: 01/06 - 30/06
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
            {/* Placeholder for more campaigns */}
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Chưa có nhiều chiến dịch để hiển thị</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Thống kê nhanh</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Tổng chiến dịch</div>
                <div className="text-2xl font-black text-slate-900">12</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Ngân sách đã chi</div>
                <div className="text-2xl font-black text-slate-900">45.5tr</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
