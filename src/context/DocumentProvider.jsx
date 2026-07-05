import { createContext, useMemo, useReducer, useEffect, useRef, useState } from 'react';
import { db, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc, arrayUnion, query, where, orderBy, limit, getDoc } from '../firebase/firebase.js';
import { useAuth } from '../hooks/useAuth.js';
import { askAI } from '@/ai/gateway';
import {
  setVerificationRequests,
  setOrganizations,
  setUsers,
  setAuditLogs,
  setPlatformSettings,
  removeToast,
  setActivities,
} from './documentActions.js';
import { documentReducer } from './documentReducer.js';
import { createInitialDocumentState } from './initialState.js';
import {
  VERIFICATION_STATUS,
  formatRequestDate,
  formatVerificationDate,
  generateVerificationId,
  generateDocumentHash,
  createTimelineEntry,
} from './documentUtils.js';

export const VerificationStateContext = createContext(null);
export const VerificationDispatchContext = createContext(null);

export function DocumentProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [state, dispatch] = useReducer(
    documentReducer,
    {
      verificationRequests: [],
      organizations: [],
      users: [],
      auditLogs: [],
      platformSettings: {
        allowNewRegistrations: true,
        maintenanceMode: false,
        requireVerificationReview: true
      },
      loading: true,
      ready: false,
      toasts: [],
      activities: []
    }
  );

  // 1. Live Organizations subscription + seed logic
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const unsubscribeOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
      if (snapshot.empty && userProfile.role === 'super_admin') {
        const defaultOrgs = [
          {
            organizationId: 'org-northbridge',
            name: 'Northbridge University',
            type: 'University',
            status: 'Active',
            verificationStatus: 'Verified',
            website: 'www.northbridge.edu',
            officialEmailDomain: 'northbridge.edu',
            logoUrl: null,
            createdAt: new Date().toISOString()
          },
          {
            organizationId: 'org-apollo',
            name: 'Apollo Hospitals',
            type: 'Hospital',
            status: 'Active',
            verificationStatus: 'Verified',
            website: 'www.apollohospitals.com',
            officialEmailDomain: 'apollohospitals.com',
            logoUrl: null,
            createdAt: new Date().toISOString()
          },
          {
            organizationId: 'org-infosys',
            name: 'Infosys',
            type: 'Employer',
            status: 'Active',
            verificationStatus: 'Verified',
            website: 'www.infosys.com',
            officialEmailDomain: 'infosys.com',
            logoUrl: null,
            createdAt: new Date().toISOString()
          }
        ];
        defaultOrgs.forEach(async (org) => {
          await setDoc(doc(db, 'organizations', org.organizationId), org);
        });
      } else {
        const orgs = [];
        snapshot.forEach((doc) => {
          orgs.push({ id: doc.id, ...doc.data() });
        });
        dispatch(setOrganizations(orgs));
      }
    }, (error) => {
      console.error("Organizations onSnapshot subscription error:", error);
    });

    return () => unsubscribeOrgs();
  }, [currentUser, userProfile]);

  // 2. Live Platform Settings subscription + seed logic
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'platform'), async (docSnap) => {
      if (!docSnap.exists() && userProfile.role === 'super_admin') {
        const defaultSettings = {
          allowNewRegistrations: true,
          maintenanceMode: false,
          requireVerificationReview: true
        };
        await setDoc(doc(db, 'settings', 'platform'), defaultSettings);
      } else if (docSnap.exists()) {
        dispatch(setPlatformSettings(docSnap.data()));
      }
    }, (error) => {
      console.error("Settings snapshot listener error:", error);
    });

    return () => unsubscribeSettings();
  }, [currentUser, userProfile]);

  // 3. Live Users & Audit Logs subscriptions (Super Admin only)
  useEffect(() => {
    if (!currentUser || !userProfile || userProfile.role !== 'super_admin') {
      dispatch(setUsers([]));
      dispatch(setAuditLogs([]));
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const u = [];
      snap.forEach(d => u.push({ id: d.id, ...d.data() }));
      dispatch(setUsers(u));
    }, (error) => console.error("Users listener error:", error));

    const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      const l = [];
      snap.forEach(d => l.push({ id: d.id, ...d.data() }));
      dispatch(setAuditLogs(l));
    }, (error) => console.error("Audit logs listener error:", error));

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, [currentUser, userProfile]);

  // 3.5. Live Activity Logs subscription
  useEffect(() => {
    if (!currentUser || !userProfile) {
      dispatch(setActivities([]));
      return;
    }

    let q;
    if (userProfile.role === 'super_admin') {
      q = query(
        collection(db, 'activityLogs'),
        limit(100)
      );
    } else if (userProfile.role === 'organization') {
      q = query(
        collection(db, 'activityLogs'),
        limit(100)
      );
    } else {
      q = query(
        collection(db, 'activityLogs'),
        where('ownerId', '==', currentUser.uid),
        limit(100)
      );
    }

    const unsubscribeActivities = onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      // Sort in-memory newest-first and slice to latest 20
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      dispatch(setActivities(logs.slice(0, 20)));
    }, (error) => {
      console.error("activityLogs onSnapshot subscription error:", error);
    });

    return () => unsubscribeActivities();
  }, [currentUser, userProfile]);

  const prevRequestsRef = useRef([]);

  // 4. Live Verification Requests subscription (context-driven filtering)
  useEffect(() => {
    if (!currentUser || !userProfile) {
      dispatch(setVerificationRequests([]));
      return;
    }

    let q;
    if (userProfile.role === 'super_admin') {
      q = collection(db, 'verificationRequests');
    } else if (userProfile.role === 'organization') {
      q = query(
        collection(db, 'verificationRequests'),
        where('organizationId', '==', userProfile.organizationId || null)
      );
    } else {
      q = query(
        collection(db, 'verificationRequests'),
        where('ownerId', '==', currentUser.uid)
      );
    }

    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && userProfile.role === 'super_admin') {
        const initialRequests = createInitialDocumentState(currentUser.uid).verificationRequests;
        initialRequests.forEach(async (req) => {
          const { id, ...data } = req;
          await addDoc(collection(db, 'verificationRequests'), data);
        });
      } else {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });

        // Event visibility comparison loop
        if (prevRequestsRef.current.length > 0) {
          requests.forEach((req) => {
            const prev = prevRequestsRef.current.find((p) => p.id === req.id);
            if (prev) {
              if (prev.status !== req.status) {
                const message = `Verification status for "${req.credentialType}" updated to "${req.status}" by ${req.organization?.name || 'Issuer'}.`;
                dispatch({ type: 'ADD_TOAST', payload: { message, type: req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'error' : 'warning' } });
              }
            } else {
              const message = `New verification request submitted for "${req.credentialType}".`;
              dispatch({ type: 'ADD_TOAST', payload: { message, type: 'info' } });
            }
          });
        }

        prevRequestsRef.current = requests;
        dispatch(setVerificationRequests(requests));
      }
    }, (error) => {
      console.error(`Verification requests (${userProfile.role}) onSnapshot subscription error:`, error);
    });

    return () => unsubscribeRequests();
  }, [currentUser, userProfile]);

  const actions = useMemo(
    () => ({
      requestVerification: async (payload) => {
        if (!currentUser) {
          throw new Error('User must be authenticated to request a verification.');
        }

        const requestDate = new Date();
        const requestData = {
          credentialType: payload.credentialType,
          organization: {
            id: payload.organization.id,
            name: payload.organization.name,
            type: payload.organization.type,
          },
          organizationId: payload.organization.id,
          purpose: payload.purpose,
          fileName: payload.fileName,
          files: payload.files || [],
          uploadMode: payload.uploadMode || 'cloud',
          storageStatus: payload.storageStatus || 'enabled',
          requestDate: formatRequestDate(requestDate),
          status: VERIFICATION_STATUS.PENDING,
          owner: {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous User',
            email: currentUser.email || `anonymous-${currentUser.uid.substring(0, 5)}@localhost`,
          },
          ownerId: currentUser.uid,
          ownerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous User',
          ownerEmail: currentUser.email || `anonymous-${currentUser.uid.substring(0, 5)}@localhost`,
          timeline: [
            createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, requestDate)
          ],
        };

        const requestRef = payload.id ? doc(db, 'verificationRequests', payload.id) : doc(collection(db, 'verificationRequests'));
        const genId = requestRef.id;

        await setDoc(requestRef, requestData);

        await addDoc(collection(db, 'activityLogs'), {
          requestId: genId,
          type: 'New',
          before: 'None',
          after: 'Pending',
          actor: currentUser.email || 'Anonymous User',
          ownerId: currentUser.uid,
          timestamp: new Date().toISOString(),
          credentialType: payload.credentialType,
          organizationName: payload.organization.name,
          title: 'New Request',
          desc: `Verification request initiated for ${payload.credentialType}.`
        });
      },
      approveVerification: async (verificationId) => {
        const verifiedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Approved by Organization', VERIFICATION_STATUS.APPROVED, verifiedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        await updateDoc(doc(db, 'verificationRequests', verificationId), {
          status: VERIFICATION_STATUS.APPROVED,
          verificationId: generateVerificationId(),
          verifiedAt: formatVerificationDate(verifiedAt),
          hash: generateDocumentHash(),
          timeline: arrayUnion(timelineEntry)
        });
        if (currentUser) {
          const logRef = doc(collection(db, 'auditLogs'));
          await setDoc(logRef, {
            action: 'APPROVE_REQUEST',
            actorId: currentUser.uid,
            actorEmail: currentUser.email,
            targetId: verificationId,
            targetName: 'Verification Request',
            details: `Approved verification request ${verificationId}`,
            timestamp: new Date().toISOString(),
          });
        }

        await addDoc(collection(db, 'activityLogs'), {
          requestId: verificationId,
          type: 'Approved',
          before: beforeStatus,
          after: 'Approved',
          actor: currentUser.email || 'Verifier',
          ownerId,
          timestamp: new Date().toISOString(),
          credentialType: reqData.credentialType || 'Document',
          organizationName: reqData.organization?.name || 'Verifier',
          title: `${reqData.credentialType || 'Document'} Approved`,
          desc: `Approved by ${reqData.organization?.name || 'Verifier'}.`
        });
      },
      rejectVerification: async (verificationId) => {
        const rejectedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Rejected by Organization', VERIFICATION_STATUS.REJECTED, rejectedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        await updateDoc(doc(db, 'verificationRequests', verificationId), {
          status: VERIFICATION_STATUS.REJECTED,
          timeline: arrayUnion(timelineEntry)
        });
        if (currentUser) {
          const logRef = doc(collection(db, 'auditLogs'));
          await setDoc(logRef, {
            action: 'REJECT_REQUEST',
            actorId: currentUser.uid,
            actorEmail: currentUser.email,
            targetId: verificationId,
            targetName: 'Verification Request',
            details: `Rejected verification request ${verificationId}`,
            timestamp: new Date().toISOString(),
          });
        }

        await addDoc(collection(db, 'activityLogs'), {
          requestId: verificationId,
          type: 'Rejected',
          before: beforeStatus,
          after: 'Rejected',
          actor: currentUser.email || 'Verifier',
          ownerId,
          timestamp: new Date().toISOString(),
          credentialType: reqData.credentialType || 'Document',
          organizationName: reqData.organization?.name || 'Verifier',
          title: `${reqData.credentialType || 'Document'} Rejected`,
          desc: `Rejected by ${reqData.organization?.name || 'Verifier'}.`
        });
      },
      requestMoreInformation: async (verificationId) => {
        const requestedAt = new Date();
        const timelineEntry = createTimelineEntry('More Information Requested by Organization', VERIFICATION_STATUS.INFORMATION_REQUESTED, requestedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        await updateDoc(doc(db, 'verificationRequests', verificationId), {
          status: VERIFICATION_STATUS.INFORMATION_REQUESTED,
          timeline: arrayUnion(timelineEntry)
        });
        if (currentUser) {
          const logRef = doc(collection(db, 'auditLogs'));
          await setDoc(logRef, {
            action: 'REQUEST_INFORMATION',
            actorId: currentUser.uid,
            actorEmail: currentUser.email,
            targetId: verificationId,
            targetName: 'Verification Request',
            details: `Requested additional information for request ${verificationId}`,
            timestamp: new Date().toISOString(),
          });
        }

        await addDoc(collection(db, 'activityLogs'), {
          requestId: verificationId,
          type: 'Information Requested',
          before: beforeStatus,
          after: 'Information Requested',
          actor: currentUser.email || 'Verifier',
          ownerId,
          timestamp: new Date().toISOString(),
          credentialType: reqData.credentialType || 'Document',
          organizationName: reqData.organization?.name || 'Verifier',
          title: `Information Requested`,
          desc: `Additional information requested for ${reqData.credentialType || 'Document'} by ${reqData.organization?.name || 'Verifier'}.`
        });
      },
      updateUserRoleStatus: async (userId, updates, actorEmail, actorId) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_USER',
          actorId,
          actorEmail,
          targetId: userId,
          details: `Updated user ${userId} settings: ${JSON.stringify(updates)}`,
          timestamp: new Date().toISOString(),
        });
      },
      updateOrganization: async (orgId, updates, actorEmail, actorId) => {
        const orgRef = doc(db, 'organizations', orgId);
        await updateDoc(orgRef, updates);
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'UPDATE_ORGANIZATION',
          actorId,
          actorEmail,
          targetId: orgId,
          details: `Updated organization ${orgId} settings: ${JSON.stringify(updates)}`,
          timestamp: new Date().toISOString(),
        });
      },
      createOrganization: async (orgId, newOrg, actorEmail, actorId) => {
        await setDoc(doc(db, 'organizations', orgId), newOrg);
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'CREATE_ORGANIZATION',
          actorId,
          actorEmail,
          targetId: orgId,
          details: `Created organization: ${newOrg.name}`,
          timestamp: new Date().toISOString(),
        });
      },
      savePlatformSettings: async (settings, actorEmail, actorId) => {
        await setDoc(doc(db, 'settings', 'platform'), settings);
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'SAVE_SETTINGS',
          actorId,
          actorEmail,
          targetId: 'platform',
          details: `Updated platform settings: ${JSON.stringify(settings)}`,
          timestamp: new Date().toISOString(),
        });
      },
      transitionRequestStatus: async (reqId, newStatus, actionName, timelineMsg, actorEmail, actorId) => {
        const timelineEntry = {
          status: newStatus,
          title: timelineMsg,
          timestamp: new Date().toISOString(),
          details: `Updated by Super Admin ${actorEmail}`
        };
        const reqDocRef = doc(db, 'verificationRequests', reqId);
        const reqDoc = await getDoc(reqDocRef);
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || actorId;

        await updateDoc(reqDocRef, {
          status: newStatus,
          timeline: arrayUnion(timelineEntry)
        });
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: actionName,
          actorId,
          actorEmail,
          targetId: reqId,
          details: `${timelineMsg} (Request ID: ${reqId})`,
          timestamp: new Date().toISOString()
        });

        await addDoc(collection(db, 'activityLogs'), {
          requestId: reqId,
          type: newStatus,
          before: beforeStatus,
          after: newStatus,
          actor: actorEmail || 'Super Admin',
          ownerId,
          timestamp: new Date().toISOString(),
          credentialType: reqData.credentialType || 'Document',
          organizationName: reqData.organization?.name || 'Super Admin'
        });
      },
      deleteUser: async (userId, actorEmail, actorId) => {
        await deleteDoc(doc(db, 'users', userId));
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'DELETE_USER',
          actorId,
          actorEmail,
          targetId: userId,
          details: `Deleted user: ${userId}`,
          timestamp: new Date().toISOString(),
        });
      },
      deleteOrganization: async (orgId, actorEmail, actorId) => {
        await deleteDoc(doc(db, 'organizations', orgId));
        const logRef = doc(collection(db, 'auditLogs'));
        await setDoc(logRef, {
          action: 'DELETE_ORGANIZATION',
          actorId,
          actorEmail,
          targetId: orgId,
          details: `Deleted organization: ${orgId}`,
          timestamp: new Date().toISOString(),
        });
      },
      removeToast: (id) => {
        dispatch(removeToast(id));
      },
      setSelectedRequest: (request) => {
        setSelectedRequestId(request ? request.id : null);
      },
    }),
    [currentUser]
  );

  const stateContextValue = useMemo(() => ({
    ...state,
    selectedRequestId
  }), [state, selectedRequestId]);

  return (
    <VerificationStateContext.Provider value={stateContextValue}>
      <VerificationDispatchContext.Provider value={actions}>
        {children}
      </VerificationDispatchContext.Provider>
    </VerificationStateContext.Provider>
  );
}
