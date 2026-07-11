import React from 'react';
import { AlertCircle } from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = AlertCircle,
  className = '',
  suggestions = ['Computer Science', 'Artificial Intelligence', 'USA', 'Iowa']
}) {
  const IconComponent = icon;

  return (
    <Card className={`flex flex-col items-center justify-center p-12 text-center bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-xl dark:shadow-black/20 rounded-2xl relative overflow-hidden transition-all duration-200 hover:border-blue-500/20 group ${className}`}>
      
      {/* Decorative background visual blurs */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-300" />
      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-300" />

      {/* Modern abstract animated illustration base */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute inset-0 scale-150 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-full blur-md animate-pulse" />
        <div className="absolute h-20 w-20 rounded-full border border-dashed border-slate-200 dark:border-slate-850 animate-[spin_40s_linear_infinite]" />
        
        <div className="relative h-14 w-14 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shadow-md">
          <IconComponent className="h-6 w-6 text-slate-400 dark:text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
        </div>
      </div>

      <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
        {title}
      </h3>
      <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-450 max-w-xs leading-relaxed font-semibold">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className="mt-6 py-2 px-4 text-[10px] font-extrabold uppercase tracking-wider active:scale-95 hover:-translate-y-0.5 transition-all duration-150 shadow-md hover:shadow-lg shadow-blue-500/10" 
          variant="primary"
        >
          {actionLabel}
        </Button>
      )}

      {/* Suggestions section to use the AI capability */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-850/60 w-full max-w-xs">
          <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider block">
            Suggested Queries
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('unicrypt-global-search', { detail: s }));
                  window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: `Search for ${s} programs` } }));
                }}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 text-slate-550 dark:text-slate-400 text-[9px] font-extrabold hover:bg-blue-500/10 hover:text-blue-650 transition-all outline-none cursor-pointer active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

    </Card>
  );
}
