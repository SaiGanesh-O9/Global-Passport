import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { Loader2 } from 'lucide-react';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { role, isAuthenticated, loading, authReady } = useAuth();
  const { ready: documentsReady } = useDocuments();

  // Wait until Auth profile and Firestore document hydration are fully ready
  if (loading || !authReady || !documentsReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center transition-theme">
        <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
