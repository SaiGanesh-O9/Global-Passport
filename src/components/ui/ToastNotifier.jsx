import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { EventBus, EVENTS } from '../../core/eventBus/index.js';

export default function ToastNotifier() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (data) => {
      const id = Date.now() + Math.random().toString(36).substr(2, 5);
      const newToast = {
        id,
        title: data.title || 'Notification',
        message: data.message || '',
        type: data.type || 'info'
      };

      setToasts(prev => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    const unsub = EventBus.subscribe(EVENTS.NOTIFICATION_SHOW, handleToast);
    return () => unsub();
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 bg-white/95 dark:bg-[#0f111a]/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/40 shadow-xl rounded-2xl flex items-start gap-3 w-80 animate-in slide-in-from-bottom-2 duration-300"
        >
          {getIcon(toast.type)}
          <div className="flex-1 space-y-0.5">
            <h4 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-wider">
              {toast.title}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer border-none bg-transparent outline-none"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
