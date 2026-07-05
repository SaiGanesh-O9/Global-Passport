import React, { useEffect } from 'react';
import { useDocuments } from '../../hooks/useDocuments.js';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export default function ToastContainer() {
  const { toasts } = useDocuments();
  const { removeToast } = useDocumentActions();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  const bgClass = isSuccess ? 'bg-emerald-600' : isError ? 'bg-rose-600' : isWarning ? 'bg-amber-600' : 'bg-slate-800';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-white rounded-xl shadow-lg border border-white/10 animate-slide-in font-semibold text-xs leading-relaxed transition-all duration-300 ${bgClass}`}
    >
      {isSuccess && <CheckCircle2 className="h-5 w-5 shrink-0" />}
      {isError && <AlertCircle className="h-5 w-5 shrink-0" />}
      {isWarning && <AlertTriangle className="h-5 w-5 shrink-0" />}
      {!isSuccess && !isError && !isWarning && <Info className="h-5 w-5 shrink-0" />}
      
      <span className="flex-1">{toast.message}</span>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="hover:bg-white/10 p-1 rounded-lg transition-colors shrink-0 outline-none cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
