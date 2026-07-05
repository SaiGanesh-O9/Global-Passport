/**
 * Tool Router / Function Calling logic for UniCrypt AI Copilot.
 * Maps NLP requests to read operations on the compiled context.
 */

export function executePlatformTool(message, context) {
  const msgLower = message.toLowerCase();

  // 1. Tool: getCredentialVault
  if (msgLower.includes('show my verified documents') || msgLower.includes('my credential vault') || msgLower.includes('show my vault')) {
    return {
      toolName: 'getCredentialVault',
      result: context.credentials.map(c => ({
        type: c.type,
        status: c.status,
        expiresAt: c.expiresAt || 'Never'
      })),
      feedback: "Retrieved credentials vault records successfully."
    };
  }

  // 2. Tool: listPendingRequests
  if (msgLower.includes('pending requests') || msgLower.includes('applications needing review')) {
    const pending = context.verificationRequests.filter(r => r.status === 'Pending');
    return {
      toolName: 'listPendingRequests',
      result: pending.map(r => ({
        id: r.id,
        owner: r.ownerEmail || 'Anonymous',
        service: r.serviceName || r.credentialType,
        date: r.requestDate
      })),
      feedback: `Retrieved ${pending.length} pending request items.`
    };
  }

  // 3. Tool: getAuditLogs (Admin only)
  if (msgLower.includes('view overrides') || msgLower.includes('show today\'s overrides') || msgLower.includes('audit logs')) {
    if (context.role !== 'super_admin') {
      return {
        toolName: 'getAuditLogs',
        error: "Unauthorized: Role does not permit auditing override entries.",
        feedback: "Rejected unauthorized audit lookup."
      };
    }
    return {
      toolName: 'getAuditLogs',
      result: context.auditLogs.slice(0, 10),
      feedback: "Retrieved recent administrative overrides audit logs."
    };
  }

  // 4. Tool: searchOrganizations
  if (msgLower.includes('search organization') || msgLower.includes('find organization') || msgLower.includes('list active universities')) {
    const orgs = context.organizationProfiles.filter(p => p.status === 'Active');
    return {
      toolName: 'searchOrganizations',
      result: orgs.map(p => ({ name: p.name, category: p.category, website: p.website })),
      feedback: "Retrieved discovery directory organizations."
    };
  }

  // 5. Tool: getVerificationStatus
  if (msgLower.includes('request status') || msgLower.includes('verification status')) {
    return {
      toolName: 'getVerificationStatus',
      result: context.verificationRequests.map(r => ({ service: r.serviceName || r.credentialType, status: r.status, progress: r.progress || 0 })),
      feedback: "Retrieved active validation request progress."
    };
  }

  // No tool match
  return null;
}
