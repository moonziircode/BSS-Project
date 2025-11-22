import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, Priority, Division, TaskStatus } from '../types';
import { Plus, Calendar, Trash2, CheckCircle, ArrowRight, Bot, Circle, CheckCircle2 } from 'lucide-react';
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
      title: toTitleCase(formState.title!),
      description: toSentenceCase(formState.description || ''),
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
      case Priority.P1: return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-black border border-white">HIGH</span>;
      case Priority.P2: return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">DUE</span>;
      default: return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">LOW</span>;
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
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Tasks</h2>
          <p className="text-zinc-500 text-xs mt-1">Focus on what matters.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-4 py-2 rounded-md text-xs font-medium shadow-glow hover:bg-zinc-200 transition-colors flex items-center gap-2"
        >
          <Plus size={14} /> <span>New Task</span>
        </button>
      </header>

      {/* Category Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/10 mb-8 w-full max-w-md mx-auto md:mx-0">
        {Object.values(TaskCategory).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest rounded-md transition-all ${
              activeCategory === cat 
                ? 'bg-black text-white shadow-sm border border-white/10' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-black/20 rounded-xl border border-dashed border-zinc-800">
            <div className="text-zinc-600 text-sm mb-2">All clear here.</div>
            <button onClick={() => setIsModalOpen(true)} className="text-zinc-300 font-medium text-xs hover:underline">Add item +</button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`glass-panel p-4 rounded-lg transition-all hover:bg-zinc-900/30 group ${task.status === TaskStatus.CLOSED ? 'opacity-40' : ''}`}
            >
              <div className="flex justify-between items-start gap-4">
                
                {/* Status Checkbox */}
                <button 
                  onClick={() => cycleStatus(task)}
                  className="mt-1 text-zinc-600 hover:text-white transition-colors"
                >
                   {task.status === TaskStatus.CLOSED ? <CheckCircle2 size={20} className="text-zinc-400" /> : <Circle size={20} />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase tracking-wider">
                       {task.division}
                    </span>
                  </div>
                  <h3 className={`text-sm font-medium text-zinc-200 ${task.status === TaskStatus.CLOSED ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-1 font-light">{task.description}</p>}
                  
                  {task.deadline && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400 font-medium">
                      <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString('en-US')}
                    </div>
                  )}
                </div>
                
                <button 
                   onClick={() => onDeleteTask(task.id)}
                   className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                   <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h3 className="text-lg font-light text-white">Create Task</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><Trash2 size={16}/></button>
            </div>
            
            {/* AI Helper */}
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-white/10 mb-6 flex gap-2">
                <input 
                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-zinc-600"
                  placeholder="AI Auto-fill: 'Check SLA Finance tomorrow'"
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                />
                <AIButton onClick={handleAutoFill} loading={autofillLoading} label="Auto" size="sm" />
            </div>

            <div className="space-y-4">
              <div>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:ring-1 focus:ring-white transition-all placeholder-zinc-600 capitalize"
                  placeholder="Task Title"
                  value={formState.title}
                  onChange={e => setFormState({...formState, title: e.target.value})}
                />
              </div>

              <div>
                <textarea 
                  className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:ring-1 focus:ring-white transition-all placeholder-zinc-600 h-24 resize-none"
                  placeholder="Description..."
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                />
                <div className="mt-2 flex justify-end">
                   <AIButton onClick={handleSmartPriority} loading={priorityLoading} label="Suggest Priority" size="sm" variant="secondary" icon={Bot} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Priority</label>
                    <select 
                      className="w-full bg-black text-white rounded-md p-2 border border-white/10 text-xs"
                      value={formState.priority}
                      onChange={e => setFormState({...formState, priority: e.target.value as Priority})}
                    >
                      <option value={Priority.P1}>High Impact</option>
                      <option value={Priority.P2}>Deadline</option>
                      <option value={Priority.P3}>Normal</option>
                    </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Division</label>
                  <select 
                      className="w-full bg-black text-white rounded-md p-2 border border-white/10 text-xs"
                      value={formState.division}
                      onChange={e => setFormState({...formState, division: e.target.value as Division})}
                    >
                      {Object.values(Division).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Deadline</label>
                <input 
                  type="date"
                  className="w-full bg-black text-white rounded-md p-2 border border-white/10 text-xs"
                  value={formState.deadline || ''}
                  onChange={e => setFormState({...formState, deadline: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-md text-zinc-400 font-medium hover:text-white transition-colors text-xs border border-transparent hover:border-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!formState.title}
                  className="flex-1 py-2.5 bg-white text-black rounded-md font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 text-xs shadow-glow"
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