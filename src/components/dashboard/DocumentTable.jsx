import { Link2 } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments.js';
import { DOCUMENT_STATUS } from '../../context/documentUtils.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

export default function DocumentTable() {
  const { userDocuments } = useDocuments();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">My Documents</h2>
        <p className="mt-1 text-sm text-slate-500">
          Track document verification status in one place.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Document</th>
              <th className="px-5 py-4">Institution</th>
              <th className="px-5 py-4">Uploaded</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {userDocuments.map((document) => {
              const isVerified = document.status === DOCUMENT_STATUS.VERIFIED;

              return (
                <tr className="bg-white" key={document.id}>
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {document.documentName}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{document.institution}</td>
                  <td className="px-5 py-4 text-slate-600">{document.uploaded}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-5 py-4">
                    {isVerified ? (
                      <Button
                        icon={Link2}
                        to={`/verify/${document.verificationId}`}
                        variant="secondary"
                      >
                        Share
                      </Button>
                    ) : (
                      <Button disabled icon={Link2} variant="secondary">
                        Share
                      </Button>
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
