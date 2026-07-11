import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot, BrainCircuit, CheckSquare, ChevronLeft, ClipboardList, Code2, Copy,
  FileText, PanelRightClose, PanelRightOpen, Send, Settings2, Trash2
} from 'lucide-react';
import { askAI } from '../../ai/gateway/index.js';
import { clearSessionMemory } from '../../ai/context/conversationMemory.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';

const STORAGE_KEYS = {
  mode: 'unicrypt_os_panel_mode',
  width: 'unicrypt_os_panel_width',
  conversation: 'unicrypt_os_conversation_v1',
  scroll: 'unicrypt_os_scroll_position'
};

const PANEL_TABS = [
  { id: 'assistant', label: 'Assistant', icon: Bot },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'memory', label: 'Memory', icon: BrainCircuit },
  { id: 'settings', label: 'Settings', icon: Settings2 }
];

function getWelcomeMessage() {
  return {
    id: 'welcome',
    sender: 'ai',
    text: 'Hello — I am **UniCrypt OS**. I can help you understand your workspace, review verification activity, and guide your next action.',
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
        <button onClick={copy} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-white/10" type="button">
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
          <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" key={`table-${lineIndex}`}>
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300"><tr>{headers.map(header => <th className="px-2.5 py-2 font-bold" key={header}>{renderInline(header)}</th>)}</tr></thead>
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

function Placeholder({ icon: Icon, title, description, items }) {
  return (
    <div className="m-4 rounded-2xl border border-slate-200/70 bg-white/50 p-5 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-950/20">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 space-y-2 text-left">{items.map(item => <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300" key={item}>{item}</div>)}</div>
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

  const role = userProfile?.role || 'student';
  const suggestions = role === 'super_admin'
    ? ['Show recent overrides.', 'Summarize platform activity.', 'Which organizations are inactive?']
    : role === 'organization'
      ? ['Summarize pending requests.', 'Which applications need review?', 'Show incomplete submissions.']
      : ['What documents are missing?', 'Can I reuse my passport?', 'Explain my request status.'];

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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 136)}px`;
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

  const assistantContent = (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4" onScroll={event => localStorage.setItem(STORAGE_KEYS.scroll, String(event.currentTarget.scrollTop))} ref={scrollRef}>
        <div className="space-y-4">
          {messages.map(message => {
            const isAssistant = message.sender === 'ai';
            return <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`} key={message.id}>
              <span className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{isAssistant ? 'UniCrypt OS' : 'You'} · {message.timestamp}</span>
              <div className={`max-w-[94%] rounded-2xl px-3.5 py-3 text-xs leading-5 shadow-sm ${isAssistant ? 'border border-slate-200/80 bg-white/80 text-slate-700 dark:border-slate-800/80 dark:bg-[#151925]/90 dark:text-slate-200' : 'bg-blue-600 text-white'}`}>
                {isAssistant ? <TypingMessage text={message.text} /> : <MarkdownContent text={message.text} />}
                {isAssistant && message.citations?.length > 0 && <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">{message.citations.map(citation => <a className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400" href={citation.url} key={citation.url} rel="noreferrer" target="_blank">{citation.title}</a>)}</div>}
                {import.meta.env.DEV && isAssistant && message.provider !== 'none' && <div className="mt-2 border-t border-slate-100 pt-2 text-[9px] font-bold text-slate-400 dark:border-slate-800">{message.provider} · {message.model}</div>}
              </div>
            </div>;
          })}
          {loading && <div className="space-y-2"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">UniCrypt OS is thinking</span><div className="shimmer-bg h-16 w-4/5 rounded-2xl" /></div>}
        </div>
      </div>
      <div className="border-t border-slate-200/80 bg-white/70 p-3 backdrop-blur dark:border-slate-800/80 dark:bg-[#11141e]/85">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">{suggestions.map(suggestion => <button className="whitespace-nowrap rounded-full border border-blue-500/15 bg-blue-500/5 px-2 py-1 text-[9px] font-bold text-blue-600 transition hover:bg-blue-500/10 dark:text-blue-300" key={suggestion} onClick={() => { setInput(suggestion); requestAnimationFrame(updateTextarea); }} type="button">{suggestion}</button>)}</div>
        <form className="flex items-end gap-2" onSubmit={sendMessage}>
          <textarea className="max-h-[136px] min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100" disabled={loading} onChange={event => { setInput(event.target.value); updateTextarea(); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask UniCrypt OS…" ref={textareaRef} value={input} />
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || !input.trim()} type="submit"><Send className="h-4 w-4" /></button>
        </form>
        <p className="mt-1.5 text-[9px] font-medium text-slate-400">Enter to send · Shift + Enter for a new line</p>
      </div>
    </>
  );

  const placeholders = {
    tasks: <Placeholder description="Upcoming operating tasks will appear here as actionable, auditable work items." icon={ClipboardList} items={['Verification review queue', 'Follow-up reminders', 'Escalation readiness']} title="Workspace Tasks" />,
    documents: <Placeholder description="Your scoped vault and active request documents will be organized here." icon={FileText} items={['Verified credentials', 'Active request files', 'Recent document activity']} title="Document Workspace" />,
    memory: <Placeholder description="UniCrypt OS memory will make relevant workspace history easy to review and manage." icon={BrainCircuit} items={['Conversation summaries', 'Saved workspace context', 'Memory controls']} title="Workspace Memory" />,
    settings: <Placeholder description="Panel controls and workspace preferences will live here without interrupting your work." icon={Settings2} items={['Panel behavior', 'Notification preferences', 'Developer diagnostics']} title="OS Settings" />
  };

  return (
    <aside aria-label="UniCrypt OS" className={`unicrypt-os-panel fixed bottom-0 right-0 top-0 z-40 flex flex-col border-l border-slate-200/80 bg-white/75 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl transition-[width,transform,opacity] duration-300 dark:border-slate-800/80 dark:bg-[#0c0f18]/85 ${mode === 'hidden' ? 'pointer-events-none translate-x-full opacity-0' : ''}`} style={{ width: mode === 'collapsed' ? 56 : `${Math.min(Math.round(window.innerWidth * 0.5), Math.max(300, width))}px` }}>
      <div className="absolute -left-1 top-0 hidden h-full w-2 cursor-col-resize md:block" onDoubleClick={resetWidth} onPointerDown={beginResize} title="Drag to resize · double click to reset" />
      {mode === 'collapsed' ? <button className="m-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg" onClick={() => setPanelMode('expanded')} title="Expand UniCrypt OS" type="button"><PanelRightOpen className="h-4 w-4" /></button> : <>
        <header className="border-b border-slate-200/80 px-4 pb-3 pt-4 dark:border-slate-800/80">
          <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950 dark:text-white"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm">🤖</span> UniCrypt OS</h2><p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Current Context</p><p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">{contextLabel}</p></div><div className="flex gap-1"><button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" onClick={clearConversation} title="Clear conversation" type="button"><Trash2 className="h-3.5 w-3.5" /></button><button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" onClick={() => setPanelMode('collapsed')} title="Collapse panel" type="button"><PanelRightClose className="h-3.5 w-3.5" /></button></div></div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200/80 px-2 py-2 dark:border-slate-800/80">{PANEL_TABS.map(tab => { const Icon = tab.icon; return <button className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-bold transition ${activeTab === tab.id ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button"><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}</nav>
        {activeTab === 'assistant' ? assistantContent : placeholders[activeTab]}
      </>}
      {mode === 'hidden' && <button className="pointer-events-auto absolute left-0 top-24 -translate-x-full rounded-l-xl bg-blue-600 p-3 text-white shadow-lg" onClick={() => setPanelMode('expanded')} type="button"><ChevronLeft className="h-4 w-4" /></button>}
    </aside>
  );
}
