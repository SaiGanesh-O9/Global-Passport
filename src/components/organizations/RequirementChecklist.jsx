import React, { useState, useMemo, useEffect } from 'react';
import { useDocuments } from '../../hooks/useDocuments.js';
import Card from '../ui/Card.jsx';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Upload, ChevronDown, ChevronUp, CircleDot, Info, FileQuestion } from 'lucide-react';

export default function RequirementChecklist({ requirements, onActionClick }) {
  const { credentials } = useDocuments();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Map user credentials by type for instant status checks
  const vaultMap = useMemo(() => {
    const map = {};
    (credentials || []).forEach(c => {
      const current = map[c.type];
      if (!current || (c.status === 'Approved' && current.status !== 'Approved')) {
        map[c.type] = c;
      }
    });
    return map;
  }, [credentials]);

  const checklistItems = useMemo(() => {
    return (requirements || []).map((req) => {
      const match = vaultMap[req.type];
      let status = 'Missing';
      let credentialId = null;

      if (match) {
        if (match.isExpired) {
          status = 'Expired';
        } else if (match.status === 'Approved') {
          status = 'Completed';
        } else if (match.status === 'Pending') {
          status = 'Needs Update';
        } else if (match.status === 'Rejected') {
          status = 'Needs Update';
        }
        credentialId = match.id;
      }

      return {
        ...req,
        status,
        credentialId
      };
    });
  }, [requirements, vaultMap]);

  // Compute completion metrics
  const stats = useMemo(() => {
    const total = checklistItems.length;
    if (total === 0) return { completed: 0, percent: 0 };
    const completed = checklistItems.filter(item => item.status === 'Completed').length;
    return {
      completed,
      percent: Math.round((completed / total) * 100)
    };
  }, [checklistItems]);

  // Animate progress bar from 0% on mount / updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(stats.percent);
    }, 150);
    return () => clearTimeout(timer);
  }, [stats.percent]);

  const toggleExpand = (index, e) => {
    // Avoid toggling expand if upload button itself was clicked
    if (e.target.closest('.upload-btn')) return;
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="space-y-6">
      
      {/* Progress Metric Summary Header */}
      <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Application Readiness Score
            </h4>
            <p className="text-[11px] text-slate-900 dark:text-white font-extrabold mt-1">
              {stats.completed} of {checklistItems.length} Requirements Satisfied
            </p>
          </div>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
            {stats.percent}%
          </span>
        </div>

        {/* Visual Progress Bar animating from 0% */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </Card>

      {/* Checklist Rows */}
      <div className="space-y-2.5">
        {checklistItems.map((item, index) => {
          const isExpanded = expandedIndex === index;
          
          let badgeColor = '';
          let icon = null;

          if (item.status === 'Completed') {
            badgeColor = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400';
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 transition-transform group-hover:scale-110 duration-300" />;
          } else if (item.status === 'Needs Update') {
            badgeColor = 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400';
            icon = <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
          } else if (item.status === 'Expired') {
            badgeColor = 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400';
            icon = <XCircle className="h-4 w-4 text-rose-500 shrink-0" />;
          } else {
            badgeColor = 'bg-slate-100 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/40 text-slate-400';
            icon = <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />;
          }

          // Custom Importance Color
          const getImportanceBadge = (imp) => {
            if (imp === 'High') return 'bg-red-500/10 border-red-500/15 text-red-600 dark:text-red-400';
            if (imp === 'Medium') return 'bg-amber-500/10 border-amber-500/15 text-amber-600 dark:text-amber-400';
            return 'bg-blue-500/10 border-blue-500/15 text-blue-600 dark:text-blue-400';
          };

          return (
            <Card
              key={index}
              onClick={(e) => toggleExpand(index, e)}
              className="bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 hover:border-blue-500/10 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 rounded-xl relative overflow-hidden group"
            >
              {/* Checklist Row Grid */}
              <div className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                
                {/* Left Side Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 shrink-0 transition-transform group-hover:scale-105 duration-200">
                    {icon}
                  </span>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {item.type}
                      </span>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                        {item.status}
                      </span>
                      {item.required ? (
                        <span className="text-[8px] font-extrabold uppercase bg-red-500/10 text-red-700 dark:text-red-450 px-1.5 py-0.5 rounded-md border border-red-500/15">
                          Required
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate max-w-md">
                      {item.details}
                    </p>
                  </div>
                </div>

                {/* Right Side Buttons */}
                <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                  {item.status !== 'Completed' && (
                    <button
                      onClick={() => onActionClick(item.type)}
                      className="upload-btn px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95 outline-none"
                    >
                      <Upload className="h-3 w-3" />
                      Upload File
                    </button>
                  )}
                  <span className="text-slate-400 hover:text-slate-650 transition-colors p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>

              </div>

              {/* Expandable Instruction drawer panel */}
              {isExpanded && (
                <div className="px-4 pb-4.5 pt-1.5 border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-900/10 space-y-4.5 text-[10px] font-semibold text-slate-700 dark:text-slate-350 animate-in slide-in-from-top-1 duration-200">
                  
                  {/* Importance & Tags */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                      Importance Level:
                    </span>
                    <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.2 rounded-md border ${getImportanceBadge(item.importance || 'High')}`}>
                      {item.importance || 'High'}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    {/* Why Section */}
                    <div className="space-y-1">
                      <p className="text-[8.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Why this is required
                      </p>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-350">
                        {item.why || 'Verifies undergraduate prerequisite coursework to ensure preparedness.'}
                      </p>
                    </div>

                    {/* How Section */}
                    <div className="space-y-1">
                      <p className="text-[8.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <CircleDot className="h-3 w-3 text-blue-500" />
                        How to satisfy this
                      </p>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-350">
                        {item.satisfy || 'Request official electronic transcripts or graduation degree credentials from your home institution registrar and upload them.'}
                      </p>
                    </div>

                  </div>

                  {/* Acceptable matching documents listing */}
                  {item.examples && item.examples.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/65">
                      <p className="text-[8.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <FileQuestion className="h-3 w-3" />
                        Acceptable Sample Files
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.examples.map((ex, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 dark:bg-slate-850 border dark:border-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono text-[9px]"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </Card>
          );
        })}
      </div>

    </div>
  );
}
