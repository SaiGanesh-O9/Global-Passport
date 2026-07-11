import React, { useMemo } from 'react';
import { useDocuments } from '../../hooks/useDocuments.js';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Upload, ArrowRight } from 'lucide-react';

export default function RequirementChecklist({ requirements, onActionClick }) {
  const { credentials } = useDocuments();

  // Map user credentials by type for instant status checks
  const vaultMap = useMemo(() => {
    const map = {};
    (credentials || []).forEach(c => {
      // Keep the most favorable credential or the newest
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
          status = 'Available';
        } else if (match.status === 'Pending') {
          status = 'Needs Update'; // waiting verification update
        } else if (match.status === 'Rejected') {
          status = 'Needs Update'; // needs clean re-upload
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Admission Checklist Status
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
            Auto-matched in real-time against your secure credentials vault.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item, index) => {
          let badgeColor = '';
          let icon = null;

          if (item.status === 'Available') {
            badgeColor = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400';
            icon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
          } else if (item.status === 'Needs Update') {
            badgeColor = 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400';
            icon = <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
          } else if (item.status === 'Expired') {
            badgeColor = 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400';
            icon = <XCircle className="h-4 w-4 text-rose-500 shrink-0" />;
          } else {
            badgeColor = 'bg-slate-100 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/40 text-slate-400';
            icon = <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />;
          }

          return (
            <Card
              key={index}
              className="p-4 bg-slate-50/50 dark:bg-[#12131a]/40 border border-slate-205 dark:border-slate-800/30 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
            >
              {/* Left Side Info */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5">{icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.type}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                      {item.status}
                    </span>
                    {item.required ? (
                      <span className="text-[8px] font-extrabold uppercase bg-red-500/10 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-500/15">
                        Required
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    {item.details}
                  </p>
                </div>
              </div>

              {/* Right Side Action */}
              {item.status !== 'Available' && (
                <button
                  onClick={() => onActionClick(item.type)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-750 text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1 shrink-0 cursor-pointer transition-all hover:shadow"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Vault File
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
