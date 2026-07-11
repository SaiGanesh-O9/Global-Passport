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
import { ChevronLeft, Info, HelpCircle, ArrowRight, MessageSquare, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState('Overview');

  // Keep hash aligned for AI Context extraction
  useEffect(() => {
    if (selectedOrgId) {
      let hash = `#organizations?id=${selectedOrgId}`;
      if (selectedProgramId) {
        hash += `&program=${selectedProgramId}`;
      }
      window.location.hash = hash;
    }
  }, [selectedOrgId, selectedProgramId]);

  if (!selectedOrgData) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-bold text-slate-500">Institution not found.</p>
        <Button onClick={() => setSelectedOrgId(null)} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  const { profile, programs, deadlines, timelines, scholarships, fees, faq, contacts } = selectedOrgData;

  // Handle upload action from Checklist trigger
  const handleUploadAction = () => {
    // Open the upload modal and pass the organization context
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

  // Dispatch Quick Action Prompt injection to the OS Copilot
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

    // Trigger the copilot prompt injection custom event
    window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt } }));
  };

  const handleOrgNavigation = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    setSelectedProgramId(null);
    setActiveTab('Overview');
  };

  return (
    <div className="space-y-6">
      {/* Back Button Link */}
      <button
        onClick={() => {
          setSelectedOrgId(null);
          setSelectedProgramId(null);
          window.location.hash = '#organizations';
        }}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Directory
      </button>

      {/* Hero Header component */}
      <OrganizationHero org={profile} />

      {/* Profile Page Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto gap-5 text-xs font-bold text-slate-500 pb-px scrollbar-none">
        {['Overview', 'Programs', 'Requirements', 'Deadlines', 'Scholarships', 'Fees', 'Ask User AI'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 relative transition-colors duration-150 cursor-pointer whitespace-nowrap outline-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold border-b-2 border-blue-600 dark:border-blue-400'
                  : 'hover:text-slate-800 dark:hover:text-slate-300 font-bold'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Contents Panels */}
      <div className="min-h-[250px]">
        {/* 1. Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
                  About Institution
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                  {profile.description}
                </p>
              </Card>

              {/* FAQs List */}
              {faq && faq.length > 0 && (
                <Card className="p-6 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {faq.map((q, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-start gap-1.5">
                          <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          {q.question}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-1.5 pl-5.5">
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
              <Card className="p-5 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Contact Channels
                </h3>
                <div className="space-y-3.5 text-[11px] font-semibold text-slate-700 dark:text-slate-350">
                  {contacts.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-slate-450 dark:text-slate-500 font-bold">{c.role}</p>
                      <p className="text-slate-900 dark:text-white">{c.email}</p>
                      {c.phone && <p className="text-slate-450 mt-0.5">{c.phone}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. Programs Tab */}
        {activeTab === 'Programs' && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {programs.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  onSelect={() => {
                    setSelectedProgramId(prog.id);
                    setActiveTab('Requirements');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. Requirements Tab */}
        {activeTab === 'Requirements' && (
          <div className="space-y-6">
            {/* Program selector header dropdown */}
            <Card className="p-4 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Active Program Context
                  </span>
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => setSelectedProgramId(e.target.value || null)}
                    className="bg-transparent text-xs font-extrabold text-slate-950 dark:text-white outline-none mt-0.5 pr-2 focus:ring-1 focus:ring-blue-500 rounded cursor-pointer border-none"
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
                <div className="text-[10px] text-slate-455 font-bold space-y-0.5 sm:text-right">
                  <p>STEM Status: <span className="text-slate-800 dark:text-slate-350">{selectedProgramData.stemStatus}</span></p>
                  <p>Duration: <span className="text-slate-800 dark:text-slate-350">{selectedProgramData.duration}</span></p>
                </div>
              )}
            </Card>

            {selectedProgramId ? (
              <RequirementChecklist
                requirements={selectedRequirements}
                onActionClick={handleUploadAction}
              />
            ) : (
              <Card className="p-8 text-center bg-white dark:bg-[#12131a]/30 border border-slate-205 dark:border-slate-800/40">
                <p className="text-xs text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider">
                  Please select an academic program above to inspect its credential requirements checklist.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* 4. Deadlines Tab */}
        {activeTab === 'Deadlines' && (
          <TimelineCard timelines={timelines} deadlines={deadlines} />
        )}

        {/* 5. Scholarships Tab */}
        {activeTab === 'Scholarships' && (
          <div className="grid gap-6 sm:grid-cols-2">
            {scholarships.map((s, i) => (
              <ScholarshipCard key={i} scholarship={s} />
            ))}
          </div>
        )}

        {/* 6. Fees Tab */}
        {activeTab === 'Fees' && (
          <Card className="p-6 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm max-w-2xl">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
              Ancillary Fee Breakdowns
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 mb-4 font-semibold">
              Estimated annual academic cost structure based on standard enrollment.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-350 space-y-3.5 pt-1">
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
        )}

        {/* 7. Ask User AI Tab */}
        {activeTab === 'Ask User AI' && (
          <div className="space-y-6">
            {/* Quick Actions Header */}
            <Card className="p-6 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl pointer-events-none" />
              <div className="flex gap-3 items-start relative z-10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-600/10 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
                    Intelligent Quick Actions
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                    Submit scoped prompts directly to UniCrypt OS. The copilot automatically loads current institution datasets for answers.
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Actions grid of prompts */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: 'compare', title: 'Compare My Profile', desc: 'Assess qualifications against general admission benchmarks.' },
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
                  className="p-4 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 rounded-xl shadow-sm text-left hover:border-blue-500/50 group cursor-pointer transition-all flex flex-col justify-between h-full gap-2 outline-none"
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-1">
                      {act.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                    <span>Inject Prompt</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar Organizations section */}
      <SimilarOrganizations currentOrg={profile} onOrgSelect={handleOrgNavigation} />
    </div>
  );
}
