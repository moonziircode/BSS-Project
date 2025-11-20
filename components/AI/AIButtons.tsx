
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
  const baseClass = "flex items-center gap-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeClass = size === 'sm' ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  
  const variantClass = 
    variant === 'primary' ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md" :
    variant === 'secondary' ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200" :
    "bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50";

  return (
    <button onClick={onClick} disabled={loading} className={`${baseClass} ${sizeClass} ${variantClass}`}>
      {loading ? <Loader2 size={size === 'sm' ? 12 : 16} className="animate-spin" /> : <Icon size={size === 'sm' ? 12 : 16} />}
      {label}
    </button>
  );
};
