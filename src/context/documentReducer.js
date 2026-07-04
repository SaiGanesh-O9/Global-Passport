import { DOCUMENT_ACTION_TYPES } from './documentActions.js';
import {
  createDocumentId,
  DOCUMENT_STATUS,
  formatUploadDate,
  formatVerificationDate,
  generateDocumentHash,
  generateVerificationId,
  MOCK_USER,
} from './documentUtils.js';

export function documentReducer(state, action) {
  switch (action.type) {
    case DOCUMENT_ACTION_TYPES.UPLOAD_DOCUMENT: {
      const { documentName, institution, documentType, fileName } = action.payload;
      const uploadedAt = new Date();

      return {
        ...state,
        documents: [
          ...state.documents,
          {
            id: createDocumentId(),
            documentName,
            institution,
            documentType,
            fileName,
            uploaded: formatUploadDate(uploadedAt),
            status: DOCUMENT_STATUS.PENDING,
            owner: MOCK_USER,
          },
        ],
      };
    }

    case DOCUMENT_ACTION_TYPES.APPROVE_DOCUMENT: {
      const verifiedAt = new Date();

      return {
        ...state,
        documents: state.documents.map((document) =>
          document.id === action.payload.documentId
            ? {
                ...document,
                status: DOCUMENT_STATUS.VERIFIED,
                verificationId: generateVerificationId(),
                verifiedAt: formatVerificationDate(verifiedAt),
                hash: generateDocumentHash(),
              }
            : document,
        ),
      };
    }

    case DOCUMENT_ACTION_TYPES.REJECT_DOCUMENT:
      return {
        ...state,
        documents: state.documents.map((document) =>
          document.id === action.payload.documentId
            ? { ...document, status: DOCUMENT_STATUS.REJECTED }
            : document,
        ),
      };

    default:
      return state;
  }
}
