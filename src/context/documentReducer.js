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
        organizations: action.payload.organizations || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_ORGANIZATION_PROFILES:
      return {
        ...state,
        organizationProfiles: action.payload.organizationProfiles || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_VERIFICATION_SERVICES:
      return {
        ...state,
        verificationServices: action.payload.verificationServices || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_CREDENTIAL_TEMPLATES:
      return {
        ...state,
        credentialTemplates: action.payload.credentialTemplates || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_CREDENTIALS:
      return {
        ...state,
        credentials: action.payload.credentials || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_DOCUMENTS:
      return {
        ...state,
        documents: action.payload.documents || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_USERS:
      return {
        ...state,
        users: action.payload.users || [],
      };

    case VERIFICATION_ACTION_TYPES.SET_AUDIT_LOGS:
      return {
        ...state,
        auditLogs: action.payload.auditLogs || [],
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

    case VERIFICATION_ACTION_TYPES.REQUEST_VERIFICATION: {
      const exists = state.verificationRequests.some(r => r.id === action.payload.request.id);
      return {
        ...state,
        verificationRequests: exists 
          ? state.verificationRequests.map(r => r.id === action.payload.request.id ? action.payload.request : r)
          : [...state.verificationRequests, action.payload.request]
      };
    }

    case VERIFICATION_ACTION_TYPES.APPROVE_VERIFICATION: {
      return {
        ...state,
        verificationRequests: state.verificationRequests.map(r => 
          r.id === action.payload.verificationId 
            ? { 
                ...r, 
                status: 'Approved', 
                verificationId: action.payload.verificationId.substring(0, 8).toUpperCase(),
                verifiedAt: new Date().toLocaleDateString()
              } 
            : r
        )
      };
    }

    case VERIFICATION_ACTION_TYPES.REJECT_VERIFICATION: {
      return {
        ...state,
        verificationRequests: state.verificationRequests.map(r => 
          r.id === action.payload.verificationId ? { ...r, status: 'Rejected' } : r
        )
      };
    }

    case VERIFICATION_ACTION_TYPES.REQUEST_MORE_INFORMATION: {
      return {
        ...state,
        verificationRequests: state.verificationRequests.map(r => 
          r.id === action.payload.verificationId ? { ...r, status: 'More Info' } : r
        )
      };
    }

    default:
      return state;
  }
}
