
import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Search, DollarSign, Upload, X, Info, AlertTriangle, Layers, Box, FileText, CheckCircle2, Archive, Lock } from 'lucide-react';
import { Product, UserRole } from '../types';
import { getProducts, saveProduct, bulkUpsertProducts, getSettings, getCurrentUser } from '../services/db';
import { UOMS } from '../constants';

const ProductCatalog: React.FC = () => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ count: number, type: 'success' | 'error' } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    uom: 'Kgs',
    category: '',
    packaging: 'Drum'
  });

  useEffect(() => {
    setProducts(getProducts());
    const settings = getSettings();
    setCategories(settings.categories);
    setFormData(prev => ({ ...prev, category: settings.categories[0] || '' }));
  }, []);

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.name || !formData.basePrice) {
      alert("Product Name and Base Price are required.");
      return;
    }
    const product: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      basePrice: Number(formData.basePrice),
      category: formData.category || categories[0] || 'General',
      uom: formData.uom || 'Units',
      packaging: formData.packaging || 'Standard',
      description: formData.description || ''
    };
    saveProduct(product);
    setProducts(getProducts());
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ uom: 'Kgs', category: categories[0] || '', packaging: 'Drum' });
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
    setIsModalOpen(true);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const mappings: Partial<Product>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 5) {
          mappings.push({
            name: parts[0]?.replace(/^["']|["']$/g, '').trim(),
            category: parts[1]?.replace(/^["']|["']$/g, '').trim(),
            packaging: parts[2]?.replace(/^["']|["']$/g, '').trim(),
            uom: parts[3]?.replace(/^["']|["']$/g, '').trim(),
            basePrice: parseFloat(parts[4]?.replace(/[^0-9.]/g, '') || '0'),
            description: parts[5]?.replace(/^["']|["']$/g, '').trim()
          });
        }
      }

      if (mappings.length > 0) {
        const result = bulkUpsertProducts(mappings);
        setUploadStatus({ count: result.addedCount + result.updatedCount, type: 'success' });
        setProducts(getProducts());
        setTimeout(() => setUploadStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-slate-900 p-6 rounded-[2rem] flex items-center space-x-4 border-l-8 border-brand-500 text-white shadow-xl animate-in fade-in duration-500">
           <Lock className="text-brand-500 shrink-0" size={24} />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Catalog Authority: View-Only Mode Enabled for Sales Personnel</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Product Master</h1>
          <p className="text-slate-500 font-bold text-sm">Manage chemical specifications and available variants</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          {isAdmin && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
              >
                <Upload size={18} />
                <span>Bulk CSV</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                <Plus size={18} />
                <span>Register Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {uploadStatus && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <p className="text-emerald-700 font-bold text-sm">Successfully processed {uploadStatus.count} catalog records.</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by Name or Category..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            onClick={() => isAdmin && openEdit(product)}
            className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-all">
              <Package size={24} />
            </div>
            
            <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 truncate" title={product.name}>{product.name}</h3>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <Box size={12} className="mr-2" /> {product.category}
              </div>
              <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <Layers size={12} className="mr-2" /> {product.packaging} ({product.uom})
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Base Rate</p>
                <p className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">Rs {product.basePrice.toLocaleString()}</p>
              </div>
              {!isAdmin && <Lock size={14} className="text-slate-200" />}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">{editingProduct ? 'Product Authority Edit' : 'New Item Registration'}</h2>
                 <p className="text-[10px] text-brand-500 font-black tracking-[0.3em] mt-1">CATALOG MASTER</p>
               </div>
               <button onClick={closeModal} className="p-3 bg-white/10 rounded-2xl hover:bg-red-500 transition-all">
                 <X size={24} />
               </button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <div className="flex items-center space-x-2 border-b-2 border-slate-100 pb-2">
                     <FileText size={16} className="text-brand-500" />
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Core Identity</h4>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name *</label>
                     <input 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-bold" 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                     />
                   </div>
                 </div>

                 <div className="space-y-6">
                   <div className="flex items-center space-x-2 border-b-2 border-slate-100 pb-2">
                     <DollarSign size={16} className="text-brand-500" />
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Commercial Details</h4>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate (PKR) *</label>
                     <input 
                      type="number"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 rounded-2xl outline-none font-black text-2xl text-brand-600" 
                      value={formData.basePrice || ''} 
                      onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} 
                     />
                   </div>
                 </div>
               </div>
            </div>

            <div className="px-10 py-8 border-t bg-slate-50 flex justify-end space-x-4 shrink-0">
               <button onClick={closeModal} className="px-8 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Discard</button>
               <button onClick={handleSave} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Commit Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
