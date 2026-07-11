import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments.js';
import { useAuth } from '../hooks/useAuth.js';
import DocumentTable from '../components/dashboard/DocumentTable.jsx';
import UploadDocumentModal from '../components/dashboard/UploadDocumentModal.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import UniversalDocumentViewer from '../components/dashboard/UniversalDocumentViewer.jsx';
import { FileText, LayoutDashboard, Settings, Upload, Mail, Search, Building2, CheckCircle2, Globe, ChevronRight, Shield, Activity, User, Clock, AlertCircle, FileCheck, Download, Eye, Bot, CheckCircle } from 'lucide-react';
import AIPreferences from '../components/ui/AIPreferences.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const OrganizationsPage = lazy(() => import('./OrganizationsPage.jsx'));

export const userNavItems = [
  { label: 'Dashboard', to: '/dashboard#dashboard', icon: LayoutDashboard },
  { label: 'Organizations', to: '/dashboard#organizations', icon: Building2 },
  { label: 'Credential Vault', to: '/dashboard#vault', icon: Shield },
  { label: 'Verification Requests', to: '/dashboard#requests', icon: FileText },
  { label: 'Recent Activity', to: '/dashboard#activity', icon: Activity },
  { label: 'Profile', to: '/dashboard#profile', icon: User },
  { label: 'Settings', to: '/dashboard#settings', icon: Settings },
];

function ActivityFeed() {
  const { activities } = useDocuments();

  return (
    <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm">
      <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Recent Activity</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
        Real-time status changes and verification history.
      </p>

      {(!activities || activities.length === 0) ? (
        <p className="text-xs text-slate-400 dark:text-slate-550 font-bold py-8 text-center uppercase tracking-wider border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-xl">
          No recent activity logs.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const isApproved = act.type === 'Approved';
            const isRejected = act.type === 'Rejected';
            const isNew = act.type === 'New';

            const dotColor = isApproved ? 'bg-emerald-500 ring-emerald-500/20' : isRejected ? 'bg-rose-500 ring-rose-500/20' : isNew ? 'bg-blue-500 ring-blue-500/20' : 'bg-amber-500 ring-amber-500/20';

            return (
              <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ring-4 ${dotColor}`}></span>
                <div className="flex-1">
                  <p className="font-bold text-slate-850 dark:text-slate-200">{act.title}</p>
                  <p className="text-slate-555 dark:text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">
                    {isNaN(Date.parse(act.timestamp)) ? act.timestamp : new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function UserDashboard() {
  const { currentUser, userProfile } = useAuth();

  const getGreeting = () => {
    const hrs = new Date().getHours();
    let greet = 'Welcome';
    if (hrs < 12) greet = 'Good Morning';
    else if (hrs < 18) greet = 'Good Afternoon';
    else greet = 'Good Evening';

    let name = '';
    if (currentUser?.displayName) {
      name = currentUser.displayName.split(' ')[0];
    } else if (userProfile?.firstName) {
      name = userProfile.firstName;
    } else if (userProfile?.name) {
      name = userProfile.name.split(' ')[0];
    } else if (currentUser?.email) {
      const emailPrefix = currentUser.email.split('@')[0];
      const cleanPrefix = emailPrefix.split(/[._-]/)[0];
      name = cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1);
    }

    if (name) {
      return `${greet}, ${name}`;
    }
    return greet;
  };
  const {
    userVerificationRequests,
    organizationProfiles,
    verificationServices,
    credentials,
    documents
  } = useDocuments();

  const location = useLocation();
  const activeTab = location.hash.replace('#', '') || 'dashboard';

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resolveRequest, setResolveRequest] = useState(null);
  const [selectedDiscoveryOrg, setSelectedDiscoveryOrg] = useState(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');

  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setOrgSearchQuery(e.detail || '');
    };
    window.addEventListener('unicrypt-global-search', handleGlobalSearch);
    return () => window.removeEventListener('unicrypt-global-search', handleGlobalSearch);
  }, []);
  
  // Vault filter tab state: 'Verified' | 'Pending' | 'Requested' | 'Rejected' | 'Expired'
  const [vaultFilter, setVaultFilter] = useState('Verified');
  const [notifPrefs, setNotifPrefs] = useState({
    delivery: { email: true, inApp: true, push: false },
    events: { verification: true, credential: true, organization: true, admin: true, security: true, system: true },
    frequency: 'Instant'
  });

  useEffect(() => {
    if (currentUser?.uid) {
      const saved = localStorage.getItem(`notif_prefs_${currentUser.uid}`);
      if (saved) {
        try { setNotifPrefs(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, [currentUser]);

  const handleSavePrefs = (updated) => {
    setNotifPrefs(updated);
    if (currentUser?.uid) {
      localStorage.setItem(`notif_prefs_${currentUser.uid}`, JSON.stringify(updated));
    }
  };
  const [selectedViewerDoc, setSelectedViewerDoc] = useState(null);

  useEffect(() => {
    const handleAIAction = (e) => {
      const action = e.detail;
      if (action.type === 'OPEN_MODAL' && action.modal === 'upload') {
        if (action.params?.orgId) {
          const org = (organizationProfiles || []).find(o => o.id === action.params.orgId);
          if (org) {
            setSelectedDiscoveryOrg(org);
          }
        }
        setIsUploadModalOpen(true);
      } else if (action.type === 'SWITCH_TAB') {
        if (action.hash === '#vault' && action.params?.filter) {
          setVaultFilter(action.params.filter);
        }
      }
    };
    window.addEventListener('unicrypt-ai-action', handleAIAction);
    return () => window.removeEventListener('unicrypt-ai-action', handleAIAction);
  }, [organizationProfiles]);

  const incomingRequests = (userVerificationRequests || []).filter(req => req.status === 'Information Requested');

  const filteredDiscoveryOrgs = (organizationProfiles || []).filter((org) => {
    if (org.status !== 'Active') return false;
    const queryLower = orgSearchQuery.toLowerCase();
    const nameMatches = (org.name || '').toLowerCase().includes(queryLower);
    const categoryMatches = (org.category || '').toLowerCase().includes(queryLower);
    const orgServices = (verificationServices || []).filter(s => s.organizationId === org.id);
    const serviceMatches = orgServices.some(s => (s.name || '').toLowerCase().includes(queryLower));
    return nameMatches || categoryMatches || serviceMatches;
  });

  // Filter vault credentials
  const filteredCredentials = useMemo(() => {
    return (credentials || []).filter(c => {
      if (vaultFilter === 'Verified') {
        return c.status === 'Approved' && !c.isExpired;
      }
      if (vaultFilter === 'Pending') {
        return c.status === 'Pending';
      }
      if (vaultFilter === 'Requested') {
        return c.status === 'Requested' || c.status === 'Information Requested';
      }
      if (vaultFilter === 'Rejected') {
        return c.status === 'Rejected';
      }
      if (vaultFilter === 'Expired') {
        return c.isExpired;
      }
      return true;
    });
  }, [credentials, vaultFilter]);

  // 1. Render Dashboard Main Panel (Redesigned for Premium v0.95 UX)
  const renderDashboardView = () => {
    const verifiedCount = (credentials || []).filter(c => c.status === 'Approved').length;
    const totalCount = (credentials || []).length || 1;
    const progressPercent = Math.round((verifiedCount / totalCount) * 100);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Welcome Back Header */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Secure Workspace
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-2xl">
            Monitor verified credentials, pending institutional actions, and browse accredited partner organizations.
          </p>
        </div>

        {/* Confidence Progress & Actions Stack */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Application Confidence */}
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Application Readiness
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                {progressPercent}% Credentials Verified
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5 leading-relaxed">
                {verifiedCount} of {(credentials || []).length} items in your personal vault are signed and approved by partner registrars.
              </p>
            </div>
            <div className="mt-6">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Pending Requests Alert */}
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Required Verification Tasks
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                {incomingRequests.length} Upload Requests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5 leading-relaxed">
                You have {incomingRequests.length} pending academic verification tasks that require document uploads.
              </p>
            </div>
            <div className="mt-6">
              {incomingRequests.length > 0 ? (
                <button 
                  onClick={() => { window.location.hash = '#requests'; }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-extrabold uppercase tracking-wider text-white rounded-xl shadow-sm text-center transition-all cursor-pointer active:scale-95 outline-none"
                >
                  Review upload requests
                </button>
              ) : (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-450 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="h-4.5 w-4.5" />
                  All requirements satisfied
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Quick Actions
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl hover:border-blue-500/30 hover:shadow-md transition-all active:scale-[0.98] duration-150 outline-none text-left cursor-pointer group"
            >
              <Upload className="h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-3">Upload Document</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Add to vault</p>
            </button>
            
            <button
              onClick={() => { window.location.hash = '#organizations'; }}
              className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl hover:border-blue-500/30 hover:shadow-md transition-all active:scale-[0.98] duration-150 outline-none text-left cursor-pointer group"
            >
              <Building2 className="h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-3">Find Partners</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Discover catalog</p>
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'What requirements are outstanding for Stanford?' } }))}
              className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl hover:border-blue-500/30 hover:shadow-md transition-all active:scale-[0.98] duration-150 outline-none text-left cursor-pointer group"
            >
              <Bot className="h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-3">Ask Assistant</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Resolve queries</p>
            </button>

            <button
              onClick={() => { window.location.hash = '#settings'; }}
              className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl hover:border-blue-500/30 hover:shadow-md transition-all active:scale-[0.98] duration-150 outline-none text-left cursor-pointer group"
            >
              <Settings className="h-5 w-5 text-blue-500 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-3">Manage Settings</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Configure profile</p>
            </button>
          </div>
        </div>

        {/* Dual Core Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Dashboard Col 1 & 2: Requests & Directory Preview */}
          <div className="lg:col-span-2 space-y-6">
            <DocumentTable />
            
            {/* Directory Preview Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Accredited Partner Directory Preview
                </h3>
                <button 
                  onClick={() => { window.location.hash = '#organizations'; }}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-blue-650 dark:text-blue-400 hover:underline outline-none"
                >
                  Explore Catalog &rarr;
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredDiscoveryOrgs.slice(0, 2).map((org) => (
                  <Card 
                    key={org.id} 
                    className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm hover:border-blue-500/10 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 rounded-2xl"
                  >
                    <div>
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-450 tracking-wider">
                        {org.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-950 dark:text-white mt-2 leading-snug">
                        {org.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 mt-1 leading-normal">
                        {org.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDiscoveryOrg(org);
                        setIsUploadModalOpen(true);
                      }}
                      className="w-full mt-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 rounded-xl transition-all active:scale-[0.98] cursor-pointer outline-none border border-transparent"
                    >
                      Verify Credential
                    </button>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* Side Panel: Activity Logs & AI Prompts Drawer */}
          <div className="space-y-6">
            <ActivityFeed />

            {/* AI Insights & Assistant Panel */}
            <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <span className="text-blue-500">✦</span>
                AI Copilot Suggestions
              </h3>
              <div className="space-y-3.5">
                <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-xl space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-950 dark:text-white flex items-center gap-1 uppercase tracking-wider">
                    📝 Missing IELTS Prerequisite
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Stanford University requires IELTS. Submit your score card to clear outstanding checklists.
                  </p>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'Explain Stanford admission criteria.' } }))}
                    className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-450 hover:underline block outline-none mt-1"
                  >
                    Ask Copilot &rarr;
                  </button>
                </div>
                
                <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-950 dark:text-white flex items-center gap-1 uppercase tracking-wider">
                    🎓 Verify Transcripts
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Your transcript credential status is pending registrar verification review.
                  </p>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    );
  };

  // 2. Render Tabbed Credential Vault View
  const renderVaultView = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/40 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credential Vault</h2>
            <p className="text-[11px] text-slate-555 dark:text-slate-455 mt-1 font-semibold">
              Upload once, and safely reuse your credentials for instant organization verifications.
            </p>
          </div>
          <Button icon={Upload} onClick={() => setIsUploadModalOpen(true)} className="shrink-0">
            Upload Credential
          </Button>
        </div>

        {/* Vault tabs switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/50 gap-4 text-xs font-bold text-slate-500 pb-px">
          {['Verified', 'Pending', 'Requested', 'Rejected', 'Expired'].map(t => {
            const isActive = vaultFilter === t;
            return (
              <button
                key={t}
                onClick={() => setVaultFilter(t)}
                className={`pb-2.5 px-1 relative transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-extrabold border-b-2 border-blue-600 dark:border-blue-400' : 'hover:text-slate-800 dark:hover:text-slate-300 font-bold'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.length > 0 ? (
            filteredCredentials.map(cred => {
              // Find matching document version
              const matchedDoc = documents.find(d => d.credentialId === cred.id);
              return (
                <Card key={cred.id} className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">{cred.type}</h4>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                        cred.isExpired ? 'bg-rose-500/10 text-rose-700' : 'bg-emerald-500/10 text-emerald-700'
                      }`}>
                        {cred.isExpired ? 'Expired' : cred.status}
                      </span>
                    </div>

                    {matchedDoc?.fileName && (
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate font-semibold">
                        File: {matchedDoc.fileName}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                      {cred.verifiedBy && <p>Verified By: {cred.verifiedBy}</p>}
                      {cred.expiresAt && <p>Expires: {cred.expiresAt}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-850">
                    <button
                      onClick={() => matchedDoc && setSelectedViewerDoc(matchedDoc)}
                      disabled={!matchedDoc}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    {matchedDoc?.fileUrl && (
                      <a
                        href={matchedDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3">
              <EmptyState
                title="Empty Vault Category"
                description="No matching credentials or verified records were found in this vault partition."
                actionLabel="Upload New Document"
                onAction={() => {
                  window.dispatchEvent(
                    new CustomEvent('unicrypt-ai-action', {
                      detail: {
                        type: 'OPEN_MODAL',
                        modal: 'upload'
                      }
                    })
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Outgoing Verification Requests tab
  const renderRequestsView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Verification Requests</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">
            Track status reviews of verification credentials sent to institutions.
          </p>
        </div>
        <DocumentTable />
      </div>
    );
  };

  // 4. Activity Logs View
  const renderActivityView = () => {
    return (
      <div className="space-y-6">
        <ActivityFeed />
      </div>
    );
  };

  // 5. Student Profile View
  const renderProfileView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Student Profile</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">
            Manage your personal data credentials.
          </p>
        </div>
        <Card className="p-6 max-w-md bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
          <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <p>Name: <strong className="text-slate-950 dark:text-white font-extrabold">Student User</strong></p>
            <p>Email: <strong className="text-slate-950 dark:text-white font-extrabold">{currentUser?.email || 'student@localhost'}</strong></p>
            <p>Verification Tier: <strong className="text-emerald-600 font-extrabold">Tier 2 Verified</strong></p>
          </div>
        </Card>
      </div>
    );
  };

  // 6. Settings View
  const renderSettingsView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Platform & Notification Settings</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-semibold">
            Manage your delivery preferences, subscribed events, and alert digests frequency.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          {/* Delivery Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Delivery Channels</h3>
            <div className="space-y-3.5 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.delivery.email}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    delivery: { ...notifPrefs.delivery, email: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Email Alerts (Mock queued and console logged)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.delivery.inApp}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    delivery: { ...notifPrefs.delivery, inApp: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>In-App Banner Notifications Drawer</span>
              </label>
            </div>
          </Card>

          {/* Events Subscriptions Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Event Alerts</h3>
            <div className="space-y-3 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.verification}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, verification: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Verification updates (Submitted, Approved, Rejected, Info Requests)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.credential}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, credential: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Credential Vault changes and Expiry warnings</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.admin}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, admin: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Administrative Override notices</span>
              </label>
            </div>
          </Card>

          {/* Digest Frequency Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Notification Frequency</h3>
            <div className="space-y-2 pt-1 text-xs">
              <select
                value={notifPrefs.frequency}
                onChange={(e) => handleSavePrefs({
                  ...notifPrefs,
                  frequency: e.target.value
                })}
                className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="Instant">Instant Delivery</option>
                <option value="Hourly">Hourly Digest Summary</option>
                <option value="Daily">Daily Digest Summary</option>
              </select>
            </div>
          </Card>
        </div>

        <div className="pt-4 max-w-4xl">
          <AIPreferences />
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    const tabRoot = activeTab.split('?')[0];
    switch (tabRoot) {
      case 'dashboard':
        return renderDashboardView();
      case 'organizations':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center py-16 text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
              Loading Organizations Catalog...
            </div>
          }>
            <OrganizationsPage />
          </Suspense>
        );
      case 'vault':
        return renderVaultView();
      case 'requests':
        return renderRequestsView();
      case 'activity':
        return renderActivityView();
      case 'profile':
        return renderProfileView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveView()}

      <UploadDocumentModal
        isOpen={isUploadModalOpen || resolveRequest !== null}
        onClose={() => {
          setIsUploadModalOpen(false);
          setResolveRequest(null);
          setSelectedDiscoveryOrg(null);
        }}
        targetRequest={resolveRequest}
        initialSelectedOrg={selectedDiscoveryOrg}
      />

      {selectedViewerDoc && (
        <UniversalDocumentViewer
          document={selectedViewerDoc}
          onClose={() => setSelectedViewerDoc(null)}
        />
      )}
    </div>
  );
}
