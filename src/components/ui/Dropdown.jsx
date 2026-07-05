import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({
  trigger,
  children,
  className = '',
  align = 'right',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-56 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#12131a] shadow-xl dark:shadow-black/50 z-50 focus:outline-none backdrop-blur-md transition-all duration-150 animate-in fade-in slide-in-from-top-2 ${alignClasses[align]} ${className}`}
        >
          <div className="p-1.5 divide-y divide-slate-100 dark:divide-slate-800/50" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
