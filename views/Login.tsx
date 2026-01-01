
import React, { useState } from 'react';
import { Hexagon, Lock, User as UserIcon, ChevronRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { setCurrentUser, getUsers } from '../services/db';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Dynamic Authentication Logic using local database
    setTimeout(() => {
      const normalizedId = empId.trim().toUpperCase();
      const users = getUsers();
      
      const userMatch = users.find(u => u.id === normalizedId && u.password === password);

      if (userMatch) {
        setCurrentUser(userMatch);
        onLoginSuccess(userMatch);
      } else {
        setError("Access Denied. Ensure Employee ID and Password are correct.");
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
          
          <div className="p-12 pb-6 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-brand-600 rounded-[1.75rem] flex items-center justify-center mb-8 shadow-2xl shadow-brand-600/30 ring-8 ring-brand-50 transition-transform hover:rotate-12 duration-500">
                <Hexagon size={40} className="text-white fill-white/10" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">SCPL Portal</h1>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Enterprise Access Point</p>
          </div>

          <form onSubmit={handleLogin} className="p-12 pt-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600 animate-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Employee ID</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="SCPL-EMP-001"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-[1.5rem] outline-none font-bold text-slate-900 transition-all shadow-inner uppercase"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-[1.5rem] outline-none font-bold text-slate-900 transition-all shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span>Initialize Session</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
            
            <div className="pt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
