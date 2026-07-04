import {
  ArrowDown,
  Building2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Card from '../ui/Card.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';

const ecosystemCards = [
  {
    title: 'Universities',
    description:
      'Academic institutions verify educational credentials and issue reusable trusted verification.',
    icon: GraduationCap,
  },
  {
    title: 'Government Platforms',
    description:
      'Supports integration with government-issued document ecosystems where available.',
    icon: Building2,
  },
  {
    title: 'Employers & Banks',
    description:
      'Instantly verify documents using secure shared verification links instead of repeated uploads.',
    icon: ShieldCheck,
  },
  {
    title: 'AI Assisted Verification',
    description:
      'AI extracts document information, routes requests to the appropriate institution and helps reviewers complete verification faster.',
    icon: Sparkles,
  },
];

const networkNodes = [
  'Universities',
  'Government Platforms',
  'Trusted Employers',
  'Verified Credentials',
  'Users',
];

function EcosystemFeatureCard({ description, icon, title }) {
  const IconComponent = icon;

  return (
    <Card className="p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <IconComponent className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function VerificationBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

function NetworkArrow() {
  return (
    <div className="flex justify-center py-3 text-blue-400">
      <ArrowDown className="h-6 w-6 animate-pulse" />
    </div>
  );
}

function NetworkCard({ children, highlighted = false }) {
  if (highlighted) {
    return (
      <div className="rounded-lg border border-blue-300 bg-blue-700 p-6 text-center text-white shadow-2xl shadow-blue-500/30 ring-4 ring-blue-100">
        <p className="text-2xl font-black tracking-wide">VERIFYONCE</p>
        <p className="mt-2 text-sm font-semibold text-blue-100">
          Universal Verification Layer
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-bold text-slate-950">{children}</p>
      <VerificationBadge />
    </div>
  );
}

function NetworkDiagram() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-0">
        {networkNodes.slice(0, 3).map((node) => (
          <div key={node}>
            <NetworkCard>{node}</NetworkCard>
            <NetworkArrow />
          </div>
        ))}

        <NetworkCard highlighted />
        <NetworkArrow />

        {networkNodes.slice(3).map((node, index) => (
          <div key={node}>
            <NetworkCard>{node}</NetworkCard>
            {index < 1 ? <NetworkArrow /> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DifferenceBanner() {
  return (
    <div className="rounded-lg bg-blue-700 p-6 text-white shadow-xl shadow-blue-700/20">
      <h3 className="text-xl font-bold">Why is this different?</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-blue-50">
        <p>Existing platforms primarily focus on storing or issuing documents.</p>
        <p>
          VerifyOnce focuses on reusable verification, allowing trusted
          institutions to verify once and enabling authorized organizations to
          reuse that verification securely through one interoperable network.
        </p>
      </div>
    </div>
  );
}

export default function EcosystemSection() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Built to connect"
          title="Works With Existing Ecosystems"
        >
          VerifyOnce is not a replacement for existing document platforms. It is
          built to act as a universal verification and interoperability layer
          that can connect trusted institutions, document repositories,
          employers, banks and government systems into one seamless verification
          network.
        </SectionHeader>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">
              Supports future interoperability
            </p>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">
              Designed for Integration
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              VerifyOnce is designed for integration with trusted institutions
              and existing document ecosystems through secure APIs and
              standardized verification workflows. It can help organizations
              eliminate repeated verification while preserving the authority of
              the original issuer.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ecosystemCards.map((card) => (
                <EcosystemFeatureCard key={card.title} {...card} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <NetworkDiagram />
            <DifferenceBanner />
          </div>
        </div>
      </div>
    </section>
  );
}
