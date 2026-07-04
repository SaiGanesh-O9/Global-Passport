import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Card from '../components/ui/Card.jsx';

export default function AccessDenied() {
  const { role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <Card className="w-full max-w-md p-8 text-center bg-white border border-slate-200 shadow-xl">
        <h1 className="text-4xl font-black text-red-600">403</h1>
        
        {isAuthenticated && role === 'pending' ? (
          <>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Registration Pending</h2>
            <p className="mt-3 text-sm text-slate-600">
              Your profile has been created successfully but is currently pending role assignment by a Super Admin.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Access Denied</h2>
            <p className="mt-3 text-sm text-slate-600">
              You do not have the required permissions to access this page.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {isAuthenticated && role !== 'pending' && (
            <Link
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-800 transition"
              to="/dashboard"
            >
              Go to User Dashboard
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </Card>
    </main>
  );
}
