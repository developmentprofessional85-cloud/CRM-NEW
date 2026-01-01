
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, LineChart, Line 
} from 'recharts';
import { Download, Filter, Calendar } from 'lucide-react';

const Reports: React.FC = () => {
  const data = [
    { name: 'Week 1', sales: 4000, quotes: 2400 },
    { name: 'Week 2', sales: 3000, quotes: 1398 },
    { name: 'Week 3', sales: 2000, quotes: 9800 },
    { name: 'Week 4', sales: 2780, quotes: 3908 },
  ];

  const exportData = () => {
    alert("Exporting report as CSV...");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Business Analytics</h1>
          <p className="text-slate-500">Comprehensive reporting and data export</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50">
            <Filter size={18} />
            <span>Filters</span>
          </button>
          <button 
            onClick={exportData}
            className="flex items-center space-x-2 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-100"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <span className="w-1.5 h-6 bg-brand-500 rounded-full block"></span>
            <span>Monthly Sales Distribution</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quotes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <span className="w-1.5 h-6 bg-brand-500 rounded-full block"></span>
            <span>Conversion Performance</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-lg font-bold mb-6">Tax Liability Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total GST (18%)</p>
            <p className="text-3xl font-black text-slate-900">Rs 12,450.00</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total SRB (15%)</p>
            <p className="text-3xl font-black text-slate-900">Rs 8,290.00</p>
          </div>
          <div className="p-6 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Total Combined Tax</p>
            <p className="text-3xl font-black text-brand-600">Rs 20,740.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
