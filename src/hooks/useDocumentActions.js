import { useContext } from 'react';
import { DocumentDispatchContext } from '../context/DocumentProvider.jsx';

export function useDocumentActions() {
  const actions = useContext(DocumentDispatchContext);

  if (!actions) {
    throw new Error('useDocumentActions must be used within a DocumentProvider');
  }

  return actions;
}
