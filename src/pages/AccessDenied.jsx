import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function AccessDenied() {
  const { role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 px-5 transition-theme">
      <Card className="w-full max-w-md p-8 text-center bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-rose-600 tracking-tight">403</h1>
        
        {isAuthenticated && role === 'pending' ? (
          <>
            <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white uppercase tracking-wider">Registration Pending</h2>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Your profile has been created successfully but is currently pending role assignment by a Super Admin.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white uppercase tracking-wider">Access Denied</h2>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              You do not have the required permissions to access this page.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {isAuthenticated && role !== 'pending' && (
            <Button
              to="/dashboard"
              variant="primary"
              className="w-full text-xs font-bold"
            >
              Go to User Dashboard
            </Button>
          )}
          
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full text-xs font-bold"
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </main>
  );
}
