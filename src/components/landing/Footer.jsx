import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/40 bg-white dark:bg-[#090a0f] px-5 py-8 sm:px-6 lg:px-8 transition-theme">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between font-semibold">
        <div>
          <p className="font-extrabold text-blue-600 dark:text-blue-400 text-base">UniCrypt</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Verify Once. Trust Everywhere.</p>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold">Universal Verification Network</p>
      </div>
    </footer>
  );
}
