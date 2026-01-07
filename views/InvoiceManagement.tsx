
import React, { useState, useEffect } from 'react';
import { getInvoices, getCustomers, getSettings, getCurrentUser } from '../services/db';
import { Invoice, Customer, UserRole } from '../types';
import { Receipt, Eye, Download, Mail, DollarSign, Lock } from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';

const InvoiceManagement: React.FC = () => {
  const currentUser = getCurrentUser();
  const settings = getSettings();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setInvoices(getInvoices().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setCustomers(getCustomers());
  }, []);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  const dispatchEmail = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customerId);
    if (!customer) return alert("Customer record not found.");
    if (!customer.email) return alert("No email address found for this client.");
    
    const subject = encodeURIComponent(`Commercial Invoice: ${inv.serialNumber} - SCPL Settlement`);
    const bodyText = `Dear ${customer.contactPerson || customer.name},\n\nGreetings from Structura Chemicals.\n\nPlease find attached the commercial invoice for the subject settlement.\n\nSummary:\n- Ref: ${inv.serialNumber}\n- Amount: Rs ${inv.grandTotal.toLocaleString()}\n- Due Date: ${new Date(inv.dueDate).toLocaleDateString()}\n\nWe look forward to your valuable response.\n\nBest regards,\nAccounts Department - Structura Chemicals\nOfficial Correspondence: ${settings.operatorEmail}`;
    const body = encodeURIComponent(bodyText);
    window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Invoicing Center</h1>
          <p className="text-slate-500 font-bold text-sm">Track receivables and financial settlements</p>
        </div>
        {!isAdmin && (
           <div className="flex items-center space-x-3 px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl border border-slate-200">
             <Lock size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Data Immutable: Admin Authority Required</span>
           </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Invoice No.</th>
                <th className="px-8 py-6">Client Entity</th>
                <th className="px-8 py-6">Jurisdiction</th>
                <th className="px-8 py-6">Aggregate (PKR)</th>
                <th className="px-8 py-6">Maturity Date</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Vault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-brand-600 uppercase tracking-tighter">{inv.serialNumber}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 text-sm uppercase leading-none">{getCustomerName(inv.customerId)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref ID: {inv.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">{inv.taxType}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 text-sm">Rs {inv.grandTotal.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-3 text-slate-300 hover:text-brand-600 bg-white border border-slate-100 rounded-xl hover:shadow-lg transition-all">
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => dispatchEmail(inv)}
                        className="p-3 text-slate-300 hover:text-blue-600 bg-white border border-slate-100 rounded-xl hover:shadow-lg transition-all">
                        <Mail size={18} />
                      </button>
                      {isAdmin && (
                        <button className="p-3 text-slate-300 hover:text-emerald-600 bg-white border border-slate-100 rounded-xl hover:shadow-lg transition-all" title="Mark as Paid">
                          <DollarSign size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="py-32 text-center text-slate-300">
              <Receipt size={64} className="mx-auto mb-6 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No finalized invoices committed</p>
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <DocumentPreview 
          type="Invoice"
          doc={selectedInvoice}
          customer={customers.find(c => c.id === selectedInvoice.customerId)!}
          settings={getSettings()}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;
