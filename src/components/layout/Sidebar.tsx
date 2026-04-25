import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Megaphone, 
  TicketPercent, 
  Heart, 
  Truck, 
  Network, 
  BarChart3, 
  Settings, 
  Store,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Warehouse,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { User } from '../../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeMenu, 
  setActiveMenu,
  user,
  onLogout
}) => {
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['Quản lý sản phẩm', 'Cài đặt']);

  const toggleExpand = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const menuItems = [
    { icon: ShoppingCart, label: 'Đơn hàng', roles: ['admin', 'sales'] },
    { icon: BarChart3, label: 'Báo cáo', roles: ['admin'] },
    { icon: Warehouse, label: 'Quản lý kho', roles: ['admin', 'warehouse'] },
    { 
      icon: Package, 
      label: 'Quản lý sản phẩm',
      roles: ['admin', 'sales', 'warehouse'],
      subItems: [
        { label: 'Sản phẩm', value: 'Quản lý sản phẩm - Sản phẩm' },
        { label: 'Danh mục', value: 'Quản lý sản phẩm - Danh mục' }
      ]
    },
    { icon: Store, label: 'Bán tại cửa hàng', roles: ['admin', 'sales'] },
    { 
      icon: Users, 
      label: 'Khách hàng',
      roles: ['admin', 'sales'],
      subItems: [
        { label: 'Tất cả khách hàng', value: 'Khách hàng - Tất cả' },
        { label: 'Khách mua sỉ', value: 'Khách hàng - Mua sỉ' }
      ]
    },
    { 
      icon: Megaphone, 
      label: 'Chiến dịch',
      roles: ['admin', 'sales'],
      subItems: [
        { label: 'Chiến dịch Marketing', value: 'Chiến dịch - Danh sách' },
        { label: 'Bài viết & Tin tức', value: 'Chiến dịch - Content' },
        { label: 'Giao diện Tin tức (Xem thử)', value: 'Tin tức - Preview' }
      ]
    },
    { icon: TicketPercent, label: 'Khuyến mãi', roles: ['admin', 'sales'] },
    { icon: Heart, label: 'Loyalty', roles: ['admin'] },
    { icon: Truck, label: 'Vận chuyển', roles: ['admin', 'sales'] },
    { icon: Network, label: 'Affiliate', roles: ['admin'] },
    { icon: Megaphone, label: 'Marketing', roles: ['admin'] },
    { 
      icon: Settings, 
      label: 'Cài đặt',
      roles: ['admin'],
      subItems: [
        { label: 'Cấu hình hệ thống', value: 'Cài đặt' },
        { label: 'Quản lý nhân viên', value: 'Cài đặt - Nhân viên' }
      ]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    
    const userRole = user.role.toLowerCase();
    return item.roles.some(role => {
      const r = role.toLowerCase();
      // Match 'admin' with 'administrator' or 'admin'
      if (r === 'admin' && (userRole === 'admin' || userRole === 'administrator')) return true;
      return r === userRole;
    });
  });

  return (
    <aside className={cn(
      "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50",
      "fixed inset-y-0 left-0 lg:static lg:translate-x-0 lg:w-64",
      sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      "w-64"
    )}>
      <div className="p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-emerald-800 shadow-sm">
            <img 
              src="https://picsum.photos/seed/forest/200/200" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-emerald-950 text-lg leading-tight">Tu Mơ Rông</span>
            <span className="text-10 text-emerald-700 font-medium uppercase tracking-widest">Sâm Ngọc Linh</span>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded lg:hidden">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {filteredMenuItems.map((item, idx) => {
          const isExpanded = expandedMenus.includes(item.label);
          const isActive = activeMenu === item.label || (item.subItems && item.subItems.some(sub => sub.value === activeMenu));

          return (
            <div key={idx}>
              <div 
                onClick={() => {
                  if (item.subItems) {
                    toggleExpand(item.label);
                  } else {
                    setActiveMenu(item.label);
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group",
                  isActive ? "text-emerald-700 bg-emerald-50/80" : "text-slate-600 hover:bg-emerald-50/30"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-emerald-700" : "text-slate-400")} />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.subItems && (
                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
                {isActive && !item.subItems && <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-700 rounded-l" />}
              </div>
              
              {item.subItems && isExpanded && (
                <div className="bg-slate-50/50">
                  {item.subItems.map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      onClick={() => {
                        setActiveMenu(sub.value);
                        // Close sidebar on mobile after selection
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={cn(
                        "pl-12 pr-4 py-2.5 cursor-pointer text-sm transition-colors relative",
                        activeMenu === sub.value ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-emerald-800"
                      )}
                    >
                      {sub.label}
                      {activeMenu === sub.value && <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-700 rounded-l" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
