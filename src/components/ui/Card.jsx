import React from 'react';

export default function Card({ children, className = '', hoverEffect = false, ...props }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800/50 bg-white dark:bg-[#12131a] text-slate-900 dark:text-slate-100 shadow-sm dark:shadow-black/10 transition-all duration-200 ${
        hoverEffect ? 'hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/25' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
