import React from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { Clock, BookOpen, Globe, DollarSign, Award, ChevronRight } from 'lucide-react';

export default function ProgramCard({ program, onSelect }) {
  const isStem = program.stemStatus === 'STEM Designated';

  return (
    <Card className="p-5 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4 group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

      <div className="space-y-3.5 relative z-10">
        {/* Title & STEM Header */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {program.degree}
            </span>
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-0.5">
              {program.name}
            </h3>
          </div>
          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${
            isStem
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-slate-500'
          }`}>
            {program.stemStatus}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-555 dark:text-slate-400 leading-relaxed font-semibold">
          {program.description}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/30">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Duration: {program.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Credits: {program.credits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Language: {program.language}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Tuition: {program.tuition}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/35 relative z-10 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
          App Fee: <strong className="text-slate-700 dark:text-slate-350">{program.applicationFee}</strong>
        </span>
        <Button
          onClick={onSelect}
          size="sm"
          className="text-[10px] font-extrabold py-1.5 px-3 flex items-center gap-1 cursor-pointer"
        >
          Check Admission Checklist
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
