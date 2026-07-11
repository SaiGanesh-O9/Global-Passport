import React, { useState, useEffect } from 'react';
import { useOrganizations } from '../context/OrganizationContext.jsx';
import OrganizationHero from '../components/organizations/OrganizationHero.jsx';
import ProgramCard from '../components/organizations/ProgramCard.jsx';
import RequirementChecklist from '../components/organizations/RequirementChecklist.jsx';
import TimelineCard from '../components/organizations/TimelineCard.jsx';
import ScholarshipCard from '../components/organizations/ScholarshipCard.jsx';
import SimilarOrganizations from '../components/organizations/SimilarOrganizations.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { ChevronLeft, HelpCircle, ArrowRight, Sparkles, BookOpen, MapPin, Globe, Phone, Mail, Award, DollarSign } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'programs', label: 'Programs' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'deadlines', label: 'Deadlines' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'fees', label: 'Fees' },
  { id: 'ask-ai', label: 'Ask User AI' },
  { id: 'similar', label: 'Related Institutions' }
];

export default function OrganizationProfile() {
  const {
    selectedOrgId,
    setSelectedOrgId,
    selectedOrgData,
    selectedProgramId,
    setSelectedProgramId,
    selectedProgramData,
    selectedRequirements
  } = useOrganizations();

  const [activeSection, setActiveSection] = useState('overview');

  // Align browser hash route
  useEffect(() => {
    if (selectedOrgId) {
      let hash = `#organizations?id=${selectedOrgId}`;
      if (selectedProgramId) {
        hash += `&program=${selectedProgramId}`;
      }
      window.location.hash = hash;
    }
  }, [selectedOrgId, selectedProgramId]);

  // Scroll tracking to highlight sticky navigation items
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const sect of SECTIONS) {
        const el = document.getElementById(`section-${sect.id}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sect.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!selectedOrgData) {
    return (
      <div className="text-center py-16">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Institution Profile Not Found
        </p>
        <Button onClick={() => setSelectedOrgId(null)} className="mt-4 active:scale-95 transition-transform" variant="primary">
          Back to Directory
        </Button>
      </div>
    );
  }

  const { profile, programs, deadlines, timelines, scholarships, fees, faq, contacts } = selectedOrgData;

  const handleUploadAction = () => {
    window.dispatchEvent(
      new CustomEvent('unicrypt-ai-action', {
        detail: {
          type: 'OPEN_MODAL',
          modal: 'upload',
          params: { orgId: profile.id }
        }
      })
    );
  };

  const handleQuickAction = (actionKey) => {
    let prompt = '';
    const orgName = profile.name;
    const progName = selectedProgramData?.name || (programs[0] ? programs[0].name : '');

    switch (actionKey) {
      case 'compare':
        prompt = `Compare my profile credentials against admission criteria for ${orgName}.`;
        break;
      case 'readiness':
        prompt = `Estimate my readiness score for the ${progName} program at ${orgName}.`;
        break;
      case 'missing':
        prompt = `List all missing verification documents required for ${orgName} - ${progName}.`;
        break;
      case 'timeline':
        prompt = `Show application milestones and decision timelines for ${orgName}.`;
        break;
      case 'scholarships':
        prompt = `What active scholarships exist at ${orgName} and how do I apply?`;
        break;
      case 'fees':
        prompt = `Explain the tuition breakdown and living costs at ${orgName}.`;
        break;
      case 'requirements':
        prompt = `Explain the admission document requirements for ${progName} at ${orgName}.`;
        break;
      default:
        prompt = `Help me with my application to ${orgName}.`;
    }

    window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt } }));
  };

  const handleOrgNavigation = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    setSelectedProgramId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      const top = el.offsetTop - 130;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Back Link Button */}
      <button
        onClick={() => {
          setSelectedOrgId(null);
          setSelectedProgramId(null);
          window.location.hash = '#organizations';
        }}
        className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all outline-none cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Directory
      </button>

      {/* Hero Banner Component */}
      <OrganizationHero org={profile} />

      {/* Premium Sticky Sub-navigation bar */}
      <div className="sticky top-[63px] z-20 -mx-6 px-6 py-2.5 bg-slate-50/80 dark:bg-[#090a0f]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-850/60 flex items-center gap-2 overflow-x-auto scrollbar-none transition-theme">
        {SECTIONS.map((sect) => (
          <button
            key={sect.id}
            onClick={() => scrollToSection(sect.id)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap outline-none active:scale-95 cursor-pointer ${
              activeSection === sect.id
                ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 border border-blue-500/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 border border-transparent'
            }`}
          >
            {sect.label}
          </button>
        ))}
      </div>

      {/* Scrolling Content Pages */}
      <div className="space-y-12">
        
        {/* Section 1: Overview & FAQ */}
        <section id="section-overview" className="scroll-mt-36 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* About text panel */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
                  About Institution
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                  {profile.description}
                </p>
              </Card>

              {/* FAQ listing layout */}
              {faq && faq.length > 0 && (
                <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-850/60">
                    {faq.map((q, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
                        <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white flex items-start gap-1.5">
                          <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          {q.question}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-1.5 pl-5.5">
                          {q.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar quick facts */}
            <div className="space-y-6">
              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Quick Details
                </h3>
                <div className="space-y-4 text-[10px] font-semibold text-slate-700 dark:text-slate-350">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-500 leading-none">Location</p>
                      <p className="text-slate-900 dark:text-white mt-1">{profile.city ? `${profile.city}, ` : ''}{profile.state ? `${profile.state}, ` : ''}{profile.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-850/65 pt-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-500 leading-none">Official Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-1 block truncate max-w-[160px]">{profile.website}</a>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Contact Channels
                </h3>
                <div className="space-y-3.5 text-[10px] font-semibold text-slate-700 dark:text-slate-350">
                  {contacts.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-slate-450 dark:text-slate-500 font-extrabold text-[8px] uppercase tracking-wider">{c.role}</p>
                      <a href={`mailto:${c.email}`} className="text-slate-900 dark:text-white hover:text-blue-500 transition-colors flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {c.email}
                      </a>
                      {c.phone && (
                        <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {c.phone}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 2: Programs Directory */}
        <section id="section-programs" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-blue-600 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Offered Academic Programs
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Browse qualifications catalog and inspect prerequisites.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {programs.map((prog) => (
              <ProgramCard
                key={prog.id}
                program={prog}
                onSelect={() => {
                  setSelectedProgramId(prog.id);
                  scrollToSection('requirements');
                }}
              />
            ))}
          </div>
        </section>

        {/* Section 3: Requirements checklist with selector */}
        <section id="section-requirements" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-emerald-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Admission Requirements Checklist
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Verification checklist dynamically mapped against your secure vault.
            </p>
          </div>

          <Card className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-650/10 text-blue-600 dark:text-blue-400 shrink-0">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Selected Program
                </span>
                <select
                  value={selectedProgramId || ''}
                  onChange={(e) => setSelectedProgramId(e.target.value || null)}
                  className="bg-transparent text-xs font-extrabold text-slate-950 dark:text-white outline-none mt-0.5 pr-2 focus:ring-1 focus:ring-blue-500 rounded-md cursor-pointer border-none"
                >
                  <option value="" className="bg-white dark:bg-slate-950 text-slate-700 dark:text-white">-- Select Academic Program --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-950 text-slate-700 dark:text-white">
                      {p.name} ({p.degree})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProgramData && (
              <div className="text-[9px] text-slate-455 font-bold space-y-0.5 sm:text-right uppercase tracking-wider">
                <p>STEM Code: <span className="text-slate-800 dark:text-slate-350 font-extrabold">{selectedProgramData.stemStatus}</span></p>
                <p>Credits / Duration: <span className="text-slate-800 dark:text-slate-350 font-extrabold">{selectedProgramData.duration}</span></p>
              </div>
            )}
          </Card>

          {selectedProgramId ? (
            <RequirementChecklist
              requirements={selectedRequirements}
              onActionClick={handleUploadAction}
            />
          ) : (
            <Card className="p-10 text-center bg-white/40 dark:bg-[#0f111a]/20 border border-slate-205 dark:border-slate-850/60 rounded-2xl">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                Select an academic program in the box above to inspect admission requirements.
              </p>
            </Card>
          )}
        </section>

        {/* Section 4: Deadlines Timeline */}
        <section id="section-deadlines" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-amber-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Application Milestones & Timelines
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Term deadline cutoffs and decision notification schedules.
            </p>
          </div>
          <TimelineCard timelines={timelines} deadlines={deadlines} />
        </section>

        {/* Section 5: Scholarships Info */}
        <section id="section-scholarships" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-indigo-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Funding & Scholarships
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Explore stipends, tuition waivers, and financial aid options.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {scholarships.map((s, i) => (
              <ScholarshipCard key={i} scholarship={s} />
            ))}
          </div>
        </section>

        {/* Section 6: Fees Details */}
        <section id="section-fees" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-purple-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Cost of Attendance Breakdown
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Estimated annual academic cost structure based on full-time enrollment.
            </p>
          </div>
          
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm max-w-2xl rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Annual Cost Estimates
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-850/60 text-[11px] font-semibold text-slate-700 dark:text-slate-350 space-y-3.5 pt-1">
              <div className="flex justify-between items-center pb-2.5">
                <span>Tuition Fees</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{fees.tuition}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>Application Fee</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{fees.applicationFee}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>Living Expenses</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{fees.livingExpenses}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>Insurance Premium</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{fees.insurance}</span>
              </div>
              {fees.miscellaneous && (
                <div className="flex justify-between items-center py-2.5">
                  <span>Miscellaneous/Books</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{fees.miscellaneous}</span>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Section 7: Ask User AI quick prompts */}
        <section id="section-ask-ai" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-pink-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Intelligent Assistant Shortcuts
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Inject scoped prompts directly to UniCrypt AI Copilot.
            </p>
          </div>

          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm relative overflow-hidden rounded-2xl group">
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/10 rounded-2xl transition-all pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none" />
            <div className="flex gap-3.5 items-start relative z-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/10 shrink-0">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
                  Quick Prompt Actions
                </h3>
                <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                  These shortcuts configure the platform context and query the AI Copilot dynamically about this university program's details.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'compare', title: 'Compare My Profile', desc: 'Assess credentials against general admission benchmarks.' },
              { key: 'readiness', title: 'Estimate Readiness', desc: 'Evaluate application readiness with matching credentials.' },
              { key: 'missing', title: 'Show Missing Documents', desc: 'Instantly isolate checklist items that are yet to be uploaded.' },
              { key: 'timeline', title: 'Application Timeline', desc: 'Check term deadline roadmaps and decision notification cycles.' },
              { key: 'scholarships', title: 'Scholarships Info', desc: 'Explore available scholarships, requirements, and stipends.' },
              { key: 'fees', title: 'Fees Breakdown', desc: 'Analyze tuition costs, living estimates, and health coverage.' },
              { key: 'requirements', title: 'Explain Requirements', desc: 'Demystify credential definitions and certifications.' }
            ].map((act) => (
              <button
                key={act.key}
                onClick={() => handleQuickAction(act.key)}
                className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-xl shadow-sm text-left hover:border-blue-500/50 hover:shadow-md group cursor-pointer transition-all active:scale-[0.97] duration-150 flex flex-col justify-between h-full gap-2.5 outline-none"
              >
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                    {act.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-650 dark:text-blue-400 mt-2">
                  <span>Inject Prompt</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 8: Related Institutions */}
        <section id="section-similar" className="scroll-mt-36 pt-4 border-t border-slate-200/80 dark:border-slate-850/60">
          <SimilarOrganizations currentOrg={profile} onOrgSelect={handleOrgNavigation} />
        </section>

      </div>
    </div>
  );
}
