import { VERIFICATION_ACTION_TYPES } from './documentActions.js';

export function documentReducer(state, action) {
  switch (action.type) {
    case VERIFICATION_ACTION_TYPES.SET_VERIFICATION_REQUESTS:
      return {
        ...state,
        verificationRequests: action.payload.requests,
        loading: false,
      };

    // Firestore mutations are handled asynchronously in DocumentProvider;
    // state changes flow back to the reducer via real-time snapshots.
    case VERIFICATION_ACTION_TYPES.REQUEST_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.APPROVE_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.REJECT_VERIFICATION:
    case VERIFICATION_ACTION_TYPES.REQUEST_MORE_INFORMATION:
      return state;

    default:
      return state;
  }
}
