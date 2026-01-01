
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, MapPin, X, Phone, User, Building2,
  Loader2, Contact2, Building, Save, Globe, Landmark,
  Mic, MicOff, Sparkles, History, FileText, ClipboardList,
  CheckCircle2, Send, Info, Mail, MessageSquare, ChevronRight,
  Pencil, Eraser, Trash2, Layers, AlertCircle, Smartphone
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Customer, CustomerType, InterestType, VisitLog } from '../types';
import { getCustomers, saveCustomer } from '../services/db';
import { generateMeetingMinutes } from '../services/geminiService';

// --- Helpers ---
function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sanitizePhone = (phone: string) => phone.replace(/\D/g, ''); 

const formatMobileInput = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMeetingClient, setActiveMeetingClient] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [padMode, setPadMode] = useState<'text' | 'ink'>('ink');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [inkColor] = useState('#0f172a');
  const [isEraser, setIsEraser] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);

  const initialFormState: Partial<Customer> = {
    customerType: CustomerType.COMMERCIAL,
    interestType: InterestType.SALES,
    messageConsent: true,
    visitHistory: [],
    name: '',
    phone: '',
    location: '',
    address: '',
    contactPerson: '',
    designation: '',
    email: '',
    alternatePhone: ''
  };

  const [formData, setFormData] = useState<Partial<Customer>>(initialFormState);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  useEffect(() => {
    if (activeMeetingClient && padMode === 'ink' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
      }
    }
  }, [activeMeetingClient, padMode]);

  const startDrawing = (e: React.PointerEvent) => {
    if (!ctxRef.current) return;
    isDrawingRef.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    draw(e);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !ctxRef.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const pressure = e.pressure || 0.5;
    ctxRef.current.lineWidth = isEraser ? 20 : (2 + pressure * 4);
    ctxRef.current.strokeStyle = isEraser ? '#f1f5f9' : inkColor;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (ctxRef.current) ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSaveCustomer = () => {
    setFormError(null);
    const isResidential = formData.customerType === CustomerType.RESIDENTIAL;
    
    const identityFields = ['name', 'location', 'address'];
    const missingIdentity = identityFields.filter(f => !formData[f as keyof Customer]);
    
    if (missingIdentity.length > 0) {
      setFormError("Client Name, Location, and Address are mandatory.");
      return;
    }

    const cleanMobile = sanitizePhone(formData.alternatePhone || '');
    if (cleanMobile.length !== 11) {
      setFormError("Mobile Number must be exactly 11 digits (Format: 03XX-XXXXXXX).");
      return;
    }

    if (!isResidential) {
      const contactFields = ['contactPerson', 'designation', 'email'];
      const missingContact = contactFields.filter(f => !formData[f as keyof Customer]);
      if (missingContact.length > 0) {
        setFormError("For Business clients, Contact Person details are mandatory.");
        return;
      }

      if (!isValidEmail(formData.email!)) {
        setFormError("Please provide a valid company email address.");
      }
    }

    try {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        visitHistory: [],
        name: formData.name!,
        location: formData.location!,
        address: formData.address!,
        phone: isResidential ? '' : sanitizePhone(formData.phone || ''),
        contactPerson: isResidential ? formData.name! : formData.contactPerson!,
        designation: isResidential ? 'Owner' : formData.designation!,
        email: isResidential ? '' : formData.email!,
        alternatePhone: formData.alternatePhone!,
        customerType: formData.customerType as CustomerType,
        interestType: formData.interestType as InterestType,
        messageConsent: formData.messageConsent || false
      };

      saveCustomer(newCustomer);
      setCustomers(getCustomers());
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      setFormError("Technical error saving record.");
    }
  };

  const startLiveTranscription = async () => {
    if (isLiveActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are a professional secretary. Focus on transcribing business meeting details exactly as spoken."
        } as any,
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e: any) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const base64Data = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then((session: any) => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.inputTranscription) {
              setLiveTranscription(prev => prev + ' ' + message.serverContent?.inputTranscription?.text);
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: () => setIsLiveActive(false)
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error(err);
      alert("Microphone access required for Live Transcription."); 
    }
  };

  const stopLiveTranscription = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    setIsLiveActive(false);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const handleGenerateMoM = async () => {
    setIsAiProcessing(true);
    try {
      const combinedNotes = `[Manual Notes]: ${meetingNotes}\n\n[Transcript]: ${liveTranscription}`;
      let canvasData = undefined;
      if (canvasRef.current) canvasData = canvasRef.current.toDataURL('image/png');
      const minutes = await generateMeetingMinutes(combinedNotes, activeMeetingClient?.name || 'Client', 'SCPL Rep', canvasData);
      setGeneratedMinutes(minutes);
    } catch (err) { alert("AI Generation failed."); } finally { setIsAiProcessing(false); }
  };

  const saveMeetingToHistory = () => {
    if (!activeMeetingClient) return;
    const newVisit: VisitLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      lat: 0, lng: 0, userName: 'SCPL Rep',
      notes: meetingNotes + (liveTranscription ? `\n\n[Transcript]: ${liveTranscription}` : ''),
      meetingMinutes: generatedMinutes
    };
    const updated = { ...activeMeetingClient, visitHistory: [newVisit, ...activeMeetingClient.visitHistory] };
    saveCustomer(updated);
    setCustomers(getCustomers());
    setActiveMeetingClient(updated);
    alert("Meeting successfully committed to client history.");
    setMeetingNotes(''); setLiveTranscription(''); setGeneratedMinutes('');
    if (canvasRef.current) clearCanvas();
  };

  const sendWhatsApp = () => {
    if (!activeMeetingClient || !generatedMinutes) return;
    const digits = sanitizePhone(activeMeetingClient.alternatePhone);
    const cleanMobile = digits.startsWith('0') ? '92' + digits.slice(1) : digits;
    
    const text = encodeURIComponent(`*SCPL Meeting Minutes*\n\nDear ${activeMeetingClient.contactPerson || activeMeetingClient.name},\n\nThank you for the meeting today. Summary:\n\n${generatedMinutes}`);
    window.open(`https://wa.me/${cleanMobile}?text=${text}`, '_blank');
  };

  const sendEmail = () => {
    if (!activeMeetingClient || !generatedMinutes) return;
    const subject = encodeURIComponent(`Meeting Minutes - SCPL / ${activeMeetingClient.name}`);
    const bodyText = `Dear ${activeMeetingClient.contactPerson || activeMeetingClient.name},\n\nPlease find the meeting minutes below:\n\n${generatedMinutes}\n\nBest regards,\nStructura Chemicals Team`;
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${activeMeetingClient.email}?subject=${subject}&body=${body}`;
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sanitizePhone(c.phone).includes(sanitizePhone(searchTerm)) ||
    sanitizePhone(c.alternatePhone).includes(sanitizePhone(searchTerm))
  );

  const getInterestBadgeStyles = (type: InterestType) => {
    switch (type) {
      case InterestType.SALES: return 'bg-blue-100 text-blue-600';
      case InterestType.SERVICES: return 'bg-purple-100 text-purple-600';
      case InterestType.NOLIFT: return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const isResidentialMode = formData.customerType === CustomerType.RESIDENTIAL;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Customer Hub</h1>
          <p className="text-slate-500 font-bold text-sm mt-2 italic tracking-tight">Structura Chemicals Verified Directory</p>
        </div>
        <button onClick={() => { setFormError(null); setIsModalOpen(true); }} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
          + Register Customer
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-5 bg-slate-50 border-b flex items-center space-x-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input placeholder="Search company, phone or mobile..." className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none font-bold transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b">
                <tr>
                   <th className="px-8 py-4">Client Name & Location</th>
                   <th className="px-8 py-4">Primary Contact</th>
                   <th className="px-8 py-4">Interest Profile</th>
                   <th className="px-8 py-4 text-right">Site Intelligence</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(c => (
                   <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                         <p className="font-black text-slate-900 text-lg leading-none mb-1 group-hover:text-brand-600 transition-colors">{c.name}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center">
                            <MapPin size={10} className="mr-1" /> {c.location}
                         </p>
                      </td>
                      <td className="px-8 py-6">
                         <p className="font-bold text-slate-800 text-sm flex items-center">
                            <User size={12} className="mr-2 text-slate-400" /> {c.contactPerson}
                         </p>
                         <div className="flex flex-col space-y-1 mt-1">
                            {c.phone && <span className="text-[10px] text-slate-400 font-medium flex items-center"><Phone size={10} className="mr-2" /> Land: {c.phone}</span>}
                            <span className="text-[10px] text-brand-600 font-black flex items-center"><Smartphone size={10} className="mr-2" /> Mob: {c.alternatePhone}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getInterestBadgeStyles(c.interestType)}`}>
                            {c.interestType}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button onClick={() => setActiveMeetingClient(c)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center space-x-2 ml-auto">
                            <span>Open Site Pad</span>
                            <ChevronRight size={14} />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tight">Customer Registration</h2>
                <button onClick={() => { setIsModalOpen(false); setFormData(initialFormState); }} className="p-3 bg-white/10 rounded-2xl hover:bg-red-500 transition-all">
                  <X size={24} />
                </button>
             </div>
             
             <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
                {formError && (
                  <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-center space-x-4 text-red-600 animate-in fade-in zoom-in-95">
                    <AlertCircle size={24} />
                    <p className="font-black uppercase text-sm tracking-tight">{formError}</p>
                  </div>
                )}

                <div className="space-y-6">
                   <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest border-b-2 border-slate-100 pb-2 flex items-center">
                     <Building2 size={16} className="mr-2" /> Profile & Identity
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Type *</label>
                        <select className="w-full p-4 bg-slate-100 rounded-2xl font-black text-slate-900 text-xs outline-none border-2 border-transparent focus:border-brand-500" value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})}>
                           {Object.values(CustomerType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {isResidentialMode ? "Client Name *" : "Company Name *"}
                        </label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-500 outline-none" value={formData.name} placeholder="Full Legal Name" onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      
                      {!isResidentialMode && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Landline (Optional)</label>
                          <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-500 outline-none" value={formData.phone} placeholder="e.g. 02131234567" onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                          {isResidentialMode ? "Mobile Number (WhatsApp) *" : "Lead Mobile (WhatsApp) *"}
                        </label>
                        <input 
                          className="w-full p-4 bg-brand-50 border-2 border-brand-200 focus:border-brand-600 rounded-2xl font-black text-brand-900 outline-none" 
                          placeholder="03XX-XXXXXXX" 
                          value={formData.alternatePhone} 
                          onChange={e => setFormData({...formData, alternatePhone: formatMobileInput(e.target.value)})} 
                        />
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Required format: 0300-8735241</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location *</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-500 outline-none" value={formData.location} placeholder="Phase/City" onChange={e => setFormData({...formData, location: e.target.value})} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address *</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-500 outline-none" value={formData.address} placeholder="Street, Plot, Area" onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                   </div>
                </div>

                {!isResidentialMode && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 flex items-center">
                       <Contact2 size={16} className="mr-2 text-brand-500" /> Company Contact Person
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name *</label>
                            <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-brand-500 outline-none text-sm" placeholder="Official Representative" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation *</label>
                            <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-brand-500 outline-none text-sm" placeholder="e.g. Project Manager" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Email *</label>
                            <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-brand-500 outline-none text-sm" placeholder="person@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                          </div>
                     </div>
                  </div>
                )}

                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                   <div className="flex-1">
                      <p className="font-black text-emerald-900 uppercase tracking-tight">Messaging Consent</p>
                      <p className="text-xs text-emerald-700 opacity-80 mt-1">Required for automated dispatch of Quotations and MoMs.</p>
                   </div>
                   <button 
                      onClick={() => setFormData({...formData, messageConsent: !formData.messageConsent})}
                      className={`w-20 h-10 rounded-full relative transition-all ${formData.messageConsent ? 'bg-emerald-600 shadow-inner' : 'bg-slate-300'}`}
                   >
                      <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all ${formData.messageConsent ? 'left-11' : 'left-1'}`} />
                   </button>
                </div>
             </div>

             <div className="px-10 py-8 border-t bg-slate-50 flex space-x-6 shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); setFormData(initialFormState); }} className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Discard</button>
                <button type="button" onClick={handleSaveCustomer} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Onboard Client</button>
             </div>
          </div>
        </div>
      )}

      {activeMeetingClient && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/95 p-0 sm:p-2 backdrop-blur-3xl">
           <div className="bg-white w-full h-full sm:h-[98vh] sm:max-w-[98vw] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12">
              <div className="px-6 py-3 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                 <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-black text-sm shadow-lg">
                       {activeMeetingClient.name.charAt(0)}
                    </div>
                    <div>
                       <h2 className="text-sm font-black uppercase tracking-tight leading-none text-slate-100">{activeMeetingClient.name}</h2>
                       <div className="flex items-center space-x-2 mt-0.5">
                          <p className="text-[7px] text-brand-500 font-bold uppercase tracking-widest">Active Site Pad</p>
                          <span className="text-slate-700">|</span>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{activeMeetingClient.location}</p>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-3">
                    <div className="flex bg-slate-800 p-1 rounded-xl">
                       <button onClick={() => setPadMode('ink')} className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${padMode === 'ink' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500'}`}>Ink Mode</button>
                       <button onClick={() => setPadMode('text')} className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${padMode === 'text' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500'}`}>Text Mode</button>
                    </div>
                    <button onClick={() => setActiveMeetingClient(null)} className="p-1.5 bg-white/5 rounded-lg hover:bg-red-500 transition-all text-slate-400 hover:text-white"><X size={18} /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
                 <div className="flex-1 p-4 sm:p-6 flex flex-col space-y-4 bg-white border-r border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                       <div className="flex items-center space-x-6">
                          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <ClipboardList size={12} className="mr-2 text-brand-500" /> Professional Pad
                          </h3>
                          {padMode === 'ink' && (
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 space-x-2 border border-slate-200">
                               <button onClick={() => setIsEraser(false)} className={`p-1.5 rounded ${!isEraser ? 'bg-white shadow text-brand-600' : 'text-slate-400'}`}><Pencil size={14} /></button>
                               <button onClick={() => setIsEraser(true)} className={`p-1.5 rounded ${isEraser ? 'bg-white shadow text-brand-600' : 'text-slate-400'}`}><Eraser size={14} /></button>
                               <div className="w-px h-4 bg-slate-200 mx-1"></div>
                               <button onClick={clearCanvas} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          )}
                       </div>
                       <div className="flex space-x-2">
                          {!isLiveActive ? (
                            <button onClick={startLiveTranscription} className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[8px] uppercase tracking-widest border border-emerald-100">
                               <Mic size={10} /> <span>Live Feed</span>
                            </button>
                          ) : (
                            <button onClick={stopLiveTranscription} className="flex items-center space-x-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg font-black text-[8px] uppercase tracking-widest border border-red-100 animate-pulse">
                               <MicOff size={10} /> <span>Recording...</span>
                            </button>
                          )}
                       </div>
                    </div>
                    <div className="flex-1 relative bg-slate-100 rounded-[1.5rem] border-4 border-slate-300 shadow-inner overflow-hidden cursor-crosshair">
                       {padMode === 'ink' && <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }} />}
                       {padMode === 'ink' ? (
                          <canvas ref={canvasRef} className="w-full h-full touch-none" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} />
                       ) : (
                          <textarea className="w-full h-full p-8 bg-transparent outline-none font-black text-slate-900 text-lg leading-relaxed custom-scrollbar" placeholder="Type manual observations..." value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} />
                       )}
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0 px-2">
                       <p>{padMode === 'ink' ? 'Pen Input Active (Multimodal AI)' : 'Keyboard Input Active'}</p>
                       <button onClick={handleGenerateMoM} disabled={isAiProcessing} className="flex items-center space-x-2 text-brand-600 hover:text-brand-700 transition-all group">
                          {isAiProcessing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:rotate-12" />}
                          <span className="text-[10px] tracking-tight">AI Finalize</span>
                       </button>
                    </div>
                 </div>
                 <div className="w-full lg:w-96 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col border-l border-slate-200">
                    <div className="p-6 space-y-8">
                       <div className="space-y-4">
                          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center border-b border-slate-200 pb-2">
                             <CheckCircle2 size={14} className="mr-2 text-brand-600" /> Minutes of Meeting (MoM)
                          </h3>
                          {generatedMinutes ? (
                             <div className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Final Draft (Editable)</label>
                                   <textarea className="w-full p-5 bg-white rounded-2xl border-2 border-brand-500/20 text-[11px] text-slate-800 leading-relaxed font-bold shadow-xl shadow-brand-500/5 h-80 focus:border-brand-500 outline-none resize-none custom-scrollbar transition-all" value={generatedMinutes} onChange={(e) => setGeneratedMinutes(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   <button onClick={sendWhatsApp} className="flex items-center justify-center space-x-2 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase hover:bg-emerald-700"><MessageSquare size={14} /> <span>WhatsApp</span></button>
                                   <button onClick={sendEmail} className="flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase hover:bg-blue-700"><Mail size={14} /> <span>Email</span></button>
                                </div>
                                <button onClick={saveMeetingToHistory} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-black transition-all">Archive Project State</button>
                             </div>
                          ) : (
                             <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30 grayscale">
                                <Layers size={48} className="text-brand-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sketch your site plans.<br/>AI will interpret dimensions.</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
