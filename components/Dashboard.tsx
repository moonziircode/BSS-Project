
import React, { useState } from 'react';
import { Task, Issue, VisitNote } from '../types';
import { CheckCircle2, AlertOctagon, ClipboardList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, X, MessageCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AIChatWindow from './AI/AIChatWindow';

interface DashboardProps {
  tasks: Task[];
  issues: Issue[];
  visits: VisitNote[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, issues, visits }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const todayTasks = tasks.filter(t => t.category === 'TODAY' && t.status !== 'CLOSED');
  const overdueIssues = issues.filter(i => {
    const created = new Date(i.createdAt).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff > 24 && i.status !== 'DONE';
  });
  
  // Stats Logic
  const stats = [
    { 
      label: 'Tasks Today', 
      value: todayTasks.length, 
      icon: <ClipboardList className="text-blue-400" size={24} />, 
      color: 'border-blue-500/30' 
    },
    { 
      label: 'SLA Critical', 
      value: overdueIssues.length, 
      icon: <AlertOctagon className="text-red-400" size={24} />, 
      color: 'border-red-500/30' 
    },
    { 
      label: 'Visits Plan', 
      value: visits.filter(v => v.status !== 'DONE').length, 
      icon: <MapPin className="text-purple-400" size={24} />, 
      color: 'border-purple-500/30' 
    },
    { 
      label: 'Completed', 
      value: visits.filter(v => v.status === 'DONE').length, 
      icon: <CheckCircle2 className="text-neon" size={24} />, 
      color: 'border-neon/30' 
    },
  ];

  const priorityData = [
    { name: 'P1 High', count: tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length, color: '#EF4444' },
    { name: 'P2 Deadline', count: tasks.filter(t => t.priority === 'PRIORITY_2' && t.status !== 'CLOSED').length, color: '#F59E0B' },
    { name: 'P3 Nice', count: tasks.filter(t => t.priority === 'PRIORITY_3' && t.status !== 'CLOSED').length, color: '#3B82F6' },
  ];

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 Sunday
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const taskEvents = tasks.filter(t => t.deadline === dateStr && t.status !== 'CLOSED');
    const visitEvents = visits.filter(v => v.visitDatePlan === dateStr && v.status !== 'DONE');
    return { taskEvents, visitEvents };
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-bg-main/50 border-r border-b border-slate-800"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const { taskEvents, visitEvents } = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 border-r border-b border-slate-800 p-2 relative cursor-pointer transition-all hover:bg-slate-800/50 
            ${isToday ? 'bg-slate-800/80 shadow-[inset_0_0_20px_rgba(106,143,115,0.1)]' : ''}`}
        >
          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full 
            ${isToday ? 'bg-neon text-white' : 'text-gray-500'}`}>
            {day}
          </span>
          
          <div className="mt-2 space-y-1 overflow-hidden max-h-[50px]">
            {visitEvents.map(v => (
              <div key={v.id} className="flex items-center gap-1 text-[9px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 truncate">
                <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                {v.partnerName}
              </div>
            ))}
            {taskEvents.map(t => (
              <div key={t.id} className="flex items-center gap-1 text-[9px] bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 truncate">
                <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-8 pb-10 relative">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">BE Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time operational overview & analytics.</p>
        </div>
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group bg-bg-card border border-neon/50 text-neon px-5 py-2.5 rounded-xl shadow-neu-flat hover:shadow-neon transition-all duration-300 flex items-center gap-3"
        >
          <MessageCircle className="group-hover:scale-110 transition-transform" /> 
          <span className="font-semibold tracking-wide">AI Assistant</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-bg-card p-6 rounded-2xl shadow-neu-flat border-l-4 ${stat.color} relative overflow-hidden group hover:translate-y-[-2px] transition-transform`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className="p-3 bg-bg-main rounded-xl shadow-neu-pressed">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-2 bg-bg-card p-1 rounded-3xl shadow-neu-flat border border-slate-800">
          <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <CalendarIcon className="text-neon" size={20}/> 
              Operational Schedule
            </h3>
            <div className="flex items-center gap-4 bg-bg-main px-4 py-2 rounded-xl shadow-neu-pressed">
               <button onClick={prevMonth} className="text-gray-400 hover:text-white"><ChevronLeft size={18}/></button>
               <span className="text-sm font-bold text-gray-200 w-32 text-center">
                 {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={nextMonth} className="text-gray-400 hover:text-white"><ChevronRight size={18}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center bg-bg-card">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-[10px] font-bold text-neon uppercase py-3 tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 bg-bg-main border-t border-l border-slate-800 rounded-b-2xl overflow-hidden">
            {renderCalendar()}
          </div>
        </div>

        {/* Charts & Urgent Tasks */}
        <div className="space-y-6">
          <div className="bg-bg-card p-6 rounded-3xl shadow-neu-flat border border-slate-800 h-[320px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Activity size={16} className="text-neon" /> Workload Priority
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{filter: `drop-shadow(0 0 8px ${entry.color}50)`}} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-bg-card p-6 rounded-3xl shadow-neu-flat border border-slate-800">
             <h3 className="text-sm font-bold mb-4 uppercase text-red-400 flex items-center gap-2 tracking-wider">
                <AlertOctagon size={16} className="animate-pulse"/> High Priority (P1)
             </h3>
             <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs italic bg-bg-main rounded-xl border border-dashed border-slate-700">
                    No critical tasks. Good job.
                  </div>
                ) : (
                  tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').map(t => (
                    <div key={t.id} className="p-3 bg-bg-main border-l-2 border-red-500 rounded-r-xl shadow-sm flex justify-between items-center group hover:bg-slate-900 transition-colors">
                      <span className="text-sm font-medium text-gray-300 truncate max-w-[70%] group-hover:text-white">{t.title}</span>
                      <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">{t.category}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-bg-card border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-bg-main p-5 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                   <CalendarIcon size={20} className="text-neon" />
                   {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-white transition-colors p-1"><X size={20}/></button>
              </div>
              
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-6">
                {/* Visits Section */}
                <div>
                   <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Rencana Kunjungan Pengusaha</h4>
                   {getEventsForDay(selectedDate.getDate()).visitEvents.length === 0 ? (
                      <p className="text-sm text-gray-500 italic px-2">Tidak ada rencana visit.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).visitEvents.map(v => (
                        <div key={v.id} className="p-4 bg-bg-main border border-slate-700 rounded-xl mb-2 shadow-sm">
                           <div className="font-bold text-gray-200">{v.partnerName}</div>
                           {v.googleMapsLink && <a href={v.googleMapsLink} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"><MapPin size={12}/> Lihat Lokasi</a>}
                        </div>
                      ))
                   )}
                </div>

                <div className="border-t border-slate-800 pt-4">
                   <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Deadline Tugas</h4>
                   {getEventsForDay(selectedDate.getDate()).taskEvents.length === 0 ? (
                      <p className="text-sm text-gray-500 italic px-2">Tidak ada deadline.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).taskEvents.map(t => (
                        <div key={t.id} className="p-4 bg-bg-main border border-slate-700 rounded-xl mb-2 shadow-sm">
                           <div className="font-bold text-gray-200">{t.title}</div>
                           <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                        </div>
                      ))
                   )}
                </div>
              </div>
           </div>
        </div>
      )}
      
      <AIChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        tasks={tasks}
        issues={issues}
        visits={visits}
        onSaveTask={(t) => {}} // Handled via main app logic mainly, dashboard just views
        onSaveVisit={(v) => {}}
      />
    </div>
  );
};

export default Dashboard;
