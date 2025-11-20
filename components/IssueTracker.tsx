import React, { useState } from 'react';
import { Issue, IssueStatus, Division } from '../types';
import { Plus, AlertTriangle, Search, Filter, Clock, BrainCircuit, Lightbulb } from 'lucide-react';
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
    status: IssueStatus.OPEN
  });

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
    setRawInput('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Issue Tracker</h2>
          <p className="text-gray-400 text-sm">SLA Monitoring (24h Limit)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-neu-flat transition-all active:scale-95"
        >
          <Plus size={18} /> <span className="font-bold">Report Issue</span>
        </button>
      </header>

      {/* Filters */}
      <div className="bg-bg-card p-4 rounded-2xl shadow-neu-flat border border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search AWB, Partner, Issue..." 
            className="w-full pl-12 pr-4 py-3 bg-bg-main rounded-xl text-white shadow-neu-pressed outline-none focus:ring-1 focus:ring-neon placeholder-gray-600"
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
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                filterStatus === status 
                  ? 'bg-neon text-white border-neon shadow-neon' 
                  : 'bg-bg-main text-gray-500 border-slate-700 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="bg-bg-card rounded-2xl shadow-neu-flat border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-bg-main text-gray-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Status / SLA</th>
                <th className="px-6 py-4 font-bold">AWB / Partner</th>
                <th className="px-6 py-4 font-bold">Issue Info</th>
                <th className="px-6 py-4 font-bold">Division</th>
                <th className="px-6 py-4 font-bold">AI</th>
                <th className="px-6 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredIssues.map(issue => {
                const sla = getSlaStatus(issue.createdAt, issue.status);
                return (
                  <tr key={issue.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          issue.status === IssueStatus.DONE ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                          issue.status === IssueStatus.PROGRESS ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-600'
                        }`}>
                          {issue.status}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${sla.breached ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
                           <Clock size={12} /> {sla.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white font-mono">{issue.awb}</div>
                      <div className="text-xs font-bold text-neon mt-1">{issue.partnerName}</div>
                      {issue.opcode && <div className="text-[10px] text-gray-500 font-normal mt-1">Op: {issue.opcode}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-300">{issue.issueType}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[250px] mt-1 opacity-80">{issue.chronology}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {issue.division}
                    </td>
                    <td className="px-6 py-4">
                       <AIButton onClick={() => handleSuggest(issue)} loading={suggesting} label="Solve" size="sm" variant="secondary" icon={Lightbulb} />
                    </td>
                    <td className="px-6 py-4">
                      {issue.status !== IssueStatus.DONE && (
                         <button 
                           onClick={() => onSaveIssue({...issue, status: IssueStatus.DONE})}
                           className="text-neon hover:text-white hover:bg-neon/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-neon/30 transition-colors"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
              <AlertTriangle className="text-red-500" /> Report Issue
            </h3>

             {/* AI AutoFill */}
             <div className="bg-bg-main p-4 rounded-xl shadow-neu-pressed mb-6">
               <div className="flex gap-3">
                  <textarea
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 h-12 resize-none"
                    placeholder="Paste WhatsApp chat here..."
                    value={rawInput}
                    onChange={e => setRawInput(e.target.value)}
                  />
                  <div className="flex flex-col justify-center">
                    <AIButton onClick={handleAutoFill} loading={filling} label="Auto" size="sm" />
                  </div>
               </div>
             </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">AWB</label>
                    <input 
                      className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                      value={formState.awb}
                      onChange={e => setFormState({...formState, awb: e.target.value})}
                      placeholder="1000..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Opcode</label>
                    <input 
                      className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                      value={formState.opcode}
                      onChange={e => setFormState({...formState, opcode: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Partner Name</label>
                <input 
                  className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                  value={formState.partnerName}
                  onChange={e => setFormState({...formState, partnerName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Issue Type</label>
                <input 
                  className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                  placeholder="e.g. Wrong Routing"
                  value={formState.issueType}
                  onChange={e => setFormState({...formState, issueType: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Chronology</label>
                  <AIButton onClick={handleClassify} loading={classifying} label="Classify" size="sm" variant="secondary" icon={BrainCircuit} />
                </div>
                <textarea 
                  className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm h-24 resize-none"
                  value={formState.chronology}
                  onChange={e => setFormState({...formState, chronology: e.target.value})}
                  placeholder="Describe what happened..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Division</label>
                  <div className="relative">
                    <select 
                        className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm appearance-none"
                        value={formState.division}
                        onChange={e => setFormState({...formState, division: e.target.value as Division})}
                    >
                        {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">SOP Ref</label>
                   <input 
                      className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none text-sm"
                      placeholder="e.g. 287"
                      value={formState.sopRelated}
                      onChange={e => setFormState({...formState, sopRelated: e.target.value})}
                    />
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-gray-400 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
                >
                  Submit Report
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