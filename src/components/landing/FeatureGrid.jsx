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
    <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8" id="features">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Features" title="Trust that travels with the user">
          VeriFlash keeps the first version simple, professional and ready for a
          hackathon demo.
        </SectionHeader>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card className="p-6" key={feature.title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-700 text-white">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-xl font-bold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
