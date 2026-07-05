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
    <section className="bg-white dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 px-5 py-20 sm:px-6 lg:px-8 transition-theme" id="how-it-works">
      <div className="mx-auto max-w-5xl">
        <SectionHeader eyebrow="How it works" title="A simple verification journey">
          Documents move through one clear review flow before becoming reusable credentials.
        </SectionHeader>

        <Card className="mt-12 p-6 sm:p-8 bg-slate-50/50 dark:bg-[#12131a]/40 border border-slate-200/60 dark:border-slate-800/40 shadow-sm">
          <div className="mx-auto max-w-xl">
            {steps.map((step, index) => (
              <div key={step.label}>
                <div className="flex items-center gap-4 rounded-xl border border-blue-100/50 dark:border-slate-800/30 bg-blue-50/50 dark:bg-slate-900/30 p-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-400">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <p className="text-base font-bold text-slate-950 dark:text-white">{step.label}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div className="flex justify-center py-4 text-blue-400/80 dark:text-blue-500/50">
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
