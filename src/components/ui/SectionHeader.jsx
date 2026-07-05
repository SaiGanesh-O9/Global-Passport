import React from 'react';

export default function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl tracking-tight">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">{children}</p>
      ) : null}
    </div>
  );
}
