
import React, { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, AlertTriangle, MapPin, Menu, Database, Settings, Box, Flame, Users, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnectedToSheets: boolean;
  onOpenSettings: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isConnectedToSheets, onOpenSettings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'tasks', label: 'Task Manager', icon: <ListTodo size={18} /> },
    { id: 'partners', label: 'Partners', icon: <Users size={18} /> }, 
    { id: 'issues', label: 'Issue Tracker', icon: <AlertTriangle size={18} /> },
    { id: 'visits', label: 'Visit Notes', icon: <MapPin size={18} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={18} /> }, 
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-zinc-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-950/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 border-b border-zinc-800">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-900 shadow-sm">
              <Box size={18} strokeWidth={3} />
           </div>
           <h1 className="font-bold text-sm tracking-wide text-white">
             Business Eco
           </h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400 hover:text-white">
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`
        fixed md:sticky md:top-0 h-full z-40 bg-zinc-950 border-r border-zinc-800 w-64 transition-transform transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-black shadow-sm">
             <Box size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
               Business Eco
            </h1>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Workspace</p>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border border-transparent
                ${activeTab === item.id 
                  ? 'bg-zinc-800 text-white shadow-sm border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
            >
              <span className={activeTab === item.id ? "text-white" : "text-zinc-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-zinc-800 space-y-4 bg-zinc-900/30">
          <div className={`p-3 rounded-xl text-xs flex items-center gap-3 border ${isConnectedToSheets ? 'bg-zinc-900 border-zinc-700 text-emerald-400' : 'bg-zinc-900 border-zinc-700 text-rose-400'}`}>
            <div className={`p-1.5 rounded-full ${isConnectedToSheets ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
              {isConnectedToSheets ? <Flame size={12} fill="currentColor" /> : <Database size={12} />}
            </div>
            <div className="flex-1">
               <p className="font-bold text-zinc-300">{isConnectedToSheets ? 'Connected' : 'Offline'}</p>
               <p className="opacity-70 text-[10px] text-zinc-500">Realtime Sync</p>
            </div>
          </div>

          <button 
            onClick={() => {
              onOpenSettings();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Settings size={14} /> PREFERENCES
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen md:p-8 p-4 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
