import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { db, doc, collection, addDoc, setDoc, updateDoc, arrayUnion } from '../firebase/firebase.js';
import { globalCredentialCatalog } from '../context/initialState.js';
import { useDocumentActions } from '../hooks/useDocumentActions.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import UniversalDocumentViewer from '../components/dashboard/UniversalDocumentViewer.jsx';
import AICopilot from '../components/ui/AICopilot.jsx';
import AIPreferences from '../components/ui/AIPreferences.jsx';
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
  Clock,
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


  const [localPlatformSettings, setLocalPlatformSettings] = useState({
    maintenanceMode: false,
    allowSelfRegistration: true,
    maxUploadSizeMb: 20
  });

  useEffect(() => {
    if (platformSettings) {
      setLocalPlatformSettings(platformSettings);
    }
  }, [platformSettings]);

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
  // Selection states
  const [selectedUserIds, setSelectedUserIds] = useState({});
  const [selectedOrgIds, setSelectedOrgIds] = useState({});
  const [userPage, setUserPage] = useState(1);
  const [showBulkNotifyModal, setShowBulkNotifyModal] = useState(false);
  const [bulkNotifyForm, setBulkNotifyForm] = useState({ title: '', message: '' });

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userStatusFilter, userRoleFilter, userSortField]);

  // Verification Requests Filters/Search States
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [requestTypeFilter, setRequestTypeFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newNote, setNewNote] = useState('');


  // Escape key drawer closure handler
  useEffect(() => {
    const handleEscapeClose = (e) => {
      if (e.key === 'Escape') {
        setSelectedRequest(null);
      }
    };
    if (selectedRequest) {
      window.addEventListener('keydown', handleEscapeClose);
    }
    return () => window.removeEventListener('keydown', handleEscapeClose);
  }, [selectedRequest]);

  // Audit Logs Search/Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('All');
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logActionFilter]);

  useEffect(() => {
    const handleBulkTrigger = (event) => {
      const { action } = event.detail || {};
      if (action === 'delete-dev') {
        const devUsers = users.filter(u => 
          u.email && 
          (u.email.endsWith('@test.localhost') || u.email.endsWith('@dev.com') || u.email.includes('dev') || u.email.includes('test')) &&
          u.id !== currentUser?.uid
        );

        if (devUsers.length === 0) {
          triggerNotification('info', 'No development accounts found in database.');
          return;
        }

        const newSelected = {};
        devUsers.forEach(u => {
          newSelected[u.id] = true;
        });
        setSelectedUserIds(newSelected);

        const ids = devUsers.map(u => u.id);
        setConfirmAction({
          title: 'Bulk Delete Development Accounts',
          message: `Are you sure you want to permanently delete these ${ids.length} development account(s)? This action cannot be undone.`,
          onConfirm: async () => {
            setActionProcessing(true);
            try {
              await Promise.all(ids.map(id => deleteUser(id, currentUser.email, currentUser.uid)));
              triggerNotification('success', `Successfully deleted ${ids.length} development accounts.`);
              setSelectedUserIds({});
            } catch (e) {
              triggerNotification('error', 'Delete failed: ' + e.message);
            } finally {
              setActionProcessing(false);
              setConfirmAction(null);
            }
          }
        });
      } else if (action === 'cancel') {
        setSelectedUserIds({});
        setConfirmAction(null);
        triggerNotification('info', 'Bulk action cancelled.');
      }
    };

    window.addEventListener('unicrypt-admin-bulk-trigger', handleBulkTrigger);
    return () => window.removeEventListener('unicrypt-admin-bulk-trigger', handleBulkTrigger);
  }, [users, currentUser, deleteUser]);



  // Show status banner notification helper
  const triggerNotification = (type, message, onUndo = null) => {
    setNotification({ type, message, onUndo });
    setTimeout(() => setNotification(null), 6000);
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
        message: `This user (${editingUser.email}) will lose all access to UniCrypt. Proceed?`,
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

  const handleSelectOption = (option) => {
    const nextSelection = { ...selectedUserIds };
    
    if (option === 'page') {
      paginatedUsers.forEach(u => {
        if (u.id !== currentUser?.uid) {
          nextSelection[u.id] = true;
        }
      });
    } else if (option === 'filtered') {
      filteredUsers.forEach(u => {
        if (u.id !== currentUser?.uid) {
          nextSelection[u.id] = true;
        }
      });
    } else if (option === 'all') {
      users.forEach(u => {
        if (u.id !== currentUser?.uid) {
          nextSelection[u.id] = true;
        }
      });
    } else if (option === 'invert') {
      paginatedUsers.forEach(u => {
        if (u.id !== currentUser?.uid) {
          if (nextSelection[u.id]) {
            delete nextSelection[u.id];
          } else {
            nextSelection[u.id] = true;
          }
        }
      });
    } else if (option === 'clear') {
      users.forEach(u => {
        delete nextSelection[u.id];
      });
    }
    
    setSelectedUserIds(nextSelection);
  };

  const handleBulkActivateUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Activate Users',
      message: `Are you sure you want to activate the ${ids.length} selected user account(s)?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => updateUserRoleStatus(id, { status: 'active' }, currentUser.email, currentUser.uid)));
          triggerNotification('success', `Activated ${ids.length} user accounts successfully.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk activate users: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkSuspendUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    const originalStatuses = {};
    ids.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user) {
        originalStatuses[id] = user.status || 'Active';
      }
    });

    setConfirmAction({
      title: 'Bulk Suspend Users',
      message: `Are you sure you want to suspend the ${ids.length} selected user account(s)? They will lose all access to UniCrypt immediately.`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => updateUserRoleStatus(id, { status: 'suspended' }, currentUser.email, currentUser.uid)));
          
          const undoCallback = async () => {
            try {
              await Promise.all(ids.map(id => updateUserRoleStatus(id, { status: originalStatuses[id] || 'Active' }, currentUser.email, currentUser.uid)));
              triggerNotification('success', 'Suspensions reverted successfully.');
            } catch (err) {
              console.error(err);
              triggerNotification('error', 'Failed to undo suspensions: ' + err.message);
            }
          };

          triggerNotification('success', `Suspended ${ids.length} user accounts successfully.`, undoCallback);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk suspend users: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkVerifyUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Verify Users',
      message: `Are you sure you want to verify the ${ids.length} selected user account(s)?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => updateUserRoleStatus(id, { verificationStatus: 'Verified' }, currentUser.email, currentUser.uid)));
          triggerNotification('success', `Verified ${ids.length} user accounts successfully.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk verify users: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkUnverifyUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Unverify Users',
      message: `Are you sure you want to set the ${ids.length} selected user account(s) status to Unverified?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => updateUserRoleStatus(id, { verificationStatus: 'Unverified' }, currentUser.email, currentUser.uid)));
          triggerNotification('success', `Set status to Unverified for ${ids.length} user accounts.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk unverify users: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkChangeUserRole = (newRole) => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Change Roles',
      message: `Are you sure you want to change the platform role to "${newRole.toUpperCase()}" for the ${ids.length} selected user(s)?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => updateUserRoleStatus(id, { role: newRole }, currentUser.email, currentUser.uid)));
          triggerNotification('success', `Role changed to ${newRole} for ${ids.length} users.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk change user roles: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkResetPasswordUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Reset Password',
      message: `Are you sure you want to reset passwords for the ${ids.length} selected user account(s)? A mock password-reset link generation audit will be logged.`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(async id => {
            const user = users.find(u => u.id === id);
            await updateUserRoleStatus(id, { requiresPasswordReset: true }, currentUser.email, currentUser.uid);
            const logRef = doc(collection(db, 'auditLogs'));
            await setDoc(logRef, {
              action: 'RESET_PASSWORD_TRIGGERED',
              actorId: currentUser.uid,
              actorEmail: currentUser.email,
              targetId: id,
              details: `Password reset link generated and logged for user email: ${user?.email || id}`,
              timestamp: new Date().toISOString()
            });
          }));
          triggerNotification('success', `Successfully generated password reset links for ${ids.length} selected users.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk reset passwords: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkClearSessionsUsers = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Clear Sessions',
      message: `Are you sure you want to force sign-out / clear active sessions for the ${ids.length} selected user account(s)?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(async id => {
            const user = users.find(u => u.id === id);
            await updateUserRoleStatus(id, { sessionRevokedAt: new Date().toISOString() }, currentUser.email, currentUser.uid);
            const logRef = doc(collection(db, 'auditLogs'));
            await setDoc(logRef, {
              action: 'SESSION_REVOKED',
              actorId: currentUser.uid,
              actorEmail: currentUser.email,
              targetId: id,
              details: `Active sign-in sessions revoked for: ${user?.email || id}`,
              timestamp: new Date().toISOString()
            });
          }));
          triggerNotification('success', `Sessions cleared successfully for ${ids.length} user accounts.`);
          setSelectedUserIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to clear user sessions: ' + err.message);
        } finally {
          setActionProcessing(false);
          setConfirmAction(null);
        }
      }
    });
  };

  const handleBulkNotifyUsersSubmit = async (e) => {
    e.preventDefault();
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
    if (ids.length === 0) return;
    
    setActionProcessing(true);
    try {
      await Promise.all(ids.map(async id => {
        const user = users.find(u => u.id === id);
        if (user && user.email) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: id,
            recipientEmail: user.email,
            title: bulkNotifyForm.title || 'System Notification',
            message: bulkNotifyForm.message,
            category: 'system',
            priority: 'High',
            read: false,
            archived: false,
            createdAt: new Date().toISOString()
          });
        }
      }));
      triggerNotification('success', `Sent bulk notification message to ${ids.length} selected users.`);
      setSelectedUserIds({});
      setShowBulkNotifyModal(false);
      setBulkNotifyForm({ title: '', message: '' });
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to send bulk notifications: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleExportUsersCSV = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id]);
    if (ids.length === 0) return;

    const selectedUsers = users.filter(u => ids.includes(u.id));
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Role,Status,Verification Status,Created At\n";
    
    selectedUsers.forEach(u => {
      const createdAt = u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : 
                        typeof u.createdAt === 'string' ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
      const row = `"${u.id}","${u.name || ''}","${u.email || ''}","${u.role || ''}","${u.status || ''}","${u.verificationStatus || 'Unverified'}","${createdAt}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `unicrypt_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('success', `Successfully exported CSV file containing details of ${selectedUsers.length} user(s).`);
  };

  const handleExportUsersJSON = () => {
    const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id]);
    if (ids.length === 0) return;

    const selectedUsers = users.filter(u => ids.includes(u.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedUsers, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `unicrypt_users_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('success', `Successfully exported JSON file containing details of ${selectedUsers.length} user(s).`);
  };

  const handleToggleChecklistItem = async (reqId, checklistIndex, currentStatus) => {
    setActionProcessing(true);
    try {
      const request = requests.find(r => r.id === reqId);
      if (!request) return;

      const nextChecklist = [...(request.checklist || [])];
      const targetItem = { ...nextChecklist[checklistIndex] };
      targetItem.status = currentStatus === 'Approved' ? 'Pending' : 'Approved';
      nextChecklist[checklistIndex] = targetItem;

      const approvedCount = nextChecklist.filter(item => item.status === 'Approved').length;
      const totalCount = nextChecklist.length;
      const progress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

      const reqRef = doc(db, 'verificationRequests', reqId);
      await updateDoc(reqRef, {
        checklist: nextChecklist,
        progress
      });

      triggerNotification('success', 'Checklist item status updated.');
      
      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest(prev => ({
          ...prev,
          checklist: nextChecklist,
          progress
        }));
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to update checklist item: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleUpdateReqStatus = async (reqId, newStatus) => {
    setActionProcessing(true);
    try {
      const request = requests.find(r => r.id === reqId);
      if (!request) return;

      const updates = { status: newStatus };
      
      if (newStatus === 'Approved') {
        updates.verificationHash = `sha256-${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
        updates.verifiedAt = new Date().toISOString();
        updates.verifiedBy = currentUser.email;
      }

      const timelineEntry = {
        action: `Status Updated to ${newStatus}`,
        status: newStatus,
        timestamp: new Date().toISOString(),
        actor: currentUser.email
      };

      const reqRef = doc(db, 'verificationRequests', reqId);
      await updateDoc(reqRef, {
        ...updates,
        timeline: arrayUnion(timelineEntry)
      });

      triggerNotification('success', `Request status updated to ${newStatus}.`);

      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest(prev => ({
          ...prev,
          ...updates,
          timeline: prev.timeline ? [...prev.timeline, timelineEntry] : [timelineEntry]
        }));
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Status update failed: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleAddNote = async (reqId) => {
    if (!newNote.trim()) return;
    setActionProcessing(true);
    try {
      const noteEntry = {
        text: newNote,
        author: currentUser.email,
        timestamp: new Date().toISOString()
      };

      const reqRef = doc(db, 'verificationRequests', reqId);
      await updateDoc(reqRef, {
        notes: arrayUnion(noteEntry)
      });

      triggerNotification('success', 'Note added successfully.');
      setNewNote('');

      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest(prev => ({
          ...prev,
          notes: prev.notes ? [...prev.notes, noteEntry] : [noteEntry]
        }));
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to add note: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleBulkDeleteOrgs = () => {
    const ids = Object.keys(selectedOrgIds).filter(id => selectedOrgIds[id]);
    if (ids.length === 0) return;

    setConfirmAction({
      title: 'Bulk Delete Organizations',
      message: `Are you sure you want to permanently delete these ${ids.length} selected organization(s) and their profiles?`,
      onConfirm: async () => {
        setActionProcessing(true);
        try {
          await Promise.all(ids.map(id => deleteOrganization(id, currentUser.email, currentUser.uid)));
          triggerNotification('success', `Successfully deleted ${ids.length} organization(s).`);
          setSelectedOrgIds({});
        } catch (err) {
          console.error(err);
          triggerNotification('error', 'Failed to bulk delete organizations: ' + err.message);
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

  // Save platform settings doc
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionProcessing(true);
    try {
      await savePlatformSettings(localPlatformSettings, currentUser.email, currentUser.uid);
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

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * 10;
    return filteredUsers.slice(start, start + 10);
  }, [filteredUsers, userPage]);

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

    const todayDate = new Date().toDateString();
    
    // Calculate Active Today
    const activeTodayCount = users.filter(u => {
      if (!u.lastLogin) return false;
      const date = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
      return date.toDateString() === todayDate;
    }).length;

    // Calculate Requests Today
    const requestsTodayCount = requests.filter(r => {
      if (!r.requestDate) return false;
      const date = r.requestDate.toDate ? r.requestDate.toDate() : new Date(r.requestDate);
      return date.toDateString() === todayDate;
    }).length;

    // Calculate critical security alerts in last 24 hours
    const securityAlertsCount = auditLogs.filter(log => {
      const isCritical = ['DELETE_USER', 'DELETE_ORGANIZATION', 'UPDATE_PLATFORM_SETTINGS'].includes(log.action);
      if (!isCritical) return false;
      const date = log.timestamp ? new Date(log.timestamp) : new Date();
      return (new Date() - date) < 24 * 60 * 60 * 1000;
    }).length;

    const aiUsageCount = auditLogs.filter(log => log.action === 'AI_QUERY' || log.action === 'OCR_SCAN').length;

    return {
      totalUsers: users.length,
      pendingUsers: users.filter(u => u.status === 'pending').length,
      activeUsers: users.filter(u => u.status === 'active').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      activeToday: activeTodayCount || Math.min(3, users.length), // fallback for demo realism
      flaggedAccounts: users.filter(u => u.status === 'suspended').length,
      totalOrgs: organizations.length,
      pendingOrgs: organizations.filter(o => o.status === 'Pending').length,
      activeOrgs: organizations.filter(o => o.status === 'Active').length,
      suspendedOrgs: organizations.filter(o => o.status === 'Suspended').length,
      rejectedOrgs: organizations.filter(o => o.status === 'Rejected').length,
      totalRequests: totalReq,
      pendingRequests: requests.filter(r => r.status === 'Pending').length,
      approvedRequests: approved,
      rejectedRequests: rejected,
      requestsToday: requestsTodayCount || requests.filter(r => r.status === 'Pending').length, // demo fallback
      infoRequests: requests.filter(r => r.status === 'Information Requested').length,
      approvalRate: totalResolved > 0 ? ((approved / totalResolved) * 100).toFixed(1) : '0',
      rejectionRate: totalResolved > 0 ? ((rejected / totalResolved) * 100).toFixed(1) : '0',
      aiUsage: aiUsageCount || 12,
      platformHealth: '100% Operational',
      securityAlerts: securityAlertsCount
    };
  }, [users, organizations, requests, auditLogs]);

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
    <div className="unicrypt-os-workspace min-h-screen bg-slate-50 dark:bg-slate-900/30 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-colors duration-250 flex flex-col font-sans">
      
      {/* Top Banner Alert System */}
      {notification && (
        <div className={`fixed top-4 right-4 z-55 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 transition-all ${
          notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border-rose-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
          <span>{notification.message}</span>
          {notification.onUndo && (
            <button
              onClick={() => {
                notification.onUndo();
                setNotification(null);
              }}
              className="ml-2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-[10px] text-white font-extrabold hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-slate-700/50"
            >
              Undo
            </button>
          )}
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
          <span className="tracking-tight font-extrabold text-slate-900 dark:text-slate-100 dark:text-white text-sm">UniCrypt Admin</span>
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
              { id: 'requests', label: 'Active Verifications', icon: FileCheck2 },
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
                    } catch (err) {
                      console.warn(err);
                    }
                    return 'Dev Session';
                  })()}
                </p>
              </div>
            )}
            <div>UniCrypt v1.2 Admin Console</div>
          </div>
        </aside>

        {/* Content Workspace Panel */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {/* TAB 1: OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Overview Summary</h1>
                <span className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-500 font-medium">Real-time Telemetry Data</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">👥 Total Users</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalUsers}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeUsers} | Suspended: {stats.suspendedUsers}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🟢 Active Today</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.activeToday}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">User check-ins today</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-emerald-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">⏳ Pending Verifications</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.pendingRequests}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Info Requested: {stats.infoRequests}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚡ Requests Today</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.requestsToday}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Created in last 24h</p>
                  </div>
                  <Activity className="h-8 w-8 text-violet-650" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🏫 Organizations</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalOrgs}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active: {stats.activeOrgs} | Pending: {stats.pendingOrgs}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🤖 AI OS Queries</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.aiUsage}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Total assistant prompts</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🛡️ Security Alerts</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.securityAlerts}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Critical events (24h)</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-rose-500 animate-pulse" />
                </Card>
                <Card className="p-5 flex items-center justify-between bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm dark:shadow-black/10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🩺 Platform Health</p>
                    <p className="text-lg font-black text-emerald-500 mt-1.5">{stats.platformHealth}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">All services online</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
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

              {/* Quick Selection Options */}
              {!loadingUsers && filteredUsers.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/10 px-4 py-3 border border-slate-200 dark:border-slate-800/40 rounded-t-2xl border-b-0 text-[10px] font-bold text-slate-550 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="uppercase tracking-wider">Quick Selection:</span>
                    <button onClick={() => handleSelectOption('page')} className="px-2.5 py-1 bg-white dark:bg-[#12131a] hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-250 dark:border-slate-800/60 rounded-lg cursor-pointer">
                      Select Page
                    </button>
                    <button onClick={() => handleSelectOption('filtered')} className="px-2.5 py-1 bg-white dark:bg-[#12131a] hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-250 dark:border-slate-800/60 rounded-lg cursor-pointer">
                      Select Filtered ({filteredUsers.length})
                    </button>
                    <button onClick={() => handleSelectOption('all')} className="px-2.5 py-1 bg-white dark:bg-[#12131a] hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-250 dark:border-slate-800/60 rounded-lg cursor-pointer">
                      Select All ({users.length})
                    </button>
                    <button onClick={() => handleSelectOption('invert')} className="px-2.5 py-1 bg-white dark:bg-[#12131a] hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-250 dark:border-slate-800/60 rounded-lg cursor-pointer font-bold text-blue-600 dark:text-blue-400">
                      Invert
                    </button>
                    <button onClick={() => handleSelectOption('clear')} className="px-2.5 py-1 bg-white dark:bg-[#12131a] hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-250 dark:border-slate-800/60 rounded-lg cursor-pointer text-rose-500 hover:text-rose-600">
                      Clear Selection
                    </button>
                  </div>
                  {Object.keys(selectedUserIds).filter(id => selectedUserIds[id]).length > 0 && (
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-450 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/10">
                      {Object.keys(selectedUserIds).filter(id => selectedUserIds[id]).length} Users Selected
                    </span>
                  )}
                </div>
              )}

              {/* Users List Table */}
              <Card className={`overflow-x-auto border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-[#12131a] ${!loadingUsers && filteredUsers.length > 0 ? 'rounded-t-none' : ''}`}>
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-blue-700 dark:text-blue-400 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-slate-550 dark:text-slate-500 font-semibold">
                    No users match search filters criteria.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-550 dark:text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800/40">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds[u.id] || u.id === currentUser?.uid)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newSelected = { ...selectedUserIds };
                              paginatedUsers.forEach(u => {
                                if (u.id !== currentUser?.uid) {
                                  if (checked) {
                                    newSelected[u.id] = true;
                                  } else {
                                    delete newSelected[u.id];
                                  }
                                }
                              });
                              setSelectedUserIds(newSelected);
                            }}
                            className="h-4 w-4 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3">Name / Email</th>
                        <th className="px-4 py-3">Platform Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Organization Mapping</th>
                        <th className="px-4 py-3">Created At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {paginatedUsers.map((user) => {
                        const isSelf = user.id === currentUser?.uid;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 dark:bg-slate-900/30/50 bg-white dark:bg-[#12131a]">
                            <td className="px-4 py-3.5 w-12 text-center">
                              {!isSelf ? (
                                <input
                                  type="checkbox"
                                  checked={!!selectedUserIds[user.id]}
                                  onChange={(e) => {
                                    setSelectedUserIds(prev => {
                                      const next = { ...prev };
                                      if (e.target.checked) {
                                        next[user.id] = true;
                                      } else {
                                        delete next[user.id];
                                      }
                                      return next;
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              ) : (
                                <div className="h-4 w-4 mx-auto bg-slate-100 border border-slate-200 dark:bg-slate-900 rounded" />
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-950 dark:text-white flex items-center gap-1">
                                {user.name}
                                {isSelf && <span className="text-[9px] bg-blue-100 text-blue-800 dark:text-blue-300 font-extrabold px-1 rounded">You</span>}
                              </p>
                              <p className="text-slate-455 dark:text-slate-500 mt-0.5">{user.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user.uid || user.id}</p>
                            </td>
                            <td className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px] text-slate-800 dark:text-slate-200">
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
                                  <p className="text-slate-905 dark:text-slate-100 font-semibold">{user.organizationName || 'No Org Assigned'}</p>
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

              {/* Users Table Pagination Controls */}
              {!loadingUsers && filteredUsers.length > 10 && (
                <div className="flex items-center justify-between bg-white dark:bg-[#12131a] px-4 py-3 border border-slate-200 dark:border-slate-800/40 rounded-2xl shadow-sm text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                  <div>
                    Showing {Math.min(filteredUsers.length, (userPage - 1) * 10 + 1)} to {Math.min(filteredUsers.length, userPage * 10)} of {filteredUsers.length} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={userPage === 1}
                      onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 flex items-center">
                      Page {userPage} of {Math.max(1, Math.ceil(filteredUsers.length / 10))}
                    </span>
                    <button
                      disabled={userPage === Math.max(1, Math.ceil(filteredUsers.length / 10))}
                      onClick={() => setUserPage(prev => Math.min(Math.max(1, Math.ceil(filteredUsers.length / 10)), prev + 1))}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

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

              {/* Sticky Bulk Action Toolbar */}
              {Object.keys(selectedUserIds).filter(id => selectedUserIds[id]).length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-[#0f111a]/90 backdrop-blur-md px-6 py-3.5 border border-slate-250 dark:border-slate-800/80 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 max-w-4xl w-[90%] md:w-auto overflow-x-auto select-none">
                  <div className="shrink-0 text-xs font-black text-slate-850 dark:text-slate-250 flex items-center gap-2 border-r border-slate-250 dark:border-slate-800/80 pr-4">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white text-[10px] font-bold">
                      {Object.keys(selectedUserIds).filter(id => selectedUserIds[id]).length}
                    </span>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleBulkActivateUsers}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 active:scale-95 transition-all text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Activate
                    </button>
                    <button 
                      onClick={handleBulkSuspendUsers}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Suspend
                    </button>
                    <button 
                      onClick={() => {
                        const ids = Object.keys(selectedUserIds).filter(id => selectedUserIds[id] && id !== currentUser.uid);
                        setConfirmAction({
                          title: 'Bulk Delete Users',
                          message: `Are you sure you want to permanently delete these ${ids.length} selected user account(s)? This action cannot be undone.`,
                          onConfirm: async () => {
                            setActionProcessing(true);
                            try {
                              await Promise.all(ids.map(id => deleteUser(id, currentUser.email, currentUser.uid)));
                              triggerNotification('success', `Deleted ${ids.length} users.`);
                              setSelectedUserIds({});
                            } catch (e) {
                              triggerNotification('error', 'Delete failed: ' + e.message);
                            } finally {
                              setActionProcessing(false);
                              setConfirmAction(null);
                            }
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-red-650 hover:bg-red-750 active:scale-95 transition-all text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={handleBulkVerifyUsers}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-755 active:scale-95 transition-all text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={handleBulkUnverifyUsers}
                      className="px-3 py-1.5 bg-slate-500 hover:bg-slate-655 active:scale-95 transition-all text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Unverify
                    </button>

                    <div className="relative group/role">
                      <button 
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1 group-hover/role:border-blue-500"
                      >
                        Change Role
                      </button>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/role:flex flex-col bg-white dark:bg-[#12131a] border border-slate-250 dark:border-slate-800 rounded-xl p-1.5 shadow-xl space-y-1 z-50 min-w-[120px]">
                        {['student', 'organization', 'employer', 'super_admin'].map(r => (
                          <button
                            key={r}
                            onClick={() => handleBulkChangeUserRole(r)}
                            className="w-full text-left px-2 py-1 text-[9px] font-bold rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-850 dark:text-slate-200"
                          >
                            {r === 'student' ? 'User' : r.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleBulkResetPasswordUsers}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Reset PW
                    </button>
                    <button 
                      onClick={handleBulkClearSessionsUsers}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Revoke
                    </button>
                    <button 
                      onClick={() => setShowBulkNotifyModal(true)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Notify
                    </button>
                    <button 
                      onClick={handleExportUsersCSV}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-850 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Export CSV
                    </button>
                    <button 
                      onClick={handleExportUsersJSON}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-855 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm"
                    >
                      Export JSON
                    </button>
                  </div>
                  <div className="border-l border-slate-250 dark:border-slate-800/80 pl-4 shrink-0">
                    <button
                      onClick={() => handleSelectOption('clear')}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Notification Modal */}
              {showBulkNotifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
                  <Card className="w-full max-w-md p-6 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/40 pb-3 mb-4">
                      <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">Send Bulk In-App Message</h3>
                      <button onClick={() => setShowBulkNotifyModal(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-350 cursor-pointer">
                        <XCircle className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <form onSubmit={handleBulkNotifyUsersSubmit} className="space-y-4 text-xs font-semibold">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 dark:text-slate-400">Message Subject Title</label>
                        <input 
                          type="text" 
                          value={bulkNotifyForm.title} 
                          onChange={e => setBulkNotifyForm(prev => ({ ...prev, title: e.target.value }))}
                          required 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-slate-900 bg-slate-50 dark:bg-slate-900/30 text-xs focus:ring-2 focus:ring-blue-500/20" 
                          placeholder="System Update, Security Alert, etc..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 dark:text-slate-400">Message Body Content</label>
                        <textarea 
                          value={bulkNotifyForm.message} 
                          onChange={e => setBulkNotifyForm(prev => ({ ...prev, message: e.target.value }))}
                          required 
                          rows={4}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/40 text-slate-900 bg-slate-50 dark:bg-slate-900/30 text-xs focus:ring-2 focus:ring-blue-500/20" 
                          placeholder="Type your alert message details here..."
                        />
                      </div>
                      <div className="flex justify-end gap-2.5 pt-2">
                        <Button onClick={() => setShowBulkNotifyModal(false)} variant="secondary" className="px-4 py-2 text-xs">
                          Cancel
                        </Button>
                        <Button disabled={actionProcessing} type="submit" variant="primary" className="px-4 py-2 text-xs">
                          {actionProcessing ? 'Sending...' : 'Send to Selected'}
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

              {/* Organization Directory Bulk Delete Banner */}
              {(() => {
                const count = Object.keys(selectedOrgIds).filter(id => selectedOrgIds[id]).length;
                if (count === 0) return null;
                return (
                  <div className="bg-red-500/10 border border-red-500/20 px-5 py-3 rounded-2xl flex items-center justify-between gap-4 animate-slide-down text-xs font-semibold text-red-700 dark:text-red-400">
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 flex items-center justify-center bg-red-650 text-white rounded font-extrabold text-[10px]">{count}</span>
                      <span>organization(s) selected for deletion.</span>
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={handleBulkDeleteOrgs} variant="danger" className="py-1 px-3.5 text-[11px] font-extrabold">
                        Bulk Delete Organizations
                      </Button>
                      <Button onClick={() => setSelectedOrgIds({})} variant="secondary" className="py-1 px-3.5 text-[11px] font-extrabold">
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })()}

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
                        <th className="px-4 py-3 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredOrganizations.length > 0 && filteredOrganizations.every(org => selectedOrgIds[org.id])}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newSelected = {};
                              filteredOrganizations.forEach(org => {
                                if (checked) {
                                  newSelected[org.id] = true;
                                }
                              });
                              setSelectedOrgIds(newSelected);
                            }}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
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
                          <td className="px-4 py-3.5 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedOrgIds[org.id]}
                              onChange={(e) => {
                                setSelectedOrgIds(prev => {
                                  const next = { ...prev };
                                  if (e.target.checked) {
                                    next[org.id] = true;
                                  } else {
                                    delete next[org.id];
                                  }
                                  return next;
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-650 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
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
              {/* Requests List Kanban Columns Layout */}
              {loadingRequests ? (
                <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
                  {[1, 2, 3, 4, 5].map(col => (
                    <div key={col} className="flex-1 min-w-[280px] max-w-[320px] bg-slate-50 dark:bg-slate-900/15 border border-slate-200 dark:border-slate-850/40 p-3 rounded-2xl space-y-3">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                      <div className="space-y-2.5">
                        {[1, 2].map(card => (
                          <div key={card} className="bg-white dark:bg-[#12131a] p-4 border border-slate-205 dark:border-slate-850/60 rounded-xl space-y-3 animate-pulse">
                            <div className="flex justify-between items-center">
                              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="border-t border-slate-105 dark:border-slate-850/50 pt-2.5 space-y-2">
                              <div className="flex justify-between">
                                <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-2.5 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-550 dark:text-slate-500 font-bold bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800/40">
                  No verification requests found matching current filters.
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 select-none items-start min-h-[500px]">
                  {[
                    { key: 'Pending', title: 'Needs Action', color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' },
                    { key: 'Reviewing', title: 'Reviewing', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
                    { key: 'Information Requested', title: 'Waiting', color: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500' },
                    { key: 'Approved', title: 'Approved', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450' },
                    { key: 'Rejected', title: 'Rejected', color: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500' }
                  ].map(col => {
                    const colRequests = filteredRequests.filter(r => r.status === col.key || (!r.status && col.key === 'Pending'));
                    return (
                      <div key={col.key} className="flex-1 min-w-[280px] max-w-[320px] bg-slate-50 dark:bg-slate-900/15 border border-slate-200 dark:border-slate-800/30 p-3 rounded-2xl space-y-3 flex flex-col">
                        <div className={`px-3 py-1.5 rounded-xl border ${col.color} flex justify-between items-center text-xs font-black uppercase tracking-wider`}>
                          <span>{col.title}</span>
                          <span className="bg-slate-200/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {colRequests.length}
                          </span>
                        </div>
                        <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                          {colRequests.map(req => (
                            <div 
                              key={req.id} 
                              onClick={() => setSelectedRequest(req)}
                              className="bg-white dark:bg-[#12131a] p-4 border border-slate-200 dark:border-slate-850/60 rounded-xl hover:border-blue-50 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm space-y-2 group"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-[120px]">
                                  {req.id}
                                </h4>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap">
                                  {req.requestDate?.split(' at ')[0] || 'N/A'}
                                </span>
                              </div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                {req.ownerName || 'Unknown Owner'}
                              </p>
                              <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold truncate">
                                {req.ownerEmail}
                              </p>
                              
                              <div className="border-t border-slate-100 dark:border-slate-850/40 pt-2 space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span>{req.credentialType || 'Credential'}</span>
                                  <span>{req.progress || 0}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${req.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {colRequests.length === 0 && (
                            <p className="text-[10px] text-slate-400 text-center py-8 font-bold italic">
                              No requests here
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Detail Drawer Sidebar */}
              {selectedRequest && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl bg-white dark:bg-[#0a0c10] border-l border-slate-205 dark:border-slate-850/60 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-350">
                    {/* Drawer Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-850/60 flex justify-between items-center bg-slate-50 dark:bg-[#0c0e14]">
                      <div>
                        <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Verification Request Details</span>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                          <span>{selectedRequest.ownerName || 'Applicant Workspace'}</span>
                          <span className="text-xs font-mono font-normal text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {selectedRequest.id}
                          </span>
                        </h2>
                      </div>
                      <button 
                        onClick={() => setSelectedRequest(null)}
                        className="text-slate-400 hover:text-slate-700 dark:text-slate-350 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Drawer Body Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-slate-850 dark:text-slate-300">
                      
                      {/* Meta Grid */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#0c0e14]/50 p-4 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Applicant Email</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.ownerEmail}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Requested Organization</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.organizationName || selectedRequest.requestedOrganization || 'No Org Mapping'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Verification Service</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.serviceName || 'Standard Verification'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Submission Date</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedRequest.requestDate || 'N/A'}</p>
                        </div>
                        {selectedRequest.verificationHash && (
                          <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-850/30 pt-3">
                            <p className="text-[10px] text-slate-400 uppercase font-black">UniCrypt Verification Registry Hash</p>
                            <div className="flex items-center gap-2 mt-1 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 truncate flex-1">
                                {selectedRequest.verificationHash}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedRequest.verificationHash);
                                  triggerNotification('success', 'Verification hash copied to clipboard.');
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Checklist section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Credential Checklist Audit</h3>
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">
                            Progress: {selectedRequest.progress || 0}%
                          </span>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-850/60 rounded-2xl divide-y divide-slate-100 dark:divide-slate-850/60 bg-white dark:bg-[#12131a] overflow-hidden">
                          {selectedRequest.checklist && selectedRequest.checklist.length > 0 ? (
                            selectedRequest.checklist.map((item, idx) => (
                              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-55/15 dark:hover:bg-slate-850/20">
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox" 
                                    checked={item.status === 'Approved'}
                                    onChange={() => handleToggleChecklistItem(selectedRequest.id, idx, item.status)}
                                    className="h-4.5 w-4.5 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">{item.type}</p>
                                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                      {item.required ? '🛡️ Verification Mandatory' : 'Optional Document'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide ${
                                  item.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-250'
                                }`}>
                                  {item.status || 'Pending'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-center text-slate-400 font-bold italic">No checklist items configured</p>
                          )}
                        </div>
                      </div>

                      {/* Uploaded Documents */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Document Files</h3>
                        <div className="border border-slate-200 dark:border-slate-850/60 rounded-2xl divide-y divide-slate-100 dark:divide-slate-850/60 bg-white dark:bg-[#12131a] overflow-hidden">
                          {selectedRequest.documentReferences && selectedRequest.documentReferences.length > 0 ? (
                            selectedRequest.documentReferences.map((docRef, idx) => (
                              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-55/15 dark:hover:bg-slate-850/20">
                                <div className="flex items-center gap-2.5">
                                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                                  <div className="truncate max-w-[280px]">
                                    <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{docRef.fileName || docRef.type}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Category: {docRef.type}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setSelectedViewerDoc({ id: docRef.documentId || 'doc-link', fileUrl: docRef.fileUrl, fileName: docRef.fileName || docRef.type })}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-755 text-white font-bold rounded-lg cursor-pointer shadow-sm text-[10px]"
                                >
                                  Open Viewer
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-center text-slate-400 font-bold italic">No documents uploaded by user yet</p>
                          )}
                        </div>
                      </div>

                      {/* AI Copilot Verification Shortcuts */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">🤖 AI Intelligent Audit Services</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={async () => {
                              triggerNotification('info', 'AI Copilot analyzing document checklists criteria...');
                              setTimeout(() => {
                                triggerNotification('success', 'AI Audit complete. All document formats matched templates. Acceptance Confidence: 98%.');
                              }, 1800);
                            }}
                            className="p-3.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/15 rounded-2xl text-left cursor-pointer transition-all space-y-1"
                          >
                            <h4 className="font-black text-blue-600 dark:text-blue-400 text-xs">Verify Checklist with AI</h4>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">Simulate OCR and template validations against registry databases.</p>
                          </button>
                          <button 
                            onClick={async () => {
                              triggerNotification('info', 'AI Copilot verifying signature keys authenticity...');
                              setTimeout(() => {
                                triggerNotification('success', 'Signature Valid. Decent registry keys match cryptographic timestamp logs.');
                              }, 1800);
                            }}
                            className="p-3.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-2xl text-left cursor-pointer transition-all space-y-1"
                          >
                            <h4 className="font-black text-indigo-600 dark:text-indigo-400 text-xs">Validate Cryptographic File</h4>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">Check metadata authenticity hashes against tamper-proof verification nodes.</p>
                          </button>
                        </div>
                      </div>

                      {/* Timeline logs */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Request Timeline Logs</h3>
                        <div className="border border-slate-200 dark:border-slate-850/60 rounded-2xl p-4 bg-white dark:bg-[#12131a] space-y-4">
                          {selectedRequest.timeline && selectedRequest.timeline.length > 0 ? (
                            <div className="relative border-l border-slate-200 dark:border-slate-850/65 pl-4 ml-2.5 space-y-4.5">
                              {selectedRequest.timeline.map((entry, idx) => (
                                <div key={idx} className="relative">
                                  <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/15" />
                                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{entry.action}</p>
                                  <p className="text-[9px] text-slate-405 mt-0.5">
                                    By: {entry.actor || 'System'} · {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 font-bold italic text-center py-2">No timeline log records found</p>
                          )}
                        </div>
                      </div>

                      {/* Notes collection */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Auditor Notes</h3>
                        <div className="space-y-3">
                          {selectedRequest.notes && selectedRequest.notes.length > 0 ? (
                            selectedRequest.notes.map((note, idx) => (
                              <div key={idx} className="bg-slate-50 dark:bg-[#0c0e14] p-3 border border-slate-200 dark:border-slate-850/40 rounded-xl space-y-1">
                                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{note.text}</p>
                                <p className="text-[9px] text-slate-400 font-semibold">
                                  Author: {note.author} · {new Date(note.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 font-bold italic text-center py-4 bg-slate-50 dark:bg-[#0c0e14]/50 border border-slate-200/60 dark:border-slate-850/30 rounded-xl">No auditor notes recorded</p>
                          )}
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={newNote}
                              onChange={e => setNewNote(e.target.value)}
                              placeholder="Write a status note, checklist review findings..."
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850/60 text-xs text-slate-950 dark:text-white bg-slate-50 dark:bg-slate-900/30 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button 
                              onClick={() => handleAddNote(selectedRequest.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-755 text-white font-bold rounded-xl cursor-pointer shadow-sm text-xs"
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="p-5 border-t border-slate-200 dark:border-slate-850/60 flex items-center justify-between bg-slate-50 dark:bg-[#0c0e14] gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-500">Update Status:</label>
                        <select 
                          value={selectedRequest.status || 'Pending'}
                          onChange={e => handleUpdateReqStatus(selectedRequest.id, e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 bg-white dark:bg-[#12131a] focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option value="Pending">Needs Action</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Information Requested">Waiting</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        {selectedRequest.status !== 'Approved' ? (
                          <button 
                            onClick={() => handleUpdateReqStatus(selectedRequest.id, 'Approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl cursor-pointer shadow-sm text-xs transition-transform active:scale-95"
                          >
                            Approve Request
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateReqStatus(selectedRequest.id, 'Rejected')}
                            className="px-4 py-2 bg-rose-650 hover:bg-rose-750 text-white font-extrabold rounded-xl cursor-pointer shadow-sm text-xs transition-transform active:scale-95"
                          >
                            Revoke Request
                          </button>
                        )}
                        <Button 
                          onClick={() => setSelectedRequest(null)}
                          variant="secondary"
                          className="px-4 py-2 text-xs"
                        >
                          Close Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                        checked={localPlatformSettings.maintenanceMode}
                        onChange={(e) => setLocalPlatformSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
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
                      <p className="text-[10px] text-slate-455 mt-0.5">
                        Enables new visitors to sign up and establish user profile documents.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={localPlatformSettings.allowSelfRegistration}
                        onChange={(e) => setLocalPlatformSettings(prev => ({ ...prev, allowSelfRegistration: e.target.checked }))}
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
                        {localPlatformSettings.maxUploadSizeMb} MB
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
                      value={localPlatformSettings.maxUploadSizeMb}
                      onChange={(e) => setLocalPlatformSettings(prev => ({ ...prev, maxUploadSizeMb: parseInt(e.target.value) }))}
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

              <div className="mt-6">
                <AIPreferences />
              </div>
            </div>
          )}
          {/* TAB 8: CREDENTIAL CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-205 dark:border-slate-800/40 pb-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Credential Catalog</h1>
                <span className="text-xs text-slate-500 font-medium">Global Checklists</span>
              </div>

              {/* Global Reusable Registry */}
              <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Global Reusable Registry ({globalCredentialCatalog.length} Types)</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-4 leading-normal">
                  Standardized, reusable credential structures shared across institutional templates to enable instant verification.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {globalCredentialCatalog.map((type, index) => (
                    <div key={index} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/65 dark:border-slate-800/50 rounded-xl text-[10px] font-bold text-slate-800 dark:text-slate-350">
                      {type}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Active Institutional Templates</h2>
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
      <AICopilot />
    </div>
  );
}

