import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function Breadcrumbs({ items = [], className = '' }) {
  const { currentUser, role } = useAuth();

  let homePath = '/';
  if (currentUser) {
    if (role === 'super_admin') homePath = '/admin';
    else if (role === 'organization') homePath = '/institution';
    else homePath = '/dashboard';
  }

  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold ${className}`} aria-label="Breadcrumb">
      <Link
        to={homePath}
        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-350 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150 truncate"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
