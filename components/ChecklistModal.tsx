import React, { useEffect, useState } from 'react';
import { Sun, Moon, X, Check } from 'lucide-react';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'MORNING' | 'EVENING'>('MORNING');
  const hour = new Date().getHours();

  useEffect(() => {
    if (hour >= 15) setMode('EVENING');
    else setMode('MORNING');
  }, [hour]);

  if (!isOpen) return null;

  const morningItems = [
    "Review 3 Priority Tasks",
    "Check 'TODAY' List",
    "Check Urgent Tickets (<4h SLA)",
    "Clear Email/WhatsApp Inbox"
  ];

  const eveningItems = [
    "Close Completed Tasks",
    "Move Pending to Tomorrow",
    "Update 'WAITING' Status",
    "Set Tomorrow's Priorities"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      <div className="bg-bg-card border border-slate-700 w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto overflow-hidden animate-slide-up">
        <div className={`p-6 relative overflow-hidden`}>
           {/* Background Glow */}
           <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20 pointer-events-none ${mode === 'MORNING' ? 'bg-orange-500 blur-[100px]' : 'bg-indigo-500 blur-[100px]'}`}></div>
           
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div className="flex items-center gap-4">
               <div className={`p-3 rounded-xl shadow-neu-flat ${mode === 'MORNING' ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                 {mode === 'MORNING' ? <Sun size={24} /> : <Moon size={24} />}
               </div>
               <div>
                 <h3 className="text-xl font-bold text-white">{mode === 'MORNING' ? 'Morning Brief' : 'Evening Wrap'}</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{mode === 'MORNING' ? 'START @ 08:30' : 'CLOSE @ 17:00'}</p>
               </div>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-white">
               <X size={20} />
             </button>
          </div>
          
          <div className="bg-bg-main/80 backdrop-blur rounded-2xl p-5 border border-slate-700 relative z-10 shadow-inner">
            <ul className="space-y-4">
              {(mode === 'MORNING' ? morningItems : eveningItems).map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 group">
                  <div className="relative">
                     <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-slate-600 rounded bg-bg-card checked:bg-neon checked:border-neon transition-colors cursor-pointer" />
                     <Check size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={onClose}
            className={`mt-6 w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 relative z-10 ${
              mode === 'MORNING' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
            }`}
          >
            {mode === 'MORNING' ? "Let's Crush It!" : "Done for Today"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;