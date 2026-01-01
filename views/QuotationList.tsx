
import React, { useState, useEffect } from 'react';
import { getQuotations, getCustomers, getSettings, createInvoiceFromQuotation } from '../services/db';
import { Quotation, Customer, WorkflowStatus } from '../types';
import { FileText, Eye, Send, CheckCircle, FileX, ArrowRight, Loader2 } from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';

const QuotationList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setQuotes(getQuotations().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setCustomers(getCustomers());
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  const handleGenerateInvoice = (quote: Quotation) => {
    const customer = customers.find(c => c.id === quote.customerId);
    if (!customer) return alert("Customer record not found.");
    
    if (confirm(`Generate official Invoice for ${quote.serialNumber}? This will lock the quotation status.`)) {
      setProcessingId(quote.id);
      setTimeout(() => {
        createInvoiceFromQuotation(quote, customer);
        refreshData();
        setProcessingId(null);
        alert("Invoice generated and archived in Invoicing Center.");
      }, 800);
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.DRAFT: return 'bg-slate-100 text-slate-600';
      case WorkflowStatus.SUBMITTED: return 'bg-blue-100 text-blue-600';
      case WorkflowStatus.ACCEPTED: return 'bg-green-100 text-green-600';
      case WorkflowStatus.REJECTED: return 'bg-red-100 text-red-600';
      case WorkflowStatus.JOB_IN_PROGRESS: return 'bg-orange-100 text-orange-600';
      case WorkflowStatus.JOB_COMPLETED: return 'bg-emerald-100 text-emerald-600';
      case WorkflowStatus.INVOICE_GENERATED: return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Reference No.</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Proposal Subject</th>
              <th className="px-6 py-4">Total Value</th>
              <th className="px-6 py-4">Current Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-slate-900">{quote.serialNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 text-sm">{getCustomerName(quote.customerId)}</p>
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-tighter">{quote.type}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700 truncate max-w-xs">{quote.subject}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">Rs {quote.grandTotal.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">{quote.taxType} Included</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => setSelectedQuote(quote)}
                      className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="View Document">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Send Email">
                      <Send size={18} />
                    </button>
                    {quote.status === WorkflowStatus.JOB_COMPLETED && (
                      <button 
                        onClick={() => handleGenerateInvoice(quote)}
                        disabled={processingId === quote.id}
                        className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-100 transition-all border border-emerald-100" 
                        title="Generate Invoice">
                        {processingId === quote.id ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                        <span>Invoice</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotes.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="italic">No quotations found. Start by creating a new proposal.</p>
          </div>
        )}
      </div>

      {selectedQuote && (
        <DocumentPreview 
          type="Quotation"
          doc={selectedQuote}
          customer={customers.find(c => c.id === selectedQuote.customerId)!}
          settings={getSettings()}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </div>
  );
};

export default QuotationList;
