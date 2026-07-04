import { useContext } from 'react';
import { VerificationDispatchContext } from '../context/DocumentProvider.jsx';

export function useDocumentActions() {
  const actions = useContext(VerificationDispatchContext);

  if (!actions) {
    throw new Error('useDocumentActions must be used within a DocumentProvider');
  }

  return actions;
}
