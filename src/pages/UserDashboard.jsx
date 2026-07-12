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
import { useOrganizations } from '../context/OrganizationContext.jsx';

const OrganizationsPage = lazy(() => import('./OrganizationsPage.jsx'));

export const userNavItems = [
  { label: 'My Workspace', to: '/dashboard#dashboard', icon: LayoutDashboard },
  { label: 'Organizations', to: '/dashboard#organizations', icon: Building2 },
  { label: 'Credential Vault™', to: '/dashboard#vault', icon: Shield },
  { label: 'Active Verifications', to: '/dashboard#requests', icon: FileText },
  { label: 'Timeline™', to: '/dashboard#activity', icon: Activity },
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
              <div 
                key={act.id} 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                    detail: {
                      id: `timeline.${act.id}`,
                      type: 'timeline',
                      title: act.title,
                      subtitle: `Checkpoint registered today`,
                      val: act.type || 'Audit Log',
                      detail: act.desc
                    }
                  }));
                }}
                className="flex gap-3 text-xs leading-relaxed cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition-all select-none"
              >
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ring-4 ${dotColor}`}></span>
                <div className="flex-1">
                  <p className="font-bold text-slate-855 dark:text-slate-200">{act.title}</p>
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

  const { selectedOrgData } = useOrganizations();
  const location = useLocation();
  const activeTab = location.hash.replace('#', '') || 'dashboard';

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resolveRequest, setResolveRequest] = useState(null);
  const [selectedDiscoveryOrg, setSelectedDiscoveryOrg] = useState(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [presetDocType, setPresetDocType] = useState(null);
  const [presetReason, setPresetReason] = useState(null);

  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setOrgSearchQuery(e.detail || '');
    };
    window.addEventListener('unicrypt-global-search', handleGlobalSearch);
    return () => window.removeEventListener('unicrypt-global-search', handleGlobalSearch);
  }, []);
  useEffect(() => {
    const handleOpenDoc = (event) => {
      const docId = event.detail?.id;
      const match = documents.find(d => d.id === docId);
      if (match) setSelectedViewerDoc(match);
    };
    window.addEventListener('unicrypt-action-open-doc', handleOpenDoc);
    return () => window.removeEventListener('unicrypt-action-open-doc', handleOpenDoc);
  }, [documents]);
  
  useEffect(() => {
    const handleToolUpload = (event) => {
      const { documentType, reason } = event.detail || {};
      setPresetDocType(documentType || 'Transcript');
      setPresetReason(reason || '');
      setIsUploadModalOpen(true);
    };

    const handleToolRequestDocument = (event) => {
      const { documentType, reason } = event.detail || {};
      setPresetDocType(documentType || 'Transcript');
      setPresetReason(reason || '');
      setIsUploadModalOpen(true);
    };

    window.addEventListener('unicrypt-tool-upload', handleToolUpload);
    window.addEventListener('unicrypt-tool-request-document', handleToolRequestDocument);
    return () => {
      window.removeEventListener('unicrypt-tool-upload', handleToolUpload);
      window.removeEventListener('unicrypt-tool-request-document', handleToolRequestDocument);
    };
  }, []);
  // Vault filter tab state: 'Verified' | 'Pending' | 'Requested' | 'Rejected' | 'Expired'
  const [vaultFilter, setVaultFilter] = useState('Verified');
  const [vaultSearch, setVaultSearch] = useState('');
  const [selectedVaultDocId, setSelectedVaultDocId] = useState(null);
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState(null);

  const [bottomDockEnabled, setBottomDockEnabled] = useState(() => {
    return localStorage.getItem('unicrypt_bottom_dock_navigation') !== 'false';
  });

  const toggleBottomDock = (val) => {
    setBottomDockEnabled(val);
    localStorage.setItem('unicrypt_bottom_dock_navigation', val ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('unicrypt-bottom-dock-toggle', { detail: { enabled: val } }));
  };

  useEffect(() => {
    const handleAiAction = (event) => {
      const action = event.detail || {};
      if (action.type === 'VAULT_SELECT_DOC') {
        window.location.hash = '#vault';
        setSelectedVaultDocId(action.id);
        
        const match = documents.find(d => d.id === action.id || d.credentialId === action.id);
        if (match) {
          setSelectedViewerDoc(match);
        } else if (action.id === 'cred-transcript-mock') {
          const essayDoc = documents.find(d => d.id.includes('essay') || d.fileName.toLowerCase().includes('transcript'));
          if (essayDoc) setSelectedViewerDoc(essayDoc);
        }
      } else if (action.type === 'VAULT_FILTER') {
        window.location.hash = '#vault';
        setVaultFilter(action.filter);
      } else if (action.type === 'TIMELINE_HIGHLIGHT') {
        window.location.hash = '#activity';
        setSelectedTimelineEventId(action.id);
      } else if (action.type === 'OPEN_MODAL' && action.modal === 'upload') {
        if (action.params?.orgId) {
          const org = (organizationProfiles || []).find(o => o.id === action.params.orgId);
          if (org) {
            setSelectedDiscoveryOrg(org);
          }
        }
        setIsUploadModalOpen(true);
      } else if (action.type === 'OPEN_UPLOAD') {
        if (action.presetDocType) {
          setPresetDocType(action.presetDocType);
          setPresetReason(action.presetReason || 'Prerequisite Upload');
        }
        setIsUploadModalOpen(true);
      } else if (action.type === 'SWITCH_TAB') {
        if (action.hash === '#vault' && action.params?.filter) {
          setVaultFilter(action.params.filter);
        }
      }
    };

    const handleOpenDocumentViewer = (e) => {
      setSelectedViewerDoc(e.detail);
    };

    window.addEventListener('unicrypt-ai-action', handleAiAction);
    window.addEventListener('unicrypt-open-document-viewer', handleOpenDocumentViewer);
    return () => {
      window.removeEventListener('unicrypt-ai-action', handleAiAction);
      window.removeEventListener('unicrypt-open-document-viewer', handleOpenDocumentViewer);
    };
  }, [documents, organizationProfiles]);

  const [notifPrefs, setNotifPrefs] = useState({
    delivery: { email: true, inApp: true, push: false },
    events: { verification: true, credential: true, organization: true, admin: true, security: true, system: true },
    frequency: 'Instant'
  });

  useEffect(() => {
    if (currentUser?.uid) {
      const saved = localStorage.getItem(`notif_prefs_${currentUser.uid}`);
      if (saved) {
        try { setNotifPrefs(JSON.parse(saved)); } catch (e) { console.warn(e); }
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


  // 1. Render Dashboard Main Panel (Redesigned for Premium v0.95 UX)
  const renderDashboardView = () => {
    const hasPassport = (credentials || []).some(c => c.type === 'Passport' && c.status === 'Approved');
    const progressPercent = hasPassport ? 96 : 87;
    const verifiedCount = (credentials || []).filter(c => c.status === 'Approved').length;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Journey Snapshot Header banner */}
        <div className="bg-white/70 dark:bg-[#12131a]/60 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse animate-in fade-in" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                My Workspace
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                {localStorage.getItem('unicrypt_active_journey') === 'Career' ? '💼 Career' : localStorage.getItem('unicrypt_active_journey') === 'Immigration' ? '🌍 Immigration' : '🎓 Education'}
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>
                Target: <strong className="text-slate-800 dark:text-slate-200">{selectedOrgData?.profile?.name || 'Iowa State University'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-10 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/40 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                UniCrypt Match™
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">91%</span>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase animate-pulse">Excellent</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {hasPassport ? (
                  <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓ All prerequisites verified · Ready to submit</span>
                ) : (
                  <span>1 credential missing · Readiness estimated: <strong className="text-slate-750 dark:text-slate-250">Today</strong></span>
                )}
              </p>
            </div>

            <button
              onClick={() => {
                if (selectedOrgData) {
                  window.location.hash = `#organizations?id=${selectedOrgData.profile.id}`;
                } else {
                  window.location.hash = '#organizations';
                }
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl shadow-sm hover:shadow active:scale-95 transition-all outline-none cursor-pointer shrink-0"
            >
              Continue Journey
            </button>
          </div>
        </div>

        {/* Confidence Progress & Actions Stack */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Application Confidence */}
          <Card 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                detail: {
                  id: 'metric.credential_readiness',
                  type: 'metric',
                  title: 'Credential Readiness Index',
                  subtitle: 'Overall portfolio authenticity benchmarks',
                  val: `${progressPercent}%`,
                  detail: `${verifiedCount} of ${(credentials || []).length} items are signed and verified by accredited partner clearinghouses.`
                }
              }));
            }}
            className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
          >
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

            {/* Active Vault Documents list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Secure Credential Vault™ Documents
                </h3>
                <button 
                  onClick={() => { window.location.hash = '#vault'; }}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-blue-650 dark:text-blue-400 hover:underline outline-none"
                >
                  Manage Vault &rarr;
                </button>
              </div>

              <div className="bg-white/70 dark:bg-[#12131a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl p-5 space-y-3">
                {(credentials || []).map(cred => {
                  const docFile = (documents || []).find(d => d.credentialId === cred.id || d.id === cred.id);
                  return (
                    <div 
                      key={cred.id} 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                          detail: {
                            id: `doc.${cred.id}`,
                            type: 'document',
                            title: cred.type,
                            subtitle: docFile?.fileName || 'Secure Document',
                            val: cred.status,
                            detail: `Issued by: ${cred.verifiedBy || 'Self-signed'}. Status: ${cred.status}.`
                          }
                        }));
                      }}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/30 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-450 shrink-0">
                          📄
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cred.type}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold truncate mt-0.5">
                            {docFile?.fileName || `${cred.type.toLowerCase().replace(/\s+/g, '-')}.pdf`} • {docFile?.uploadedAt || 'Verified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase rounded ${
                          cred.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450' 
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-450'
                        }`}>
                          {cred.status === 'Approved' ? 'Verified' : cred.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(credentials || []).length === 0 && (
                  <div className="text-center py-6 text-xs font-semibold text-slate-400 dark:text-slate-555">
                    No credentials stored in vault yet.
                  </div>
                )}
              </div>
            </div>
            
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
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                        detail: {
                          id: `org.${org.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                          type: 'organization',
                          title: org.name,
                          subtitle: `${org.category} Registry Audit`,
                          val: 'Accredited',
                          detail: org.description
                        }
                      }));
                    }}
                    className="p-5 surface-elevated transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer hover:-translate-y-0.5"
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
                      className="w-full mt-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-855 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 rounded-xl transition-all active:scale-[0.98] cursor-pointer outline-none border border-transparent"
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
            <Card className="p-5 surface-primary relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <span className="text-blue-500">✦</span>
                AI Copilot Suggestions
              </h3>
              <div className="space-y-3.5">
                <div 
                  onClick={() => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'Explain Stanford admission criteria.' } }))}
                  className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-xl space-y-1.5 cursor-pointer hover:bg-blue-500/10 transition-all"
                >
                  <h4 className="text-[11px] font-bold text-slate-950 dark:text-white flex items-center gap-1 uppercase tracking-wider">
                    📝 Missing IELTS Prerequisite
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Stanford University requires IELTS. Submit your score card to clear outstanding checklists.
                  </p>
                  <button 
                    className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-450 hover:underline block outline-none mt-1"
                  >
                    Ask Copilot &rarr;
                  </button>
                </div>
                
                <div 
                  onClick={() => { window.location.hash = '#vault'; }}
                  className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1.5 cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/30 transition-all"
                >
                  <h4 className="text-[11px] font-bold text-slate-950 dark:text-white flex items-center gap-1 uppercase tracking-wider">
                    🎓 Verify Transcripts
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Your transcript credential status is pending registrar verification review.
                  </p>
                  <button 
                    className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-450 hover:underline block outline-none mt-1"
                  >
                    View Vault Status &rarr;
                  </button>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    );
  };

  const vaultDocuments = useMemo(() => {
    const list = [...credentials];
    
    const hasTranscript = list.some(c => c.type === 'Academic Transcript');
    const hasPassport = list.some(c => c.type === 'Passport');
    const hasIelts = list.some(c => c.type === 'IELTS Score');
    const hasResume = list.some(c => c.type === 'Resume');
    
    if (!hasTranscript) {
      list.push({
        id: 'cred-transcript-mock',
        type: 'Academic Transcript',
        status: 'Approved',
        verifiedBy: 'Northbridge University',
        verifiedAt: 'Jul 03, 2026',
        expiresAt: 'Jul 03, 2030',
        isReusable: true,
        isExpired: false
      });
    }
    if (!hasPassport) {
      list.push({
        id: 'cred-passport-mock',
        type: 'Passport',
        status: 'Approved',
        verifiedBy: 'City Civic Office',
        verifiedAt: 'Jul 02, 2026',
        expiresAt: 'Jul 02, 2030',
        isReusable: true,
        isExpired: false
      });
    }
    if (!hasIelts) {
      list.push({
        id: 'cred-ielts-mock',
        type: 'IELTS Score',
        status: 'Pending',
        verifiedBy: 'British Council',
        verifiedAt: 'Jul 05, 2026',
        expiresAt: 'Sep 10, 2026',
        isReusable: true,
        isExpired: false
      });
    }
    if (!hasResume) {
      list.push({
        id: 'cred-resume-mock',
        type: 'Resume',
        status: 'Needs Update',
        verifiedBy: 'Self Registered',
        verifiedAt: 'Jan 10, 2025',
        expiresAt: 'Jan 10, 2026',
        isReusable: false,
        isExpired: true
      });
    }
    
    return list.filter(item => {
      const matchesSearch = item.type.toLowerCase().includes(vaultSearch.toLowerCase());
      const matchesFilter = vaultFilter === 'All' || 
                            (vaultFilter === 'Verified' && item.status === 'Approved' && !item.isExpired) ||
                            (vaultFilter === 'Pending' && item.status === 'Pending') ||
                            (vaultFilter === 'Needs Update' && item.status === 'Needs Update') ||
                            (vaultFilter === 'Expired' && item.isExpired);
      return matchesSearch && matchesFilter;
    });
  }, [credentials, vaultSearch, vaultFilter]);
  const renderVaultView = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/40 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credential Vault™</h2>
            <p className="text-[11px] text-slate-555 dark:text-slate-455 mt-1 font-semibold">
              Decentralized document intelligence workspace. Manage, share, and analyze your cryptographically verified records.
            </p>
          </div>
          <Button icon={Upload} onClick={() => setIsUploadModalOpen(true)} className="shrink-0">
            Upload Credential
          </Button>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          
          {/* Main workspace column */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Documents..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#12131a] border border-slate-250 dark:border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs font-bold placeholder-slate-450 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex border border-slate-250 dark:border-slate-800/60 rounded-xl overflow-hidden text-[10px] font-bold">
                {['All', 'Verified', 'Pending', 'Needs Update', 'Expired'].map(t => {
                  const isActive = vaultFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setVaultFilter(t)}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        isActive ? 'bg-blue-600 text-white font-extrabold' : 'bg-white dark:bg-[#12131a] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Cards List */}
            <div className="grid gap-4 sm:grid-cols-2">
              {vaultDocuments.length === 0 ? (
                <div className="sm:col-span-2 p-10 text-center text-slate-400 font-bold uppercase tracking-wider border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl bg-white/40 dark:bg-black/10">
                  No matching vault credentials located.
                </div>
              ) : (
                vaultDocuments.map(cred => {
                  const isSelected = selectedVaultDocId === cred.id;
                  const isExpired = cred.isExpired || cred.status === 'Needs Update';
                  const isPending = cred.status === 'Pending';
                  
                  const statusBg = isExpired ? 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border border-rose-500/10' :
                                   isPending ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/10' :
                                   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10';
                                   
                  return (
                    <Card
                      key={cred.id}
                      onClick={() => setSelectedVaultDocId(cred.id)}
                      className={`p-5 cursor-pointer relative transition-all duration-200 bg-white dark:bg-[#12131a] border ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md scale-[1.01]' 
                          : 'border-slate-205 dark:border-slate-850 hover:border-blue-500/30'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate max-w-[160px]">{cred.type}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${statusBg}`}>
                            {cred.isExpired ? 'Expired' : cred.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-[9px] font-semibold text-slate-500 dark:text-slate-455 border-t border-slate-100 dark:border-slate-850/40 pt-2">
                          <p>Verified By: <strong className="text-slate-800 dark:text-slate-200">{cred.verifiedBy || 'Self'}</strong></p>
                          <p>Expiry: <strong className="text-slate-800 dark:text-slate-200">{cred.expiresAt || 'Never'}</strong></p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Smart Actions Card */}
            <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-850 space-y-4">
              <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-855/50 pb-2">Smart Actions</h3>
              <div className="grid gap-2 text-[10px] font-bold">
                <button
                  onClick={() => {
                    const match = vaultDocuments.find(d => d.id === selectedVaultDocId);
                    if (match) {
                      const fileMatch = documents.find(docObj => docObj.credentialId === match.id || docObj.fileName.toLowerCase().includes('transcript') || docObj.id.includes('essay'));
                      if (fileMatch) setSelectedViewerDoc(fileMatch);
                      else alert('Mock document preview loaded.');
                    } else {
                      alert('Please select a credential from the list first.');
                    }
                  }}
                  className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  📄 Open in Vision™
                </button>
                <button
                  onClick={() => {
                    if (selectedVaultDocId) {
                      window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: `Compare requirements for this document` } }));
                    } else {
                      alert('Please select a credential first.');
                    }
                  }}
                  className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  ⚖ Compare Transcript
                </button>
                <button
                  onClick={() => alert('Secure sharing link copied to clipboard.')}
                  className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  🔗 Share Secure Link
                </button>
                <button
                  onClick={() => alert('Generated cryptographic verification bundle.')}
                  className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  📦 Generate Verification Package
                </button>
              </div>
            </Card>

            {/* Recent Activity Card */}
            <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-850 space-y-4">
              <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850/50 pb-2">Recent Activity</h3>
              <div className="space-y-3.5 text-[10px] font-semibold text-slate-550 dark:text-slate-400">
                <div className="flex gap-2">
                  <span className="text-emerald-500">✔</span>
                  <div>
                    <p className="font-bold text-slate-855 dark:text-slate-250">Transcript analyzed</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">Updated 3 days ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">✔</span>
                  <div>
                    <p className="font-bold text-slate-855 dark:text-slate-250">Passport verified</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">Updated 1 week ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500">⚠</span>
                  <div>
                    <p className="font-bold text-slate-855 dark:text-slate-250">Resume expires in 3 months</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">System warning check</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

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
    const timelineEvents = [
      {
        id: 'event-today-upload',
        time: 'Today',
        title: 'Transcript Uploaded',
        description: 'Official academic transcript received by the local vault.',
        type: 'document',
        badge: 'Success',
        badgeColor: 'bg-emerald-500/10 text-emerald-700',
        actionText: 'View Document',
        onAction: () => {
          const match = documents.find(d => d.fileName.toLowerCase().includes('transcript') || d.id.includes('essay'));
          if (match) setSelectedViewerDoc(match);
          else alert('Mock document loaded in preview.');
        }
      },
      {
        id: 'event-today-ocr',
        time: 'Today',
        title: 'OCR Scanning Complete',
        description: 'UniCrypt Vision™ extracted 45 transcript scoring modules with 99.4% confidence index.',
        type: 'vision',
        badge: 'Vision™',
        badgeColor: 'bg-indigo-500/10 text-indigo-700',
        actionText: 'Ask AI Explanation',
        onAction: () => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'Explain the OCR extraction details' } }))
      },
      {
        id: 'event-today-gpa',
        time: 'Today',
        title: 'GPA Extracted',
        description: 'Verified cumulative GPA of 3.85 mapped to registry standards.',
        type: 'metrics',
        badge: 'GPA',
        badgeColor: 'bg-blue-500/10 text-blue-700',
        actionText: 'Check Readiness',
        onAction: () => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'What is my credential readiness score?' } }))
      },
      {
        id: 'event-today-readiness',
        time: 'Today',
        title: 'Readiness Index Updated',
        description: 'Admissions readiness index updated to 82% match rating.',
        type: 'readiness',
        badge: 'Score',
        badgeColor: 'bg-emerald-500/10 text-emerald-700',
        actionText: 'Compare Stanford',
        onAction: () => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'Compare my readiness with Stanford requirements' } }))
      },
      {
        id: 'event-yesterday-passport',
        time: 'Yesterday',
        title: 'Passport Uploaded',
        description: 'Valid national passport stored securely in decentralized vault.',
        type: 'document',
        badge: 'Success',
        badgeColor: 'bg-emerald-500/10 text-emerald-700',
        actionText: 'View Passport',
        onAction: () => {
          const match = documents.find(d => d.fileName.toLowerCase().includes('passport') || d.id === 'doc-passport');
          if (match) setSelectedViewerDoc(match);
          else alert('Mock document preview loaded.');
        }
      },
      {
        id: 'event-yesterday-requirements',
        time: 'Yesterday',
        title: 'Requirements Refreshed',
        description: 'Iowa State University application template updated in context rules.',
        type: 'workflow',
        badge: 'Iowa State',
        badgeColor: 'bg-amber-500/10 text-amber-700',
        actionText: 'Open Organization',
        onAction: () => {
          setSelectedDiscoveryOrg({ id: 'org-iowa', name: 'Iowa State University' });
          window.location.hash = '#organizations';
        }
      },
      {
        id: 'event-lastweek-workflow',
        time: 'Last Week',
        title: 'Education Workflow Initiated',
        description: 'Graduate admission matching protocol launched for WES and Stanford.',
        type: 'workflow',
        badge: 'Initiated',
        badgeColor: 'bg-blue-500/10 text-blue-700',
        actionText: 'Explain Workflow',
        onAction: () => window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: 'Explain my active workflows' } }))
      }
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">UniCrypt Timeline™</h2>
          <p className="text-[11px] text-slate-555 dark:text-slate-455 mt-1 font-semibold">
            GitHub-style activity ledger tracking document extraction, validation events, and registry uploads.
          </p>
        </div>

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-2">
          {timelineEvents.map((evt) => {
            const isSelected = selectedTimelineEventId === evt.id;
            return (
              <div key={evt.id} className="relative group/evt">
                {/* Timeline Dot Indicator */}
                <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white dark:bg-[#090a0f] transition-all duration-200 ${
                  isSelected ? 'border-blue-500 scale-125 ring-4 ring-blue-500/20 animate-pulse' : 'border-slate-300 dark:border-slate-700 group-hover/evt:border-blue-500/50'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-350 dark:bg-slate-650'}`} />
                </span>

                {/* Event Card Content */}
                <div 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                      detail: {
                        id: `timeline.${evt.id}`,
                        type: 'timeline',
                        title: evt.title,
                        subtitle: `${evt.category} Checkpoint · Registered ${evt.time}`,
                        val: evt.status || 'Audited',
                        detail: evt.description
                      }
                    }));
                  }}
                  className={`p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#12131a] cursor-pointer hover:-translate-y-0.5 hover:shadow-sm select-none ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md scale-[1.01]' : 'border-slate-205 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-0.5">{evt.time}</span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{evt.title}</h4>
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">{evt.description}</p>
                    </div>
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${evt.badgeColor}`}>
                        {evt.badge}
                      </span>
                      <button
                        onClick={evt.onAction}
                        className="text-[9px] font-extrabold text-blue-600 hover:text-blue-755 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer uppercase tracking-wider outline-none border-none bg-transparent p-0"
                      >
                        {evt.actionText} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 5. Student Profile View
  const renderProfileView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Individual Profile</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-1 font-semibold">
            Manage your personal data credentials.
          </p>
        </div>
        <Card className="p-6 max-w-md bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
          <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <p>Name: <strong className="text-slate-950 dark:text-white font-extrabold">Individual User</strong></p>
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

          {/* Navigation Mode */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Workspace Navigation Mode</h3>
            <div className="space-y-3 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bottomDockEnabled}
                  onChange={(e) => toggleBottomDock(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-850 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Bottom Dock OS Navigation (Hides standard sidebar, switches to Spotlight spotlight window)</span>
              </label>
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
          setPresetDocType(null);
          setPresetReason(null);
        }}
        targetRequest={resolveRequest}
        initialSelectedOrg={selectedDiscoveryOrg}
        presetDocumentType={presetDocType}
        presetReason={presetReason}
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
