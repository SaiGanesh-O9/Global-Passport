import { createContext, useMemo, useReducer } from 'react';
import {
  approveDocument,
  rejectDocument,
  uploadDocument,
} from './documentActions.js';
import { documentReducer } from './documentReducer.js';
import { createInitialDocumentState } from './initialState.js';

export const DocumentStateContext = createContext(null);
export const DocumentDispatchContext = createContext(null);

export function DocumentProvider({ children }) {
  const [state, dispatch] = useReducer(
    documentReducer,
    undefined,
    createInitialDocumentState,
  );

  const actions = useMemo(
    () => ({
      uploadDocument: (payload) => dispatch(uploadDocument(payload)),
      approveDocument: (documentId) => dispatch(approveDocument(documentId)),
      rejectDocument: (documentId) => dispatch(rejectDocument(documentId)),
    }),
    [dispatch],
  );

  return (
    <DocumentStateContext.Provider value={state}>
      <DocumentDispatchContext.Provider value={actions}>
        {children}
      </DocumentDispatchContext.Provider>
    </DocumentStateContext.Provider>
  );
}
