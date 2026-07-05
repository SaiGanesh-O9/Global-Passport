import { Building2, Link2, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';

const features = [
  {
    title: 'Verification Requests',
    description:
      'Request verification directly from trusted organizations instead of repeatedly uploading documents.',
    icon: Building2,
  },
  {
    title: 'Universal Verification Network',
    description:
      'Universities, hospitals, employers, banks and government agencies verify credentials directly.',
    icon: ShieldCheck,
  },
  {
    title: 'Trusted Everywhere',
    description:
      'Once verified, authorized organizations can securely reuse trusted verification.',
    icon: Link2,
  },
];

export default function FeatureGrid() {
  return (
    <section className="bg-slate-50 dark:bg-[#0c0d13] text-slate-800 dark:text-slate-200 px-5 py-20 sm:px-6 lg:px-8 transition-theme" id="features">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Features" title="Trust that travels with the user">
          VeriFlash makes verifying and sharing secure credentials frictionless, maintaining strict data privacy and cryptographic assurance.
        </SectionHeader>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/60 dark:border-slate-800/40 shadow-sm" key={feature.title} hoverEffect={true}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-400">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-lg font-bold text-slate-950 dark:text-white uppercase tracking-wide">
                {feature.title}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
