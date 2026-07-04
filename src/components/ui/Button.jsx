import { Link } from 'react-router-dom';

const variantStyles = {
  primary: 'bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800',
  secondary:
    'border border-blue-200 bg-white text-blue-700 hover:border-blue-700 hover:bg-blue-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  success:
    'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
};

export default function Button({
  children,
  className = '',
  icon: Icon,
  to,
  href,
  variant = 'primary',
  ...props
}) {
  const classes = `inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${variantStyles[variant]} ${className}`;
  const content = (
    <>
      {children}
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </>
  );

  if (to) {
    return (
      <Link className={classes} to={to}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {content}
    </button>
  );
}
