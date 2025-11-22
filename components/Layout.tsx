import React, { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, AlertTriangle, MapPin, Menu, Database, Settings, Box, Flame } from 'lucide-react';

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
    { id: 'issues', label: 'Issue Tracker', icon: <AlertTriangle size={18} /> },
    { id: 'visits', label: 'Visit Notes', icon: <MapPin size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-zinc-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-black/50 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 border-b border-border">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black">
              <Box size={16} strokeWidth={3} />
           </div>
           <h1 className="font-semibold text-sm tracking-wide">
             Business Eco
           </h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400">
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`
        fixed md:sticky md:top-0 h-full z-40 bg-background w-64 border-r border-border transition-transform transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-black shadow-glow">
             <Box size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
               Business Eco
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Workspace</p>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-light rounded-md transition-all duration-200 border border-transparent
                ${activeTab === item.id 
                  ? 'bg-surfaceHighlight text-white border-border shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
            >
              <span className={activeTab === item.id ? "text-white" : "text-zinc-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-border space-y-4">
          <div className={`p-3 rounded-md text-xs flex items-center gap-3 border ${isConnectedToSheets ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
            <div className={`p-1.5 rounded-full ${isConnectedToSheets ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20'}`}>
              {isConnectedToSheets ? <Flame size={12} fill="currentColor" /> : <Database size={12} />}
            </div>
            <div className="flex-1">
               <p className="font-medium">{isConnectedToSheets ? 'Connected' : 'Offline'}</p>
               <p className="opacity-50 text-[10px] font-light">Realtime DB</p>
            </div>
          </div>

          <button 
            onClick={() => {
              onOpenSettings();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors border border-transparent hover:border-zinc-800"
          >
            <Settings size={14} /> PREFERENCES
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-black/95 md:p-8 p-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;