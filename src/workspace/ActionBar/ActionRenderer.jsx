import React from 'react';
import { ActionRegistry } from '../../core/actions/actionRegistry.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function ActionRenderer({ obj }) {
  const { role } = useAuth();
  const actions = ActionRegistry.getActionsForObject(obj.type, obj, role);

  if (actions.length === 0) return null;

  return (
    <div className="p-4 bg-slate-50 dark:bg-[#0c0d12]/90 border-t border-slate-100 dark:border-slate-850/50 flex gap-3 flex-shrink-0">
      {actions.map((act) => (
        <button
          key={act.id}
          onClick={act.execute}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98] outline-none border-none text-center ${
            act.primary
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}
        >
          {act.label}
        </button>
      ))}
    </div>
  );
}
