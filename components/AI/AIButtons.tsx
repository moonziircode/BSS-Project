import React from 'react';
import { Sparkles, Loader2, BrainCircuit, FileText, MessageSquarePlus } from 'lucide-react';

interface AIButtonProps {
  onClick: () => void;
  loading: boolean;
  label: string;
  icon?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
}

export const AIButton: React.FC<AIButtonProps> = ({ onClick, loading, label, icon: Icon = Sparkles, variant = 'primary', size='md' }) => {
  const baseClass = "flex items-center justify-center gap-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border";
  const sizeClass = size === 'sm' ? "px-3 py-1.5 text-[10px] uppercase tracking-wider" : "px-4 py-2 text-xs";
  
  const variantClass = 
    variant === 'primary' ? "bg-white text-black border-white hover:bg-zinc-200 shadow-glow" :
    variant === 'secondary' ? "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white" :
    "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300";

  return (
    <button onClick={onClick} disabled={loading} className={`${baseClass} ${sizeClass} ${variantClass}`}>
      {loading ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" /> : <Icon size={size === 'sm' ? 12 : 14} />}
      {label}
    </button>
  );
};