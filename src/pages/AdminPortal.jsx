import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from '../firebase/firebase.js';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
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
  ShieldAlert as ShieldXIcon
} from 'lucide-react';

export default function AdminPortal() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  // Active workspace tab
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | organizations | requests | analytics | logs | settings
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Firestore collections states
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(true);

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    allowSelfRegistration: true,
    maxUploadSizeMb: 20
  });

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

  // Load registered users stream
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setUsers(list);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Users list load permission error:", error);
      setLoadingUsers(false);
    });
    return () => unsub();
  }, []);

  // Load organizations stream
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'organizations'), (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setOrganizations(list);
      setLoadingOrgs(false);
    }, (error) => {
      console.error("Organizations list load permission error:", error);
      setLoadingOrgs(false);
    });
    return () => unsub();
  }, []);

  // Load requests stream
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'verificationRequests'), (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setRequests(list);
      setLoadingRequests(false);
    }, (error) => {
      console.error("Requests list load permission error:", error);
      setLoadingRequests(false);
    });
    return () => unsub();
  }, []);

  // Load audit logs stream
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setAuditLogs(list);
      setLoadingAuditLogs(false);
    }, (error) => {
      console.error("Audit logs load permission error:", error);
      setLoadingAuditLogs(false);
    });
    return () => unsub();
  }, []);

  // Load Platform Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        setPlatformSettings(docSnap.data());
      } else {
        // Seed default settings doc if missing
        setDoc(doc(db, 'settings', 'platform'), {
          maintenanceMode: false,
          allowSelfRegistration: true,
          maxUploadSizeMb: 20
        });
      }
    }, (error) => {
      console.error("Platform settings load permission error:", error);
    });
    return () => unsub();
  }, []);

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
      try {
        const assignUserFn = httpsCallable(functions, 'assignOrganizationUser');
        await assignUserFn({
          targetUserId: editingUser.id,
          targetUserEmail: editingUser.email,
          role: userForm.role,
          status: userForm.status,
          organizationId: userForm.organizationId,
          organizationName: userForm.organizationName,
          organizationRole: userForm.organizationRole
        });
      } catch (fnErr) {
        console.warn("Cloud Function assignOrganizationUser failed, using client-side fallback:", fnErr);
        const userRef = doc(db, 'users', editingUser.id);
        const isOrg = userForm.role === 'organization';
        await updateDoc(userRef, {
          role: userForm.role,
          status: userForm.status,
          organizationId: isOrg ? userForm.organizationId || null : null,
          organizationName: isOrg ? userForm.organizationName || null : null,
          organizationRole: isOrg ? userForm.organizationRole || null : null,
        });
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_USER',
          actorId: currentUser.uid,
          actorEmail: currentUser.email,
          targetId: editingUser.id,
          targetName: editingUser.email,
          details: `Updated user role to ${userForm.role}, status to ${userForm.status}${isOrg ? ` (Org: ${userForm.organizationName}, Role: ${userForm.organizationRole})` : ''} (Fallback)`,
          timestamp: new Date().toISOString()
        });
      }

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
          await deleteDoc(doc(db, 'users', userId));
          
          // Log audit
          const logRef = doc(collection(db, 'auditLogs'));
          await setDoc(logRef, {
            action: 'DELETE_USER',
            actorId: currentUser.uid,
            actorEmail: currentUser.email,
            targetId: userId,
            targetName: userEmail,
            details: `Deleted user account ${userEmail}`,
            timestamp: new Date().toISOString()
          });

          triggerNotification('success', `User ${userEmail} deleted successfully.`);
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
      let createdName = newOrgForm.name.trim();
      try {
        const createOrgFn = httpsCallable(functions, 'createOrganization');
        const res = await createOrgFn({
          name: newOrgForm.name.trim(),
          type: newOrgForm.type,
          officialEmailDomain: newOrgForm.officialEmailDomain.trim(),
          website: newOrgForm.website.trim(),
          status: newOrgForm.status,
          verificationStatus: newOrgForm.verificationStatus,
        });
        createdName = res.data.name;
      } catch (fnErr) {
        console.warn("Cloud Function createOrganization failed, using client-side fallback:", fnErr);
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

        await setDoc(doc(db, 'organizations', generatedId), newOrg);

        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'CREATE_ORGANIZATION',
          actorId: currentUser.uid,
          actorEmail: currentUser.email,
          targetId: generatedId,
          targetName: newOrg.name,
          details: `Created organization "${newOrg.name}" with ID ${generatedId} (Fallback)`,
          timestamp: new Date().toISOString()
        });
      }

      triggerNotification('success', `Organization "${createdName}" created successfully.`);
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
      try {
        const updateOrgFn = httpsCallable(functions, 'updateOrganization');
        await updateOrgFn({
          organizationId: editingOrg.id,
          status: orgForm.status,
          verificationStatus: orgForm.verificationStatus,
        });
      } catch (fnErr) {
        console.warn("Cloud Function updateOrganization failed, using client-side fallback:", fnErr);
        await updateDoc(doc(db, 'organizations', editingOrg.id), {
          status: orgForm.status,
          verificationStatus: orgForm.verificationStatus,
        });
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_ORGANIZATION',
          actorId: currentUser.uid,
          actorEmail: currentUser.email,
          targetId: editingOrg.id,
          targetName: editingOrg.name,
          details: `Updated organization "${editingOrg.name}" status to ${orgForm.status}, verification to ${orgForm.verificationStatus} (Fallback)`,
          timestamp: new Date().toISOString()
        });
      }

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
          try {
            const deleteOrgFn = httpsCallable(functions, 'deleteOrganization');
            await deleteOrgFn({ organizationId: orgId, name: orgName });
          } catch (fnErr) {
            console.warn("Cloud Function deleteOrganization failed, using client-side fallback:", fnErr);
            await deleteDoc(doc(db, 'organizations', orgId));

            const logRef = doc(collection(db, 'auditLogs'));
            await setDoc(logRef, {
              action: 'DELETE_ORGANIZATION',
              actorId: currentUser.uid,
              actorEmail: currentUser.email,
              targetId: orgId,
              targetName: orgName,
              details: `Deleted organization "${orgName}" (Fallback)`,
              timestamp: new Date().toISOString()
            });
          }

          triggerNotification('success', `Organization "${orgName}" deleted successfully.`);
        } catch (err) {
          console.error(err);
          triggerNotification('error', err.message || 'Failed to delete organization.');
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
      try {
        const updateOrgFn = httpsCallable(functions, 'updateOrganization');
        await updateOrgFn({
          organizationId: orgId,
          status: newStatus,
          verificationStatus: newVerification
        });
      } catch (fnErr) {
        console.warn("Cloud Function updateOrganization failed, using client-side fallback:", fnErr);
        const updates = {};
        if (newStatus) updates.status = newStatus;
        if (newVerification) updates.verificationStatus = newVerification;

        await updateDoc(doc(db, 'organizations', orgId), updates);

        const targetOrg = organizations.find(o => o.id === orgId);
        const targetOrgName = targetOrg ? targetOrg.name : 'Organization';

        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_ORGANIZATION',
          actorId: currentUser.uid,
          actorEmail: currentUser.email,
          targetId: orgId,
          targetName: targetOrgName,
          details: `Direct status toggle: status=${newStatus || 'N/A'}, verificationStatus=${newVerification || 'N/A'} (Fallback)`,
          timestamp: new Date().toISOString()
        });
      }

      triggerNotification('success', `Organization status updated.`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Update failed: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Update verification request status directly from admin dashboard
  const handleRequestStatusChange = (reqId, newStatus, actionName, timelineMsg) => {
    setConfirmAction({
      title: `${actionName.replace('_', ' ')}`,
      message: `Are you sure you want to transition the status of request ${reqId} to ${newStatus}?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          const timelineEntry = {
            status: newStatus,
            title: timelineMsg,
            timestamp: new Date().toISOString(),
            details: `Updated by Super Admin ${currentUser.email}`
          };

          try {
            if (actionName === 'REVOKE_REQUEST') {
              const revokeFn = httpsCallable(functions, 'revokeCredential');
              await revokeFn({ requestId: reqId, timelineEntry });
            } else if (newStatus === 'Rejected') {
              const rejectFn = httpsCallable(functions, 'rejectVerification');
              await rejectFn({ requestId: reqId, timelineEntry });
            } else if (newStatus === 'Information Requested') {
              const reqInfoFn = httpsCallable(functions, 'requestInformation');
              await reqInfoFn({ requestId: reqId, timelineEntry });
            }
          } catch (fnErr) {
            console.warn("Cloud Function request status transition failed, using client-side fallback:", fnErr);
            const reqDocRef = doc(db, 'verificationRequests', reqId);
            await updateDoc(reqDocRef, {
              status: newStatus,
              timeline: arrayUnion(timelineEntry)
            });

            const reqSnap = await getDoc(reqDocRef);
            const reqData = reqSnap.exists() ? reqSnap.data() : {};

            const logRef = doc(collection(db, 'auditLogs'));
            await setDoc(logRef, {
              action: actionName,
              actorId: currentUser.uid,
              actorEmail: currentUser.email,
              targetId: reqId,
              targetName: reqData.ownerName || 'Verification Request',
              details: `${timelineMsg} (Request ID: ${reqId}) (Fallback)`,
              timestamp: new Date().toISOString()
            });
          }

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
      try {
        const saveSettingsFn = httpsCallable(functions, 'updatePlatformSettings');
        await saveSettingsFn(platformSettings);
      } catch (fnErr) {
        console.warn("Cloud Function updatePlatformSettings failed, using client-side fallback:", fnErr);
        await setDoc(doc(db, 'settings', 'platform'), platformSettings);

        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_SETTINGS',
          actorId: currentUser.uid,
          actorEmail: currentUser.email,
          targetId: 'settings/platform',
          targetName: 'Platform Settings',
          details: `Updated settings: Maintenance Mode = ${platformSettings.maintenanceMode}, Max Upload Size = ${platformSettings.maxUploadSizeMb}MB (Fallback)`,
          timestamp: new Date().toISOString()
        });
      }

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
          try {
            const saveSettingsFn = httpsCallable(functions, 'updatePlatformSettings');
            await saveSettingsFn(defaults);
          } catch (fnErr) {
            console.warn("Cloud Function updatePlatformSettings failed, using client-side fallback:", fnErr);
            await setDoc(doc(db, 'settings', 'platform'), defaults);

            const logRef = doc(collection(db, 'auditLogs'));
            await setDoc(logRef, {
              action: 'UPDATE_SETTINGS',
              actorId: currentUser.uid,
              actorEmail: currentUser.email,
              targetId: 'settings/platform',
              targetName: 'Platform Settings',
              details: `Reset platform settings to defaults (Fallback)`,
              timestamp: new Date().toISOString()
            });
          }

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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Banner Alert System */}
      {notification && (
        <div className={`fixed top-4 right-4 z-55 px-4 py-3 rounded-md shadow-lg border text-sm font-semibold flex items-center gap-2 transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-red-50 text-red-800 border-red-250'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Warning Alert Modal */}
      {warningMessage && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/65 px-4">
          <Card className="max-w-md w-full p-6 text-center space-y-4 bg-white border border-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Action Blocked</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{warningMessage}</p>
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
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/65 px-4">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <h3 className="text-lg font-bold text-slate-950">{confirmAction.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{confirmAction.message}</p>
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
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1 text-slate-300 hover:text-white shrink-0 cursor-pointer"
          >
            <Activity className="h-5 w-5" />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-md font-black tracking-wider uppercase">VeriFlash Super Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-slate-100">{currentUser?.displayName || 'Super Admin'}</p>
            <p className="text-[10px] text-slate-400 font-semibold">{currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-md text-xs transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Dashboard Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Nav */}
        <aside className={`bg-slate-900 border-t border-slate-800 text-slate-300 w-64 shrink-0 flex flex-col justify-between py-4 transition-all duration-300 fixed md:static inset-y-16 left-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <nav className="space-y-1 px-3">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'requests', label: 'Requests', icon: FileCheck2 },
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-md transition cursor-pointer ${
                    isActive ? 'bg-blue-700 text-white' : 'hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-6 py-2 text-[10px] text-slate-500 font-semibold border-t border-slate-800 mt-auto space-y-2">
            {import.meta.env.DEV && localStorage.getItem('dev_user') && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-center space-y-0.5">
                <p className="font-extrabold text-amber-500 uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>🛠</span> Dev Mode
                </p>
                <p className="font-bold text-slate-350">
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Overview Summary</h1>
                <span className="text-xs text-slate-500 font-medium">Real-time Telemetry Data</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-center justify-between bg-white border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalUsers}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeUsers} | Suspended: {stats.suspendedUsers}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organizations</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrgs}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeOrgs} | Pending: {stats.pendingOrgs}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Requests</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalRequests}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Approved: {stats.approvedRequests} | Pending: {stats.pendingRequests}</p>
                  </div>
                  <FileCheck2 className="h-8 w-8 text-emerald-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval / Rejection Rate</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.approvalRate}% / {stats.rejectionRate}%</p>
                    <p className="text-[10px] text-slate-450 font-semibold mt-1">Info Req: {stats.infoRequests}</p>
                  </div>
                  <Activity className="h-8 w-8 text-amber-500" />
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Secondary breakdown stats */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Database Status Distribution</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 space-y-2 border-l-4 border-emerald-500 bg-white">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">User Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600">Active</span>
                        <span className="text-emerald-700">{stats.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Suspended</span>
                        <span className="text-red-700">{stats.suspendedUsers}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Pending</span>
                        <span className="text-amber-700">{stats.pendingUsers}</span>
                      </div>
                    </Card>
                    <Card className="p-4 space-y-2 border-l-4 border-indigo-500 bg-white">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">Organizations Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600">Active</span>
                        <span className="text-indigo-755">{stats.activeOrgs}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Suspended</span>
                        <span className="text-red-700">{stats.suspendedOrgs}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Pending</span>
                        <span className="text-amber-700">{stats.pendingOrgs}</span>
                      </div>
                    </Card>
                    <Card className="p-4 space-y-2 border-l-4 border-blue-500 bg-white">
                      <p className="text-xs text-slate-505 font-extrabold uppercase">Requests Health</p>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-600">Approved</span>
                        <span className="text-emerald-700">{stats.approvedRequests}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Rejected</span>
                        <span className="text-red-700">{stats.rejectedRequests}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">Pending / Info</span>
                        <span className="text-amber-700">{stats.pendingRequests + stats.infoRequests}</span>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Recent Sign-ins list */}
                <Card className="p-4 space-y-3 bg-white border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-150 pb-2">Recent Sign-ins</h3>
                  <div className="divide-y divide-slate-100 space-y-2 max-h-60 overflow-y-auto pr-1">
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
                            <p className="text-slate-850 font-bold truncate">{u.name}</p>
                            <p className="text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded font-mono">
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">User Directory</h1>
                <p className="text-xs text-slate-500 font-semibold">{filteredUsers.length} Users Listed</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, UID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-250 text-xs text-slate-950 outline-none focus:ring-2 focus:ring-blue-700 bg-slate-50"
                  />
                </div>
                <div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-950 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
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
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-950 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
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
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-950 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
                  >
                    <option value="newest">Sort: Newest Registered</option>
                    <option value="oldest">Sort: Oldest Registered</option>
                    <option value="lastLogin">Sort: Recent Sign-in</option>
                  </select>
                </div>
              </div>

              {/* Users List Table */}
              <Card className="overflow-x-auto border border-slate-200 bg-white">
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 font-semibold">
                    No users match search filters criteria.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Name / Email</th>
                        <th className="px-4 py-3">Platform Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Organization Mapping</th>
                        <th className="px-4 py-3">Created At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredUsers.map((user) => {
                        const isSelf = user.id === currentUser?.uid;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/50 bg-white">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-950 flex items-center gap-1">
                                {user.name}
                                {isSelf && <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1 rounded">You</span>}
                              </p>
                              <p className="text-slate-455 mt-0.5">{user.email}</p>
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
                                  <p className="text-slate-900 font-semibold">{user.organizationName || 'No Org Assigned'}</p>
                                  {user.organizationRole && (
                                    <p className="text-[10px] text-slate-450 mt-0.5">Role: {user.organizationRole}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-slate-500">
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
                  <Card className="w-full max-w-lg p-6 bg-white border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950">Edit User Role & Mappings</h3>
                      <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-semibold">
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-800">{editingUser.name}</p>
                          <p className="text-slate-455 mt-0.5">{editingUser.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Platform Role</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full rounded border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-700 bg-white outline-none"
                          >
                            <option value="student">User</option>
                            <option value="organization">Organization</option>
                            <option value="employer">Employer</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Account Status</label>
                          <select
                            value={userForm.status}
                            onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-700 bg-white outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      {/* Organization mapping selection dropdown */}
                      {userForm.role === 'organization' && (
                        <div className="border-t border-slate-100 pt-3 space-y-3">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Organization Mappings</p>
                          
                          <div className="relative">
                            <label className="block text-slate-500 font-bold uppercase mb-1">Search Organization</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                              <input
                                type="text"
                                placeholder="Search by name..."
                                value={orgSearchQuery}
                                onChange={(e) => {
                                  setOrgSearchQuery(e.target.value);
                                  setOrgDropdownOpen(true);
                                }}
                                onFocus={() => setOrgDropdownOpen(true)}
                                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded focus:border-blue-700 bg-slate-50"
                              />
                            </div>

                            {/* Dropdown elements list */}
                            {orgDropdownOpen && (
                              <div className="absolute left-0 right-0 z-30 max-h-40 overflow-y-auto mt-1 bg-white border border-slate-200 rounded shadow-lg divide-y divide-slate-100">
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
                                      className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-[11px]"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-800">{org.name}</p>
                                        <p className="text-[9px] text-slate-400">{org.type} — {org.status}</p>
                                      </div>
                                      <span className="text-[8px] bg-emerald-50 text-emerald-850 px-1 rounded">Verified</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-slate-505 text-center py-4 bg-slate-50">
                                    No Active/Verified organizations match query.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {userForm.organizationId && (
                            <div className="text-[10px] bg-blue-50 text-blue-800 p-2 rounded flex items-center justify-between">
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
                            <label className="block text-slate-500 font-bold uppercase mb-1">Organization Role Mapping</label>
                            <select
                              value={userForm.organizationRole}
                              onChange={(e) => setUserForm(prev => ({ ...prev, organizationRole: e.target.value }))}
                              className="w-full rounded border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-700 bg-white outline-none"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Verifier">Verifier</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Organizations</h1>
                <Button icon={Plus} onClick={() => setShowCreateOrg(true)} variant="primary">
                  Create Organization
                </Button>
              </div>

              {/* Organizations Table */}
              <Card className="overflow-x-auto border border-slate-200 bg-white">
                {loadingOrgs ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No active organizations in Firestore.
                  </div>
                ) : (
                  <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Name / Website</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Verification Status</th>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {organizations.map((org) => (
                        <tr key={org.id} className="hover:bg-slate-50/50 bg-white">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-950">{org.name}</p>
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
                          <td className="px-4 py-3.5 font-semibold text-slate-700">{org.type}</td>
                          <td className="px-4 py-3.5">
                            <select
                              value={org.status}
                              onChange={(e) => handleUpdateOrgStatus(org.id, e.target.value, null)}
                              className="bg-slate-50 rounded border border-slate-205 py-0.5 px-1 font-semibold text-[10px]"
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
                              className="bg-slate-50 rounded border border-slate-205 py-0.5 px-1 font-semibold text-[10px]"
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
                  <Card className="w-full max-w-lg p-6 bg-white border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950">Create New Organization</h3>
                      <button onClick={() => setShowCreateOrg(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Organization Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Northbridge University"
                            value={newOrgForm.name}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Type</label>
                          <select
                            value={newOrgForm.type}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 bg-white outline-none"
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
                          <label className="block text-slate-500 font-bold uppercase mb-1">Official Email Domain</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. northbridge.edu"
                            value={newOrgForm.officialEmailDomain}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, officialEmailDomain: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Website</label>
                          <input
                            type="text"
                            placeholder="e.g. www.northbridge.edu"
                            value={newOrgForm.website}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Initial Status</label>
                          <select
                            value={newOrgForm.status}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 bg-white outline-none"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase mb-1">Verification Status</label>
                          <select
                            value={newOrgForm.verificationStatus}
                            onChange={(e) => setNewOrgForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                            className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 bg-white outline-none"
                          >
                            <option value="Verified">Verified</option>
                            <option value="Verification Expiring">Verification Expiring</option>
                            <option value="Needs Review">Needs Review</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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
                  <Card className="w-full max-w-sm p-6 bg-white border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-950">Edit Organization</h3>
                      <button onClick={() => setEditingOrg(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveOrg} className="space-y-4 text-xs font-semibold">
                      <p className="bg-slate-50 p-2 text-slate-800 rounded font-bold">{editingOrg.name}</p>
                      
                      <div>
                        <label className="block text-slate-500 font-bold uppercase mb-1">Status</label>
                        <select
                          value={orgForm.status}
                          onChange={(e) => setOrgForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 bg-white outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold uppercase mb-1">Verification Status</label>
                        <select
                          value={orgForm.verificationStatus}
                          onChange={(e) => setOrgForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                          className="w-full rounded border border-slate-205 px-3 py-2 text-slate-905 focus:border-blue-700 bg-white outline-none"
                        >
                          <option value="Verified">Verified</option>
                          <option value="Verification Expiring">Verification Expiring</option>
                          <option value="Needs Review">Needs Review</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Verification Requests</h1>
                <p className="text-xs text-slate-500 font-semibold">{filteredRequests.length} Requests Listed</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, org, cred, ID..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-xs text-slate-955 outline-none focus:ring-2 focus:ring-blue-700 bg-slate-50"
                  />
                </div>
                <div>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-955 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
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
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-955 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
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
              <Card className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
                {loadingRequests ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No verification requests found mapping filters.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Owner / Request ID</th>
                        <th className="px-4 py-3">Credential Type</th>
                        <th className="px-4 py-3">Assigned Organization</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Submitted Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 bg-white">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-950">{req.ownerName || 'Unknown Owner'}</p>
                            <p className="text-slate-455 mt-0.5">{req.ownerEmail || 'No Email'}</p>
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
                              'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 font-medium">{req.requestDate || 'N/A'}</td>
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Telemetry & Analytics</h1>
                <span className="text-xs text-slate-500 font-medium">Live Computations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual statistics progress meters */}
                <Card className="p-5 space-y-4 bg-white border border-slate-200 shadow-sm col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Credential Types distribution</h3>
                  
                  {credentialDistribution.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold py-10 text-center">No credential requests recorded in database.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {credentialDistribution.map((item) => (
                        <div key={item.type} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-800 font-bold">{item.type}</span>
                            <span className="text-slate-500">{item.count} Requests ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
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
                <Card className="p-5 space-y-4 bg-white border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Top verifiers</h3>
                  
                  {topOrganizations.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold py-10 text-center">No organization activities recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {topOrganizations.map((org, index) => (
                        <div key={org.name} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2 truncate">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                              {index + 1}
                            </span>
                            <span className="text-slate-850 truncate">{org.name}</span>
                          </div>
                          <span className="text-slate-500 font-bold">{org.count} Verifications</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Throughput and workload metrics ratios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 space-y-3 bg-white border border-slate-200">
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

                <Card className="p-5 space-y-3 bg-white border border-slate-200">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pending workload metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-center pt-2">
                    <div className="p-3 bg-amber-50/50 rounded border border-amber-100">
                      <p className="text-xs font-semibold text-amber-800">Pending Actions</p>
                      <p className="text-3xl font-black text-amber-955 mt-1">{stats.pendingRequests}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Requires Immediate Attention</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800">Information Pending</p>
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Audit Trails & Logs</h1>
                <p className="text-xs text-slate-500 font-semibold">{filteredAuditLogs.length} Entries Recorded</p>
              </div>

              {/* Filters Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by actor, action, details..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-xs text-slate-950 outline-none focus:ring-2 focus:ring-blue-700 bg-slate-50"
                  />
                </div>
                <div>
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-955 outline-none focus:border-blue-700 bg-slate-50 font-semibold"
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
              <Card className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
                {loadingAuditLogs ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="p-10 text-center text-slate-505 font-bold">
                    No system event audit logs recorded.
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Actor Email / ID</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Target Reference</th>
                          <th className="px-4 py-3 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {paginatedAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 bg-white">
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-900">{log.actorEmail}</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">ID: {log.actorId}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-extrabold text-[9px] tracking-wide uppercase border border-slate-200">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-850">{log.targetName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">ID: {log.targetId}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Page {logPage} of {Math.ceil(filteredAuditLogs.length / 10) || 1} ({filteredAuditLogs.length} entries)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={logPage === 1}
                          onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-800 border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={logPage >= Math.ceil(filteredAuditLogs.length / 10)}
                          onClick={() => setLogPage(prev => Math.min(prev + 1, Math.ceil(filteredAuditLogs.length / 10)))}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-800 border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
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
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold text-slate-950">Platform Config Settings</h1>
                <span className="text-xs text-slate-500 font-medium">Global Properties</span>
              </div>

              <Card className="p-6 bg-white border border-slate-200 shadow-sm max-w-xl">
                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-semibold">
                  
                  {/* Maintenance mode switch toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded border border-slate-150">
                    <div>
                      <p className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-slate-550" />
                        Platform Maintenance Mode
                      </p>
                      <p className="text-[10px] text-slate-450 mt-0.5">
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
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Self registration switch toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded border border-slate-150">
                    <div>
                      <p className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                        <UsersIcon className="h-4 w-4 text-slate-550" />
                        Allow Self-Registration
                      </p>
                      <p className="text-[10px] text-slate-450 mt-0.5">
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
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Maximum Upload Size parameter */}
                  <div className="p-4 bg-slate-50 rounded border border-slate-150 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-900 font-extrabold text-sm">
                        Maximum Document Upload Size
                      </p>
                      <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {platformSettings.maxUploadSizeMb} MB
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-455 leading-relaxed">
                      Defines the size boundaries for users uploading verification credential files.
                    </p>
                    <input 
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={platformSettings.maxUploadSizeMb}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, maxUploadSizeMb: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none mt-2"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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

        </main>
      </div>
    </div>
  );
}

