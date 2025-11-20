import React, { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, AlertTriangle, MapPin, Menu, Database, Settings, CheckCircle2 } from 'lucide-react';

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
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'tasks', label: 'Task Manager', icon: <ListTodo size={20} /> },
    { id: 'issues', label: 'Issue Tracker', icon: <AlertTriangle size={20} /> },
    { id: 'visits', label: 'Visit Notes', icon: <MapPin size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-800">
      {/* Mobile Header */}
      <div className="md:hidden bg-anteraja-purple text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-lg">Business Ecosystem</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu />
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <nav className={`
        fixed md:sticky md:top-0 h-full z-40 bg-white w-64 border-r border-gray-200 transition-transform transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <h1 className="text-xl font-bold text-anteraja-purple">Business Ecosystem</h1>
          <p className="text-xs text-gray-500 mt-1">Success Specialist</p>
        </div>

        <div className="flex-1 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? 'bg-anteraja-light text-anteraja-pink border-r-4 border-anteraja-pink' 
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className={`p-3 rounded-lg text-xs border ${isConnectedToSheets ? 'bg-green-50 border-green-100 text-green-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <div className="flex items-center gap-2 mb-1 font-semibold">
              {isConnectedToSheets ? <Database size={14} /> : <Database size={14} />}
              {isConnectedToSheets ? 'Google Sheets Sync' : 'Local Storage'}
            </div>
            <p className="opacity-80">
              {isConnectedToSheets ? 'Data tersimpan di cloud.' : 'Data tersimpan lokal.'}
            </p>
          </div>

          <button 
            onClick={() => {
              onOpenSettings();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Settings size={14} /> Konfigurasi Koneksi
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {children}
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;