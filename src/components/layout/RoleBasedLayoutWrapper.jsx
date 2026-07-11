import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import SidebarLayout from './SidebarLayout.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Avatar from '../ui/Avatar.jsx';
import AICopilot from '../ui/AICopilot.jsx';
import GlobalSearch from '../organizations/GlobalSearch.jsx';
import { Bot, FileCheck2 } from 'lucide-react';

function UserProfileHeader() {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return null;

  const displayName = userProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const displayEmail = currentUser.email;
  const roleName = userProfile?.role === 'student' ? 'User' : userProfile?.role?.replace('_', ' ') || 'Guest';

  return (
    <div className="bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 shadow-sm animate-slide-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/5 blur-2xl pointer-events-none"></div>
      <div className="flex items-center gap-4 relative z-10">
        <Avatar name={displayName} size="md" />
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate leading-none">{displayName}</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold truncate leading-none mt-1.5">{displayEmail}</p>
        </div>
      </div>
      <div className="shrink-0 relative z-10">
        <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
          {roleName} Account
        </span>
      </div>
    </div>
  );
}

export default function RoleBasedLayoutWrapper({ children, navItems, title, subtitle }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (role === 'student') {
    // User role: render without SidebarLayout (full-width view with top header)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-colors duration-250 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/40 bg-white/80 dark:bg-[#12131a]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-theme">
          <button
            onClick={() => {
              let path = '/';
              if (role === 'super_admin') path = '/admin';
              else if (role === 'organization') path = '/institution';
              else if (role === 'student' || role === 'employer') path = '/dashboard';
              navigate(path);
            }}
            onDoubleClick={() => window.dispatchEvent(new CustomEvent('unicrypt-toggle-search'))}
            className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400 hover:scale-[1.03] active:scale-[0.98] transition-all duration-150 outline-none cursor-pointer group relative"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <span className="tracking-tight font-extrabold text-slate-900 dark:text-white">UniCrypt</span>
            
            {/* Tooltip */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-slate-900 dark:bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-50">
              Go to Home
            </span>
          </button>

          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('unicrypt-os-control', { detail: { mode: 'toggle' } }))}
              className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-500/10 dark:text-blue-400"
              title="Toggle UniCrypt OS"
              type="button"
            >
              <Bot className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="unicrypt-os-workspace flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <UserProfileHeader />
          {children}
        </main>
        <AICopilot />
      </div>
    );
  }

  // Organization or Admin roles: retain SidebarLayout wrapper
  return (
    <>
      <SidebarLayout navItems={navItems} title={title} subtitle={subtitle}>
        {children}
      </SidebarLayout>
      <AICopilot />
    </>
  );
}
