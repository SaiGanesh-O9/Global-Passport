import { VERIFICATION_ACTION_TYPES } from './documentActions.js';

export function documentReducer(state, action) {
  switch (action.type) {
    case VERIFICATION_ACTION_TYPES.SET_VERIFICATION_REQUESTS: {
      return {
        ...state,
        verificationRequests: action.payload.requests || [],
        loading: false,
        ready: true,
      };
    }

    case VERIFICATION_ACTION_TYPES.SET_ORGANIZATIONS:
      return {
        ...state,
        organizations: action.payload.organizations,
      };

    case VERIFICATION_ACTION_TYPES.SET_USERS:
      return {
        ...state,
        users: action.payload.users,
      };

    case VERIFICATION_ACTION_TYPES.SET_AUDIT_LOGS:
      return {
        ...state,
        auditLogs: action.payload.auditLogs,
      };

    case VERIFICATION_ACTION_TYPES.SET_PLATFORM_SETTINGS:
      return {
        ...state,
        platformSettings: action.payload.platformSettings,
      };

    case VERIFICATION_ACTION_TYPES.ADD_TOAST: {
      const id = `toast-${Date.now()}-${Math.random()}`;
      return {
        ...state,
        toasts: [...(state.toasts || []), { id, message: action.payload.message, type: action.payload.type }]
      };
    }

    case VERIFICATION_ACTION_TYPES.REMOVE_TOAST:
      return {
        ...state,
        toasts: (state.toasts || []).filter((t) => t.id !== action.payload.id)
      };

    case VERIFICATION_ACTION_TYPES.ADD_ACTIVITY:
      return {
        ...state,
        activities: [action.payload.activity, ...(state.activities || [])].slice(0, 10)
      };

    case VERIFICATION_ACTION_TYPES.SET_ACTIVITIES:
      return {
        ...state,
        activities: action.payload.activities || [],
      };

    case VERIFICATION_ACTION_TYPES.REQUEST_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.APPROVE_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.REJECT_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.REQUEST_MORE_INFORMATION:
      return state;

    default:
      return state;
  }
}
