import React, { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, AlertTriangle, MapPin, Menu, Database, Settings, Box } from 'lucide-react';

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
    { id: 'dashboard', label: 'BE Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'tasks', label: 'Task Manager', icon: <ListTodo size={20} /> },
    { id: 'issues', label: 'Issue Tracker', icon: <AlertTriangle size={20} /> },
    { id: 'visits', label: 'Visit Notes', icon: <MapPin size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-bg-main flex flex-col md:flex-row text-text-primary selection:bg-neon selection:text-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-bg-card p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-700 shadow-neu-flat">
        <div className="flex items-center gap-2">
           <Box className="text-neon" size={24} />
           <h1 className="font-bold text-lg tracking-wide text-neon">
             Business Ecosystem
           </h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300">
          <Menu />
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <nav className={`
        fixed md:sticky md:top-0 h-full z-40 bg-bg-card w-64 border-r border-slate-800 shadow-[4px_0_15px_rgba(0,0,0,0.3)] transition-transform transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-8 hidden md:block">
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
             <Box className="text-neon" size={28} />
             Business Eco
          </h1>
          <p className="text-xs text-neon mt-1 tracking-widest uppercase opacity-80 pl-9">BE Dashboard</p>
        </div>

        <div className="flex-1 px-4 space-y-3 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium rounded-xl transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-bg-main text-neon shadow-neu-pressed border border-slate-700' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                }`}
            >
              <span>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className={`p-3 rounded-xl text-xs flex items-center gap-3 transition-all
            ${isConnectedToSheets 
              ? 'bg-green-900/20 border border-green-800/50 text-green-400' 
              : 'bg-blue-900/20 border border-blue-800/50 text-blue-400'
            }`}>
            <div className={`p-1.5 rounded-full ${isConnectedToSheets ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
              <Database size={14} /> 
            </div>
            <div className="flex-1">
               <p className="font-bold">{isConnectedToSheets ? 'Cloud Sync' : 'Local Mode'}</p>
               <p className="opacity-60 text-[10px]">{isConnectedToSheets ? 'Active' : 'Storage'}</p>
            </div>
          </div>

          <button 
            onClick={() => {
              onOpenSettings();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold text-gray-400 bg-bg-main rounded-xl shadow-neu-flat hover:text-neon transition-colors active:shadow-neu-pressed"
          >
            <Settings size={14} /> SETTINGS
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-bg-main scroll-smooth">
        {children}
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