import React from 'react';

export default function Skeleton({ className = '', variant = 'text', ...props }) {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circle: 'h-10 w-10 rounded-full',
    rect: 'h-24 w-full rounded-xl',
  };

  return (
    <div
      className={`shimmer-bg ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
