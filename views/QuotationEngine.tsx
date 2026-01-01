
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Lock, User, FileText, Package, Wrench, Fingerprint, Receipt, Info, Sparkles, Loader2, Share2, CheckCircle2, MessageSquare, Mail, X, Archive, ChevronRight, Printer, Eye, Unlock } from 'lucide-react';
import { Quotation, Customer, Product, TaxType, LineItem, WorkflowStatus, UserRole, CustomerType } from '../types';
import { getCustomers, getProducts, saveQuotation, generateSerialNumber, getSettings, getCurrentUser } from '../services/db';
import { suggestScopeOfWork, suggestClientResponsibilities, suggestTermsAndConditions } from '../services/geminiService';
import { UOM_OPTIONS } from '../constants';
import DocumentPreview from '../components/DocumentPreview';

const QuotationEngine: React.FC<{ initialData?: Quotation, userRole?: UserRole }> = ({ initialData, userRole = UserRole.SALES }) => {
  const currentUser = getCurrentUser();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  
  // Post-submission state
  const [finalizedQuote, setFinalizedQuote] = useState<Quotation | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Quotation>>(initialData || {
    type: 'Sales',
    taxType: TaxType.GST,
    lineItems: [],
    status: WorkflowStatus.DRAFT,
    logs: [],
    subject: '',
    commercialOffer: '',
    terms: '',
    buyerNtn: '',
    poNumber: '',
    scopeOfWork: '',
    technicalData: '',
    clientResponsibilities: '',
    scplResponsibilities: ''
  });

  // Admin and Lock logic
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isLocked = formData.status !== WorkflowStatus.DRAFT;
  const isEditable = !isLocked || isAdmin;
  const isCash = formData.taxType === TaxType.CASH;
  
  const canEditLinePrice = (item: LineItem) => {
    if (!isEditable) return false;
    if (formData.type === 'Services') return true; 
    return isAdmin; 
  };

  useEffect(() => {
    setCustomers(getCustomers());
    setProducts(getProducts());
  }, []);

  const handleAddProductItem = (product: Product) => {
    if (!isEditable) return;
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      uom: product.uom || 'EA',
      quantity: 1,
      unitPrice: product.basePrice,
      subtotal: product.basePrice
    };
    setFormData(prev => ({ ...prev, lineItems: [...(prev.lineItems || []), newItem] }));
  };

  const handleAddManualService = () => {
    if (!isEditable) return;
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '', 
      uom: 'EA',
      quantity: 1,
      unitPrice: 0, 
      subtotal: 0
    };
    setFormData(prev => ({ ...prev, lineItems: [...(prev.lineItems || []), newItem] }));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    if (!isEditable) return;
    setFormData(prev => {
      const updated = (prev.lineItems || []).map(item => {
        if (item.id === id) {
          const u = { ...item, ...updates };
          u.subtotal = u.quantity * u.unitPrice;
          return u;
        }
        return item;
      });
      return { ...prev, lineItems: updated };
    });
  };

  const calculateTotals = () => {
    const settings = getSettings();
    const subtotal = (formData.lineItems || []).reduce((acc, item) => acc + item.subtotal, 0);
    
    let taxRate = 0;
    if (formData.taxType === TaxType.GST) taxRate = settings.gstRate;
    else if (formData.taxType === TaxType.SRB) taxRate = settings.srbRate;
    else taxRate = 0; // Cash / None

    const taxAmount = subtotal * taxRate;
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount, taxRate };
  };

  const handleAiSuggest = async (type: 'scope' | 'responsibilities' | 'terms') => {
    if (!isEditable) return;
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer && type === 'scope') return alert("Select a customer first");
    
    setIsAiLoading(type);
    try {
      let result = "";
      if (type === 'scope') result = await suggestScopeOfWork(formData.subject || "General Services", customer?.name || "Client");
      if (type === 'responsibilities') result = await suggestClientResponsibilities(formData.subject || "Project");
      if (type === 'terms') result = await suggestTermsAndConditions(formData.type || "Sales");
      
      setFormData(prev => ({
        ...prev,
        [type === 'scope' ? 'scopeOfWork' : type === 'responsibilities' ? 'clientResponsibilities' : 'terms']: result
      }));
    } catch (e) {
      alert("AI Suggestion failed.");
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleFinalSubmit = () => {
    if (isLocked && !isAdmin) return;
    const { taxAmount, grandTotal, taxRate } = calculateTotals();
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer || !formData.subject) return alert("Select a customer and provide a subject");

    setIsArchiving(true);

    const submission: Quotation = {
      ...formData as Quotation,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      serialNumber: formData.serialNumber || generateSerialNumber('Qt', customer.name, formData.taxType || TaxType.GST),
      status: WorkflowStatus.SUBMITTED,
      buyerNtn: isCash ? '' : formData.buyerNtn,
      taxAmount,
      grandTotal,
      taxRate,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [...(formData.logs || []), {
        status: WorkflowStatus.SUBMITTED,
        timestamp: new Date().toISOString(),
        user: currentUser?.id || 'Unknown',
        remarks: `Quotation finalized as ${formData.type} proposal. Archived and ready for official A4 print.`
      }]
    };

    setTimeout(() => {
      saveQuotation(submission);
      setFinalizedQuote(submission);
      setIsArchiving(false);
    }, 1200);
  };

  const handleUnlock = () => {
    if (!isAdmin) return alert("Only Admin can unlock archived quotations.");
    if (confirm("Unlock this proposal for editing? Status will return to Draft.")) {
      setFormData(prev => ({ ...prev, status: WorkflowStatus.DRAFT }));
    }
  };

  const totals = calculateTotals();

  // Sharing Handlers
  const dispatchWhatsApp = () => {
    if (!finalizedQuote) return;
    const customer = customers.find(c => c.id === finalizedQuote.customerId);
    if (!customer) return;

    // Sanitize phone for wa.me link (digits only, country code handling)
    const digits = customer.alternatePhone.replace(/\D/g, '');
    const cleanMobile = digits.startsWith('0') ? '92' + digits.slice(1) : digits;

    const text = encodeURIComponent(`*SCPL Quotation Dispatch*\n\nDear ${customer.contactPerson || customer.name},\n\nPlease find our commercial proposal *${finalizedQuote.serialNumber}* for *${finalizedQuote.subject}*.\n\nTotal Value: Rs ${finalizedQuote.grandTotal.toLocaleString()}\n\nA4 document link will follow.`);
    window.open(`https://wa.me/${cleanMobile}?text=${text}`, '_blank');
  };

  const dispatchEmail = () => {
    if (!finalizedQuote) return;
    const customer = customers.find(c => c.id === finalizedQuote.customerId);
    if (!customer) return;
    const subject = encodeURIComponent(`Commercial Proposal: ${finalizedQuote.serialNumber} - SCPL / ${finalizedQuote.subject}`);
    const body = encodeURIComponent(`Dear ${customer.contactPerson || customer.name},\n\nGreetings from Structura Chemicals.\n\nPlease find attached the commercial proposal for the subject project.\n\nSummary:\n- Ref: ${finalizedQuote.serialNumber}\n- Subject: ${finalizedQuote.subject}\n- Amount: Rs ${finalizedQuote.grandTotal.toLocaleString()}\n\nWe look forward to your valuable feedback.\n\nBest regards,\nSales Department - Structura Chemicals`);
    window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
  };

  if (finalizedQuote) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in zoom-in-95">
        <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden text-center">
          <div className="bg-emerald-600 p-12 text-white flex flex-col items-center space-y-4 shrink-0">
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 size={48} className="text-white" />
             </div>
             <div>
               <h2 className="text-3xl font-black uppercase tracking-tighter">Proposal Committed</h2>
               <p className="text-emerald-100 font-bold text-sm mt-1">Ref: {finalizedQuote.serialNumber}</p>
             </div>
          </div>
          
          <div className="p-12 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
             <div className="space-y-2">
               <p className="text-slate-500 font-medium leading-relaxed">Document has been officially archived in Project Central. Select a dispatch channel below.</p>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={dispatchWhatsApp} className="flex items-center justify-center space-x-3 py-5 bg-emerald-50 text-emerald-700 rounded-3xl font-black uppercase text-xs tracking-widest border-2 border-emerald-100 hover:bg-emerald-100 transition-all">
                    <MessageSquare size={20} />
                    <span>WhatsApp</span>
                  </button>
                  <button onClick={dispatchEmail} className="flex items-center justify-center space-x-3 py-5 bg-blue-50 text-blue-700 rounded-3xl font-black uppercase text-xs tracking-widest border-2 border-blue-100 hover:bg-blue-100 transition-all">
                    <Mail size={20} />
                    <span>Email</span>
                  </button>
               </div>
               
               <button onClick={() => setIsPreviewOpen(true)} className="flex items-center justify-center space-x-3 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                  <Printer size={20} />
                  <span>Print Official A4 {finalizedQuote.type}</span>
               </button>
             </div>

             <div className="pt-8 border-t border-slate-100 flex flex-col space-y-4">
                <button onClick={() => window.location.reload()} className="flex items-center justify-center space-x-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-600">
                  <span>Return to Management Dashboard</span>
                  <ChevronRight size={14} />
                </button>
             </div>
          </div>
        </div>

        {isPreviewOpen && (
          <DocumentPreview 
            type={finalizedQuote.type as any}
            doc={finalizedQuote}
            customer={customers.find(c => c.id === finalizedQuote.customerId)!}
            settings={getSettings()}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 relative">
      {isArchiving && (
        <div className="fixed inset-0 z-[110] bg-white/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
           <div className="flex flex-col items-center space-y-4">
              <Loader2 size={48} className="text-brand-600 animate-spin" />
              <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-900">Committing Proposal to Archive...</p>
           </div>
        </div>
      )}

      {/* Session Header */}
      <div className="bg-slate-900 px-8 py-4 rounded-[2rem] flex justify-between items-center text-white border-b-4 border-brand-500 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] leading-none mb-1">Active Project Session</p>
            <h2 className="text-lg font-black uppercase tracking-tighter">{formData.type} Draft Engine</h2>
          </div>
        </div>
        <div className="flex items-center space-x-6">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Auth Session</p>
             <p className="text-sm font-black text-brand-400 uppercase">{currentUser?.id}</p>
           </div>
           {isLocked && isAdmin && (
             <button onClick={handleUnlock} className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-500 transition-all">
                <Unlock size={14} />
                <span>Request Edit</span>
             </button>
           )}
        </div>
      </div>

      {isLocked && !isAdmin && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-center justify-between space-x-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <Lock className="text-amber-600 shrink-0" size={24} />
            <p className="text-amber-800 font-black uppercase text-xs tracking-widest">Proposal Locked: Archived in Project Center. Contact Admin for changes.</p>
          </div>
        </div>
      )}

      {/* STEP 1: ITEMIZATION */}
      {step === 1 && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Proposal Category</h3>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${formData.type === 'Sales' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                   {formData.type} Only
                </div>
              </div>
              
              <div className="flex space-x-2 p-1.5 bg-slate-100 rounded-2xl">
                <button onClick={() => setFormData({...formData, type: 'Sales', lineItems: []})} disabled={!isEditable} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'Sales' ? 'bg-white shadow-xl text-brand-600 scale-105' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
                  Product Sale
                </button>
                <button onClick={() => setFormData({...formData, type: 'Services', lineItems: []})} disabled={!isEditable} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'Services' ? 'bg-white shadow-xl text-brand-600 scale-105' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
                  Service Job
                </button>
              </div>

              {formData.type === 'Sales' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input placeholder="Search catalog..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-bold text-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                      <button key={p.id} disabled={!isEditable} onClick={() => handleAddProductItem(p)} className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl hover:border-brand-500 hover:shadow-lg transition-all flex justify-between items-center group disabled:opacity-50">
                        <div>
                          <p className="font-black text-slate-800 text-sm group-hover:text-brand-600">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.packaging} | {p.category}</p>
                        </div>
                        <p className="font-black text-slate-900 text-sm">Rs {p.basePrice.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-brand-50/50 rounded-[2rem] border-2 border-dashed border-brand-200 text-center space-y-6">
                  <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Wrench size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 uppercase text-sm tracking-tight">Manual Service Entry</p>
                    <p className="text-xs text-slate-500 leading-relaxed px-4">Define unique units of work and custom pricing for site services.</p>
                  </div>
                  <button onClick={handleAddManualService} disabled={!isEditable} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50">+ New Service Line</button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-[700px]">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center">
                    <div className="w-2 h-6 bg-brand-500 rounded-full mr-3"></div>
                    Proposal Breakdown
                  </h3>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                  {formData.lineItems?.map(item => (
                    <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start group relative transition-all hover:bg-white hover:border-brand-200 hover:shadow-xl">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Specification</label>
                             <input disabled={!isEditable} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none uppercase" placeholder="Detailed description..." value={item.name} onChange={e => updateLineItem(item.id, { name: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit (UOM)</label>
                             <div className="relative">
                               <select disabled={!isEditable} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-black focus:ring-2 focus:ring-brand-500 appearance-none uppercase" value={UOM_OPTIONS.includes(item.uom) ? item.uom : 'Other'} onChange={e => {
                                 if (e.target.value === 'Other') {
                                   updateLineItem(item.id, { uom: '' });
                                 } else {
                                   updateLineItem(item.id, { uom: e.target.value });
                                 }
                               }}>
                                 {UOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                 <option value="Other">Custom Unit...</option>
                               </select>
                               {!UOM_OPTIONS.includes(item.uom) && (
                                 <input 
                                   className="absolute inset-0 w-full p-3 rounded-xl border border-brand-500 bg-white text-sm font-black outline-none uppercase" 
                                   placeholder="UOM" 
                                   autoFocus
                                   disabled={!isEditable}
                                   value={item.uom} 
                                   onChange={e => updateLineItem(item.id, { uom: e.target.value.toUpperCase() })} 
                                   onBlur={e => {
                                     if (!e.target.value) updateLineItem(item.id, { uom: 'EA' });
                                   }}
                                 />
                               )}
                             </div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Rate (PKR)</label>
                             <input 
                               type="number" 
                               readOnly={!canEditLinePrice(item)} 
                               className={`w-full p-3 rounded-xl border text-sm font-black transition-all ${canEditLinePrice(item) ? 'bg-white border-slate-200 text-brand-600 focus:ring-2 focus:ring-brand-500' : 'bg-slate-200 border-transparent text-slate-500'}`} 
                               value={item.unitPrice} 
                               onChange={e => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</label>
                             <input disabled={!isEditable} type="number" className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-black focus:ring-2 focus:ring-brand-500" value={item.quantity} onChange={e => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} />
                           </div>
                        </div>
                      </div>
                      <button onClick={() => setFormData({...formData, lineItems: formData.lineItems?.filter(i => i.id !== item.id)})} disabled={!isEditable} className="ml-4 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"><Trash2 size={20} /></button>
                    </div>
                  ))}
                  {(!formData.lineItems || formData.lineItems.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                       <Receipt size={64} className="opacity-20" />
                       <p className="font-black uppercase text-xs tracking-[0.3em]">No items itemized</p>
                    </div>
                  )}
               </div>

               <div className="mt-8 pt-8 border-t-4 border-slate-100 grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Valuation</p>
                    <p className="text-xl font-black text-slate-900">Rs {totals.subtotal.toLocaleString()}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total ({formData.taxType})</p>
                    <p className="text-2xl font-black text-brand-600">Rs {totals.grandTotal.toLocaleString()}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PROJECT CONTEXT */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-900 text-brand-500 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Project Identity Data</h2>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-3">Addressee Client Profile *</label>
                    <select disabled={!isEditable} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl font-black text-slate-900 outline-none transition-all shadow-inner appearance-none uppercase text-xs" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                      <option value="">-- Select Active Record --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.location}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-3">Proposal Subject/Title *</label>
                    <input disabled={!isEditable} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl font-black text-slate-900 outline-none transition-all shadow-inner uppercase text-sm" placeholder="e.g. CHEMICAL COATING PROJECT - SITE A" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-3">Tax Jurisdiction</label>
                       <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl">
                          <button disabled={!isEditable} onClick={() => setFormData({...formData, taxType: TaxType.GST})} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.taxType === TaxType.GST ? 'bg-white shadow-xl text-brand-600' : 'text-slate-400'}`}>GST</button>
                          <button disabled={!isEditable} onClick={() => setFormData({...formData, taxType: TaxType.SRB})} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.taxType === TaxType.SRB ? 'bg-white shadow-xl text-brand-600' : 'text-slate-400'}`}>SRB</button>
                          <button disabled={!isEditable} onClick={() => setFormData({...formData, taxType: TaxType.CASH})} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.taxType === TaxType.CASH ? 'bg-white shadow-xl text-brand-600' : 'text-slate-400'}`}>CASH</button>
                       </div>
                     </div>
                     {!isCash ? (
                       <div className="animate-in fade-in slide-in-from-top-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-3">Buyer NTN Reference *</label>
                         <div className="relative">
                           <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                           <input disabled={!isEditable} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl font-mono font-black text-sm text-slate-900 outline-none shadow-inner border-2 border-transparent focus:border-brand-500" placeholder="TAX ID REQUIRED" value={formData.buyerNtn} onChange={e => setFormData({...formData, buyerNtn: e.target.value})} />
                         </div>
                       </div>
                     ) : (
                       <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-3 text-emerald-600 animate-in zoom-in-95">
                         <CheckCircle2 size={16} />
                         <p className="text-[10px] font-black uppercase tracking-widest">Cash settlement: NTN bypassed</p>
                       </div>
                     )}
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Commercial Offering Terms</label>
                    <button onClick={() => handleAiSuggest('terms')} disabled={!!isAiLoading || !isEditable} className="flex items-center space-x-2 px-4 py-1.5 bg-brand-50 text-brand-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-brand-100 hover:bg-brand-100 transition-all disabled:opacity-50">
                      {isAiLoading === 'terms' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>AI Draft Terms</span>
                    </button>
                  </div>
                  <textarea disabled={!isEditable} className="w-full p-6 bg-slate-50 rounded-[2rem] h-64 font-bold text-slate-900 outline-none shadow-inner border-2 border-transparent focus:border-brand-500 leading-relaxed custom-scrollbar uppercase text-xs" placeholder="DEFINE PAYMENT MILESTONES..." value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* HUD CONTROLS */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-6 z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="hidden sm:flex items-center space-x-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Aggregated Value</p>
                <p className="text-3xl font-black text-brand-500">Rs {totals.grandTotal.toLocaleString()}</p>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Workflow State</p>
                <p className="text-lg font-black text-white opacity-80 uppercase tracking-widest text-[10px]">VERIFICATION READY</p>
              </div>
           </div>
           
           <div className="flex space-x-4 w-full sm:w-auto">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="flex-1 sm:flex-none px-10 py-4 border-2 border-slate-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 hover:text-white transition-all">
                  Edit Lines
                </button>
              )}
              {step === 1 ? (
                <button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.lineItems?.length}
                  className="flex-1 sm:flex-none px-14 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-brand-500 hover:scale-105 transition-all disabled:opacity-50"
                >
                  Configure Proposal
                </button>
              ) : (
                <button 
                  onClick={handleFinalSubmit} 
                  disabled={isLocked && !isAdmin}
                  className="flex-1 sm:flex-none px-14 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-500 hover:text-white hover:scale-105 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <Archive size={18} />
                  <span>Archive & Lock</span>
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationEngine;
