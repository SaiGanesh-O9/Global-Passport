import React from 'react';
import { AlertCircle } from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = AlertCircle,
  className = '',
}) {
  return (
    <Card className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#12131a]/40 border border-slate-200 dark:border-slate-800/80 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-medium">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4 py-1.5 px-3 text-xs" variant="primary">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
