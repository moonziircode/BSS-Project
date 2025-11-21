
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import IssueTracker from './components/IssueTracker';
import VisitNotes from './components/VisitNotes';
import ChecklistModal from './components/ChecklistModal';
import { firebaseService } from './services/firebaseService';
import { Task, Issue, VisitNote } from './types';
import { Database, X, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Centralized Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [visits, setVisits] = useState<VisitNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Config State
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Firebase is treated as "Always Connected"
  const isConnected = true;

  // --- Initialization & Real-time Listeners ---
  useEffect(() => {
    setIsLoading(true);

    // Subscribe to Real-time updates
    const unsubscribeTasks = firebaseService.subscribeToTasks((liveTasks) => {
      setTasks(liveTasks);
      // We can assume basic loading is done when the first critical data arrives
      setIsLoading(false);
    });

    const unsubscribeIssues = firebaseService.subscribeToIssues((liveIssues) => {
      setIssues(liveIssues);
    });

    const unsubscribeVisits = firebaseService.subscribeToVisits((liveVisits) => {
      setVisits(liveVisits);
    });

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
      unsubscribeTasks();
      unsubscribeIssues();
      unsubscribeVisits();
    };
  }, []);


  // --- Data Handlers ---
  // Note: We no longer manually set State here. 
  // We send the command to Firebase, and the Listener (useEffect above) 
  // receives the update and syncs the UI automatically.

  const handleSaveTask = async (task: Task) => {
    await firebaseService.saveTask(task);
  };

  const handleDeleteTask = async (id: string) => {
    await firebaseService.deleteTask(id);
  };

  const handleSaveIssue = async (issue: Issue) => {
    await firebaseService.saveIssue(issue);
  };

  const handleSaveVisit = async (visit: VisitNote) => {
    await firebaseService.saveVisit(visit);
  };

  const handleDeleteVisit = async (id: string) => {
    await firebaseService.deleteVisit(id);
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
      {activeTab === 'visits' && <VisitNotes visits={visits} onSaveVisit={handleSaveVisit} onDeleteVisit={handleDeleteVisit} />}
      
      <ChecklistModal isOpen={showChecklist} onClose={() => { setShowChecklist(false); sessionStorage.setItem('HAS_SEEN_CHECKLIST', 'true'); }} />

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

              <p className="text-sm text-gray-400 text-center">
                Changes made by other specialists will appear here automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
