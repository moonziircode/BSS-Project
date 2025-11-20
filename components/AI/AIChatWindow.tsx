
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../services/ai/aiHooks';
import { Send, X, Bot, Loader2, Trash2, StopCircle } from 'lucide-react';
import { Task, Issue, VisitNote } from '../../types';

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  issues: Issue[];
  visits: VisitNote[];
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose, tasks, issues, visits }) => {
  const { history, loading, send, clear } = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    // Pass the current data context to the AI
    await send(msg, { tasks, issues, visits });
  };

  return (
    <div className="fixed bottom-4 right-4 w-[90vw] md:w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-scale-up overflow-hidden">
      {/* Header */}
      <div className="bg-anteraja-purple p-4 text-white flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-full text-anteraja-purple">
             <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Anteraja Assistant</h3>
            <div className="flex items-center gap-1 text-[10px] opacity-80">
               <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
               Connected to Data
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clear} 
            className="hover:bg-white/20 p-2 rounded-full transition-colors" 
            title="Hapus Chat"
          >
            <Trash2 size={18}/>
          </button>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Tutup"
          >
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {history.length === 0 && (
          <div className="text-center text-gray-500 mt-10 text-sm px-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bot size={32} className="text-anteraja-purple"/>
            </div>
            <p className="font-medium text-gray-800 mb-2">Halo! Saya terhubung dengan data Anda.</p>
            <p className="text-xs mb-4">Tanyakan tentang:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setInput("Apa tugas prioritas saya hari ini?")} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors">📅 Tugas Hari Ini</button>
              <button onClick={() => setInput("Siapa yang harus saya visit minggu ini?")} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors">📍 Rencana Visit</button>
              <button onClick={() => setInput("Buatkan draft WA tagihan untuk mitra X")} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors">💬 Draft WhatsApp</button>
            </div>
          </div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-anteraja-pink text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                {msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                ) : (
                  msg.content
                )}
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-anteraja-purple" />
              <span className="text-xs text-gray-500">Sedang menganalisa data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 mb-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya seputar data operasional..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-anteraja-pink outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input}
            className="bg-anteraja-purple text-white p-2.5 rounded-full hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* Exit Button Footer */}
        <button 
          onClick={onClose}
          className="w-full py-2 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <StopCircle size={12} /> Keluar / Tutup Assistant
        </button>
      </div>
    </div>
  );
};

export default AIChatWindow;
