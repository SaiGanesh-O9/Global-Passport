import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { role, isAuthenticated, loading } = useAuth();

  // Wait until Auth and Firestore profile finishes loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
