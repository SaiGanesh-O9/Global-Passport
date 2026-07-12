import { createContext, useMemo, useReducer, useEffect, useRef, useState } from 'react';
import { db, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc, arrayUnion, query, where, orderBy, limit, getDoc } from '../firebase/firebase.js';
import { useAuth } from '../hooks/useAuth.js';
import { sendNotification } from '../services/notificationService.js';
import {
  setVerificationRequests,
  setOrganizations,
  setOrganizationProfiles,
  setVerificationServices,
  setCredentialTemplates,
  setCredentials,
  setDocuments,
  setUsers,
  setAuditLogs,
  setPlatformSettings,
  removeToast,
  setActivities,
} from './documentActions.js';
import { documentReducer } from './documentReducer.js';
import { createInitialDocumentState, defaultOrganizationProfiles } from './initialState.js';
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

const getInitialDemoState = () => ({
  verificationRequests: [
    {
      id: 'req-iowa-admission',
      organizationId: 'org-iowa',
      organizationName: 'Iowa State University',
      serviceId: 'service-iowa-degree',
      serviceName: 'Graduate Admissions matching',
      ownerEmail: 'student@localhost',
      status: 'Information Requested',
      progress: 72,
      requestDate: 'Jul 11, 2026',
      submittedDocuments: [
        { credentialId: 'cred-transcript-mock', documentId: 'doc-transcript-mock', type: 'Academic Transcript', fileName: 'academic-transcript.pdf' },
        { credentialId: 'cred-ielts-mock', documentId: 'doc-ielts-mock', type: 'English Proficiency Score', fileName: 'ielts-report.pdf' }
      ]
    }
  ],
  organizationProfiles: defaultOrganizationProfiles.filter(org => org.category === 'University' || org.category === 'Credential Agency'),
  verificationServices: [
    { id: 'service-iowa-degree', organizationId: 'org-iowa', name: 'Graduate Admissions matching', status: 'Published' }
  ],
  credentialTemplates: [
    { id: 'template-iowa', serviceId: 'service-iowa-degree', requiredCredentials: [{ type: 'Academic Transcript' }, { type: 'Passport' }] }
  ],
  credentials: [
    { id: 'cred-transcript-mock', type: 'Academic Transcript', ownerEmail: 'student@localhost', status: 'Approved', verifiedAt: 'Jul 11, 2026', verifiedBy: 'Northbridge University', expiresAt: 'Jul 11, 2030', isReusable: true },
    { id: 'cred-ielts-mock', type: 'English Proficiency Score', ownerEmail: 'student@localhost', status: 'Approved', verifiedAt: 'Jul 10, 2026', verifiedBy: 'British Council', expiresAt: 'Jul 10, 2029', isReusable: true },
    { id: 'cred-resume-mock', type: 'Professional Resume', ownerEmail: 'student@localhost', status: 'Approved', verifiedAt: 'Jul 09, 2026', verifiedBy: 'Self-issued', expiresAt: 'Jul 09, 2028', isReusable: true }
  ],
  documents: [
    { id: 'doc-transcript-mock', credentialId: 'cred-transcript-mock', fileName: 'academic-transcript.pdf', version: 1, uploadedAt: 'Jul 11, 2026', uploadMode: 'local', storageStatus: 'disabled' },
    { id: 'doc-ielts-mock', credentialId: 'cred-ielts-mock', fileName: 'ielts-report.pdf', version: 1, uploadedAt: 'Jul 10, 2026', uploadMode: 'local', storageStatus: 'disabled' },
    { id: 'doc-resume-mock', credentialId: 'cred-resume-mock', fileName: 'resume-2026.pdf', version: 1, uploadedAt: 'Jul 09, 2026', uploadMode: 'local', storageStatus: 'disabled' }
  ],
  activities: [
    { id: 'act-1', type: 'Approved', title: 'Academic Transcript Verified', desc: 'Accreditation ledger registry matched Northbridge Academic Transcript with 100% confidence.', timestamp: 'Jul 11, 2026' },
    { id: 'act-2', type: 'Approved', title: 'IELTS Score Card Verified', desc: 'British Council registry validated English competency minimum parameters.', timestamp: 'Jul 10, 2026' }
  ],
  users: [
    { id: 'usr-1', email: 'student@localhost', name: 'John Doe', role: 'student', status: 'Active' },
    { id: 'usr-2', email: 'admin@localhost', name: 'Admin Jane', role: 'super_admin', status: 'Active' }
  ],
  organizations: defaultOrganizationProfiles.filter(org => org.category === 'University' || org.category === 'Credential Agency').map(org => ({
    id: org.id,
    organizationId: org.id,
    name: org.name,
    type: org.category || 'University',
    status: org.status || 'Active',
    verificationStatus: 'Verified',
    website: org.website || '',
    officialEmailDomain: org.contactEmail ? org.contactEmail.split('@')[1] : ''
  })),
  auditLogs: [],
  platformSettings: { allowNewRegistrations: true, maintenanceMode: false, requireVerificationReview: true },
  loading: false,
  ready: true,
  toasts: []
});

export function DocumentProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [demoState, setDemoState] = useState(() => getInitialDemoState());

  useEffect(() => {
    const handleUpload = (e) => {
      const { fileName, fileUrl } = e.detail;
      setDemoState(prev => {
        const nextDocs = [...prev.documents, {
          id: 'doc-passport-mock',
          credentialId: 'cred-passport-mock',
          fileName,
          fileUrl,
          version: 1,
          uploadedAt: new Date().toLocaleDateString(),
          uploadMode: 'local',
          storageStatus: 'disabled'
        }];
        
        const nextCreds = [...prev.credentials, {
          id: 'cred-passport-mock',
          type: 'Passport',
          ownerEmail: 'student@localhost',
          status: 'Approved',
          verifiedAt: new Date().toLocaleDateString(),
          verifiedBy: 'Government Clearinghouse',
          expiresAt: 'Jul 11, 2036',
          isReusable: true
        }];

        const nextRequests = prev.verificationRequests.map(req => {
          if (req.id === 'req-iowa-admission') {
            return {
              ...req,
              status: 'Approved',
              progress: 96,
              submittedDocuments: [
                ...req.submittedDocuments,
                { credentialId: 'cred-passport-mock', documentId: 'doc-passport-mock', type: 'Passport', fileName }
              ]
            };
          }
          return req;
        });

        const nextActivities = [
          {
            id: `act-${Date.now()}`,
            type: 'Approved',
            title: 'Passport Verified',
            desc: 'Government identity clearinghouse registry matched digital signatures.',
            timestamp: new Date().toLocaleDateString()
          },
          ...prev.activities
        ];

        return {
          ...prev,
          documents: nextDocs,
          credentials: nextCreds,
          verificationRequests: nextRequests,
          activities: nextActivities
        };
      });
    };

    const handleReset = () => {
      setDemoState(getInitialDemoState());
    };

    window.addEventListener('unicrypt-demo-upload', handleUpload);
    window.addEventListener('unicrypt-demo-reset', handleReset);
    return () => {
      window.removeEventListener('unicrypt-demo-upload', handleUpload);
      window.removeEventListener('unicrypt-demo-reset', handleReset);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientEmail', '==', currentUser.email),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setNotifications(list);
    }, (err) => {
      console.warn("Central notifications subscription error:", err.message);
    });
    return () => unsub();
  }, [currentUser]);

  const [state, dispatch] = useReducer(
    documentReducer,
    {
      verificationRequests: [],
      organizations: [],
      organizationProfiles: [],
      verificationServices: [],
      credentialTemplates: [],
      credentials: [],
      documents: [],
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

    const unsubscribeOrgs = onSnapshot(collection(db, 'organizations'), async (snapshot) => {
      const existingIds = new Set();
      snapshot.forEach(doc => existingIds.add(doc.id));

      const missingOrgs = defaultOrganizationProfiles.filter(org => !existingIds.has(org.id));

      if (missingOrgs.length > 0) {
        try {
          for (const org of missingOrgs) {
            const orgDoc = {
              organizationId: org.id,
              name: org.name,
              type: org.category || org.type || 'University',
              status: org.status || 'Active',
              verificationStatus: 'Verified',
              website: org.website || '',
              officialEmailDomain: org.contactEmail ? org.contactEmail.split('@')[1] : '',
              logoUrl: null,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'organizations', org.id), orgDoc);
          }

          const { verificationServices, credentialTemplates, credentials, documents } = createInitialDocumentState(currentUser.uid);
          
          for (const prof of defaultOrganizationProfiles) {
            await setDoc(doc(db, 'organizationProfiles', prof.id), prof);
          }

          for (const service of verificationServices) {
            await setDoc(doc(db, 'verificationServices', service.id), service);
          }

          for (const template of credentialTemplates) {
            await setDoc(doc(db, 'credentialTemplates', template.id), template);
          }

          for (const cred of credentials) {
            await setDoc(doc(db, 'credentials', cred.id), cred);
          }

          for (const docItem of documents) {
            await setDoc(doc(db, 'documents', docItem.id), docItem);
          }
        } catch (seedErr) {
          console.warn("Seeding missing database items failed:", seedErr.message);
        }
      }

      const orgs = [];
      snapshot.forEach((docItem) => {
        orgs.push({ id: docItem.id, ...docItem.data() });
      });
      dispatch(setOrganizations(orgs));
    }, (error) => {
      console.error("Organizations onSnapshot subscription error:", error);
    });

    return () => unsubscribeOrgs();
  }, [currentUser, userProfile]);

  // 1.2. Live Organization Profiles subscription
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const unsub = onSnapshot(collection(db, 'organizationProfiles'), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      dispatch(setOrganizationProfiles(list));
    }, (err) => console.error("Profiles listener error:", err));
    return () => unsub();
  }, [currentUser, userProfile]);

  // 1.3. Live Verification Services subscription
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const unsub = onSnapshot(collection(db, 'verificationServices'), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      dispatch(setVerificationServices(list));
    }, (err) => console.error("Services listener error:", err));
    return () => unsub();
  }, [currentUser, userProfile]);

  // 1.4. Live Credential Templates subscription
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const unsub = onSnapshot(collection(db, 'credentialTemplates'), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      dispatch(setCredentialTemplates(list));
    }, (err) => console.error("Templates listener error:", err));
    return () => unsub();
  }, [currentUser, userProfile]);

  // 1.5. Live Credentials subscription
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    let q;
    if (userProfile.role === 'super_admin' || userProfile.role === 'organization') {
      q = collection(db, 'credentials');
    } else {
      q = query(collection(db, 'credentials'), where('ownerEmail', '==', userProfile.email || currentUser.email || 'student@localhost'));
    }
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      dispatch(setCredentials(list));
    }, (err) => console.error("Credentials listener error:", err));
    return () => unsub();
  }, [currentUser, userProfile]);

  // 1.6. Live Documents subscription
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const unsub = onSnapshot(collection(db, 'documents'), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      dispatch(setDocuments(list));
    }, (err) => console.error("Documents listener error:", err));
    return () => unsub();
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
        where('ownerEmail', '==', userProfile.email || currentUser.email)
      );
    }

    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        if (userProfile.role === 'super_admin' || userProfile.role === 'student') {
          const initialRequests = createInitialDocumentState(currentUser.uid).verificationRequests;
          initialRequests.forEach(async (req) => {
            const data = { ...req };
            delete data.id;
            const mappedData = {
              ...data,
              ownerEmail: userProfile.email || currentUser.email || 'student@localhost',
              ownerId: currentUser.uid,
            };
            await addDoc(collection(db, 'verificationRequests'), mappedData);
          });
        }
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
          timeline: state.verificationRequests.find(r => r.id === payload.id)?.timeline
            ? [
                ...state.verificationRequests.find(r => r.id === payload.id).timeline,
                createTimelineEntry('Document Uploaded & Request Submitted', VERIFICATION_STATUS.PENDING, requestDate)
              ]
            : [
                createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, requestDate)
              ],
        };

        const requestRef = payload.id ? doc(db, 'verificationRequests', payload.id) : doc(collection(db, 'verificationRequests'));
        const genId = requestRef.id;
        const finalRequestData = { ...requestData, id: genId };

        try {
          await setDoc(requestRef, finalRequestData);

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
          
          await sendNotification(currentUser.uid, currentUser.email, 'VERIFICATION_SUBMITTED', {
            requestId: genId,
            organizationName: payload.organization.name,
            serviceName: payload.credentialType
          });

          await sendNotification(payload.organization.id, `${payload.organization.id}@localhost`, 'NEW_REQUEST_ALERT', {
            requestId: genId,
            organizationName: payload.organization.name,
            serviceName: payload.credentialType,
            recipientName: currentUser.displayName || currentUser.email?.split('@')[0]
          });
        } catch (dbErr) {
          console.warn("Firestore save failed, falling back to local memory update:", dbErr.message);
          dispatch({
            type: 'REQUEST_VERIFICATION',
            payload: { request: finalRequestData }
          });
        }
      },
      approveVerification: async (verificationId) => {
        const verifiedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Approved by Organization', VERIFICATION_STATUS.APPROVED, verifiedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        try {
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

          await sendNotification(ownerId, reqData.ownerEmail || 'student@localhost', 'VERIFICATION_APPROVED', {
            requestId: verificationId,
            organizationName: reqData.organization?.name || 'UniCrypt Hub',
            serviceName: reqData.credentialType || 'Document'
          });
        } catch (dbErr) {
          console.warn("Firestore approve failed, falling back to local memory update:", dbErr.message);
          dispatch({
            type: 'APPROVE_VERIFICATION',
            payload: { verificationId }
          });
        }
      },
      rejectVerification: async (verificationId) => {
        const rejectedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Rejected by Organization', VERIFICATION_STATUS.REJECTED, rejectedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        try {
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

          await sendNotification(ownerId, reqData.ownerEmail || 'student@localhost', 'VERIFICATION_REJECTED', {
            requestId: verificationId,
            organizationName: reqData.organization?.name || 'UniCrypt Hub',
            serviceName: reqData.credentialType || 'Document',
            reason: 'Submitted details do not match credentials.'
          });
        } catch (dbErr) {
          console.warn("Firestore reject failed, falling back to local memory update:", dbErr.message);
          dispatch({
            type: 'REJECT_VERIFICATION',
            payload: { verificationId }
          });
        }
      },
      requestMoreInformation: async (verificationId) => {
        const requestedAt = new Date();
        const timelineEntry = createTimelineEntry('More Information Requested by Organization', VERIFICATION_STATUS.INFORMATION_REQUESTED, requestedAt);
        const reqDoc = await getDoc(doc(db, 'verificationRequests', verificationId));
        const reqData = reqDoc.exists() ? reqDoc.data() : {};
        const beforeStatus = reqData.status || 'Pending';
        const ownerId = reqData.ownerId || currentUser.uid;

        try {
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

          await sendNotification(ownerId, reqData.ownerEmail || 'student@localhost', 'INFO_REQUESTED', {
            requestId: verificationId,
            organizationName: reqData.organization?.name || 'UniCrypt Hub',
            serviceName: reqData.credentialType || 'Document'
          });
        } catch (dbErr) {
          console.warn("Firestore requestMoreInfo failed, falling back to local memory update:", dbErr.message);
          dispatch({
            type: 'REQUEST_MORE_INFORMATION',
            payload: { verificationId }
          });
        }
      },
      requestDocumentFromUser: async (payload) => {
        if (!currentUser) {
          throw new Error('Verifier must be authenticated to request a document.');
        }

        const requestDate = new Date();
        const requestData = {
          credentialType: payload.credentialType,
          organization: {
            id: userProfile.organizationId || 'org-northbridge',
            name: userProfile.organizationName || 'Northbridge University',
            type: 'University',
          },
          organizationId: userProfile.organizationId || 'org-northbridge',
          purpose: payload.purpose,
          fileName: '',
          files: [],
          uploadMode: 'cloud',
          storageStatus: 'enabled',
          requestDate: formatRequestDate(requestDate),
          status: VERIFICATION_STATUS.INFORMATION_REQUESTED,
          owner: {
            uid: `requested-user-${Date.now()}`,
            name: payload.userEmail.split('@')[0],
            email: payload.userEmail,
          },
          ownerId: `requested-user-${Date.now()}`,
          ownerName: payload.userEmail.split('@')[0],
          ownerEmail: payload.userEmail,
          timeline: [
            createTimelineEntry('Document Verification Requested by Organization', VERIFICATION_STATUS.INFORMATION_REQUESTED, requestDate)
          ],
        };

        const requestRef = doc(collection(db, 'verificationRequests'));
        const genId = requestRef.id;
        const finalRequestData = { ...requestData, id: genId };

        try {
          await setDoc(requestRef, finalRequestData);
          await addDoc(collection(db, 'activityLogs'), {
            requestId: genId,
            type: 'Information Requested',
            before: 'None',
            after: 'Information Requested',
            actor: currentUser.email || 'Verifier',
            ownerId: finalRequestData.ownerId,
            timestamp: new Date().toISOString(),
            credentialType: payload.credentialType,
            organizationName: userProfile.organizationName || 'Northbridge University',
            title: 'Document Requested',
            desc: `Requested ${payload.credentialType} from ${payload.userEmail}.`
          });
        } catch (dbErr) {
          console.warn("Firestore save failed, falling back to local memory update:", dbErr.message);
          dispatch({
            type: 'REQUEST_VERIFICATION',
            payload: { request: finalRequestData }
          });
        }
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

        await sendNotification(ownerId, reqData.ownerEmail || 'student@localhost', 'ADMIN_OVERRIDE_ALERT', {
          requestId: reqId,
          organizationName: reqData.organization?.name || 'Super Admin',
          serviceName: reqData.credentialType || 'Document',
          status: newStatus
        });
      },
      createVerificationService: async (serviceId, serviceData) => {
        await setDoc(doc(db, 'verificationServices', serviceId), serviceData);
      },
      updateVerificationService: async (serviceId, updates) => {
        await updateDoc(doc(db, 'verificationServices', serviceId), updates);
      },
      deleteVerificationService: async (serviceId) => {
        await deleteDoc(doc(db, 'verificationServices', serviceId));
        await deleteDoc(doc(db, 'credentialTemplates', `template-${serviceId}`));
      },
      saveCredentialTemplate: async (templateId, templateData) => {
        await setDoc(doc(db, 'credentialTemplates', templateId), templateData);
      },
      saveOrganizationProfile: async (profileId, profileData) => {
        await setDoc(doc(db, 'organizationProfiles', profileId), profileData);
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
        await deleteDoc(doc(db, 'organizationProfiles', orgId));
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
    ...demoState,
    notifications,
    selectedRequestId
  }), [demoState, notifications, selectedRequestId]);

  return (
    <VerificationStateContext.Provider value={stateContextValue}>
      <VerificationDispatchContext.Provider value={actions}>
        {children}
      </VerificationDispatchContext.Provider>
    </VerificationStateContext.Provider>
  );
}
