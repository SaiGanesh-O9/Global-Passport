import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, CheckSquare, FileText, BrainCircuit, Settings2,
  PanelRightClose, PanelRightOpen, Send, Trash2, Code2, Copy,
  Paperclip, Camera, Mic, Loader2, Sparkles, Activity, Clock, ShieldCheck
} from 'lucide-react';
import { askAI } from '../../ai/gateway/index.js';
import { clearSessionMemory } from '../../ai/context/conversationMemory.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import Card from './Card.jsx';

const STORAGE_KEYS = {
  mode: 'unicrypt_os_panel_mode',
  width: 'unicrypt_os_panel_width',
  conversation: 'unicrypt_os_conversation_v1',
  scroll: 'unicrypt_os_scroll_position'
};

const PANEL_TABS = [
  { id: 'assistant', label: 'User AI', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'memory', label: 'Memory', icon: BrainCircuit },
  { id: 'settings', label: 'Settings', icon: Settings2 }
];

function getWelcomeMessage() {
  return {
    id: 'welcome',
    sender: 'ai',
    text: '### Summary\nI am **UniCrypt OS**. I have verified a secure connection to the decentralized keys vault.\n### Analysis\nYour workspace is active and awaiting credential indexing.\n### Recommendation\nChoose a capability below or upload academic documents to begin the verification checks.',
    timestamp: new Date().toLocaleTimeString()
  };
}

function getStoredConversation() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversation));
    return Array.isArray(saved) && saved.length ? saved : [getWelcomeMessage()];
  } catch {
    return [getWelcomeMessage()];
  }
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={index} className="rounded bg-slate-900/10 dark:bg-white/10 px-1 py-0.5 font-mono text-[10px]">{part.slice(1, -1)}</code>;
    return part;
  });
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/70 bg-[#10131d] shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-700/70 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5"><Code2 className="h-3 w-3" /> Code</span>
        <button onClick={copy} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-white/10 cursor-pointer" type="button">
          <Copy className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[11px] leading-5 text-sky-200"><code>{code}</code></pre>
    </div>
  );
}

function MarkdownContent({ text }) {
  const parts = text.split(/```(?:\w+)?\n?|```/);
  return parts.map((part, index) => {
    if (index % 2 === 1) return <CodeBlock code={part.trim()} key={`code-${index}`} />;

    const lines = part.split('\n');
    const blocks = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const nextLine = lines[lineIndex + 1] || '';
      if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(nextLine)) {
        const headers = line.split('|').filter(Boolean).map(cell => cell.trim());
        const rows = [];
        lineIndex += 2;
        while (lineIndex < lines.length && lines[lineIndex].includes('|')) {
          rows.push(lines[lineIndex].split('|').filter(Boolean).map(cell => cell.trim()));
          lineIndex += 1;
        }
        lineIndex -= 1;
        blocks.push(
          <div className="my-3 overflow-x-auto rounded-xl border border-slate-205 dark:border-slate-800" key={`table-${lineIndex}`}>
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 dark:bg-slate-900/70 text-slate-655 dark:text-slate-350"><tr>{headers.map(header => <th className="px-2.5 py-2 font-bold" key={header}>{renderInline(header)}</th>)}</tr></thead>
              <tbody>{rows.map((row, rowIndex) => <tr className="border-t border-slate-100 dark:border-slate-800" key={rowIndex}>{row.map((cell, cellIndex) => <td className="px-2.5 py-2" key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      } else if (/^\s*[-*]\s+/.test(line)) {
        const items = [];
        while (lineIndex < lines.length && /^\s*[-*]\s+/.test(lines[lineIndex])) {
          items.push(lines[lineIndex].replace(/^\s*[-*]\s+/, ''));
          lineIndex += 1;
        }
        lineIndex -= 1;
        blocks.push(<ul className="my-2 list-disc space-y-1 pl-4" key={`list-${lineIndex}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>);
      } else if (/^\s*\d+\.\s+/.test(line)) {
        blocks.push(<ol className="my-2 list-decimal pl-4" key={`ordered-${lineIndex}`}><li>{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li></ol>);
      } else if (line.trim()) {
        blocks.push(<p className="mt-1.5 first:mt-0" key={`line-${lineIndex}`}>{renderInline(line)}</p>);
      }
    }
    return <div key={`content-${index}`}>{blocks}</div>;
  });
}

function TypingMessage({ text }) {
  const [visibleLength, setVisibleLength] = useState(Math.min(text.length, 40));
  useEffect(() => {
    if (visibleLength >= text.length) return undefined;
    const timer = setTimeout(() => setVisibleLength(length => Math.min(text.length, length + 28)), 14);
    return () => clearTimeout(timer);
  }, [text.length, visibleLength]);
  return <MarkdownContent text={text.slice(0, visibleLength)} />;
}

// Parser to split response text into clean cards
function parseStructuredResponse(text) {
  const sections = {
    summary: '',
    analysis: '',
    recommendation: '',
    nextStep: ''
  };

  const parts = text.split(/(###?\s*(?:Summary|Analysis|Recommendation|Next Step|Next Steps)[:*]*|\*\*(?:Summary|Analysis|Recommendation|Next Step|Next Steps)[:*]*\*\*)/gi);
  if (parts.length <= 1) return null;

  let currentKey = 'summary';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const lowerPart = part.toLowerCase();
    if (lowerPart.includes('summary')) {
      currentKey = 'summary';
    } else if (lowerPart.includes('analysis')) {
      currentKey = 'analysis';
    } else if (lowerPart.includes('recommendation')) {
      currentKey = 'recommendation';
    } else if (lowerPart.includes('next step') || lowerPart.includes('next steps')) {
      currentKey = 'nextStep';
    } else {
      sections[currentKey] += part;
    }
  }

  return sections;
}

function Placeholder({ icon, title, description, items }) {
  const IconComponent = icon;
  return (
    <div className="m-4 rounded-2xl border border-slate-200/70 bg-white/50 p-5 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-950/20">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><IconComponent className="h-5 w-5" /></span>
      <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 space-y-2 text-left">{items.map(item => <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350" key={item}>{item}</div>)}</div>
    </div>
  );
}

export default function AICopilot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const documentsState = useDocuments();
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEYS.mode) || 'expanded');
  const [width, setWidth] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.width)) || Math.round(window.innerWidth * 0.35));
  const [activeTab, setActiveTab] = useState('assistant');
  const [messages, setMessages] = useState(getStoredConversation);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const resizingRef = useRef(false);

  // Rotating processing logs state
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingLogs = ['Analyzing workspace...', 'Comparing documents...', 'Checking checklists...', 'Structuring recommendations...'];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setThinkingIndex(idx => (idx + 1) % thinkingLogs.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const role = userProfile?.role || 'student';
  const quickCapabilities = [
    { label: 'Compare My Profile', prompt: 'Compare my profile credentials against Stanford criteria.' },
    { label: 'Check Confidence', prompt: 'Estimate my overall application confidence score.' },
    { label: 'Explain Requirements', prompt: 'Explain the admission document prerequisites.' },
    { label: 'Summarize Document', prompt: 'Give me a brief summary of my uploaded documents.' },
    { label: 'Upload Credential', action: 'upload' }
  ];

  const contextLabel = useMemo(() => {
    const request = documentsState.selectedRequest;
    if (request) return `Current Request · ${request.credentialType || 'Verification'}`;
    if (location.pathname === '/institution') return 'Organization Workspace';
    if (location.pathname === '/admin') return 'Administration Workspace';
    return `${location.hash.replace('#', '') || 'Dashboard'} · ${role.replace('_', ' ')}`;
  }, [documentsState.selectedRequest, location.hash, location.pathname, role]);

  const setPanelMode = nextMode => {
    setMode(nextMode);
    localStorage.setItem(STORAGE_KEYS.mode, nextMode);
    window.dispatchEvent(new CustomEvent('unicrypt-os-state', { detail: { mode: nextMode } }));
  };

  useEffect(() => {
    const handlePanelCommand = event => {
      const requestedMode = event.detail?.mode;
      if (requestedMode === 'toggle') {
        setPanelMode(mode === 'expanded' ? 'collapsed' : mode === 'collapsed' ? 'hidden' : 'expanded');
      } else if (['expanded', 'collapsed', 'hidden'].includes(requestedMode)) {
        setPanelMode(requestedMode);
      }
    };
    window.addEventListener('unicrypt-os-control', handlePanelCommand);
    window.dispatchEvent(new CustomEvent('unicrypt-os-state', { detail: { mode } }));
    return () => window.removeEventListener('unicrypt-os-control', handlePanelCommand);
  }, [mode]);

  useEffect(() => {
    const handlePromptCommand = async (event) => {
      const promptText = event.detail?.prompt;
      if (promptText) {
        if (mode === 'hidden' || mode === 'collapsed') {
          setPanelMode('expanded');
        }
        setActiveTab('assistant');
        
        const userMessage = { id: `user-${Date.now()}`, sender: 'user', text: promptText, timestamp: new Date().toLocaleTimeString() };
        setMessages(previous => [...previous, userMessage]);
        setLoading(true);
        
        try {
          const response = await askAI(promptText, {
            currentUser,
            userProfile,
            state: {
              verificationRequests: documentsState.verificationRequests,
              credentials: documentsState.credentials,
              documents: documentsState.documents,
              organizationProfiles: documentsState.organizationProfiles,
              verificationServices: documentsState.verificationServices,
              credentialTemplates: documentsState.credentialTemplates,
              activities: documentsState.activities,
              notifications: documentsState.notifications
            },
            currentScreen: window.location.hash || '#dashboard'
          });
          setMessages(previous => [...previous, {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: response.reply || 'No response from UniCrypt OS.',
            intent: response.intent || 'general',
            citations: response.citations || [],
            provider: response.provider || 'none',
            model: response.model || 'none',
            timestamp: new Date().toLocaleTimeString()
          }]);
          if (response.action) {
            if (response.action.type === 'SWITCH_TAB') navigate(response.action.hash);
            window.dispatchEvent(new CustomEvent('unicrypt-ai-action', { detail: response.action }));
          }
        } catch {
          setMessages(previous => [...previous, { id: `error-${Date.now()}`, sender: 'ai', text: '**System Error**\nUniCrypt OS could not complete that request. Please try again.', timestamp: new Date().toLocaleTimeString() }]);
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('unicrypt-os-prompt', handlePromptCommand);
    return () => window.removeEventListener('unicrypt-os-prompt', handlePromptCommand);
  }, [mode, currentUser, userProfile, documentsState, navigate]);

  useEffect(() => {
    const clampedWidth = Math.min(Math.round(window.innerWidth * 0.5), Math.max(300, width));
    document.documentElement.style.setProperty('--unicrypt-os-width', mode === 'hidden' ? '0px' : `${mode === 'collapsed' ? 56 : clampedWidth}px`);
    localStorage.setItem(STORAGE_KEYS.width, String(clampedWidth));
  }, [mode, width]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.conversation, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    const panel = scrollRef.current;
    if (panel) panel.scrollTop = Number(localStorage.getItem(STORAGE_KEYS.scroll)) || 0;
  }, [activeTab]);

  const updateTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const beginResize = event => {
    if (window.innerWidth < 768) return;
    event.preventDefault();
    resizingRef.current = true;
    const resize = moveEvent => {
      if (!resizingRef.current) return;
      setWidth(Math.min(Math.round(window.innerWidth * 0.5), Math.max(300, window.innerWidth - moveEvent.clientX)));
    };
    const stopResize = () => {
      resizingRef.current = false;
      window.removeEventListener('pointermove', resize);
      window.removeEventListener('pointerup', stopResize);
    };
    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', stopResize);
  };

  const resetWidth = () => setWidth(Math.round(window.innerWidth * 0.35));

  const sendMessage = async event => {
    event?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    const userMessage = { id: `user-${Date.now()}`, sender: 'user', text: query, timestamp: new Date().toLocaleTimeString() };
    setMessages(previous => [...previous, userMessage]);
    setInput('');
    setLoading(true);
    requestAnimationFrame(updateTextarea);

    try {
      const response = await askAI(query, {
        currentUser,
        userProfile,
        state: {
          verificationRequests: documentsState.verificationRequests,
          credentials: documentsState.credentials,
          documents: documentsState.documents,
          organizationProfiles: documentsState.organizationProfiles,
          verificationServices: documentsState.verificationServices,
          credentialTemplates: documentsState.credentialTemplates,
          activities: documentsState.activities,
          notifications: documentsState.notifications
        },
        currentScreen: window.location.hash || '#dashboard'
      });
      setMessages(previous => [...previous, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply || 'No response from UniCrypt OS.',
        intent: response.intent || 'general',
        citations: response.citations || [],
        provider: response.provider || 'none',
        model: response.model || 'none',
        timestamp: new Date().toLocaleTimeString()
      }]);
      if (response.action) {
        if (response.action.type === 'SWITCH_TAB') navigate(response.action.hash);
        window.dispatchEvent(new CustomEvent('unicrypt-ai-action', { detail: response.action }));
      }
    } catch {
      setMessages(previous => [...previous, { id: `error-${Date.now()}`, sender: 'ai', text: '**System Error**\nUniCrypt OS could not complete that request. Please try again.', timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    clearSessionMemory();
    setMessages([getWelcomeMessage()]);
    localStorage.removeItem(STORAGE_KEYS.scroll);
  };

  const handleCapabilityClick = (cap) => {
    if (cap.action === 'upload') {
      window.dispatchEvent(
        new CustomEvent('unicrypt-ai-action', {
          detail: {
            type: 'OPEN_MODAL',
            modal: 'upload'
          }
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent('unicrypt-os-prompt', { detail: { prompt: cap.prompt } }));
    }
  };

  const assistantContent = (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4" onScroll={event => localStorage.setItem(STORAGE_KEYS.scroll, String(event.currentTarget.scrollTop))} ref={scrollRef}>
        <div className="space-y-6">
          {messages.map(message => {
            const isAssistant = message.sender === 'ai';
            const parsed = isAssistant ? parseStructuredResponse(message.text) : null;

            return (
              <div className="space-y-1.5" key={message.id}>
                <span className="px-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {isAssistant ? 'User AI' : 'You'} · {message.timestamp}
                </span>

                {isAssistant ? (
                  parsed ? (
                    <div className="space-y-3.5">
                      {parsed.summary.trim() && (
                        <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-2">Summary</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent text={parsed.summary.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.analysis.trim() && (
                        <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-indigo-500 dark:text-indigo-400 tracking-widest mb-2">Analysis</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent text={parsed.analysis.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.recommendation.trim() && (
                        <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 dark:border-emerald-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">Recommendation</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent text={parsed.recommendation.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.nextStep.trim() && (
                        <div className="p-4 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 dark:border-amber-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-500 tracking-widest mb-2">Next Step</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent text={parsed.nextStep.trim()} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                      <MarkdownContent text={message.text} />
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-blue-650 text-white shadow-sm rounded-2xl ml-auto max-w-[85%] text-xs font-semibold leading-relaxed">
                    <MarkdownContent text={message.text} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl flex items-center gap-3 animate-pulse">
              <Loader2 className="h-4.5 w-4.5 text-blue-600 animate-spin shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {thinkingLogs[thinkingIndex]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating glassmorphism OS inputs panel */}
      <div className="border-t border-slate-200/80 bg-slate-50/80 p-4 backdrop-blur-md dark:border-slate-850/60 dark:bg-[#090a0f]/80 space-y-4">
        
        {/* Capability Cards (Quick actions instead of prompt chips) */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
              Capabilities
            </span>
            <div className="grid gap-2 grid-cols-2">
              {quickCapabilities.map((cap) => (
                <button
                  key={cap.label}
                  onClick={() => handleCapabilityClick(cap)}
                  className="p-3 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-xl hover:border-blue-500/30 hover:shadow-sm text-[10px] font-extrabold text-left text-slate-800 dark:text-slate-200 cursor-pointer active:scale-95 outline-none transition-all leading-snug"
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="relative rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-2.5 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all dark:border-slate-850/60 dark:bg-[#0f111a]/60 shadow-lg" onSubmit={sendMessage}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={event => { setInput(event.target.value); updateTextarea(); }}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
            placeholder="Ask UniCrypt OS..."
            className="w-full bg-transparent resize-none outline-none border-none text-xs text-slate-800 dark:text-slate-100 max-h-[120px] min-h-[42px] leading-relaxed"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-850/50">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <button type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors outline-none cursor-pointer"><Paperclip className="h-4 w-4" /></button>
              <button type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors outline-none cursor-pointer"><Camera className="h-4 w-4" /></button>
              <button type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors outline-none cursor-pointer"><Mic className="h-4 w-4" /></button>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-750 text-white disabled:opacity-40 transition-all shadow-sm outline-none cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );

  const renderMemoryTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-850/50">
          <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Timeline Memory</span>
          <button onClick={clearConversation} className="text-[9px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
        
        <div className="relative border-l border-slate-200 dark:border-slate-850/80 ml-3.5 pl-5 space-y-6">
          <div className="relative">
            <span className="absolute -left-[25px] top-1.5 flex h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
            <Card className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 rounded-xl space-y-1">
              <span className="text-[8px] font-extrabold uppercase text-blue-500 tracking-wider">System Authenticated</span>
              <h4 className="text-[10px] font-extrabold text-slate-900 dark:text-white">Secure Workspace Initialized</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">Credentials verification index was synced with registry database logs.</p>
            </Card>
          </div>

          <div className="relative">
            <span className="absolute -left-[25px] top-1.5 flex h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <Card className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-205 dark:border-slate-850/60 rounded-xl space-y-1">
              <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Timeline Landmark</span>
              <h4 className="text-[10px] font-extrabold text-slate-900 dark:text-white">Admission Checklists Queried</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">Audit of prerequisite documents completed by User AI assistant.</p>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const placeholders = {
    tasks: <Placeholder description="Upcoming operating tasks will appear here as actionable, auditable work items." icon={CheckSquare} items={['Verification review queue', 'Follow-up reminders', 'Escalation readiness']} title="Workspace Tasks" />,
    documents: <Placeholder description="Your scoped vault and active request documents will be organized here." icon={FileText} items={['Verified credentials', 'Active request files', 'Recent document activity']} title="Document Workspace" />,
    memory: renderMemoryTab(),
    settings: <Placeholder description="Panel controls and workspace preferences will live here without interrupting your work." icon={Settings2} items={['Panel behavior', 'Notification preferences', 'Developer diagnostics']} title="OS Settings" />
  };

  return (
    <aside aria-label="UniCrypt OS" className={`unicrypt-os-panel fixed bottom-0 right-0 top-0 z-40 flex flex-col border-l border-slate-200/80 bg-white/75 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl transition-[width,transform,opacity] duration-300 dark:border-slate-800/80 dark:bg-[#0c0f18]/85 ${mode === 'hidden' ? 'pointer-events-none translate-x-full opacity-0' : ''}`} style={{ width: mode === 'collapsed' ? 56 : `${Math.min(Math.round(window.innerWidth * 0.5), Math.max(300, width))}px` }}>
      <div className="absolute -left-1 top-0 hidden h-full w-2 cursor-col-resize md:block" onDoubleClick={resetWidth} onPointerDown={beginResize} title="Drag to resize · double click to reset" />
      {mode === 'collapsed' ? <button className="m-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg cursor-pointer" onClick={() => setPanelMode('expanded')} title="Expand UniCrypt OS" type="button"><PanelRightOpen className="h-4 w-4" /></button> : <>
        
        {/* Header Section (Arc/Cursor minimal OS design) */}
        <header className="border-b border-slate-200/80 px-4 pb-3.5 pt-4 dark:border-slate-850/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white font-extrabold text-[10px]">OS</span>
                <h2 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">UniCrypt OS</h2>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Connected · User AI</span>
              </div>
              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Context</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-350 truncate max-w-[200px]">{contextLabel}</p>
            </div>
            <div className="flex gap-1.5">
              <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-850 dark:hover:text-slate-200 cursor-pointer outline-none" onClick={() => setPanelMode('collapsed')} title="Collapse panel" type="button"><PanelRightClose className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </header>

        {/* Minimal Tooltip-based Navigation icons list */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-2 dark:border-slate-850/60">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Navigation</span>
          <nav className="flex gap-1.5">
            {PANEL_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center rounded-xl p-2 transition-all outline-none cursor-pointer group ${
                    activeTab === tab.id
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/10'
                      : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  <span className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-slate-900 dark:bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-50">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'assistant' ? assistantContent : placeholders[activeTab]}
      </>}
      {mode === 'hidden' && <button className="pointer-events-auto absolute left-0 top-24 -translate-x-full rounded-l-xl bg-blue-600 p-3 text-white shadow-lg cursor-pointer outline-none border-none" onClick={() => setPanelMode('expanded')} type="button"><PanelRightOpen className="h-4 w-4" /></button>}
    </aside>
  );
}
