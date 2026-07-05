import React from 'react';

export default function Avatar({ name = '', className = '', size = 'md' }) {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold select-none shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
