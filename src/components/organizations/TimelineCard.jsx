import React from 'react';
import Card from '../ui/Card.jsx';
import { Calendar, Info } from 'lucide-react';

export default function TimelineCard({ timelines, deadlines }) {
  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] leading-relaxed font-semibold">
        <Info className="h-4 w-4 shrink-0 text-blue-500" />
        <p>
          <strong>Notice:</strong> All application deadlines, decision dates, and processing times are provided as estimates. Always verify dates against official sources before submitting applications.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timelines Step Milestones */}
        <Card className="p-5 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Estimated Admission Roadmap
          </h4>

          <div className="relative border-l border-slate-200 dark:border-slate-850 ml-2.5 pl-6 space-y-5">
            {(timelines || []).map((t, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 text-[9px] font-bold text-slate-500">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {t.event}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t.date} {!t.isOfficial && '(Estimated)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dynamic Program Deadlines List */}
        <Card className="p-5 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Term Deadline Cutoffs
          </h4>

          {(!deadlines || deadlines.length === 0) ? (
            <p className="text-xs text-slate-400 font-bold py-6 text-center">
              No program-specific deadlines recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((d, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#1a1c24]/50 border border-slate-200/50 dark:border-slate-800/30"
                >
                  <div>
                    <span className="text-[8px] font-bold uppercase text-slate-455">
                      {d.term}
                    </span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {d.type}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
