import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link2, Eye, ChevronDown, ChevronUp, Check, ShieldAlert, Loader2 } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments.js';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { VERIFICATION_STATUS } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import UploadDocumentModal from './UploadDocumentModal.jsx';
import EmptyState from '../ui/EmptyState.jsx';



function renderProgressTracker(req) {
  const status = req.status;
  
  // Stages: Submitted -> Delivered -> Under Review -> Result
  let activeIndex = 0;
  if (status === 'Pending') {
    activeIndex = 2; // Under Review
  } else if (status === 'Information Requested') {
    activeIndex = 2; // Under Review
  } else if (status === 'Approved' || status === 'Rejected') {
    activeIndex = 3; // Completed
  }

  const stages = [
    { label: 'Submitted', desc: 'Request initiated' },
    { label: 'Delivered', desc: req.organization?.name || req.requestedOrganization },
    { label: 'Under Review', desc: 'Verifier checking' },
    { label: status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Result Pending', desc: '' }
  ];

  return (
    <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4">
      {/* Newly submitted pending request routing visualization */}
      {status === 'Pending' && (
        <div className="mb-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-blue-500/5 border border-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-350">
          <span className="text-emerald-700 dark:text-emerald-450 flex items-center gap-1 font-extrabold">✔ Request Submitted</span>
          <span className="text-slate-400 dark:text-slate-655 font-bold">➔</span>
          <span className="flex items-center gap-1">
            <span>📨 Routed To</span>
            <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{req.organization?.name || req.requestedOrganization}</strong>
          </span>
          <span className="text-slate-400 dark:text-slate-655 font-bold">➔</span>
          <span className="text-slate-500 dark:text-slate-450 font-bold">⏳ Awaiting Review</span>
        </div>
      )}

      {/* Stepper display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5 flex-1" key={idx}>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-slate-50 dark:ring-[#12131a] shrink-0 transition-theme ${
                  isCompleted ? 'bg-emerald-600 dark:bg-emerald-650 text-white' :
                  isActive ? 'bg-blue-600 dark:bg-blue-600 text-white' :
                  'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {isCompleted ? <Check className="h-3 w-3 text-white" /> : idx + 1}
                </span>
                <span className={`text-[11px] font-extrabold uppercase tracking-wide transition-theme ${
                  isActive ? 'text-blue-600 dark:text-blue-400' :
                  isCompleted ? 'text-slate-800 dark:text-slate-300' :
                  'text-slate-400 dark:text-slate-550'
                }`}>
                  {stage.label}
                </span>
              </div>
              {stage.desc && (
                <p className="text-[10px] text-slate-500 dark:text-slate-450 pl-9 sm:pl-0.5 font-semibold leading-relaxed truncate max-w-full">{stage.desc}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DocumentTable() {
  const { userVerificationRequests, loading } = useDocuments();
  const { setSelectedRequest } = useDocumentActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRequests, setExpandedRequests] = useState({});
  const [highlightedRequests, setHighlightedRequests] = useState({});
  const [resolveRequest, setResolveRequest] = useState(null);
  const prevRequestsRef = useRef(null);

  useEffect(() => {
    if (userVerificationRequests && userVerificationRequests.length > 0) {
      if (prevRequestsRef.current && prevRequestsRef.current.length > 0) {
        const newHighlights = {};
        userVerificationRequests.forEach((req) => {
          const prev = prevRequestsRef.current.find((p) => p.id === req.id);
          if (prev && prev.status !== req.status) {
            newHighlights[req.id] = req.status;
          }
        });

        if (Object.keys(newHighlights).length > 0) {
          setHighlightedRequests((prev) => ({ ...prev, ...newHighlights }));
          setTimeout(() => {
            setHighlightedRequests((prev) => {
              const updated = { ...prev };
              Object.keys(newHighlights).forEach((id) => delete updated[id]);
              return updated;
            });
          }, 3000);
        }
      }
      prevRequestsRef.current = userVerificationRequests;
    }
  }, [userVerificationRequests]);

  const toggleExpand = (req) => {
    setExpandedRequests(prev => ({ ...prev, [req.id]: !prev[req.id] }));
    setSelectedRequest(req);
  };

  const filteredRequests = useMemo(() => {
    return userVerificationRequests.filter((req) => {
      const type = (req.credentialType || '').toLowerCase();
      const org = (req.organization?.name || req.requestedOrganization || '').toLowerCase();
      const matchesSearch = type.includes(searchQuery.toLowerCase()) || org.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userVerificationRequests, searchQuery, statusFilter]);

  if (filteredRequests.length === 0 && !loading) {
    return (
      <EmptyState
        title="No Verification Requests"
        description="You do not have any verification requests. Explore partner organizations or submit credentials to get started."
        actionLabel="Explore Organizations"
        onAction={() => { window.location.hash = '#organizations'; }}
      />
    );
  }

  return (
    <Card className="overflow-hidden bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm">
      <div className="border-b border-slate-200/80 dark:border-slate-800/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">My Verification Requests</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Track verification request status in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900/40 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 w-44 font-semibold transition-theme"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 outline-none cursor-pointer transition-theme"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Information Requested">Information Requested</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/40">
            <tr>
              <th className="px-5 py-4">Credential</th>
              <th className="px-5 py-4">Organization</th>
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
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">
                  No verification requests found matching the filters.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const isApproved = req.status === VERIFICATION_STATUS.APPROVED;
                const orgName = req.organization?.name || req.requestedOrganization;
                const isExpanded = expandedRequests[req.id];

                const isHighlighted = highlightedRequests[req.id];
                const highlightClass = isHighlighted
                  ? (isHighlighted === VERIFICATION_STATUS.APPROVED
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/25'
                      : isHighlighted === VERIFICATION_STATUS.REJECTED
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 ring-2 ring-rose-500/25'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/25')
                  : 'bg-white dark:bg-[#12131a]/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10';

                return (
                  <React.Fragment key={req.id}>
                    <tr 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                          detail: {
                            id: `verification.${req.id}`,
                            type: 'verification',
                            title: req.credentialType,
                            subtitle: `Request routed to ${orgName}`,
                            status: req.status,
                            val: req.status,
                            detail: `Issued on ${req.requestDate} via encrypted compliance protocol.`
                          }
                        }));
                      }}
                      onDoubleClick={() => setSelectedRequest(req)}
                      className={`${highlightClass} transition-all duration-300 cursor-pointer select-none`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">
                        {req.credentialType}
                      </td>
                      <td className="px-5 py-4 text-slate-650 dark:text-slate-350 font-semibold">{orgName}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-semibold">{req.requestDate}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(req); }}
                            variant="secondary"
                            className="py-1 px-3 text-xs"
                            icon={isExpanded ? ChevronUp : ChevronDown}
                          >
                            {isExpanded ? 'Hide Details' : 'Expand Details'}
                          </Button>
                          {isApproved ? (
                            <>
                              <Button
                                to={`/verify/${req.verificationId}`}
                                onClick={(e) => e.stopPropagation()}
                                variant="primary"
                                className="py-1 px-3 text-xs"
                                icon={Eye}
                              >
                                View
                              </Button>
                              <Button
                                icon={Link2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = `${window.location.origin}/verify/${req.verificationId}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Share link copied to clipboard!');
                                }}
                                variant="secondary"
                                className="py-1 px-3 text-xs"
                              >
                                Share
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button disabled variant="primary" className="py-1 px-3 text-xs opacity-40" icon={Eye}>
                                View
                              </Button>
                              <Button disabled icon={Link2} variant="secondary" className="py-1 px-3 text-xs opacity-40">
                                Share
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/20 dark:bg-slate-950/10">
                        <td colSpan={5} className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800/40 space-y-5">
                          {renderProgressTracker(req)}

                          {/* Change Narrative Timeline & Banner */}
                          {req.timeline && req.timeline.length > 0 && (
                            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">History & Status Transitions</p>
                              
                              {(() => {
                                const latestTransition = req.timeline[req.timeline.length - 1];
                                if (!latestTransition) return null;
                                
                                const bannerBg = req.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                                                 req.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/20 text-rose-800 dark:text-rose-300' :
                                                 'bg-blue-50 dark:bg-blue-950/20 border-blue-500/20 text-blue-800 dark:text-blue-300';
                                
                                return (
                                  <div className={`border rounded-xl p-3.5 mb-4 text-xs font-semibold flex items-center justify-between ${bannerBg}`}>
                                    <div>
                                      <span className="uppercase text-[9px] font-bold block tracking-wider opacity-85">Latest Event Narrative</span>
                                      <span className="block mt-1 font-bold">{latestTransition.title} — {latestTransition.details || 'System status updated.'}</span>
                                      <span className="block mt-1 text-[10px] opacity-90 font-extrabold uppercase tracking-wide">
                                        Transition: {req.timeline.length > 1 ? req.timeline[req.timeline.length - 2].status : 'Initiated'} &rarr; {req.status}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-80">{new Date(latestTransition.timestamp).toLocaleString()}</span>
                                  </div>
                                );
                              })()}

                              <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
                                {req.timeline.map((step, sIdx) => (
                                  <div key={sIdx} className="flex justify-between text-xs items-center">
                                    <div className="flex items-center gap-3">
                                      <span className={`h-2 w-2 rounded-full ${req.status === step.status ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                                      <span className="font-bold text-slate-800 dark:text-slate-205">{step.title}</span>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-500 font-bold">{new Date(step.timestamp).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* File lists */}
                          {req.files && req.files.length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted Documents</p>
                              <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800/40 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden">
                                {req.files.map((file, fIdx) => {
                                  const fileUrl = file.fileUrl;
                                  return (
                                    <li key={fIdx} className="flex justify-between items-center px-4 py-3 text-xs">
                                      <span className="text-slate-700 dark:text-slate-300 font-bold">{file.fileName}{file.fileSize ? ` (${Math.round(file.fileSize / 1024)} KB)` : ''}</span>
                                      {fileUrl ? (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                        >
                                          View File
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

                          {req.status === 'Information Requested' && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4.5 space-y-3 mt-4">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                📝 <strong>{req.organization?.name || req.requestedOrganization}</strong> requested this document.
                              </p>
                              {req.purpose && (
                                <p className="text-xs text-slate-500 dark:text-slate-450 italic">
                                  Instructions: "{req.purpose}"
                                </p>
                              )}
                              <button
                                onClick={() => setResolveRequest(req)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                📥 Upload & Submit Document
                              </button>
                            </div>
                          )}

                          {/* Request unique properties */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase block tracking-wider">Verification Request ID</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold text-xs mt-1 block truncate">{req.verificationId || req.id}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3.5">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase block tracking-wider">Document Hash</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold text-xs mt-1 block truncate" title={req.hash || 'Not Hash Signed Yet'}>
                                {req.hash || 'Not Hash Signed Yet'}
                              </span>
                            </div>
                          </div>
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
      <UploadDocumentModal
        isOpen={resolveRequest !== null}
        onClose={() => setResolveRequest(null)}
        targetRequest={resolveRequest}
      />
    </Card>
  );
}
