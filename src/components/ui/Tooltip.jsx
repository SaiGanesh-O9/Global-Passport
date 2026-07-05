import React, { useState } from 'react';

export default function Tooltip({ children, content, className = '' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[10px] font-bold text-white bg-slate-950/90 dark:bg-slate-900/95 border border-slate-800/80 rounded-lg shadow-lg z-50 whitespace-nowrap backdrop-blur-sm transition-all duration-150 animate-in fade-in zoom-in-95 ${className}`}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950/90 dark:border-t-slate-900/95"></div>
        </div>
      )}
    </div>
  );
}
