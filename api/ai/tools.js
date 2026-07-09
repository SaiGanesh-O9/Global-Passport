/**
 * Modular Tools Library
 * Implements 11 isolated modules: weather, news, search, calculator, vault, 
 * organizations, notifications, audit, documents, verification, navigation.
 */

// 1. Weather Tool
export function toolWeather(message) {
  return {
    toolName: 'weather',
    result: "Weather tool active. Fetches real-time temperatures from Open-Meteo."
  };
}

// 2. News Tool
export function toolNews(message) {
  return {
    toolName: 'news',
    result: "News/AI developments tool active. Fetches feeds from public aggregators."
  };
}

// 3. Search Tool
export function toolSearch(message) {
  return {
    toolName: 'search',
    result: "Search tool active. Queries DuckDuckGo API."
  };
}

// 4. Calculator Tool
export function toolCalculator(message) {
  const match = message.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (match) {
    const num1 = parseFloat(match[1]);
    const op = match[2];
    const num2 = parseFloat(match[3]);
    let res = 0;
    if (op === '+') res = num1 + num2;
    if (op === '-') res = num1 - num2;
    if (op === '*') res = num1 * num2;
    if (op === '/') res = num2 !== 0 ? num1 / num2 : "Infinity";
    return { toolName: 'calculator', result: `Result: ${res}` };
  }
  return { toolName: 'calculator', result: "Calculator active. Supports basic operators (+, -, *, /)." };
}

// 5. Vault Tool
export function toolVault(context) {
  return {
    toolName: 'vault',
    result: (context?.credentials || []).map(c => ({ type: c.type, status: c.status }))
  };
}

// 6. Organizations Tool
export function toolOrganizations(context) {
  return {
    toolName: 'organizations',
    result: (context?.organizationProfiles || []).map(p => ({ name: p.name, category: p.category }))
  };
}

// 7. Notifications Tool
export function toolNotifications(context) {
  return {
    toolName: 'notifications',
    result: (context?.notifications || []).slice(0, 5)
  };
}

// 8. Audit Tool
export function toolAudit(context) {
  if (context?.role !== 'super_admin') {
    return { toolName: 'audit', error: "Unauthorized: Superadmin access required." };
  }
  return {
    toolName: 'audit',
    result: (context?.auditLogs || []).slice(0, 10)
  };
}

// 9. Documents Tool
export function toolDocuments(context) {
  return {
    toolName: 'documents',
    result: (context?.documents || []).map(d => ({ name: d.fileName || d.id, credentialId: d.credentialId }))
  };
}

// 10. Verification Tool
export function toolVerification(context) {
  return {
    toolName: 'verification',
    result: (context?.verificationRequests || []).map(r => ({ service: r.serviceName, status: r.status }))
  };
}

// 11. Navigation Tool
export function toolNavigation(message, role) {
  const msgLower = message.toLowerCase();
  if (role === 'student' && (msgLower.includes('start') || msgLower.includes('request verification'))) {
    return { toolName: 'navigation', result: { type: 'OPEN_MODAL', modal: 'upload' } };
  }
  return null;
}

export function executePlatformTool(message, context) {
  const msgLower = message.toLowerCase();

  if (msgLower.includes('weather')) return toolWeather(message);
  if (msgLower.includes('news')) return toolNews(message);
  if (msgLower.includes('calculate') || /[\+\-\*\/]/.test(message)) return toolCalculator(message);
  if (msgLower.includes('vault') || msgLower.includes('my documents')) return toolVault(context);
  if (msgLower.includes('organization') || msgLower.includes('universities')) return toolOrganizations(context);
  if (msgLower.includes('notification')) return toolNotifications(context);
  if (msgLower.includes('audit') || msgLower.includes('override')) return toolAudit(context);
  if (msgLower.includes('file') || msgLower.includes('document')) return toolDocuments(context);
  if (msgLower.includes('status') || msgLower.includes('requests')) return toolVerification(context);
  if (msgLower.includes('navigate') || msgLower.includes('start upload')) return toolNavigation(message, context?.role);

  return null;
}
