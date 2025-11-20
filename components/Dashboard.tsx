
import React, { useState, useMemo } from 'react';
import { Task, Issue, VisitNote } from '../types';
import { CheckCircle2, AlertOctagon, ClipboardList, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, X, MessageCircle } from 'lucide-react';
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
      label: 'Task Today', 
      value: todayTasks.length, 
      icon: <ClipboardList className="text-white" size={24} />, 
      bg: 'bg-blue-500' 
    },
    { 
      label: 'SLA Breach (>24h)', 
      value: overdueIssues.length, 
      icon: <AlertOctagon className="text-white" size={24} />, 
      bg: 'bg-red-500' 
    },
    { 
      label: 'Pending Visits', 
      value: visits.filter(v => v.status !== 'DONE').length, 
      icon: <MapPin className="text-white" size={24} />, 
      bg: 'bg-purple-500' 
    },
    { 
      label: 'Completed Visits', 
      value: visits.filter(v => v.status === 'DONE').length, 
      icon: <CheckCircle2 className="text-white" size={24} />, 
      bg: 'bg-green-500' 
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
    const visitEvents = visits.filter(v => v.visitDatePlan === dateStr && v.status !== 'DONE'); // Planned visits only
    
    return { taskEvents, visitEvents };
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const { taskEvents, visitEvents } = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 border border-gray-100 p-1 relative cursor-pointer transition-colors hover:bg-blue-50 ${isToday ? 'bg-blue-50 ring-1 ring-blue-400 inset-0' : 'bg-white'}`}
        >
          <span className={`text-xs font-semibold p-1 rounded-full w-6 h-6 flex items-center justify-center ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
            {day}
          </span>
          
          <div className="mt-1 space-y-1 overflow-hidden max-h-[50px]">
            {visitEvents.map(v => (
              <div key={v.id} className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded truncate border border-purple-200">
                📍 {v.partnerName}
              </div>
            ))}
            {taskEvents.map(t => (
              <div key={t.id} className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded truncate border border-amber-200">
                ⏰ {t.title}
              </div>
            ))}
          </div>
          {(taskEvents.length + visitEvents.length) > 3 && (
             <div className="text-[9px] text-gray-400 pl-1">+ {taskEvents.length + visitEvents.length - 3} more</div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 pb-10 relative">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-500">Monitor operasional dan jadwal kunjungan.</p>
        </div>
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-anteraja-purple text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <MessageCircle /> AI Assistant
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon className="text-anteraja-purple" size={20}/> Operational Calendar
            </h3>
            <div className="flex items-center gap-4">
               <span className="text-sm font-semibold text-gray-700">
                 {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
               </span>
               <div className="flex gap-1">
                 <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
                 <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 mb-2 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-xs font-bold text-gray-400 uppercase py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 rounded-lg overflow-hidden border border-gray-100">
            {renderCalendar()}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> Plan Visit</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div> Task Deadline</div>
          </div>
        </div>

        {/* Charts & Urgent Tasks */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[320px]">
            <h3 className="text-lg font-bold mb-4">Task Priority</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-sm font-bold mb-3 uppercase text-red-600 flex items-center gap-2">
                <AlertOctagon size={16}/> Urgent Tasks (P1)
             </h3>
             <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No active P1 tasks.</p>
                ) : (
                  tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').map(t => (
                    <div key={t.id} className="text-xs p-2 bg-red-50 border border-red-100 rounded flex justify-between">
                      <span className="font-medium text-gray-700 truncate max-w-[70%]">{t.title}</span>
                      <span className="text-red-500 font-bold">{t.category}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-anteraja-purple text-white p-4 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                   <CalendarIcon size={20} />
                   {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                {/* Visits Section */}
                <div>
                   <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Rencana Kunjungan Pengusaha</h4>
                   {getEventsForDay(selectedDate.getDate()).visitEvents.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-2">Tidak ada rencana visit.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).visitEvents.map(v => (
                        <div key={v.id} className="p-3 bg-purple-50 border border-purple-100 rounded-lg mb-2">
                           <div className="font-bold text-purple-900">{v.partnerName}</div>
                           {v.googleMapsLink && <a href={v.googleMapsLink} target="_blank" className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-1"><MapPin size={12}/> Lihat Lokasi</a>}
                        </div>
                      ))
                   )}
                </div>

                <div className="border-t border-gray-100 pt-2">
                   <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Deadline Tugas</h4>
                   {getEventsForDay(selectedDate.getDate()).taskEvents.length === 0 ? (
                      <p className="text-sm text-gray-400 italic px-2">Tidak ada deadline.</p>
                   ) : (
                      getEventsForDay(selectedDate.getDate()).taskEvents.map(t => (
                        <div key={t.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-2">
                           <div className="font-bold text-amber-900">{t.title}</div>
                           <div className="text-xs text-amber-700 mt-1">{t.description}</div>
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
      />
    </div>
  );
};

export default Dashboard;
