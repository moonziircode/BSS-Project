
import React, { useState } from 'react';
import { Issue, IssueStatus, Division, EscalationLog } from '../types';
import { Plus, AlertTriangle, Search, Filter, Clock, BrainCircuit, Lightbulb, User } from 'lucide-react';
import { useAIClassifier, useAISuggestion, useAIAutoFillIssue } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';

interface IssueTrackerProps {
  issues: Issue[];
  onSaveIssue: (issue: Issue) => void;
}

const IssueTracker: React.FC<IssueTrackerProps> = ({ issues, onSaveIssue }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [rawInput, setRawInput] = useState('');
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  
  const { run: runClassifier, loading: classifying } = useAIClassifier();
  const { run: runSuggestion, loading: suggesting } = useAISuggestion();
  const { run: runAutofill, loading: filling } = useAIAutoFillIssue();

  const [formState, setFormState] = useState<Partial<Issue>>({
    awb: '',
    partnerName: '',
    issueType: '',
    opcode: '',
    sopRelated: '',
    chronology: '',
    division: Division.OPS,
    status: IssueStatus.OPEN,
    escalationLog: []
  });

  const [newLog, setNewLog] = useState('');

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

  const handleAutoFill = async () => {
    if (!rawInput) return;
    const res = await runAutofill(rawInput);
    if (res) {
      setFormState(prev => ({
        ...prev,
        awb: res.awb || prev.awb,
        partnerName: res.partnerName || prev.partnerName,
        issueType: res.issueType || prev.issueType,
        chronology: res.chronology || prev.chronology
      }));
      if (res.chronology || rawInput) {
        const clsRes = await runClassifier(res.chronology || rawInput);
        if (clsRes) {
          setFormState(prev => ({
             ...prev,
             opcode: clsRes.opcode.toString(),
             sopRelated: clsRes.sop,
             division: clsRes.division as Division
          }));
        }
      }
    }
  };

  const handleClassify = async () => {
    if (!formState.chronology) return;
    const res = await runClassifier(formState.chronology);
    if (res) {
      setFormState(prev => ({
        ...prev,
        opcode: res.opcode.toString(),
        sopRelated: res.sop,
        division: res.division as Division
      }));
    }
  };

  const handleSuggest = async (issue: Issue) => {
    const res = await runSuggestion(issue);
    if (res) {
      alert(`AI Recommendation:\n\n${res}`);
    }
  };

  const getSlaStatus = (createdAt: string, status: IssueStatus) => {
    if (status === IssueStatus.DONE) return { breached: false, label: 'Solved' };
    
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

  const handleOpenModal = (issue?: Issue) => {
      if (issue) {
          setEditingIssue(issue.id);
          setFormState(issue);
      } else {
          setEditingIssue(null);
          setFormState({ awb: '', partnerName: '', issueType: '', chronology: '', division: Division.OPS, status: IssueStatus.OPEN, escalationLog: [] });
      }
      setIsModalOpen(true);
  };

  const handleAddLog = () => {
      if (!newLog) return;
      const entry: EscalationLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          actor: 'You',
          action: 'Update',
          note: newLog
      };
      setFormState(prev => ({
          ...prev,
          escalationLog: [...(prev.escalationLog || []), entry]
      }));
      setNewLog('');
  };

  const handleCreate = () => {
    if (!formState.awb || !formState.issueType) return;
    
    const newIssue: Issue = {
      id: editingIssue || Math.random().toString(36).substring(7),
      awb: (formState.awb || '').toUpperCase(),
      partnerName: toTitleCase(formState.partnerName || ''),
      issueType: toTitleCase(formState.issueType!),
      opcode: (formState.opcode || '').toUpperCase(),
      sopRelated: formState.sopRelated || '',
      chronology: toSentenceCase(formState.chronology || ''),
      division: formState.division || Division.OPS,
      status: formState.status || IssueStatus.OPEN,
      createdAt: editingIssue ? (formState.createdAt || new Date().toISOString()) : new Date().toISOString(),
      escalationLog: formState.escalationLog || []
    };
    
    onSaveIssue(newIssue);
    setIsModalOpen(false);
    setRawInput('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Issue Tracker</h2>
          <p className="text-zinc-400 text-sm">SLA Monitoring & Escalation Log</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-glow transition-all active:scale-95 font-bold text-sm"
        >
          <Plus size={18} /> <span>Report Issue</span>
        </button>
      </header>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 border border-zinc-800">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search AWB, Partner, Issue..." 
            className="w-full pl-12 pr-4 py-3 bg-zinc-950 rounded-xl text-white border border-zinc-800 outline-none focus:ring-1 focus:ring-white placeholder-zinc-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={18} className="text-zinc-500" />
          {['ALL', ...Object.values(IssueStatus)].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                filterStatus === status 
                  ? 'bg-white text-black border-white shadow-sm' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Status / SLA</th>
                <th className="px-6 py-4 font-bold">AWB / Partner</th>
                <th className="px-6 py-4 font-bold">Issue Info</th>
                <th className="px-6 py-4 font-bold">Division</th>
                <th className="px-6 py-4 font-bold">AI Assist</th>
                <th className="px-6 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredIssues.map(issue => {
                const sla = getSlaStatus(issue.createdAt, issue.status);
                return (
                  <tr key={issue.id} onClick={() => handleOpenModal(issue)} className="hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                          issue.status === IssueStatus.DONE ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          issue.status === IssueStatus.PROGRESS ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {issue.status}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${sla.breached ? 'text-rose-400' : 'text-zinc-500'}`}>
                           <Clock size={12} /> {sla.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-200 font-mono font-bold tracking-wide">{issue.awb}</div>
                      <div className="text-xs font-semibold text-zinc-400 mt-1">{issue.partnerName}</div>
                      {issue.opcode && <div className="text-[10px] text-zinc-500 font-medium mt-1 bg-zinc-900 px-1.5 py-0.5 rounded w-fit border border-zinc-800">Op: {issue.opcode}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-300">{issue.issueType}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[250px] mt-1 font-medium">{issue.chronology}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 font-medium">
                      {issue.division}
                    </td>
                    <td className="px-6 py-4">
                       <AIButton onClick={(e) => {e.stopPropagation(); handleSuggest(issue)}} loading={suggesting} label="Solve" size="sm" variant="secondary" icon={Lightbulb} />
                    </td>
                    <td className="px-6 py-4">
                      {issue.status !== IssueStatus.DONE && (
                         <button 
                           onClick={(e) => {e.stopPropagation(); onSaveIssue({...issue, status: IssueStatus.DONE})}}
                           className="text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 transition-colors"
                         >
                           Resolve
                         </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-3xl p-0 max-h-[90vh] overflow-hidden animate-scale-up border border-zinc-700 flex flex-col md:flex-row">
             
             {/* Left Side: Form */}
             <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                <AlertTriangle className="text-rose-500" /> {editingIssue ? 'Edit Ticket' : 'Report Issue'}
                </h3>

                {!editingIssue && (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
                    <div className="flex gap-3">
                        <textarea
                            className="flex-1 bg-transparent text-zinc-200 text-sm outline-none placeholder-zinc-600 h-12 resize-none"
                            placeholder="Paste WhatsApp chat here..."
                            value={rawInput}
                            onChange={e => setRawInput(e.target.value)}
                        />
                        <div className="flex flex-col justify-center">
                            <AIButton onClick={handleAutoFill} loading={filling} label="Auto" size="sm" />
                        </div>
                    </div>
                    </div>
                )}
                
                <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">AWB</label>
                        <input 
                        className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm uppercase focus:border-zinc-500 transition-colors"
                        value={formState.awb}
                        onChange={e => setFormState({...formState, awb: e.target.value})}
                        placeholder="1000..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Opcode</label>
                        <input 
                        className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm uppercase focus:border-zinc-500 transition-colors"
                        value={formState.opcode}
                        onChange={e => setFormState({...formState, opcode: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Partner Name</label>
                    <input 
                    className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm capitalize focus:border-zinc-500 transition-colors"
                    value={formState.partnerName}
                    onChange={e => setFormState({...formState, partnerName: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Issue Type</label>
                    <input 
                    className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm capitalize focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Wrong Routing"
                    value={formState.issueType}
                    onChange={e => setFormState({...formState, issueType: e.target.value})}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase">Chronology</label>
                    <AIButton onClick={handleClassify} loading={classifying} label="Classify" size="sm" variant="secondary" icon={BrainCircuit} />
                    </div>
                    <textarea 
                    className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm h-24 resize-none focus:border-zinc-500 transition-colors"
                    value={formState.chronology}
                    onChange={e => setFormState({...formState, chronology: e.target.value})}
                    placeholder="Describe what happened..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Division</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm appearance-none focus:border-zinc-500 transition-colors"
                            value={formState.division}
                            onChange={e => setFormState({...formState, division: e.target.value as Division})}
                        >
                            {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Status</label>
                    <select 
                            className="w-full bg-zinc-950 text-white rounded-xl p-3 border border-zinc-800 outline-none text-sm appearance-none focus:border-zinc-500 transition-colors"
                            value={formState.status}
                            onChange={e => setFormState({...formState, status: e.target.value as IssueStatus})}
                        >
                            {Object.values(IssueStatus).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 mt-4">
                    <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-zinc-500 font-bold hover:text-white transition-colors"
                    >
                    Cancel
                    </button>
                    <button 
                    onClick={handleCreate}
                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 shadow-glow transition-all"
                    >
                    {editingIssue ? 'Update Ticket' : 'Submit Report'}
                    </button>
                </div>
                </div>
             </div>

             {/* Right Side: Escalation Log */}
             <div className="w-full md:w-[320px] bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col">
                <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Escalation Log
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
                    {formState.escalationLog?.length === 0 && (
                        <p className="text-xs text-zinc-600 italic text-center py-10">No activity recorded.</p>
                    )}
                    {formState.escalationLog?.map((log, idx) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-zinc-800 ml-1">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-zinc-600 rounded-full border-2 border-zinc-900"></div>
                            <div className="text-[10px] text-zinc-500 mb-0.5 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</div>
                            <div className="text-xs font-bold text-zinc-200">{log.actor} - {log.action}</div>
                            <div className="text-xs text-zinc-400 mt-1 leading-relaxed bg-zinc-950/50 p-2 rounded border border-zinc-800/50">{log.note}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white mb-2 placeholder-zinc-600"
                        placeholder="Log Action (e.g. Emailed Finance)..."
                        value={newLog}
                        onChange={e => setNewLog(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddLog()}
                    />
                    <button onClick={handleAddLog} disabled={!newLog} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors border border-zinc-700">
                        Add Log Entry
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
