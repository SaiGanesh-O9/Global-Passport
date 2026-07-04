import { ArrowDown, BadgeCheck, Building2, FileUp, Link2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';

const steps = [
  { label: 'Submit Verification Request', icon: FileUp },
  { label: 'Organization Reviews Request', icon: Building2 },
  { label: 'Verification Approved', icon: BadgeCheck },
  { label: 'Share Trusted Verification', icon: Link2 },
];

export default function HowItWorks() {
  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:px-8" id="how-it-works">
      <div className="mx-auto max-w-5xl">
        <SectionHeader eyebrow="How it works" title="A simple verification journey">
          Documents move through one clear review flow before becoming reusable
          credentials.
        </SectionHeader>

        <Card className="mt-12 p-6 sm:p-8">
          <div className="mx-auto max-w-xl">
            {steps.map((step, index) => (
              <div key={step.label}>
                <div className="flex items-center gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-700 text-white">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <p className="text-lg font-bold text-slate-950">{step.label}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div className="flex justify-center py-4 text-blue-300">
                    <ArrowDown className="h-7 w-7" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
