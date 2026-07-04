import { institutionRequests, userDocuments } from '../data/sprintData.js';
import {
  createDocumentId,
  DOCUMENT_STATUS,
  formatUploadDate,
  formatVerificationDate,
  generateDocumentHash,
  generateVerificationId,
  MOCK_USER,
} from './documentUtils.js';

function seedUserDocuments() {
  return userDocuments.map((document, index) => {
    const isVerified = document.status === DOCUMENT_STATUS.VERIFIED;

    return {
      id: createDocumentId(),
      documentName: document.document,
      institution: document.institution,
      documentType: 'Other',
      fileName: `${document.document.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      uploaded: document.uploaded,
      status: document.status,
      owner: MOCK_USER,
      ...(isVerified
        ? {
            verificationId: index === 0 ? 'VO-8F4291' : generateVerificationId(),
            verifiedAt: formatVerificationDate(new Date(2026, 6, 4)),
            hash: index === 0 ? '0x8f42...91bd' : generateDocumentHash(),
          }
        : {}),
    };
  });
}

function seedInstitutionRequests() {
  return institutionRequests.map((request) => ({
    id: createDocumentId(),
    documentName: request.document,
    institution: request.institution,
    documentType: 'Other',
    fileName: `${request.document.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    uploaded: request.uploadedDate,
    status: DOCUMENT_STATUS.PENDING,
    owner: request.student,
  }));
}

export function createInitialDocumentState() {
  return {
    documents: [...seedUserDocuments(), ...seedInstitutionRequests()],
  };
}
