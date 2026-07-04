import { Link2 } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments.js';
import { VERIFICATION_STATUS } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

export default function DocumentTable() {
  const { userVerificationRequests } = useDocuments();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">My Verification Requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Track verification request status in one place.
        </p>
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
            {userVerificationRequests.map((req) => {
              const isApproved = req.status === VERIFICATION_STATUS.APPROVED;

              return (
                <tr className="bg-white" key={req.id}>
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {req.credentialType}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{req.requestedOrganization}</td>
                  <td className="px-5 py-4 text-slate-600">{req.requestDate}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-5 py-4">
                    {isApproved ? (
                      <div className="flex gap-2">
                        <Button
                          to={`/verify/${req.verificationId}`}
                          variant="primary"
                        >
                          View Verification
                        </Button>
                        <Button
                          icon={Link2}
                          onClick={() => {
                            const link = `${window.location.origin}/verify/${req.verificationId}`;
                            navigator.clipboard.writeText(link);
                            alert('Share link copied to clipboard!');
                          }}
                          variant="secondary"
                        >
                          Share Verification
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button disabled variant="primary">
                          View Verification
                        </Button>
                        <Button disabled icon={Link2} variant="secondary">
                          Share Verification
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
