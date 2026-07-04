import { VERIFICATION_ACTION_TYPES } from './documentActions.js';
import {
  createDocumentId,
  VERIFICATION_STATUS,
  formatRequestDate,
  formatVerificationDate,
  generateDocumentHash,
  generateVerificationId,
  createTimelineEntry,
  MOCK_USER,
} from './documentUtils.js';

export function documentReducer(state, action) {
  switch (action.type) {
    case VERIFICATION_ACTION_TYPES.REQUEST_VERIFICATION: {
      const { credentialType, requestedOrganization, purpose, fileName } = action.payload;
      const requestDate = new Date();

      return {
        ...state,
        verificationRequests: [
          ...state.verificationRequests,
          {
            id: createDocumentId(),
            credentialType,
            requestedOrganization,
            purpose,
            fileName,
            requestDate: formatRequestDate(requestDate),
            status: VERIFICATION_STATUS.PENDING,
            owner: MOCK_USER,
            timeline: [
              createTimelineEntry('Verification Request Submitted', VERIFICATION_STATUS.PENDING, requestDate)
            ],
          },
        ],
      };
    }

    case VERIFICATION_ACTION_TYPES.APPROVE_VERIFICATION: {
      const verifiedAt = new Date();

      return {
        ...state,
        verificationRequests: state.verificationRequests.map((req) =>
          req.id === action.payload.verificationId
            ? {
                ...req,
                status: VERIFICATION_STATUS.APPROVED,
                verificationId: generateVerificationId(),
                verifiedAt: formatVerificationDate(verifiedAt),
                hash: generateDocumentHash(),
                timeline: [
                  ...req.timeline,
                  createTimelineEntry('Verification Approved by Organization', VERIFICATION_STATUS.APPROVED, verifiedAt)
                ],
              }
            : req,
        ),
      };
    }

    case VERIFICATION_ACTION_TYPES.REJECT_VERIFICATION: {
      const rejectedAt = new Date();

      return {
        ...state,
        verificationRequests: state.verificationRequests.map((req) =>
          req.id === action.payload.verificationId
            ? {
                ...req,
                status: VERIFICATION_STATUS.REJECTED,
                timeline: [
                  ...req.timeline,
                  createTimelineEntry('Verification Rejected by Organization', VERIFICATION_STATUS.REJECTED, rejectedAt)
                ],
              }
            : req,
        ),
      };
    }

    case VERIFICATION_ACTION_TYPES.REQUEST_MORE_INFORMATION: {
      const requestedAt = new Date();

      return {
        ...state,
        verificationRequests: state.verificationRequests.map((req) =>
          req.id === action.payload.verificationId
            ? {
                ...req,
                status: VERIFICATION_STATUS.INFORMATION_REQUESTED,
                timeline: [
                  ...req.timeline,
                  createTimelineEntry('More Information Requested by Organization', VERIFICATION_STATUS.INFORMATION_REQUESTED, requestedAt)
                ],
              }
            : req,
        ),
      };
    }

  default:
      return state;
  }
}
