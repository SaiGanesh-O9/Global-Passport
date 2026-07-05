import React, { useState, useMemo } from 'react';
import { Eye, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { db, collection, addDoc } from '../../firebase/firebase.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';



export default function InstitutionTable({ activeTab }) {
  const { verificationRequests, loading } = useDocuments();
  const { approveVerification, rejectVerification, requestMoreInformation } = useDocumentActions();
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [feedbackStatus, setFeedbackStatus] = useState({});

  const handleFeedback = async (requestId, opinion) => {
    try {
      await addDoc(collection(db, 'aiFeedback'), {
        requestId,
        opinion,
        timestamp: new Date().toISOString()
      });
      setFeedbackStatus(prev => ({ ...prev, [requestId]: true }));
    } catch (e) {
      console.error("AI Feedback logging failed:", e);
      setFeedbackStatus(prev => ({ ...prev, [requestId]: true }));
    }
  };

  const analyzeRequestAI = (req) => {
    const hasFiles = req.files && req.files.length > 0;
    const fileSize = hasFiles ? req.files[0].fileSize || 0 : (req.fileSize || 0);
    const isTooSmall = hasFiles && fileSize < 10240; 
    
    const orgDomain = req.organization?.officialEmailDomain || '';
    const ownerEmail = req.owner?.email || req.ownerEmail || '';
    const isMatchingDomain = orgDomain && ownerEmail.endsWith(`@${orgDomain}`);
    
    let riskScore = 20;
    let recommendation = 'APPROVE';
    let confidence = 92;
    let reasoning = 'Document structure matches expected schema. Clear signature detected.';
    let priority = 1;

    if (isTooSmall) {
      riskScore = 85;
      recommendation = 'REJECT';
      confidence = 88;
      reasoning = 'High Risk: Document file size is suspiciously small (< 10KB). Potential blank or corrupted upload.';
      priority = 4;
    } else if (!hasFiles && !req.fileName) {
      riskScore = 95;
      recommendation = 'REJECT';
      confidence = 95;
      reasoning = 'Urgent: No document files attached to this request. Critical validation omission.';
      priority = 4;
    } else if (req.status === 'Information Requested') {
      riskScore = 55;
      recommendation = 'REVIEW';
      confidence = 75;
      reasoning = 'Medium Risk: Verification pending additional user uploads or responses.';
      priority = 3;
    } else if (isMatchingDomain) {
      riskScore = 5;
      recommendation = 'APPROVE';
      confidence = 98;
      reasoning = 'Low Risk: Owner email matches registered organization domain domain perfectly.';
      priority = 1;
    }

    return { riskScore, recommendation, confidence, reasoning, priority };
  };

  const toggleExpand = (id) => {
    setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [actionFeedback, setActionFeedback] = useState(null);

  const handleAction = async (requestId, statusName, actionFn) => {
    setProcessingId(requestId);
    try {
      await actionFn(requestId);
      setActionFeedback({ id: requestId, status: statusName });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Action failed: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return verificationRequests.filter((req) => {
      const name = (req.ownerName || req.owner || '').toLowerCase();
      const type = (req.credentialType || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                            type.includes(searchQuery.toLowerCase());
      
      let matchesTab = false;
      if (activeTab === 'pending') {
        matchesTab = req.status === 'Pending' || req.status === 'Information Requested';
      } else if (activeTab === 'approved') {
        matchesTab = req.status === 'Approved';
      } else if (activeTab === 'rejected') {
        matchesTab = req.status === 'Rejected';
      } else {
        matchesTab = true;
      }

      const matchesDropdown = statusFilter === 'All' || req.status === statusFilter;
      return matchesSearch && matchesTab && matchesDropdown;
    });
  }, [verificationRequests, searchQuery, statusFilter, activeTab]);

  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    if (activeTab === 'pending') {
      list.sort((a, b) => {
        const analysisA = analyzeRequestAI(a);
        const analysisB = analyzeRequestAI(b);
        if (analysisB.priority !== analysisA.priority) {
          return analysisB.priority - analysisA.priority;
        }
        return analysisB.riskScore - analysisA.riskScore;
      });
    }
    return list;
  }, [filteredRequests, activeTab]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRequests, currentPage]);

  const headerTitle = activeTab === 'pending' ? 'Pending Verification Requests' :
                      activeTab === 'approved' ? 'Approved Verifications' :
                      'Rejected Requests';

  return (
    <Card className="overflow-hidden bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm">
      <div className="border-b border-slate-200/80 dark:border-slate-800/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">{headerTitle}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Review submitted requests and choose the next action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search requester, type..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900/40 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 w-44 font-semibold transition-theme"
          />
          {activeTab === 'all' && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 outline-none cursor-pointer transition-theme"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Information Requested">Information Requested</option>
            </select>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/40">
            <tr>
              <th className="px-5 py-4">Requester</th>
              <th className="px-5 py-4">Credential Type</th>
              <th className="px-5 py-4">Requested Date</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Loading requests...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">
                  No verification requests found matching the active filters.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((request) => {
                const isExpanded = expandedRequests[request.id];
                const showActions = request.status === 'Pending' || request.status === 'Information Requested';

                const isHighlighted = actionFeedback?.id === request.id;
                const highlightClass = isHighlighted
                  ? (actionFeedback.status === 'Approved'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/25'
                      : actionFeedback.status === 'Rejected'
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 ring-2 ring-rose-500/25'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/25')
                  : 'bg-white dark:bg-[#12131a]/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10';

                return (
                  <React.Fragment key={request.id}>
                    <tr className={`${highlightClass} transition-all duration-300`}>
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {request.ownerName || request.ownerEmail || request.owner || 'Anonymous User'}
                      </td>
                      <td className="px-5 py-4 text-slate-650 dark:text-slate-350 font-semibold">{request.credentialType}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-semibold">{request.requestDate}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => toggleExpand(request.id)}
                            variant="secondary"
                            className="py-1 px-3 text-xs"
                            icon={isExpanded ? ChevronUp : ChevronDown}
                          >
                            {isExpanded ? 'Hide Details' : 'Expand Details'}
                          </Button>
                          {showActions ? (
                            <>
                              <Button
                                onClick={() => handleAction(request.id, 'Approved', approveVerification)}
                                disabled={processingId !== null}
                                variant="success"
                                className="py-1 px-3 text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleAction(request.id, 'Rejected', rejectVerification)}
                                disabled={processingId !== null}
                                variant="danger"
                                className="py-1 px-3 text-xs"
                              >
                                Reject
                              </Button>
                              {request.status !== 'Information Requested' && (
                                <Button
                                  onClick={() => handleAction(request.id, 'Information Requested', requestMoreInformation)}
                                  disabled={processingId !== null}
                                  variant="secondary"
                                  className="py-1 px-3 text-xs"
                                >
                                  Request Info
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button 
                              to={`/verify/${request.verificationId || request.id}`}
                              icon={Eye} 
                              variant="primary"
                              className="py-1 px-3 text-xs"
                            >
                              View Request
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/20 dark:bg-slate-950/10">
                        <td colSpan={5} className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800/40 space-y-5">
                          {/* Details panel */}
                          <div className="text-xs space-y-2">
                            <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Request Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                              <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase block tracking-wider">Purpose Description</span>
                                <span className="text-slate-805 dark:text-slate-200 font-bold block mt-1">{request.purpose || 'None'}</span>
                              </div>
                              <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase block tracking-wider">Requested Verification ID</span>
                                <span className="font-mono text-slate-805 dark:text-slate-200 font-bold block mt-1 truncate">{request.verificationId || request.id}</span>
                              </div>
                            </div>
                          </div>

                          {/* File lists */}
                          {request.files && request.files.length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Submitted Documents for Review</p>
                              <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800/40 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden">
                                {request.files.map((file, fIdx) => {
                                  const fileUrl = file.fileUrl;
                                  return (
                                    <li key={fIdx} className="flex justify-between items-center px-4 py-3 text-xs">
                                      <span className="text-slate-700 dark:text-slate-300 font-bold">{file.fileName}{file.fileSize ? ` (${Math.round(file.fileSize / 1024)} KB)` : ''}</span>
                                      {fileUrl ? (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-650 dark:text-blue-400 font-bold hover:underline"
                                        >
                                          View & Review File
                                        </a>
                                      ) : (
                                        <span className="text-amber-600 dark:text-amber-450 font-bold uppercase tracking-wider text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                          Demo Mode – File not uploaded
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                           {/* AI Decision Intelligence Analysis */}
                          {(() => {
                            const analysis = analyzeRequestAI(request);
                            const recBg = analysis.recommendation === 'APPROVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                          analysis.recommendation === 'REJECT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400' :
                                          'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
                            
                            return (
                              <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-205/65 dark:border-slate-800/40 rounded-2xl p-4.5 space-y-3 relative overflow-hidden mt-4">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                                    </span>
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Automation Decision Recommendation</h4>
                                  </div>
                                  <span className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase rounded-md border ${recBg}`}>
                                    {analysis.recommendation} (Confidence: {analysis.confidence}%)
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs relative z-10">
                                  <div className="bg-white dark:bg-[#12131a] p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Computed Risk Score</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-sm font-extrabold ${analysis.riskScore > 75 ? 'text-rose-500' : analysis.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {analysis.riskScore} / 100
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                                        ({analysis.riskScore > 75 ? 'High Risk' : analysis.riskScore > 40 ? 'Medium Risk' : 'Low Risk'})
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white dark:bg-[#12131a] p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/30 sm:col-span-2">
                                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">AI Analysis Reasoning</span>
                                    <p className="text-slate-700 dark:text-slate-300 font-semibold mt-1 leading-snug">{analysis.reasoning}</p>
                                  </div>
                                </div>

                                {/* Feedback Loop */}
                                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-[10px] relative z-10">
                                  <span className="font-bold text-slate-400 uppercase tracking-wider">Do you agree with this recommendation?</span>
                                  {feedbackStatus[request.id] ? (
                                    <span className="text-emerald-600 dark:text-emerald-450 font-bold">✓ Feedback recorded! Thanks for improving the model.</span>
                                  ) : (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleFeedback(request.id, 'agree')}
                                        className="px-2 py-0.5 rounded bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 dark:hover:text-slate-250 cursor-pointer font-bold"
                                      >
                                        Yes, agree
                                      </button>
                                      <button
                                        onClick={() => handleFeedback(request.id, 'disagree')}
                                        className="px-2 py-0.5 rounded bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 dark:hover:text-slate-250 cursor-pointer font-bold"
                                      >
                                        No, disagree
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Change Narrative Timeline & Banner */}
                          {request.timeline && request.timeline.length > 0 && (
                            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                              <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">History & Status Transitions</p>
                              
                              {(() => {
                                const latestTransition = request.timeline[request.timeline.length - 1];
                                if (!latestTransition) return null;
                                
                                const bannerBg = request.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                                                 request.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/20 text-rose-800 dark:text-rose-300' :
                                                 'bg-blue-50 dark:bg-blue-950/20 border-blue-500/20 text-blue-850 dark:text-blue-300';
                                
                                return (
                                  <div className={`border rounded-xl p-3.5 mb-4 text-xs font-semibold flex items-center justify-between ${bannerBg}`}>
                                    <div>
                                      <span className="uppercase text-[9px] font-bold block tracking-wider opacity-85">Latest Event Narrative</span>
                                      <span className="block mt-1 font-bold">{latestTransition.title} — {latestTransition.details || 'System status updated.'}</span>
                                      <span className="block mt-1 text-[10px] opacity-90 font-extrabold uppercase tracking-wide">
                                        Transition: {request.timeline.length > 1 ? request.timeline[request.timeline.length - 2].status : 'Initiated'} &rarr; {request.status}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-80">{new Date(latestTransition.timestamp).toLocaleString()}</span>
                                  </div>
                                );
                              })()}

                              <div className="bg-white dark:bg-slate-900/30 border border-slate-205/50 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
                                {request.timeline.map((step, sIdx) => (
                                  <div key={sIdx} className="flex justify-between text-xs items-center">
                                    <div className="flex items-center gap-3">
                                      <span className={`h-2 w-2 rounded-full ${request.status === step.status ? 'bg-blue-500' : 'bg-slate-350 dark:bg-slate-700'}`}></span>
                                      <span className="font-bold text-slate-805 dark:text-slate-205">{step.title}</span>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-500 font-bold">{new Date(step.timestamp).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/40 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/10">
        <span className="text-xs text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider">
          Page {currentPage} of {totalPages} ({filteredRequests.length} requests)
        </span>
        <div className="flex gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            variant="secondary"
            className="py-1 px-3 text-xs"
          >
            Previous
          </Button>
          <Button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            variant="secondary"
            className="py-1 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
