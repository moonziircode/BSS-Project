
import React, { useState } from 'react';
import { SOP, Contact, Division } from '../types';
import { BookOpen, Users, Calculator, Search, ChevronDown, ChevronRight, Plus, Trash2, Phone, Mail, MessageSquarePlus } from 'lucide-react';
import { useAIAskSOP, useAIDraftMessage } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';

interface KnowledgeBaseProps {
  sops: SOP[];
  contacts: Contact[];
  onSaveSOP: (s: SOP) => void;
  onDeleteSOP: (id: string) => void;
  onSaveContact: (c: Contact) => void;
  onDeleteContact: (id: string) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ sops, contacts, onSaveSOP, onDeleteSOP, onSaveContact, onDeleteContact }) => {
  const [activeTab, setActiveTab] = useState<'SOP' | 'DIRECTORY' | 'CALCULATOR'>('SOP');
  const [search, setSearch] = useState('');
  const [expandedSOP, setExpandedSOP] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // AI Hooks
  const { run: runAskSOP, loading: asking } = useAIAskSOP();
  const { run: runDraft, loading: drafting } = useAIDraftMessage();
  const [aiAnswer, setAiAnswer] = useState('');

  // Calculator State
  const [dailyPkg, setDailyPkg] = useState(0);
  
  const calculateIncentive = (daily: number) => {
      const monthlyVol = daily * 26; // 26 working days
      const baseRate = 2500; // Rp per packet
      let bonus = 0;
      
      if (monthlyVol > 500) bonus = 500000;
      if (monthlyVol > 1000) bonus = 1500000;
      if (monthlyVol > 2000) bonus = 3500000;
      
      const totalRevenue = (monthlyVol * baseRate) + bonus;
      return { monthlyVol, baseRate, bonus, totalRevenue };
  };
  
  const calcResult = calculateIncentive(dailyPkg);

  // Filtered Data
  const filteredSOPs = sops.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.division.toLowerCase().includes(search.toLowerCase()));

  // --- CRUD Forms ---
  const [sopForm, setSopForm] = useState<Partial<SOP>>({ title: '', category: '', content: '' });
  const [contactForm, setContactForm] = useState<Partial<Contact>>({ name: '', role: '', phone: '', division: Division.OPS });

  const handleSave = () => {
      if (activeTab === 'SOP' && sopForm.title) {
          onSaveSOP({
              id: Math.random().toString(36).substring(7),
              title: sopForm.title!,
              category: sopForm.category!,
              content: sopForm.content!,
              tags: [],
              lastUpdated: new Date().toISOString()
          } as SOP);
      } else if (activeTab === 'DIRECTORY' && contactForm.name) {
          onSaveContact({
              id: Math.random().toString(36).substring(7),
              name: contactForm.name!,
              role: contactForm.role!,
              division: contactForm.division!,
              phone: contactForm.phone!,
              email: ''
          } as Contact);
      }
      setIsModalOpen(false);
      setSopForm({ title: '', category: '', content: '' });
      setContactForm({ name: '', role: '', phone: '', division: Division.OPS });
  };
  
  const handleDraft = async (c: Contact) => {
      const topic = prompt("Pesan ini tentang apa? (misal: Revisi Insentif)");
      if(!topic) return;
      
      const msg = await runDraft(c, topic);
      if(msg) {
          navigator.clipboard.writeText(msg);
          alert("Draft disalin ke clipboard:\n\n" + msg);
      }
  };

  return (
    <div className="space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
             <h2 className="text-3xl font-bold text-white tracking-tight">Knowledge Base</h2>
             <p className="text-zinc-500 text-xs mt-1">Central Intelligence Hub</p>
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
             <button onClick={() => setActiveTab('SOP')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'SOP' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><BookOpen size={14}/> SOPs</button>
             <button onClick={() => setActiveTab('DIRECTORY')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'DIRECTORY' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Users size={14}/> Directory</button>
             <button onClick={() => setActiveTab('CALCULATOR')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'CALCULATOR' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Calculator size={14}/> Simulator</button>
          </div>
        </header>

        {activeTab !== 'CALCULATOR' && (
            <>
                {activeTab === 'SOP' ? (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-4">
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-transparent text-zinc-200 text-sm outline-none placeholder-zinc-600" 
                                placeholder="Search SOP or Ask AI (e.g. 'Berapa denda telat scan?')"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <AIButton onClick={async () => {
                                const ans = await runAskSOP(search, sops);
                                setAiAnswer(ans || '');
                            }} loading={asking} label="Ask AI" size="sm" />
                            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-4 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"><Plus size={18}/></button>
                        </div>
                        {aiAnswer && (
                            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 animate-fade-in-down font-medium">
                                🤖 {aiAnswer}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-zinc-500 transition-colors" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-4 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"><Plus size={18}/></button>
                    </div>
                )}
            </>
        )}

        {activeTab === 'SOP' && (
            <div className="space-y-3">
                {filteredSOPs.map(sop => (
                    <div key={sop.id} className="glass-panel rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
                        <div 
                           className="p-4 flex items-center justify-between cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/50"
                           onClick={() => setExpandedSOP(expandedSOP === sop.id ? null : sop.id)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-500">{expandedSOP === sop.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-200">{sop.title}</h3>
                                    <span className="text-[10px] text-zinc-500 uppercase bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-bold tracking-wider">{sop.category}</span>
                                </div>
                            </div>
                            <button onClick={(e) => {e.stopPropagation(); onDeleteSOP(sop.id)}} className="text-zinc-600 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                        </div>
                        {expandedSOP === sop.id && (
                            <div className="p-6 bg-zinc-950 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 whitespace-pre-wrap">
                                {sop.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'DIRECTORY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContacts.map(c => (
                    <div key={c.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:bg-zinc-800/40 relative group border border-zinc-800 transition-colors">
                        <div>
                           <div className="flex justify-between items-start">
                               <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-lg mb-4 border border-zinc-700">
                                   {c.name.charAt(0)}
                               </div>
                               <span className="text-[9px] text-zinc-500 border border-zinc-800 px-2 py-1 rounded-full uppercase font-bold tracking-wide">{c.division}</span>
                           </div>
                           <h3 className="text-base font-bold text-white">{c.name}</h3>
                           <p className="text-xs text-zinc-400 mt-1">{c.role}</p>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                <Phone size={14} className="text-zinc-600"/> {c.phone}
                            </div>
                        </div>
                         <button onClick={() => onDeleteContact(c.id)} className="absolute top-4 right-4 text-zinc-700 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                         
                         <button onClick={() => handleDraft(c)} className="absolute bottom-4 right-4 text-zinc-400 hover:text-white text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 font-bold">
                            <MessageSquarePlus size={14} /> Draft WA
                         </button>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'CALCULATOR' && (
            <div className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto border border-zinc-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Calculator className="text-emerald-400"/> Incentive Simulator
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-zinc-500 uppercase">Average Packets / Day</label>
                        <input 
                           type="number" 
                           className="w-full text-4xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white font-mono focus:border-zinc-500 transition-colors"
                           value={dailyPkg}
                           onChange={e => setDailyPkg(Number(e.target.value))}
                        />
                        <p className="text-xs text-zinc-500">Try entering 20, 50, or 100 to see bonus tiers.</p>
                    </div>
                    
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-inner">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400 font-medium">Est. Monthly Volume</span>
                            <span className="text-white font-mono">{calcResult.monthlyVol.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400 font-medium">Base Revenue</span>
                            <span className="text-white font-mono">Rp {(calcResult.monthlyVol * calcResult.baseRate).toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-emerald-400 font-medium">Performance Bonus</span>
                            <span className="text-emerald-400 font-mono">+ Rp {calcResult.bonus.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-zinc-800 pt-4 mt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Total Income</span>
                            <span className="text-xl font-bold text-white font-mono">Rp {calcResult.totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Modal for Add SOP/Contact */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass-panel w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-zinc-700 animate-scale-up">
                   <h3 className="text-lg font-bold text-white mb-6">Add New Item</h3>
                   {activeTab === 'SOP' && (
                       <div className="space-y-4">
                           <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" placeholder="SOP Title" value={sopForm.title} onChange={e => setSopForm({...sopForm, title: e.target.value})} />
                           <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" placeholder="Category (e.g. Ops, Claims)" value={sopForm.category} onChange={e => setSopForm({...sopForm, category: e.target.value})} />
                           <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white h-32 resize-none" placeholder="Content (Markdown supported)..." value={sopForm.content} onChange={e => setSopForm({...sopForm, content: e.target.value})} />
                       </div>
                   )}
                   {activeTab === 'DIRECTORY' && (
                       <div className="space-y-4">
                           <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" placeholder="Name" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                           <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" placeholder="Role" value={contactForm.role} onChange={e => setContactForm({...contactForm, role: e.target.value})} />
                           <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" placeholder="Phone" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
                           <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white appearance-none" value={contactForm.division} onChange={e => setContactForm({...contactForm, division: e.target.value as Division})}>
                               {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                       </div>
                   )}
                   <div className="flex gap-3 pt-6">
                       <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-zinc-500 text-xs font-bold hover:text-white transition-colors">Cancel</button>
                       <button onClick={handleSave} className="flex-1 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 shadow-glow transition-all">Save</button>
                   </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default KnowledgeBase;
