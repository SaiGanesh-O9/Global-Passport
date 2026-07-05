import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments.js';
import { useAuth } from '../hooks/useAuth.js';
import DocumentTable from '../components/dashboard/DocumentTable.jsx';
import UploadDocumentModal from '../components/dashboard/UploadDocumentModal.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import UniversalDocumentViewer from '../components/dashboard/UniversalDocumentViewer.jsx';
import { FileText, LayoutDashboard, Settings, Upload, Mail, Search, Building2, CheckCircle2, Globe, ChevronRight, Shield, Activity, User, Clock, AlertCircle, FileCheck, Download, Eye } from 'lucide-react';

export const userNavItems = [
  { label: 'Dashboard', to: '/dashboard#dashboard', icon: LayoutDashboard },
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
  const { currentUser } = useAuth();
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

  // 1. Render Dashboard Main Panel
  const renderDashboardView = () => {
    return (
      <div className="space-y-6">
        <Card className="p-6 sm:p-8 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Welcome</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Manage your verification requests
              </h1>
              <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Submit verification requests once, track review status, and reuse verified credentials whenever you need them.
              </p>
            </div>
            <Button icon={Upload} onClick={() => setIsUploadModalOpen(true)} className="shrink-0">
              Request Verification
            </Button>
          </div>
        </Card>

        {incomingRequests.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Incoming Verification Requests ({incomingRequests.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {incomingRequests.map((req) => (
                <Card 
                  key={req.id} 
                  className="p-5 bg-white dark:bg-[#12131a] border border-blue-550/20 dark:border-blue-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl pointer-events-none"></div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-slate-505 dark:text-slate-450 uppercase tracking-wider block">
                        From {req.organizationName || req.requestedOrganization}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-550/10">
                        Upload Approval Required
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">
                      {req.credentialType}
                    </h3>
                    {req.purpose && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 italic leading-relaxed">
                        Message: "{req.purpose}"
                      </p>
                    )}
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 block font-bold">
                      Requested on: {req.requestDate}
                    </span>
                  </div>
                  <div className="relative z-10 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/45">
                    <Button 
                      variant="primary" 
                      className="w-full text-[10px] font-extrabold py-2 px-3 justify-center gap-1.5"
                      onClick={() => setResolveRequest(req)}
                    >
                      Approve & Upload Document
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Organization Discovery Panel */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Discover Organizations</h2>
              <p className="mt-1 text-xs text-slate-550 dark:text-slate-400 font-semibold">
                Find verified institutions and request credential verifications directly.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name, category, or service..."
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-205 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/80 font-semibold transition-theme"
              />
            </div>
          </div>

          {filteredDiscoveryOrgs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDiscoveryOrgs.map((org) => {
                const services = (verificationServices || []).filter(s => s.organizationId === org.id);
                return (
                  <Card 
                    key={org.id} 
                    className="p-5 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-505 dark:text-slate-450 uppercase tracking-wider block">
                          {org.category || 'Organization'}
                        </span>
                        <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-450 ring-1 ring-emerald-500/20 flex items-center gap-0.5 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          Active
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">{org.name}</h3>
                        {org.description && (
                          <p className="text-[11px] text-slate-555 dark:text-slate-400 line-clamp-2 mt-1 leading-normal font-semibold">
                            {org.description}
                          </p>
                        )}
                      </div>

                      {services.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Available Services</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {services.map(s => (
                              <span 
                                key={s.id} 
                                className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900/60 text-slate-655 dark:text-slate-350 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/40"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/45 flex items-center justify-between gap-3">
                      {org.website && (
                        <a 
                          href={`https://${org.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDiscoveryOrg(org);
                          setIsUploadModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-[10px] font-extrabold text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        Request Verification
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-[#12131a]/40">
              <p className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider">
                No active organizations are accepting verification requests.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DocumentTable />
          </div>
          <div>
            <ActivityFeed />
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
            <p className="text-xs text-slate-450 font-bold py-12 text-center col-span-3 border-2 border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl bg-white dark:bg-[#12131a]/40">
              No credentials found in this vault category.
            </p>
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
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardView();
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
