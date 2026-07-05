import { FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'User Dashboard', to: '/dashboard' },
  { label: 'Institution', to: '/institution' },
];

export default function MarketingNav() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/45 bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md transition-theme">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400" to="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <span className="tracking-tight font-extrabold text-slate-900 dark:text-white">UniCrypt</span>
        </Link>

        <div className="order-3 flex w-full flex-wrap gap-3 text-xs font-bold text-slate-550 dark:text-slate-400 md:order-2 md:w-auto md:items-center md:gap-6">
          {navLinks.map((link) =>
            link.to ? (
              <Link className="transition-colors duration-150 hover:text-blue-600 dark:hover:text-blue-400" key={link.label} to={link.to}>
                {link.label}
              </Link>
            ) : (
              <a className="transition-colors duration-150 hover:text-blue-600 dark:hover:text-blue-400" href={link.href} key={link.label}>
                {link.label}
              </a>
            ),
          )}
        </div>

        <div className="order-2 flex items-center gap-2 md:order-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button onClick={logout} variant="primary" className="py-1 px-3.5 text-xs cursor-pointer">
              Sign Out
            </Button>
          ) : (
            <Button to="/login" variant="primary" className="py-1 px-3.5 text-xs cursor-pointer">
              Sign In
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
