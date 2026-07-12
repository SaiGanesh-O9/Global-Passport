import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { completeMagicLinkSignIn, triggerSimulatedAuthChange } from '../services/authService.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import { Mail, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Settings, ArrowRight, CheckCircle } from 'lucide-react';

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
  const [isSimulated, setIsSimulated] = useState(false);
  const [sandboxLink, setSandboxLink] = useState('');
  
  // Developer Mode States
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
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
          triggerSimulatedAuthChange(user);
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
      const res = await login(email);
      setEmailSent(true);
      if (res && res.isSimulated) {
        setIsSimulated(true);
        setSandboxLink(res.link);
      } else {
        setIsSimulated(false);
      }
    } catch (err) {
      console.warn("Magic link fallback simulation triggered:", err.message);
      setEmailSent(true);
      setIsSimulated(true);
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
      
      {/* Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Floating diagnostics gear in corner */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsDiagnosticsOpen(true)}
          className="p-2 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer outline-none shadow-sm"
          title="Developer Diagnostics Console"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <MarketingNav />
      
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div className="w-full max-w-5xl grid gap-12 lg:grid-cols-2 items-center">
          
          {/* Left Column: Product Launch Hero Presentation */}
          <div className="space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              Verified Trust Engine
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
              Verify Once.<br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Trust Everywhere.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-550 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
              UniCrypt is a secure credential vault connecting individuals and institutions to streamline academic and document verifications.
            </p>

            {/* Micro Feature highlights */}
            <div className="space-y-3.5 pt-2 text-slate-700 dark:text-slate-350">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Zero-knowledge client-side file cryptosigning</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Structured AI Requirement parsing & checking</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Calm and premium Stripe-like dashboard panels</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Glassmorphic Card Login */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md p-8 bg-white/70 dark:bg-[#12131a]/70 border border-slate-200/80 dark:border-slate-800/40 shadow-2xl relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

              <div className="text-center mb-6 relative z-10">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Sign in to UniCrypt
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mt-1">
                  Enter credentials to securely authenticate
                </p>
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
                  <h3 className="text-base font-bold text-slate-950 dark:text-white uppercase tracking-wider">Check your email</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
                    We sent a secure magic link to <strong className="text-slate-950 dark:text-white">{email}</strong>.
                    Click the link in the email to complete signing in.
                  </p>
                  {isSimulated && (
                    <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 px-3 text-center space-y-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-extrabold block">Demo Mode Sandbox</span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        Firebase credentials are unconfigured. Click below to simulate magic link verification.
                      </p>
                      <a
                        href={sandboxLink || localStorage.getItem('sandbox_magic_link') || '#'}
                        className="w-full inline-block py-2 bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white rounded-lg shadow-sm hover:shadow transition-all text-center cursor-pointer select-none no-underline active:scale-[0.98]"
                      >
                        📩 Click to verify Magic Link redirect
                      </a>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmailSent(false)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-6 block mx-auto cursor-pointer font-bold outline-none"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendLink} className="space-y-5 relative z-10">
                  
                  {/* Selector Tabs Slider */}
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                    <button
                      type="button"
                      onClick={() => setLoginType('student')}
                      className={`py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer outline-none ${
                        loginType === 'student'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 shadow-sm border border-slate-205/50 dark:border-slate-700/50'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                      }`}
                    >
                      👤 Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType('organization')}
                      className={`py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer outline-none ${
                        loginType === 'organization'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 shadow-sm border border-slate-205/50 dark:border-slate-700/50'
                          : 'text-slate-550 dark:text-slate-400 hover:text-slate-855 dark:hover:text-slate-200'
                      }`}
                    >
                      🏛 Partner Org
                    </button>
                  </div>

                  <div className="text-center py-0.5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      {loginType === 'student'
                        ? 'Access your personal credential vault.'
                        : 'Review institutional admission document portfolios.'}
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
                    placeholder={loginType === 'student' ? 'user@gmail.com' : 'admin@accreditor.org'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />

                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full text-xs font-bold py-2.5 rounded-xl shrink-0 uppercase tracking-wider active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                  >
                    <span>Send Login Link</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <div className="border-t border-slate-100 dark:border-slate-850/60 pt-4 text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed text-center font-semibold uppercase tracking-wider">
                    🛡 secure passwordless magic link sign in
                  </div>

                </form>
              )}
            </Card>
          </div>

        </div>
      </main>

      {/* Sliding Diagnostics Panel Drawer */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsDiagnosticsOpen(false)}
          />
          {/* Drawer Container */}
          <div className="relative w-80 max-w-full bg-white dark:bg-[#0f111a] border-l border-slate-200 dark:border-slate-850 h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 z-10">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Sandbox Diagnostics</h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">Quick profiles simulation</p>
                </div>
                <button 
                  onClick={() => setIsDiagnosticsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-extrabold text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {devError && (
                <div className="bg-rose-500/10 text-rose-700 dark:text-rose-450 text-[10px] p-3.5 rounded-xl border border-rose-500/20 font-semibold">
                  {devError}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] text-slate-450 dark:text-slate-550 uppercase tracking-widest font-extrabold">Simulated Personas</p>
                
                <button
                  type="button"
                  onClick={() => { handleDevLogin('user'); setIsDiagnosticsOpen(false); }}
                  disabled={devSubmitting || submitting}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="text-base shrink-0">👤</span>
                  <span className="flex-1 text-left uppercase tracking-wider text-[10px]">Login as Individual User</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { handleDevLogin('organization'); setIsDiagnosticsOpen(false); }}
                  disabled={devSubmitting || submitting}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="text-base shrink-0">🏢</span>
                  <span className="flex-1 text-left uppercase tracking-wider text-[10px]">Login as Institution</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { handleDevLogin('super_admin'); setIsDiagnosticsOpen(false); }}
                  disabled={devSubmitting || submitting}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="text-base shrink-0">👑</span>
                  <span className="flex-1 text-left uppercase tracking-wider text-[10px]">Login as Platform Admin</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-450 dark:text-slate-550 font-semibold leading-normal pt-4 border-t border-slate-100 dark:border-slate-800 uppercase tracking-wide">
              This panel enables judges and developers to simulate magic link routing without Firebase setup active.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
