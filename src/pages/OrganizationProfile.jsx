import React, { useState, useEffect, useMemo } from 'react';
import { useOrganizations } from '../context/OrganizationContext.jsx';
import { useDocuments } from '../hooks/useDocuments.js';
import OrganizationHero from '../components/organizations/OrganizationHero.jsx';
import ProgramCard from '../components/organizations/ProgramCard.jsx';
import RequirementChecklist from '../components/organizations/RequirementChecklist.jsx';
import ScholarshipCard from '../components/organizations/ScholarshipCard.jsx';
import SimilarOrganizations from '../components/organizations/SimilarOrganizations.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { ChevronLeft, HelpCircle, ArrowRight, Sparkles, BookOpen, MapPin, Globe, Phone, Mail, Award, DollarSign, Calendar, GraduationCap, Building, Briefcase, CloudSun, Landmark, CheckCircle } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'programs', label: 'Programs' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'fees', label: 'Fees' },
  { id: 'campus', label: 'Campus & Career' },
  { id: 'ask-ai', label: 'Ask UniCrypt' },
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

  const { credentials } = useDocuments();
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

  // Compute UniCrypt Match score metrics
  const matchMetrics = useMemo(() => {
    if (!selectedRequirements || selectedRequirements.length === 0) return null;
    const total = selectedRequirements.length;
    const completed = selectedRequirements.filter(r => {
      const match = (credentials || []).find(c => c.type === r.type && c.status === 'Approved');
      return !!match;
    }).length;
    
    const percent = Math.round((completed / total) * 100);
    const missingItem = selectedRequirements.find(r => {
      const match = (credentials || []).find(c => c.type === r.type && c.status === 'Approved');
      return !match;
    });

    let matchLabel = 'Excellent Match';
    if (percent < 50) matchLabel = 'Requirements Pending';
    else if (percent < 90) matchLabel = 'Good Match';

    return {
      percent,
      matchLabel,
      missingType: missingItem?.type || null
    };
  }, [selectedRequirements, credentials]);

  if (!selectedOrgData) {
    return (
      <div className="text-center py-16">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">
          Institution Profile Not Found
        </p>
        <Button onClick={() => setSelectedOrgId(null)} className="mt-4 active:scale-95 transition-transform" variant="primary">
          Back to Directory
        </Button>
      </div>
    );
  }

  const { profile, programs, scholarships, fees, contacts } = selectedOrgData;

  // Resolve mock stats details
  const mockStats = (() => {
    const defaultStats = {
      acceptanceRate: 'N/A',
      population: 'N/A',
      campusType: 'Urban',
      researchLevel: 'Tier 1 Research',
      housing: 'On-Campus Available',
      employmentRate: 'N/A',
      internships: 'Corporate partners',
      avgSalary: 'N/A',
      topEmployers: 'Regional leaders',
      weather: 'Varies',
      livingCost: 'Varies'
    };

    if (profile.id === 'org-stanford') {
      return {
        acceptanceRate: '3.9%',
        population: '17,200+',
        campusType: 'Suburban (8,180 Acres)',
        researchLevel: 'R1 Doctoral Research',
        housing: '97% Undergrad Housing',
        employmentRate: '96% within 3 months',
        internships: 'Silicon Valley tech pathways',
        avgSalary: '$145,000',
        topEmployers: 'Google, Apple, Meta, Stripe',
        weather: '75°F Sunny, Silicon Valley',
        livingCost: 'High (Est. $22,000/yr)'
      };
    }
    if (profile.id === 'org-iowastate') {
      return {
        acceptanceRate: '88%',
        population: '30,700+',
        campusType: 'College Town (1,900 Acres)',
        researchLevel: 'R1 Doctoral Research',
        housing: 'Residence Halls & Co-ops',
        employmentRate: '94% within 3 months',
        internships: 'Tracks with Ag-tech & Aerospace leaders',
        avgSalary: '$75,000',
        topEmployers: 'John Deere, Boeing, Principal Financial',
        weather: '60°F Cloudy, Ames College Town',
        livingCost: 'Affordable (Est. $10,000/yr)'
      };
    }
    if (profile.id === 'org-ucm') {
      return {
        acceptanceRate: '71%',
        population: '11,600+',
        campusType: 'Warrensburg Town (1,560 Acres)',
        researchLevel: 'Applied Science & Training',
        housing: 'Residence suites & apartments',
        employmentRate: '92% within 3 months',
        internships: 'Pathways in Kansas City region',
        avgSalary: '$62,000',
        topEmployers: 'Cerner, Hallmark, State of Missouri',
        weather: '65°F Rain, Warrensburg Campus',
        livingCost: 'Low (Est. $8,500/yr)'
      };
    }
    return defaultStats;
  })();

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
      
      {/* Back link */}
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

      {/* Hero Banner Banner Section */}
      <OrganizationHero org={profile} />

      {/* Sticky navigation header */}
      <div className="sticky top-[63px] z-20 -mx-6 px-6 py-2.5 bg-slate-50/80 dark:bg-[#090a0f]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-850/60 flex items-center gap-2 overflow-x-auto scrollbar-none transition-theme">
        {SECTIONS.map((sect) => (
          <button
            key={sect.id}
            onClick={() => scrollToSection(sect.id)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap outline-none active:scale-95 cursor-pointer ${
              activeSection === sect.id
                ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 border border-blue-500/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-850 dark:hover:text-slate-350 border border-transparent'
            }`}
          >
            {sect.label}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        
        {/* Section 1: Overview and Statistics cards (No raw paragraphs) */}
        <section id="section-overview" className="scroll-mt-36 space-y-6">
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Acceptance and General Specs Cards Grid */}
            <div className="md:col-span-2 grid gap-4 grid-cols-2">
              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl flex flex-col justify-between">
                <div>
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-3.5">Acceptance Rate</h4>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{mockStats.acceptanceRate}</p>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl flex flex-col justify-between">
                <div>
                  <Building className="h-5 w-5 text-blue-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest mt-3.5">Student Enrollment</h4>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{mockStats.population}</p>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl flex flex-col justify-between">
                <div>
                  <Landmark className="h-5 w-5 text-blue-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest mt-3.5">Campus Model</h4>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-2 leading-snug">{mockStats.campusType}</p>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl flex flex-col justify-between">
                <div>
                  <Award className="h-5 w-5 text-blue-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest mt-3.5">Research Level</h4>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-2 leading-snug">{mockStats.researchLevel}</p>
                </div>
              </Card>
            </div>

            {/* Sidebar quick facts */}
            <div className="space-y-6">
              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl">
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Quick Details
                </h3>
                <div className="space-y-4 text-[10px] font-semibold text-slate-705 dark:text-slate-350">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 leading-none">Location</p>
                      <p className="text-slate-900 dark:text-white mt-1">{profile.city ? `${profile.city}, ` : ''}{profile.state ? `${profile.state}, ` : ''}{profile.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-850/65 pt-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 leading-none">Official Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-1 block truncate max-w-[160px]">{profile.website}</a>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl">
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Institution Contacts
                </h3>
                <div className="space-y-3.5 text-[10px] font-semibold text-slate-705 dark:text-slate-350">
                  {contacts.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-slate-450 dark:text-slate-550 font-extrabold text-[8px] uppercase tracking-wider">{c.role}</p>
                      <a href={`mailto:${c.email}`} className="text-slate-900 dark:text-white hover:text-blue-500 transition-colors flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {c.email}
                      </a>
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

        {/* Section 3: Requirements checklist & UniCrypt Match */}
        <section id="section-requirements" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-emerald-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Admission Requirements Checklist
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Verification checklist dynamically mapped against your secure vault.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left program selector */}
            <div className="md:col-span-2">
              <Card className="p-4.5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm flex items-center gap-4 rounded-2xl relative overflow-hidden group h-full">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-650/10 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/10">
                  <BookOpen className="h-4.5 w-4.5" />
                </span>
                <div className="flex-1">
                  <span className="text-[8px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    Target Academic Program
                  </span>
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => setSelectedProgramId(e.target.value || null)}
                    className="bg-transparent text-xs font-extrabold text-slate-950 dark:text-white outline-none mt-1 pr-2 focus:ring-1 focus:ring-blue-500 rounded-md cursor-pointer border-none"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-700 dark:text-white">-- Select Academic Program --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-950 text-slate-700 dark:text-white">
                        {p.name} ({p.degree})
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            </div>

            {/* Dynamic UniCrypt Match Score card */}
            {selectedProgramId && matchMetrics && (
              <Card className="p-5 bg-gradient-to-br from-blue-600/5 to-indigo-650/5 border border-blue-500/10 dark:border-blue-500/10 rounded-2xl relative overflow-hidden group">
                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                  UniCrypt Match
                </span>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-3xl font-extrabold text-slate-905 dark:text-white">
                    {matchMetrics.percent}%
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-205/50 dark:border-slate-800/40 uppercase tracking-wider">
                    {matchMetrics.matchLabel}
                  </span>
                </div>
                {matchMetrics.missingType && (
                  <div className="mt-3.5 space-y-1 pt-3 border-t border-slate-100 dark:border-slate-850/60 text-[10px] font-semibold text-slate-550 dark:text-slate-400 leading-normal">
                    <p className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-500">⚠ Action Required</p>
                    <p>Next Step: Upload your <strong className="text-slate-900 dark:text-white">{matchMetrics.missingType}</strong> to satisfy program criteria.</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {selectedProgramId ? (
            <RequirementChecklist
              requirements={selectedRequirements}
              onActionClick={handleUploadAction}
            />
          ) : (
            <Card className="p-10 text-center bg-white/40 dark:bg-[#0f111a]/20 border border-slate-200 dark:border-slate-850/60 rounded-2xl">
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase tracking-widest">
                Select an academic program in the box above to inspect admission requirements.
              </p>
            </Card>
          )}
        </section>

        {/* Section 4: Timeline Milestones (Visual layout) */}
        <section id="section-timeline" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-amber-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Application & Admission Timelines
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Term cutoffs and critical admission workflow phases.
            </p>
          </div>
          
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden group">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
              {[
                { label: 'Applications Open', desc: 'August 1' },
                { label: 'Priority Deadline', desc: 'December 1' },
                { label: 'Regular Deadline', desc: 'January 15' },
                { label: 'Decision Notification', desc: 'April 1' },
                { label: 'I-20 Issuance', desc: 'May 15' },
                { label: 'Visa Interview', desc: 'June' }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center relative flex-1">
                  <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xs shadow-sm">
                    {i + 1}
                  </div>
                  <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white mt-3.5 leading-snug">{s.label}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">{s.desc}</p>
                  {i < 5 && (
                    <div className="hidden md:block absolute top-4 left-[calc(50%+18px)] w-[calc(100%-36px)] h-0.5 bg-slate-100 dark:bg-slate-850" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Section 5: Scholarships Info */}
        <section id="section-scholarships" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-indigo-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Funding & Scholarships
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Explore available stipends and financial aid packages.
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
          
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm max-w-2xl rounded-2xl relative overflow-hidden group">
            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Annual Cost Estimates
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-850/65 text-[11px] font-semibold text-slate-700 dark:text-slate-350 space-y-3.5 pt-1">
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
            </div>
          </Card>
        </section>

        {/* Section 7: Campus & Careers (Redesigned Cards) */}
        <section id="section-campus" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-teal-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Campus Environment & Career Prospects
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Employment rates, climate indices, and local cost of living averages.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Campus Climate */}
            <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl flex items-start gap-4">
              <CloudSun className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Campus Weather & Housing</h4>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-2">
                  Climate Profile: <strong className="text-slate-800 dark:text-slate-200">{mockStats.weather}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  Housing Ratio: <strong className="text-slate-800 dark:text-slate-200">{mockStats.housing}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  Living Expenses: <strong className="text-slate-800 dark:text-slate-200">{mockStats.livingCost}</strong>
                </p>
              </div>
            </Card>

            {/* Employment and Careers */}
            <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl flex items-start gap-4">
              <Briefcase className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Employment Statistics</h4>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-2">
                  Placement Rate: <strong className="text-slate-850 dark:text-slate-200">{mockStats.employmentRate}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  Average Salary: <strong className="text-slate-850 dark:text-slate-200">{mockStats.avgSalary}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  Top Recruiters: <strong className="text-slate-850 dark:text-slate-200">{mockStats.topEmployers}</strong>
                </p>
                <p className="text-xs text-slate-555 dark:text-slate-450 italic leading-relaxed mt-2">
                  Note: "{mockStats.internships}"
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 8: Ask UniCrypt Prompt actions */}
        <section id="section-ask-ai" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-pink-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Intelligent Assistant Shortcuts
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              Inject scoped prompts directly to UniCrypt AI Copilot.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'compare', title: 'Compare My Profile', desc: 'Assess credentials against general admission benchmarks.' },
              { key: 'readiness', title: 'Estimate Readiness', desc: 'Evaluate application readiness with matching credentials.' },
              { key: 'missing', title: 'Show Missing Documents', desc: 'Instantly isolate checklist items that are yet to be uploaded.' },
              { key: 'timeline', title: 'Application Timeline', desc: 'Check term deadline roadmaps and decision notification cycles.' },
              { key: 'scholarships', title: 'Scholarships Info', desc: 'Explore available scholarships, requirements, and stipends.' },
              { key: 'fees', title: 'Fees Breakdown', desc: 'Analyze tuition costs, living estimates, and health coverage.' }
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

        {/* Section 9: Related Institutions */}
        <section id="section-similar" className="scroll-mt-36 pt-4 border-t border-slate-200/80 dark:border-slate-850/60">
          <SimilarOrganizations currentOrg={profile} onOrgSelect={handleOrgNavigation} />
        </section>

      </div>
    </div>
  );
}
