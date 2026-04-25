import React from 'react';
import { Search, ChevronDown, Menu, MessageSquare } from 'lucide-react';
import { User, Order } from '../../types';
import { NotificationDropdown } from '../ui/NotificationDropdown';

interface HeaderProps {
  user: User | null;
  orders: Order[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  onLogout: () => void;
  onSelectOrder: (order: Order) => void;
  onViewAllOrders: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  orders,
  showNotifications,
  setShowNotifications,
  onLogout,
  onSelectOrder,
  onViewAllOrders,
  searchQuery,
  setSearchQuery,
  onMenuClick
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-500"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-4">
        <NotificationDropdown 
          orders={orders}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onSelectOrder={onSelectOrder}
          onViewAll={onViewAllOrders}
        />

        <a 
          href="https://oa.zalo.me/chat" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors flex items-center gap-2"
          title="Zalo OA Chat"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-bold hidden sm:inline">OA Chat</span>
        </a>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-1 md:mx-2 hidden xs:block" />
        
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={onLogout}>
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
            <p className="text-10 text-slate-400 mt-1 uppercase tracking-wider">{user?.role}</p>
          </div>
          <img 
            src={user?.avatar} 
            alt="Avatar" 
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 hidden xs:block" />
        </div>
      </div>
    </header>
  );
};
