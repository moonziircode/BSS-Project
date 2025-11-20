
import React, { useState } from 'react';
import { Issue, IssueStatus, Division } from '../types';
import { Plus, AlertTriangle, Search, Filter, Clock, Sparkles, Loader2 } from 'lucide-react';
import { refineChronology } from '../services/geminiService';

interface IssueTrackerProps {
  issues: Issue[];
  onSaveIssue: (issue: Issue) => void;
}

const IssueTracker: React.FC<IssueTrackerProps> = ({ issues, onSaveIssue }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isRefining, setIsRefining] = useState(false);
  
  // Form State
  const [formState, setFormState] = useState<Partial<Issue>>({
    awb: '',
    partnerName: '',
    issueType: '',
    opcode: '',
    sopRelated: '',
    chronology: '',
    division: Division.OPS,
    status: IssueStatus.OPEN
  });

  const handleRefineChronology = async () => {
    if (!formState.chronology) return;
    setIsRefining(true);
    const refined = await refineChronology(formState.chronology);
    setFormState(prev => ({ ...prev, chronology: refined }));
    setIsRefining(false);
  };

  const getSlaStatus = (createdAt: string, status: IssueStatus) => {
    if (status === IssueStatus.DONE) return { breached: false, label: 'Selesai' };
    
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) return { breached: true, label: `Overdue ${(hoursDiff - 24).toFixed(0)}h` };
    return { breached: false, label: `${(24 - hoursDiff).toFixed(0)}h left` };
  };

  const filteredIssues = issues.filter(issue => {
    const matchSearch = issue.awb.toLowerCase().includes(search.toLowerCase()) || 
                        issue.partnerName.toLowerCase().includes(search.toLowerCase()) ||
                        issue.issueType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || issue.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!formState.awb || !formState.issueType) return;
    
    const newIssue: Issue = {
      id: Math.random().toString(36).substring(7),
      awb: formState.awb!,
      partnerName: formState.partnerName || '',
      issueType: formState.issueType!,
      opcode: formState.opcode || '',
      sopRelated: formState.sopRelated || '',
      chronology: formState.chronology || '',
      division: formState.division || Division.OPS,
      status: IssueStatus.OPEN,
      createdAt: new Date().toISOString(),
    };
    
    onSaveIssue(newIssue);
    setIsModalOpen(false);
    setFormState({ awb: '', partnerName: '', issueType: '', chronology: '', division: Division.OPS });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Issue Tracker</h2>
          <p className="text-gray-500 text-sm">Monitor SOP & Opcode Issues (SLA 24 Jam).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium"
        >
          <Plus size={18} /> Lapor Issue
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari AWB, Nama Pengusaha, atau Issue..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-anteraja-pink"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={18} className="text-gray-500" />
          {['ALL', ...Object.values(IssueStatus)].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                filterStatus === status 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Status / SLA</th>
                <th className="px-6 py-3 font-semibold">AWB / Pengusaha</th>
                <th className="px-6 py-3 font-semibold">Issue Info</th>
                <th className="px-6 py-3 font-semibold">Divisi</th>
                <th className="px-6 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.map(issue => {
                const sla = getSlaStatus(issue.createdAt, issue.status);
                return (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          issue.status === IssueStatus.DONE ? 'bg-green-100 text-green-800' : 
                          issue.status === IssueStatus.PROGRESS ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${sla.breached ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                           <Clock size={12} /> {sla.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="text-sm">{issue.awb}</div>
                      <div className="text-xs font-bold text-anteraja-purple">{issue.partnerName}</div>
                      {issue.opcode && <div className="text-xs text-gray-500 font-normal">Op: {issue.opcode}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{issue.issueType}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[250px] whitespace-pre-line">{issue.chronology}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {issue.division}
                    </td>
                    <td className="px-6 py-4">
                      {issue.status !== IssueStatus.DONE && (
                         <button 
                           onClick={() => onSaveIssue({...issue, status: IssueStatus.DONE})}
                           className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-xs font-semibold border border-green-200 transition-colors"
                         >
                           Resolve
                         </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    Tidak ada issue ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> Log Issue Baru
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor AWB</label>
                    <input 
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={formState.awb}
                      onChange={e => setFormState({...formState, awb: e.target.value})}
                      placeholder="Contoh: 1000283..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opcode (Optional)</label>
                    <input 
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={formState.opcode}
                      onChange={e => setFormState({...formState, opcode: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Pengusaha / Toko</label>
                <input 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formState.partnerName}
                  onChange={e => setFormState({...formState, partnerName: e.target.value})}
                  placeholder="Nama Toko / Pengusaha"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Issue</label>
                <input 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  placeholder="Misal: Salah routing, Barang rusak..."
                  value={formState.issueType}
                  onChange={e => setFormState({...formState, issueType: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Kronologi Singkat</label>
                  <button 
                    onClick={handleRefineChronology}
                    disabled={isRefining || !formState.chronology}
                    className="text-[10px] flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                  >
                    {isRefining ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                    AI Refine
                  </button>
                </div>
                <textarea 
                  className="w-full border border-gray-300 rounded p-2 text-sm h-24"
                  value={formState.chronology}
                  onChange={e => setFormState({...formState, chronology: e.target.value})}
                  placeholder="Ceritakan masalahnya..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Divisi Dituju</label>
                  <select 
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                    value={formState.division}
                    onChange={e => setFormState({...formState, division: e.target.value as Division})}
                  >
                    {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SOP Terkait</label>
                   <input 
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      placeholder="Nomor SOP..."
                      value={formState.sopRelated}
                      onChange={e => setFormState({...formState, sopRelated: e.target.value})}
                    />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 rounded text-gray-600 text-sm font-semibold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-1 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700"
                >
                  Simpan Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTracker;