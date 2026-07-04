export const DOCUMENT_ACTION_TYPES = {
  UPLOAD_DOCUMENT: 'UPLOAD_DOCUMENT',
  APPROVE_DOCUMENT: 'APPROVE_DOCUMENT',
  REJECT_DOCUMENT: 'REJECT_DOCUMENT',
};

export function uploadDocument(payload) {
  return {
    type: DOCUMENT_ACTION_TYPES.UPLOAD_DOCUMENT,
    payload,
  };
}

export function approveDocument(documentId) {
  return {
    type: DOCUMENT_ACTION_TYPES.APPROVE_DOCUMENT,
    payload: { documentId },
  };
}

export function rejectDocument(documentId) {
  return {
    type: DOCUMENT_ACTION_TYPES.REJECT_DOCUMENT,
    payload: { documentId },
  };
}
