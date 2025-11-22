import React, { useState } from 'react';
import { Task, Issue, VisitNote } from '../types';
import { CheckCircle2, AlertOctagon, ClipboardList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, X, MessageCircle, Activity, ArrowUpRight } from 'lucide-react';
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
      icon: <ClipboardList className="text-zinc-100" size={20} />, 
    },
    { 
      label: 'SLA Critical', 
      value: overdueIssues.length, 
      icon: <AlertOctagon className="text-zinc-100" size={20} />, 
      alert: overdueIssues.length > 0
    },
    { 
      label: 'Visits Plan', 
      value: visits.filter(v => v.status !== 'DONE').length, 
      icon: <MapPin className="text-zinc-100" size={20} />, 
    },
    { 
      label: 'Completed', 
      value: visits.filter(v => v.status === 'DONE').length, 
      icon: <CheckCircle2 className="text-zinc-100" size={20} />, 
    },
  ];

  const priorityData = [
    { name: 'High Priority', count: tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length, color: '#ffffff' },
    { name: 'Deadline', count: tasks.filter(t => t.priority === 'PRIORITY_2' && t.status !== 'CLOSED').length, color: '#a1a1aa' },
    { name: 'Normal', count: tasks.filter(t => t.priority === 'PRIORITY_3' && t.status !== 'CLOSED').length, color: '#52525b' },
  ];

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 Sunday
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${day.toString().padStart(2, '0')}`;
    const taskEvents = tasks.filter(t => t.deadline === dateStr && t.status !== 'CLOSED');
    const visitEvents = visits.filter(v => v.visitDatePlan === dateStr && v.status !== 'DONE');
    return { taskEvents, visitEvents };
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-black/20 border-r border-b border-border"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const { taskEvents, visitEvents } = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 border-r border-b border-border p-2 relative cursor-pointer transition-colors hover:bg-zinc-900
            ${isToday ? 'bg-zinc-900' : ''}`}
        >
          <span className={`text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded 
            ${isToday ? 'bg-white text-black' : 'text-zinc-500'}`}>
            {day}
          </span>
          
          <div className="mt-2 space-y-1 overflow-hidden max-h-[50px]">
            {visitEvents.map(v => (
              <div key={v.id} className="flex items-center gap-1 text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-sm border border-zinc-700 truncate">
                <div className="w-1 h-1 rounded-full bg-white"></div>
                {v.partnerName}
              </div>
            ))}
            {taskEvents.map(t => (
              <div key={t.id} className="flex items-center gap-1 text-[9px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded-sm border border-zinc-800 truncate">
                <div className="w-1 h-1 rounded-full bg-zinc-500"></div>
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
    <div className="space-y-8 pb-10 relative font-light">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Overview</h2>
          <p className="text-zinc-500 text-xs mt-1 font-normal">Operational analytics & daily briefing.</p>
        </div>
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group bg-white text-black px-4 py-2 rounded-md shadow-glow transition-all duration-300 flex items-center gap-2 hover:bg-zinc-200"
        >
          <MessageCircle size={16} /> 
          <span className="text-xs font-medium">AI Assistant</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-3">{stat.label}</p>
                <p className="text-2xl font-light text-white">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg border ${stat.alert ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-zinc-900 border-zinc-800'}`}>
                {stat.icon}
              </div>
            </div>
            {stat.alert && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-border bg-black/40">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <CalendarIcon size={14} className="text-zinc-400"/> 
              Schedule
            </h3>
            <div className="flex items-center gap-2 bg-black border border-border px-2 py-1 rounded-md">
               <button onClick={prevMonth} className="text-zinc-500 hover:text-white"><ChevronLeft size={14}/></button>
               <span className="text-xs font-medium text-zinc-300 w-24 text-center">
                 {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={nextMonth} className="text-zinc-500 hover:text-white"><ChevronRight size={14}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center bg-zinc-900/50 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-semibold text-zinc-500 uppercase py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 bg-black/20 flex-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Charts & Urgent Tasks */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-xl h-[300px]">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={14} /> Distribution
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#71717a'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '4px', border: '1px solid #27272a', color: '#fff', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]} barSize={16}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-5 rounded-xl min-h-[200px]">
             <h3 className="text-xs font-semibold mb-4 uppercase text-zinc-400 flex items-center justify-between tracking-widest">
                <span>Critical Path</span>
                <AlertOctagon size={12} className="text-white"/> 
             </h3>
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length === 0 ? (
                  <div className="text-center py-6 text-zinc-600 text-xs italic">
                    All systems normal.
                  </div>
                ) : (
                  tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').map(t => (
                    <div key={t.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-md flex justify-between items-center hover:border-zinc-600 transition-colors cursor-default">
                      <span className="text-xs font-medium text-zinc-300 truncate max-w-[70%]">{t.title}</span>
                      <ArrowUpRight size={12} className="text-zinc-500" />
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="glass-panel rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-zinc-900/50 p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-medium text-sm text-white flex items-center gap-2">
                   <CalendarIcon size={14} className="text-zinc-400" />
                   {selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={16}/></button>
              </div>
              
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-6">
                {/* Visits Section */}
                <div>
                   <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Visits</h4>
                   {getEventsForDay(selectedDate.getDate()).visitEvents.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No visits planned.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).visitEvents.map(v => (
                        <div key={v.id} className="p-3 bg-black border border-border rounded-md mb-2 flex justify-between items-center">
                           <div className="font-medium text-sm text-zinc-200">{v.partnerName}</div>
                           {v.googleMapsLink && <a href={v.googleMapsLink} target="_blank" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"><MapPin size={12}/> Maps</a>}
                        </div>
                      ))
                   )}
                </div>

                <div className="border-t border-border pt-4">
                   <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Deadlines</h4>
                   {getEventsForDay(selectedDate.getDate()).taskEvents.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No active deadlines.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).taskEvents.map(t => (
                        <div key={t.id} className="p-3 bg-black border border-border rounded-md mb-2">
                           <div className="font-medium text-sm text-zinc-200">{t.title}</div>
                           <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{t.description}</div>
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
        onSaveTask={(t) => {}} 
        onSaveVisit={(v) => {}}
      />
    </div>
  );
};

export default Dashboard;