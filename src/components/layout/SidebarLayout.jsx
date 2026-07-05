import { FileCheck2, Bell, Search, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Avatar from '../ui/Avatar.jsx';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';

export default function SidebarLayout({ children, navItems, subtitle, title }) {
  const { logout, currentUser, userProfile, loginAsDeveloper } = useAuth();
  const { selectedRequest } = useDocuments();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const breadcrumbItems = [
    { label: title, to: '#' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-colors duration-250 flex flex-col lg:flex-row">
      
      {/* 1. Glassmorphic Sidebar */}
      <aside className="border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800/40 bg-white/80 dark:bg-[#12131a]/80 backdrop-blur-md px-5 py-6 lg:w-72 shrink-0 flex flex-col justify-between transition-theme">
        <div className="space-y-8">
          {/* Brand header */}
          <NavLink className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <span className="tracking-tight font-extrabold text-slate-900 dark:text-white">UniCrypt</span>
          </NavLink>

          {/* Active Request Selection Preview */}
          {selectedRequest && (
            <div className="border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/5 rounded-xl p-3.5 space-y-2 animate-slide-in transition-all duration-300">
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Selected Request</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedRequest.credentialType}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold truncate leading-none mt-0.5">
                {selectedRequest.organization?.name || selectedRequest.requestedOrganization}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                {selectedRequest.status}
              </span>
            </div>
          )}

          {/* Navigation links */}
          <nav className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/20 hover:text-slate-850 dark:hover:text-slate-200'
                  }`
                }
                key={item.label}
                to={item.to}
              >
                <item.icon className="h-4.5 w-4.5 text-current shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Developer Console (Visible in local development environment only) */}
        {import.meta.env.DEV && loginAsDeveloper && (
          <div className="mt-6 border-t border-slate-200/60 dark:border-slate-800/40 pt-4 space-y-2">
            <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wide block">🛠 Dev Switcher</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={async () => {
                  try {
                    await loginAsDeveloper('user');
                    navigate('/dashboard');
                  } catch (e) {
                    console.error("Dev switch to user failed:", e);
                  }
                }}
                className="px-1.5 py-1 text-[9px] font-extrabold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200/55 dark:border-slate-700/50 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 active:scale-[0.96] transition-all duration-100 cursor-pointer text-center"
              >
                User
              </button>
              <button
                onClick={async () => {
                  try {
                    await loginAsDeveloper('organization');
                    navigate('/dashboard');
                  } catch (e) {
                    console.error("Dev switch to organization failed:", e);
                  }
                }}
                className="px-1.5 py-1 text-[9px] font-extrabold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200/55 dark:border-slate-700/50 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 active:scale-[0.96] transition-all duration-100 cursor-pointer text-center"
              >
                Verifier
              </button>
              <button
                onClick={async () => {
                  try {
                    await loginAsDeveloper('super_admin');
                    navigate('/dashboard');
                  } catch (e) {
                    console.error("Dev switch to admin failed:", e);
                  }
                }}
                className="px-1.5 py-1 text-[9px] font-extrabold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200/55 dark:border-slate-700/50 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 active:scale-[0.96] transition-all duration-100 cursor-pointer text-center"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Footer profile indicator */}
        <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/40 pt-6 space-y-4">
          {currentUser && (
            <div className="flex items-center gap-3">
              <Avatar name={userProfile?.name || currentUser.displayName || currentUser.email} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userProfile?.name || currentUser.displayName || 'VeriFlash User'}
                </p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold truncate leading-none mt-0.5">
                  {currentUser.email}
                </p>
                <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                  {userProfile?.role === 'student' ? 'User' : userProfile?.role?.replace('_', ' ') || 'Guest'}
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-600 bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-rose-500/10 active:scale-[0.98] transition-all duration-150 cursor-pointer text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. Floating Modern Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/40 bg-slate-50/80 dark:bg-[#090a0f]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-theme">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex items-center gap-3.5">
            {/* Search query placeholder */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="pl-8.5 pr-3 py-1.5 w-48 text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-xl cursor-not-allowed"
              />
            </div>
            
            {/* Theme Toggle switch component */}
            <ThemeToggle />
            
            {/* Notification bell placeholder */}
            <button disabled className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 text-slate-400 cursor-not-allowed">
              <Bell className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* 3. Children content viewport */}
        <main className="flex-1 px-6 py-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Local Dev badge in Main Container corner */}
      {import.meta.env.DEV && localStorage.getItem('dev_user') && (
        <div className="fixed bottom-4 left-4 z-40 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-lg text-center backdrop-blur-md select-none pointer-events-none">
          <p className="text-[9px] font-extrabold text-amber-800 dark:text-amber-500 uppercase tracking-wider">
            🛠 DEV MODE
          </p>
        </div>
      )}
    </div>
  );
}
