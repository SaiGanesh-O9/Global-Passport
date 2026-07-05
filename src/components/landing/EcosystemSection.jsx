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
import StatusBadge from '../ui/StatusBadge.jsx';

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
      'Instantly verify credentials using secure shared verification links instead of repeated uploads.',
    icon: ShieldCheck,
  },
  {
    title: 'AI Assisted Verification',
    description:
      'AI extracts request details, routes requests to the issuing organization and helps reviewers complete verification faster.',
    icon: Sparkles,
  },
];

const networkNodes = [
  'Universities',
  'Hospitals',
  'Banks',
  'Employers',
  'Government',
  'Insurance',
  'Certification Authorities',
];

function EcosystemFeatureCard({ description, icon, title }) {
  const IconComponent = icon;

  return (
    <Card className="p-5 border border-slate-200/60 dark:border-slate-805 bg-white dark:bg-[#12131a]" hoverEffect={true}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/20">
          <IconComponent className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-slate-950 dark:text-white text-sm uppercase tracking-wider">{title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function VerificationBadge() {
  return (
    <StatusBadge status="Approved" />
  );
}

function NetworkArrow() {
  return (
    <div className="flex justify-center py-2.5 text-blue-400/80 dark:text-blue-500/40">
      <ArrowDown className="h-5 w-5 animate-pulse" />
    </div>
  );
}

function NetworkCard({ children, highlighted = false }) {
  if (highlighted) {
    return (
      <div className="rounded-xl border border-blue-500/20 bg-blue-600 dark:bg-blue-600 p-5 text-center text-white shadow-xl dark:shadow-black/30">
        <p className="text-xl font-extrabold tracking-wider">VERIFLASH</p>
        <p className="mt-1.5 text-xs font-bold text-blue-100/90 uppercase tracking-wide">
          Universal Verification Layer
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800/40 bg-white dark:bg-[#171822] p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{children}</p>
      <VerificationBadge />
    </div>
  );
}

function NetworkDiagram() {
  return (
    <Card className="p-5 sm:p-6 bg-slate-50/50 dark:bg-[#12131a]/40 border border-slate-200/60 dark:border-slate-800/40">
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
            {index < networkNodes.slice(3).length - 1 ? <NetworkArrow /> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DifferenceBanner() {
  return (
    <div className="rounded-xl bg-blue-600 dark:bg-blue-600/10 border border-blue-500/20 dark:border-blue-500/20 p-6 text-white dark:text-blue-400 shadow-lg">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white dark:text-blue-400">Why is this different?</h3>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-blue-50 dark:text-slate-300 font-semibold">
        <p>Existing platforms primarily focus on storing or issuing credentials.</p>
        <p>
          VeriFlash focuses on reusable verification, allowing trusted
          organizations to verify once and enabling authorized organizations to
          reuse that verification securely through one interoperable network.
        </p>
      </div>
    </div>
  );
}

export default function EcosystemSection() {
  return (
    <section className="bg-white dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 px-5 py-20 sm:px-6 lg:px-8 transition-theme">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Built to connect"
          title="Trusted Verification Network"
        >
          VeriFlash is not a replacement for existing credential platforms. It is
          built to act as a universal verification and interoperability layer
          that can connect trusted institutions, repositories,
          employers, banks and government systems into one seamless verification
          network.
        </SectionHeader>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-650 dark:text-emerald-400">
              Supports future interoperability
            </p>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Designed for Integration
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              VeriFlash is designed for integration with trusted organizations
              and existing credential ecosystems through secure APIs and
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
