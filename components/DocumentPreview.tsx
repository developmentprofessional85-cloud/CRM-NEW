
import React from 'react';
import { Quotation, Invoice, Customer, AppSettings, TaxType } from '../types';
import { Printer, X, Hexagon, AlertCircle } from 'lucide-react';

interface DocumentPreviewProps {
  type: 'Quotation' | 'Invoice';
  doc: Quotation | Invoice;
  customer?: Customer;
  settings: AppSettings;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ type, doc, customer, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // Safety check to prevent "Unexpected Error" crash if customer is missing
  if (!customer) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6">
        <div className="bg-white rounded-[2rem] p-12 max-w-md text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase text-slate-900">Data Integrity Error</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">The linked customer record for this document could not be retrieved from the vault.</p>
          </div>
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">Close Preview</button>
        </div>
      </div>
    );
  }

  // Calculate display tax rate with safety fallbacks
  let displayTaxRate = 0;
  if (doc && 'taxRate' in doc && typeof doc.taxRate === 'number') {
    displayTaxRate = doc.taxRate;
  } else if (doc?.taxType === TaxType.GST) {
    displayTaxRate = settings?.gstRate ?? 0.18;
  } else if (doc?.taxType === TaxType.SRB) {
    displayTaxRate = settings?.srbRate ?? 0.15;
  }

  const isCash = doc?.taxType === TaxType.CASH;
  const lineItems = doc?.lineItems ?? [];
  const grandTotal = doc?.grandTotal ?? 0;
  const taxAmount = doc?.taxAmount ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-0 sm:p-4 overflow-hidden">
      {/* Precision Print Styling */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          /* Hide the entire application UI */
          body, html, #root {
            visibility: hidden !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Specifically show ONLY the print container */
          .print-modal-container {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print-content-wrapper {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure text colors and borders render correctly in PDF */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-brand-500 { background-color: #f97316 !important; }
          .border-slate-500 { border-color: #64748b !important; }
          .text-brand-600 { color: #ea580c !important; }
        }
      `}</style>

      <div className="bg-white w-full h-full sm:h-[98vh] sm:max-w-[210mm] sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden print-modal-container">
        
        {/* Document HUD Controls (Hidden on Print) */}
        <div className="flex items-center justify-between p-6 border-b bg-white no-print shrink-0">
          <div className="flex items-center space-x-4">
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Print Vault</h3>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">REF: {doc.serialNumber}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrint} 
              className="flex items-center space-x-2 px-8 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 group active:scale-95"
            >
              <Printer size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Print / PDF Download</span>
            </button>
            <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar print-content-wrapper">
          <div className="relative min-h-full flex flex-col p-10 sm:p-14">
            
            {/* OFFICIAL LETTERHEAD */}
            <header className="mb-12 shrink-0">
              <div className="flex items-start justify-between border-b-[6px] border-slate-500 pb-4 relative">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white border-2 border-slate-800 flex items-center justify-center rounded-lg shadow-sm">
                       <Hexagon size={36} className="text-slate-700 fill-slate-700/10" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 leading-none tracking-tighter uppercase">{settings?.companyShortName ?? 'SCPL'}</h2>
                    <h3 className="text-xl font-bold text-slate-500 leading-none tracking-widest uppercase mt-0.5">Chemicals</h3>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Private Limited</p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end justify-end self-end">
                   <div className="flex space-x-1 mb-2">
                      <div className="w-6 h-3 bg-brand-500"></div>
                      <div className="w-3 h-3 bg-brand-400"></div>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic">
                     Site Engineering • Project Support • Supply Chain
                   </p>
                </div>
              </div>
            </header>

            {/* DOCUMENT IDENTITY SECTION */}
            <div className="flex justify-between items-start mb-12">
               <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Bill To / Deliver To</p>
                    <h4 className="text-lg font-black text-slate-900 leading-tight uppercase">{customer.name}</h4>
                    <p className="text-xs text-slate-600 font-bold mt-1 max-w-sm">{customer.address}</p>
                 </div>
                 {!isCash && doc.buyerNtn && (
                   <div className="inline-flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Buyer Tax ID (NTN)</span>
                      <span className="text-sm font-black text-slate-800 tracking-tight">{doc.buyerNtn}</span>
                   </div>
                 )}
               </div>
               <div className="text-right space-y-4">
                 <div>
                   <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{type}</h1>
                   <p className="text-brand-600 font-black text-sm tracking-widest mt-1">{doc.serialNumber}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuance Date</p>
                   <p className="font-bold text-slate-900 text-sm">
                     {new Date(doc.createdAt ?? Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                   </p>
                 </div>
               </div>
            </div>

            {/* DOCUMENT SUBJECT LINE */}
            <div className="mb-8 border-l-4 border-brand-500 pl-6 py-3 bg-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Reference Subject</p>
               <h4 className="text-sm font-black text-slate-800 uppercase leading-relaxed">
                 {('subject' in doc) ? (doc.subject ?? "General Commercial Offering") : "Official Financial Settlement"}
               </h4>
            </div>

            {/* LINE ITEMS TABLE */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-900">Item Specification</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900">Unit</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900">Qty</th>
                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Rate (PKR)</th>
                    <th className="py-4 pl-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.length > 0 ? lineItems.map((item, idx) => (
                    <tr key={idx} className="page-break-inside-avoid">
                      <td className="py-5 pr-4">
                        <p className="font-black text-slate-800 text-sm leading-tight uppercase">{item.name || 'Undefined Product'}</p>
                      </td>
                      <td className="py-5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase">{item.uom || 'EA'}</td>
                      <td className="py-5 px-4 text-center font-black text-slate-900 text-xs">{item.quantity || 0}</td>
                      <td className="py-5 px-6 text-right font-bold text-slate-500 text-xs">{(item.unitPrice ?? 0).toLocaleString()}</td>
                      <td className="py-5 pl-6 text-right font-black text-slate-900 text-xs">{(item.subtotal ?? 0).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-300 uppercase font-black text-xs">No itemized lines present</td></tr>
                  )}
                </tbody>
              </table>

              {/* VALUATION SUMMARY */}
              <div className="mt-12 flex justify-end">
                <div className="w-full max-w-xs space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Base Value</span>
                    <span className="text-slate-900">Rs {(grandTotal - taxAmount).toLocaleString()}</span>
                  </div>
                  {!isCash && (
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{doc.taxType} Tax ({Math.round(displayTaxRate * 100)}%)</span>
                      <span className="text-slate-900">Rs {taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                    <span className="text-sm font-black text-slate-900 uppercase">Total Payable</span>
                    <span className="text-xl font-black text-brand-600">Rs {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMMERCIAL CLAUSES */}
            <div className="mt-12 mb-20 page-break-inside-avoid">
               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-2 mb-4">Terms & Commercial Clauses</h5>
               <div className="text-[10px] text-slate-600 leading-relaxed font-bold space-y-2 whitespace-pre-wrap uppercase opacity-80">
                  {('terms' in doc) ? (doc.terms ?? "Standard business terms apply to this proposal.") : "Settlement is subject to structural validation and official bank clearance."}
               </div>
            </div>

            {/* DOCUMENT FOOTER */}
            <footer className="mt-auto shrink-0 pt-10">
               <div className="border-t-[6px] border-slate-500 pt-6 flex justify-between items-start">
                  <div className="space-y-2 max-w-md">
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                      SYSTEM GENERATED DOCUMENT • VALID WITHOUT PHYSICAL STAMP
                    </p>
                    <div className="space-y-1">
                      <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tight flex items-center">
                        <span className="w-1 h-3 bg-emerald-500 mr-2"></span>
                        "Sustainability through chemistry and precision engineering."
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="flex space-x-1 mb-2">
                        <div className="w-2 h-2 bg-slate-300"></div>
                        <div className="w-4 h-2 bg-brand-500"></div>
                        <div className="w-8 h-2 bg-brand-600"></div>
                     </div>
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{settings?.companyShortName ?? 'SCPL'} CONTROL</p>
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
