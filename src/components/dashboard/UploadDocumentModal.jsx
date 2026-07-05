import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, addDoc, doc, setDoc } from '../../firebase/firebase.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useAuth } from '../../hooks/useAuth.js';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload.js';
import { createDocumentId, createTimelineEntry, VERIFICATION_STATUS, formatRequestDate } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import {
  X,
  Building2,
  CheckCircle2,
  Globe,
  Upload,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  FileText,
  FileCheck,
  ClipboardList
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function UploadDocumentModal({ isOpen, onClose, targetRequest, initialSelectedOrg }) {
  const { currentUser, userProfile } = useAuth();
  const {
    organizationProfiles,
    verificationServices,
    credentialTemplates,
    credentials,
    documents
  } = useDocuments();

  const { requestVerification } = useDocumentActions();

  // Wizard state: 1: Select Organization, 2: Select Service, 3: Upload Files, 4: Review, 5: Success
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selections
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  // Files dictionary keyed by credential type: { [type]: File }
  const [files, setFiles] = useState({});
  const [purpose, setPurpose] = useState('');
  const [consentApproved, setConsentApproved] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [error, setError] = useState('');
  const [hasStorageError, setHasStorageError] = useState(false);

  // Initialize and handle props updates
  useEffect(() => {
    if (isOpen) {
      setError('');
      setFiles({});
      setPurpose('');
      setConsentApproved(false);
      setSubmitting(false);

      if (targetRequest) {
        // Find corresponding organization profile and service
        const orgProf = organizationProfiles.find(o => o.id === targetRequest.organizationId) || null;
        const service = verificationServices.find(s => s.id === targetRequest.serviceId) || null;
        setSelectedOrg(orgProf);
        setSelectedService(service);
        setStep(3); // Skip directly to file upload stage
      } else if (initialSelectedOrg) {
        setSelectedOrg(initialSelectedOrg);
        const firstService = verificationServices.find(s => s.organizationId === initialSelectedOrg.id) || null;
        setSelectedService(firstService);
        setStep(2); // Go to service selection
      } else {
        setSelectedOrg(null);
        setSelectedService(null);
        setStep(1);
      }
    }
  }, [isOpen, targetRequest, initialSelectedOrg, organizationProfiles, verificationServices]);

  // Derived filter calculations
  const filteredOrgs = useMemo(() => {
    return (organizationProfiles || []).filter((org) => {
      if (org.status !== 'Active') return false;
      const q = searchQuery.toLowerCase();
      return (org.name || '').toLowerCase().includes(q) || (org.category || '').toLowerCase().includes(q);
    });
  }, [organizationProfiles, searchQuery]);

  const activeServices = useMemo(() => {
    if (!selectedOrg) return [];
    return (verificationServices || []).filter(s => s.organizationId === selectedOrg.id && s.status === 'Published');
  }, [verificationServices, selectedOrg]);

  const selectedTemplate = useMemo(() => {
    if (!selectedService) return null;
    return credentialTemplates.find(t => t.serviceId === selectedService.id) || null;
  }, [selectedService, credentialTemplates]);

  // Build Checklist and Reuse Logic
  const checklist = useMemo(() => {
    if (!selectedTemplate) return [];
    const requirements = [
      ...(selectedTemplate.requiredCredentials || []).map(c => ({ ...c, required: true })),
      ...(selectedTemplate.optionalCredentials || []).map(c => ({ ...c, required: false }))
    ];

    return requirements.map(req => {
      // Find if student has a verified, unexpired credential of this type in their vault
      const verifiedCred = (credentials || []).find(c => 
        c.type === req.type && 
        c.status === 'Approved' && 
        !c.isExpired
      );
      return {
        ...req,
        isVerified: !!verifiedCred,
        verifiedCred
      };
    });
  }, [selectedTemplate, credentials]);

  // Progress metrics
  const completedCount = useMemo(() => {
    return checklist.filter(item => item.isVerified || files[item.type]).length;
  }, [checklist, files]);

  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // File dropzone handlers
  const handleFileValidation = (file, constraint) => {
    const fileName = file.name.toLowerCase();
    const isValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!isValidExt) {
      setError(`Invalid file type for ${file.name}. Only PDF, PNG, JPG, and JPEG are allowed.`);
      return false;
    }
    const maxSize = constraint?.maxFileSize || 5242880;
    if (file.size > maxSize) {
      setError(`File size too large: ${file.name}. Maximum size allowed is ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (type, e, constraint) => {
    setError('');
    const file = e.target.files?.[0];
    if (file && handleFileValidation(file, constraint)) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedOrg(null);
    setSelectedService(null);
    setFiles({});
    onClose();
  };

  // Submit request handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure all missing required credentials have an uploaded file
    const missingRequired = checklist.filter(item => item.required && !item.isVerified && !files[item.type]);
    if (missingRequired.length > 0) {
      setError(`Please upload a document for: ${missingRequired.map(i => i.type).join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitProgress('Uploading new documents to cloud storage...');

      const isResolving = !!targetRequest;
      const newRequestId = isResolving ? targetRequest.id : createDocumentId();
      const documentReferences = [];
      let storageErrorOccurred = false;

      // Process and upload each new file
      for (const [credType, file] of Object.entries(files)) {
        if (!file) continue;

        let fileUrl = '';
        let uploadMode = 'cloud';
        let storageStatus = 'enabled';

        try {
          const result = await uploadToCloudinary(file);
          fileUrl = result.url;
        } catch (storageErr) {
          console.warn('Cloudinary upload failed, using local Blob fallback:', storageErr.message);
          fileUrl = URL.createObjectURL(file);
          uploadMode = 'local';
          storageStatus = 'disabled';
          storageErrorOccurred = true;
        }

        // 1. Create a Credential record in Firestore if not already existing
        const credId = `cred-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const credData = {
          id: credId,
          type: credType,
          ownerEmail: userProfile?.email || currentUser?.email || 'student@localhost',
          status: 'Pending',
          verifiedAt: '',
          verifiedBy: '',
          expiresAt: '',
          isReusable: false,
          isExpired: false
        };
        await setDoc(doc(db, 'credentials', credId), credData);

        // 2. Create a Document Version record
        const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const docData = {
          id: docId,
          credentialId: credId,
          fileName: file.name,
          fileUrl,
          version: 1,
          uploadedAt: new Date().toLocaleDateString(),
          uploadMode,
          storageStatus
        };
        await setDoc(doc(db, 'documents', docId), docData);

        documentReferences.push({
          credentialId: credId,
          documentId: docId,
          type: credType,
          fileName: file.name,
          fileUrl
        });
      }

      // Re-link already verified documents from vault
      checklist.forEach(item => {
        if (item.isVerified && item.verifiedCred) {
          // Find document linked to this credential
          const verifiedDoc = documents.find(d => d.credentialId === item.verifiedCred.id);
          documentReferences.push({
            credentialId: item.verifiedCred.id,
            documentId: verifiedDoc?.id || 'doc-link',
            type: item.type,
            fileName: verifiedDoc?.fileName || 'Verified Document',
            fileUrl: verifiedDoc?.fileUrl || ''
          });
        }
      });

      setSubmitProgress('Submitting verification request...');

      // Save verification request details safely resolving any null org/service contexts
      const resolvedOrgId = selectedOrg?.id || targetRequest?.organizationId || 'org-northbridge';
      const resolvedOrgName = selectedOrg?.name || targetRequest?.organizationName || 'Northbridge University';
      const resolvedServiceId = selectedService?.id || targetRequest?.serviceId || 'service-iowa-degree';
      const resolvedServiceName = selectedService?.name || targetRequest?.serviceName || 'Degree Verification';

      const requestPayload = {
        id: newRequestId,
        organizationId: resolvedOrgId,
        organizationName: resolvedOrgName,
        serviceId: resolvedServiceId,
        serviceName: resolvedServiceName,
        ownerEmail: userProfile?.email || currentUser?.email || 'student@localhost',
        status: VERIFICATION_STATUS.PENDING,
        progress: progressPercentage,
        requestDate: formatRequestDate(new Date()),
        timeline: [
          createTimelineEntry('Verification Request Created', VERIFICATION_STATUS.PENDING, new Date())
        ],
        checklist: checklist.map(item => ({
          type: item.type,
          required: item.required,
          status: item.isVerified ? 'Approved' : 'Pending'
        })),
        documentReferences
      };

      await setDoc(doc(db, 'verificationRequests', newRequestId), requestPayload);
      setHasStorageError(storageErrorOccurred);
      setStep(5);
    } catch (err) {
      console.error(err);
      setError('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm px-5 py-6">
      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-[#12131a] shadow-2xl relative border border-slate-205 dark:border-slate-800/40 max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer transition-colors duration-150"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Step headers */}
        {step < 5 && (
          <div className="border-b border-slate-200/80 dark:border-slate-800/60 pb-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Step {step} of 4</span>
              <span>{submitting ? 'Processing' : 'Verification Request Wizard'}</span>
            </div>
            <h2 className="text-sm font-bold text-slate-950 dark:text-white mt-1.5 uppercase tracking-wide">
              {step === 1 && 'Select Organization'}
              {step === 2 && 'Select Verification Service'}
              {step === 3 && 'Submit Credentials Checklist'}
              {step === 4 && 'Review & Submit'}
            </h2>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full mt-3 overflow-hidden border border-slate-200/20 dark:border-slate-800/20">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          {submitting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center uppercase tracking-wider">{submitProgress}</p>
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

              {/* Step 1: Select Organization */}
              {step === 1 && (
                <div className="space-y-4">
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
                            onClick={() => { setSelectedOrg(org); setSelectedService(null); }}
                            className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-500/10'
                                : 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-705'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 shrink-0 border border-blue-100/50 dark:border-blue-800/20">
                                <Building2 className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-950 dark:text-white">{org.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">{org.category}</p>
                              </div>
                            </div>
                            <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-450 ring-1 ring-emerald-500/20 flex items-center gap-0.5">
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

                  <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button disabled={!selectedOrg} icon={ArrowRight} onClick={() => setStep(2)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Select Service */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold leading-relaxed">
                    Select a verification service offered by <strong>{selectedOrg?.name}</strong>.
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeServices.length > 0 ? (
                      activeServices.map(service => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                          <div
                            key={service.id}
                            onClick={() => setSelectedService(service)}
                            className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-500/10'
                                : 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-705'
                            }`}
                          >
                            <h4 className="text-xs font-bold text-slate-950 dark:text-white">{service.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                              {service.description || 'No description provided.'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-450 font-bold py-8 text-center">
                        No verification services published for this organization.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(1)} variant="secondary">
                      Back
                    </Button>
                    <Button disabled={!selectedService} icon={ArrowRight} onClick={() => setStep(3)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Checklist Upload */}
              {step === 3 && (
                <div className="space-y-4">
                  {selectedTemplate?.instructions && (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5 text-xs text-slate-655 dark:text-slate-350 italic">
                      Instructions: "{selectedTemplate.instructions}"
                    </div>
                  )}

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5 bg-slate-55/50 dark:bg-slate-900/20">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                      <span>Requirement Checklist</span>
                      <span className="text-blue-600 dark:text-blue-400">{progressPercentage}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-60 overflow-y-auto">
                    {checklist.map((item, idx) => {
                      const hasUploadedFile = !!files[item.type];
                      return (
                        <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-slate-950 dark:text-white block">{item.type}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider block">
                                {item.required ? 'Upload Required' : 'Optional Upload'}
                              </span>
                            </div>
                            {item.isVerified ? (
                              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/15 flex items-center gap-1">
                                <FileCheck className="h-3.5 w-3.5" />
                                Reusing Verified
                              </span>
                            ) : hasUploadedFile ? (
                              <span className="text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/15 flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                File Selected
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                Action Required
                              </span>
                            )}
                          </div>

                          {!item.isVerified && (
                            <div className="relative">
                              <label className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-800 rounded-xl p-3.5 text-center cursor-pointer transition-colors duration-150">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(item.type, e, item)}
                                  accept={item.acceptedFileTypes?.join(',')}
                                />
                                <div className="space-y-1 text-slate-550 dark:text-slate-400">
                                  <Upload className="h-5 w-5 mx-auto text-slate-450" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                                    {files[item.type] ? files[item.type].name : 'Click to Upload attachment'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-semibold">
                                    {item.acceptedFileTypes?.join(', ')} (Max 5MB)
                                  </span>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(2)} variant="secondary">
                      Back
                    </Button>
                    <Button icon={ArrowRight} onClick={() => setStep(4)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Verify all submission parameters before routing the request.
                  </p>

                  <div className="border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-3.5">
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Organization</span>
                      <span className="text-slate-950 dark:text-white font-extrabold">{selectedOrg?.name}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Service Request</span>
                      <span className="text-slate-950 dark:text-white font-extrabold">{selectedService?.name}</span>
                    </div>
                    <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                      <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Checklist Items</span>
                      <div className="space-y-1">
                        {checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span>{item.isVerified ? '✔' : files[item.type] ? '⬆' : '⬜'}</span>
                            <span>{item.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <input
                      id="consent-checkbox"
                      type="checkbox"
                      checked={consentApproved}
                      onChange={(e) => setConsentApproved(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="consent-checkbox" className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-normal cursor-pointer select-none">
                      I consent to uploading and sharing these checklist documents with <strong>{selectedOrg?.name}</strong>. I authorize the organization to review and verify this credential.
                    </label>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(3)} variant="secondary">
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={handleClose} variant="secondary">
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} variant="primary" disabled={!consentApproved}>
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Success */}
              {step === 5 && (
                <div className="text-center py-6 space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="flex flex-col items-center gap-1.5 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 relative">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>✔ Checklist Verification Started</span>
                      </div>
                      <div className="w-0.5 bg-slate-300 dark:bg-slate-800 h-4 border-l border-dashed border-slate-400 dark:border-slate-650 my-1" />
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
                        <span>📨 Routed To</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedOrg?.name}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                      Verification requests have been successfully routed to the organization reviews pipeline. Check your dashboard for real-time status telemetry.
                    </p>

                    <Button onClick={handleClose} variant="primary" className="mx-auto mt-4 px-6 justify-center">
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
