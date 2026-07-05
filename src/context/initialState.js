import { organizationInboxRequests, userVerificationRequests } from '../data/sprintData.js';
import {
  createDocumentId,
  VERIFICATION_STATUS,
  formatVerificationDate,
  generateDocumentHash,
  generateVerificationId,
  createTimelineEntry,
} from './documentUtils.js';

const ORG_MAP = {
  'Northbridge University': { id: 'org-northbridge', name: 'Northbridge University', type: 'University' },
  'Apollo Hospitals': { id: 'org-apollo', name: 'Apollo Hospitals', type: 'Hospital' },
  'Infosys': { id: 'org-infosys', name: 'Infosys', type: 'Employer' },
};

function seedUserVerificationRequests(uid) {
  return userVerificationRequests.map((request, index) => {
    const status = request.status === 'Completed' ? VERIFICATION_STATUS.APPROVED : request.status;
    const isApproved = status === VERIFICATION_STATUS.APPROVED;
    const isRejected = status === VERIFICATION_STATUS.REJECTED;

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

    const org = ORG_MAP[request.requestedOrganization] || { id: 'org-northbridge', name: request.requestedOrganization, type: 'University' };

    return {
      id: createDocumentId(),
      credentialType: request.credentialType,
      requestedOrganization: request.requestedOrganization,
      organization: org,
      organizationId: org.id,
      purpose: request.purpose || 'Verification',
      fileName: `${request.credentialType.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      requestDate: request.requestDate,
      status: status,
      owner: {
        uid: uid || 'dev-user-uid',
        name: 'Development User',
        email: 'dev-user@localhost',
      },
      ownerId: uid || 'dev-user-uid',
      ownerName: 'Development User',
      ownerEmail: 'dev-user@localhost',
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

function seedOrganizationVerificationRequests(uid) {
  return organizationInboxRequests.map((request) => {
    const org = ORG_MAP[request.requestedOrganization] || { id: 'org-northbridge', name: request.requestedOrganization, type: 'University' };
    return {
      id: createDocumentId(),
      credentialType: request.credentialType,
      requestedOrganization: request.requestedOrganization,
      organization: org,
      organizationId: org.id,
      purpose: 'Verification',
      fileName: `${request.credentialType.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      requestDate: request.requestDate,
      status: VERIFICATION_STATUS.PENDING,
      owner: {
        uid: 'some-student-uid',
        name: request.requester,
        email: `${request.requester.toLowerCase().replace(/\s+/g, '')}@localhost`,
      },
      ownerId: 'some-student-uid',
      ownerName: request.requester,
      ownerEmail: `${request.requester.toLowerCase().replace(/\s+/g, '')}@localhost`,
      timeline: [
        createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, new Date(2026, 6, 1))
      ],
    };
  });
}

export function createInitialDocumentState(uid) {
  return {
    verificationRequests: [...seedUserVerificationRequests(uid), ...seedOrganizationVerificationRequests(uid)],
  };
}
