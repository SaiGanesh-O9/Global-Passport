import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';

export default function AccessDenied() {
  const { role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getErrorContent = () => {
    if (!isAuthenticated) {
      return {
        title: "Not signed in",
        description: "Please sign in to continue.",
        actionText: "Go to Sign In",
        actionTo: "/login"
      };
    }
    
    if (role === 'pending') {
      return {
        title: "Registration Pending",
        description: "Your profile has been created successfully but is currently pending role assignment by a Super Admin.",
        actionText: "Go to Home View",
        actionTo: "/"
      };
    }

    if (role === 'student') {
      return {
        title: "Wrong role",
        description: "This feature is available for Organizations. User profiles cannot access verifier tools.",
        actionText: "Go to My Workspace",
        actionTo: "/dashboard"
      };
    }

    if (role === 'organization') {
      return {
        title: "Wrong role",
        description: "This feature is available for Users. Organization profiles cannot access vault tools.",
        actionText: "Go to My Workspace",
        actionTo: "/institution"
      };
    }

    return {
      title: "Access Denied",
      description: "You do not have the required permissions to access this page.",
      actionText: "Go to My Workspace",
      actionTo: "/dashboard"
    };
  };

  const errContent = getErrorContent();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 px-6 transition-theme">
      <Card className="w-full max-w-md p-8 text-center bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
        
        {/* Floating warning icon alert header */}
        <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-sm animate-pulse">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          {errContent.title}
        </h2>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed px-2">
          {errContent.description}
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            to={errContent.actionTo}
            variant="primary"
            className="w-full text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
          >
            <span>{errContent.actionText}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          {isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Account</span>
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
