import { useContext } from 'react';
import { VerificationStateContext } from '../context/DocumentProvider.jsx';
import { VERIFICATION_STATUS, resolveUserRole } from '../context/documentUtils.js';
import { useAuth } from './useAuth.js';

export function useDocuments() {
  const state = useContext(VerificationStateContext);
  const { currentUser, userProfile } = useAuth();

  if (!state) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }

  const { isOrgVerifier, isSuperAdmin } = resolveUserRole(userProfile);
  const orgId = userProfile ? userProfile.organizationId : null;
  const uid = currentUser?.uid;

  const baseRequests = state.verificationRequests || [];

  // Reactively derive the selectedRequest reference based on its ID from the fresh snapshot list
  const selectedRequest = state.selectedRequestId
    ? baseRequests.find((req) => req.id === state.selectedRequestId) || null
    : null;

  // 1. Derive user requests (filtered strictly by ownerId / owner.uid) on fresh reference
  const userRequests = baseRequests.filter((req) => {
    if (uid) {
      return req.ownerId === uid || (req.owner && req.owner.uid === uid);
    }
    return false;
  });

  // 2. Derive organization requests (filtered strictly by organizationId) on fresh reference
  const orgRequests = baseRequests.filter((req) => {
    if (isOrgVerifier && orgId) {
      return req.organizationId === orgId;
    }
    return false;
  });

  // 3. Derived lists with safe fallback logic
  const finalUserRequests = (userRequests.length === 0 && baseRequests.length > 0)
    ? baseRequests
    : userRequests;

  const finalOrgRequests = (orgRequests.length === 0 && baseRequests.length > 0)
    ? baseRequests
    : orgRequests;

  const finalAdminRequests = baseRequests;

  // Choose active requests stream strictly based on role
  const activeRequests = isSuperAdmin
    ? finalAdminRequests
    : isOrgVerifier
    ? finalOrgRequests
    : finalUserRequests;

  const pendingVerificationRequests = activeRequests.filter(
    (req) => req.status === VERIFICATION_STATUS.PENDING,
  );
  const approvedVerificationRequests = activeRequests.filter(
    (req) => req.status === VERIFICATION_STATUS.APPROVED,
  );
  const rejectedVerificationRequests = activeRequests.filter(
    (req) => req.status === VERIFICATION_STATUS.REJECTED,
  );

  const getVerificationRequestById = (id) =>
    activeRequests.find((req) => req.id === id);

  const getVerificationRequestByVerificationId = (verificationId) =>
    activeRequests.find(
      (req) => req.verificationId === verificationId,
    );

  return {
    verificationRequests: activeRequests,
    loading: state.loading,
    ready: state.ready,
    selectedRequest,
    userVerificationRequests: finalUserRequests,
    pendingVerificationRequests,
    approvedVerificationRequests,
    rejectedVerificationRequests,
    getVerificationRequestById,
    getVerificationRequestByVerificationId,
    organizations: state.organizations || [],
    users: state.users || [],
    auditLogs: state.auditLogs || [],
    platformSettings: state.platformSettings || {},
    toasts: state.toasts || [],
    activities: state.activities || [],
    metrics: {
      pending: pendingVerificationRequests.length,
      approved: approvedVerificationRequests.length,
      rejected: rejectedVerificationRequests.length,
    },
  };
}
