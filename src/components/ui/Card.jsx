import React from 'react';

export default function Card({ children, className = '', hoverEffect = false, ...props }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/40 dark:border-slate-850/30 bg-white/75 dark:bg-[#0f111a]/65 backdrop-blur-md text-slate-900 dark:text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-all duration-300 ${
        hoverEffect ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.3)] hover:border-slate-200/70 dark:hover:border-slate-850/50' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
