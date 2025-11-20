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
  const baseClass = "flex items-center gap-2 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeClass = size === 'sm' ? "px-3 py-1.5 text-[10px] uppercase tracking-wider" : "px-5 py-2.5 text-sm";
  
  const variantClass = 
    variant === 'primary' ? "bg-gradient-to-r from-neon to-teal-700 text-white shadow-neon hover:shadow-[0_0_20px_rgba(106,143,115,0.6)]" :
    variant === 'secondary' ? "bg-bg-card text-neon border border-neon/30 hover:bg-bg-main hover:border-neon shadow-neu-flat" :
    "bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400";

  return (
    <button onClick={onClick} disabled={loading} className={`${baseClass} ${sizeClass} ${variantClass}`}>
      {loading ? <Loader2 size={size === 'sm' ? 12 : 16} className="animate-spin" /> : <Icon size={size === 'sm' ? 12 : 16} />}
      {label}
    </button>
  );
};