import { organizationsData } from '../../src/data/organizations/index.js';

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

  // Parse viewed institution details from screen query params
  if (currentScreen && currentScreen.includes('#organizations')) {
    try {
      const queryPart = currentScreen.split('?')[1] || '';
      const params = new URLSearchParams(queryPart);
      const viewOrgId = params.get('id');
      const viewProgId = params.get('program');

      if (viewOrgId && organizationsData[viewOrgId]) {
        const fullData = organizationsData[viewOrgId];
        const orgProf = fullData.profile;
        context.viewedInstitution = {
          currentOrg: {
            id: orgProf.id,
            name: orgProf.name,
            category: orgProf.category,
            website: orgProf.website,
            country: orgProf.country,
            state: orgProf.state,
            description: orgProf.description
          }
        };

        if (viewProgId) {
          const prog = (fullData.programs || []).find(p => p.id === viewProgId);
          if (prog) {
            context.viewedInstitution.currentProgram = {
              id: prog.id,
              name: prog.name,
              degree: prog.degree,
              tuition: prog.tuition,
              duration: prog.duration,
              credits: prog.credits,
              stemStatus: prog.stemStatus,
              description: prog.description
            };
            context.viewedInstitution.currentRequirementSet = (fullData.requirements || {})[viewProgId] || [];
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse viewed institution context:", e);
    }
  }

  return context;
}

export function serializeContextToMarkdown(context) {
  if (!context) return "";
  let md = `=== SYSTEM CONTEXT ===\n`;
  md += `- **Current User**: ${context.profile?.name || 'Anonymous'} (${context.profile?.email || 'N/A'})\n`;
  md += `- **Role/Permissions**: ${(context.role || 'student').toUpperCase()}\n`;
  md += `- **Active Screen Layout**: ${context.currentScreen || 'Dashboard'}\n\n`;

  if (context.viewedInstitution) {
    const { currentOrg, currentProgram, currentRequirementSet } = context.viewedInstitution;
    md += `=== VIEWED INSTITUTION CONTEXT ===\n`;
    md += `- **Name**: ${currentOrg.name} (${currentOrg.category})\n`;
    md += `- **Location**: ${currentOrg.state ? currentOrg.state + ', ' : ''}${currentOrg.country}\n`;
    md += `- **Website**: ${currentOrg.website || 'N/A'}\n`;
    md += `- **Description**: ${currentOrg.description || 'N/A'}\n`;
    
    if (currentProgram) {
      md += `\n=== SELECTED ACADEMIC PROGRAM ===\n`;
      md += `- **Program**: ${currentProgram.name} (${currentProgram.degree})\n`;
      md += `- **Duration**: ${currentProgram.duration} (${currentProgram.credits} credits)\n`;
      md += `- **Tuition**: ${currentProgram.tuition} (STEM: ${currentProgram.stemStatus})\n`;
      md += `- **Description**: ${currentProgram.description || 'N/A'}\n`;
    }
    
    if (currentRequirementSet && currentRequirementSet.length > 0) {
      md += `\n=== ADMISSION REQUIREMENTS CHECKLIST ===\n`;
      currentRequirementSet.forEach((req, idx) => {
        md += `- Requirement ${idx + 1}: ${req.type} (${req.required ? 'Required' : 'Optional'}) - Details: ${req.details}\n`;
      });
    }
    md += `\n`;
  }

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
