import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, Priority, Division, TaskStatus } from '../types';
import { Plus, Calendar, Trash2, CheckCircle, ArrowRight, Bot } from 'lucide-react';
import { useAIPriority, useAIAutoFillTask } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';

interface TaskManagerProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onSaveTask, onDeleteTask }) => {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>(TaskCategory.TODAY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  
  const { run: runPriority, loading: priorityLoading } = useAIPriority();
  const { run: runAutoFill, loading: autofillLoading } = useAIAutoFillTask();

  const [formState, setFormState] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: TaskCategory.TODAY,
    status: TaskStatus.OPEN,
    division: Division.OPS,
    notes: '',
    priority: Priority.P3
  });

  const handleAutoFill = async () => {
    if (!rawInput) return;
    const res = await runAutoFill(rawInput);
    if (res) {
      setFormState(prev => ({
        ...prev,
        title: res.title || prev.title,
        description: res.description || prev.description,
        division: (res.division as Division) || prev.division,
        category: (res.category as TaskCategory) || prev.category,
      }));
      if (res.title && res.description) {
         const prioRes = await runPriority(res.title, res.description, res.division || '');
         if (prioRes) {
           setFormState(prev => ({ ...prev, priority: prioRes.priorityLevel as Priority }));
         }
      }
    }
  };

  const handleSmartPriority = async () => {
    if (!formState.title) return;
    const res = await runPriority(formState.title, formState.description || '', formState.division || '');
    if (res) {
      setFormState(prev => ({ ...prev, priority: res.priorityLevel as Priority }));
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.category === activeCategory)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        return 0;
      });
  }, [tasks, activeCategory]);

  const handleCreate = () => {
    if (!formState.title) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      title: formState.title!,
      description: formState.description || '',
      category: formState.category || activeCategory,
      priority: formState.priority || Priority.P3,
      status: formState.status || TaskStatus.OPEN,
      division: formState.division || Division.OPS,
      createdAt: new Date().toISOString(),
      notes: formState.notes || '',
      deadline: formState.deadline
    };
    
    onSaveTask(newTask);
    setIsModalOpen(false);
    setFormState({ title: '', description: '', category: activeCategory, priority: Priority.P3 });
    setRawInput('');
  };

  const getPriorityBadge = (p: Priority) => {
    switch(p) {
      case Priority.P1: return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]">P1 - HIGH</span>;
      case Priority.P2: return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]">P2 - DEADLINE</span>;
      default: return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">P3 - NORMAL</span>;
    }
  };

  const cycleStatus = (task: Task) => {
    let nextStatus = TaskStatus.OPEN;
    if (task.status === TaskStatus.OPEN) nextStatus = TaskStatus.IN_PROGRESS;
    else if (task.status === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.CLOSED;
    else nextStatus = TaskStatus.OPEN; 
    
    onSaveTask({ ...task, status: nextStatus });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Task Manager</h2>
          <p className="text-gray-400 text-sm">Manage operations based on urgency.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-bg-card hover:bg-slate-800 text-neon border border-neon/50 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-neu-flat transition-all active:scale-95"
        >
          <Plus size={18} /> <span className="font-bold">New Task</span>
        </button>
      </header>

      {/* Category Tabs */}
      <div className="flex bg-bg-card p-1.5 rounded-xl shadow-neu-pressed border border-slate-800 mb-8 w-full max-w-md mx-auto md:mx-0">
        {Object.values(TaskCategory).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all tracking-wider ${
              activeCategory === cat 
                ? 'bg-neon text-white shadow-neon' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-20 custom-scrollbar pr-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-bg-card/50 rounded-2xl border border-dashed border-slate-700">
            <div className="text-gray-500 mb-2">No tasks in this category</div>
            <button onClick={() => setIsModalOpen(true)} className="text-neon font-bold text-sm hover:underline">Create new +</button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`bg-bg-card p-5 rounded-2xl shadow-neu-flat border border-slate-800 transition-all hover:border-neon/30 group ${task.status === TaskStatus.CLOSED ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPriorityBadge(task.priority)}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      task.status === TaskStatus.CLOSED ? 'text-green-400' :
                      task.status === TaskStatus.IN_PROGRESS ? 'text-purple-400 animate-pulse' :
                      'text-gray-500'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <ArrowRight size={10} /> {task.division}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-lg text-gray-100 ${task.status === TaskStatus.CLOSED ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                  
                  {task.deadline && (
                    <div className="flex items-center gap-2 mt-4 text-xs text-red-400 font-bold bg-red-500/5 px-2 py-1 rounded inline-flex border border-red-500/10">
                      <Calendar size={12} /> Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 ml-4">
                  <button 
                    onClick={() => cycleStatus(task)}
                    className={`p-2.5 rounded-xl transition-all shadow-neu-flat active:shadow-neu-pressed ${task.status === TaskStatus.CLOSED ? 'text-neon bg-bg-main' : 'text-gray-400 bg-bg-main hover:text-neon'}`}
                    title="Cycle Status"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2.5 text-gray-500 hover:text-red-400 bg-bg-main rounded-xl transition-all shadow-neu-flat hover:shadow-neu-pressed opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">New Task</h3>
            
            {/* AI Helper */}
            <div className="bg-bg-main p-4 rounded-xl shadow-neu-pressed mb-6">
              <div className="flex gap-3">
                 <input 
                   className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                   placeholder="Type fast: 'Check SLA Finance tomorrow'"
                   value={rawInput}
                   onChange={e => setRawInput(e.target.value)}
                 />
                 <AIButton onClick={handleAutoFill} loading={autofillLoading} label="Auto-Fill" size="sm" />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text" 
                  className="w-full bg-bg-main border-none rounded-xl p-3 text-white shadow-neu-pressed focus:ring-1 focus:ring-neon outline-none transition-all"
                  placeholder="e.g. Handling Complaint X"
                  value={formState.title}
                  onChange={e => setFormState({...formState, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea 
                  className="w-full bg-bg-main border-none rounded-xl p-3 text-white shadow-neu-pressed focus:ring-1 focus:ring-neon outline-none h-28 resize-none"
                  placeholder="Task details..."
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                />
                <div className="mt-3 flex justify-end">
                   <AIButton onClick={handleSmartPriority} loading={priorityLoading} label="AI Prioritize" size="sm" variant="secondary" icon={Bot} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Priority</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none appearance-none"
                      value={formState.priority}
                      onChange={e => setFormState({...formState, priority: e.target.value as Priority})}
                    >
                      <option value={Priority.P1}>P1 - High Impact</option>
                      <option value={Priority.P2}>P2 - Deadline</option>
                      <option value={Priority.P3}>P3 - Normal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Division</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none appearance-none"
                      value={formState.division}
                      onChange={e => setFormState({...formState, division: e.target.value as Division})}
                    >
                      {Object.values(Division).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Deadline</label>
                <input 
                  type="date"
                  className="w-full bg-bg-main text-white rounded-xl p-3 shadow-neu-pressed outline-none"
                  value={formState.deadline || ''}
                  onChange={e => setFormState({...formState, deadline: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-gray-400 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!formState.title}
                  className="flex-1 py-3 bg-neon text-white rounded-xl font-bold shadow-neon hover:bg-neon-hover transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;