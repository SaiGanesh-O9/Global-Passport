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
import { ChevronLeft, HelpCircle, ArrowRight, Sparkles, BookOpen, MapPin, Globe, Phone, Mail, Award, DollarSign, Calendar, GraduationCap, Building, Briefcase, CloudSun, Landmark, CheckCircle, Shield, ShieldCheck } from 'lucide-react';
import { getLiveIntelligence } from '../services/organizationIntelligence.js';



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
  const [activeJourney, setActiveJourney] = useState(() => localStorage.getItem('unicrypt_active_journey') || 'Education');


  const { profile, programs, scholarships, fees, contacts } = selectedOrgData || {};

  const SECTIONS = useMemo(() => {
    const hasScholarships = scholarships && scholarships.length > 0;
    const hasFees = fees && Object.keys(fees).length > 0 && fees.tuition;

    if (activeJourney === 'Education') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'programs', label: 'Programs' },
        { id: 'requirements', label: 'Requirements' },
        { id: 'timeline', label: 'Timeline' },
        hasScholarships ? { id: 'scholarships', label: 'Scholarships' } : null,
        hasFees ? { id: 'fees', label: 'Fees' } : null,
        { id: 'campus', label: 'Campus & Career' },
        { id: 'ask-ai', label: 'Ask UniCrypt' },
        { id: 'similar', label: 'Related Institutions' }
      ].filter(Boolean);
    } else if (activeJourney === 'Career') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'programs', label: 'Roles & Openings' },
        { id: 'requirements', label: 'Requirements' },
        { id: 'timeline', label: 'Timeline' },
        hasFees ? { id: 'fees', label: 'Compensation' } : null,
        { id: 'campus', label: 'Work Environment' },
        { id: 'ask-ai', label: 'Ask UniCrypt' },
        { id: 'similar', label: 'Related Partners' }
      ].filter(Boolean);
    } else {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'programs', label: 'Visas & Permits' },
        { id: 'requirements', label: 'Requirements' },
        { id: 'timeline', label: 'Timeline' },
        hasFees ? { id: 'fees', label: 'Financial Proof' } : null,
        { id: 'campus', label: 'Living Conditions' },
        { id: 'ask-ai', label: 'Ask UniCrypt' },
        { id: 'similar', label: 'Related Authorities' }
      ].filter(Boolean);
    }
  }, [activeJourney, scholarships, fees]);

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

  // Auto-select first program if none is selected
  useEffect(() => {
    if (selectedOrgData && !selectedProgramId && selectedOrgData.programs?.length) {
      setSelectedProgramId(selectedOrgData.programs[0].id);
    }
  }, [selectedOrgData, selectedProgramId, setSelectedProgramId]);

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
  }, [SECTIONS]);

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



  // Resolve mock stats details
  const mockStats = useMemo(() => {
    if (!profile) {
      return {
        acceptanceRate: '75%',
        population: '12,500',
        campusType: 'Urban',
        researchLevel: 'Tier 1 Research',
        housing: 'Available',
        employmentRate: '92%',
        internships: 'Multi-industry partners',
        avgSalary: '$65,000',
        topEmployers: 'Regional leaders',
        weather: 'Varies',
        livingCost: 'Medium',
        lastUpdated: 'Just now',
        source: 'UniCrypt Live Intelligence'
      };
    }

    const liveIntel = getLiveIntelligence(profile.id);

    const baseDetails = {
      'org-stanford': {
        population: '17,200+',
        campusType: 'Suburban (8,180 Acres)',
        researchLevel: 'R1 Doctoral Research',
        housing: '97% Undergrad Housing',
        internships: 'Silicon Valley tech pathways',
        avgSalary: '$145,000',
        topEmployers: 'Google, Apple, Meta, Stripe',
        weather: '75°F Sunny, Silicon Valley',
        livingCost: 'High (Est. $22,000/yr)',
        employmentRate: '96% within 3 months'
      },
      'org-iowastate': {
        population: '30,700+',
        campusType: 'College Town (1,900 Acres)',
        researchLevel: 'R1 Doctoral Research',
        housing: 'Residence Halls & Co-ops',
        internships: 'Tracks with Ag-tech & Aerospace leaders',
        avgSalary: '$75,000',
        topEmployers: 'John Deere, Boeing, Principal Financial',
        weather: '60°F Cloudy, Ames College Town',
        livingCost: 'Affordable (Est. $10,000/yr)',
        employmentRate: '94% within 3 months'
      },
      'org-ucm': {
        population: '11,600+',
        campusType: 'Warrensburg Town (1,560 Acres)',
        researchLevel: 'Applied Science & Training',
        housing: 'Residence suites & apartments',
        internships: 'Pathways in Kansas City region',
        avgSalary: '$62,000',
        topEmployers: 'Cerner, Hallmark, State of Missouri',
        weather: '65°F Rain, Warrensburg Campus',
        livingCost: 'Low (Est. $8,500/yr)',
        employmentRate: '92% within 3 months'
      }
    }[profile.id] || {
      population: '15,000+',
      campusType: 'Urban Campus',
      researchLevel: 'Applied Sciences',
      housing: 'Available',
      internships: 'Local partners',
      avgSalary: '$60,000',
      topEmployers: 'State and regional leaders',
      weather: 'Varies',
      livingCost: 'Moderate',
      employmentRate: '90%'
    };

    return {
      ...baseDetails,
      acceptanceRate: liveIntel.acceptanceRate,
      employmentRate: liveIntel.employmentRate || baseDetails.employmentRate,
      averageDecisionTime: liveIntel.averageDecisionTime,
      rankings: liveIntel.rankings,
      appDeadline: liveIntel.appDeadline,
      lastUpdated: liveIntel.lastUpdated,
      source: liveIntel.source
    };
  }, [profile]);

  const overviewStats = useMemo(() => {
    if (activeJourney === 'Education') {
      return [
        { label: 'Acceptance Rate', val: mockStats.acceptanceRate, icon: GraduationCap, updated: mockStats.lastUpdated, source: mockStats.source },
        { label: 'Student Enrollment', val: mockStats.population, icon: Building, detail: 'Updated Today · Source: Registrar Logs' },
        { label: 'Average GPA Benchmark', val: '3.75', icon: Landmark, detail: 'Compared to your profile: Competitive' },
        { label: 'Research Intensity', val: mockStats.researchLevel, icon: Award, detail: 'Accreditation Tier 1' }
      ].filter(s => s.val && s.val !== 'N/A' && s.val !== 'null' && s.val !== '');
    } else if (activeJourney === 'Career') {
      return [
        { label: 'Placement Rate', val: mockStats.employmentRate, icon: Briefcase, detail: 'Within 3 months of completion' },
        { label: 'Average Graduate Salary', val: mockStats.avgSalary, icon: DollarSign, detail: 'Industry median entry level' },
        { label: 'Key Recruiting Sector', val: mockStats.topEmployers, icon: Building, detail: 'Top employers including Silicon Valley leaders' },
        { label: 'Background Screening', val: 'Required', icon: Shield, detail: 'Required by employer partners' }
      ].filter(s => s.val && s.val !== 'N/A' && s.val !== 'null' && s.val !== '');
    } else {
      return [
        { label: 'Visa Sponsorship', val: 'Supported (F-1/H-1B)', icon: Globe, detail: 'Accredited sponsor institution' },
        { label: 'Financial Proof', val: fees?.tuition || '$29,000/yr', icon: DollarSign, detail: 'Minimum declaration required' },
        { label: 'Passport Registry', val: 'Required', icon: Shield, detail: 'Verified via national registry' },
        { label: 'Police Clearance (PCC)', val: 'Required', icon: CheckCircle, detail: 'Accredited agency audit' }
      ].filter(s => s.val && s.val !== 'N/A' && s.val !== 'null' && s.val !== '');
    }
  }, [activeJourney, mockStats, fees]);

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

      {/* Journey Segmented Pills */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">My Journey Target</span>
        <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-850/50 p-1 rounded-2xl flex gap-1 max-w-sm">
          {[
            { id: 'Education', label: '🎓 Education' }
          ].map((j) => (
            <button
              key={j.id}
              onClick={() => {
                localStorage.setItem('unicrypt_active_journey', j.id);
                setActiveJourney(j.id);
                window.dispatchEvent(new CustomEvent('unicrypt-os-state', { detail: { journey: j.id } }));
              }}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer outline-none active:scale-[0.97] ${
                activeJourney === j.id
                  ? 'bg-white dark:bg-[#12131a] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                  : 'text-slate-450 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

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
            <div className="md:col-span-2 space-y-6">
              {matchMetrics && (
                <Card className="p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/10 dark:border-blue-500/10 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                      UniCrypt Match™
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      Your Credential Readiness is <span className="text-emerald-500">{matchMetrics.matchLabel}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-lg">
                      Based on your verified credentials in the secure vault, you satisfy most requirements for this target.
                    </p>
                    <div className="flex gap-4 pt-2">
                      <Button
                        onClick={() => scrollToSection('requirements')}
                        variant="primary"
                        className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider active:scale-[0.98] transition-transform flex items-center gap-1.5"
                      >
                        Continue Journey
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleQuickAction('readiness')}
                        variant="secondary"
                        className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider active:scale-[0.98] transition-transform"
                      >
                        Ask UniCrypt OS
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800/40 p-5 rounded-2xl min-w-[140px] text-center shadow-inner shrink-0">
                    <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Match Score</span>
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1.5 leading-none">
                      {matchMetrics.percent}%
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-2.5 bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                      {matchMetrics.matchLabel}
                    </span>
                  </div>
                </Card>
              )}

              <div className="grid gap-4 grid-cols-2">
                {overviewStats.map((s, idx) => {
                  const IconComponent = s.icon;
                  return (
                    <Card 
                      key={idx} 
                      onClick={() => {
                        const orgName = selectedOrgData?.profile?.name || 'Stanford University';
                        window.dispatchEvent(new CustomEvent('unicrypt.workspace.open', {
                          detail: {
                            id: `metric.${s.label.toLowerCase().replace(/ /g, '_')}`,
                            type: 'metric',
                            title: s.label,
                            subtitle: `Metric Audit for ${orgName}`,
                            val: s.val,
                            detail: s.detail || `Last updated today via Clearinghouse registrar registry logs.`
                          }
                        }));
                      }}
                      className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 duration-200 transition-all cursor-pointer hover:border-blue-500/30"
                    >
                      <div>
                        <IconComponent className="h-5 w-5 text-blue-500" />
                        <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-3.5">{s.label}</h4>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">{s.val}</p>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850/50 flex flex-col gap-1 text-[8px] font-bold">
                          {s.updated ? (
                            <>
                              <div className="flex justify-between text-slate-400">
                                <span>Updated</span>
                                <span className="text-slate-850 dark:text-slate-205">{s.updated}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Source</span>
                                <span className="text-slate-850 dark:text-slate-205 truncate max-w-[140px]">{s.source}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">{s.detail}</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sidebar quick facts */}
            <div className="space-y-6">
              {/* Information Confidence Badge Card */}
              <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/10 dark:border-emerald-500/15 rounded-2xl relative overflow-hidden space-y-4 shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/5 blur-xl pointer-events-none"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      Information Confidence
                    </h3>
                    <p className="text-[8px] text-slate-450 font-bold mt-1 uppercase tracking-wider">Verified by UniCrypt Verify™</p>
                  </div>
                  <span className="text-3xl font-extrabold text-emerald-500 tracking-tight">{mockStats.confidenceScore || '98%'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5 pt-2 text-[10px] font-semibold text-slate-650 dark:text-slate-350 relative z-10 border-t border-slate-100 dark:border-slate-850/50">
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 block">Verified Sources</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{mockStats.sourceCount || 12} Official Sources</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 block">Last Updated</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{mockStats.lastUpdated || 'Yesterday'}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-50 dark:border-slate-850/30 pt-2">
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 block">Data Origin</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block truncate">{mockStats.dataOrigin || 'Official University Registrar Portal'}</span>
                  </div>
                </div>
              </Card>

              {/* UniCrypt Pulse™ */}
              <Card className="p-5 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent border border-blue-500/10 dark:border-blue-500/10 rounded-2xl relative overflow-hidden space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    UniCrypt Pulse™
                  </h3>
                  <span className="text-[8px] font-bold text-slate-400">Updated 8m ago</span>
                </div>
                <div className="space-y-2 text-[10px] font-semibold text-slate-600 dark:text-slate-350">
                  <div className="flex items-start gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <span>Term deadline approaching: Spring semester</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <span>New verified scholarship added to registry</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <span>IELTS requirement unchanged (Min. 7.0)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <span>Average decision times reduced by 4 days</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <span className="text-blue-600 dark:text-blue-400 font-bold">27 users applied recently</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm space-y-4 rounded-2xl">
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
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
                <h3 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
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
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
              {activeJourney === 'Education' ? 'Offered Academic Programs' : activeJourney === 'Career' ? 'Open Roles & Positions' : 'Visas & Work Permits'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {activeJourney === 'Education' ? 'Browse qualifications catalog and inspect prerequisites.' : activeJourney === 'Career' ? 'Inspect job descriptions and required skills credentials.' : 'Review immigration categories and travel parameters.'}
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
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
              {activeJourney === 'Education' ? 'Admission Requirements Checklist' : activeJourney === 'Career' ? 'Hiring Requirements Checklist' : 'Visa Requirements Checklist'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {activeJourney === 'Education' ? 'Verification checklist dynamically mapped against your secure vault.' : activeJourney === 'Career' ? 'Candidate skills verification mapped against your vault credentials.' : 'Travel and financial verification mapped against your vault.'}
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
                  <span className="text-[8px] font-extrabold text-slate-450 dark:text-slate-500 tracking-wider block">
                    {activeJourney === 'Education' ? 'Target Academic Program' : activeJourney === 'Career' ? 'Target Position / Role' : 'Target Visa Category'}
                  </span>
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => setSelectedProgramId(e.target.value || null)}
                    className="bg-transparent text-xs font-extrabold text-slate-955 dark:text-white outline-none mt-1 pr-2 focus:ring-1 focus:ring-blue-500 rounded-md cursor-pointer border-none"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-700 dark:text-white">
                      {activeJourney === 'Education' ? '-- Select Academic Program --' : activeJourney === 'Career' ? '-- Select Open Position --' : '-- Select Visa Class --'}
                    </option>
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
              <Card className="p-5 bg-gradient-to-br from-blue-600/5 to-indigo-650/5 border border-blue-500/10 dark:border-blue-500/10 rounded-2xl relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 tracking-wider block">
                    UniCrypt Match™
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {matchMetrics.percent}%
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">
                      {matchMetrics.matchLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Credential Readiness Score
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-850/40 space-y-2 text-[10px] font-semibold text-slate-600 dark:text-slate-350">
                    <div className="flex justify-between items-center">
                      <span>Requirements Match</span>
                      <span className="text-emerald-500 font-bold">✔ Verified</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Eligibility Benchmark</span>
                      <span className="text-emerald-500 font-bold">✔ Competitive</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vault Integrity</span>
                      <span className="text-emerald-500 font-bold">✔ Signed Registry</span>
                    </div>
                  </div>
                </div>

                {matchMetrics.missingType && (
                  <div className="mt-4 space-y-1 pt-3.5 border-t border-slate-105 dark:border-slate-850/40 text-[10px] font-semibold text-slate-550 dark:text-slate-400 leading-normal bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase font-extrabold text-amber-600 dark:text-amber-500">⚠ Action Required</p>
                    <p>Next Step: Add your <strong className="text-slate-900 dark:text-white">{matchMetrics.missingType}</strong> to satisfy active checklist.</p>
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
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
              {activeJourney === 'Education' ? 'Application & Admission Timelines' : activeJourney === 'Career' ? 'Hiring & Onboarding Milestones' : 'Immigration & Verification Pipeline'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {activeJourney === 'Education' ? 'Term cutoffs and critical admission workflow phases.' : activeJourney === 'Career' ? 'Hiring workflow stages and feedback cycles.' : 'Government agency processing checkpoints.'}
            </p>
          </div>
          
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden group">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
              {(activeJourney === 'Education' ? [
                { label: 'Applications Open', desc: 'August 1' },
                { label: 'Priority Deadline', desc: 'December 1' },
                { label: 'Regular Deadline', desc: 'January 15' },
                { label: 'Decision Notification', desc: 'April 1' },
                { label: 'I-20 Issuance', desc: 'May 15' },
                { label: 'Visa Interview', desc: 'June' }
              ] : activeJourney === 'Career' ? [
                { label: 'Resume Submission', desc: 'Open Now' },
                { label: 'Initial Screening', desc: 'Within 3 Days' },
                { label: 'Technical Assessment', desc: 'Within 10 Days' },
                { label: 'Executive Panel', desc: 'Within 14 Days' },
                { label: 'Offer Issuance', desc: 'Within 18 Days' },
                { label: 'Onboarding Launch', desc: 'Immediate' }
              ] : [
                { label: 'Vault Registration', desc: 'Step 1' },
                { label: 'Police Clearance Audit', desc: 'Step 2' },
                { label: 'Biometrics Scan', desc: 'Step 3' },
                { label: 'Consular Review Pipeline', desc: 'Step 4' },
                { label: 'Visa Stamping Stamp', desc: 'Step 5' },
                { label: 'Arrival Declaration', desc: 'Step 6' }
              ]).map((s, i) => (
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
        {activeJourney === 'Education' && scholarships && scholarships.length > 0 && (
          <section id="section-scholarships" className="scroll-mt-36 space-y-4">
            <div className="border-l-4 border-indigo-500 pl-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
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
        )}

        {/* Section 6: Fees Details */}
        {fees && Object.keys(fees).length > 0 && fees.tuition && (
          <section id="section-fees" className="scroll-mt-36 space-y-4">
          <div className="border-l-4 border-purple-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
              {activeJourney === 'Education' ? 'Cost of Attendance Breakdown' : activeJourney === 'Career' ? 'Compensation & Benefits Structure' : 'Financial Proof Declaration'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {activeJourney === 'Education' ? 'Estimated annual academic cost structure based on full-time enrollment.' : activeJourney === 'Career' ? 'Estimated median reward structure for the opening.' : 'Minimum funds required for visa category compliance.'}
            </p>
          </div>
          
          <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm max-w-2xl rounded-2xl relative overflow-hidden group">
            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider mb-4 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              {activeJourney === 'Education' ? 'Annual Cost Estimates' : activeJourney === 'Career' ? 'Compensation Structure' : 'Financial Declarations'}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-850/65 text-[11px] font-semibold text-slate-700 dark:text-slate-350 space-y-3.5 pt-1">
              <div className="flex justify-between items-center pb-2.5">
                <span>{activeJourney === 'Education' ? 'Tuition Fees' : activeJourney === 'Career' ? 'Base Salary' : 'Tuition / Processing Fees'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{activeJourney === 'Education' ? fees.tuition : activeJourney === 'Career' ? mockStats.avgSalary || '$85,000' : fees.tuition}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>{activeJourney === 'Education' ? 'Application Fee' : activeJourney === 'Career' ? 'Signing Bonus' : 'Processing Charge'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{activeJourney === 'Education' ? fees.applicationFee : activeJourney === 'Career' ? '$5,000' : fees.applicationFee}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>{activeJourney === 'Education' ? 'Living Expenses' : activeJourney === 'Career' ? 'Health & Wellness Benefits' : 'Declared Living Fund (1 Year)'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{activeJourney === 'Education' ? fees.livingExpenses : activeJourney === 'Career' ? 'Full coverage package' : fees.livingExpenses}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span>{activeJourney === 'Education' ? 'Insurance Premium' : activeJourney === 'Career' ? 'Retirement Match' : 'Health Insurance Bond'}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{activeJourney === 'Education' ? fees.insurance : activeJourney === 'Career' ? '401(k) 4% Match' : fees.insurance}</span>
              </div>
            </div>
          </Card>
        </section>
      )}

        {/* Section 7: Campus & Careers (Redesigned Cards) */}
        <section id="section-campus" className="scroll-mt-36 space-y-6">
          <div className="border-l-4 border-teal-500 pl-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
              {activeJourney === 'Education' ? 'Campus Environment & Career Prospects' : activeJourney === 'Career' ? 'Corporate Workspace & Culture' : 'Destination Environment & Living Standard'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {activeJourney === 'Education' ? 'Employment rates, climate indices, and local cost of living averages.' : activeJourney === 'Career' ? 'Company culture index, workspace logistics, and career tracks.' : 'Country settlement parameters, cost index, and living variables.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Campus Climate */}
            <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl flex items-start gap-4">
              <CloudSun className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeJourney === 'Education' ? 'Campus Weather & Housing' : activeJourney === 'Career' ? 'Office Location & Travel' : 'Local Climate & Resettlement'}
                </h4>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-2">
                  {activeJourney === 'Education' ? 'Climate Profile: ' : activeJourney === 'Career' ? 'Regional Hub: ' : 'Climate Index: '}
                  <strong className="text-slate-800 dark:text-slate-200">{mockStats.weather}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  {activeJourney === 'Education' ? 'Housing Ratio: ' : activeJourney === 'Career' ? 'Workplace Layout: ' : 'Housing Availability: '}
                  <strong className="text-slate-800 dark:text-slate-200">{activeJourney === 'Education' ? mockStats.housing : activeJourney === 'Career' ? 'Hybrid / Flexible workspace' : 'Expats / Student housing available'}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  {activeJourney === 'Education' ? 'Living Expenses: ' : activeJourney === 'Career' ? 'Relocation Support: ' : 'Living Cost Rating: '}
                  <strong className="text-slate-800 dark:text-slate-200">{mockStats.livingCost}</strong>
                </p>
              </div>
            </Card>

            {/* Employment and Careers */}
            <Card className="p-6 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 shadow-sm rounded-2xl flex items-start gap-4">
              <Briefcase className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeJourney === 'Education' ? 'Employment Statistics' : activeJourney === 'Career' ? 'Career Progression & Mentors' : 'Authority Registry Compliance'}
                </h4>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-2">
                  {activeJourney === 'Education' ? 'Placement Rate: ' : activeJourney === 'Career' ? 'Retention Rate: ' : 'Acceptance Rate: '}
                  <strong className="text-slate-850 dark:text-slate-200">{mockStats.employmentRate}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  {activeJourney === 'Education' ? 'Average Salary: ' : activeJourney === 'Career' ? 'Expected Equity: ' : 'Average Processing Time: '}
                  <strong className="text-slate-850 dark:text-slate-200">{activeJourney === 'Education' ? mockStats.avgSalary : activeJourney === 'Career' ? 'Available based on grade' : '14-25 business days'}</strong>
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                  {activeJourney === 'Education' ? 'Top Recruiters: ' : activeJourney === 'Career' ? 'Key Partnerships: ' : 'Sponsor Registry Rank: '}
                  <strong className="text-slate-850 dark:text-slate-200">{activeJourney === 'Education' ? mockStats.topEmployers : activeJourney === 'Career' ? 'Tech Council / VC pathways' : 'Highly Trusted Sponsor (HTS)'}</strong>
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
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider">
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
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold leading-relaxed mt-1">
                    {act.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-650 dark:text-blue-400 mt-2">
                  <span>Ask UniCrypt OS</span>
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
