import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import { useDocuments } from '../../hooks/useDocuments.js';
import { organizationsData } from '../../data/organizations/index.js';
import { Search, Building, BookOpen, FileText, Sparkles, Navigation, Command, ArrowRight, CornerDownLeft, Clock, Zap, X } from 'lucide-react';

const RECENT_SEARCHES_KEY = 'unicrypt_recent_searches_v2';
const MAX_RECENTS = 5;

// Robust fuzzy matcher
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
  const [recentSearches, setRecentSearches] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  // Debounce search input (~200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [rawQuery]);

  // Keyboard listener for opening modal with Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close command palette on click outside or routing
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent scroll when command palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Static Pages for route indexing
  const pages = useMemo(() => [
    { title: 'Dashboard Home', hash: '#dashboard', desc: 'Main dashboard view of verification requests.' },
    { title: 'Organizations Directory', hash: '#organizations', desc: 'Browse partner universities and companies.' },
    { title: 'Credential Vault', hash: '#vault', desc: 'Manage your verified documents and certificates.' },
    { title: 'Verification Requests Inbox', hash: '#requests', desc: 'View pending documents requested from institutions.' },
    { title: 'Recent Activity Logs', hash: '#activity', desc: 'Real-time status changes and verification history.' },
    { title: 'User Settings & Preferences', hash: '#settings', desc: 'Manage alerts, AI models, and preferences.' }
  ], []);

  // Static Quick Action AI commands
  const quickActions = useMemo(() => [
    { title: 'Compare My Profile', prompt: 'Compare my profile credentials against admission criteria.' },
    { title: 'Estimate Readiness', prompt: 'Estimate my readiness score with matching credentials.' },
    { title: 'Show Missing Documents', prompt: 'List all missing verification documents required.' },
    { title: 'Application Timeline', prompt: 'Show application milestones and decision timelines.' }
  ], []);

  const allOrganizations = useMemo(() => Object.values(organizationsData), []);

  // Filter and build results dynamically
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
    const matchedCmds = quickActions
      .filter(c => fuzzyMatch(c.title, q) || fuzzyMatch(c.prompt, q))
      .map(c => ({
        type: 'command',
        title: c.title,
        subtitle: `AI Prompt: "${c.prompt}"`,
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
  }, [debouncedQuery, allOrganizations, documents, credentials, pages, quickActions]);

  // Flattened results for active selection index tracking
  const flattenedResults = useMemo(() => {
    const list = [];
    Object.entries(resultsGrouped).forEach(([groupName, items]) => {
      items.forEach(item => {
        list.push({ ...item, groupName });
      });
    });
    return list;
  }, [resultsGrouped]);

  // Reset index on search updates
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  // Save search query to localStorage
  const saveSearch = (searchVal) => {
    if (!searchVal || !searchVal.trim()) return;
    const trimmed = searchVal.trim();
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENTS);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecents = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Perform navigation or selection on item select
  const selectItem = (item) => {
    setIsOpen(false);
    saveSearch(rawQuery);
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
      window.location.hash = '#vault';
    } else if (item.type === 'command') {
      window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: item.data.prompt } }));
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
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
        setIsOpen(false);
        saveSearch(rawQuery);
        window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: rawQuery.trim() } }));
        setRawQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Redesigned Premium Glassmorphic Search Trigger Pill (56-60px height) */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center justify-between pl-5 pr-4 h-[56px] w-72 md:w-[380px] bg-white/30 dark:bg-slate-900/35 backdrop-blur-md border border-slate-250/50 dark:border-slate-850/50 rounded-full hover:border-blue-500/30 hover:ring-4 hover:ring-blue-500/10 shadow-md dark:shadow-black/5 transition-all duration-300 active:scale-[0.98] outline-none group"
      >
        <div className="flex items-center min-w-0 flex-1 mr-3">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 shrink-0 transition-colors mr-3" />
          <span className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-450 text-left truncate">
            Search organizations, documents or ask UniCrypt...
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 dark:bg-slate-850/60 border border-slate-200/50 dark:border-slate-800/50 rounded-full shadow-sm shrink-0">
          <Sparkles className="h-3 w-3 text-pink-500 shrink-0" />
          <kbd className="text-[9px] font-sans font-bold text-slate-400 dark:text-slate-555 tracking-normal uppercase leading-none">
            Ctrl+K
          </kbd>
        </div>
      </button>

      {/* Large Floating Command Palette Modal */}
      {isOpen && (
        <div ref={containerRef} className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop Blur overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0f111a]/95 border border-slate-200/80 dark:border-slate-855/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200 z-10">
            
            {/* Header Query Input Bar */}
            <div className="relative flex items-center border-b border-slate-100 dark:border-slate-850">
              <Search className="absolute left-4 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search organizations, programs, requirements, vault documents, or commands..."
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent py-4.5 pl-12 pr-16 text-[13px] font-bold text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
              
              <div className="absolute right-4 flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded text-slate-400 dark:text-slate-500">
                  ESC
                </span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[45vh] transition-all">
              
              {/* Default State: When Query is Empty */}
              {rawQuery.trim() === '' && (
                <div className="space-y-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Recent Searches
                        </span>
                        <button 
                          onClick={clearRecents}
                          className="text-[9px] font-bold text-blue-500 hover:text-blue-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {recentSearches.map((search, idx) => (
                          <div
                            key={idx}
                            onClick={() => setRawQuery(search)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer text-slate-700 dark:text-slate-305 transition-colors"
                          >
                            <Search className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[11px] font-bold">{search}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Quick AI Actions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {quickActions.map((act, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: act.prompt } }));
                          }}
                          className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-blue-500/5 hover:border-blue-500/20 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                              {act.title}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 truncate mt-0.5">
                              {act.prompt}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Navigation Pages */}
                  <div className="space-y-1.5">
                    <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      Navigation Shortcuts
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {pages.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setIsOpen(false);
                            window.location.hash = p.hash;
                          }}
                          className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-slate-100 dark:border-slate-855/60 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-blue-500/5 hover:border-blue-500/20 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <Navigation className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                              {p.title}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 truncate mt-0.5">
                              {p.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Grouped Dynamic Search Results */}
              {rawQuery.trim() !== '' && flattenedResults.length > 0 && (
                <div className="space-y-3.5">
                  {Object.entries(resultsGrouped).map(([groupName, items]) => (
                    <div key={groupName} className="space-y-1">
                      <span className="px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        {groupName}
                      </span>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const globalIdx = flattenedResults.findIndex(r => r.title === item.title && r.type === item.type);
                          const isHighlighted = globalIdx === activeIndex;

                          let icon = <Navigation className="h-4 w-4 text-slate-455" />;
                          if (item.type === 'org') icon = <Building className="h-4 w-4 text-blue-500" />;
                          if (item.type === 'program') icon = <BookOpen className="h-4 w-4 text-emerald-500" />;
                          if (item.type === 'document') icon = <FileText className="h-4 w-4 text-amber-500" />;
                          if (item.type === 'command') icon = <Command className="h-4 w-4 text-pink-500" />;

                          return (
                            <div
                              key={globalIdx}
                              onClick={() => selectItem(item)}
                              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] border-l-2 ${
                                isHighlighted
                                  ? 'bg-blue-600/10 dark:bg-blue-600/15 border-blue-600 text-blue-900 dark:text-white'
                                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-800 dark:text-slate-350'
                              }`}
                            >
                              <span className="shrink-0">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-505 dark:text-slate-450 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                              {isHighlighted && (
                                <CornerDownLeft className="h-3.5 w-3.5 text-blue-500 shrink-0 opacity-80 animate-pulse" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty / Zero-Matches State */}
              {rawQuery.trim() !== '' && flattenedResults.length === 0 && (
                <div className="p-8 text-center space-y-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    No results found
                  </p>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      saveSearch(rawQuery);
                      window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: rawQuery.trim() } }));
                      setRawQuery('');
                    }}
                    className="mx-auto w-full max-w-sm flex items-center justify-between p-3.5 rounded-xl border border-dashed border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer text-left transition-all active:scale-[0.98] group outline-none shadow-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Ask User AI
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                        "{rawQuery.trim()}"
                      </p>
                    </div>
                    <ArrowRight className="h-4.5 w-4.5 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Commands Helper Layout */}
            <div className="border-t border-slate-100 dark:border-slate-850 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-850 border dark:border-slate-700 rounded shadow-sm text-[8px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-850 border dark:border-slate-700 rounded shadow-sm text-[8px]">Enter</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 bg-white dark:bg-slate-850 border dark:border-slate-700 rounded shadow-sm text-[8px]">Esc</kbd>
                  Close
                </span>
              </div>
              <div>
                UniCrypt Command Center
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
