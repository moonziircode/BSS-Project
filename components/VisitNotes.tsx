
import React, { useState, useMemo } from 'react';
import { VisitNote, VisitStatus } from '../types';
import { useAISummary, useAIAutoFillVisit, useAIImprovement } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';
import { MapPin, Sparkles, ChevronDown, ChevronUp, Navigation, Calendar, Edit, CheckCircle, Clock, CalendarDays, History, TrendingUp } from 'lucide-react';

interface VisitNotesProps {
  visits: VisitNote[];
  onSaveVisit: (visit: VisitNote) => void;
}

const VisitNotes: React.FC<VisitNotesProps> = ({ visits, onSaveVisit }) => {
  const [activeTab, setActiveTab] = useState<'PLANNED' | 'HISTORY'>('PLANNED');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { run: runSummary, loading: summaryLoading } = useAISummary();
  const { run: runAutofill, loading: autofillLoading } = useAIAutoFillVisit();
  const { run: runImprovement, loading: improveLoading } = useAIImprovement();

  const [formState, setFormState] = useState<Partial<VisitNote>>({
    partnerName: '',
    googleMapsLink: '',
    coordinates: '',
    visitDatePlan: '',
    visitDateActual: '',
    ordersLastMonth: 0,
    ordersDailyAvg: 0,
    findings: '',
    operationalIssues: '',
    suggestions: '',
    status: 'PLANNED',
    summary: ''
  });

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

  const handleGenerateSummary = async () => {
    if (!formState.findings) return;
    const summary = await runSummary(formState);
    setFormState(prev => ({ ...prev, summary }));
  };

  const handleImprovement = async (visit: VisitNote) => {
    const suggestion = await runImprovement(visit);
    if (suggestion) {
      alert(`AI Improvement Strategy:\n\n${suggestion}`);
    }
  };

  const handleEdit = (visit: VisitNote) => {
    setEditingId(visit.id);
    setFormState(visit);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkDone = (visit: VisitNote) => {
    const updated: VisitNote = {
      ...visit,
      status: 'DONE',
      visitDateActual: new Date().toLocaleDateString('en-CA'), 
    };
    onSaveVisit(updated);
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
      partnerName: formState.partnerName!,
      googleMapsLink: formState.googleMapsLink || '',
      coordinates: formState.coordinates || '',
      visitDatePlan: formState.visitDatePlan || '',
      visitDateActual: formState.visitDateActual || '',
      ordersLastMonth: Number(formState.ordersLastMonth) || 0,
      ordersDailyAvg: Number(formState.ordersDailyAvg) || 0,
      findings: formState.findings || '',
      operationalIssues: formState.operationalIssues || '',
      suggestions: formState.suggestions || '',
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
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Field Visit Notes</h2>
          <p className="text-gray-400 text-sm">Record visits & partner performance.</p>
        </div>
        <button 
          onClick={() => {
            if(isFormOpen) resetForm(); else setIsFormOpen(true);
          }}
          className="bg-bg-card hover:bg-slate-800 border border-neon/30 text-neon px-5 py-2.5 rounded-xl shadow-neu-flat font-bold transition-all active:scale-95 flex items-center gap-2"
        >
          {isFormOpen ? <XIcon /> : <PlusIcon />}
          {isFormOpen ? 'Close Form' : 'New Visit Plan'}
        </button>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="bg-bg-card p-6 rounded-3xl shadow-neu-flat border border-slate-700 mb-10 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
             <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Visit' : 'New Visit Plan'}</h3>
          </div>
          
          {!editingId && (
            <div className="bg-bg-main p-4 rounded-2xl shadow-neu-pressed mb-6 border border-slate-800">
               <h4 className="text-xs font-bold text-neon mb-2 uppercase tracking-wider">Smart Input (AI)</h4>
               <textarea 
                 className="w-full bg-transparent border-none text-white text-sm outline-none h-20 mb-2 resize-none"
                 placeholder="Paste raw notes: 'Partner ABC at Jl. Sudirman, printer issue...'"
                 value={rawInput}
                 onChange={(e) => setRawInput(e.target.value)}
               />
               <AIButton onClick={handleSmartParse} loading={autofillLoading} label="Autofill Form" size="sm" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Partner Name</label>
              <input 
                className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none focus:ring-1 focus:ring-neon transition-all"
                value={formState.partnerName}
                onChange={e => setFormState({...formState, partnerName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Coordinates</label>
                  <input 
                    className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                    placeholder="-6.200, 106.800"
                    value={formState.coordinates}
                    onChange={e => setFormState({...formState, coordinates: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Maps Link</label>
                  <input 
                    className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                    placeholder="https://maps..."
                    value={formState.googleMapsLink}
                    onChange={e => setFormState({...formState, googleMapsLink: e.target.value})}
                  />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                <h4 className="text-xs font-bold text-blue-400 mb-3 uppercase">Schedule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Plan Date</label>
                    <input 
                      type="date"
                      className="w-full bg-bg-main text-white rounded-lg p-2 text-xs shadow-neu-pressed outline-none"
                      value={formState.visitDatePlan}
                      onChange={e => setFormState({...formState, visitDatePlan: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Actual Date</label>
                    <input 
                      type="date"
                      className="w-full bg-bg-main text-white rounded-lg p-2 text-xs shadow-neu-pressed outline-none"
                      value={formState.visitDateActual}
                      onChange={e => setFormState({...formState, visitDateActual: e.target.value})}
                    />
                  </div>
                </div>
             </div>
             <div className="bg-neon/5 p-4 rounded-2xl border border-neon/10">
                <h4 className="text-xs font-bold text-neon mb-3 uppercase">Performance Data</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Total Orders (1 Mo)</label>
                    <input 
                      type="number"
                      className="w-full bg-bg-main text-white rounded-lg p-2 text-xs shadow-neu-pressed outline-none"
                      value={formState.ordersLastMonth}
                      onChange={e => setFormState({...formState, ordersLastMonth: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Avg / Day</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full bg-bg-main text-white rounded-lg p-2 text-xs shadow-neu-pressed outline-none"
                      value={formState.ordersDailyAvg}
                      onChange={e => setFormState({...formState, ordersDailyAvg: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
             </div>
          </div>

          <h3 className="text-sm font-bold text-gray-400 mb-3 mt-6 uppercase tracking-wider">Visit Findings</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Key Findings</label>
              <textarea 
                className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none h-20 resize-none"
                value={formState.findings}
                onChange={e => setFormState({...formState, findings: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Operational Issues</label>
              <textarea 
                className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none h-20 resize-none"
                value={formState.operationalIssues}
                onChange={e => setFormState({...formState, operationalIssues: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Suggestions</label>
              <textarea 
                className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none h-20 resize-none"
                value={formState.suggestions}
                onChange={e => setFormState({...formState, suggestions: e.target.value})}
              />
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="bg-purple-500/5 p-5 rounded-2xl border border-purple-500/20 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={14} /> AI Auto-Summary
              </h4>
              <AIButton onClick={handleGenerateSummary} loading={summaryLoading} label="Generate" size="sm" variant="secondary" />
            </div>
            <textarea 
              className="w-full bg-bg-main/50 border border-purple-500/20 rounded-xl p-3 text-sm text-gray-300 min-h-[80px] shadow-inner outline-none"
              placeholder="AI generated summary will appear here..."
              value={formState.summary}
              readOnly
            />
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={resetForm} className="px-5 py-2.5 text-gray-400 hover:text-white font-bold">Cancel</button>
            <button onClick={handleSubmit} disabled={!formState.partnerName} className="px-6 py-2.5 bg-neon text-white rounded-xl font-bold shadow-neon hover:bg-neon-hover disabled:opacity-50 disabled:shadow-none transition-all">
              {editingId ? 'Update' : 'Save Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
         <div className="bg-bg-card p-1.5 rounded-xl shadow-neu-pressed border border-slate-800 flex w-full sm:w-auto">
            <button 
               onClick={() => setActiveTab('PLANNED')}
               className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'PLANNED' ? 'bg-neon text-white shadow-neon' : 'text-gray-500 hover:text-gray-300'}`}
            >
               <CalendarDays size={16} /> Planned
            </button>
            <button 
               onClick={() => setActiveTab('HISTORY')}
               className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
               <History size={16} /> History
            </button>
         </div>

         <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-500 uppercase">Date Filter:</span>
            <input 
               type="date" 
               className="bg-bg-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none w-full sm:w-auto shadow-neu-flat"
               value={filterDate}
               onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
               <button onClick={() => setFilterDate('')} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            )}
         </div>
      </div>

      {/* List of Visits */}
      <div className="space-y-5">
        {filteredVisits.length === 0 ? (
           <div className="text-center py-16 text-gray-500 bg-bg-card rounded-3xl border border-dashed border-slate-700 shadow-neu-flat">
              {filterDate 
                ? `No visits on ${new Date(filterDate).toLocaleDateString('id-ID')}.` 
                : (activeTab === 'PLANNED' ? 'No planned visits.' : 'No completed visits history.')}
           </div>
        ) : (
           filteredVisits.map(visit => (
             <div key={visit.id} className="bg-bg-card rounded-2xl shadow-neu-flat border border-slate-800 overflow-hidden group hover:border-slate-600 transition-colors">
               <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}>
                   <div className={`p-4 rounded-2xl shadow-neu-flat ${visit.status === 'DONE' ? 'text-neon border border-neon/20' : 'text-purple-400 border border-purple-500/20'}`}>
                     <MapPin size={24} />
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-100">{visit.partnerName}</h3>
                        {visit.status === 'RESCHEDULED' && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">Rescheduled</span>}
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs text-gray-400 flex items-center gap-1">
                         <Calendar size={12}/> 
                         {visit.status === 'DONE' 
                           ? `Done: ${new Date(visit.visitDateActual).toLocaleDateString('id-ID')}`
                           : `Plan: ${visit.visitDatePlan ? new Date(visit.visitDatePlan).toLocaleDateString('id-ID') : 'Not scheduled'}`
                         }
                       </span>
                       {visit.ordersLastMonth > 0 && (
                         <span className="text-[10px] text-blue-400 font-bold border border-blue-500/30 px-2 py-0.5 rounded-full">
                           {visit.ordersLastMonth} Orders
                         </span>
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center gap-2 self-end sm:self-auto">
                    {visit.status !== 'DONE' && (
                       <>
                         <button onClick={() => setRescheduleId(visit.id)} className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg border border-amber-500/30 transition-colors"><Clock size={14}/> Reschedule</button>
                         <button onClick={() => handleEdit(visit)} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-600 transition-colors"><Edit size={14}/> Edit</button>
                         <button onClick={() => handleMarkDone(visit)} className="text-xs flex items-center gap-1 bg-neon text-white px-4 py-2 rounded-lg shadow-neon hover:bg-neon-hover transition-colors font-bold"><CheckCircle size={14}/> Done</button>
                       </>
                    )}
                    <button onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)} className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 transition-colors">
                       {expandedId === visit.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </button>
                 </div>
               </div>

               {expandedId === visit.id && (
                 <div className="p-5 border-t border-slate-800 bg-bg-main/50 space-y-4 text-sm text-gray-300 animate-slide-down">
                   <div className="flex flex-wrap gap-3 mb-2">
                      {visit.googleMapsLink && (
                         <a href={visit.googleMapsLink} target="_blank" className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-bg-card px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm"><Navigation size={12}/> Open Maps</a>
                      )}
                      {visit.coordinates && (<span className="text-xs text-gray-500 border border-slate-700 bg-bg-card px-3 py-1.5 rounded-lg">Coords: {visit.coordinates}</span>)}
                   </div>
                   {visit.summary && (
                     <div className="bg-bg-card p-4 rounded-xl border border-purple-500/20 shadow-neu-flat">
                       <span className="font-bold text-purple-400 block mb-2 text-xs flex items-center gap-2 uppercase tracking-wider"><Sparkles size={12}/> AI Summary</span>
                       <p className="italic text-gray-400 leading-relaxed">{visit.summary}</p>
                     </div>
                   )}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-bg-card p-4 rounded-xl border border-slate-800">
                       <span className="font-bold block text-white mb-2 border-b border-slate-700 pb-2 text-xs uppercase">Findings</span>
                       <p className="text-gray-400 whitespace-pre-line mt-1">{visit.findings || '-'}</p>
                     </div>
                     <div className="bg-bg-card p-4 rounded-xl border border-slate-800">
                       <span className="font-bold block text-white mb-2 border-b border-slate-700 pb-2 text-xs uppercase">Operational Issues</span>
                       <p className="text-gray-400 whitespace-pre-line mt-1">{visit.operationalIssues || '-'}</p>
                     </div>
                     <div className="bg-bg-card p-4 rounded-xl border border-slate-800">
                       <span className="font-bold block text-white mb-2 border-b border-slate-700 pb-2 text-xs uppercase">Suggestions</span>
                       <p className="text-gray-400 whitespace-pre-line mt-1">{visit.suggestions || '-'}</p>
                     </div>
                   </div>
                   <div className="mt-4">
                      <AIButton onClick={() => handleImprovement(visit)} loading={improveLoading} label="Strategic Recommendation" size="sm" variant="secondary" icon={TrendingUp} />
                   </div>
                 </div>
               )}
             </div>
           ))
        )}
      </div>

      {rescheduleId && (
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-bg-card p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700">
               <h3 className="text-lg font-bold mb-6 text-white">Reschedule Visit</h3>
               <input type="date" className="w-full bg-bg-main text-white border-none rounded-xl p-3 shadow-neu-pressed mb-6 outline-none" value={newDate} onChange={e => setNewDate(e.target.value)} />
               <div className="flex gap-4">
                  <button onClick={() => setRescheduleId(null)} className="flex-1 py-2.5 border border-slate-600 rounded-xl hover:bg-slate-800 text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleReschedule} disabled={!newDate} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold">Save</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default VisitNotes;
