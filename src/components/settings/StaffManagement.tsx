import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  Trash2, 
  Edit2,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface StaffMember {
  _id: string;
  username: string;
  name: string;
  role: 'admin' | 'sales' | 'warehouse';
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'sales' as 'admin' | 'sales' | 'warehouse',
    email: '',
    phone: '',
    active: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStaff ? `/api/staff/${editingStaff._id}` : '/api/staff';
    const method = editingStaff ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchStaff();
        setShowModal(false);
        setEditingStaff(null);
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'sales',
          email: '',
          phone: '',
          active: true
        });
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">Quản trị viên</span>;
      case 'sales':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Bán hàng</span>;
      case 'warehouse':
        return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">Kho hàng</span>;
      default:
        return null;
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
          <p className="text-sm text-slate-500">Quản lý tài khoản và phân quyền truy cập hệ thống</p>
        </div>
        <button 
          onClick={() => {
            setEditingStaff(null);
            setFormData({
              username: '',
              password: '',
              name: '',
              role: 'sales',
              email: '',
              phone: '',
              active: true
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-xl hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/10 font-bold"
        >
          <UserPlus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Không tìm thấy nhân viên nào</td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500">@{member.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {member.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.active ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang hoạt động
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          Đã khóa
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingStaff(member);
                            setFormData({
                              username: member.username,
                              password: '',
                              name: member.name,
                              role: member.role,
                              email: member.email || '',
                              phone: member.phone || '',
                              active: member.active
                            });
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(member._id)}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          disabled={member.username === 'admin'}
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

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
              <h2 className="text-xl font-bold">{editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên đăng nhập</label>
                  <input 
                    required
                    disabled={!!editingStaff}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-50"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu {editingStaff && '(Để trống nếu không đổi)'}</label>
                  <input 
                    type="password"
                    required={!editingStaff}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Vai trò</label>
                <select 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  disabled={editingStaff?.username === 'admin'}
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="sales">Nhân viên bán hàng</option>
                  <option value="warehouse">Nhân viên kho</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  disabled={editingStaff?.username === 'admin'}
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Kích hoạt tài khoản</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-900 text-white font-bold hover:bg-emerald-950 transition-all shadow-lg shadow-emerald-900/20"
                >
                  {editingStaff ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
