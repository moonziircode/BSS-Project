import React from 'react';
import { Task, Issue } from '../types';
import { CheckCircle2, AlertOctagon, ClipboardList, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  tasks: Task[];
  issues: Issue[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, issues }) => {
  const todayTasks = tasks.filter(t => t.category === 'TODAY' && t.status !== 'CLOSED');
  const overdueIssues = issues.filter(i => {
    const created = new Date(i.createdAt).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff > 24 && i.status !== 'DONE';
  });
  const waitingTasks = tasks.filter(t => t.category === 'WAITING_UPDATE' && t.status !== 'CLOSED');

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
      label: 'Waiting Update', 
      value: waitingTasks.length, 
      icon: <Clock className="text-white" size={24} />, 
      bg: 'bg-yellow-500' 
    },
    { 
      label: 'Tasks Closed', 
      value: tasks.filter(t => t.status === 'CLOSED').length, 
      icon: <CheckCircle2 className="text-white" size={24} />, 
      bg: 'bg-green-500' 
    },
  ];

  // Chart Data
  const priorityData = [
    { name: 'Priority 1', count: tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length, color: '#EF4444' },
    { name: 'Priority 2', count: tasks.filter(t => t.priority === 'PRIORITY_2' && t.status !== 'CLOSED').length, color: '#F59E0B' },
    { name: 'Priority 3', count: tasks.filter(t => t.priority === 'PRIORITY_3' && t.status !== 'CLOSED').length, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Pantau performa operasional dan prioritas hari ini.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-anteraja-pink rounded-full"></span>
            Urgent Tasks (Priority 1)
          </h3>
          <div className="space-y-3">
            {tasks.filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED').length === 0 ? (
               <p className="text-gray-400 italic text-sm py-4">Tidak ada task Priority 1 yang aktif.</p>
            ) : (
              tasks
                .filter(t => t.priority === 'PRIORITY_1' && t.status !== 'CLOSED')
                .slice(0, 5)
                .map(task => (
                  <div key={task.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-red-700 mt-1 line-clamp-1">{task.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-white rounded text-red-600 font-bold border border-red-200">
                      {task.category}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Priority Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Distribusi Beban Kerja</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;