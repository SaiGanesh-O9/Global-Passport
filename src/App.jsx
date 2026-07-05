import { RouterProvider } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentProvider.jsx';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import { AuthProvider } from './hooks/useAuth.js';
import { router } from './router/AppRouter.jsx';
import ToastContainer from './components/ui/ToastContainer.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DocumentProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </DocumentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
