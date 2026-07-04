import { createContext, useMemo, useReducer, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, functions } from '../firebase/firebase.js';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth.js';
import {
  setVerificationRequests,
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
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(
    documentReducer,
    { verificationRequests: [], loading: true }
  );

  // Seed organizations collection if empty
  useEffect(() => {
    const unsubscribeOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
      if (snapshot.empty) {
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
      }
    }, (error) => {
      console.error("Organizations onSnapshot subscription permission error:", error);
    });
    return () => unsubscribeOrgs();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'verificationRequests'), (snapshot) => {
      if (snapshot.empty) {
        const initialRequests = createInitialDocumentState().verificationRequests;
        initialRequests.forEach(async (req) => {
          const { id, ...data } = req;
          await addDoc(collection(db, 'verificationRequests'), data);
        });
      } else {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        dispatch(setVerificationRequests(requests));
      }
    }, (error) => {
      console.error("Verification requests onSnapshot subscription permission error:", error);
    });

    return () => unsubscribe();
  }, []);

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
          purpose: payload.purpose,
          fileName: payload.fileName,
          files: payload.files || [],
          requestDate: formatRequestDate(requestDate),
          status: VERIFICATION_STATUS.PENDING,
          owner: {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            email: currentUser.email,
          },
          ownerId: currentUser.uid,
          ownerName: currentUser.displayName || currentUser.email.split('@')[0],
          ownerEmail: currentUser.email,
          timeline: [
            createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, requestDate)
          ],
        };

        if (payload.id) {
          await setDoc(doc(db, 'verificationRequests', payload.id), requestData);
        } else {
          await addDoc(collection(db, 'verificationRequests'), requestData);
        }
      },
      approveVerification: async (verificationId) => {
        const verifiedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Approved by Organization', VERIFICATION_STATUS.APPROVED, verifiedAt);
        try {
          const approveFn = httpsCallable(functions, 'approveVerification');
          await approveFn({
            requestId: verificationId,
            verificationId: generateVerificationId(),
            verifiedAt: formatVerificationDate(verifiedAt),
            hash: generateDocumentHash(),
            timelineEntry,
          });
        } catch (error) {
          console.warn("Cloud Function approveVerification failed, using client-side fallback:", error);
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
              details: `Approved verification request ${verificationId} (Fallback)`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      },
      rejectVerification: async (verificationId) => {
        const rejectedAt = new Date();
        const timelineEntry = createTimelineEntry('Verification Rejected by Organization', VERIFICATION_STATUS.REJECTED, rejectedAt);
        try {
          const rejectFn = httpsCallable(functions, 'rejectVerification');
          await rejectFn({
            requestId: verificationId,
            timelineEntry,
          });
        } catch (error) {
          console.warn("Cloud Function rejectVerification failed, using client-side fallback:", error);
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
              details: `Rejected verification request ${verificationId} (Fallback)`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      },
      requestMoreInformation: async (verificationId) => {
        const requestedAt = new Date();
        const timelineEntry = createTimelineEntry('More Information Requested by Organization', VERIFICATION_STATUS.INFORMATION_REQUESTED, requestedAt);
        try {
          const reqInfoFn = httpsCallable(functions, 'requestInformation');
          await reqInfoFn({
            requestId: verificationId,
            timelineEntry,
          });
        } catch (error) {
          console.warn("Cloud Function requestInformation failed, using client-side fallback:", error);
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
              details: `Requested additional information for request ${verificationId} (Fallback)`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      },
    }),
    [currentUser]
  );

  return (
    <VerificationStateContext.Provider value={state}>
      <VerificationDispatchContext.Provider value={actions}>
        {children}
      </VerificationDispatchContext.Provider>
    </VerificationStateContext.Provider>
  );
}
