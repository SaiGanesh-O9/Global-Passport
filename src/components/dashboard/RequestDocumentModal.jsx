import React, { useState } from 'react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import { X, ClipboardList, Send, Loader2, CheckCircle2 } from 'lucide-react';

const credentialTypeOptions = [
  'Passport',
  'Academic Essay',
  'Degree',
  'Transcript',
  'Medical License',
  'Employment Certificate',
  'Government Certificate',
  'Professional Certification',
];

export default function RequestDocumentModal({ isOpen, onClose }) {
  const { requestDocumentFromUser } = useDocumentActions();
  const [userEmail, setUserEmail] = useState('');
  const [credentialType, setCredentialType] = useState(credentialTypeOptions[0]);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail) {
      setError('Please provide the target user email.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await requestDocumentFromUser({
        userEmail,
        credentialType,
        purpose: purpose.trim() || `Requested ${credentialType} Verification`,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Request creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserEmail('');
    setCredentialType(credentialTypeOptions[0]);
    setPurpose('');
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleReset}
      ></div>

      {/* Modal Card */}
      <Card className="relative w-full max-w-md bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/60 shadow-2xl p-6 overflow-hidden z-10 animate-scale-in">
        <button 
          onClick={handleReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Request Document</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Initiate a request for a verified user document</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">User Email Address</label>
              <Input
                type="email"
                required
                placeholder="e.g. student@localhost"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Requested Credential Type</label>
              <Select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
              >
                {credentialTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Purpose / Request Details</label>
              <Textarea
                placeholder="e.g. Please upload your Degree Certificate for enrollment verification."
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleReset} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={submitting ? undefined : Send} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending Request...
                  </span>
                ) : 'Send Request'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Sent Successfully</h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold mt-1">
                The document request has been routed to <strong>{userEmail}</strong>.
              </p>
            </div>
            <Button onClick={handleReset} variant="primary" className="mx-auto block">
              Done
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
