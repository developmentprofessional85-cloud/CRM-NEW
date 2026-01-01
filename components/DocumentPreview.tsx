
import React from 'react';
import { Quotation, Invoice, Customer, AppSettings, TaxType } from '../types';
import { Printer, X, Hexagon, ShieldCheck } from 'lucide-react';

interface DocumentPreviewProps {
  type: 'Quotation' | 'Invoice';
  doc: Quotation | Invoice;
  customer: Customer;
  settings: AppSettings;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ type, doc, customer, settings, onClose }) => {
  const handlePrint = () => window.print();

  let displayTaxRate = 0;
  if (doc && 'taxRate' in doc && doc.taxRate !== undefined) {
    displayTaxRate = doc.taxRate;
  } else if (doc.taxType === TaxType.GST) {
    displayTaxRate = settings.gstRate;
  } else if (doc.taxType === TaxType.SRB) {
    displayTaxRate = settings.srbRate;
  } else {
    displayTaxRate = 0;
  }

  const isCash = doc.taxType === TaxType.CASH;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-0 sm:p-4 overflow-hidden">
      {/* Print Specific Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-container {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            position: relative;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full h-full sm:h-[98vh] sm:max-w-[210mm] sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden no-print-shadow">
        
        {/* Header Controls (Hidden on Print) */}
        <div className="flex items-center justify-between p-6 border-b bg-white no-print shrink-0">
          <div className="flex items-center space-x-4">
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Preview: {type}</h3>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">{doc.serialNumber}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handlePrint} className="flex items-center space-x-2 px-8 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-100">
              <Printer size={18} />
              <span>Print Document</span>
            </button>
            <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto print-container bg-white custom-scrollbar">
          <div className="relative min-h-full flex flex-col p-10 sm:p-14">
            
            {/* OFFICIAL LETTERHEAD: HEADER */}
            <header className="mb-12 shrink-0">
              <div className="flex items-start justify-between border-b-[6px] border-slate-500 pb-4 relative">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {/* Recreating Logo from Screenshot */}
                    <div className="w-16 h-16 bg-white border-2 border-slate-800 flex items-center justify-center rounded-lg shadow-sm">
                       <Hexagon size={36} className="text-slate-700 fill-slate-700/10" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 leading-none tracking-tighter uppercase">Structura</h2>
                    <h3 className="text-xl font-bold text-slate-500 leading-none tracking-widest uppercase mt-0.5">Chemicals</h3>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Private Limited</p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end justify-end self-end">
                   {/* Yellow markers as seen in letterhead */}
                   <div className="flex space-x-1 mb-2">
                      <div className="w-6 h-3 bg-brand-500"></div>
                      <div className="w-3 h-3 bg-brand-400"></div>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic">
                     Engineered to Protect — Built to Sustain
                   </p>
                </div>
              </div>
            </header>

            {/* DOCUMENT INFO */}
            <div className="flex justify-between items-start mb-12">
               <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">To</p>
                    <h4 className="text-lg font-black text-slate-900 leading-tight uppercase">{customer.name}</h4>
                    <p className="text-xs text-slate-600 font-bold mt-1 max-w-sm">{customer.address}</p>
                 </div>
                 {!isCash && doc.buyerNtn && (
                   <div className="inline-flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Customer NTN</span>
                      <span className="text-sm font-black text-slate-800">{doc.buyerNtn}</span>
                   </div>
                 )}
               </div>
               <div className="text-right space-y-4">
                 <div>
                   <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{type}</h1>
                   <p className="text-brand-600 font-black text-sm tracking-widest mt-1">{doc.serialNumber}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Issue</p>
                   <p className="font-bold text-slate-900 text-sm">{new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                 </div>
               </div>
            </div>

            {/* SUBJECT */}
            <div className="mb-8 border-l-4 border-brand-500 pl-6 py-2 bg-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Subject</p>
               <h4 className="text-sm font-black text-slate-800 uppercase leading-relaxed">
                 {('subject' in doc) ? doc.subject : "Official Commercial Settlement"}
               </h4>
            </div>

            {/* ITEMS TABLE */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-900">Description of Items/Services</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900">Unit</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900">Qty</th>
                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Rate (PKR)</th>
                    <th className="py-4 pl-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.lineItems.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-5 pr-4">
                        <p className="font-black text-slate-800 text-sm leading-tight uppercase">{item.name}</p>
                      </td>
                      <td className="py-5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase">{item.uom}</td>
                      <td className="py-5 px-4 text-center font-black text-slate-900 text-xs">{item.quantity}</td>
                      <td className="py-5 px-6 text-right font-bold text-slate-500 text-xs">{item.unitPrice.toLocaleString()}</td>
                      <td className="py-5 pl-6 text-right font-black text-slate-900 text-xs">{item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-12 flex justify-end">
                <div className="w-full max-w-xs space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-slate-900">Rs {(doc.grandTotal - doc.taxAmount).toLocaleString()}</span>
                  </div>
                  {!isCash && (
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{doc.taxType} Tax ({Math.round(displayTaxRate * 100)}%)</span>
                      <span className="text-slate-900">Rs {doc.taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                    <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                    <span className="text-xl font-black text-brand-600">Rs {doc.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TERMS */}
            <div className="mt-12 mb-20">
               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-2 mb-4">Commercial Terms & Conditions</h5>
               <div className="text-[10px] text-slate-600 leading-relaxed font-bold space-y-2 whitespace-pre-wrap uppercase opacity-80">
                  {('terms' in doc) ? doc.terms : "Standard project delivery and payment terms apply."}
               </div>
            </div>

            {/* OFFICIAL LETTERHEAD: FOOTER */}
            <footer className="mt-auto shrink-0">
               <div className="border-t-[6px] border-slate-500 pt-6 flex justify-between items-start">
                  <div className="space-y-2 max-w-md">
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                      This is a system-generated document and does not require any signature or stamp.
                    </p>
                    <div className="space-y-1">
                      <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tight flex items-center">
                        <span className="w-1 h-3 bg-emerald-500 mr-2"></span>
                        "The best time to plant a tree was 20 years ago. The second best time is now."
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold italic uppercase tracking-widest">
                        Please avoid printing unless legally required. Go Green.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="flex space-x-1 mb-2">
                        <div className="w-2 h-2 bg-slate-300"></div>
                        <div className="w-4 h-2 bg-brand-500"></div>
                        <div className="w-8 h-2 bg-brand-600"></div>
                     </div>
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{settings.companyShortName} OFFICIAL</p>
                  </div>
               </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
