import { ArrowRight, Building2, CheckCircle2, Link2, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button.jsx';

const trustItems = [
  { label: 'Institution review', icon: Building2 },
  { label: 'Verified credential', icon: ShieldCheck },
  { label: 'Shareable proof', icon: Link2 },
];

export default function HeroSection() {
  return (
    <section className="bg-white" id="home">
      <div className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            Sprint 1 frontend prototype
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Upload Once.
            <br />
            Verify Once.
            <br />
            Share Anywhere.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Trusted institutions verify documents once so users can securely
            reuse verified credentials across employers, universities, banks and
            government agencies.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button icon={ArrowRight} to="/dashboard">
              Get Started
            </Button>
            <Button href="#how-it-works" variant="secondary">
              Learn More
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-2xl shadow-blue-100">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-bold text-slate-950">Credential</p>
                  <p className="text-xs text-slate-500">Degree Certificate</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  Verified
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {trustItems.map((item) => (
                  <div
                    className="flex items-center gap-4 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                    key={item.label}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-700 text-white">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500">Complete</p>
                    </div>
                    <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-lg border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-100">
            <p className="text-sm font-bold text-emerald-700">
              Share link ready
            </p>
            <p className="mt-1 text-xs text-slate-500">
              verified.once/credential/8f42
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
