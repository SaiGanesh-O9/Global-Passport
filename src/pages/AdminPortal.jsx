import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { useDocumentActions } from '../hooks/useDocumentActions.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import UniversalDocumentViewer from '../components/dashboard/UniversalDocumentViewer.jsx';
import {
  Users as UsersIcon,
  Building2,
  Activity,
  FileText,
  PieChart,
  Settings,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Edit2,
  Trash2,
  Plus,
  LogOut,
  FileCheck2,
  UserCheck,
  ShieldCheck,
  Mail,
  RotateCcw,
  Save,
  HelpCircle,
  ExternalLink,
  ShieldAlert as ShieldXIcon,
  ClipboardList
} from 'lucide-react';

export default function AdminPortal() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const {
    updateUserRoleStatus,
    updateOrganization,
    createOrganization,
    savePlatformSettings,
    transitionRequestStatus,
    deleteUser,
    deleteOrganization
  } = useDocumentActions();

  // Active workspace tab
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | organizations | requests | analytics | logs | settings
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedViewerDoc, setSelectedViewerDoc] = useState(null);

  // Consumed from centralized DocumentProvider state context
  const {
    users,
    organizations,
    verificationRequests: requests,
    verificationServices,
    credentialTemplates,
    auditLogs,
    platformSettings,
    loading
  } = useDocuments();

  const loadingUsers = loading;
  const loadingOrgs = loading;
  const loadingRequests = loading;
  const loadingAuditLogs = loading;

  // Editing / Creation States
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    role: '',
    status: '',
    organizationId: '',
    organizationName: '',
    organizationRole: '',
  });
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Create Org States
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    type: 'University',
    officialEmailDomain: '',
    website: '',
    status: 'Active',
    verificationStatus: 'Verified',
  });
  const [orgSearch, setOrgSearch] = useState('');

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(orgSearch.toLowerCase())
    );
  }, [organizations, orgSearch]);

  // Edit Org States
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgForm, setOrgForm] = useState({
    status: '',
    verificationStatus: '',
  });

  // UI Processing Notification Banner states
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [actionProcessing, setActionProcessing] = useState(false);

  // Warning Modal States
  const [warningMessage, setWarningMessage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm }

  // Users Filters/Search/Sorting States
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSortField, setUserSortField] = useState('newest'); // newest | oldest | lastLogin

  // Verification Requests Filters/Search States
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [requestTypeFilter, setRequestTypeFilter] = useState('All');

  // Audit Logs Search/Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('All');
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logActionFilter]);



  // Show status banner notification helper
  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5050);
  };

  // Log out action
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Transactional User Profile Save
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Self-Protection check
    if (editingUser.id === currentUser?.uid) {
      if (userForm.role !== 'super_admin' || userForm.status !== 'active') {
        setWarningMessage('Self-Protection Rule: You are not allowed to suspend yourself, set yourself to pending, or remove your own super_admin role.');
        setEditingUser(null);
        return;
      }
    }

    // Promotional warning for another super admin
    if (userForm.role === 'super_admin' && editingUser.role !== 'super_admin') {
      setConfirmAction({
        title: 'Promote User to Super Admin',
        message: `This will grant full administrative access to ${editingUser.email}. Proceed?`,
        onConfirm: () => commitUserChanges(),
      });
      return;
    }

    // Suspension warning
    if (userForm.status === 'suspended' && editingUser.status !== 'suspended') {
      setConfirmAction({
        title: 'Suspend User Account',
        message: `This user (${editingUser.email}) will lose all access to VeriFlash. Proceed?`,
        onConfirm: () => commitUserChanges(),
      });
      return;
    }

    // Otherwise, direct save
    await commitUserChanges();
  };

  const commitUserChanges = async () => {
    setActionProcessing(true);
    setConfirmAction(null);
    try {
      const isOrg = userForm.role === 'organization';
      const updates = {
        role: userForm.role,
        status: userForm.status,
        organizationId: isOrg ? userForm.organizationId || null : null,
        organizationName: isOrg ? userForm.organizationName || null : null,
        organizationRole: isOrg ? userForm.organizationRole || null : null,
      };

      await updateUserRoleStatus(editingUser.id, updates, currentUser.email, currentUser.uid);
      triggerNotification('success', 'User profile updated successfully.');
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to update user: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Open Edit User panel
  const handleStartEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      role: user.role || 'pending',
      status: user.status || 'pending',
      organizationId: user.organizationId || '',
      organizationName: user.organizationName || '',
      organizationRole: user.organizationRole || 'Viewer',
    });
    setOrgSearchQuery(user.organizationName || '');
  };

  // Delete User Account
  const handleDeleteUser = (userId, userEmail) => {
    if (userId === currentUser.uid) {
      setWarningMessage('Self-Protection: You cannot delete your own account.');
      return;
    }
    setConfirmAction({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user ${userEmail}? This will remove their Firestore user profile document.`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await deleteUser(userId, currentUser.email, currentUser.uid);
          triggerNotification('success', `User account ${userEmail} deleted successfully.`);
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to delete user: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  // Create organization
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgForm.name.trim()) return;

    setActionProcessing(true);
    try {
      const generatedId = `org-${newOrgForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newOrg = {
        organizationId: generatedId,
        name: newOrgForm.name.trim(),
        type: newOrgForm.type,
        officialEmailDomain: newOrgForm.officialEmailDomain.trim(),
        website: newOrgForm.website.trim(),
        logoUrl: null,
        status: newOrgForm.status,
        verificationStatus: newOrgForm.verificationStatus,
        createdAt: new Date().toISOString(),
      };

      await createOrganization(generatedId, newOrg, currentUser.email, currentUser.uid);
      triggerNotification('success', `Organization "${newOrg.name}" created successfully.`);
      setShowCreateOrg(false);
      setNewOrgForm({
        name: '',
        type: 'University',
        officialEmailDomain: '',
        website: '',
        status: 'Active',
        verificationStatus: 'Verified',
      });
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to create organization: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Edit organization status values
  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;

    setActionProcessing(true);
    try {
      const updates = {
        status: orgForm.status,
        verificationStatus: orgForm.verificationStatus,
      };

      await updateOrganization(editingOrg.id, updates, currentUser.email, currentUser.uid);
      triggerNotification('success', 'Organization metadata updated successfully.');
      setEditingOrg(null);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to update organization: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Delete Organization with referential integrity safeguards
  const handleDeleteOrg = async (orgId, orgName) => {
    setConfirmAction({
      title: 'Delete Organization',
      message: `Are you sure you want to permanently delete organization "${orgName}"? This action cannot be undone.`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await deleteOrganization(orgId, currentUser.email, currentUser.uid);
          triggerNotification('success', `Organization "${orgName}" deleted successfully.`);
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to delete organization: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  // Direct status update toggles for organizations
  const handleUpdateOrgStatus = async (orgId, newStatus, newVerification) => {
    setActionProcessing(true);
    try {
      const updates = {};
      if (newStatus) updates.status = newStatus;
      if (newVerification) updates.verificationStatus = newVerification;

      await updateOrganization(orgId, updates, currentUser.email, currentUser.uid);
      triggerNotification('success', `Organization status updated.`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Update failed: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleRequestStatusChange = (reqId, newStatus, actionName, timelineMsg) => {
    setConfirmAction({
      title: `${actionName.replace('_', ' ')}`,
      message: `Are you sure you want to transition the status of request ${reqId} to ${newStatus}?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await transitionRequestStatus(reqId, newStatus, actionName, timelineMsg, currentUser.email, currentUser.uid);
          triggerNotification('success', `Request status updated to ${newStatus}.`);
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to update request: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  // Save platform settings doc
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionProcessing(true);
    try {
      await savePlatformSettings(platformSettings, currentUser.email, currentUser.uid);
      triggerNotification('success', 'Platform settings saved successfully.');
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to save settings: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Reset Platform Settings
  const handleResetSettings = () => {
    setConfirmAction({
      title: 'Reset Platform Settings',
      message: 'Are you sure you want to reset all platform configurations to default values?',
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          const defaults = {
            maintenanceMode: false,
            allowSelfRegistration: true,
            maxUploadSizeMb: 20
          };
          await savePlatformSettings(defaults, currentUser.email, currentUser.uid);
          triggerNotification('success', 'Platform settings reset to defaults.');
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to reset settings: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  // Filter & sort user rows locally
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.id?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.uid?.toLowerCase().includes(userSearch.toLowerCase());
        const matchesStatus = userStatusFilter === 'All' || user.status === userStatusFilter.toLowerCase();
        
        let targetRole = userRoleFilter.toLowerCase().replace(' ', '_');
        if (targetRole === 'user') {
          targetRole = 'student';
        }
        const matchesRole = userRoleFilter === 'All' || user.role === targetRole;
        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        if (userSortField === 'newest') {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        } else if (userSortField === 'oldest') {
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        } else if (userSortField === 'lastLogin') {
          return (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0);
        }
        return 0;
      });
  }, [users, userSearch, userStatusFilter, userRoleFilter, userSortField]);

  // Filter & search verification requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.ownerName?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.ownerEmail?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.id?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.verificationId?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.credentialType?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.organization?.name?.toLowerCase().includes(requestSearch.toLowerCase());
      
      const matchesStatus = requestStatusFilter === 'All' || req.status === requestStatusFilter;
      const matchesType = requestTypeFilter === 'All' || req.credentialType === requestTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, requestSearch, requestStatusFilter, requestTypeFilter]);

  // Filter & search audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        const matchesSearch =
          log.actorEmail?.toLowerCase().includes(logSearch.toLowerCase()) ||
          log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
          log.targetName?.toLowerCase().includes(logSearch.toLowerCase()) ||
          log.details?.toLowerCase().includes(logSearch.toLowerCase());
        
        const matchesAction = logActionFilter === 'All' || log.action === logActionFilter;
        return matchesSearch && matchesAction;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [auditLogs, logSearch, logActionFilter]);

  const paginatedAuditLogs = useMemo(() => {
    const start = (logPage - 1) * 10;
    return filteredAuditLogs.slice(start, start + 10);
  }, [filteredAuditLogs, logPage]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalReq = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    const totalResolved = approved + rejected;

    return {
      totalUsers: users.length,
      pendingUsers: users.filter(u => u.status === 'pending').length,
      activeUsers: users.filter(u => u.status === 'active').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      totalOrgs: organizations.length,
      pendingOrgs: organizations.filter(o => o.status === 'Pending').length,
      activeOrgs: organizations.filter(o => o.status === 'Active').length,
      suspendedOrgs: organizations.filter(o => o.status === 'Suspended').length,
      rejectedOrgs: organizations.filter(o => o.status === 'Rejected').length,
      totalRequests: totalReq,
      pendingRequests: requests.filter(r => r.status === 'Pending').length,
      approvedRequests: approved,
      rejectedRequests: rejected,
      infoRequests: requests.filter(r => r.status === 'Information Requested').length,
      approvalRate: totalResolved > 0 ? ((approved / totalResolved) * 100).toFixed(1) : '0',
      rejectionRate: totalResolved > 0 ? ((rejected / totalResolved) * 100).toFixed(1) : '0',
    };
  }, [users, organizations, requests]);

  // Credential distribution live analytics metrics helper
  const credentialDistribution = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const type = r.credentialType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percentage: requests.length > 0 ? ((count / requests.length) * 100).toFixed(1) : '0'
    })).sort((a,b) => b.count - a.count);
  }, [requests]);

  // Top Verifying Organizations list helper
  const topOrganizations = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const orgName = r.organization?.name || r.requestedOrganization || 'Unknown';
      counts[orgName] = (counts[orgName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    })).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [requests]);

  // Filter active and verified organizations for dropdown select inside edit user
  const activeVerifiedOrgs = useMemo(() => {
    return organizations.filter(
      (org) =>
        org.status === 'Active' &&
        org.verificationStatus === 'Verified' &&
        org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
    );
  }, [organizations, orgSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/30 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-colors duration-250 flex flex-col font-sans">
      
      {/* Top Banner Alert System */}
      {notification && (
        <div className={`fixed top-4 right-4 z-55 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
          notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 dark:text-emerald-450 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border-rose-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Warning Alert Modal */}
      {warningMessage && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm px-4">
          <Card className="max-w-md w-full p-6 text-center space-y-4 bg-white dark:bg-[#12131a] dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 dark:border-slate-800/40 shadow-2xl dark:shadow-black/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-705 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white dark:text-white uppercase tracking-wider">Action Blocked</h3>
            <p className="text-xs text-slate-505 dark:text-slate-400 font-semibold leading-relaxed">{warningMessage}</p>
            <div className="pt-2">
              <Button onClick={() => setWarningMessage(null)} variant="primary" className="w-full">
                Understood
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Actions Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm px-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white dark:bg-[#12131a] dark:bg-[#12131a] border border-slate-250 dark:border-slate-800/50/80 dark:border-slate-800/40 shadow-2xl dark:shadow-black/50">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/40/50 dark:border-slate-800/40 pb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white dark:text-white uppercase tracking-wider">{confirmAction.title}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={() => setConfirmAction(null)} variant="secondary">
                Cancel
              </Button>
              <Button disabled={actionProcessing} onClick={confirmAction.onConfirm} variant="danger">
                {actionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Dashboard Top Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/40/80 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/30/80 dark:bg-[#090a0f]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-theme">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800/40 dark:border-slate-850 bg-white dark:bg-[#12131a] dark:bg-slate-900/40 text-slate-400 cursor-pointer"
          >
            <Activity className="h-4.5 w-4.5" />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:shadow-black/10 shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="tracking-tight font-extrabold text-slate-900 dark:text-slate-100 dark:text-white text-sm">VeriFlash Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 dark:text-white">{currentUser?.displayName || 'Super Admin'}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 dark:text-slate-550 font-semibold">{currentUser?.email}</p>
          </div>
          <ThemeToggle />
          <Button
            onClick={handleLogout}
            variant="danger"
            className="py-1 px-3.5 text-xs font-bold rounded-xl"
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Dashboard Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Nav */}
        <aside className={`border-r border-slate-200 dark:border-slate-800/40/80 dark:border-slate-800/40 bg-white dark:bg-[#12131a]/80 dark:bg-[#12131a]/80 backdrop-blur-md w-64 shrink-0 flex flex-col justify-between py-6 transition-all duration-250 fixed md:static inset-y-16 left-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <nav className="space-y-1.5 px-3">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'requests', label: 'Requests', icon: FileCheck2 },
              { id: 'catalog', label: 'Credential Catalog', icon: ClipboardList },
              { id: 'overrides', label: 'Overrides Panel', icon: ShieldAlert },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'logs', label: 'Audit Logs', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 active:scale-[0.98] cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/200/10 text-blue-600 dark:text-blue-400 font-extrabold'
                      : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/20 dark:bg-slate-900/60 dark:hover:bg-slate-800/20 hover:text-slate-850 dark:text-slate-200 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 text-current shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-6 py-2 text-[10px] text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold border-t border-slate-200 dark:border-slate-800/40/50 dark:border-slate-800/40 mt-auto space-y-2">
            {import.meta.env.DEV && localStorage.getItem('dev_user') && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-0.5">
                <p className="font-extrabold text-amber-500 uppercase tracking-wider flex items-center justify-center gap-1 text-[9px]">
                  🛠 Dev Mode
                </p>
                <p className="font-bold text-slate-600 dark:text-slate-450 dark:text-slate-500 dark:text-slate-400">
                  {(() => {
                    try {
                      const r = JSON.parse(localStorage.getItem('dev_user'))?.userProfile?.role;
                      if (r === 'student') return 'User';
                      if (r === 'organization') return 'Organization';
                      if (r === 'super_admin') return 'Super Admin';
                    } catch (e) {}
                    return 'Dev Session';
                  })()}
                </p>
              </div>
            )}
            <div>VeriFlash v1.2 Admin Console</div>
          </div>
        </aside>

        {/* Content Workspace Panel */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {/* TAB 1: OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Overview Summary</h1>
                <span className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-medium">Real-time Telemetry Data</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalUsers}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeUsers} | Suspended: {stats.suspendedUsers}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organizations</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalOrgs}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeOrgs} | Pending: {stats.pendingOrgs}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Requests</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalRequests}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Approved: {stats.approvedRequests} | Pending: {stats.pendingRequests}</p>
                  </div>
                  <FileCheck2 className="h-8 w-8 text-emerald-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval / Rejection Rate</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.approvalRate}% / {stats.rejectionRate}%</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1">Info Req: {stats.infoRequests}</p>
                  </div>
                  <Activity className="h-8 w-8 text-amber-500" />
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Secondary breakdown stats */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Database Status Distribution</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 space-y-2 border-l-4 border-emerald-500 bg-white dark:bg-[#12131a]">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">User Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Active</span>
                        <span className="text-emerald-700 dark:text-emerald-450">{stats.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Suspended</span>
                        <span className="text-red-700 dark:text-rose-450">{stats.suspendedUsers}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Pending</span>
                        <span className="text-amber-700 dark:text-amber-450">{stats.pendingUsers}</span>
                      </div>
                    </Card>
                    <Card className="p-4 space-y-2 border-l-4 border-indigo-500 bg-white dark:bg-[#12131a]">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">Organizations Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Active</span>
                        <span className="text-indigo-755">{stats.activeOrgs}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Suspended</span>
                        <span className="text-red-700 dark:text-rose-450">{stats.suspendedOrgs}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Pending</span>
                        <span className="text-amber-700 dark:text-amber-450">{stats.pendingOrgs}</span>
                      </div>
                    </Card>
                    <Card className="p-4 space-y-2 border-l-4 border-blue-500 bg-white dark:bg-[#12131a]">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">Requests Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Approved</span>
                        <span className="text-emerald-700 dark:text-emerald-450">{stats.approvedRequests}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Rejected</span>
                        <span className="text-red-700 dark:text-rose-450">{stats.rejectedRequests}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 dark:border-slate-800/20 pt-1">
                        <span className="text-slate-600 dark:text-slate-450 dark:text-slate-500">Pending / Info</span>
                        <span className="text-amber-700 dark:text-amber-450">{stats.pendingRequests + stats.infoRequests}</span>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Recent Sign-ins list */}
                <Card className="p-4 space-y-3 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 dark:border-slate-800/40 pb-2">Recent Sign-ins</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/40 space-y-2 max-h-60 overflow-y-auto pr-1">
                    {users
                      .filter(u => u.lastLogin)
                      .sort((a,b) => {
                        const timeA = a.lastLogin?.seconds || (typeof a.lastLogin === 'string' ? new Date(a.lastLogin).getTime()/1000 : 0);
                        const timeB = b.lastLogin?.seconds || (typeof b.lastLogin === 'string' ? new Date(b.lastLogin).getTime()/1000 : 0);
                        return timeB - timeA;
                      })
                      .slice(0, 5)
                      .map((u) => (
                        <div key={u.id} className="pt-2 flex items-center justify-between text-xs font-semibold">
                          <div className="truncate pr-2">
                            <p className="text-slate-850 dark:text-slate-200 font-bold truncate">{u.name}</p>
                            <p className="text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                            {u.lastLogin?.toDate ? new Date(u.lastLogin.toDate()).toLocaleTimeString() : 
                             typeof u.lastLogin === 'string' ? new Date(u.lastLogin).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">User Directory</h1>
                <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold">{filteredUsers.length} Users Listed</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-[#12131a] p-4 rounded-2xl shadow-sm dark:shadow-black/10 border border-slate-200 dark:border-slate-800/40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800/50 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30"
                  />
                </div>
                <div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="All">All Roles</option>
                    <option value="Student">User</option>
                    <option value="Organization">Organization</option>
                    <option value="Employer">Employer</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <select
                    value={userSortField}
                    onChange={(e) => setUserSortField(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="newest">Sort: Newest Registered</option>
                    <option value="oldest">Sort: Oldest Registered</option>
                    <option value="lastLogin">Sort: Recent Sign-in</option>
                  </select>
                </div>
              </div>

              {/* Users List Table */}
              <Card className="overflow-x-auto border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#12131a]">
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 dark:text-blue-400 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold">
                    No users match search filters criteria.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800/40">
                      <tr>
                        <th className="px-4 py-3">Name / Email</th>
                        <th className="px-4 py-3">Platform Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Organization Mapping</th>
                        <th className="px-4 py-3">Created At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {filteredUsers.map((user) => {
                        const isSelf = user.id === currentUser?.uid;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30/50 bg-white dark:bg-[#12131a]">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-950 dark:text-white flex items-center gap-1">
                                {user.name}
                                {isSelf && <span className="text-[9px] bg-blue-100 text-blue-800 dark:text-blue-300 font-extrabold px-1 rounded">You</span>}
                              </p>
                              <p className="text-slate-455 dark:text-slate-500 mt-0.5">{user.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user.uid || user.id}</p>
                            </td>
                            <td className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px] text-slate-800">
                              {user.role === 'student' ? 'user' : user.role?.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[9px] ${
                                user.status === 'active' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' :
                                user.status === 'suspended' ? 'bg-red-50 text-red-800 ring-1 ring-red-200' :
                                'bg-amber-50 text-amber-800 ring-1 ring-amber-250'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-medium">
                              {user.role === 'organization' ? (
                                <div>
                                  <p className="text-slate-900 dark:text-slate-100 font-semibold">{user.organizationName || 'No Org Assigned'}</p>
                                  {user.organizationRole && (
                                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Role: {user.organizationRole}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-450 dark:text-slate-500">
                              {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : 
                               typeof user.createdAt === 'string' ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  icon={Edit2}
                                  onClick={() => handleStartEditUser(user)}
                                  variant="secondary"
                                  className="px-2 py-1 h-7 text-[11px]"
                                >
                                  Edit
                                </Button>
                                {!isSelf && (
                                  <Button
                                    icon={Trash2}
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    variant="danger"
                                    className="px-2 py-1 h-7 text-[11px]"
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Card>

              {/* Edit User Modal Drawer */}
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
                  <Card className="w-full max-w-lg p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-xl dark:shadow-black/35">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">Edit User Role & Mappings</h3>
                      <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-semibold">
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded border border-slate-100 dark:border-slate-800/20 flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-800">{editingUser.name}</p>
                          <p className="text-slate-455 dark:text-slate-500 mt-0.5">{editingUser.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Platform Role</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full rounded border border-slate-200 dark:border-slate-800/40 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                          >
                            <option value="student">User</option>
                            <option value="organization">Organization</option>
                            <option value="employer">Employer</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Account Status</label>
                          <select
                            value={userForm.status}
                            onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded border border-slate-200 dark:border-slate-800/40 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      {/* Organization mapping selection dropdown */}
                      {userForm.role === 'organization' && (
                        <div className="border-t border-slate-100 dark:border-slate-800/20 pt-3 space-y-3">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Organization Mappings</p>
                          
                          <div className="relative">
                            <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Search Organization</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450 dark:text-slate-500" />
                              <input
                                type="text"
                                placeholder="Search by name..."
                                value={orgSearchQuery}
                                onChange={(e) => {
                                  setOrgSearchQuery(e.target.value);
                                  setOrgDropdownOpen(true);
                                }}
                                onFocus={() => setOrgDropdownOpen(true)}
                                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800/40 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30"
                              />
                            </div>

                            {/* Dropdown elements list */}
                            {orgDropdownOpen && (
                              <div className="absolute left-0 right-0 z-30 max-h-40 overflow-y-auto mt-1 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 rounded shadow-lg divide-y divide-slate-100 dark:divide-slate-800/40">
                                {activeVerifiedOrgs.length > 0 ? (
                                  activeVerifiedOrgs.map((org) => (
                                    <div
                                      key={org.id}
                                      onClick={() => {
                                        setUserForm((prev) => ({
                                          ...prev,
                                          organizationId: org.organizationId,
                                          organizationName: org.name,
                                        }));
                                        setOrgSearchQuery(org.name);
                                        setOrgDropdownOpen(false);
                                      }}
                                      className="p-2 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30 cursor-pointer flex justify-between items-center text-[11px]"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-800">{org.name}</p>
                                        <p className="text-[9px] text-slate-400">{org.type} — {org.status}</p>
                                      </div>
                                      <span className="text-[8px] bg-emerald-50 text-emerald-850 px-1 rounded">Verified</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-slate-505 text-center py-4 bg-slate-50 dark:bg-slate-900/30">
                                    No Active/Verified organizations match query.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {userForm.organizationId && (
                            <div className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 p-2 rounded flex items-center justify-between">
                              <span>Selected: <strong>{userForm.organizationName}</strong> (ID: {userForm.organizationId})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserForm(prev => ({ ...prev, organizationId: '', organizationName: '' }));
                                  setOrgSearchQuery('');
                                }}
                                className="text-blue-900 hover:text-red-755 cursor-pointer font-bold border-none bg-transparent"
                              >
                                Clear
                              </button>
                            </div>
                          )}

                          <div>
                            <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Organization Role Mapping</label>
                            <select
                              value={userForm.organizationRole}
                              onChange={(e) => setUserForm(prev => ({ ...prev, organizationRole: e.target.value }))}
                              className="w-full rounded border border-slate-200 dark:border-slate-800/40 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Verifier">Verifier</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/20">
                        <Button type="button" onClick={() => setEditingUser(null)} variant="secondary">
                          Cancel
                        </Button>
                        <Button disabled={actionProcessing} type="submit" variant="primary">
                          {actionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORGANIZATIONS PANEL */}
          {activeTab === 'organizations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Organizations</h1>
                <Button icon={Plus} onClick={() => setShowCreateOrg(true)} variant="primary">
                  Create Organization
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search organizations by name..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-205 dark:border-slate-800/40 bg-white dark:bg-[#12131a] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80"
                />
              </div>

              {/* Organizations Table */}
              <Card className="overflow-x-auto border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#12131a]">
                {loadingOrgs ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 dark:text-blue-400 animate-spin" />
                  </div>
                ) : filteredOrganizations.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No active organizations match query.
                  </div>
                ) : (
                  <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800/40">
                      <tr>
                        <th className="px-4 py-3">Name / Website</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Verification Status</th>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {filteredOrganizations.map((org) => (
                        <tr key={org.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30/50 bg-white dark:bg-[#12131a]">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-950 dark:text-white">{org.name}</p>
                            {org.website && (
                              <a
                                href={`https://${org.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-650 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                {org.website}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{org.type}</td>
                          <td className="px-4 py-3.5">
                            <select
                              value={org.status}
                              onChange={(e) => handleUpdateOrgStatus(org.id, e.target.value, null)}
                              className="bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-205 py-0.5 px-1 font-semibold text-[10px]"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={org.verificationStatus}
                              onChange={(e) => handleUpdateOrgStatus(org.id, null, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-205 py-0.5 px-1 font-semibold text-[10px]"
                            >
                              <option value="Verified">Verified</option>
                              <option value="Verification Expiring">Expiring</option>
                              <option value="Needs Review">Needs Review</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-550">@{org.officialEmailDomain}</td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                icon={Edit2}
                                onClick={() => {
                                  setEditingOrg(org);
                                  setOrgForm({
                                    status: org.status || 'Active',
                                    verificationStatus: org.verificationStatus || 'Verified',
                                  });
                                }}
                                variant="secondary"
                                className="px-2 py-1 h-7 text-[11px]"
                              >
                                Edit
                              </Button>
                              <Button
                                icon={Trash2}
                                onClick={() => handleDeleteOrg(org.id, org.name)}
                                variant="danger"
                                className="px-2 py-1 h-7 text-[11px]"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              {/* Create Organization Modal */}
              {showCreateOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
                  <Card className="w-full max-w-lg p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-xl dark:shadow-black/35">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">Create New Organization</h3>
                      <button onClick={() => setShowCreateOrg(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Organization Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Northbridge University"
                            value={newOrgForm.name}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Type</label>
                          <select
                            value={newOrgForm.type}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                          >
                            <option value="University">University</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Employer">Employer</option>
                            <option value="Bank">Bank</option>
                            <option value="Certification Authority">Certification Authority</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Official Email Domain</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. northbridge.edu"
                            value={newOrgForm.officialEmailDomain}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, officialEmailDomain: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Website</label>
                          <input
                            type="text"
                            placeholder="e.g. www.northbridge.edu"
                            value={newOrgForm.website}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Initial Status</label>
                          <select
                            value={newOrgForm.status}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Verification Status</label>
                          <select
                            value={newOrgForm.verificationStatus}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                          >
                            <option value="Verified">Verified</option>
                            <option value="Verification Expiring">Verification Expiring</option>
                            <option value="Needs Review">Needs Review</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/20">
                        <Button type="button" onClick={() => setShowCreateOrg(false)} variant="secondary">
                          Cancel
                        </Button>
                        <Button disabled={actionProcessing} type="submit" variant="primary">
                          {actionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Edit Organization Modal */}
              {editingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
                  <Card className="w-full max-w-sm p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-xl dark:shadow-black/35">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">Edit Organization</h3>
                      <button onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveOrg} className="space-y-4 text-xs font-semibold">
                      <p className="bg-slate-50 dark:bg-slate-900/30 p-2 text-slate-800 rounded font-bold">{editingOrg.name}</p>
                      
                      <div>
                        <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Status</label>
                        <select
                          value={orgForm.status}
                          onChange={(e) => setOrgForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">Verification Status</label>
                        <select
                          value={orgForm.verificationStatus}
                          onChange={(e) => setOrgForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                          className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-white dark:bg-[#12131a] outline-none"
                        >
                          <option value="Verified">Verified</option>
                          <option value="Verification Expiring">Verification Expiring</option>
                          <option value="Needs Review">Needs Review</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/20">
                        <Button type="button" onClick={() => setEditingOrg(null)} variant="secondary">
                          Cancel
                        </Button>
                        <Button disabled={actionProcessing} type="submit" variant="primary">
                          {actionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFICATION REQUESTS MANAGEMENT PANEL */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Verification Requests</h1>
                <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold">{filteredRequests.length} Requests Listed</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-[#12131a] p-4 rounded-2xl shadow-sm dark:shadow-black/10 border border-slate-200 dark:border-slate-800/40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, org, cred, ID..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30"
                  />
                </div>
                <div>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Information Requested">Information Requested</option>
                  </select>
                </div>
                <div>
                  <select
                    value={requestTypeFilter}
                    onChange={(e) => setRequestTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="All">All Types</option>
                    <option value="Degree Certificate">Degree Certificate</option>
                    <option value="Academic Transcript">Academic Transcript</option>
                    <option value="Medical License">Medical License</option>
                    <option value="Employment Reference">Employment Reference</option>
                  </select>
                </div>
              </div>

              {/* Requests List Table */}
              <Card className="overflow-x-auto border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#12131a] shadow-sm dark:shadow-black/10">
                {loadingRequests ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 dark:text-blue-400 animate-spin" />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No verification requests found mapping filters.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800/40">
                      <tr>
                        <th className="px-4 py-3">Owner / Request ID</th>
                        <th className="px-4 py-3">Credential Type</th>
                        <th className="px-4 py-3">Assigned Organization</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Submitted Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30/50 bg-white dark:bg-[#12131a]">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-950 dark:text-white">{req.ownerName || 'Unknown Owner'}</p>
                            <p className="text-slate-455 dark:text-slate-500 mt-0.5">{req.ownerEmail || 'No Email'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {req.id}</p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800">{req.credentialType}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {req.organization?.name || req.requestedOrganization || 'No Org Assigned'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[9px] ${
                              req.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' :
                              req.status === 'Rejected' ? 'bg-red-50 text-red-800 ring-1 ring-red-200' :
                              req.status === 'Information Requested' ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-250' :
                              'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 ring-1 ring-blue-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-450 dark:text-slate-500 font-medium">{req.requestDate || 'N/A'}</td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                icon={ExternalLink}
                                onClick={() => window.open(`/verify/${req.id}`, '_blank')}
                                variant="secondary"
                                className="px-2 py-1 h-7 text-[11px]"
                              >
                                View
                              </Button>
                              
                              {req.status === 'Pending' && (
                                <>
                                  <Button
                                    icon={HelpCircle}
                                    onClick={() => handleRequestStatusChange(req.id, 'Information Requested', 'REQUEST_INFORMATION', 'Admin requested details.')}
                                    variant="secondary"
                                    className="px-2 py-1 h-7 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-850"
                                  >
                                    Info
                                  </Button>
                                  <Button
                                    icon={XCircle}
                                    onClick={() => handleRequestStatusChange(req.id, 'Rejected', 'REJECT_REQUEST', 'Admin rejected request.')}
                                    variant="danger"
                                    className="px-2 py-1 h-7 text-[11px]"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {req.status === 'Approved' && (
                                <Button
                                  icon={ShieldAlert}
                                  onClick={() => handleRequestStatusChange(req.id, 'Rejected', 'REVOKE_REQUEST', 'Verification revoked by Super Admin.')}
                                  variant="danger"
                                  className="px-2 py-1 h-7 text-[11px]"
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          )}

          {/* TAB 5: TELEMETRY & LIVE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Telemetry & Analytics</h1>
                <span className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-medium">Live Computations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual statistics progress meters */}
                <Card className="p-5 space-y-4 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10 col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Credential Types distribution</h3>
                  
                  {credentialDistribution.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold py-10 text-center">No credential requests recorded in database.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {credentialDistribution.map((item) => (
                        <div key={item.type} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-800 font-bold">{item.type}</span>
                            <span className="text-slate-500 dark:text-slate-450 dark:text-slate-500">{item.count} Requests ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Top verifying organizations dashboard list */}
                <Card className="p-5 space-y-4 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/20 pb-2">Top verifiers</h3>
                  
                  {topOrganizations.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold py-10 text-center">No organization activities recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {topOrganizations.map((org, index) => (
                        <div key={org.name} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2 truncate">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold text-[10px]">
                              {index + 1}
                            </span>
                            <span className="text-slate-850 dark:text-slate-200 truncate">{org.name}</span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold">{org.count} Verifications</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Throughput and workload metrics ratios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 space-y-3 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Resolution SLA rates</h3>
                  <div className="grid grid-cols-2 gap-4 text-center pt-2">
                    <div className="p-3 bg-emerald-50/50 rounded border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-800">Verification Approvals</p>
                      <p className="text-3xl font-black text-emerald-950 mt-1">{stats.approvedRequests}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Rate: {stats.approvalRate}%</p>
                    </div>
                    <div className="p-3 bg-red-50/50 rounded border border-red-100">
                      <p className="text-xs font-semibold text-red-800">Rejections</p>
                      <p className="text-3xl font-black text-red-950 mt-1">{stats.rejectedRequests}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Rate: {stats.rejectionRate}%</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 space-y-3 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pending workload metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-center pt-2">
                    <div className="p-3 bg-amber-50/50 rounded border border-amber-100">
                      <p className="text-xs font-semibold text-amber-800">Pending Actions</p>
                      <p className="text-3xl font-black text-amber-955 mt-1">{stats.pendingRequests}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Requires Immediate Attention</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20/50 rounded border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Information Pending</p>
                      <p className="text-3xl font-black text-blue-955 mt-1">{stats.infoRequests}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Awaiting User Response</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 6: IMMUTABLE AUDIT TRAILS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Audit Trails & Logs</h1>
                <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold">{filteredAuditLogs.length} Entries Recorded</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-[#12131a] p-4 rounded-2xl shadow-sm dark:shadow-black/10 border border-slate-200 dark:border-slate-800/40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by actor, action, details..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30"
                  />
                </div>
                <div>
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-xs text-slate-950 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 bg-slate-50 dark:bg-slate-900/30 font-semibold"
                  >
                    <option value="All">All Actions</option>
                    <option value="CREATE_USER">CREATE_USER</option>
                    <option value="UPDATE_USER">UPDATE_USER</option>
                    <option value="DELETE_USER">DELETE_USER</option>
                    <option value="CREATE_ORGANIZATION">CREATE_ORGANIZATION</option>
                    <option value="UPDATE_ORGANIZATION">UPDATE_ORGANIZATION</option>
                    <option value="DELETE_ORGANIZATION">DELETE_ORGANIZATION</option>
                    <option value="APPROVE_REQUEST">APPROVE_REQUEST</option>
                    <option value="REJECT_REQUEST">REJECT_REQUEST</option>
                    <option value="REQUEST_INFORMATION">REQUEST_INFORMATION</option>
                    <option value="REVOKE_REQUEST">REVOKE_REQUEST</option>
                    <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
                  </select>
                </div>
              </div>

              {/* Audit Logs List Table */}
              <Card className="overflow-x-auto border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#12131a] shadow-sm dark:shadow-black/10">
                {loadingAuditLogs ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 dark:text-blue-400 animate-spin" />
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No system event audit logs recorded.
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-450 dark:text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800/40">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Actor Email / ID</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Target Reference</th>
                          <th className="px-4 py-3 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
                        {paginatedAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30/50 bg-white dark:bg-[#12131a]">
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-450 dark:text-slate-500 font-mono text-[10px]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{log.actorEmail}</p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">ID: {log.actorId}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-800 font-extrabold text-[9px] tracking-wide uppercase border border-slate-200 dark:border-slate-800/40">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-850 dark:text-slate-200">{log.targetName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">ID: {log.targetId}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-450 dark:text-slate-500 max-w-xs truncate">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/20 pt-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-450 dark:text-slate-500 font-semibold">
                        Page {logPage} of {Math.ceil(filteredAuditLogs.length / 10) || 1} ({filteredAuditLogs.length} entries)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={logPage === 1}
                          onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-[10px] font-bold text-slate-800 border border-slate-200 dark:border-slate-800/40 rounded disabled:opacity-40 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={logPage >= Math.ceil(filteredAuditLogs.length / 10)}
                          onClick={() => setLogPage(prev => Math.min(prev + 1, Math.ceil(filteredAuditLogs.length / 10)))}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-[10px] font-bold text-slate-800 border border-slate-200 dark:border-slate-800/40 rounded disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 7: GLOBAL PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Platform Config Settings</h1>
                <span className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-medium">Global Properties</span>
              </div>

              <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10 max-w-xl">
                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-semibold">
                  
                  {/* Maintenance mode switch toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200/60 dark:border-slate-800/40">
                    <div>
                      <p className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-slate-550" />
                        Platform Maintenance Mode
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                        Locks the site down showing a maintenance banner for non-admin profiles.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={platformSettings.maintenanceMode}
                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#12131a] after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Self registration switch toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200/60 dark:border-slate-800/40">
                    <div>
                      <p className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-1.5">
                        <UsersIcon className="h-4 w-4 text-slate-550" />
                        Allow Self-Registration
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                        Enables new visitors to sign up and establish user profile documents.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={platformSettings.allowSelfRegistration}
                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, allowSelfRegistration: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#12131a] after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Maximum Upload Size parameter */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200/60 dark:border-slate-800/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                        Maximum Document Upload Size
                      </p>
                      <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        {platformSettings.maxUploadSizeMb} MB
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 leading-relaxed">
                      Defines the size boundaries for users uploading verification credential files.
                    </p>
                    <input 
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={platformSettings.maxUploadSizeMb}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, maxUploadSizeMb: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-2xl appearance-none cursor-pointer focus:outline-none mt-2"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/20">
                    <Button 
                      type="button" 
                      onClick={handleResetSettings} 
                      variant="secondary"
                      icon={RotateCcw}
                    >
                      Reset Defaults
                    </Button>
                    <Button 
                      disabled={actionProcessing} 
                      type="submit" 
                      variant="primary"
                      icon={Save}
                    >
                      {actionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
          {/* TAB 8: CREDENTIAL CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-205 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Credential Catalog</h1>
                <span className="text-xs text-slate-500 font-medium">Global Checklists</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {organizations.map(org => {
                  const services = (verificationServices || []).filter(s => s.organizationId === org.id);
                  if (services.length === 0) return null;
                  return (
                    <Card key={org.id} className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">{org.name}</h3>
                      <div className="space-y-3">
                        {services.map(s => {
                          const template = (credentialTemplates || []).find(t => t.serviceId === s.id);
                          const reqs = [
                            ...(template?.requiredCredentials || []).map(c => ({ ...c, required: true })),
                            ...(template?.optionalCredentials || []).map(c => ({ ...c, required: false }))
                          ];
                          return (
                            <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl space-y-1 text-xs font-semibold">
                              <h4 className="font-extrabold text-slate-900 dark:text-white">{s.name}</h4>
                              <div className="space-y-1 pl-2 text-[10px] text-slate-500 dark:text-slate-400">
                                {reqs.length > 0 ? reqs.map((r, i) => (
                                  <div key={i}>
                                    • {r.type} <span className="text-[9px] uppercase font-bold">({r.required ? 'Required' : 'Optional'})</span>
                                  </div>
                                )) : <span className="italic text-slate-400">No template items configured</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: OVERRIDES PANEL */}
          {activeTab === 'overrides' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Administrative Overrides</h1>
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Supreme Authority Control</span>
              </div>
              <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-500 font-semibold">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Organization</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Documents</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {requests.length > 0 ? (
                        requests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                            <td className="px-4 py-3 font-bold text-slate-950 dark:text-white">{req.ownerEmail}</td>
                            <td className="px-4 py-3">{req.organizationName || req.requestedOrganization}</td>
                            <td className="px-4 py-3">{req.serviceName || req.credentialType}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-700' : req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-700' : 'bg-blue-500/10 text-blue-700'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {req.documentReferences && req.documentReferences.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {req.documentReferences.map((docRef, dIdx) => (
                                    <button
                                      key={dIdx}
                                      onClick={() => setSelectedViewerDoc(docRef)}
                                      className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded text-[9px] hover:underline cursor-pointer font-bold"
                                    >
                                      {docRef.type}
                                    </button>
                                  ))}
                                </div>
                              ) : <span className="text-slate-400 italic">No files</span>}
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={async () => {
                                  const reason = prompt('Specify override reason:');
                                  if (reason) {
                                    await transitionRequestStatus(req.id, 'Approved', 'ADMIN_OVERRIDE_APPROVE', `Admin Override: Approved (Reason: "${reason}")`, currentUser?.email || 'admin@localhost', currentUser?.uid || 'admin-uid');
                                    alert('Request overridden to Approved.');
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-extrabold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt('Specify override reason:');
                                  if (reason) {
                                    await transitionRequestStatus(req.id, 'Rejected', 'ADMIN_OVERRIDE_REJECT', `Admin Override: Rejected (Reason: "${reason}")`, currentUser?.email || 'admin@localhost', currentUser?.uid || 'admin-uid');
                                    alert('Request overridden to Rejected.');
                                  }
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-750 text-white rounded text-[10px] font-extrabold cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt('Specify reopen reason:');
                                  if (reason) {
                                    await transitionRequestStatus(req.id, 'Pending', 'ADMIN_OVERRIDE_REOPEN', `Admin Override: Reopened (Reason: "${reason}")`, currentUser?.email || 'admin@localhost', currentUser?.uid || 'admin-uid');
                                    alert('Request reopened.');
                                  }
                                }}
                                className="px-2 py-1 bg-slate-105 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold cursor-pointer"
                              >
                                Reopen
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-slate-450 font-bold">No request logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </main>
      </div>
      {selectedViewerDoc && (
        <UniversalDocumentViewer
          document={selectedViewerDoc}
          onClose={() => setSelectedViewerDoc(null)}
        />
      )}
    </div>
  );
}

