export const VERIFICATION_ACTION_TYPES = {
  REQUEST_VERIFICATION: 'REQUEST_VERIFICATION',
  APPROVE_VERIFICATION: 'APPROVE_VERIFICATION',
  REJECT_VERIFICATION: 'REJECT_VERIFICATION',
  REQUEST_MORE_INFORMATION: 'REQUEST_MORE_INFORMATION',
};

export function requestVerification(payload) {
  return {
    type: VERIFICATION_ACTION_TYPES.REQUEST_VERIFICATION,
    payload,
  };
}

export function approveVerification(verificationId) {
  return {
    type: VERIFICATION_ACTION_TYPES.APPROVE_VERIFICATION,
    payload: { verificationId },
  };
}

export function rejectVerification(verificationId) {
  return {
    type: VERIFICATION_ACTION_TYPES.REJECT_VERIFICATION,
    payload: { verificationId },
  };
}

export function requestMoreInformation(verificationId) {
  return {
    type: VERIFICATION_ACTION_TYPES.REQUEST_MORE_INFORMATION,
    payload: { verificationId },
  };
}
