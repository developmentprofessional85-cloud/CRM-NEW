
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings,
  LogOut,
  Hexagon,
  ShieldCheck
} from 'lucide-react';
import { getSettings, getCurrentUser } from '../services/db';
import { UserRole } from '../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout }) => {
  const [settings, setSettings] = useState(getSettings());
  const currentUser = getCurrentUser();

  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(getSettings());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'catalog', label: 'Product Catalog', icon: Package },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'admin', label: 'Admin Settings', icon: Settings, role: UserRole.ADMIN },
  ];

  const filteredItems = menuItems.filter(item => !item.role || item.role === currentUser?.role);

  return (
    <div className="w-64 bg-slate-900 h-full flex flex-col text-white relative border-r border-slate-800 shadow-2xl">
      <div className="p-8 border-b border-slate-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-900/40 ring-4 ring-slate-800 transition-transform hover:scale-105 duration-300">
            <Hexagon size={32} className="text-white fill-white/10" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-brand-500 tracking-tighter uppercase leading-none">SCPL-CRM</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Enterprise Edition</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4 custom-scrollbar">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
              activeView === item.id 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="mb-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
           <div className="flex items-center space-x-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{currentUser?.name}</span>
           </div>
           <div className="flex items-center space-x-1">
              <ShieldCheck size={10} className="text-brand-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{currentUser?.role} Mode</span>
           </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 p-3 text-slate-500 hover:text-red-400 cursor-pointer group transition-colors"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Terminate Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
