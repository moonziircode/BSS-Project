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
  onSaveTask?: (task: Task) => void;
  onSaveVisit?: (visit: VisitNote) => void;
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose, tasks, issues, visits, onSaveTask, onSaveVisit }) => {
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
    
    const res = await send(msg, { tasks, issues, visits });
    
    // Handle Actions if present in AI Response
    if (res && res.action) {
       if (res.action.type === 'CREATE_TASK' && onSaveTask) {
         onSaveTask(res.action.data as Task);
       } else if (res.action.type === 'CREATE_VISIT' && onSaveVisit) {
         onSaveVisit(res.action.data as VisitNote);
       }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[650px] bg-bg-card/90 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 flex flex-col z-50 animate-scale-up overflow-hidden">
      {/* Header */}
      <div className="bg-bg-main/80 p-4 text-white flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-bg-card p-2 rounded-full text-neon shadow-neu-flat border border-neon/20">
             <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">AI Assistant</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
               <span className="w-1.5 h-1.5 bg-neon rounded-full shadow-[0_0_5px_#6A8F73]"></span>
               Online & Connected
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clear} 
            className="hover:bg-white/10 p-2 rounded-full transition-colors text-gray-400 hover:text-white" 
            title="Clear History"
          >
            <Trash2 size={16}/>
          </button>
          <button 
            onClick={onClose} 
            className="hover:bg-white/10 p-2 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Close"
          >
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-transparent custom-scrollbar" ref={scrollRef}>
        {history.length === 0 && (
          <div className="text-center mt-20 px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-bg-main shadow-neu-flat border border-slate-800">
               <Bot size={40} className="text-neon animate-pulse"/>
            </div>
            <p className="font-bold text-white text-lg mb-2">How can I help?</p>
            <p className="text-xs text-gray-500 mb-6">I have access to your tasks, issues, and schedule.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setInput("My priority tasks today?")} className="text-xs bg-bg-main border border-slate-700 px-4 py-2 rounded-xl hover:border-neon hover:text-neon transition-colors shadow-sm">📅 Today's Tasks</button>
              <button onClick={() => setInput("Who should I visit next?")} className="text-xs bg-bg-main border border-slate-700 px-4 py-2 rounded-xl hover:border-neon hover:text-neon transition-colors shadow-sm">📍 Visit Plans</button>
              <button onClick={() => setInput("Remind me to check email")} className="text-xs bg-bg-main border border-slate-700 px-4 py-2 rounded-xl hover:border-neon hover:text-neon transition-colors shadow-sm">📝 Create Task</button>
            </div>
          </div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
               msg.role === 'user' 
                 ? 'bg-neon text-white rounded-tr-none shadow-[0_5px_15px_rgba(106,143,115,0.3)]' 
                 : 'bg-bg-main text-gray-300 border border-slate-700 rounded-tl-none'
               }`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b class="text-neon">$1</b>').replace(/\n/g, '<br/>') }} />
                ) : (
                  msg.content
                )}
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-main border border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-neon" />
              <span className="text-xs text-gray-400">Processing data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-bg-card">
        <div className="flex gap-3 mb-3">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-bg-main border-none rounded-xl px-4 py-3 text-sm text-white shadow-neu-pressed focus:ring-1 focus:ring-neon outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input}
            className="bg-neon text-white p-3 rounded-xl hover:bg-neon-hover disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(106,143,115,0.4)] active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
        >
          <StopCircle size={12} /> Close Assistant
        </button>
      </div>
    </div>
  );
};

export default AIChatWindow;