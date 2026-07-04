export const MOCK_USER = 'Demo User';

export const DOCUMENT_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export function createDocumentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateVerificationId() {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VO-${segment}`;
}

export function generateDocumentHash() {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `0x${hex}...${Math.random().toString(16).slice(2, 6)}`;
}

export function formatUploadDate(date = new Date()) {
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
