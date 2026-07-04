import { Eye } from 'lucide-react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function InstitutionTable() {
  const { pendingVerificationRequests } = useDocuments();
  const { approveVerification, rejectVerification, requestMoreInformation } = useDocumentActions();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Pending Verification Requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review submitted requests and choose the next action.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Requester</th>
              <th className="px-5 py-4">Credential Type</th>
              <th className="px-5 py-4">Organization</th>
              <th className="px-5 py-4">Requested Date</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingVerificationRequests.map((request) => (
              <tr className="bg-white" key={request.id}>
                <td className="px-5 py-4 font-semibold text-slate-950">
                  {request.owner}
                </td>
                <td className="px-5 py-4 text-slate-600">{request.credentialType}</td>
                <td className="px-5 py-4 text-slate-600">{request.requestedOrganization}</td>
                <td className="px-5 py-4 text-slate-600">{request.requestDate}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => approveVerification(request.id)}
                      variant="success"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectVerification(request.id)}
                      variant="danger"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => requestMoreInformation(request.id)}
                      variant="secondary"
                    >
                      Request Info
                    </Button>
                    <Button icon={Eye} variant="secondary">
                      View Request
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
