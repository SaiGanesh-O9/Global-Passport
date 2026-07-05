/**
 * Action Executor for UniCrypt AI.
 * Resolves natural language commands into structured UI action payloads.
 * Handlers check role permissions before recommending actions.
 */
export function detectPlatformAction(message, role) {
  const msgLower = message.toLowerCase();

  // 1. User Actions
  if (role === 'student') {
    if (msgLower.includes('start') || msgLower.includes('request verification') || msgLower.includes('verify degree')) {
      return {
        type: 'OPEN_MODAL',
        modal: 'upload',
        params: { orgId: 'org-northbridge', serviceId: 'service-degree' }
      };
    }
    if (msgLower.includes('show my verified') || msgLower.includes('verified documents') || msgLower.includes('show verified')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#vault',
        params: { filter: 'Verified' }
      };
    }
    if (msgLower.includes('show pending') || msgLower.includes('pending vault')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#vault',
        params: { filter: 'Pending' }
      };
    }
  }

  // 2. Organization Actions
  if (role === 'organization') {
    if (msgLower.includes('show pending') || msgLower.includes('incoming requests') || msgLower.includes('pending requests')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#requests'
      };
    }
    if (msgLower.includes('verification services') || msgLower.includes('list services')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#services'
      };
    }
  }

  // 3. Admin Actions
  if (role === 'super_admin') {
    if (msgLower.includes('organizations awaiting') || msgLower.includes('pending organizations')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#organizations'
      };
    }
    if (msgLower.includes('show overrides') || msgLower.includes('overrides panel')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#overrides'
      };
    }
    if (msgLower.includes('audit logs') || msgLower.includes('view logs')) {
      return {
        type: 'SWITCH_TAB',
        hash: '#logs'
      };
    }
  }

  return null;
}
