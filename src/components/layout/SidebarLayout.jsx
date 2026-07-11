import React, { useState, useEffect } from 'react';
import { FileCheck2, Bell, Search, User, Check, Archive, Trash, ExternalLink, Bot } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import { db, collection, query, where, orderBy, onSnapshot, updateDoc, doc } from '../../firebase/firebase.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Avatar from '../ui/Avatar.jsx';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';

export default function SidebarLayout({ children, navItems, subtitle, title }) {
  const { logout, currentUser, userProfile, loginAsDeveloper } = useAuth();
  const { selectedRequest } = useDocuments();
  const { searchQuery, setSearchQuery } = useOrganizations();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [osMode, setOsMode] = useState(() => localStorage.getItem('unicrypt_os_panel_mode') || 'expanded');

  useEffect(() => {
    const syncOsState = (event) => setOsMode(event.detail?.mode || 'expanded');
    window.addEventListener('unicrypt-os-state', syncOsState);
    return () => window.removeEventListener('unicrypt-os-state', syncOsState);
  }, []);

  const cycleOsPanel = () => {
    const nextMode = osMode === 'expanded' ? 'collapsed' : osMode === 'collapsed' ? 'hidden' : 'expanded';
    window.dispatchEvent(new CustomEvent('unicrypt-os-control', { detail: { mode: nextMode } }));
  };

  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to in-app notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipientEmail', '==', currentUser.email || 'student@localhost'),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setNotifications(list);
    }, (err) => {
      console.warn("Notifications subscription error:", err.message);
    });
    
    return () => unsub();
  }, [currentUser]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const archiveNotif = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { archived: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreads = notifications.filter(n => !n.read);
      await Promise.all(unreads.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const visibleNotifications = notifications.filter(n => !n.archived);
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

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
            {navItems.map((item) => {
              const currentHash = (window.location.hash || '#dashboard').replace('#', '');
              const targetHash = (item.to.split('#')[1] || 'dashboard');
              const isLinkActive = currentHash === targetHash;

              return (
                <NavLink
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                    isLinkActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/20 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                  key={item.label}
                  to={item.to}
                >
                  <item.icon className="h-4.5 w-4.5 text-current shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-blue-600 transition-all duration-150 hover:bg-blue-500/10 dark:text-blue-400"
              onClick={cycleOsPanel}
              type="button"
            >
              <Bot className="h-4.5 w-4.5 shrink-0" />
              <span>UniCrypt OS</span>
              <span className="ml-auto text-[8px] uppercase tracking-wider text-slate-400">{osMode}</span>
            </button>
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
                  {userProfile?.name || currentUser.displayName || 'UniCrypt User'}
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
      <div className="unicrypt-os-workspace flex-1 flex flex-col min-w-0">
        
        {/* 2. Floating Modern Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/40 bg-slate-50/80 dark:bg-[#090a0f]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-theme">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex items-center gap-3.5">
            {/* Functional search query bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 animate-pulse" />
              <input
                type="text"
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 w-48 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            
            {/* Theme Toggle switch component */}
            <ThemeToggle />
            
            {/* Notification bell and dropdown drawer */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#090a0f]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3.5 z-50 text-xs max-h-96 overflow-y-auto animate-slide-in">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white">Notifications ({visibleNotifications.length})</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-2">
                    {visibleNotifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-450 font-bold uppercase tracking-wider text-[10px]">
                        🎉 You are all caught up!
                      </div>
                    ) : (
                      visibleNotifications.map((notif) => {
                        const dotColor = notif.priority === 'High' ? 'bg-rose-500' : notif.priority === 'Normal' ? 'bg-blue-500' : 'bg-slate-400';
                        return (
                          <div key={notif.id} className={`pt-2 first:pt-0 pb-2 flex flex-col gap-1.5 ${notif.read ? 'opacity-70' : ''}`}>
                            <div className="flex justify-between items-start">
                              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
                                {notif.title}
                              </span>
                              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">
                                {notif.category}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                              {notif.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-[9px] text-slate-455">
                              <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                              <div className="flex gap-2">
                                {notif.action && (
                                  <button
                                    onClick={() => {
                                      if (notif.action.type === 'SWITCH_TAB') {
                                        navigate(notif.action.hash);
                                      } else if (notif.action.type === 'OPEN_MODAL') {
                                        window.dispatchEvent(new CustomEvent('unicrypt-ai-action', { detail: notif.action }));
                                      }
                                      markAsRead(notif.id);
                                      setIsNotifOpen(false);
                                    }}
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="h-2 w-2" />
                                    Action
                                  </button>
                                )}
                                {!notif.read && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Check className="h-2 w-2" />
                                    Read
                                  </button>
                                )}
                                <button
                                  onClick={() => archiveNotif(notif.id)}
                                  className="text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                >
                                  <Archive className="h-2 w-2" />
                                  Archive
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
