import { useContext, useMemo } from 'react';
import { VerificationStateContext } from '../context/DocumentProvider.jsx';
import { VERIFICATION_STATUS, MOCK_USER } from '../context/documentUtils.js';

export function useDocuments() {
  const state = useContext(VerificationStateContext);

  if (!state) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }

  return useMemo(() => {
    const userVerificationRequests = state.verificationRequests.filter(
      (req) => req.owner === MOCK_USER,
    );
    const pendingVerificationRequests = state.verificationRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.PENDING,
    );
    const approvedVerificationRequests = state.verificationRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.APPROVED,
    );
    const rejectedVerificationRequests = state.verificationRequests.filter(
      (req) => req.status === VERIFICATION_STATUS.REJECTED,
    );

    const getVerificationRequestById = (id) =>
      state.verificationRequests.find((req) => req.id === id);

    const getVerificationRequestByVerificationId = (verificationId) =>
      state.verificationRequests.find(
        (req) => req.verificationId === verificationId,
      );

    return {
      verificationRequests: state.verificationRequests,
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
  }, [state]);
}
