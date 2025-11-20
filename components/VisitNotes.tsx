import React, { useState } from 'react';
import { VisitNote } from '../types';
import { generateVisitSummary } from '../services/geminiService';
import { MapPin, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface VisitNotesProps {
  visits: VisitNote[];
  onSaveVisit: (visit: VisitNote) => void;
}

const VisitNotes: React.FC<VisitNotesProps> = ({ visits, onSaveVisit }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formState, setFormState] = useState<Partial<VisitNote>>({
    partnerName: '',
    nia: '',
    findings: '',
    operationalIssues: '',
    suggestions: '',
    visitDate: new Date().toISOString().split('T')[0]
  });

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

  const handleSubmit = () => {
    if (!formState.partnerName) return;
    
    const newVisit: VisitNote = {
      id: Math.random().toString(36).substring(7),
      partnerName: formState.partnerName!,
      nia: formState.nia || '',
      visitDate: formState.visitDate!,
      findings: formState.findings || '',
      operationalIssues: formState.operationalIssues || '',
      suggestions: formState.suggestions || '',
      summary: formState.summary
    };

    onSaveVisit(newVisit);
    setIsFormOpen(false);
    setFormState({
      partnerName: '',
      nia: '',
      findings: '',
      operationalIssues: '',
      suggestions: '',
      summary: '',
      visitDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Field Visit Notes</h2>
          <p className="text-gray-500 text-sm">Catat temuan lapangan & generate summary otomatis.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-anteraja-purple hover:bg-purple-800 text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-colors"
        >
          {isFormOpen ? 'Tutup Form' : '+ Catat Visit Baru'}
        </button>
      </div>

      {/* Input Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 mb-8 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mitra / Toko</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-anteraja-purple outline-none"
                value={formState.partnerName}
                onChange={e => setFormState({...formState, partnerName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIA (Nomor Induk Agen)</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-anteraja-purple outline-none"
                value={formState.nia}
                onChange={e => setFormState({...formState, nia: e.target.value})}
              />
            </div>
          </div>

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
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!formState.partnerName}
              className="px-6 py-2 bg-anteraja-pink text-white rounded-lg font-medium hover:bg-pink-600 shadow-sm disabled:opacity-50"
            >
              Simpan Laporan
            </button>
          </div>
        </div>
      )}

      {/* List of Visits */}
      <div className="space-y-4">
        {visits.map(visit => (
          <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{visit.partnerName}</h3>
                  <p className="text-xs text-gray-500">
                    NIA: {visit.nia} • {new Date(visit.visitDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {expandedId === visit.id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
            </div>

            {expandedId === visit.id && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3 text-sm text-gray-700">
                {visit.summary && (
                  <div className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                    <span className="font-bold text-purple-700 block mb-1 text-xs">AI Summary</span>
                    {visit.summary}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-semibold block text-gray-900 mb-1">Temuan</span>
                    <p className="text-gray-600">{visit.findings}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-900 mb-1">Isu Ops</span>
                    <p className="text-gray-600">{visit.operationalIssues || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-900 mb-1">Saran</span>
                    <p className="text-gray-600">{visit.suggestions || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {visits.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            Belum ada data kunjungan.
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitNotes;