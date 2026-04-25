import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface LoginProps {
  loginForm: any;
  setLoginForm: (form: any) => void;
  onLogin: (e: React.FormEvent) => void;
}

export const Login: React.FC<LoginProps> = ({ loginForm, setLoginForm, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-800 shadow-lg">
              <img 
                src="https://picsum.photos/seed/forest/200/200" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-emerald-950 tracking-tight leading-none">Tu Mơ Rông</span>
              <span className="text-10 text-emerald-700 font-bold uppercase tracking-[0.2em] mt-1">Sâm Ngọc Linh</span>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Đăng nhập quản trị</h2>
        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tài khoản</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="admin"
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="123"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
          </div>
          <button className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mt-4 active:scale-[0.98]">
            Đăng nhập hệ thống
          </button>
        </form>
        <p className="text-center text-slate-400 text-xs mt-6">
          Tài khoản mặc định: admin / 123
        </p>
      </div>
    </div>
  );
};
