import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import { useDocuments } from '../../hooks/useDocuments.js';
import { organizationsData } from '../../data/organizations/index.js';
import { Search, Building, BookOpen, FileText, Sparkles, Navigation, Command, ArrowRight } from 'lucide-react';

// Simple fuzzy matcher
function fuzzyMatch(text, query) {
  if (!text || !query) return false;
  const t = String(text).toLowerCase();
  const q = String(query).toLowerCase();
  if (t.includes(q)) return true;

  let qIdx = 0;
  for (let tIdx = 0; tIdx < t.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
      if (qIdx === q.length) return true;
    }
  }
  return false;
}

export default function GlobalSearch() {
  const { setSelectedOrgId, setSelectedProgramId } = useOrganizations();
  const { credentials, documents } = useDocuments();

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce query input (approx 200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [rawQuery]);

  // Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hardcoded Static Pages for route indexing
  const pages = useMemo(() => [
    { title: 'Dashboard Home', hash: '#dashboard', desc: 'Main dashboard view of verification requests.' },
    { title: 'Organizations Directory', hash: '#organizations', desc: 'Browse partner universities and companies.' },
    { title: 'Credential Vault', hash: '#vault', desc: 'Manage your verified documents and certificates.' },
    { title: 'Verification Requests Inbox', hash: '#requests', desc: 'View pending documents requested from institutions.' },
    { title: 'Recent Activity Logs', hash: '#activity', desc: 'Real-time status changes and verification history.' },
    { title: 'User Settings & Platform Preferences', hash: '#settings', desc: 'Manage alerts, AI models, and preferences.' }
  ], []);

  // Hardcoded Static AI commands
  const commands = useMemo(() => [
    { title: 'Compare My Profile', prompt: 'Compare my profile credentials against admission criteria.' },
    { title: 'Estimate Readiness', prompt: 'Estimate my readiness score with matching credentials.' },
    { title: 'Show Missing Documents', prompt: 'List all missing verification documents required.' },
    { title: 'Application Timeline', prompt: 'Show application milestones and decision timelines.' },
    { title: 'Scholarships Info', prompt: 'What active scholarships exist and how do I apply?' },
    { title: 'Fees Breakdown', prompt: 'Explain the tuition breakdown and living costs.' },
    { title: 'Explain Requirements', prompt: 'Explain the admission document requirements.' }
  ], []);

  // Fetch all organizations data dynamically
  const allOrganizations = useMemo(() => {
    return Object.values(organizationsData);
  }, []);

  // Build search results dynamically
  const resultsGrouped = useMemo(() => {
    if (!debouncedQuery.trim()) return {};

    const q = debouncedQuery.trim();

    // 1. Matches Organizations
    const matchedOrgs = allOrganizations
      .filter(org => 
        fuzzyMatch(org.profile.name, q) || 
        fuzzyMatch(org.profile.description, q) || 
        fuzzyMatch(org.profile.category, q) ||
        (org.profile.searchTags || []).some(t => fuzzyMatch(t, q))
      )
      .map(org => ({
        type: 'org',
        title: org.profile.name,
        subtitle: `${org.profile.category} · ${org.profile.city || org.profile.state || ''}, ${org.profile.country}`,
        data: org
      }));

    // 2. Matches Programs
    const matchedProgs = [];
    allOrganizations.forEach(org => {
      (org.programs || []).forEach(prog => {
        if (fuzzyMatch(prog.name, q) || fuzzyMatch(prog.description, q) || fuzzyMatch(prog.degree, q)) {
          matchedProgs.push({
            type: 'program',
            title: prog.name,
            subtitle: `${org.profile.name} · ${prog.degree} · ${prog.duration}`,
            data: { orgId: org.profile.id, progId: prog.id }
          });
        }
      });
    });

    // 3. Matches Requirements
    const matchedReqs = [];
    allOrganizations.forEach(org => {
      Object.entries(org.requirements || {}).forEach(([progId, reqList]) => {
        const prog = org.programs.find(p => p.id === progId);
        reqList.forEach(req => {
          if (fuzzyMatch(req.type, q) || fuzzyMatch(req.details, q)) {
            matchedReqs.push({
              type: 'requirement',
              title: req.type,
              subtitle: `Requirement for ${org.profile.name} - ${prog?.name || 'Program'}`,
              data: { orgId: org.profile.id, progId }
            });
          }
        });
      });
    });

    // 4. Matches User Documents
    const matchedDocs = (documents || [])
      .filter(doc => fuzzyMatch(doc.fileName, q))
      .map(doc => {
        const cred = (credentials || []).find(c => c.id === doc.credentialId);
        return {
          type: 'document',
          title: doc.fileName,
          subtitle: `Vault Document${cred ? ` · ${cred.type}` : ''}`,
          data: doc
        };
      });

    // 5. Matches Pages
    const matchedPages = pages
      .filter(p => fuzzyMatch(p.title, q) || fuzzyMatch(p.desc, q))
      .map(p => ({
        type: 'page',
        title: p.title,
        subtitle: `Route Navigation · ${p.hash}`,
        data: p
      }));

    // 6. Matches Commands
    const matchedCmds = commands
      .filter(c => fuzzyMatch(c.title, c.prompt) || fuzzyMatch(c.title, q))
      .map(c => ({
        type: 'command',
        title: c.title,
        subtitle: `AI Prompt Shortcut: "${c.prompt}"`,
        data: c
      }));

    const groups = {};
    if (matchedOrgs.length > 0) groups['Organizations'] = matchedOrgs;
    if (matchedProgs.length > 0) groups['Programs'] = matchedProgs;
    if (matchedReqs.length > 0) groups['Requirements'] = matchedReqs;
    if (matchedDocs.length > 0) groups['Documents'] = matchedDocs;
    if (matchedPages.length > 0) groups['Navigation'] = matchedPages;
    if (matchedCmds.length > 0) groups['AI Commands'] = matchedCmds;

    return groups;
  }, [debouncedQuery, allOrganizations, documents, credentials, pages, commands]);

  // Flattened results for easy index tracking
  const flattenedResults = useMemo(() => {
    const list = [];
    Object.entries(resultsGrouped).forEach(([groupName, items]) => {
      items.forEach(item => {
        list.push({ ...item, groupName });
      });
    });
    return list;
  }, [resultsGrouped]);

  // Reset selected active item index on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  // Handle result selection / click
  const selectItem = (item) => {
    setIsOpen(false);
    setRawQuery('');

    if (item.type === 'org') {
      setSelectedOrgId(item.data.profile.id);
      setSelectedProgramId(null);
      window.location.hash = `#organizations?id=${item.data.profile.id}`;
    } else if (item.type === 'program' || item.type === 'requirement') {
      setSelectedOrgId(item.data.orgId);
      setSelectedProgramId(item.data.progId);
      window.location.hash = `#organizations?id=${item.data.orgId}&program=${item.data.progId}`;
    } else if (item.type === 'page') {
      window.location.hash = item.data.hash;
    } else if (item.type === 'document') {
      // Switch to vault tab and focus file
      window.location.hash = '#vault';
    } else if (item.type === 'command') {
      // Trigger AI Copilot prompt injection
      window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: item.data.prompt } }));
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % (flattenedResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + (flattenedResults.length || 1)) % (flattenedResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedResults[activeIndex]) {
        selectItem(flattenedResults[activeIndex]);
      } else if (rawQuery.trim()) {
        // Fallback: Ask User AI
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: rawQuery.trim() } }));
        setRawQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-48 md:w-64 z-50">
      {/* Input query field */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Global Search... (Ctrl+K)"
          value={rawQuery}
          onChange={(e) => {
            setRawQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-8.5 pr-3 py-1.5 w-full text-[11px] font-semibold text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />
      </div>

      {/* Floating Dropdown Results Panel */}
      {isOpen && rawQuery.trim() !== '' && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-md shadow-xl overflow-hidden max-h-[380px] overflow-y-auto z-50 transition-theme animate-slide-in">
          {flattenedResults.length > 0 ? (
            <div className="p-2 space-y-3.5">
              {Object.entries(resultsGrouped).map(([groupName, items]) => (
                <div key={groupName} className="space-y-1">
                  <span className="px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    {groupName}
                  </span>

                  <div className="space-y-0.5">
                    {items.map((item) => {
                      // Calculate global index matching active select highlight
                      const globalIdx = flattenedResults.findIndex(r => r.title === item.title && r.type === item.type);
                      const isHighlighted = globalIdx === activeIndex;

                      let icon = <Navigation className="h-3.5 w-3.5 text-slate-400" />;
                      if (item.type === 'org') icon = <Building className="h-3.5 w-3.5 text-blue-500" />;
                      if (item.type === 'program') icon = <BookOpen className="h-3.5 w-3.5 text-emerald-500" />;
                      if (item.type === 'document') icon = <FileText className="h-3.5 w-3.5 text-amber-500" />;
                      if (item.type === 'command') icon = <Command className="h-3.5 w-3.5 text-pink-500" />;

                      return (
                        <div
                          key={globalIdx}
                          onClick={() => selectItem(item)}
                          className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-blue-600/10 dark:bg-blue-600/15 border-l-2 border-blue-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // No Results State offering Ask User AI query shortcut
            <div className="p-4 text-center space-y-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                No results found
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: rawQuery.trim() } }));
                  setRawQuery('');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer text-left transition-colors group outline-none"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Ask User AI
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                    "{rawQuery.trim()}"
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
