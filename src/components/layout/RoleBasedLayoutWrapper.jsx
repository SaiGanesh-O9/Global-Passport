import React from 'react';
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
  const { role } = useAuth();

  return (
    <SidebarLayout navItems={navItems} title={title} subtitle={subtitle}>
      {role === 'student' && <UserProfileHeader />}
      {children}
    </SidebarLayout>
  );
}
