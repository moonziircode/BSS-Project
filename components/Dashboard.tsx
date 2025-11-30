
import React, { useState } from 'react';
import { Task, Issue, VisitNote } from '../types';
import { CheckCircle2, AlertOctagon, ClipboardList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, X, MessageCircle, Activity, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  
  // Stats Logic - Icons keep color, backgrounds are neutral
  const stats = [
    { 
      label: 'Tasks Today', 
      value: todayTasks.length, 
      icon: <ClipboardList className="text-white" size={20} />, 
      border: "border-zinc-800",
      iconBg: "bg-zinc-800"
    },
    { 
      label: 'SLA Critical', 
      value: overdueIssues.length, 
      icon: <AlertOctagon className="text-rose-500" size={20} />, 
      border: overdueIssues.length > 0 ? "border-rose-900/50" : "border-zinc-800",
      iconBg: "bg-zinc-800",
      alert: overdueIssues.length > 0
    },
    { 
      label: 'Visits Plan', 
      value: visits.filter(v => v.status !== 'DONE').length, 
      icon: <MapPin className="text-emerald-400" size={20} />, 
      border: "border-zinc-800",
      iconBg: "bg-zinc-800"
    },
    { 
      label: 'Completed', 
      value: visits.filter(v => v.status === 'DONE').length, 
      icon: <CheckCircle2 className="text-indigo-400" size={20} />, 
      border: "border-zinc-800",
      iconBg: "bg-zinc-800"
    },
  ];

  const priorityData = [
    { name: 'High Priority', count: tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length, color: '#f43f5e' }, // Rose
    { name: 'Deadline', count: tasks.filter(t => t.priority === 'PRIORITY_2' && t.status !== 'CLOSED').length, color: '#fbbf24' }, // Amber
    { name: 'Normal', count: tasks.filter(t => t.priority === 'PRIORITY_3' && t.status !== 'CLOSED').length, color: '#a1a1aa' }, // Zinc
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
      days.push(<div key={`empty-${i}`} className="h-24 bg-zinc-900/30 border-r border-b border-zinc-800"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const { taskEvents, visitEvents } = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 border-r border-b border-zinc-800 p-2 relative cursor-pointer transition-colors hover:bg-zinc-800/50
            ${isToday ? 'bg-white/5' : ''}`}
        >
          <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full 
            ${isToday ? 'bg-white text-black shadow-sm' : 'text-zinc-500'}`}>
            {day}
          </span>
          
          <div className="mt-2 space-y-1 overflow-hidden max-h-[50px]">
            {visitEvents.map(v => (
              <div key={v.id} className="flex items-center gap-1 text-[9px] bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-700 truncate">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                {v.partnerName}
              </div>
            ))}
            {taskEvents.map(t => (
              <div key={t.id} className="flex items-center gap-1 text-[9px] bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700 truncate">
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
    <div className="space-y-8 pb-10 relative">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-zinc-500 text-sm mt-1">Daily operational briefing & analytics.</p>
        </div>
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group bg-white text-black px-5 py-2.5 rounded-xl shadow-glow transition-all duration-300 flex items-center gap-2 hover:bg-zinc-200 active:scale-95"
        >
          <MessageCircle size={18} /> 
          <span className="text-xs font-bold uppercase tracking-wide">AI Assistant</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`glass-panel p-5 rounded-2xl relative overflow-hidden group border ${stat.border}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
            {stat.alert && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col border-zinc-800">
          <div className="p-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <CalendarIcon size={16} className="text-zinc-400"/> 
              Schedule
            </h3>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
               <button onClick={prevMonth} className="text-zinc-500 hover:text-white"><ChevronLeft size={16}/></button>
               <span className="text-xs font-bold text-zinc-300 w-24 text-center uppercase">
                 {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
               </span>
               <button onClick={nextMonth} className="text-zinc-500 hover:text-white"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center bg-zinc-900 border-b border-zinc-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-bold text-zinc-500 uppercase py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 bg-zinc-950/30 flex-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Charts & Urgent Tasks */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl h-[320px] border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={14} className="text-zinc-500"/> Task Distribution
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#71717a', fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', color: '#f4f4f5', fontSize: '12px' }} 
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-5 rounded-2xl min-h-[200px] border border-zinc-800">
             <h3 className="text-xs font-bold mb-4 uppercase text-zinc-400 flex items-center justify-between tracking-widest">
                <span>Critical Path</span>
                <AlertOctagon size={14} className="text-rose-500"/> 
             </h3>
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs italic">
                    All clear. No critical tasks.
                  </div>
                ) : (
                  tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').map(t => (
                    <div key={t.id} className="p-3 bg-zinc-900 border border-rose-500/20 rounded-lg flex justify-between items-center hover:bg-zinc-800 transition-colors cursor-default group">
                      <span className="text-xs font-semibold text-rose-300 truncate max-w-[70%]">{t.title}</span>
                      <ArrowUpRight size={14} className="text-rose-400 group-hover:text-rose-200" />
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-zinc-700">
              <div className="bg-zinc-900 p-4 border-b border-zinc-700 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                   <CalendarIcon size={16} className="text-zinc-400" />
                   {selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800 p-1 rounded-md"><X size={16}/></button>
              </div>
              
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-6">
                {/* Visits Section */}
                <div>
                   <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={12}/> Visits</h4>
                   {getEventsForDay(selectedDate.getDate()).visitEvents.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded p-3 text-center">No visits planned.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).visitEvents.map(v => (
                        <div key={v.id} className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-2 flex justify-between items-center hover:bg-zinc-800 transition-colors">
                           <div className="font-semibold text-sm text-zinc-200">{v.partnerName}</div>
                           {v.googleMapsLink && <a href={v.googleMapsLink} target="_blank" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-700/50 px-2 py-1 rounded"><MapPin size={12}/> Maps</a>}
                        </div>
                      ))
                   )}
                </div>

                <div className="border-t border-zinc-800 pt-4">
                   <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={12}/> Deadlines</h4>
                   {getEventsForDay(selectedDate.getDate()).taskEvents.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded p-3 text-center">No active deadlines.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).taskEvents.map(t => (
                        <div key={t.id} className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-2 hover:bg-zinc-800 transition-colors">
                           <div className="font-semibold text-sm text-zinc-200">{t.title}</div>
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
