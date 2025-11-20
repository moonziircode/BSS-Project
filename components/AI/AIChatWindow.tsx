
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../services/ai/aiHooks';
import { Send, X, Bot, Loader2, User } from 'lucide-react';

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose }) => {
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
    await send(msg);
  };

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-scale-up overflow-hidden">
      {/* Header */}
      <div className="bg-anteraja-purple p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">Anteraja Assistant</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={18}/></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {history.length === 0 && (
          <div className="text-center text-gray-400 mt-10 text-sm">
            <Bot size={40} className="mx-auto mb-2 opacity-50"/>
            <p>Halo! Saya siap membantu cek SOP, Opcode, atau buat draft pesan WhatsApp.</p>
          </div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-anteraja-pink text-white' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'}`}>
                {msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                ) : (
                  msg.content
                )}
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-anteraja-purple" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Tanya sesuatu..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-anteraja-pink outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input}
          className="bg-anteraja-purple text-white p-2 rounded-full hover:bg-purple-800 disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIChatWindow;
