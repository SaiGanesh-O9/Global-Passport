import { useState, useEffect } from 'react';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload.js';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { createDocumentId } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import {
  FileCheck2,
  Upload,
  X,
  Building2,
  Globe,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const credentialTypeOptions = [
  'Degree',
  'Transcript',
  'Medical License',
  'Employment Certificate',
  'Government Certificate',
  'Professional Certification',
];

const CREDENTIAL_TYPE_MAP = {
  'Degree': 'University',
  'Transcript': 'University',
  'Medical License': 'Hospital',
  'Employment Certificate': 'Employer',
  'Government Certificate': 'Government',
  'Professional Certification': 'Certification Authority',
};

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function UploadDocumentModal({ isOpen, onClose, targetRequest }) {
  const { requestVerification } = useDocumentActions();

  // Wizard state: 1: Type, 2: Organization, 3: Files, 4: Review, 5: Success
  const [step, setStep] = useState(1);
  const { organizations } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [credentialType, setCredentialType] = useState(credentialTypeOptions[0]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [files, setFiles] = useState([]);
  const [purpose, setPurpose] = useState('');

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [error, setError] = useState('');
  const [hasStorageError, setHasStorageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (targetRequest) {
        setCredentialType(targetRequest.credentialType || credentialTypeOptions[0]);
        setSelectedOrg(targetRequest.organization || null);
        setStep(3); // Skip directly to file upload step
      } else {
        setStep(1);
        setCredentialType(credentialTypeOptions[0]);
        setSelectedOrg(null);
      }
      setFiles([]);
      setError('');
      setPurpose('');
      setSubmitProgress('');
      setSubmitting(false);
    }
  }, [isOpen, targetRequest]);





  // Filter organizations matching mapped credential type
  const targetOrgType = CREDENTIAL_TYPE_MAP[credentialType];
  const filteredOrgs = organizations.filter((org) => {
    const isActive = org.status === 'Active';
    const isVerified = org.verificationStatus === 'Verified';
    const matchesType = org.type === targetOrgType;
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase());
    return isActive && isVerified && matchesType && matchesSearch;
  });

  const handleFileValidation = (file) => {
    const fileName = file.name.toLowerCase();
    const isValid = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      setError(`Invalid file type: ${file.name}. Only PDF, PNG, JPG, and JPEG are allowed.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    setError('');
    const selected = Array.from(e.target.files || []);
    const validFiles = selected.filter(handleFileValidation);
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError('');
    const dropped = Array.from(e.dataTransfer.files || []);
    const validFiles = dropped.filter(handleFileValidation);
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setStep(1);
    setCredentialType(credentialTypeOptions[0]);
    setSelectedOrg(null);
    setFiles([]);
    setSearchQuery('');
    setPurpose('');
    setError('');
    setSubmitProgress('');
    setHasStorageError(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one document.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitProgress('Uploading documents to Cloudinary...');
      setError('');

      const isResolving = !!targetRequest;
      const newRequestId = isResolving ? targetRequest.id : createDocumentId();
      const fileMetadata = [];
      let uploadMode = 'cloud';
      let storageStatus = 'enabled';
      let storageErrorOccurred = false;

      // Upload each file to Cloudinary
      for (const file of files) {
        try {
          const result = await uploadToCloudinary(file);
          console.log(result.url);
          fileMetadata.push({
            fileName: file.name,
            fileUrl: result.url,
            publicId: result.public_id,
          });
        } catch (storageErr) {
          if (import.meta.env.DEV) {
            console.warn('Cloudinary upload failed, falling back to local mode:', storageErr);
            storageErrorOccurred = true;
            uploadMode = 'local';
            storageStatus = 'disabled';
          } else {
            throw storageErr;
          }
        }
      }

      setSubmitProgress(isResolving ? 'Resolving requested document...' : 'Submitting verification request...');
      await requestVerification({
        id: newRequestId,
        credentialType: isResolving ? targetRequest.credentialType : credentialType,
        organization: isResolving ? targetRequest.organization : {
          id: selectedOrg.id,
          name: selectedOrg.name,
          type: selectedOrg.type,
        },
        purpose: isResolving ? targetRequest.purpose : (purpose.trim() || `${credentialType} Verification`),
        fileName: files[0].name,
        files: fileMetadata,
        uploadMode,
        storageStatus,
      });

      setHasStorageError(storageErrorOccurred);

      // Navigate to routing visualization success step
      setStep(5);
    } catch (err) {
      console.error(err);
      setError('Failed to submit request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm px-5 py-6">
      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-[#12131a] shadow-2xl relative border border-slate-200 dark:border-slate-800/40 max-h-[95vh] overflow-y-auto">
        
        {/* Close Modal Trigger */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800/40 cursor-pointer transition-colors duration-150"
          aria-label="Close modal"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Step Indicator Headers */}
        {step < 5 && (
          <div className="border-b border-slate-200/80 dark:border-slate-800/60 pb-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Step {step} of 4</span>
              <span>{submitting ? 'Processing' : 'Request Verification'}</span>
            </div>
            {/* Step titles */}
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white mt-1.5 uppercase tracking-wide">
              {step === 1 && 'Choose Credential'}
              {step === 2 && 'Select Organization'}
              {step === 3 && 'Upload Document Files'}
              {step === 4 && 'Review & Submit'}
            </h2>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200/30 dark:border-slate-800/20">
              <div
                className="bg-blue-650 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal content body */}
        <div className="mt-5">
          {submitting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-205 text-center uppercase tracking-wider">{submitProgress}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="text-rose-900 dark:text-rose-350 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 1: Credential Type Select */}
              {step === 1 && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Specify the type of credential you wish to verify. This filters authorized organizations automatically.
                  </p>
                  
                  <Select
                    id="credentialType"
                    label="Credential Type"
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value)}
                  >
                    {credentialTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>

                  <Input
                    id="purpose"
                    type="text"
                    label="Verification Purpose (Optional)"
                    placeholder="e.g. Higher Education, Employment Check"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />

                  <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/40 gap-2">
                    <Button onClick={handleClose} variant="secondary">
                      Cancel
                    </Button>
                    <Button icon={ArrowRight} onClick={() => setStep(2)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Select Organization */}
              {step === 2 && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Search and select a verified issuing organization matching type: <strong className="text-slate-950 dark:text-white font-extrabold">{targetOrgType}</strong>.
                  </p>
                  
                  <Input
                    type="text"
                    placeholder="Search organization by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/20">
                    {filteredOrgs.length > 0 ? (
                      filteredOrgs.map((org) => {
                        const isSelected = selectedOrg?.id === org.id;
                        return (
                          <div
                            key={org.id}
                            onClick={() => setSelectedOrg(org)}
                            className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-500/10'
                                : 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 shrink-0 border border-blue-100/50 dark:border-blue-800/20">
                                <Building2 className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-950 dark:text-white">{org.name}</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-semibold">
                                  <span>{org.type}</span>
                                  {org.website && (
                                    <span className="flex items-center gap-0.5">
                                      <Globe className="h-3 w-3 text-slate-400" />
                                      {org.website}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-0.5 whitespace-nowrap">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              Verified
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-450 text-center py-8 font-bold">
                        No active, verified organizations found matching your search.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(1)} variant="secondary">
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={handleClose} variant="secondary">
                        Cancel
                      </Button>
                      <Button disabled={!selectedOrg} icon={ArrowRight} onClick={() => setStep(3)}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Upload Files */}
              {step === 3 && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Upload document copies for review. Supported formats: <strong className="text-slate-950 dark:text-white font-bold">PDF, PNG, JPG, JPEG</strong>.
                  </p>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:border-blue-600 dark:hover:border-blue-500 transition-colors duration-150 cursor-pointer bg-slate-50/50 dark:bg-slate-900/10 flex flex-col items-center justify-center relative"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Drag & drop files here, or <span className="text-blue-600 dark:text-blue-450 hover:underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-semibold">Maximum file size: 10MB per file</p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200/60 dark:border-slate-850 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-900/20">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Files to Upload ({files.length})</h4>
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-805 dark:text-slate-200 truncate">{file.name}</span>
                            <span className="text-slate-400 font-semibold">({Math.round(file.size / 1024)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors duration-150 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(2)} variant="secondary">
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={handleClose} variant="secondary">
                        Cancel
                      </Button>
                      <Button disabled={files.length === 0} icon={ArrowRight} onClick={() => setStep(4)}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Verify all submission parameters before routing the request.
                  </p>

                  <div className="border border-slate-205 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-3.5">
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Credential Type</span>
                      <span className="text-slate-950 dark:text-white font-extrabold">{credentialType}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Organization</span>
                      <span className="text-slate-950 dark:text-white font-extrabold">{selectedOrg?.name}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Files ({files.length})</span>
                      <div className="truncate text-slate-800 dark:text-slate-300 font-bold">
                        {files.map(f => f.name).join(', ')}
                      </div>
                    </div>
                    {purpose && (
                      <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                        <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Purpose</span>
                        <span className="text-slate-800 dark:text-slate-350 font-semibold">{purpose}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-450 text-[9px] font-bold uppercase tracking-wider block">Timeline Preview</span>
                      <div className="flex gap-2 items-center text-[10px] text-slate-500 dark:text-slate-450 font-semibold mt-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        <span>Submitted ➔ Routed to {selectedOrg?.name} ➔ Awaiting review</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(3)} variant="secondary">
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={handleClose} variant="secondary">
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} variant="primary">
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Routing Success visualization */}
              {step === 5 && (
                <div className="text-center py-6 space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                    <CheckCircle2 className="h-7 w-7 animate-bounce" />
                  </div>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="flex flex-col items-center gap-1.5 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 relative">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>✔ Request Submitted</span>
                      </div>
                      <div className="w-0.5 bg-slate-300 dark:bg-slate-800 h-4 border-l border-dashed border-slate-400 dark:border-slate-600 my-1" />
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
                        <span>📨 Routed To</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedOrg?.name}</strong>
                      </div>
                      <div className="w-0.5 bg-slate-300 dark:bg-slate-800 h-4 border-l border-dashed border-slate-400 dark:border-slate-600 my-1" />
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-450">
                        <span>⏳ Awaiting Organization Review</span>
                      </div>
                    </div>

                    {hasStorageError && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 text-xs text-amber-800 dark:text-amber-400 font-semibold max-w-sm mx-auto text-left space-y-1">
                        <p className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <span>⚠️</span> Storage Offline (Demo Mode)
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          Firebase Storage is unconfigured or offline. Your request has been created with local metadata so you can test verification workflows normally.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button onClick={handleClose} variant="primary" className="px-8 cursor-pointer">
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
