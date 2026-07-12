/**
 * UniCrypt Global Event Bus (v1.0)
 * Decouples visual elements and AI prompts from direct UI modifications.
 */

export const EVENTS = {
  WORKSPACE_OPEN: 'unicrypt.workspace.open',
  WORKSPACE_CLOSE: 'unicrypt.workspace.close',
  SELECTION_CHANGED: 'unicrypt.selection.changed',
  NOTIFICATION_SHOW: 'unicrypt.notification.show',
  WORKFLOW_ADVANCE: 'unicrypt.workflow.advance',
  AI_TOOL_EXECUTE: 'unicrypt.ai.tool.execute'
};

export const EventBus = {
  dispatch(event, detail = {}) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  },

  subscribe(event, callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }
};
