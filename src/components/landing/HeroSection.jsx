import { ArrowRight, Building2, CheckCircle2, Link2, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

const trustItems = [
  { label: 'Institution review', icon: Building2 },
  { label: 'Verified credential', icon: ShieldCheck },
  { label: 'Shareable proof', icon: Link2 },
];

export default function HeroSection() {
  return (
    <section className="bg-white dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 transition-theme" id="home">
      <div className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <p className="inline-flex rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/20 px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
            Universal Verification Network
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl tracking-tight">
            VeriFlash
          </h1>
          <p className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400 sm:text-3xl tracking-tight">
            Verify Once. Trust Everywhere.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            VeriFlash is a Universal Verification Network that connects trusted organizations—including universities, hospitals, employers, banks, insurers and government agencies—to verify credentials at the source and securely reuse trusted verification across organizations.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button icon={ArrowRight} to="/dashboard" variant="primary">
              Request Verification
            </Button>
            <Button href="#how-it-works" variant="secondary">
              Explore Platform
            </Button>
          </div>
        </div>

        <div className="relative">
          <Card className="p-4 bg-slate-50/50 dark:bg-[#12131a]/50 border border-blue-100 dark:border-slate-800/40 shadow-2xl relative z-10">
            <Card className="bg-white dark:bg-[#171822] p-5 border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Credential</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Degree Certificate</p>
                </div>
                <StatusBadge status="Approved" />
              </div>

              <div className="mt-5 space-y-4">
                {trustItems.map((item) => (
                  <div
                    className="flex items-center gap-4 rounded-xl border border-slate-250/20 dark:border-slate-800/30 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-3"
                    key={item.label}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-400">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Complete</p>
                    </div>
                    <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                ))}
              </div>
            </Card>
          </Card>
        </div>
      </div>
    </section>
  );
}
