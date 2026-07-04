import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase.js';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { createDocumentId } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
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

export default function UploadDocumentModal({ isOpen, onClose }) {
  const { requestVerification } = useDocumentActions();

  // Wizard state: 1: Type, 2: Organization, 3: Files, 4: Review, 5: Success
  const [step, setStep] = useState(1);
  const [organizations, setOrganizations] = useState([]);
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

  // Query organizations from Firestore on mount
  useEffect(() => {
    if (!isOpen) return;
    const q = query(
      collection(db, 'organizations'),
      where('status', '==', 'Active'),
      where('verificationStatus', '==', 'Verified')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orgs = [];
      snapshot.forEach((doc) => {
        orgs.push({ id: doc.id, ...doc.data() });
      });
      setOrganizations(orgs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter organizations matching mapped credential type
  const targetOrgType = CREDENTIAL_TYPE_MAP[credentialType];
  const filteredOrgs = organizations.filter((org) => {
    const matchesType = org.type === targetOrgType;
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
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

    const promiseWithTimeout = (promise, ms, errorMsg) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
      ]);
    };

    try {
      setSubmitting(true);
      setSubmitProgress('Uploading documents to Firebase Storage...');
      setError('');

      const newRequestId = createDocumentId();
      const fileMetadata = [];

      // Upload each file to Storage
      for (const file of files) {
        const fileRef = ref(storage, `verificationRequests/${newRequestId}/${file.name}`);
        
        await promiseWithTimeout(
          uploadBytes(fileRef, file),
          30000,
          `Upload timed out for file: ${file.name} (30s limit exceeded)`
        );

        const downloadUrl = await promiseWithTimeout(
          getDownloadURL(fileRef),
          15000,
          `Failed to retrieve download URL for file: ${file.name}`
        );

        fileMetadata.push({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath: fileRef.fullPath,
          downloadURL: downloadUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      setSubmitProgress('Submitting verification request...');
      await promiseWithTimeout(
        requestVerification({
          id: newRequestId,
          credentialType,
          organization: {
            id: selectedOrg.id,
            name: selectedOrg.name,
            type: selectedOrg.type,
          },
          purpose: purpose.trim() || `${credentialType} Verification`,
          fileName: files[0].name,
          files: fileMetadata,
        }),
        15000,
        'Firestore request submission timed out'
      );

      // Navigate to routing visualization success step
      setStep(5);
    } catch (err) {
      console.error(err);
      setError('Failed to submit request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white shadow-2xl relative border border-slate-200">
        
        {/* Step Indicator Headers */}
        {step < 5 && (
          <div className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Step {step} of 4</span>
              <span>{submitting ? 'Processing' : 'Request Verification'}</span>
            </div>
            {/* Step titles */}
            <h2 className="text-xl font-bold text-slate-950 mt-1">
              {step === 1 && 'Choose Credential Type'}
              {step === 2 && 'Select Verified Organization'}
              {step === 3 && 'Upload Document Files'}
              {step === 4 && 'Review & Submit Request'}
            </h2>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal content body */}
        <div className="mt-6">
          {submitting ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-10 w-10 text-blue-700 animate-spin" />
              <p className="font-semibold text-slate-800 text-center">{submitProgress}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-100 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="text-red-900 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 1: Credential Type Select */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Specify the type of credential you wish to verify. This filters authorized organizations automatically.
                  </p>
                  <div>
                    <label htmlFor="credentialType" className="block text-xs font-bold text-slate-500 uppercase">
                      Credential Type
                    </label>
                    <select
                      id="credentialType"
                      value={credentialType}
                      onChange={(e) => setCredentialType(e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700 bg-white"
                    >
                      {credentialTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="purpose" className="block text-xs font-bold text-slate-500 uppercase">
                      Verification Purpose (Optional)
                    </label>
                    <input
                      id="purpose"
                      type="text"
                      placeholder="e.g. Higher Education, Employment Check"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleClose} variant="secondary" className="mr-2">
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
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Search and select a verified issuing organization matching type: <strong className="text-slate-950">{targetOrgType}</strong>.
                  </p>
                  <input
                    type="text"
                    placeholder="🔍 Search organization by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700"
                  />

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 rounded-md p-2 bg-slate-50">
                    {filteredOrgs.length > 0 ? (
                      filteredOrgs.map((org) => {
                        const isSelected = selectedOrg?.id === org.id;
                        return (
                          <div
                            key={org.id}
                            onClick={() => setSelectedOrg(org)}
                            className={`p-3 rounded-md border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-700 bg-blue-50/50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-700 shrink-0">
                                <Building2 className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-sm font-bold text-slate-950">{org.name}</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                                  <span>{org.type}</span>
                                  {org.website && (
                                    <span className="flex items-center gap-0.5">
                                      <Globe className="h-3 w-3" />
                                      {org.website}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-0.5 whitespace-nowrap">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified by VeriFlash
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No active, verified organizations found matching your search.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
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
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Upload document copies for review. Supported formats: <strong className="text-slate-950">PDF, PNG, JPG, JPEG</strong>.
                  </p>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-700 transition cursor-pointer bg-slate-50/50 flex flex-col items-center justify-center relative"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Drag & drop your files here, or <span className="text-blue-700 hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Maximum file size: 10MB</p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-100 rounded-md p-2 bg-slate-50">
                      <h4 className="text-xs font-bold uppercase text-slate-400">Files to Upload ({files.length})</h4>
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                            <span className="text-slate-400">({Math.round(file.size / 1024)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-slate-400 hover:text-red-700 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
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
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Verify all submission parameters before routing the request.
                  </p>

                  <div className="border border-slate-200 rounded-md p-4 bg-slate-50 text-sm space-y-3">
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-semibold">Credential Type</span>
                      <span className="text-slate-900 font-bold">{credentialType}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-semibold">Organization</span>
                      <span className="text-slate-900 font-bold">{selectedOrg?.name}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-semibold">Files ({files.length})</span>
                      <div className="truncate text-slate-800 text-xs font-semibold">
                        {files.map(f => f.name).join(', ')}
                      </div>
                    </div>
                    {purpose && (
                      <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-semibold">Purpose</span>
                        <span className="text-slate-850 text-xs">{purpose}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-semibold uppercase block">Timeline Preview</span>
                      <div className="flex gap-2 items-center text-xs text-slate-600 pl-1 mt-1">
                        <span className="h-2 w-2 rounded-full bg-blue-700" />
                        <span>Submitted ➔ Routed to {selectedOrg?.name} ➔ Awaiting review</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                  </div>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="flex flex-col items-center gap-1.5 border border-slate-200 rounded-md p-4 bg-slate-50 relative">
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>✔ Request Submitted</span>
                      </div>
                      <div className="w-0.5 bg-slate-350 h-4 border-l border-dashed border-slate-400 my-1" />
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span>📨 Routed To</span>
                        <strong className="text-blue-700">{selectedOrg?.name}</strong>
                      </div>
                      <div className="w-0.5 bg-slate-350 h-4 border-l border-dashed border-slate-400 my-1" />
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <span>⏳ Awaiting Organization Review</span>
                      </div>
                    </div>
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
