import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { completeMagicLinkSignIn } from '../services/authService.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import { Mail, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAsDeveloper, isAuthenticated, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [loginType, setLoginType] = useState('student'); // 'student' | 'organization'
  const [emailSent, setEmailSent] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Development Login Mode States
  const [devError, setDevError] = useState('');
  const [devSubmitting, setDevSubmitting] = useState(false);

  // 1. Process Magic Link sign-in on mount
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      try {
        setVerifyingLink(true);
        setStatusMessage('Verifying magic link...');
        const user = await completeMagicLinkSignIn();
        if (user) {
          setStatusMessage('Authenticating profile...');
        } else {
          setVerifyingLink(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to authenticate link. It may have expired or been used already.');
        setVerifyingLink(false);
      }
    };

    handleEmailLinkSignIn();
  }, []);

  // 2. Redirection once authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && role) {
      if (role === 'student' || role === 'employer') {
        navigate('/dashboard');
      } else if (role === 'organization') {
        navigate('/institution');
      } else if (role === 'super_admin') {
        navigate('/admin');
      } else if (role === 'pending') {
        navigate('/403');
      }
    }
  }, [loading, isAuthenticated, role, navigate]);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await login(email);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      setError('Failed to send magic link. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevLogin = async (type) => {
    if (!loginAsDeveloper) return;
    try {
      setDevSubmitting(true);
      setDevError('');
      await loginAsDeveloper(type);
    } catch (err) {
      console.error(err);
      setDevError('Dev Login Failed: ' + err.message);
    } finally {
      setDevSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] relative overflow-hidden flex flex-col transition-theme">
      
      {/* Premium Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl pointer-events-none animate-pulse duration-[10000ms]"></div>

      <MarketingNav />
      
      <main className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <Card className="w-full max-w-md p-8 bg-white/80 dark:bg-[#12131a]/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/40 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <ShieldCheck className="h-5.5 w-5.5" />
              </span>
              <span className="tracking-tight font-extrabold text-slate-900 dark:text-white">VeriFlash</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">Verify Once. Trust Everywhere.</p>
          </div>

          {verifyingLink ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="mt-4 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{statusMessage}</p>
            </div>
          ) : emailSent ? (
            <div className="text-center py-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 mb-4 border border-emerald-200/50 dark:border-emerald-800/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white uppercase tracking-wider">Check your email</h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
                We sent a secure magic link to <strong className="text-slate-950 dark:text-white">{email}</strong>.
                Click the link in the email to complete signing in.
              </p>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-6 block mx-auto cursor-pointer font-bold"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendLink} className="space-y-5">
              
              {/* Custom Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                <button
                  type="button"
                  onClick={() => setLoginType('student')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
                    loginType === 'student'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  👤 User
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('organization')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
                    loginType === 'organization'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  🏛 Organization
                </button>
              </div>

              <div className="text-center space-y-1.5 py-1">
                <h2 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Passwordless Access</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {loginType === 'student'
                    ? 'Access your personal dashboard and request verification.'
                    : 'Access your institution dashboard to review submitted credentials.'}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-450 border border-rose-500/20">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="Email Address"
                icon={Mail}
                placeholder={loginType === 'student' ? 'name@university.edu' : 'admin@organization.org'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />

              <Button
                type="submit"
                loading={submitting}
                className="w-full text-xs font-bold py-2.5 rounded-xl shrink-0"
              >
                Send Magic Link
              </Button>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed text-center font-semibold">
                🛡 Magic links protect accounts from credential theft. Check your inbox for a login link.
              </div>

              {/* Developer Mode Local Authentication (Vite Local-Dev Only) */}
              {import.meta.env.DEV && (
                <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-5 mt-4">
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 rounded-xl p-4 space-y-3">
                    <div className="text-center">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Developer mode (Local)</h3>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5">Quick profiles toggle</p>
                    </div>

                    {devError && (
                      <div className="bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] p-2 rounded-lg border border-rose-500/20 font-semibold">
                        {devError}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDevLogin('user')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>👤</span>
                        <span>User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDevLogin('organization')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>🏢</span>
                        <span>Org</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDevLogin('super_admin')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>👑</span>
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
