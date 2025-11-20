
import React, { useState, useMemo } from 'react';
import { VisitNote, VisitStatus } from '../types';
import { generateVisitSummary, parseVisitNoteRaw } from '../services/geminiService';
import { MapPin, Sparkles, Loader2, ChevronDown, ChevronUp, Navigation, Calendar, Bot, Edit, CheckCircle, Clock, CalendarDays, History } from 'lucide-react';

interface VisitNotesProps {
  visits: VisitNote[];
  onSaveVisit: (visit: VisitNote) => void;
}

const VisitNotes: React.FC<VisitNotesProps> = ({ visits, onSaveVisit }) => {
  const [activeTab, setActiveTab] = useState<'PLANNED' | 'HISTORY'>('PLANNED');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');

  // State for editing rescheduling
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
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
    status: 'PLANNED'
  });

  // --- Helpers ---
  
  const filteredVisits = useMemo(() => {
    let filtered = visits;

    // Tab Filter
    if (activeTab === 'PLANNED') {
       filtered = filtered.filter(v => v.status !== 'DONE');
    } else {
       filtered = filtered.filter(v => v.status === 'DONE');
    }

    // Date Filter (Only active if set)
    if (filterDate) {
       if (activeTab === 'PLANNED') {
          filtered = filtered.filter(v => v.visitDatePlan === filterDate);
       } else {
          filtered = filtered.filter(v => v.visitDateActual === filterDate);
       }
    }

    // Sort: Planned by PlanDate, History by ActualDate
    return filtered.sort((a, b) => {
      const dateA = activeTab === 'PLANNED' ? a.visitDatePlan : a.visitDateActual;
      const dateB = activeTab === 'PLANNED' ? b.visitDatePlan : b.visitDateActual;
      return new Date(dateB).getTime() - new Date(dateA).getTime(); // Descending
    });
  }, [visits, activeTab, filterDate]);

  const handleSmartParse = async () => {
    if (!rawInput) return;
    setIsParsing(true);
    try {
      const extractedData = await parseVisitNoteRaw(rawInput);
      setFormState(prev => ({
        ...prev,
        ...extractedData,
        ordersDailyAvg: extractedData.ordersLastMonth ? parseFloat((extractedData.ordersLastMonth / 30).toFixed(1)) : prev.ordersDailyAvg
      }));
    } catch (error) {
      console.error("Parsing failed", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!formState.findings) return;
    
    setIsGenerating(true);
    const summary = await generateVisitSummary(
      formState.findings || '',
      formState.operationalIssues || '',
      formState.suggestions || ''
    );
    
    setFormState(prev => ({ ...prev, summary }));
    setIsGenerating(false);
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
      visitDateActual: new Date().toLocaleDateString('en-CA'), // Set today as actual
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
      summary: formState.summary,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Field Visit Notes</h2>
          <p className="text-gray-500 text-sm">Catat kunjungan & performa pengusaha.</p>
        </div>
        <button 
          onClick={() => {
            if(isFormOpen) resetForm(); else setIsFormOpen(true);
          }}
          className="bg-anteraja-purple hover:bg-purple-800 text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2"
        >
          {isFormOpen ? <XIcon /> : <PlusIcon />}
          {isFormOpen ? 'Tutup Form' : 'Rencana Visit Baru'}
        </button>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 mb-8 animate-fade-in-down">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Data Kunjungan' : 'Input Rencana Kunjungan'}</h3>
          </div>
          
          {/* Smart Input Section (Only in Create Mode for simplicity) */}
          {!editingId && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                   <Bot size={16} /> Smart Input (AI)
                 </h4>
               </div>
               <p className="text-xs text-indigo-600 mb-2">
                 Paste raw text chat/catatan kasar, AI akan mengisi form.
               </p>
               <textarea 
                 className="w-full border border-indigo-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 mb-2"
                 placeholder="Contoh: Pengusaha ABC di Jl. Sudirman, isu printer rusak..."
                 value={rawInput}
                 onChange={(e) => setRawInput(e.target.value)}
               />
               <button 
                 onClick={handleSmartParse}
                 disabled={isParsing || !rawInput}
                 className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
               >
                 {isParsing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                 Autofill Form
               </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengusaha / Toko</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-anteraja-purple outline-none"
                value={formState.partnerName}
                onChange={e => setFormState({...formState, partnerName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titik Koordinat</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-anteraja-purple outline-none"
                    placeholder="-6.200, 106.800"
                    value={formState.coordinates}
                    onChange={e => setFormState({...formState, coordinates: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Maps</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-anteraja-purple outline-none"
                    placeholder="https://maps.app..."
                    value={formState.googleMapsLink}
                    onChange={e => setFormState({...formState, googleMapsLink: e.target.value})}
                  />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2">Jadwal Kunjungan</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rencana Visit</label>
                    <input 
                      type="date"
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      value={formState.visitDatePlan}
                      onChange={e => setFormState({...formState, visitDatePlan: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aktual Visit</label>
                    <input 
                      type="date"
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      value={formState.visitDateActual}
                      onChange={e => setFormState({...formState, visitDateActual: e.target.value})}
                    />
                  </div>
                </div>
             </div>
             <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <h4 className="text-sm font-bold text-green-800 mb-2">Data Order Bulan Lalu</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Order (1 Bulan)</label>
                    <input 
                      type="number"
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      value={formState.ordersLastMonth}
                      onChange={e => setFormState({...formState, ordersLastMonth: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rata-rata / Hari</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      value={formState.ordersDailyAvg}
                      onChange={e => setFormState({...formState, ordersDailyAvg: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
             </div>
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-2 mt-6">Hasil Kunjungan & Catatan</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temuan Utama</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-anteraja-purple outline-none"
                placeholder="Kondisi ruko, branding, kebersihan..."
                value={formState.findings}
                onChange={e => setFormState({...formState, findings: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Isu Operasional</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-anteraja-purple outline-none"
                placeholder="Masalah pickup, sistem, kurir..."
                value={formState.operationalIssues}
                onChange={e => setFormState({...formState, operationalIssues: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saran Pengembangan</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-anteraja-purple outline-none"
                placeholder="Training ulang, penambahan armada..."
                value={formState.suggestions}
                onChange={e => setFormState({...formState, suggestions: e.target.value})}
              />
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-anteraja-purple flex items-center gap-2">
                <Sparkles size={16} /> AI Auto-Summary
              </h4>
              <button 
                onClick={handleGenerateSummary}
                disabled={isGenerating || !formState.findings}
                className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1 rounded hover:bg-purple-50 disabled:opacity-50 flex items-center gap-1"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : 'Generate'}
              </button>
            </div>
            <textarea 
              className="w-full bg-white/50 border border-purple-100 rounded p-2 text-sm text-gray-700 min-h-[80px]"
              placeholder="Klik generate untuk membuat ringkasan otomatis..."
              value={formState.summary}
              readOnly
            />
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!formState.partnerName}
              className="px-6 py-2 bg-anteraja-pink text-white rounded-lg font-medium hover:bg-pink-600 shadow-sm disabled:opacity-50"
            >
              {editingId ? 'Update Data' : 'Simpan Rencana'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
         <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex w-full sm:w-auto">
            <button 
               onClick={() => setActiveTab('PLANNED')}
               className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'PLANNED' ? 'bg-anteraja-purple text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
               <CalendarDays size={16} /> Rencana Kunjungan
            </button>
            <button 
               onClick={() => setActiveTab('HISTORY')}
               className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
               <History size={16} /> Riwayat Selesai
            </button>
         </div>

         <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">Filter Tanggal:</span>
            <input 
               type="date" 
               className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none w-full sm:w-auto"
               value={filterDate}
               onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
               <button onClick={() => setFilterDate('')} className="text-xs text-red-500 hover:underline">Clear</button>
            )}
         </div>
      </div>

      {/* List of Visits */}
      <div className="space-y-4">
        {filteredVisits.length === 0 ? (
           <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              {filterDate 
                ? `Tidak ada kunjungan pada tanggal ${new Date(filterDate).toLocaleDateString('id-ID')}.` 
                : (activeTab === 'PLANNED' ? 'Tidak ada rencana kunjungan aktif.' : 'Belum ada riwayat kunjungan selesai.')}
           </div>
        ) : (
           filteredVisits.map(visit => (
             <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
               {/* Header Row */}
               <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div 
                   className="flex items-center gap-4 cursor-pointer flex-1"
                   onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
                 >
                   <div className={`p-3 rounded-full ${visit.status === 'DONE' ? 'bg-green-100 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                     <MapPin size={20} />
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{visit.partnerName}</h3>
                        {visit.status === 'RESCHEDULED' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded border border-amber-200">Rescheduled</span>}
                     </div>
                     <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs text-gray-500 flex items-center gap-1">
                         <Calendar size={12}/> 
                         {visit.status === 'DONE' 
                           ? `Actual: ${new Date(visit.visitDateActual).toLocaleDateString('id-ID')}`
                           : `Plan: ${visit.visitDatePlan ? new Date(visit.visitDatePlan).toLocaleDateString('id-ID') : 'Belum dijadwalkan'}`
                         }
                       </span>
                       {visit.ordersLastMonth > 0 && (
                         <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                           {visit.ordersLastMonth} Orders
                         </span>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Actions Area */}
                 <div className="flex items-center gap-2 self-end sm:self-auto">
                    {visit.status !== 'DONE' && (
                       <>
                         <button 
                           onClick={() => setRescheduleId(visit.id)}
                           className="text-xs flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
                         >
                            <Clock size={12}/> Reschedule
                         </button>
                         <button 
                           onClick={() => handleEdit(visit)}
                           className="text-xs flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                         >
                            <Edit size={12}/> Edit
                         </button>
                         <button 
                           onClick={() => handleMarkDone(visit)}
                           className="text-xs flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700 transition-colors"
                         >
                            <CheckCircle size={12}/> Selesai
                         </button>
                       </>
                    )}
                    <button onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                       {expandedId === visit.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </button>
                 </div>
               </div>

               {/* Expanded Content */}
               {expandedId === visit.id && (
                 <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3 text-sm text-gray-700 animate-slide-down">
                   <div className="flex flex-wrap gap-3 mb-2">
                      {visit.googleMapsLink && (
                         <a href={visit.googleMapsLink} target="_blank" className="text-xs flex items-center gap-1 text-blue-600 hover:underline bg-white px-2 py-1 rounded border">
                           <Navigation size={12}/> Buka Google Maps
                         </a>
                      )}
                      {visit.coordinates && (
                        <span className="text-xs text-gray-500 border bg-white px-2 py-1 rounded">Coords: {visit.coordinates}</span>
                      )}
                   </div>

                   {visit.summary && (
                     <div className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                       <span className="font-bold text-purple-700 block mb-1 text-xs flex items-center gap-1"><Sparkles size={10}/> AI Summary</span>
                       <p className="italic">{visit.summary}</p>
                     </div>
                   )}
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-white p-3 rounded border border-gray-100">
                       <span className="font-semibold block text-gray-900 mb-1 border-b pb-1">Temuan</span>
                       <p className="text-gray-600 whitespace-pre-line mt-1">{visit.findings || '-'}</p>
                     </div>
                     <div className="bg-white p-3 rounded border border-gray-100">
                       <span className="font-semibold block text-gray-900 mb-1 border-b pb-1">Isu Ops</span>
                       <p className="text-gray-600 whitespace-pre-line mt-1">{visit.operationalIssues || '-'}</p>
                     </div>
                     <div className="bg-white p-3 rounded border border-gray-100">
                       <span className="font-semibold block text-gray-900 mb-1 border-b pb-1">Saran</span>
                       <p className="text-gray-600 whitespace-pre-line mt-1">{visit.suggestions || '-'}</p>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           ))
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleId && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
               <h3 className="text-lg font-bold mb-4">Reschedule Kunjungan</h3>
               <p className="text-sm text-gray-600 mb-4">Pilih tanggal baru untuk kunjungan ke pengusaha ini.</p>
               <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
               />
               <div className="flex gap-2">
                  <button onClick={() => setRescheduleId(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                  <button onClick={handleReschedule} disabled={!newDate} className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">Simpan</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const PlusIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const XIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default VisitNotes;