export const MOCK_USER = 'Demo User';

export const VERIFICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INFORMATION_REQUESTED: 'Information Requested',
};

export const SHAREABLE_STATUSES = [
  VERIFICATION_STATUS.APPROVED,
];

export function createDocumentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateVerificationId() {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VF-${segment}`;
}

export function generateDocumentHash() {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `0x${hex}...${Math.random().toString(16).slice(2, 6)}`;
}

export function formatRequestDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function formatVerificationDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}

export function createHistoryEntry(event, actor, date = new Date()) {
  return {
    date: formatVerificationDate(date),
    event,
    actor,
  };
}

export function createTimelineEntry(label, status, date = new Date()) {
  return {
    date: formatRequestDate(date),
    label,
    status,
  };
}

export function isShareableStatus(status) {
  return SHAREABLE_STATUSES.includes(status);
}

export function resolveUserRole(userProfile) {
  if (!userProfile) return { isSuperAdmin: false, isOrgVerifier: false, isStudent: false };
  const role = userProfile.role;
  return {
    isSuperAdmin: role === 'super_admin',
    isOrgVerifier: role === 'organization',
    isStudent: role === 'student' || role === 'employer',
  };
}
