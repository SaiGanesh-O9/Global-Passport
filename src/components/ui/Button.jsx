import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
  secondary: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-100 active:scale-[0.98]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
  outline: 'border border-blue-600 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:scale-[0.98]',
};

export default function Button({
  children,
  className = '',
  icon: Icon,
  to,
  href,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';
  const classes = `${baseClasses} ${variantStyles[variant]} ${className}`;
  
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="h-4 w-4 text-current shrink-0" />
      ) : null}
      <span>{children}</span>
    </>
  );

  const isDisabled = disabled || loading;

  if (to && !isDisabled) {
    return (
      <Link className={classes} to={to} {...props}>
        {content}
      </Link>
    );
  }

  if (href && !isDisabled) {
    return (
      <a className={classes} href={href} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={isDisabled} type={type} {...props}>
      {content}
    </button>
  );
}
