export const VERIFICATION_ACTION_TYPES = {
  REQUEST_VERIFICATION: 'REQUEST_VERIFICATION',
  APPROVE_VERIFICATION: 'APPROVE_VERIFICATION',
  REJECT_VERIFICATION: 'REJECT_VERIFICATION',
  REQUEST_MORE_INFORMATION: 'REQUEST_MORE_INFORMATION',
  SET_VERIFICATION_REQUESTS: 'SET_VERIFICATION_REQUESTS',
  SET_ORGANIZATIONS: 'SET_ORGANIZATIONS',
  SET_USERS: 'SET_USERS',
  SET_AUDIT_LOGS: 'SET_AUDIT_LOGS',
  SET_PLATFORM_SETTINGS: 'SET_PLATFORM_SETTINGS',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  SET_ACTIVITIES: 'SET_ACTIVITIES',
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

export function setVerificationRequests(requests) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_VERIFICATION_REQUESTS,
    payload: { requests },
  };
}

export function setOrganizations(organizations) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_ORGANIZATIONS,
    payload: { organizations },
  };
}

export function setUsers(users) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_USERS,
    payload: { users },
  };
}

export function setAuditLogs(auditLogs) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_AUDIT_LOGS,
    payload: { auditLogs },
  };
}

export function setPlatformSettings(platformSettings) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_PLATFORM_SETTINGS,
    payload: { platformSettings },
  };
}

export function removeToast(id) {
  return {
    type: VERIFICATION_ACTION_TYPES.REMOVE_TOAST,
    payload: { id },
  };
}

export function setActivities(activities) {
  return {
    type: VERIFICATION_ACTION_TYPES.SET_ACTIVITIES,
    payload: { activities },
  };
}
