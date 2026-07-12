/**
 * UniCrypt Capability Registry (v1.0)
 * Handles permissions via role capabilities instead of hardcoded conditional logic.
 */

const ROLE_CAPABILITIES = {
  candidate: [
    'shareCredential',
    'compareOrganizations',
    'viewAuditTrail',
    'uploadDocument',
    'viewOwnProfile'
  ],
  institution: [
    'approveVerification',
    'rejectVerification',
    'requestChanges',
    'viewAuditTrail',
    'viewInstitutionDashboard'
  ],
  admin: [
    'approveVerification',
    'rejectVerification',
    'requestChanges',
    'viewAuditTrail',
    'viewAdminDashboard',
    'viewPlatformMetrics'
  ],
  super_admin: [
    'approveVerification',
    'rejectVerification',
    'requestChanges',
    'viewAuditTrail',
    'viewAdminDashboard',
    'viewPlatformMetrics',
    'deleteUsers',
    'resetPasswords',
    'suspendAccounts',
    'configureSystem'
  ]
};

export const hasCapability = (role, capability) => {
  if (!role) return false;
  const capabilities = ROLE_CAPABILITIES[role.toLowerCase()] || [];
  return capabilities.includes(capability);
};
