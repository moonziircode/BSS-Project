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
import { sheetsService, DEFAULT_SPREADSHEET_ID } from './services/sheetsService';
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
    clientId: '',
    apiKey: process.env.API_KEY || '', // Prefill if available
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
      alert("Harap isi Client ID dan API Key.");
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
      alert("Koneksi Gagal. Cek console untuk detail.");
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
        <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-anteraja-purple" size={40} />
            <span className="text-sm font-medium text-gray-600">Syncing with Google Sheets...</span>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard tasks={tasks} issues={issues} />}
      {activeTab === 'tasks' && <TaskManager tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />}
      {activeTab === 'issues' && <IssueTracker issues={issues} onSaveIssue={handleSaveIssue} />}
      {activeTab === 'visits' && <VisitNotes visits={visits} onSaveVisit={handleSaveVisit} />}
      
      <ChecklistModal isOpen={showChecklist} onClose={() => { setShowChecklist(false); sessionStorage.setItem('HAS_SEEN_CHECKLIST', 'true'); }} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Database className="text-green-600" /> Konfigurasi Database
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 leading-relaxed">
                Untuk menghubungkan ke Google Sheets, Anda memerlukan <strong>Google Cloud Client ID</strong> dan <strong>API Key</strong> yang valid dengan scope Sheets API enabled.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Sheet ID</label>
                <div className="flex gap-2">
                   <input 
                    type="text"
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50"
                    value={config.spreadsheetId}
                    onChange={e => setConfig({...config, spreadsheetId: e.target.value})}
                  />
                  <a href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client ID (OAuth 2.0)</label>
                <input 
                  type="text"
                  placeholder="xxx.apps.googleusercontent.com"
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={config.clientId}
                  onChange={e => setConfig({...config, clientId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Key</label>
                <input 
                  type="text"
                  placeholder="AIza..."
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={config.apiKey}
                  onChange={e => setConfig({...config, apiKey: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={handleConnectSheets}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                  Connect & Sync
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-2">
                   Akan meminta login Google Account setelah klik. Pastikan akun memiliki akses edit ke sheet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;