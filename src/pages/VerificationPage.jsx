import { CheckCircle2, Copy, Download, FileCheck2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { DOCUMENT_STATUS } from '../context/documentUtils.js';
import { useDocuments } from '../hooks/useDocuments.js';

function buildVerificationDetails(document) {
  return [
    { label: 'Verification ID', value: document.verificationId },
    { label: 'Institution', value: document.institution },
    { label: 'Verification Date', value: document.verifiedAt },
    { label: 'Document Hash', value: document.hash },
    { label: 'Issued To', value: document.owner },
  ];
}

export default function VerificationPage() {
  const { verificationId } = useParams();
  const { getDocumentByVerificationId } = useDocuments();
  const document = verificationId
    ? getDocumentByVerificationId(verificationId)
    : null;
  const isVerified = document?.status === DOCUMENT_STATUS.VERIFIED;

  const handleCopyShareLink = async () => {
    if (!verificationId) {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  if (!verificationId || !document || !isVerified) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MarketingNav />
        <main className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-950">
              Verification not found
            </h1>
            <p className="mt-3 text-slate-600">
              Open a verified document share link to view credential details.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const verificationDetails = buildVerificationDetails(document);

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
              This document has been reviewed and marked as verified.
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button icon={Download} variant="success">
                Download
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
