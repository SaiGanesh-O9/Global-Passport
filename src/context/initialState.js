import { organizationInboxRequests, userVerificationRequests } from '../data/sprintData.js';
import {
  createDocumentId,
  VERIFICATION_STATUS,
  formatVerificationDate,
  generateDocumentHash,
  generateVerificationId,
  createTimelineEntry,
  MOCK_USER,
} from './documentUtils.js';

function seedUserVerificationRequests() {
  return userVerificationRequests.map((request, index) => {
    // Map 'Completed' seed status to 'Approved'
    const status = request.status === 'Completed' ? VERIFICATION_STATUS.APPROVED : request.status;
    const isApproved = status === VERIFICATION_STATUS.APPROVED;
    const isRejected = status === VERIFICATION_STATUS.REJECTED;

    // Timeline setup
    const timeline = [
      createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, new Date(2026, 5, 28))
    ];

    if (isApproved) {
      timeline.push(
        createTimelineEntry('Verification Approved by Organization', VERIFICATION_STATUS.APPROVED, new Date(2026, 6, 4))
      );
    } else if (isRejected) {
      timeline.push(
        createTimelineEntry('Verification Rejected by Organization', VERIFICATION_STATUS.REJECTED, new Date(2026, 6, 4))
      );
    }

    return {
      id: createDocumentId(),
      credentialType: request.credentialType,
      requestedOrganization: request.requestedOrganization,
      purpose: request.purpose || 'Verification',
      fileName: `${request.credentialType.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      requestDate: request.requestDate,
      status: status,
      owner: MOCK_USER,
      timeline,
      ...(isApproved
        ? {
            verificationId: index === 0 ? 'VF-8F4291' : generateVerificationId(),
            verifiedAt: formatVerificationDate(new Date(2026, 6, 4)),
            hash: index === 0 ? '0x8f42...91bd' : generateDocumentHash(),
          }
        : {}),
    };
  });
}

function seedOrganizationVerificationRequests() {
  return organizationInboxRequests.map((request) => ({
    id: createDocumentId(),
    credentialType: request.credentialType,
    requestedOrganization: request.requestedOrganization,
    purpose: 'Verification',
    fileName: `${request.credentialType.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    requestDate: request.requestDate,
    status: VERIFICATION_STATUS.PENDING,
    owner: request.requester,
    timeline: [
      createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, new Date(2026, 6, 1))
    ],
  }));
}

export function createInitialDocumentState() {
  return {
    verificationRequests: [...seedUserVerificationRequests(), ...seedOrganizationVerificationRequests()],
  };
}
