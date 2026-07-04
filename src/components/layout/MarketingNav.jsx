import { FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'User Dashboard', to: '/dashboard' },
  { label: 'Institution', to: '/institution' },
];

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 text-lg font-bold text-blue-700" to="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <FileCheck2 className="h-5 w-5" />
          </span>
          VeriFlash
        </Link>

        <div className="order-3 flex w-full flex-wrap gap-3 text-sm font-semibold text-slate-600 md:order-2 md:w-auto md:items-center md:gap-6">
          {navLinks.map((link) =>
            link.to ? (
              <Link className="transition hover:text-blue-700" key={link.label} to={link.to}>
                {link.label}
              </Link>
            ) : (
              <a className="transition hover:text-blue-700" href={link.href} key={link.label}>
                {link.label}
              </a>
            ),
          )}
        </div>

        <Button className="order-2 md:order-3" to="/verify" variant="secondary">
          Verify Link
        </Button>
      </nav>
    </header>
  );
}
