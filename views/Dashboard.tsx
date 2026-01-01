
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  FileWarning, 
  DollarSign,
  Briefcase,
  Hexagon,
  ShieldCheck
} from 'lucide-react';
import { Quotation, WorkflowStatus } from '../types';
import { getSettings } from '../services/db';

interface DashboardProps {
  quotes: Quotation[];
}

const Dashboard: React.FC<DashboardProps> = ({ quotes }) => {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const stats = [
    { label: 'Active Quotations', value: quotes.filter(q => q.status === WorkflowStatus.DRAFT).length, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
    { label: 'Jobs In Progress', value: quotes.filter(q => q.status === WorkflowStatus.JOB_IN_PROGRESS).length, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: 'Completed Projects', value: quotes.filter(q => q.status === WorkflowStatus.JOB_COMPLETED).length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Pipeline Value', value: `Rs ${quotes.reduce((acc, q) => acc + q.grandTotal, 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 6890 },
    { name: 'Jun', value: 8390 },
  ];

  const statusPieData = [
    { name: 'Draft', value: quotes.filter(q => q.status === WorkflowStatus.DRAFT).length || 1 },
    { name: 'Submitted', value: quotes.filter(q => q.status === WorkflowStatus.SUBMITTED).length || 1 },
    { name: 'Completed', value: quotes.filter(q => q.status === WorkflowStatus.JOB_COMPLETED).length || 1 },
    { name: 'Invoiced', value: quotes.filter(q => q.status === WorkflowStatus.INVOICE_GENERATED).length || 1 },
  ];

  const COLORS = ['#94a3b8', '#fb923c', '#22c55e', '#6366f1'];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Branded Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 shrink-0 border border-slate-800 transition-transform hover:rotate-12 duration-500">
            <Hexagon size={28} className="text-brand-500 fill-brand-500/10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Performance Hub</h1>
            <div className="flex items-center space-x-2 mt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{settings.companyName}</p>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <div className="flex items-center space-x-1">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Enterprise Verified</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end text-right">
           <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Network Operational</p>
           </div>
           <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-tighter italic">Instance: {settings.companyShortName}-GLOBAL-PROD</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-all hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1">
            <div className={`p-4 rounded-2xl ${stat.color} shrink-0`}>
              <stat.icon size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900 truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Subtle Background Brand Mark */}
          <div className="absolute -top-10 -right-10 opacity-[0.02] pointer-events-none">
            <Hexagon size={240} />
          </div>

          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Revenue Trajectory</h3>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-brand-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Growth</span>
            </div>
          </div>
          <div className="h-64 sm:h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 opacity-[0.03] text-brand-500 pointer-events-none rotate-12">
            <Hexagon size={200} fill="currentColor" />
          </div>

          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Workflow Mix</h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3 relative z-10">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-slate-900 font-black">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
