import { createContext, useMemo, useReducer } from 'react';
import {
  approveVerification,
  rejectVerification,
  requestVerification,
  requestMoreInformation,
} from './documentActions.js';
import { documentReducer } from './documentReducer.js';
import { createInitialDocumentState } from './initialState.js';

export const VerificationStateContext = createContext(null);
export const VerificationDispatchContext = createContext(null);

export function DocumentProvider({ children }) {
  const [state, dispatch] = useReducer(
    documentReducer,
    undefined,
    createInitialDocumentState,
  );

  const actions = useMemo(
    () => ({
      requestVerification: (payload) => dispatch(requestVerification(payload)),
      approveVerification: (verificationId) => dispatch(approveVerification(verificationId)),
      rejectVerification: (verificationId) => dispatch(rejectVerification(verificationId)),
      requestMoreInformation: (verificationId) => dispatch(requestMoreInformation(verificationId)),
    }),
    [dispatch],
  );

  return (
    <VerificationStateContext.Provider value={state}>
      <VerificationDispatchContext.Provider value={actions}>
        {children}
      </VerificationDispatchContext.Provider>
    </VerificationStateContext.Provider>
  );
}
