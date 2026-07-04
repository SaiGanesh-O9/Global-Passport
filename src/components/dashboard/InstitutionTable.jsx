import { Eye } from 'lucide-react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function InstitutionTable() {
  const { pendingDocuments } = useDocuments();
  const { approveDocument, rejectDocument } = useDocumentActions();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Pending Requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review submitted documents and choose the next action.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Document</th>
              <th className="px-5 py-4">Institution</th>
              <th className="px-5 py-4">Uploaded Date</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingDocuments.map((request) => (
              <tr className="bg-white" key={request.id}>
                <td className="px-5 py-4 font-semibold text-slate-950">
                  {request.owner}
                </td>
                <td className="px-5 py-4 text-slate-600">{request.documentName}</td>
                <td className="px-5 py-4 text-slate-600">{request.institution}</td>
                <td className="px-5 py-4 text-slate-600">{request.uploaded}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => approveDocument(request.id)}
                      variant="success"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectDocument(request.id)}
                      variant="danger"
                    >
                      Reject
                    </Button>
                    <Button icon={Eye} variant="secondary">
                      View Document
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
