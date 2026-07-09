import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { isShareableStatus, VERIFICATION_STATUS } from '../context/documentUtils.js';
import { useDocuments } from '../hooks/useDocuments.js';
import {
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Loader2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

function buildVerificationDetails(request) {
  const orgName = request.organization?.name || request.requestedOrganization;
  const orgType = request.organization?.type || '';

  return [
    { label: 'Verification ID', value: request.verificationId },
    { label: 'Verification Hash', value: request.hash ? `${request.hash.slice(0, 10)}...${request.hash.slice(-6)}` : '' },
    { label: 'Status', value: request.status },
    { label: 'Organization', value: orgType ? `${orgName} (${orgType})` : orgName },
    { label: 'Verification Date', value: request.verifiedAt },
    { label: 'Issued To', value: request.ownerName || request.owner },
  ];
}

export default function VerificationPage() {
  const { verificationId } = useParams();
  const navigate = useNavigate();
  const { getVerificationRequestByVerificationId, getVerificationRequestById, loading } = useDocuments();
  const modalRef = useRef(null);

  const [minimumDelayPassed, setMinimumDelayPassed] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [revealPage, setRevealPage] = useState(false);
  const [animateShow, setAnimateShow] = useState(false);

  // 1. Minimum loading screen delay for transition smooth flow
  useEffect(() => {
    const timer = setTimeout(() => setMinimumDelayPassed(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const checking = loading || !minimumDelayPassed;

  // Retrieve verification record
  const request = verificationId
    ? (getVerificationRequestByVerificationId(verificationId) || getVerificationRequestById(verificationId))
    : null;

  const isApproved = request ? isShareableStatus(request.status) : false;
  const isPending = request && (request.status === VERIFICATION_STATUS.PENDING || request.status === VERIFICATION_STATUS.INFORMATION_REQUESTED);
  const isInvalid = !request || request.status === VERIFICATION_STATUS.REJECTED;

  // 2. Animate modal entry after loading screen completes
  useEffect(() => {
    if (!checking) {
      const animTimer = setTimeout(() => setAnimateShow(true), 50);
      return () => clearTimeout(animTimer);
    }
  }, [checking]);

  // 3. Focus first button inside modal once it opens
  useEffect(() => {
    if (!checking && showModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll('button, a');
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [checking, showModal]);

  // 4. Keyboard accessibility: Escape key and focus trap
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e) => {
      // Escape key behavior
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isApproved) {
          setShowModal(false);
          setRevealPage(true);
        } else {
          navigate('/');
        }
        return;
      }

      // Tab key focus trap
      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll('button, a');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // shift + tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, isApproved, navigate]);

  const handleCopyShareLink = async () => {
    if (!verificationId) {
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    alert('Share link copied to clipboard!');
  };

  const handleViewCredential = () => {
    setAnimateShow(false);
    setTimeout(() => {
      setShowModal(false);
      setRevealPage(true);
    }, 200);
  };

  const handleClose = () => {
    setAnimateShow(false);
    setTimeout(() => {
      navigate('/');
    }, 200);
  };

  // Loading Screen Overlay
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-[#090a0f] flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5 text-2xl font-extrabold text-blue-450">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileCheck2 className="h-6 w-6" />
            </span>
            UniCrypt
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            <p className="text-xs font-bold tracking-wider text-slate-350 uppercase">Verifying Credential...</p>
          </div>
        </div>
      </div>
    );
  }

  // Modal Overlays
  if (showModal) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] relative flex items-center justify-center px-4 backdrop-blur-sm bg-slate-950/60 dark:bg-black/80 transition-theme">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className={`w-full max-w-lg bg-white dark:bg-[#12131a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-805/40 overflow-hidden transition-all duration-200 transform ${
            animateShow ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {isApproved && (
            <div>
              <div className="bg-emerald-500/10 px-6 py-6 border-b border-emerald-500/20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="mt-3.5 text-sm font-bold tracking-wider text-emerald-800 dark:text-emerald-400 uppercase">✅ VERIFIED CREDENTIAL</h2>
              </div>
              
              <div className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[10px]">Verification ID</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{request.verificationId}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[10px]">Credential Type</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{request.credentialType}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[10px]">Owner</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{request.ownerName || request.owner}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[10px]">Issued By</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{request.organization?.name || request.requestedOrganization}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider text-[10px]">Verified On</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{request.verifiedAt}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs pb-1">
                  <span className="text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider text-[10px]">Verification Hash</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono text-[11px] truncate" title={request.hash}>
                    {request.hash ? `${request.hash.slice(0, 12)}...${request.hash.slice(-8)}` : ''}
                  </span>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-450">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>✔ Verified by UniCrypt</span>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-200/50 dark:border-slate-800/45">
                <Button onClick={handleClose} variant="secondary">
                  Close
                </Button>
                <Button onClick={handleViewCredential} variant="primary">
                  View Credential
                </Button>
              </div>
            </div>
          )}

          {isPending && (
            <div>
              <div className="bg-amber-500/10 px-6 py-6 border-b border-amber-500/20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-450 border border-amber-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="mt-3.5 text-sm font-bold tracking-wider text-amber-800 dark:text-amber-450 uppercase">🟡 VERIFICATION IN PROGRESS</h2>
              </div>
              
              <div className="px-6 py-8 space-y-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                  This credential has been submitted but has not yet been verified by the issuing organization.
                </p>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-center border-t border-slate-200/50 dark:border-slate-800/45">
                <Button onClick={handleClose} variant="secondary">
                  Close
                </Button>
                <Button onClick={handleClose} variant="primary">
                  Return Home
                </Button>
              </div>
            </div>
          )}

          {isInvalid && (
            <div>
              <div className="bg-rose-500/10 px-6 py-6 border-b border-rose-500/20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-455 border border-rose-500/20">
                  <XCircle className="h-6 w-6" />
                </div>
                <h2 className="mt-3.5 text-sm font-bold tracking-wider text-rose-800 dark:text-rose-450 uppercase">❌ CREDENTIAL NOT VERIFIED</h2>
              </div>
              
              <div className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
                  <span className="text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider text-[10px]">Verification ID</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{verificationId || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-4 text-xs pb-1">
                  <span className="text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider text-[10px]">Reason</span>
                  <span className="text-rose-650 dark:text-rose-450 font-bold font-semibold uppercase text-[11px] tracking-wide">
                    {!request ? 'Not Found' : 'Revoked'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-center border-t border-slate-200/50 dark:border-slate-800/45">
                <Button onClick={handleClose} variant="secondary">
                  Close
                </Button>
                <Button onClick={handleClose} variant="primary">
                  Return Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback if modal closed but reveal fails (should never hit this)
  if (!revealPage || !request || !isApproved) {
    return null;
  }

  const verificationDetails = buildVerificationDetails(request);

  // Existing Page Reveal Layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-theme">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
        <Card className="overflow-hidden bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
          <div className="bg-emerald-600 dark:bg-emerald-650 px-6 py-12 text-center text-white sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg shadow-black/10">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Verified Credential</h1>
            <p className="mt-2 text-emerald-100 text-xs font-bold uppercase tracking-wider">
              Verified through UniCrypt
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <FileCheck2 className="h-5 w-5 text-current" />
              <p>Verification details are ready to share.</p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {verificationDetails.map((detail) => (
                <div
                  className="rounded-xl border border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-900/30 p-4"
                  key={detail.label}
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                    {detail.label}
                  </dt>
                  <dd className="mt-2 text-xs font-bold text-slate-950 dark:text-white break-all">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Verification Timeline */}
            <div className="mt-8 border-t border-slate-200/80 dark:border-slate-800/40 pt-8">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Verification Timeline</h3>
              <div className="mt-6 relative border-l-2 border-slate-200 dark:border-slate-800 pl-6 ml-3 space-y-6">
                {request.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white dark:ring-[#12131a] shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{step.label}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1">{step.date} — Status: {step.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row pt-4 border-t border-slate-200/40 dark:border-slate-800/20">
              <Button icon={Download} variant="success">
                Download Certificate
              </Button>
              <Button icon={Copy} onClick={handleCopyShareLink} variant="secondary">
                Copy Share Link
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
