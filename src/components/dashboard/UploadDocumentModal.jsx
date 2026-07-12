import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { db, doc, setDoc } from '../../firebase/firebase.js';
import { useDocuments } from '../../hooks/useDocuments.js';
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
  ClipboardList,
  Sparkles
} from 'lucide-react';

const CaptureStudio = lazy(() => import('./CaptureStudio.jsx'));

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function UploadDocumentModal({ isOpen, onClose, targetRequest, initialSelectedOrg, presetDocumentType, presetReason }) {
  const { currentUser, userProfile } = useAuth();
  const {
    organizationProfiles,
    verificationServices,
    credentialTemplates,
    credentials,
    documents
  } = useDocuments();


  // Wizard state: 1: Select Organization, 2: Select Service, 3: Upload Files, 4: Review, 5: Success
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selections
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  // Files dictionary keyed by credential type: { [type]: File }
  const [files, setFiles] = useState({});
  const [consentApproved, setConsentApproved] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [error, setError] = useState('');
  const [captureTarget, setCaptureTarget] = useState(null);

  // AI Checklist Suggestion states
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Initialize and handle props updates
  useEffect(() => {
    if (isOpen) {
      setError('');
      setFiles({});
      setConsentApproved(false);
      setSubmitting(false);
      setCaptureTarget(null);

      if (presetDocumentType) {
        setSelectedOrg(null);
        setSelectedService(null);
        setStep(3);
      } else if (targetRequest) {
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
  }, [isOpen, targetRequest, initialSelectedOrg, organizationProfiles, verificationServices, presetDocumentType]);

  useEffect(() => {
    if (presetDocumentType && isOpen) {
      setLoadingAi(false);
      setAiSuggestion(presetReason || `UniCrypt AI recommends uploading a clear, high-resolution scan of your ${presetDocumentType}. Make sure it is issued officially and contains all necessary authorization seals.`);
      return undefined;
    }
    if (selectedService && selectedOrg && isOpen) {
      setLoadingAi(true);
      setAiSuggestion('');
      
      const timer = setTimeout(() => {
        let suggestion = '';
        const orgType = selectedOrg.category || 'University';
        
        if (orgType === 'University') {
          suggestion = `UniCrypt AI recommends uploading a clear, high-resolution scan of your Degree Certificate and complete Semester Transcripts. If your documents are in a language other than English, attaching a certified translation is highly recommended.`;
        } else if (orgType === 'Employer') {
          suggestion = `UniCrypt AI suggests uploading your official Experience Letter and the last 3 months of Payslips. Make sure your previous employer's corporate seal and HR contact details are clearly legible.`;
        } else if (orgType === 'Bank') {
          suggestion = `UniCrypt AI recommends uploading your official Admission Offer Letter, Passport identity pages, and Bank Account Statements for the last 6 months to ensure quick loan approval.`;
        } else if (orgType === 'Government') {
          suggestion = `UniCrypt AI suggests uploading your valid National Passport and Address Proof. Ensure that the name on both documents matches your registered profile spelling exactly.`;
        } else {
          suggestion = `UniCrypt AI suggests uploading your Professional Certificate along with your Candidate/Exam ID report. Automated parsing works best when files are in PDF format.`;
        }
        
        setAiSuggestion(suggestion);
        setLoadingAi(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [selectedService, selectedOrg, isOpen, presetDocumentType, presetReason]);

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
    if (presetDocumentType) {
      return [{
        type: presetDocumentType,
        required: true,
        isVerified: false,
        verifiedCred: null
      }];
    }
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
  }, [selectedTemplate, credentials, presetDocumentType]);

  // Progress metrics
  const completedCount = useMemo(() => {
    return checklist.filter(item => item.isVerified || files[item.type]).length;
  }, [checklist, files]);

  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;


  const handleClose = () => {
    setStep(1);
    setSelectedOrg(null);
    setSelectedService(null);
    setFiles({});
    setCaptureTarget(null);
    onClose();
  };

  const handleCaptureComplete = (file) => {
    if (captureTarget && file) {
      setFiles(previous => ({ ...previous, [captureTarget.type]: file }));
    }
    setCaptureTarget(null);
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

      if (presetDocumentType) {
        setStep(5);
        return;
      }

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

                  {/* AI Suggestion Panel */}
                  <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 bg-[#12131a]/10 backdrop-blur space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl pointer-events-none"></div>
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                      </span>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Document Checklist Advisor</h4>
                    </div>
                    {loadingAi ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        <span>AI is analyzing requirements...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed relative z-10">
                        {aiSuggestion}
                      </p>
                    )}
                  </div>

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
                            <button
                              className="flex w-full items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-800 rounded-xl p-3.5 text-center cursor-pointer transition-colors duration-150"
                              onClick={() => setCaptureTarget(item)}
                              type="button"
                            >
                              <div className="space-y-1 text-slate-550 dark:text-slate-400">
                                <Upload className="h-5 w-5 mx-auto text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider block">
                                  {files[item.type] ? 'Replace with UniCrypt Capture' : 'Upload or Capture Document'}
                                </span>
                                <span className="text-[9px] text-slate-400 block font-semibold">Camera guidance and enhanced scans available</span>
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <Button icon={ArrowLeft} onClick={() => setStep(2)} variant="secondary" disabled={!!presetDocumentType}>
                      Back
                    </Button>
                    <Button icon={ArrowRight} onClick={() => setStep(4)} disabled={checklist.some(item => item.required && !item.isVerified && !files[item.type])}>
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
                    {presetDocumentType ? (
                      <>
                        <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                          <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">Document Category</span>
                          <span className="text-slate-950 dark:text-white font-extrabold">{presetDocumentType}</span>
                        </div>
                        <div className="grid grid-cols-[1.2fr_2fr] gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                          <span className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">File Name</span>
                          <span className="text-slate-950 dark:text-white font-extrabold">{files[presetDocumentType]?.name}</span>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                    {presetDocumentType ? (
                      <div className="flex flex-col items-center gap-1.5 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 relative">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>✔ {presetDocumentType} Uploaded</span>
                        </div>
                      </div>
                    ) : (
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
                    )}

                    <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                      {presetDocumentType
                        ? `Your ${presetDocumentType} has been successfully uploaded and stored securely in your Credential Vault.`
                        : 'Verification requests have been successfully routed to the organization reviews pipeline. Check your dashboard for real-time status telemetry.'}
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
      {captureTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700/50 bg-white p-5 shadow-2xl dark:bg-[#12131a] sm:p-6">
            <Suspense fallback={<div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>}>
              <CaptureStudio credentialType={captureTarget.type} onCancel={() => setCaptureTarget(null)} onComplete={handleCaptureComplete} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
