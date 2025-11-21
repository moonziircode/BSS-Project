import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import IssueTracker from './components/IssueTracker';
import VisitNotes from './components/VisitNotes';
import ChecklistModal from './components/ChecklistModal';
import { 
  getTasks as getLocalTasks, saveTask as saveLocalTask, deleteTask as deleteLocalTask, seedData,
  getIssues as getLocalIssues, saveIssue as saveLocalIssue,
  getVisits as getLocalVisits, saveVisit as saveLocalVisit
} from './services/storageService';
import { firebaseService } from './services/firebaseService';
import { Task, Issue, VisitNote } from './types';
import { Database, X, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Centralized Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [visits, setVisits] = useState<VisitNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Config State
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Firebase is treated as "Always Connected" once initialized
  const isConnected = true;

  // --- Initialization ---
  useEffect(() => {
    // Seed local data just in case, but we prioritize loading from Firebase
    seedData();

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Try loading from Firebase first
        const [remoteTasks, remoteIssues, remoteVisits] = await Promise.all([
          firebaseService.getTasks(),
          firebaseService.getIssues(),
          firebaseService.getVisits()
        ]);
        
        setTasks(remoteTasks);
        setIssues(remoteIssues);
        setVisits(remoteVisits);
      } catch (error) {
        console.error("Firebase load error, falling back to local:", error);
        setTasks(getLocalTasks());
        setIssues(getLocalIssues());
        setVisits(getLocalVisits());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Check time for Checklist Popup
    const hour = new Date().getHours();
    const hasSeenChecklist = sessionStorage.getItem('HAS_SEEN_CHECKLIST');
    if (!hasSeenChecklist) {
      if ((hour >= 8 && hour < 10) || (hour >= 16 && hour < 18)) {
        setShowChecklist(true);
      }
    }
  }, []);


  // --- Unified Data Handlers ---

  const handleSaveTask = async (task: Task) => {
    // Optimistic Update
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx >= 0) {
        const newTasks = [...prev];
        newTasks[idx] = task;
        return newTasks;
      }
      return [...prev, task];
    });

    // Save to Firebase
    await firebaseService.saveTask(task);
    
    // Also save to local backup
    saveLocalTask(task);
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== id));

    // Delete from Firebase
    await firebaseService.deleteTask(id);

    // Delete local backup
    deleteLocalTask(id);
  };

  const handleSaveIssue = async (issue: Issue) => {
    setIssues(prev => {
      const idx = prev.findIndex(i => i.id === issue.id);
      if (idx >= 0) {
        const newIssues = [...prev];
        newIssues[idx] = issue;
        return newIssues;
      }
      return [...prev, issue];
    });

    await firebaseService.saveIssue(issue);
    saveLocalIssue(issue);
  };

  const handleSaveVisit = async (visit: VisitNote) => {
    setVisits(prev => {
      const idx = prev.findIndex(v => v.id === visit.id);
      if (idx >= 0) {
        const newVisits = [...prev];
        newVisits[idx] = visit;
        return newVisits;
      }
      return [...prev, visit];
    });

    await firebaseService.saveVisit(visit);
    saveLocalVisit(visit);
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
            <span className="text-sm font-bold text-gray-300">Loading Database...</span>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard tasks={tasks} issues={issues} visits={visits} />}
      {activeTab === 'tasks' && <TaskManager tasks={tasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />}
      {activeTab === 'issues' && <IssueTracker issues={issues} onSaveIssue={handleSaveIssue} />}
      {activeTab === 'visits' && <VisitNotes visits={visits} onSaveVisit={handleSaveVisit} />}
      
      <ChecklistModal isOpen={showChecklist} onClose={() => { setShowChecklist(false); sessionStorage.setItem('HAS_SEEN_CHECKLIST', 'true'); }} />

      {/* Settings Modal (Now simplified as Firebase is auto-connected) */}
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
                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                   <Database size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-green-400">Firebase Live</h4>
                   <p className="text-xs text-gray-400 mt-1">Connected to project: be-dashboard-b5f44</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 text-center">
                Your data is automatically synced to the cloud securely.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;