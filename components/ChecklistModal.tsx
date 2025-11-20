import React, { useEffect, useState } from 'react';
import { Sun, Moon, X } from 'lucide-react';

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
    "Review 3 tugas Priority 1 hari ini",
    "Cek kategori TODAY di Task Manager",
    "Cek tiket urgent / Issue SLA < 4 jam",
    "Pastikan email/WhatsApp penting terbaca"
  ];

  const eveningItems = [
    "Update status task (Close yang sudah selesai)",
    "Geser sisa task TODAY ke besok jika perlu",
    "Update kategori WAITING UPDATE",
    "Pilih 3 prioritas utama untuk besok pagi"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose}></div>
      <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto overflow-hidden animate-slide-up">
        <div className={`p-6 ${mode === 'MORNING' ? 'bg-gradient-to-br from-orange-100 to-yellow-50' : 'bg-gradient-to-br from-indigo-100 to-purple-50'}`}>
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${mode === 'MORNING' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white'}`}>
                 {mode === 'MORNING' ? <Sun size={24} /> : <Moon size={24} />}
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-800">{mode === 'MORNING' ? 'Start Strong!' : 'Wrap Up'}</h3>
                 <p className="text-xs text-gray-600">{mode === 'MORNING' ? 'Checklist Pagi (08:30)' : 'Checklist Sore (16:00)'}</p>
               </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <X size={20} />
             </button>
          </div>
          
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-white/50">
            <ul className="space-y-3">
              {(mode === 'MORNING' ? morningItems : eveningItems).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-anteraja-pink rounded border-gray-300 focus:ring-anteraja-pink" />
                  <span className="text-sm text-gray-700 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={onClose}
            className={`mt-6 w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
              mode === 'MORNING' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Siap Kerja!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;