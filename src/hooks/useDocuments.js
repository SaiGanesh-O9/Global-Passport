import { useContext, useMemo } from 'react';
import { DocumentStateContext } from '../context/DocumentProvider.jsx';
import { DOCUMENT_STATUS, MOCK_USER } from '../context/documentUtils.js';

export function useDocuments() {
  const state = useContext(DocumentStateContext);

  if (!state) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }

  return useMemo(() => {
    const userDocuments = state.documents.filter(
      (document) => document.owner === MOCK_USER,
    );
    const pendingDocuments = state.documents.filter(
      (document) => document.status === DOCUMENT_STATUS.PENDING,
    );
    const verifiedDocuments = state.documents.filter(
      (document) => document.status === DOCUMENT_STATUS.VERIFIED,
    );
    const rejectedDocuments = state.documents.filter(
      (document) => document.status === DOCUMENT_STATUS.REJECTED,
    );

    const getDocumentById = (documentId) =>
      state.documents.find((document) => document.id === documentId);

    const getDocumentByVerificationId = (verificationId) =>
      state.documents.find(
        (document) => document.verificationId === verificationId,
      );

    return {
      documents: state.documents,
      userDocuments,
      pendingDocuments,
      verifiedDocuments,
      rejectedDocuments,
      getDocumentById,
      getDocumentByVerificationId,
      metrics: {
        pending: pendingDocuments.length,
        verified: verifiedDocuments.length,
        rejected: rejectedDocuments.length,
      },
    };
  }, [state]);
}
