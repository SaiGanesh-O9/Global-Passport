import React from 'react';
import Card from './Card.jsx';

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = 'up',
  description,
  icon: Icon,
  className = '',
}) {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    down: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10',
  };

  return (
    <Card className={`p-5 flex justify-between items-start ${className}`} hoverEffect={true}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          {trend && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${trendColors[trendDirection]}`}>
              {trend}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium leading-none pt-0.5">
            {description}
          </p>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/40">
          <Icon className="h-4.5 w-4.5 text-current shrink-0" />
        </div>
      )}
    </Card>
  );
}
