import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { completeMagicLinkSignIn } from '../services/authService.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import { Mail, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAsDeveloper, isAuthenticated, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [loginType, setLoginType] = useState('student'); // 'student' | 'organization' (purely for UI visual selection)
  const [emailSent, setEmailSent] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Development Login Mode States
  const [devError, setDevError] = useState('');
  const [devSubmitting, setDevSubmitting] = useState(false);

  // 1. Process Magic Link sign-in on mount if redirected from email link
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

  // 2. Perform role-based redirection once authentication state loads
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketingNav />
      
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md p-8 shadow-xl border border-slate-200 bg-white">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-blue-700">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-700 text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </span>
              VeriFlash
            </div>
            <p className="text-sm text-slate-500 mt-1">Verify Once. Trust Everywhere.</p>
          </div>

          {verifyingLink ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-10 w-10 text-blue-700 animate-spin" />
              <p className="mt-4 font-semibold text-slate-800">{statusMessage}</p>
            </div>
          ) : emailSent ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">Check your email</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We sent a secure magic link to <strong className="text-slate-950">{email}</strong>.
                Click the link in the email to complete signing in.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="text-xs text-blue-755 hover:underline mt-6 block mx-auto cursor-pointer font-bold"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendLink} className="space-y-4">
              
              {/* UI Login Selection Tabs (Non-authorization visual toggle) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginType('student')}
                  className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    loginType === 'student' ? 'bg-white text-blue-755 shadow-sm' : 'text-slate-500 hover:text-slate-805'
                  }`}
                >
                  <span>👤</span> User
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('organization')}
                  className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    loginType === 'organization' ? 'bg-white text-blue-755 shadow-sm' : 'text-slate-500 hover:text-slate-805'
                  }`}
                >
                  <span>🏛</span> Organization
                </button>
              </div>

              <div className="text-center space-y-1 py-1">
                <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Passwordless Login</h2>
                <p className="text-xs text-slate-500">
                  {loginType === 'student'
                    ? 'Access your personal dashboard and request verification.'
                    : 'Access your institution dashboard to review submitted credentials.'}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-red-800 border border-red-100">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-655 uppercase">
                  Email Address
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="email"
                    type="email"
                    placeholder={loginType === 'student' ? 'name@university.edu' : 'admin@organization.org'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-950"
                    disabled={submitting}
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button
                type="submit"
                loading={submitting}
                className="w-full justify-center text-xs font-bold"
              >
                Send Magic Link
              </Button>

              <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 leading-relaxed text-center font-semibold">
                🛡 We use passwordless authentication to protect accounts. A verification email containing a secure login link is sent to your inbox.
              </div>

              {/* Developer Mode Local Authentication (Vite Local-Dev Only) */}
              {import.meta.env.DEV && (
                <div className="border-t border-slate-200 pt-5 mt-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <h3 className="text-xs font-bold text-slate-800">Developer Mode (Local Only)</h3>
                      <p className="text-[9px] text-slate-450 mt-0.5">⚠ Visible only on localhost</p>
                    </div>

                    {devError && (
                      <div className="bg-red-50 text-red-800 text-[10px] p-2 rounded border border-red-100 font-semibold">
                        {devError}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDevLogin('user')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[10px] font-extrabold text-slate-800 border border-slate-200 rounded flex flex-col items-center gap-1 transition cursor-pointer disabled:opacity-50"
                      >
                        <span>👤</span>
                        <span>User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDevLogin('organization')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[10px] font-extrabold text-slate-800 border border-slate-200 rounded flex flex-col items-center gap-1 transition cursor-pointer disabled:opacity-50"
                      >
                        <span>🏢</span>
                        <span>Org</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDevLogin('super_admin')}
                        disabled={devSubmitting || submitting}
                        className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[10px] font-extrabold text-slate-800 border border-slate-200 rounded flex flex-col items-center gap-1 transition cursor-pointer disabled:opacity-50"
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
