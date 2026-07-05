import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 ring-slate-500/10',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20',
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold ring-1 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
