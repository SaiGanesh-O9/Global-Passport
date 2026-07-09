/**
 * Context Engine Module
 * Compiles and filters active state documents based on user roles (Student, Org Reviewer, Superadmin)
 * to guarantee strict multi-tenant boundary isolation.
 */

export function compileAIContext(currentUser, userProfile, state, currentScreen) {
  if (!userProfile && !currentUser) {
    return null; // GENERAL bypass
  }

  const role = userProfile?.role || 'student';
  const email = userProfile?.email || currentUser?.email || 'student@localhost';
  const orgId = userProfile?.organizationId || '';

  const context = {
    role,
    currentScreen,
    profile: {
      name: userProfile?.name || 'Development User',
      email,
      organizationName: userProfile?.organizationName || '',
      organizationRole: userProfile?.organizationRole || ''
    },
    verificationRequests: [],
    credentials: [],
    documents: [],
    organizationProfiles: [],
    verificationServices: [],
    credentialTemplates: [],
    activityLogs: [],
    notifications: [],
    auditLogs: []
  };

  if (!state) return context;

  // Filter based on roles to guarantee platform security boundaries
  if (role === 'super_admin') {
    context.verificationRequests = state.verificationRequests || [];
    context.credentials = state.credentials || [];
    context.documents = state.documents || [];
    context.organizationProfiles = state.organizationProfiles || [];
    context.verificationServices = state.verificationServices || [];
    context.credentialTemplates = state.credentialTemplates || [];
    context.activityLogs = state.activities || [];
    context.notifications = state.notifications || [];
    context.auditLogs = state.auditLogs || [];
  } else if (role === 'organization') {
    context.verificationRequests = (state.verificationRequests || []).filter(r => r.organizationId === orgId);
    const allowedCredIds = context.verificationRequests.flatMap(r => (r.documentReferences || []).map(ref => ref.credentialId));
    context.credentials = (state.credentials || []).filter(c => allowedCredIds.includes(c.id));
    context.documents = (state.documents || []).filter(d => allowedCredIds.includes(d.credentialId));
    context.organizationProfiles = (state.organizationProfiles || []).filter(p => p.id === orgId);
    context.activityLogs = (state.activities || []).filter(act => act.organizationName === userProfile?.organizationName);
    context.notifications = (state.notifications || []).filter(n => n.recipientId === orgId || n.recipientEmail === email);
  } else {
    context.verificationRequests = (state.verificationRequests || []).filter(r => r.ownerEmail === email);
    context.credentials = (state.credentials || []).filter(c => c.ownerEmail === email);
    const allowedCredIds = context.credentials.map(c => c.id);
    context.documents = (state.documents || []).filter(d => allowedCredIds.includes(d.credentialId));
    context.organizationProfiles = (state.organizationProfiles || []).filter(p => p.status === 'Active');
    context.verificationServices = state.verificationServices || [];
    context.credentialTemplates = state.credentialTemplates || [];
    context.activityLogs = (state.activities || []).filter(act => act.ownerId === currentUser?.uid);
    context.notifications = (state.notifications || []).filter(n => n.recipientEmail === email);
  }

  return context;
}

export function serializeContextToMarkdown(context) {
  if (!context) return "";
  let md = `=== SYSTEM CONTEXT ===\n`;
  md += `- **Current User**: ${context.profile?.name || 'Anonymous'} (${context.profile?.email || 'N/A'})\n`;
  md += `- **Role/Permissions**: ${(context.role || 'student').toUpperCase()}\n`;
  md += `- **Active Screen Layout**: ${context.currentScreen || 'Dashboard'}\n\n`;

  md += `=== VERIFICATION REQUESTS (${(context.verificationRequests || []).length}) ===\n`;
  if (context.verificationRequests && context.verificationRequests.length > 0) {
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

  md += `=== CREDENTIALS VAULT (${(context.credentials || []).length}) ===\n`;
  if (context.credentials && context.credentials.length > 0) {
    context.credentials.forEach(c => {
      md += `- Credential: ${c.type} (${c.status}) - ID: ${c.id}\n`;
    });
  } else {
    md += `No credentials registered in vault.\n`;
  }
  md += `\n`;

  return md;
}
