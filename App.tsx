
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CustomerManagement from './views/CustomerManagement';
import ProductCatalog from './views/ProductCatalog';
import QuotationEngine from './views/QuotationEngine';
import QuotationList from './views/QuotationList';
import InvoiceManagement from './views/InvoiceManagement';
import Reports from './views/Reports';
import AdminSettings from './views/AdminSettings';
import Login from './views/Login';
import { getQuotations, getCurrentUser, setCurrentUser } from './services/db';
import { Quotation, UserRole, User } from './types';
import { Menu, X, Cloud, CloudOff, Info } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setAuthUser] = useState<User | null>(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [isAiActive, setIsAiActive] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setQuotes(getQuotations());
      setIsAiActive(!!process.env.API_KEY && process.env.API_KEY !== "undefined");
    }
  }, [activeView, currentUser]);

  const handleLoginSuccess = (user: User) => {
    setAuthUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthUser(null);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard quotes={quotes} />;
      case 'customers': return <CustomerManagement />;
      case 'catalog': return <ProductCatalog />;
      case 'quotations': return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quotations Archive</h1>
            <button 
              onClick={() => setActiveView('new-quotation')}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>+ Create Proposal</span>
            </button>
          </div>
          <QuotationList />
        </div>
      );
      case 'new-quotation': return <QuotationEngine userRole={currentUser.role} />;
      case 'invoices': return <InvoiceManagement />;
      case 'reports': return <Reports />;
      case 'admin': 
        if (currentUser.role !== UserRole.ADMIN) {
          return <div className="p-20 text-center text-slate-400 font-black uppercase">Unauthorized Access</div>;
        }
        return <AdminSettings />;
      default: return <Dashboard quotes={quotes} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <div className={`
        fixed inset-0 z-50 lg:relative lg:z-0 lg:block
        transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        <Sidebar activeView={activeView} onViewChange={handleViewChange} onLogout={handleLogout} />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-40 shadow-sm shadow-slate-100/50">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-brand-600 lg:hidden rounded-lg hover:bg-slate-50">
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] truncate max-w-[120px] sm:max-w-none">
                {activeView.replace('-', ' ')}
              </span>
              {isAiActive ? (
                <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse-slow">
                  <Cloud size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">AI Sync Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-100 group relative cursor-help">
                  <CloudOff size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">Local Mode</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-brand-600 font-black uppercase tracking-widest mt-1">{currentUser.role} Level</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-500 font-black shrink-0 shadow-lg shadow-slate-200">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
