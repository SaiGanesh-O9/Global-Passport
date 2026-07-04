import React, { useState, useMemo } from 'react';
import { Link2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments.js';
import { VERIFICATION_STATUS } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

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
    <div className="border-t border-slate-100 pt-3">
      {/* Newly submitted pending request routing visualization */}
      {status === 'Pending' && (
        <div className="mb-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-blue-50/50 border border-blue-100 px-3 py-1.5 text-xs font-bold text-slate-900">
          <span className="text-emerald-700 flex items-center gap-0.5">✔ Request Submitted</span>
          <span className="text-slate-400">➔</span>
          <span className="text-slate-900 flex items-center gap-1">
            <span>📨 Routed To</span>
            <strong className="text-blue-700 font-bold">{req.organization?.name || req.requestedOrganization}</strong>
          </span>
          <span className="text-slate-400">➔</span>
          <span className="text-slate-500 font-medium">⏳ Awaiting Review</span>
        </div>
      )}

      {/* Stepper display */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5 flex-1" key={idx}>
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-white shrink-0 ${
                  isCompleted ? 'bg-emerald-600 text-white' :
                  isActive ? 'bg-blue-700 text-white' :
                  'bg-slate-200 text-slate-450'
                }`}>
                  {isCompleted ? '✔' : idx + 1}
                </span>
                <span className={`text-xs font-bold ${
                  isActive ? 'text-blue-700' :
                  isCompleted ? 'text-slate-950' :
                  'text-slate-400'
                }`}>
                  {stage.label}
                </span>
              </div>
              {stage.desc && (
                <p className="text-[10px] text-slate-500 pl-8 sm:pl-0.5 font-semibold leading-none">{stage.desc}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DocumentTable() {
  const { userVerificationRequests } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRequests, setExpandedRequests] = useState({});

  const toggleExpand = (id) => {
    setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
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

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">My Verification Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track verification request status in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 font-semibold"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Credential</th>
              <th className="px-5 py-4">Organization</th>
              <th className="px-5 py-4">Requested Date</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-semibold">
                  No verification requests found matching the filters.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const isApproved = req.status === VERIFICATION_STATUS.APPROVED;
                const orgName = req.organization?.name || req.requestedOrganization;
                const isExpanded = expandedRequests[req.id];

                return (
                  <React.Fragment key={req.id}>
                    <tr className="bg-white">
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {req.credentialType}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{orgName}</td>
                      <td className="px-5 py-4 text-slate-600">{req.requestDate}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => toggleExpand(req.id)}
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
                                variant="primary"
                                className="py-1 px-3 text-xs"
                                icon={Eye}
                              >
                                View
                              </Button>
                              <Button
                                icon={Link2}
                                onClick={() => {
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
                              <Button disabled variant="primary" className="py-1 px-3 text-xs" icon={Eye}>
                                View
                              </Button>
                              <Button disabled icon={Link2} variant="secondary" className="py-1 px-3 text-xs">
                                Share
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td colSpan={5} className="px-5 pb-4 pt-3 border-t border-slate-100 space-y-4">
                          {renderProgressTracker(req)}
                          
                          {/* File lists */}
                          {req.files && req.files.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Submitted Documents</p>
                              <ul className="mt-1 divide-y divide-slate-250 bg-white border border-slate-200 rounded-md overflow-hidden">
                                {req.files.map((file, fIdx) => (
                                  <li key={fIdx} className="flex justify-between items-center px-3 py-2 text-xs">
                                    <span className="text-slate-700 font-semibold">{file.fileName} ({Math.round(file.fileSize / 1024)} KB)</span>
                                    {file.downloadURL && (
                                      <a
                                        href={file.downloadURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-700 font-bold hover:underline"
                                      >
                                        View File
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Request unique properties */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-bold text-slate-500 uppercase block">Verification Request ID</span>
                              <span className="font-mono text-slate-800">{req.verificationId || req.id}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-500 uppercase block">Document Hash</span>
                              <span className="font-mono text-slate-800 break-all">{req.hash || 'Not Hash Signed Yet'}</span>
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
    </Card>
  );
}
