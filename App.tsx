
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import IssueTracker from './components/IssueTracker';
import VisitNotes from './components/VisitNotes';
import PartnerManager from './components/PartnerManager';
import KnowledgeBase from './components/KnowledgeBase';
import ChecklistModal from './components/ChecklistModal';
import { firebaseService } from './services/firebaseService';
import { Task, Issue, VisitNote, Partner, SOP, Contact } from './types';
import { Database, X, Loader2 } from 'lucide-react';
import AIChatWindow from './components/AI/AIChatWindow';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Centralized Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [visits, setVisits] = useState<VisitNote[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Config State
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const isConnected = true;

  // --- Initialization & Real-time Listeners ---
  useEffect(() => {
    setIsLoading(true);

    const unsubTasks = firebaseService.subscribeToTasks(setTasks);
    const unsubIssues = firebaseService.subscribeToIssues(setIssues);
    const unsubVisits = firebaseService.subscribeToVisits(setVisits);
    const unsubPartners = firebaseService.subscribeToPartners(setPartners);
    const unsubSops = firebaseService.subscribeToSOPs(setSops);
    const unsubContacts = firebaseService.subscribeToContacts(setContacts);

    // Simulate initial load delay just for UI polish
    setTimeout(() => setIsLoading(false), 800);

    // Check time for Checklist Popup
    const hour = new Date().getHours();
    const hasSeenChecklist = sessionStorage.getItem('HAS_SEEN_CHECKLIST');
    if (!hasSeenChecklist) {
      if ((hour >= 8 && hour < 10) || (hour >= 16 && hour < 18)) {
        setShowChecklist(true);
      }
    }

    // Cleanup listeners on unmount
    return () => {
      unsubTasks(); unsubIssues(); unsubVisits();
      unsubPartners(); unsubSops(); unsubContacts();
    };
  }, []);

  // --- Data Handlers ---
  const handleSaveTask = (t: Task) => firebaseService.saveTask(t);
  const handleDeleteTask = (id: string) => firebaseService.deleteTask(id);
  
  const handleSaveIssue = (i: Issue) => firebaseService.saveIssue(i);
  
  const handleSaveVisit = (v: VisitNote) => firebaseService.saveVisit(v);
  const handleDeleteVisit = (id: string) => firebaseService.deleteVisit(id);

  const handleSavePartner = (p: Partner) => firebaseService.savePartner(p);
  const handleDeletePartner = (id: string) => firebaseService.deletePartner(id);

  const handleSaveSOP = (s: SOP) => firebaseService.saveSOP(s);
  const handleDeleteSOP = (id: string) => firebaseService.deleteSOP(id);

  const handleSaveContact = (c: Contact) => firebaseService.saveContact(c);
  const handleDeleteContact = (id: string) => firebaseService.deleteContact(id);

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      isConnectedToSheets={isConnected}
      onOpenSettings={() => setShowSettings(true)}
    >
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-bg-card border border-slate-700 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-neon" size={40} />
            <span className="text-sm font-bold text-gray-300">Syncing Ecosystem...</span>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard tasks={tasks} issues={issues} visits={visits} />}
      {activeTab === 'tasks' && <TaskManager tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />}
      {activeTab === 'issues' && <IssueTracker issues={issues} onSaveIssue={handleSaveIssue} />}
      {activeTab === 'visits' && <VisitNotes visits={visits} onSaveVisit={handleSaveVisit} onDeleteVisit={handleDeleteVisit} />}
      
      {/* New Modules */}
      {activeTab === 'partners' && <PartnerManager partners={partners} onSavePartner={handleSavePartner} onDeletePartner={handleDeletePartner} />}
      {activeTab === 'knowledge' && <KnowledgeBase sops={sops} contacts={contacts} onSaveSOP={handleSaveSOP} onDeleteSOP={handleDeleteSOP} onSaveContact={handleSaveContact} onDeleteContact={handleDeleteContact} />}

      <ChecklistModal isOpen={showChecklist} onClose={() => { setShowChecklist(false); sessionStorage.setItem('HAS_SEEN_CHECKLIST', 'true'); }} />
      
      {/* Global Chat Trigger (Floating if not in dashboard) */}
      {activeTab !== 'dashboard' && (
        <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-glow hover:scale-105 transition-transform z-40"
        >
            <Database size={24} />
        </button>
      )}

      <AIChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        tasks={tasks}
        issues={issues}
        visits={visits}
        partners={partners}
        sops={sops}
        onSaveTask={handleSaveTask} 
        onSaveVisit={handleSaveVisit}
      />

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="text-neon" /> Database Status
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full text-green-400 animate-pulse">
                   <Database size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-green-400">Firebase Real-time</h4>
                   <p className="text-xs text-gray-400 mt-1">Data syncs instantly across devices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
