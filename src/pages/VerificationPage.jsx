import { CheckCircle2, Copy, Download, FileCheck2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { isShareableStatus } from '../context/documentUtils.js';
import { useDocuments } from '../hooks/useDocuments.js';

function buildVerificationDetails(request) {
  return [
    { label: 'Verification ID', value: request.verificationId },
    { label: 'Verification Hash', value: request.hash },
    { label: 'Status', value: request.status },
    { label: 'Organization', value: request.requestedOrganization },
    { label: 'Verification Date', value: request.verifiedAt },
    { label: 'Issued To', value: request.owner },
  ];
}

export default function VerificationPage() {
  const { verificationId } = useParams();
  const { getVerificationRequestByVerificationId } = useDocuments();
  const request = verificationId
    ? getVerificationRequestByVerificationId(verificationId)
    : null;
  const isApproved = request ? isShareableStatus(request.status) : false;

  const handleCopyShareLink = async () => {
    if (!verificationId) {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  if (!verificationId || !request || !isApproved) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MarketingNav />
        <main className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-950">
              Verification not found
            </h1>
            <p className="mt-3 text-slate-600">
              Open an approved credential share link to view verification details.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const verificationDetails = buildVerificationDetails(request);

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="bg-emerald-600 px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mt-6 text-4xl font-bold">Verified Credential</h1>
            <p className="mt-3 text-emerald-50">
              Verified through VeriFlash
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <FileCheck2 className="h-6 w-6 text-emerald-700" />
              <p className="font-semibold text-emerald-800">
                Verification details are ready to share.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {verificationDetails.map((detail) => (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  key={detail.label}
                >
                  <dt className="text-sm font-bold uppercase text-slate-500">
                    {detail.label}
                  </dt>
                  <dd className="mt-2 font-semibold text-slate-950">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Verification Timeline */}
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-950">Verification Timeline</h3>
              <div className="mt-6 relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                {request.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-white ring-4 ring-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{step.date} — Status: {step.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row pt-4">
              <Button icon={Download} variant="success">
                Download Certificate
              </Button>
              <Button icon={Copy} onClick={handleCopyShareLink} variant="secondary">
                Copy Share Link
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
