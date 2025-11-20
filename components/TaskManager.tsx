import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, Priority, Division, TaskStatus } from '../types';
import { Plus, Calendar, ChevronRight, Trash2, CheckCircle, ArrowRight } from 'lucide-react';
import { determinePriority } from '../services/geminiService';

interface TaskManagerProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onSaveTask, onDeleteTask }) => {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>(TaskCategory.TODAY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formState, setFormState] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: TaskCategory.TODAY,
    status: TaskStatus.OPEN,
    division: Division.OPS,
    notes: ''
  });

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.category === activeCategory)
      .sort((a, b) => {
        // Sort by Priority (P1 > P2 > P3) then Status
        if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        return 0;
      });
  }, [tasks, activeCategory]);

  const handleCreate = () => {
    if (!formState.title) return;
    
    const priority = determinePriority(formState.title || '', formState.description || '');
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      title: formState.title!,
      description: formState.description || '',
      category: formState.category || activeCategory,
      priority: priority as Priority,
      status: formState.status || TaskStatus.OPEN,
      division: formState.division || Division.OPS,
      createdAt: new Date().toISOString(),
      notes: formState.notes || '',
      deadline: formState.deadline
    };
    
    onSaveTask(newTask);
    setIsModalOpen(false);
    setFormState({ title: '', description: '', category: activeCategory });
  };

  const getPriorityBadge = (p: Priority) => {
    switch(p) {
      case Priority.P1: return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">P1 - High</span>;
      case Priority.P2: return <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">P2 - Deadline</span>;
      default: return <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">P3 - Normal</span>;
    }
  };

  const cycleStatus = (task: Task) => {
    let nextStatus = TaskStatus.OPEN;
    if (task.status === TaskStatus.OPEN) nextStatus = TaskStatus.IN_PROGRESS;
    else if (task.status === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.CLOSED;
    else nextStatus = TaskStatus.OPEN; // Cycle back or keep closed? usually keep closed but for toggle sake
    
    onSaveTask({ ...task, status: nextStatus });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task Manager</h2>
          <p className="text-gray-500 text-sm">Kelola tugas berdasarkan urgensi waktu.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-anteraja-pink hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors font-medium"
        >
          <Plus size={18} /> New Task
        </button>
      </header>

      {/* Category Tabs */}
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 mb-6 w-full max-w-md">
        {Object.values(TaskCategory).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeCategory === cat 
                ? 'bg-anteraja-purple text-white shadow' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-gray-400 mb-2">Tidak ada tugas di kategori ini</div>
            <button onClick={() => setIsModalOpen(true)} className="text-anteraja-pink font-medium text-sm">Buat tugas baru +</button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all hover:border-anteraja-purple group ${task.status === TaskStatus.CLOSED ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityBadge(task.priority)}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      task.status === TaskStatus.CLOSED ? 'bg-green-100 text-green-700' :
                      task.status === TaskStatus.IN_PROGRESS ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ArrowRight size={10} /> {task.division}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-gray-800 ${task.status === TaskStatus.CLOSED ? 'line-through decoration-gray-400' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                  
                  {task.deadline && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-red-600 font-medium">
                      <Calendar size={12} /> Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button 
                    onClick={() => cycleStatus(task)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Cycle Status"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Tugas Baru</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-anteraja-pink focus:border-transparent outline-none"
                  placeholder="Contoh: Cek komplain SLA Mitra X"
                  value={formState.title}
                  onChange={e => setFormState({...formState, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-anteraja-pink outline-none h-24"
                  placeholder="Detail tugas..."
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">*Prioritas akan ditentukan otomatis dari kata kunci di judul & deskripsi.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white"
                    value={formState.category}
                    onChange={e => setFormState({...formState, category: e.target.value as TaskCategory})}
                  >
                    {Object.values(TaskCategory).map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Divisi Terkait</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Opsional)</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                  value={formState.deadline || ''}
                  onChange={e => setFormState({...formState, deadline: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!formState.title}
                  className="flex-1 py-2.5 bg-anteraja-purple text-white rounded-lg font-medium hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Simpan Tugas
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