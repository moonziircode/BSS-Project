
import React, { useState, useMemo } from 'react';
import { VisitNote, VisitStatus, Partner } from '../types';
import { useAISummary, useAIAutoFillVisit, useAIImprovement } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';
import { MapPin, Sparkles, ChevronDown, ChevronUp, Navigation, Calendar, Edit, CheckCircle, Clock, CalendarDays, History, TrendingUp, Trash2, Plus, X, Search } from 'lucide-react';

interface VisitNotesProps {
  visits: VisitNote[];
  partners: Partner[];
  onSaveVisit: (visit: VisitNote) => void;
  onDeleteVisit: (id: string) => void;
}

const VisitNotes: React.FC<VisitNotesProps> = ({ visits, partners, onSaveVisit, onDeleteVisit }) => {
  const [activeTab, setActiveTab] = useState<'PLANNED' | 'HISTORY'>('PLANNED');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Partner Autocomplete State
  const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false);

  const { run: runSummary, loading: summaryLoading } = useAISummary();
  const { run: runAutofill, loading: autofillLoading } = useAIAutoFillVisit();
  const { run: runImprovement, loading: improveLoading } = useAIImprovement();

  const [formState, setFormState] = useState<Partial<VisitNote>>({
    partnerName: '',
    googleMapsLink: '',
    coordinates: '',
    visitDatePlan: '',
    visitTime: '',
    visitDateActual: '',
    ordersLastMonth: 0,
    ordersDailyAvg: 0,
    findings: '',
    operationalIssues: '',
    suggestions: '',
    status: 'PLANNED',
    summary: ''
  });

  // --- Formatting Helpers ---
  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const filteredVisits = useMemo(() => {
    let filtered = visits;
    if (activeTab === 'PLANNED') {
       filtered = filtered.filter(v => v.status !== 'DONE');
    } else {
       filtered = filtered.filter(v => v.status === 'DONE');
    }
    if (filterDate) {
       if (activeTab === 'PLANNED') {
          filtered = filtered.filter(v => v.visitDatePlan === filterDate);
       } else {
          filtered = filtered.filter(v => v.visitDateActual === filterDate);
       }
    }
    return filtered.sort((a, b) => {
      const dateA = activeTab === 'PLANNED' ? a.visitDatePlan : a.visitDateActual;
      const dateB = activeTab === 'PLANNED' ? b.visitDatePlan : b.visitDateActual;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime(); 
    });
  }, [visits, activeTab, filterDate]);
  
  const suggestedPartners = useMemo(() => {
    if (!formState.partnerName) return [];
    const search = formState.partnerName.toLowerCase();
    return partners.filter(p => p.name.toLowerCase().includes(search)).slice(0, 5);
  }, [partners, formState.partnerName]);

  const handleSmartParse = async () => {
    if (!rawInput) return;
    const extractedData = await runAutofill(rawInput);
    if (extractedData) {
      setFormState(prev => ({
        ...prev,
        ...extractedData,
        ordersDailyAvg: extractedData.ordersLastMonth ? parseFloat((extractedData.ordersLastMonth / 30).toFixed(1)) : prev.ordersDailyAvg
      }));
    }
  };

  const handleSelectPartner = (p: Partner) => {
      let formattedMapLink = '';
      
      if (p.coordinates) {
          // Robustly parse lat, long.
          // Handle cases like "-6,200, 106,800" (comma decimals) or "-6.200, 106.800" (dot decimals)
          let lat = '', lng = '';
          
          // First, remove any whitespace to make splitting predictable
          // But wait, split by ", " (comma space) is a good heuristic if the data is clean.
          // Let's try to normalize to dots first.
          
          // Split by comma
          const parts = p.coordinates.split(',').map(s => s.trim());
          
          if (parts.length === 2) {
             // Standard "lat, lng" or "lat,lng"
             // Replace decimal commas with dots
             lat = parts[0].replace(',', '.').replace(/[^\d.-]/g, '');
             lng = parts[1].replace(',', '.').replace(/[^\d.-]/g, '');
          } else if (parts.length > 2) {
             // Messy case: "-6,200, 106,800" -> ["-6", "200", "106", "800"]
             // This happens if CSV import failed to clean up.
             // We can try to reconstruct:
             // Assume first two parts are Lat, next two are Lng?
             // Or better, just rely on the new PartnerManager logic which cleans this up.
             
             // Fallback heuristic:
             // Find the space?
             const partsSpace = p.coordinates.split(/\s+/);
             if (partsSpace.length === 2) {
                 lat = partsSpace[0].replace(',', '.').replace(/[^\d.-]/g, '');
                 lng = partsSpace[1].replace(',', '.').replace(/[^\d.-]/g, '');
             }
          }
          
          if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
              formattedMapLink = `https://www.google.com/maps?q=${lat},${lng}`;
          }
      }

      setFormState(prev => ({
          ...prev,
          partnerName: p.name,
          coordinates: p.coordinates || prev.coordinates,
          googleMapsLink: formattedMapLink || p.googleMapsLink || prev.googleMapsLink,
          ordersLastMonth: p.volumeM1 || prev.ordersLastMonth,
          ordersDailyAvg: p.volumeM1 ? Math.round(p.volumeM1 / 30) : prev.ordersDailyAvg
      }));
      setShowPartnerSuggestions(false);
  };

  const handleGenerateSummary = async () => {
    if (!formState.findings) return;
    const summary = await runSummary(formState);
    setFormState(prev => ({ ...prev, summary }));
  };

  const handleImprovement = async (visit: VisitNote) => {
    const suggestion = await runImprovement(visit);
    if (suggestion) {
      alert(`AI Strategy:\n\n${suggestion}`);
    }
  };

  const handleEdit = (e: React.MouseEvent, visit: VisitNote) => {
    e.stopPropagation();
    setEditingId(visit.id);
    setFormState(visit);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Permanently delete this visit?")) {
       onDeleteVisit(id);
    }
  };

  const handleMarkDone = (e: React.MouseEvent, visit: VisitNote) => {
    e.stopPropagation();
    const updated: VisitNote = {
      ...visit,
      status: 'DONE',
      visitDateActual: new Date().toLocaleDateString('en-CA'), 
    };
    onSaveVisit(updated);
  };

  const handleRescheduleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRescheduleId(id);
  };

  const handleReschedule = () => {
    if (!rescheduleId || !newDate) return;
    const visit = visits.find(v => v.id === rescheduleId);
    if (visit) {
      onSaveVisit({
        ...visit,
        visitDatePlan: newDate,
        status: 'RESCHEDULED'
      });
      setRescheduleId(null);
      setNewDate('');
    }
  };

  const handleSubmit = () => {
    if (!formState.partnerName) return;
    const newVisit: VisitNote = {
      id: editingId || Math.random().toString(36).substring(7),
      partnerName: toTitleCase(formState.partnerName!), // Force Title Case
      googleMapsLink: formState.googleMapsLink || '',
      coordinates: formState.coordinates || '',
      visitDatePlan: formState.visitDatePlan || '',
      visitTime: formState.visitTime || '',
      visitDateActual: formState.visitDateActual || '',
      ordersLastMonth: Number(formState.ordersLastMonth) || 0,
      ordersDailyAvg: Number(formState.ordersDailyAvg) || 0,
      findings: toSentenceCase(formState.findings || ''), // Force Sentence Case
      operationalIssues: toSentenceCase(formState.operationalIssues || ''), // Force Sentence Case
      suggestions: toSentenceCase(formState.suggestions || ''), // Force Sentence Case
      summary: formState.summary || '',
      status: (formState.status as VisitStatus) || 'PLANNED'
    };
    onSaveVisit(newVisit);
    resetForm();
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState({
      partnerName: '',
      googleMapsLink: '',
      coordinates: '',
      visitDatePlan: '',
      visitTime: '',
      visitDateActual: '',
      ordersLastMonth: 0,
      ordersDailyAvg: 0,
      findings: '',
      operationalIssues: '',
      suggestions: '',
      summary: '',
      status: 'PLANNED'
    });
    setRawInput('');
    setShowPartnerSuggestions(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Visits</h2>
          <p className="text-zinc-500 text-xs mt-1">Field reports.</p>
        </div>
        <button 
          onClick={() => {
            if(isFormOpen) resetForm(); else setIsFormOpen(true);
          }}
          className="bg-white text-black px-4 py-2 rounded-md text-xs font-medium shadow-glow hover:bg-zinc-200 transition-colors flex items-center gap-2"
        >
          {isFormOpen ? <X size={14} /> : <Plus size={14} />}
          {isFormOpen ? 'Close' : 'New Visit'}
        </button>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="glass-panel p-6 rounded-xl mb-10 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
             <h3 className="text-lg font-medium text-white">
                {editingId ? (formState.status === 'DONE' ? 'Edit History' : 'Edit Plan') : 'New Visit Plan'}
             </h3>
          </div>
          
          {!editingId && (
            <div className="bg-zinc-900/30 p-4 rounded-lg border border-white/10 mb-6">
               <div className="flex gap-2 items-start">
                  <textarea 
                    className="flex-1 bg-transparent border-none text-white text-sm outline-none h-12 resize-none placeholder-zinc-600"
                    placeholder="AI Paste: 'Partner ABC at Jl. Sudirman, needs printer check...'"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                  />
                  <AIButton onClick={handleSmartParse} loading={autofillLoading} label="Autofill" size="sm" />
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="relative">
              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Partner Name</label>
              <input 
                className="w-full bg-black text-white rounded-md p-3 border border-white/10 focus:border-white text-sm capitalize"
                value={formState.partnerName}
                onChange={e => {
                    setFormState({...formState, partnerName: e.target.value});
                    setShowPartnerSuggestions(true);
                }}
                onFocus={() => setShowPartnerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPartnerSuggestions(false), 200)}
                placeholder="Type to search partner..."
              />
              {showPartnerSuggestions && suggestedPartners.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-black border border-zinc-700 rounded-md mt-1 z-20 shadow-xl max-h-40 overflow-y-auto">
                      {suggestedPartners.map(p => (
                          <div 
                            key={p.id} 
                            className="p-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer flex justify-between"
                            onClick={() => handleSelectPartner(p)}
                          >
                              <span>{p.name}</span>
                              <span className="text-[10px] text-zinc-600 uppercase">{p.district}</span>
                          </div>
                      ))}
                  </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Coordinates</label>
                  <input 
                    className="w-full bg-black text-white rounded-md p-3 border border-white/10 text-sm"
                    placeholder="-6.200, 106.800"
                    value={formState.coordinates}
                    onChange={e => setFormState({...formState, coordinates: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Maps Link</label>
                  <input 
                    className="w-full bg-black text-white rounded-md p-3 border border-white/10 text-sm"
                    placeholder="https://maps..."
                    value={formState.googleMapsLink}
                    onChange={e => setFormState({...formState, googleMapsLink: e.target.value})}
                  />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             <div className="border border-white/10 p-4 rounded-lg">
                <h4 className="text-[10px] font-bold text-zinc-400 mb-3 uppercase">Schedule</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">PLAN DATE</label>
                    <input 
                      type="date"
                      className="w-full bg-black text-white rounded-md p-2 text-xs border border-white/10"
                      value={formState.visitDatePlan}
                      onChange={e => setFormState({...formState, visitDatePlan: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">TIME (OPTIONAL)</label>
                    <input 
                      type="time"
                      className="w-full bg-black text-white rounded-md p-2 text-xs border border-white/10"
                      value={formState.visitTime || ''}
                      onChange={e => setFormState({...formState, visitTime: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">ACTUAL DATE (DONE)</label>
                    <input 
                      type="date"
                      className="w-full bg-black text-white rounded-md p-2 text-xs border border-white/10"
                      value={formState.visitDateActual}
                      onChange={e => setFormState({...formState, visitDateActual: e.target.value})}
                    />
                </div>
             </div>
             <div className="border border-white/10 p-4 rounded-lg">
                <h4 className="text-[10px] font-bold text-zinc-400 mb-3 uppercase">Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">ORDERS (MO)</label>
                    <input 
                      type="number"
                      className="w-full bg-black text-white rounded-md p-2 text-xs border border-white/10"
                      value={formState.ordersLastMonth}
                      onChange={e => setFormState({...formState, ordersLastMonth: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">AVG / DAY</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full bg-black text-white rounded-md p-2 text-xs border border-white/10"
                      value={formState.ordersDailyAvg}
                      onChange={e => setFormState({...formState, ordersDailyAvg: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-4 mb-6 mt-6">
             {['findings', 'operationalIssues', 'suggestions'].map((field) => (
               <div key={field}>
                 <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">{field.replace(/([A-Z])/g, ' $1')}</label>
                 <textarea 
                   className="w-full bg-black text-white rounded-md p-3 border border-white/10 text-sm h-20 resize-none focus:border-white"
                   // @ts-ignore
                   value={formState[field]}
                   // @ts-ignore
                   onChange={e => setFormState({...formState, [field]: e.target.value})}
                 />
               </div>
             ))}
          </div>

          {/* AI Summary Section */}
          <div className="bg-zinc-900/30 p-4 rounded-lg border border-white/10 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={12} /> AI Summary
              </h4>
              <AIButton onClick={handleGenerateSummary} loading={summaryLoading} label="Generate" size="sm" variant="secondary" />
            </div>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-sm text-zinc-300 min-h-[80px] outline-none"
              placeholder="..."
              value={formState.summary}
              readOnly
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-white">Cancel</button>
            <button onClick={handleSubmit} disabled={!formState.partnerName} className="px-5 py-2 bg-white text-black rounded-md text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-1">
         <div className="flex gap-6">
            <button 
               onClick={() => setActiveTab('PLANNED')}
               className={`pb-3 text-xs font-semibold tracking-wider border-b-2 transition-all ${activeTab === 'PLANNED' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
               PLANNED
            </button>
            <button 
               onClick={() => setActiveTab('HISTORY')}
               className={`pb-3 text-xs font-semibold tracking-wider border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
               HISTORY
            </button>
         </div>

         <div className="flex items-center gap-2 pb-2">
            <input 
               type="date" 
               className="bg-transparent border border-white/10 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none"
               value={filterDate}
               onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
               <button onClick={() => setFilterDate('')} className="text-xs text-red-500"><X size={14}/></button>
            )}
         </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
           <div className="text-center py-16 text-zinc-600 bg-black/20 rounded-xl border border-dashed border-zinc-800">
              {activeTab === 'PLANNED' ? 'No scheduled visits.' : 'History empty.'}
           </div>
        ) : (
           filteredVisits.map(visit => (
             <div key={visit.id} className="glass-panel rounded-lg overflow-hidden hover:bg-zinc-900/20 transition-colors">
               <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}>
                   <div className={`p-3 rounded-md border ${visit.status === 'DONE' ? 'border-white/20 text-white bg-white/5' : 'border-zinc-700 text-zinc-500 bg-black'}`}>
                     <MapPin size={18} />
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-100">{visit.partnerName}</h3>
                        {visit.status === 'RESCHEDULED' && <span className="text-[9px] bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded border border-amber-900">Rescheduled</span>}
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs text-zinc-500 flex items-center gap-1 font-light">
                         <Calendar size={10}/> 
                         {visit.status === 'DONE' 
                           ? `${new Date(visit.visitDateActual).toLocaleDateString('en-CA')}`
                           : `${visit.visitDatePlan || 'Unscheduled'}`
                         }
                         {visit.visitTime && visit.status !== 'DONE' && (
                            <span className="flex items-center gap-1 text-zinc-400">
                                @ {visit.visitTime}
                            </span>
                         )}
                       </span>
                       {visit.ordersLastMonth > 0 && (
                         <span className="text-[9px] text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full">
                           {visit.ordersLastMonth} Orders
                         </span>
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center gap-2 self-end sm:self-auto">
                    {visit.status !== 'DONE' ? (
                       <>
                         <button onClick={(e) => handleRescheduleClick(e, visit.id)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors" title="Reschedule"><Clock size={14}/></button>
                         <button onClick={(e) => handleEdit(e, visit)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors" title="Edit"><Edit size={14}/></button>
                         <button onClick={(e) => handleDelete(e, visit.id)} className="p-2 hover:bg-red-900/20 rounded-md text-zinc-600 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14}/></button>
                         <button onClick={(e) => handleMarkDone(e, visit)} className="text-xs flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-md font-semibold hover:bg-zinc-200 transition-colors"><CheckCircle size={12}/> Done</button>
                       </>
                    ) : (
                       <button onClick={(e) => handleEdit(e, visit)} className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-600 transition-colors">
                          Details
                       </button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors">
                       {expandedId === visit.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                 </div>
               </div>

               {expandedId === visit.id && (
                 <div className="p-5 border-t border-white/10 bg-black/40 space-y-4 text-sm text-zinc-400">
                   <div className="flex flex-wrap gap-3 mb-4">
                      {visit.googleMapsLink && (
                         <a href={visit.googleMapsLink} target="_blank" className="text-xs flex items-center gap-1 text-zinc-300 hover:text-white bg-zinc-900 px-3 py-1.5 rounded border border-zinc-700"><Navigation size={12}/> Open Maps</a>
                      )}
                      {visit.coordinates && (<span className="text-xs text-zinc-500 border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 rounded">Coords: {visit.coordinates}</span>)}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {['findings', 'operationalIssues', 'suggestions'].map((k) => (
                        <div key={k} className="bg-black border border-white/10 p-3 rounded-md">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase block mb-2 border-b border-zinc-900 pb-1">{k}</span>
                          {/* @ts-ignore */}
                          <p className="text-xs text-zinc-300 leading-relaxed">{visit[k] || '-'}</p>
                        </div>
                     ))}
                   </div>

                   {visit.summary && (
                     <div className="bg-zinc-900/20 p-3 rounded-md border border-zinc-800 mt-4">
                       <span className="font-bold text-zinc-500 block mb-1 text-[10px] uppercase flex items-center gap-2"><Sparkles size={10}/> Summary</span>
                       <p className="text-xs italic text-zinc-400">{visit.summary}</p>
                     </div>
                   )}
                   <div className="mt-2">
                      <AIButton onClick={() => handleImprovement(visit)} loading={improveLoading} label="Strategy" size="sm" variant="secondary" icon={TrendingUp} />
                   </div>
                 </div>
               )}
             </div>
           ))
        )}
      </div>

      {rescheduleId && (
         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="glass-panel p-6 rounded-xl shadow-2xl w-full max-w-sm">
               <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-widest">Reschedule</h3>
               <input type="date" className="w-full bg-black text-white border border-white/10 rounded-md p-3 mb-6 outline-none text-sm" value={newDate} onChange={e => setNewDate(e.target.value)} />
               <div className="flex gap-3">
                  <button onClick={() => setRescheduleId(null)} className="flex-1 py-2 border border-zinc-700 rounded-md hover:bg-zinc-900 text-zinc-400 text-xs font-medium">Cancel</button>
                  <button onClick={handleReschedule} disabled={!newDate} className="flex-1 py-2 bg-white text-black rounded-md hover:bg-zinc-200 disabled:opacity-50 text-xs font-bold">Confirm</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default VisitNotes;
