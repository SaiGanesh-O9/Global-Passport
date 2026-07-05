import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center py-4">
      <Loader2
        className={`animate-spin text-blue-700 dark:text-blue-500 shrink-0 ${sizeClasses[size]} ${className}`}
      />
    </div>
  );
}
