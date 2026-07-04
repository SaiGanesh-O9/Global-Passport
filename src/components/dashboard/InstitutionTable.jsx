import { useState, useMemo } from 'react';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

export default function InstitutionTable({ activeTab }) {
  const { verificationRequests } = useDocuments();
  const { approveVerification, rejectVerification, requestMoreInformation } = useDocumentActions();
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRequests, setExpandedRequests] = useState({});

  const toggleExpand = (id) => {
    setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAction = async (requestId, actionFn) => {
    setProcessingId(requestId);
    try {
      await actionFn(requestId);
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

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const headerTitle = activeTab === 'pending' ? 'Pending Verification Requests' :
                      activeTab === 'approved' ? 'Approved Verifications' :
                      'Rejected Requests';

  return (
    <Card className="overflow-hidden bg-white border border-slate-200">
      <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{headerTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted requests and choose the next action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search requester, type..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 font-semibold outline-none"
          />
          {activeTab === 'all' && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
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
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Requester</th>
              <th className="px-5 py-4">Credential Type</th>
              <th className="px-5 py-4">Requested Date</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-semibold">
                  No verification requests found matching the active filters.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((request) => {
                const isExpanded = expandedRequests[request.id];
                const showActions = request.status === 'Pending' || request.status === 'Information Requested';

                return (
                  <React.Fragment key={request.id}>
                    <tr className="bg-white hover:bg-slate-50/30">
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {request.ownerName || request.ownerEmail || request.owner || 'Anonymous User'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{request.credentialType}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{request.requestDate}</td>
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
                                onClick={() => handleAction(request.id, approveVerification)}
                                disabled={processingId !== null}
                                variant="success"
                                className="py-1 px-3 text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleAction(request.id, rejectVerification)}
                                disabled={processingId !== null}
                                variant="danger"
                                className="py-1 px-3 text-xs"
                              >
                                Reject
                              </Button>
                              {request.status !== 'Information Requested' && (
                                <Button
                                  onClick={() => handleAction(request.id, requestMoreInformation)}
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
                      <tr className="bg-slate-50/40">
                        <td colSpan={5} className="px-5 pb-4 pt-3 border-t border-slate-100 space-y-4">
                          {/* Stepper timeline tracking progress details */}
                          <div className="text-xs space-y-2">
                            <p className="font-bold text-slate-700 uppercase tracking-wide">Request Details</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-slate-500 font-semibold block">Purpose Description</span>
                                <span className="text-slate-800 font-medium">{request.purpose || 'None'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-semibold block">Requested Verification ID</span>
                                <span className="text-slate-850 font-mono">{request.verificationId || request.id}</span>
                              </div>
                            </div>
                          </div>

                          {/* File lists */}
                          {request.files && request.files.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Submitted Documents for Review</p>
                              <ul className="mt-1 divide-y divide-slate-200 bg-white border border-slate-200 rounded-md overflow-hidden">
                                {request.files.map((file, fIdx) => (
                                  <li key={fIdx} className="flex justify-between items-center px-3 py-2 text-xs">
                                    <span className="text-slate-700 font-semibold">{file.fileName} ({Math.round(file.fileSize / 1024)} KB)</span>
                                    {file.downloadURL && (
                                      <a
                                        href={file.downloadURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-700 font-bold hover:underline"
                                      >
                                        View & Review File
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
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
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 bg-slate-50">
        <span className="text-xs text-slate-500 font-semibold">
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
