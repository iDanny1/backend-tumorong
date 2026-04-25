import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Calendar, ChevronRight, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Campaign } from '../../types';

export const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'scheduled',
    type: 'Sale',
    channels: ['Facebook', 'Zalo']
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newCampaign.name) return;
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      if (res.ok) {
        setShowModal(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" />
          Tạo chiến dịch mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800">Tất cả chiến dịch ({campaigns.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm chiến dịch..."
                className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400 font-medium">Đang tải...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm">Chưa có chiến dịch nào</p>
              </div>
            ) : (
              filteredCampaigns.map(campaign => (
                <div key={campaign._id} className="flex items-center p-4 bg-white hover:bg-emerald-50/50 rounded-xl border border-slate-100 hover:border-emerald-100 group cursor-pointer transition-all">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                    <Megaphone className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm">{campaign.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                      </span>
                      {campaign.status === 'active' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : campaign.status === 'scheduled' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                          <Clock className="w-3 h-3" />
                          Scheduled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                          <AlertCircle className="w-3 h-3" />
                          Ended
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Thống kê nhanh</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Tổng chiến dịch</div>
                <div className="text-2xl font-black text-slate-900">{campaigns.length}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Đang hoạt động</div>
                <div className="text-2xl font-black text-emerald-700">{campaigns.filter(c => c.status === 'active').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-6 h-6 text-emerald-600" />
                TẠO CHIẾN DỊCH MỚI
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Tên chiến dịch</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={newCampaign.startDate}
                    onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={newCampaign.endDate}
                    onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Mô tả</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  rows={3}
                  value={newCampaign.description}
                  onChange={e => setNewCampaign({...newCampaign, description: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all"
              >
                Tạo chiến dịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
