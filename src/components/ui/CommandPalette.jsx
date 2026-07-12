import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Terminal } from 'lucide-react';
import { EventBus, EVENTS } from '../../core/eventBus/index.js';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const commands = [
    {
      id: 'cmd.passport',
      label: 'Upload Passport',
      desc: 'Scan/upload a passport credentials file.',
      action: () => {
        window.dispatchEvent(new CustomEvent('unicrypt-ai-action', {
          detail: { type: 'OPEN_UPLOAD', preset: 'Passport' }
        }));
      }
    },
    {
      id: 'cmd.transcript',
      label: 'Upload Transcript',
      desc: 'Extract credits from a registrar transcript.',
      action: () => {
        window.dispatchEvent(new CustomEvent('unicrypt-ai-action', {
          detail: { type: 'OPEN_UPLOAD', preset: 'Transcript' }
        }));
      }
    },
    {
      id: 'cmd.dev_purge',
      label: 'Delete Development Users',
      desc: 'Purge local dev test accounts.',
      action: () => {
        EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
          title: 'Admin Command Purge',
          message: 'Purging 17 mock development profiles...',
          type: 'warning'
        });
      }
    },
    {
      id: 'cmd.vault',
      label: 'Jump to Credential Vault',
      desc: 'View verified credential documents list.',
      action: () => {
        window.location.hash = '#vault';
      }
    },
    {
      id: 'cmd.timeline',
      label: 'Jump to Audit Timeline',
      desc: 'View ledger registration audits logs.',
      action: () => {
        window.location.hash = '#timeline';
      }
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-white/95 dark:bg-[#0f111a]/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-850/40 shadow-2xl rounded-[28px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-850/50 flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to workspace..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-bold"
            autoFocus
          />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg">
            ESC
          </span>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
              className="w-full p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between text-left cursor-pointer border-none bg-transparent outline-none group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  {cmd.label}
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-455 font-bold">
                  {cmd.desc}
                </p>
              </div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                Execute &rarr;
              </span>
            </button>
          ))}

          {filteredCommands.length === 0 && (
            <div className="text-center py-6 text-[10px] text-slate-400 font-bold">
              No matching system commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
