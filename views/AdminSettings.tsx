
import React, { useState, useEffect } from 'react';
import { Save, Building, Fingerprint, Tags, Plus, Trash2, Users as UsersIcon, Key, AlertTriangle, UserCheck, X } from 'lucide-react';
import { AppSettings, User, UserRole } from '../types';
import { getSettings, saveSettings, getUsers, saveUser, deleteUser } from '../services/db';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [users, setUsers] = useState<User[]>(getUsers());
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [newCategory, setNewCategory] = useState('');
  
  // User Generation State
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.SALES);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setMessage({ text: 'Enterprise settings updated!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.categories.includes(newCategory.trim())) return;
    setSettings({
      ...settings,
      categories: [...settings.categories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== cat)
    });
  };

  // User Management
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for(let i=0; i<8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleCreateUser = () => {
    const cleanId = newUserEmpId.trim().toUpperCase();
    if (!cleanId.startsWith('SCPL-EMP-')) {
      return setMessage({ text: 'Format must be SCPL-EMP-XXX', type: 'error' });
    }
    if (users.find(u => u.id === cleanId)) {
      return setMessage({ text: 'Employee ID already exists', type: 'error' });
    }
    if (!newUserName.trim()) {
      return setMessage({ text: 'Full Name is required', type: 'error' });
    }

    const newUser: User = {
      id: cleanId,
      name: newUserName.trim(),
      email: cleanId, // Using Emp ID for login identity
      role: newUserRole,
      password: generatePassword()
    };

    saveUser(newUser);
    setUsers(getUsers());
    setNewUserEmpId('');
    setNewUserName('');
    setMessage({ text: `User ${cleanId} created with password: ${newUser.password}`, type: 'success' });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(`Revoke access for ${id}?`)) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-2 border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enterprise Control Center</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Global compliance and staff authority parameters</p>
        </div>
        <button onClick={handleSave} className="flex items-center space-x-2 px-10 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-brand-100 hover:bg-brand-700 transition-all">
          <Save size={20} />
          <span>Commit System State</span>
        </button>
      </div>

      {message && (
        <div className={`p-6 rounded-[2rem] font-bold text-sm border-2 animate-bounce-short ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? <UserCheck /> : <AlertTriangle />}
            <span className="uppercase tracking-widest">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Branding & Categories */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-8">
              <Building className="text-brand-500" size={20} />
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Corporate Identity</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Legal Entity Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-black text-sm uppercase transition-all"
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">National Tax (NTN)</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-mono text-sm font-black"
                    value={settings.scplNtn}
                    onChange={(e) => setSettings({...settings, scplNtn: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-8">
              <Tags className="text-brand-500" size={20} />
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Categories</h3>
            </div>
            <div className="space-y-6">
              <div className="flex space-x-2">
                <input 
                  type="text"
                  placeholder="NEW..."
                  className="flex-1 px-4 py-3 bg-slate-50 rounded-xl outline-none font-black text-xs uppercase"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.categories.map((cat) => (
                  <div key={cat} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg group hover:border-brand-500 transition-all">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{cat}</span>
                    <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: User Management */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-900 text-brand-500 rounded-2xl flex items-center justify-center">
                    <UsersIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Staff Authority & Access</h3>
               </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 mb-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</label>
                    <input className="w-full p-4 bg-white border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-mono font-black text-xs uppercase shadow-sm" placeholder="SCPL-EMP-XXX" value={newUserEmpId} onChange={e => setNewUserEmpId(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input className="w-full p-4 bg-white border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-black text-xs uppercase shadow-sm" placeholder="STAFF NAME" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Level</label>
                    <select className="w-full p-4 bg-white border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-black text-xs uppercase shadow-sm appearance-none" value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}>
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
               </div>
               <button onClick={handleCreateUser} className="w-full mt-6 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-brand-100">
                  <Key size={18} />
                  <span>Generate Access Credentials</span>
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorization</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Password</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-black text-brand-600">{u.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 text-xs uppercase">{u.name}</p>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${u.role === UserRole.ADMIN ? 'bg-brand-500' : 'bg-blue-500'}`}></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{u.role}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-[10px] font-bold text-slate-900 tracking-widest">{u.password}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {u.id !== 'SCPL-EMP-001' && (
                          <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
