import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import Card from './Card.jsx';

export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
  className = '',
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />,
    error: <AlertCircle className="h-4.5 w-4.5 text-rose-500" />,
    info: <Info className="h-4.5 w-4.5 text-blue-500" />,
    warning: <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />,
  };

  const borders = {
    success: 'border-emerald-500/20 dark:border-emerald-500/30',
    error: 'border-rose-500/20 dark:border-rose-500/30',
    info: 'border-blue-500/20 dark:border-blue-500/30',
    warning: 'border-amber-500/20 dark:border-amber-500/30',
  };

  return (
    <Card
      className={`fixed bottom-5 right-5 flex items-center gap-3 p-4 w-full max-w-sm bg-white/90 dark:bg-[#12131a]/95 backdrop-blur-md border shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-200 ${borders[type]} ${className}`}
      role="alert"
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
        {message}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}
