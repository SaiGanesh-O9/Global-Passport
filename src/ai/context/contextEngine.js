/**
 * Centrally compiles role-aware context payloads for the AI Copilot.
 * Ensures strict security permissions:
 * - Students can only access their own profile, requests, and vault.
 * - Organizations can only access requests, services, and templates belonging to their org ID.
 * - Admins have platform-wide visibility.
 */
export function compileAIContext(currentUser, userProfile, state, currentScreen) {
  const role = userProfile?.role || 'student';
  const email = userProfile?.email || currentUser?.email || 'student@localhost';
  const orgId = userProfile?.organizationId || '';

  // Initialize context data structure
  let context = {
    role,
    email,
    currentScreen,
    profile: {
      name: userProfile?.name || 'Development User',
      email: email,
      role: role
    },
    verificationRequests: [],
    credentials: [],
    documents: [],
    organizationProfiles: [],
    verificationServices: [],
    credentialTemplates: [],
    auditLogs: [],
    activityLogs: [],
    notifications: []
  };

  // Enforce security boundaries
  if (role === 'super_admin') {
    // Admin has platform-wide visibility
    context.verificationRequests = state.verificationRequests || [];
    context.credentials = state.credentials || [];
    context.documents = state.documents || [];
    context.organizationProfiles = state.organizationProfiles || [];
    context.verificationServices = state.verificationServices || [];
    context.credentialTemplates = state.credentialTemplates || [];
    context.auditLogs = state.auditLogs || [];
    context.activityLogs = state.activities || [];
    context.notifications = state.notifications || [];
  } else if (role === 'organization') {
    // Verifier is restricted to their own organization ID
    context.verificationRequests = (state.verificationRequests || []).filter(r => r.organizationId === orgId);
    context.verificationServices = (state.verificationServices || []).filter(s => s.organizationId === orgId);
    
    const serviceIds = context.verificationServices.map(s => s.id);
    context.credentialTemplates = (state.credentialTemplates || []).filter(t => serviceIds.includes(t.serviceId));
    
    // Restricted credential metadata visibility (only for requests sent to their org)
    const allowedCredIds = context.verificationRequests.flatMap(r => (r.documentReferences || []).map(ref => ref.credentialId));
    context.credentials = (state.credentials || []).filter(c => allowedCredIds.includes(c.id));
    context.documents = (state.documents || []).filter(d => allowedCredIds.includes(d.credentialId));
    
    context.organizationProfiles = (state.organizationProfiles || []).filter(p => p.id === orgId);
    context.activityLogs = (state.activities || []).filter(act => act.organizationName === userProfile?.organizationName);
    context.notifications = (state.notifications || []).filter(n => n.recipientId === orgId || n.recipientEmail === email);
  } else {
    // Students can only access their own profile and records
    context.verificationRequests = (state.verificationRequests || []).filter(r => r.ownerEmail === email);
    context.credentials = (state.credentials || []).filter(c => c.ownerEmail === email);
    
    const allowedCredIds = context.credentials.map(c => c.id);
    context.documents = (state.documents || []).filter(d => allowedCredIds.includes(d.credentialId));
    
    // Only show active organization profiles in discovery
    context.organizationProfiles = (state.organizationProfiles || []).filter(p => p.status === 'Active');
    context.verificationServices = state.verificationServices || [];
    context.credentialTemplates = state.credentialTemplates || [];
    context.activityLogs = (state.activities || []).filter(act => act.ownerId === currentUser?.uid);
    context.notifications = (state.notifications || []).filter(n => n.recipientEmail === email);
  }

  return context;
}

/**
 * Serializes the context payload into a clear structured markdown text
 * for use in LLM system prompt setups.
 */
export function serializeContextToMarkdown(context) {
  if (!context) return "";
  let md = `=== SYSTEM CONTEXT ===\n`;
  md += `- **Current User**: ${context.profile?.name || 'Anonymous'} (${context.profile?.email || 'N/A'})\n`;
  md += `- **Role/Permissions**: ${context.role.toUpperCase()}\n`;
  md += `- **Active Screen Layout**: ${context.currentScreen || 'Dashboard'}\n\n`;

  md += `=== VERIFICATION REQUESTS (${context.verificationRequests.length}) ===\n`;
  if (context.verificationRequests.length > 0) {
    context.verificationRequests.forEach(req => {
      md += `- Request ID: ${req.id}\n`;
      md += `  - Organization: ${req.organizationName || req.requestedOrganization}\n`;
      md += `  - Service: ${req.serviceName || req.credentialType}\n`;
      md += `  - Status: ${req.status}\n`;
      md += `  - Progress: ${req.progress || 0}%\n`;
      if (req.checklist) {
        md += `  - Checklist items:\n`;
        req.checklist.forEach(item => {
          md += `    - [${item.status === 'Approved' ? 'x' : ' '}] ${item.type} (${item.required ? 'Required' : 'Optional'}) - ${item.status}\n`;
        });
      }
    });
  } else {
    md += `No active requests recorded.\n`;
  }
  md += `\n`;

  md += `=== CREDENTIAL VAULT DOCUMENTS (${context.credentials.length}) ===\n`;
  if (context.credentials.length > 0) {
    context.credentials.forEach(cred => {
      const docItem = context.documents.find(d => d.credentialId === cred.id);
      md += `- Credential: ${cred.type}\n`;
      md += `  - Status: ${cred.status}\n`;
      md += `  - Verified By: ${cred.verifiedBy || 'N/A'}\n`;
      md += `  - Expiry: ${cred.expiresAt || 'N/A'}\n`;
      if (docItem) {
        md += `  - Attached File: ${docItem.fileName} (v${docItem.version || 1})\n`;
      }
    });
  } else {
    md += `Vault is currently empty.\n`;
  }
  md += `=== ACTIVE NOTIFICATIONS (${context.notifications.length}) ===\n`;
  if (context.notifications.length > 0) {
    context.notifications.forEach(n => {
      md += `- [${n.read ? 'Read' : 'Unread'}] [Priority: ${n.priority}] ${n.title}: ${n.message}\n`;
    });
  } else {
    md += `No active notifications.\n`;
  }
  md += `\n`;

  if (context.role === 'super_admin' && context.auditLogs.length > 0) {
    md += `=== ADMINISTRATIVE AUDIT LOGS ===\n`;
    context.auditLogs.slice(0, 5).forEach(log => {
      md += `- [${log.timestamp}] ${log.action} by ${log.actorEmail}: ${log.details}\n`;
    });
    md += `\n`;
  }

  return md;
}
