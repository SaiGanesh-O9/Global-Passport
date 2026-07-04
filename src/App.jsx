import { RouterProvider } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentProvider.jsx';
import { AuthProvider } from './hooks/useAuth.js';
import { router } from './router/AppRouter.jsx';

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <RouterProvider router={router} />
      </DocumentProvider>
    </AuthProvider>
  );
}
