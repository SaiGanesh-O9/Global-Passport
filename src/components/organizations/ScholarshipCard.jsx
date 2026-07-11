import React from 'react';
import Card from '../ui/Card.jsx';
import { Award, Calendar, Users } from 'lucide-react';

export default function ScholarshipCard({ scholarship }) {
  return (
    <Card className="p-5 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4 group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

      <div className="space-y-3 relative z-10">
        {/* Name and Icon header */}
        <div className="flex gap-2.5 items-start">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-extrabold text-slate-950 dark:text-white leading-snug">
              {scholarship.name}
            </h4>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 block mt-0.5">
              Value: {scholarship.amount}
            </span>
          </div>
        </div>

        {/* Eligibility description */}
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Eligibility Criteria
          </span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
            {scholarship.eligibility}
          </p>
        </div>
      </div>

      {/* Deadline Info */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/35 relative z-10 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Deadline: {scholarship.deadline}
        </span>
        <span className="text-amber-600 dark:text-amber-400 font-extrabold">Active Application</span>
      </div>
    </Card>
  );
}
