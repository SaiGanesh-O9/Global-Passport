import { useContext, useMemo } from 'react';
import { VerificationStateContext } from '../context/DocumentProvider.jsx';
import { VERIFICATION_STATUS, MOCK_USER } from '../context/documentUtils.js';
import { useAuth } from './useAuth.js';

export function useDocuments() {
  const state = useContext(VerificationStateContext);
  const { currentUser, userProfile } = useAuth();

  if (!state) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }

  return useMemo(() => {
    const isOrgVerifier = userProfile && userProfile.role === 'organization';
    const orgId = userProfile ? userProfile.organizationId : null;

    const filteredRequests = state.verificationRequests.filter((req) => {
      if (isOrgVerifier) {
        return req.organization && req.organization.id === orgId;
      }
      return true;
    });

    const userVerificationRequests = filteredRequests.filter((req) => {
      if (currentUser) {
        return (req.owner && req.owner.uid === currentUser.uid) || (req.ownerId === currentUser.uid);
      }
      return req.owner === MOCK_USER;
    });

    const pendingVerificationRequests = filteredRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.PENDING,
    );
    const approvedVerificationRequests = filteredRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.APPROVED,
    );
    const rejectedVerificationRequests = filteredRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.REJECTED,
    );

    const getVerificationRequestById = (id) =>
      filteredRequests.find((req) => req.id === id);

    const getVerificationRequestByVerificationId = (verificationId) =>
      filteredRequests.find(
        (req) => req.verificationId === verificationId,
      );

    return {
      verificationRequests: filteredRequests,
      loading: state.loading,
      userVerificationRequests,
      pendingVerificationRequests,
      approvedVerificationRequests,
      rejectedVerificationRequests,
      getVerificationRequestById,
      getVerificationRequestByVerificationId,
      metrics: {
        pending: pendingVerificationRequests.length,
        approved: approvedVerificationRequests.length,
        rejected: rejectedVerificationRequests.length,
      },
    };
  }, [state, currentUser, userProfile]);
}
