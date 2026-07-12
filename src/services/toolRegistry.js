// UniCrypt OS™ Tool Orchestrator Registry
export const TOOL_REGISTRY = {
  request_document: {
    name: 'Request Document',
    roles: ['user', 'admin'],
    logMessage: 'Checking requirements and requesting document...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-request-document', { detail: args }));
    }
  },
  choose_document: {
    name: 'Choose Document',
    roles: ['user', 'admin'],
    logMessage: 'Searching vault for matching credentials...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-choose-document', { detail: args }));
    }
  },
  open_document: {
    name: 'Open Document',
    roles: ['user', 'institution', 'admin'],
    logMessage: 'Opening transcript...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: args.documentId } }));
    }
  },
  compare_organizations: {
    name: 'Compare Organizations',
    roles: ['user', 'admin'],
    logMessage: 'Comparing organization requirements...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-compare-orgs', { detail: args }));
    }
  },
  open_organization: {
    name: 'Open Organization',
    roles: ['user', 'institution', 'admin'],
    logMessage: 'Opening organization profile...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-view-org', { detail: args }));
    }
  },
  open_verification: {
    name: 'Open Verification',
    roles: ['institution', 'admin'],
    logMessage: 'Opening verification request...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-open-verification', { detail: args }));
    }
  },
  start_workflow: {
    name: 'Start Workflow',
    roles: ['user', 'admin'],
    logMessage: 'Initiating credential matching journey...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-start-workflow', { detail: args }));
    }
  },
  search_vault: {
    name: 'Search Vault',
    roles: ['user', 'admin'],
    logMessage: 'Searching Credential Vault...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-search-vault', { detail: args }));
    }
  },
  upload_document: {
    name: 'Upload Document',
    roles: ['user', 'admin'],
    logMessage: 'Preparing upload container...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: args }));
    }
  },
  capture_document: {
    name: 'Capture Document',
    roles: ['user', 'admin'],
    logMessage: 'Launching UniCrypt Vision camera stream...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-capture', { detail: args }));
    }
  },
  analyze_document: {
    name: 'Analyze Document',
    roles: ['user', 'institution', 'admin'],
    logMessage: 'Running OCR and document classification...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-analyze', { detail: args }));
    }
  },
  generate_checklist: {
    name: 'Generate Checklist',
    roles: ['user', 'admin'],
    logMessage: 'Generating requirements checklist...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-checklist', { detail: args }));
    }
  },
  open_timeline: {
    name: 'Open Timeline',
    roles: ['user', 'institution', 'admin'],
    logMessage: 'Opening activity logs & milestones...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-timeline', { detail: args }));
    }
  },
  create_notification: {
    name: 'Create Notification',
    roles: ['admin', 'institution'],
    logMessage: 'Sending alert notification...',
    execute: (args) => {
      window.dispatchEvent(new CustomEvent('unicrypt-tool-notify', { detail: args }));
    }
  }
};

export function executeTool(toolName, args, userRole = 'user') {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    return { success: false, error: `Tool ${toolName} not found in registry.` };
  }

  if (tool.roles && !tool.roles.includes(userRole)) {
    return {
      success: false,
      error: `Security constraint: Role "${userRole}" is not authorized to execute tool "${toolName}".`
    };
  }

  try {
    tool.execute(args);
    return {
      success: true,
      type: 'action',
      tool: toolName,
      payload: args
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function resolveThinkingLog(toolName) {
  const tool = TOOL_REGISTRY[toolName];
  return tool ? tool.logMessage : 'Processing workspace logic...';
}
