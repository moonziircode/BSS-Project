import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import IssueTracker from './components/IssueTracker';
import VisitNotes from './components/VisitNotes';
import ChecklistModal from './components/ChecklistModal';
import { 
  getTasks, saveTask as saveLocalTask, deleteTask as deleteLocalTask, seedData,
  getIssues, saveIssue as saveLocalIssue,
  getVisits, saveVisit as saveLocalVisit
} from './services/storageService';
import { 
  sheetsService, 
  DEFAULT_SPREADSHEET_ID, 
  DEFAULT_CLIENT_ID, 
  DEFAULT_API_KEY 
} from './services/sheetsService';
import { Task, Issue, VisitNote } from './types';
import { Database, X, Save, Loader2, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Centralized Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [visits, setVisits] = useState<VisitNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Config & Connection State
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Sheets Config Form
  const [config, setConfig] = useState({
    clientId: DEFAULT_CLIENT_ID,
    apiKey: DEFAULT_API_KEY,
    spreadsheetId: DEFAULT_SPREADSHEET_ID
  });

  // --- Initialization ---
  useEffect(() => {
    // Load local data initially
    seedData();
    setTasks(getTasks());
    setIssues(getIssues());
    setVisits(getVisits());

    // Check time for Checklist Popup
    const hour = new Date().getHours();
    const hasSeenChecklist = sessionStorage.getItem('HAS_SEEN_CHECKLIST');
    if (!hasSeenChecklist) {
      if ((hour >= 8 && hour < 10) || (hour >= 16 && hour < 18)) {
        setShowChecklist(true);
      }
    }
  }, []);

  // --- Sheets Integration Logic ---

  const handleConnectSheets = async () => {
    if (!config.clientId || !config.apiKey) {
      alert("Please fill Client ID and API Key.");
      return;
    }

    setIsLoading(true);
    try {
      sheetsService.setSpreadsheetId(config.spreadsheetId);
      await sheetsService.initClient(config.apiKey);
      
      // Init Token Client
      sheetsService.initTokenClient(config.clientId, async () => {
        // On Success Auth
        setIsConnected(true);
        setShowSettings(false);
        await loadSheetsData();
      });

      // Trigger Auth Popup
      sheetsService.requestAccessToken();
    } catch (error) {
      console.error("Connection Failed", error);
      alert("Connection Failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetsData = async () => {
    setIsLoading(true);
    try {
      await sheetsService.ensureSheetsExist();
      const [remoteTasks, remoteIssues, remoteVisits] = await Promise.all([
        sheetsService.getTasks(),
        sheetsService.getIssues(),
        sheetsService.getVisits()
      ]);
      
      setTasks(remoteTasks);
      setIssues(remoteIssues);
      setVisits(remoteVisits);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Unified Data Handlers ---

  const handleSaveTask = async (task: Task) => {
    if (isConnected) {
      setIsLoading(true);
      await sheetsService.saveTask(task);
      await loadSheetsData(); // Refresh
    } else {
      saveLocalTask(task);
      setTasks(getTasks());
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (isConnected) {
      setIsLoading(true);
      await sheetsService.deleteTask(id);
      await loadSheetsData();
    } else {
      deleteLocalTask(id);
      setTasks(getTasks());
    }
  };

  const handleSaveIssue = async (issue: Issue) => {
    if (isConnected) {
      setIsLoading(true);
      await sheetsService.saveIssue(issue);
      await loadSheetsData();
    } else {
      saveLocalIssue(issue);
      setIssues(getIssues());
    }
  };

  const handleSaveVisit = async (visit: VisitNote) => {
    if (isConnected) {
      setIsLoading(true);
      await sheetsService.saveVisit(visit);
      await loadSheetsData();
    } else {
      saveLocalVisit(visit);
      setVisits(getVisits());
    }
  };

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
            <span className="text-sm font-bold text-gray-300">Syncing Database...</span>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard tasks={tasks} issues={issues} visits={visits} />}
      {activeTab === 'tasks' && <TaskManager tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />}
      {activeTab === 'issues' && <IssueTracker issues={issues} onSaveIssue={handleSaveIssue} />}
      {activeTab === 'visits' && <VisitNotes visits={visits} onSaveVisit={handleSaveVisit} />}
      
      <ChecklistModal isOpen={showChecklist} onClose={() => { setShowChecklist(false); sessionStorage.setItem('HAS_SEEN_CHECKLIST', 'true'); }} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="text-neon" /> Database Config
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                Credentials pre-filled. Click <strong>Connect & Sync</strong> to authorize Google Sheets access.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sheet ID</label>
                <div className="flex gap-2">
                   <input 
                    type="text"
                    className="w-full bg-bg-main border-none rounded-xl p-3 text-sm text-gray-300 shadow-neu-pressed outline-none"
                    value={config.spreadsheetId}
                    onChange={e => setConfig({...config, spreadsheetId: e.target.value})}
                  />
                  <a href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`} target="_blank" rel="noreferrer" className="p-3 text-blue-400 bg-bg-main rounded-xl shadow-neu-flat hover:text-blue-300">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Client ID (OAuth)</label>
                <input 
                  type="text"
                  className="w-full bg-bg-main border-none rounded-xl p-3 text-sm text-gray-300 font-mono shadow-neu-pressed outline-none"
                  value={config.clientId}
                  onChange={e => setConfig({...config, clientId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">API Key</label>
                <input 
                  type="text"
                  className="w-full bg-bg-main border-none rounded-xl p-3 text-sm text-gray-300 font-mono shadow-neu-pressed outline-none"
                  value={config.apiKey}
                  onChange={e => setConfig({...config, apiKey: e.target.value})}
                />
              </div>

              <div className="pt-6 border-t border-slate-800">
                <button 
                  onClick={handleConnectSheets}
                  disabled={isLoading}
                  className="w-full py-3 bg-neon text-white rounded-xl font-bold hover:bg-neon-hover shadow-neon transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                  Connect & Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;