import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, CheckSquare, FileText, BrainCircuit, Settings2,
  PanelRightClose, PanelRightOpen, Send, Trash2, Code2, Copy,
  Paperclip, Camera, Mic, Loader2, Sparkles, Activity, Clock, ShieldCheck, Building,
  Home, Folder, User
} from 'lucide-react';
import { askAI } from '../../ai/gateway/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import Card from './Card.jsx';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import { USER_ASSISTANT_PROMPT, ORGANIZATION_ASSISTANT_PROMPT, ADMIN_ASSISTANT_PROMPT } from '../../ai/prompts/index.js';
import MarkdownContent from './MarkdownContent.jsx';

const STORAGE_KEYS = {
  mode: 'unicrypt_os_panel_mode',
  width: 'unicrypt_os_panel_width',
  conversation: 'unicrypt_os_conversation_v1',
  scroll: 'unicrypt_os_scroll_position'
};

const PANEL_TABS = [
  { id: 'assistant', label: 'Insights', icon: Sparkles },
  { id: 'documents', label: 'Vault', icon: FileText },
  { id: 'tasks', label: 'Timeline', icon: Clock }
];

function getWelcomeMessage(role = 'student') {
  if (role === 'admin') {
    return {
      id: 'welcome-admin',
      sender: 'ai',
      text: '### UniCrypt OS™ Governance Portal\nWelcome, **Platform Administrator**. Direct governance intelligence and audit log verification systems are initialized.\n### Active Systems\n- Automated bulk administrative controllers\n- Audit logging registry nodes\n- Multi-tenant compliance dashboards\n### Recommendations\nRequest role adjustments, suspend/activate development profiles, or trigger bulk notifications directly.',
      timestamp: new Date().toLocaleTimeString()
    };
  } else if (role === 'institution') {
    return {
      id: 'welcome-inst',
      sender: 'ai',
      text: '### UniCrypt OS™ Review Assistant\nWelcome, **Verification Officer**. Secured connections to candidate applications and requirement checklists are active.\n### Active Systems\n- Application review pipelines\n- Standard verification templates\n- Cryptographic signature validation\n### Recommendations\nReview pending applications or verify transcript checklists for your target institution.',
      timestamp: new Date().toLocaleTimeString()
    };
  }
  return {
    id: 'welcome-student',
    sender: 'ai',
    text: '### UniCrypt OS™ Personal Assistant\nWelcome, **Candidate**. I have verified a secure connection to your decentralized keys vault.\n### Active Systems\n- Credential vault pre-search resolver\n- Requirement matching comparison\n- UniCrypt Vision document extraction\n### Recommendations\nUpload academic transcripts or check your admissions eligibility details directly.',
    timestamp: new Date().toLocaleTimeString()
  };
}

function getStoredConversation(key = 'unicrypt_os_conversation_student_v1', role = 'student') {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) && saved.length ? saved : [getWelcomeMessage(role)];
  } catch {
    return [getWelcomeMessage(role)];
  }
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
    risk: '',
    nextStep: '',
    relatedDocuments: '',
    actions: '',
    general: ''
  };

  const parts = text.split(/(###?\s*(?:Summary|Analysis|Recommendation|Risk|Next Step|Next Steps|Related Documents|Actions)[:*]*|\*\*(?:Summary|Analysis|Recommendation|Risk|Next Step|Next Steps|Related Documents|Actions)[:*]*\*\*)/gi);
  if (parts.length <= 1) return null;

  let currentKey = 'general';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const lowerPart = part.toLowerCase();
    if (lowerPart.includes('summary')) {
      currentKey = 'summary';
    } else if (lowerPart.includes('analysis')) {
      currentKey = 'analysis';
    } else if (lowerPart.includes('recommendation')) {
      currentKey = 'recommendation';
    } else if (lowerPart.includes('risk')) {
      currentKey = 'risk';
    } else if (lowerPart.includes('next step') || lowerPart.includes('next steps')) {
      currentKey = 'nextStep';
    } else if (lowerPart.includes('related documents')) {
      currentKey = 'relatedDocuments';
    } else if (lowerPart.includes('actions')) {
      currentKey = 'actions';
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

function resolvePipelineLogs(promptText) {
  const lower = (promptText || '').toLowerCase();
  if (lower.includes('compare') || lower.includes('admission') || lower.includes('requirement')) {
    return [
      'Searching target requirements database...',
      'Comparing GPA & document credentials...',
      'Evaluating transcript eligibility...',
      'Summarizing profile match insights...'
    ];
  }
  if (lower.includes('confidence') || lower.includes('score') || lower.includes('eligibility') || lower.includes('readiness')) {
    return [
      'Parsing transcript scores...',
      'Calculating credential match metrics...',
      'Authenticating signature validity keys...',
      'Generating confidence index report...'
    ];
  }
  if (lower.includes('upload') || lower.includes('file') || lower.includes('vault')) {
    return [
      'Preparing secure file upload stream...',
      'Establishing cryptographic secure node...',
      'Verifying document checklist requirements...'
    ];
  }
  return [
    'Searching UniCrypt index workspace...',
    'Verifying active credential parameters...',
    'Formulating intelligence recommendations...'
  ];
}

export default function AICopilot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const documentsState = useDocuments();
  const { credentials = [], documents = [] } = documentsState;
  const { selectedOrgData, selectedProgramData, setSelectedOrgId } = useOrganizations();
  const [selectedRadioCred, setSelectedRadioCred] = useState({});
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEYS.mode) || 'expanded');
  const [width, setWidth] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.width)) || Math.round(window.innerWidth * 0.35));
  const [activeTab, setActiveTab] = useState('assistant');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [dockEnabled, setDockEnabled] = useState(() => localStorage.getItem('unicrypt_bottom_dock_navigation') !== 'false');

  const numericVal = useMemo(() => {
    if (!selectedMetric) return 0;
    const cleanStr = String(selectedMetric.val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return 75;
    return num > 100 ? 100 : num;
  }, [selectedMetric]);

  useEffect(() => {
    const handleViewMetric = (e) => {
      setSelectedMetric(e.detail);
      setMode('expanded');
      setActiveTab('metrics');
    };
    window.addEventListener('unicrypt-view-metric', handleViewMetric);
    return () => window.removeEventListener('unicrypt-view-metric', handleViewMetric);
  }, []);

  useEffect(() => {
    if (activeTab === 'metrics' && selectedMetric) {
      setAnimatedProgress(0);
      const timer = setTimeout(() => {
        setAnimatedProgress(numericVal);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedMetric, numericVal]);

  useEffect(() => {
    const handleToggle = (e) => {
      setDockEnabled(e.detail?.enabled);
    };
    window.addEventListener('unicrypt-bottom-dock-toggle', handleToggle);
    return () => window.removeEventListener('unicrypt-bottom-dock-toggle', handleToggle);
  }, []);

  useEffect(() => {
    if (!dockEnabled || mode !== 'expanded') return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPanelMode('hidden');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dockEnabled, mode]);

  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('unicrypt_last_action_date', new Date().toDateString());
    }
  }, [documents.length]);

  // Current Mission State based on Role
  const mission = useMemo(() => {
    const role = userProfile?.role;
    if (role === 'super_admin') {
      return {
        title: 'Review Platform Requests',
        nextStep: 'Review 14 pending requests',
        progress: 45,
        completed: [
          'Audit registry logging node structures',
          'Identify 17 redundant development test profiles'
        ],
        nextAction: 'Execute bulk verification audit',
        estimatedTime: '4 minutes',
        upcoming: [
          'Approve pending partner organizations catalog list',
          'Export daily cryptographic compliance audit records'
        ],
        onContinue: () => {
          window.location.hash = '#dashboard';
        }
      };
    } else if (role === 'organization') {
      return {
        title: 'Review Verification Queue',
        nextStep: 'Approve 6 awaiting transcripts',
        progress: 60,
        completed: [
          'Initialize secure review pipelines',
          'Synchronize target institution credential templates'
        ],
        nextAction: 'Verify outstanding candidate files',
        estimatedTime: '5 minutes',
        upcoming: [
          'Approve pending verification logs requests list',
          'Flag signatures with low confidence score ratings'
        ],
        onContinue: () => {
          window.location.hash = '#requests';
        }
      };
    } else {
      // Student User
      const hasTranscript = documents.some(d => d.fileName.toLowerCase().includes('transcript') || d.id.includes('essay'));
      const hasPassport = documents.some(d => d.fileName.toLowerCase().includes('passport') || d.id === 'doc-passport');

      const completed = ['IELTS certificate verified', 'Resume credential uploaded'];
      let nextAction = 'Upload Passport';
      let estimatedTime = '2 minutes';
      let progress = 72;
      let upcoming = ['Upload bank statements', 'Compare Purdue requirements', 'Calculate readiness index'];

      if (hasTranscript) {
        completed.push('Academic transcript uploaded and GPA verified');
      } else {
        upcoming.unshift('Upload academic transcript');
      }

      if (hasPassport) {
        completed.push('Passport document uploaded');
        nextAction = 'Upload Bank Statement';
        progress = 85;
        upcoming = ['Compare Purdue requirements', 'Review readiness indices'];
      }

      return {
        title: 'Continue your Iowa State application',
        nextStep: nextAction,
        progress,
        completed,
        nextAction,
        estimatedTime,
        upcoming,
        onContinue: () => {
          if (nextAction === 'Upload Passport') {
            window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: { documentType: 'Passport', reason: 'Mission Step: Passport Verification' } }));
          } else if (nextAction === 'Upload Bank Statement') {
            window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: { documentType: 'Bank Statement', reason: 'Mission Step: Financial Verification' } }));
          } else {
            window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: { documentType: 'Transcript', reason: 'Mission Step: Academic Verification' } }));
          }
        }
      };
    }
  }, [userProfile, documents]);

  const workspaceMemory = useMemo(() => {
    const name = userProfile?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Minnu';
    const lastAction = localStorage.getItem('unicrypt_last_action_date');
    if (lastAction) {
      return {
        greeting: `Welcome back, ${name}`,
        subtext: `Yesterday you uploaded your transcript. Your next step: ${mission.nextStep}.`
      };
    }
    return {
      greeting: `Welcome to UniCrypt OS™, ${name}`,
      subtext: `Active Mission: ${mission.title}. Ready to continue?`
    };
  }, [currentUser, userProfile, mission]);

  const activeTabRoute = (location.hash || '#dashboard').replace('#', '').split('?')[0];
  
  const contextActions = useMemo(() => {
    if (activeTabRoute === 'vault') {
      return [
        { label: 'Compare Documents', prompt: 'Compare my uploaded transcript GPA' },
        { label: 'Vision™ Scan Details', prompt: 'Explain transcript OCR extraction details' },
        { label: 'Share Secure Link', prompt: 'Generate secure credential sharing link' }
      ];
    } else if (activeTabRoute === 'organizations') {
      return [
        { label: 'Compare Requirements', prompt: 'Compare Stanford and Iowa State criteria' },
        { label: 'Start WES Match', prompt: 'Start admission matching workflow' },
        { label: 'Review Guidelines', prompt: 'Explain requirements for Iowa State' }
      ];
    } else if (activeTabRoute === 'activity') {
      return [
        { label: 'Today\'s Events', prompt: 'Show verification activity today' },
        { label: 'Filter Alerts', prompt: 'Filter timeline by verification alerts' },
        { label: 'Audit Trail Details', prompt: 'Analyze timeline audit trails' }
      ];
    } else if (activeTabRoute === 'requests') {
      return [
        { label: 'List Verifications', prompt: 'List pending verifications queue' },
        { label: 'Export Compliance', prompt: 'Export verification audit logs' }
      ];
    }
    return [
      { label: 'Check Readiness™', prompt: 'What is my credential readiness score?' },
      { label: 'Match Index', prompt: 'Compare Stanford admission criteria' }
    ];
  }, [activeTabRoute]);

  const handleContextAction = (prompt) => {
    if (prompt) {
      handlePromptCommand({ detail: { prompt } });
    }
  };

  const aiContext = useMemo(() => {
    const role = userProfile?.role;
    if (role === 'super_admin') {
      return {
        key: 'unicrypt_os_conversation_admin_v1',
        role: 'admin',
        systemPrompt: ADMIN_ASSISTANT_PROMPT
      };
    } else if (role === 'organization') {
      return {
        key: 'unicrypt_os_conversation_institution_v1',
        role: 'institution',
        systemPrompt: ORGANIZATION_ASSISTANT_PROMPT
      };
    } else {
      return {
        key: 'unicrypt_os_conversation_student_v1',
        role: 'student',
        systemPrompt: USER_ASSISTANT_PROMPT
      };
    }
  }, [userProfile]);

  const [messages, setMessages] = useState(() => getStoredConversation(aiContext.key, aiContext.role));

  useEffect(() => {
    setMessages(getStoredConversation(aiContext.key, aiContext.role));
  }, [aiContext]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(aiContext.key, JSON.stringify(messages));
    }
  }, [messages, aiContext]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const resizingRef = useRef(false);

  // Scoped actual pipeline logs state
  const [activePipelineLogs, setActivePipelineLogs] = useState([]);
  const [pipelineStep, setPipelineStep] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setPipelineStep(prev => {
        if (prev < activePipelineLogs.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [loading, activePipelineLogs]);

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    const name = userProfile?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Minnu';
    if (hours < 12) return `Good Morning, ${name}`;
    if (hours < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  }, [currentUser, userProfile]);

  const quickCapabilities = [
    { label: 'Compare My Profile', prompt: 'Compare my profile credentials against Stanford criteria.' },
    { label: 'Check Confidence', prompt: 'Estimate my overall application confidence score.' },
    { label: 'Explain Requirements', prompt: 'Explain the admission document prerequisites.' },
    { label: 'Summarize Document', prompt: 'Give me a brief summary of my uploaded documents.' },
    { label: 'Upload Credential', action: 'upload' }
  ];

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

  const handlePromptCommand = async (event) => {
    const promptText = event?.detail?.prompt;
    if (promptText) {
      if (mode === 'hidden' || mode === 'collapsed') {
        setPanelMode('expanded');
      }
      setActiveTab('assistant');
      
      const userMessage = { id: `user-${Date.now()}`, sender: 'user', text: promptText, timestamp: new Date().toLocaleTimeString() };
      setMessages(previous => [...previous, userMessage]);
      setActivePipelineLogs(resolvePipelineLogs(promptText));
      setPipelineStep(0);
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
          currentScreen: window.location.hash || '#dashboard',
          activeJourney: localStorage.getItem('unicrypt_active_journey') || 'Education',
          selectedOrganization: selectedOrgData ? { id: selectedOrgData.profile.id, name: selectedOrgData.profile.name } : null,
          selectedProgram: selectedProgramData ? { id: selectedProgramData.id, name: selectedProgramData.name } : null
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

  useEffect(() => {
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

  const handleActionClick = (actionUrl) => {
    const parts = actionUrl.split(':');
    const type = parts[1];
    const targetId = parts[2];

    if (type === 'open-doc') {
      window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: targetId } }));
    } else if (type === 'view-org') {
      setSelectedOrgId(targetId);
      navigate('/dashboard#organizations');
    } else if (type === 'bulk-delete-dev') {
      window.dispatchEvent(new CustomEvent('unicrypt-admin-bulk-trigger', { detail: { action: 'delete-dev' } }));
    } else if (type === 'cancel-bulk') {
      window.dispatchEvent(new CustomEvent('unicrypt-admin-bulk-trigger', { detail: { action: 'cancel' } }));
    }
  };

  const resolveRequirementFlow = (promptText) => {
    const lower = (promptText || '').toLowerCase();
    if (lower.includes('apply') || lower.includes('compare') || lower.includes('admission') || lower.includes('requirement')) {
      const transcriptCreds = credentials.filter(c => 
        c.type.toLowerCase().includes('transcript') || 
        c.type.toLowerCase().includes('degree')
      );
      
      if (transcriptCreds.length === 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('unicrypt-tool-request-document', {
            detail: { documentType: 'Transcript', reason: 'Required for eligibility analysis' }
          }));
        }, 1250);
        return {
          state: 3,
          documentType: 'Transcript'
        };
      } else if (transcriptCreds.length === 1) {
        return {
          state: 1,
          documentType: 'Transcript',
          match: transcriptCreds[0]
        };
      } else {
        return {
          state: 2,
          documentType: 'Transcript',
          matches: transcriptCreds
        };
      }
    }
    return null;
  };

  const renderState1Card = (flowResult) => {
    const cred = flowResult.match;
    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/15 rounded-2xl space-y-2.5 text-[10px] shadow-sm">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850/40">
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Transcript Found</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded-lg">Verified</span>
        </div>
        <p className="text-slate-550 dark:text-slate-400 font-bold leading-normal">
          An official {cred.type} verified by <strong>{cred.verifiedBy || 'Northbridge University'}</strong> was located in your Credential Vault.
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: `doc-${cred.id.split('-')[1]}` } }));
            }}
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-755 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            Use this document
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: { documentType: 'Transcript', reason: 'Choose alternative transcript' } }));
            }}
            className="flex-1 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-900 font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            Choose another
          </button>
        </div>
      </div>
    );
  };

  const renderState2Card = (flowResult, msgId) => {
    const list = flowResult.matches;
    const selectedId = selectedRadioCred[msgId] || list[0]?.id;
    return (
      <div className="mt-3 p-3.5 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-250 dark:border-slate-850/60 shadow-sm rounded-2xl space-y-3 text-[10px]">
        <h4 className="font-extrabold text-slate-800 dark:text-slate-205 uppercase tracking-wider">Choose a Transcript</h4>
        <div className="space-y-2">
          {list.map(cred => (
            <label key={cred.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <input
                type="radio"
                name={`cred-choice-${msgId}`}
                checked={selectedId === cred.id}
                onChange={() => setSelectedRadioCred(prev => ({ ...prev, [msgId]: cred.id }))}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-slate-900 dark:text-white block">{cred.type}</span>
                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Verified</span>
              </div>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40">
            <input
              type="radio"
              name={`cred-choice-${msgId}`}
              checked={selectedId === 'upload_new'}
              onChange={() => setSelectedRadioCred(prev => ({ ...prev, [msgId]: 'upload_new' }))}
              className="h-3 w-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="font-bold text-slate-900 dark:text-white">Upload New</span>
          </label>
        </div>
        <button
          onClick={() => {
            if (selectedId === 'upload_new') {
              window.dispatchEvent(new CustomEvent('unicrypt-tool-upload', { detail: { documentType: 'Transcript', reason: 'User requested new upload' } }));
            } else {
              window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: `doc-${selectedId.split('-')[1]}` } }));
            }
          }}
          className="w-full py-1.5 bg-blue-600 hover:bg-blue-755 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer text-center"
        >
          Confirm Choice
        </button>
      </div>
    );
  };

  const renderState3Card = (flowResult) => {
    return (
      <div className="mt-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2 text-[10px]">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wide">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Bypassing text - Requesting Upload...</span>
        </div>
        <p className="text-slate-550 dark:text-slate-400 font-bold leading-normal">
          No matching {flowResult.documentType} was found in your vault. Opening the upload assistant automatically...
        </p>
      </div>
    );
  };

  const sendMessage = async event => {
    event?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    setPanelMode('expanded');
    setActiveTab('assistant');
    const userMessage = { id: `user-${Date.now()}`, sender: 'user', text: query, timestamp: new Date().toLocaleTimeString() };
    setMessages(previous => [...previous, userMessage]);
    setInput('');
    setActivePipelineLogs(resolvePipelineLogs(query));
    setPipelineStep(0);
    setLoading(true);
    requestAnimationFrame(updateTextarea);

    try {
      const activeJourney = localStorage.getItem('unicrypt_active_journey') || 'Education';
      const workspaceContext = {
        workspace: activeJourney.toLowerCase(),
        organization: selectedOrgData?.profile?.name || 'Iowa State University',
        program: selectedProgramData?.name || 'Graduate Admissions Matching',
        selectedDocuments: documents.map(d => d.fileName),
        credentialReadiness: 82,
        currentMission: activeJourney === 'Education' ? 'Graduate Admission' : activeJourney === 'Career' ? 'Employment Verification' : 'Immigration Compliance',
        currentStep: 'Upload Transcript'
      };

      const response = await askAI(query, {
        currentUser,
        userProfile,
        state: {
          verificationRequests: documentsState.verificationRequests,
          credentials,
          documents,
          organizationProfiles: documentsState.organizationProfiles,
          verificationServices: documentsState.verificationServices,
          credentialTemplates: documentsState.credentialTemplates,
          activities: documentsState.activities,
          notifications: documentsState.notifications,
          workspaceContext
        },
        currentScreen: window.location.hash || '#dashboard',
        activeJourney,
        selectedOrganization: selectedOrgData ? { id: selectedOrgData.profile.id, name: selectedOrgData.profile.name } : null,
        selectedProgram: selectedProgramData ? { id: selectedProgramData.id, name: selectedProgramData.name } : null,
        settings: {
          systemPrompt: aiContext.systemPrompt
        }
      });

      const flowResult = resolveRequirementFlow(query);

      setMessages(previous => [...previous, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply || 'No response from UniCrypt OS.',
        intent: response.intent || 'general',
        citations: response.citations || [],
        provider: response.provider || 'none',
        model: response.model || 'none',
        timestamp: new Date().toLocaleTimeString(),
        flowResult
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
    <div className="space-y-6 px-4 py-4" ref={scrollRef}>
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
                    <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {parsed.general.trim() && (
                        <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold px-2">
                          <MarkdownContent onActionClick={handleActionClick} text={parsed.general.trim()} />
                        </div>
                      )}
                      {message.flowResult && (
                        message.flowResult.state === 1 ? renderState1Card(message.flowResult) :
                        message.flowResult.state === 2 ? renderState2Card(message.flowResult, message.id) :
                        message.flowResult.state === 3 ? renderState3Card(message.flowResult) : null
                      )}
                      {parsed.summary.trim() && (
                        <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-2">Summary</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.summary.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.analysis.trim() && (
                        <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-indigo-500 dark:text-indigo-400 tracking-widest mb-2">Analysis</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.analysis.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.recommendation.trim() && (
                        <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 dark:border-emerald-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">Recommendation</h4>
                          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.recommendation.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.risk.trim() && (
                        <div className="p-4 bg-gradient-to-br from-red-500/5 to-transparent border border-red-500/10 dark:border-red-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-red-655 dark:text-red-400 tracking-widest mb-2">Risk</h4>
                          <div className="text-xs text-slate-705 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.risk.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.nextStep.trim() && (
                        <div className="p-4 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 dark:border-amber-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-500 tracking-widest mb-2">Next Step</h4>
                          <div className="text-xs text-slate-705 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.nextStep.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.relatedDocuments.trim() && (
                        <div className="p-4 bg-gradient-to-br from-cyan-500/5 to-transparent border border-cyan-500/10 dark:border-cyan-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400 tracking-widest mb-2">Related Credentials</h4>
                          <div className="text-xs text-slate-705 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.relatedDocuments.trim()} />
                          </div>
                        </div>
                      )}
                      {parsed.actions.trim() && (
                        <div className="p-4 bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10 dark:border-violet-500/10 rounded-2xl relative overflow-hidden">
                          <h4 className="text-[9px] font-extrabold uppercase text-violet-600 dark:text-violet-400 tracking-widest mb-2">Actions</h4>
                          <div className="text-xs text-slate-705 dark:text-slate-200 leading-relaxed font-semibold">
                            <MarkdownContent onActionClick={handleActionClick} text={parsed.actions.trim()} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-sm rounded-2xl relative overflow-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                      <MarkdownContent onActionClick={handleActionClick} text={message.text} />
                      {message.flowResult && (
                        message.flowResult.state === 1 ? renderState1Card(message.flowResult) :
                        message.flowResult.state === 2 ? renderState2Card(message.flowResult, message.id) :
                        message.flowResult.state === 3 ? renderState3Card(message.flowResult) : null
                      )}
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-blue-650 text-white shadow-sm rounded-2xl ml-auto max-w-[85%] text-xs font-semibold leading-relaxed">
                    <MarkdownContent onActionClick={handleActionClick} text={message.text} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl flex items-center gap-3 animate-pulse">
              <Loader2 className="h-4.5 w-4.5 text-blue-600 animate-spin shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {activePipelineLogs[pipelineStep] || 'Processing request...'}
              </span>
            </div>
          )}
    </div>
  );

  const inputsPanel = (
    <div className="p-4 space-y-4 border-t-0 bg-transparent">
      {/* Capability Cards (Quick actions instead of prompt chips) */}
      {activeTab === 'assistant' && messages.length <= 1 && (
        <div className="space-y-2">
          <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider block">
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
          placeholder={activeTab === 'documents' ? 'Ask AI about Vault credentials...' : activeTab === 'tasks' ? 'Ask AI about Timeline milestones...' : 'Ask UniCrypt OS...'}
          className="w-full bg-transparent resize-none outline-none border-none text-xs text-slate-800 dark:text-slate-100 max-h-[120px] min-h-[42px] leading-relaxed"
          disabled={loading}
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-850/50">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-550">
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
  );



  const documentsPanelContent = (
    <div className="space-y-4 p-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Document Intelligence Vault</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-455 font-bold">Query details or view secure credential extractions.</p>
      </div>

      <div className="space-y-2.5">
        {documents.map((doc) => (
          <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <p className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[180px]">{doc.fileName}</p>
              <span className="text-[9px] font-bold text-slate-500">
                Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: doc.id } }));
                }}
                className="px-2.5 py-1 text-[9px] font-black uppercase bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-205 rounded-lg shadow-xs cursor-pointer border-none"
              >
                View
              </button>
              <button
                onClick={() => {
                  handlePromptCommand({ detail: { prompt: `Analyze my uploaded document ${doc.fileName}` } });
                }}
                className="px-2.5 py-1 text-[9px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer border-none"
              >
                Ask OS
              </button>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-6 text-[10px] text-slate-400 font-bold">
            No credentials found in your secure vault.
          </div>
        )}
      </div>
    </div>
  );

  const timelinePanelContent = (
    <div className="space-y-4 p-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Workspace Timeline</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-455 font-bold">Ledger tracking verification approvals and extraction runs.</p>
      </div>

      <div className="space-y-3.5 relative pl-4 border-l border-slate-200 dark:border-slate-800">
        {[
          { title: 'Transcript Uploaded', time: 'Today', desc: 'Official academic transcript received by the local vault.', type: 'Transcript' },
          { title: 'OCR Scanning Complete', time: 'Today', desc: 'UniCrypt Vision™ extracted 45 modules with 99.4% confidence score.', type: 'OCR' },
          { title: 'GPA Extracted', time: 'Today', desc: 'Verified GPA benchmark set to 3.85.', type: 'GPA' },
          { title: 'Passport Verified', time: 'Yesterday', desc: 'Passport status confirmed by platform governance registry.', type: 'Passport' }
        ].map((event, idx) => (
          <div key={idx} className="relative space-y-1">
            <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-950" />
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-455">
              <span>{event.time}</span>
              <span className="text-blue-650 dark:text-blue-450">{event.type}</span>
            </div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">{event.title}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{event.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const metricsPanelContent = (
    <div className="space-y-5 p-4 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="space-y-1">
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-455 uppercase tracking-widest block mb-1">Metrics Intelligence Hub</span>
        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
          {selectedMetric?.label || 'Score Details'}
        </h3>
        <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold">
          Calculated for **{selectedMetric?.orgName || 'Target Partner'}** · {selectedMetric?.detail || 'System Audited'}
        </p>
      </div>

      {/* SVG Animated Circular Gauge */}
      <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-transparent shadow-xs">
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background Track Circle */}
            <circle
              cx="64"
              cy="64"
              r="48"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="48"
              className="stroke-blue-600 transition-all duration-700 ease-out"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 - (animatedProgress / 100) * (2 * Math.PI * 48)}
              strokeLinecap="round"
            />
          </svg>
          {/* Centered score value */}
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {selectedMetric?.val || '75%'}
            </span>
            <span className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-1">
              Readiness Score
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Weights details */}
      <div className="space-y-3">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Score Component Breakdown</span>
        
        {/* Component 1 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-350">
            <span>Registrar Registry Audit (40% Weight)</span>
            <span className="text-blue-650 dark:text-blue-400">Verified</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>

        {/* Component 2 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-350">
            <span>Historical Admissions Match (30% Weight)</span>
            <span className="text-emerald-655 dark:text-emerald-450">Competitive</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, animatedProgress * 1.15)}%` }}
            />
          </div>
        </div>

        {/* Component 3 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-350">
            <span>Active Profile Prerequisites (30% Weight)</span>
            <span className="text-amber-655 dark:text-amber-450">Pending Verification</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(10, animatedProgress * 0.85)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Calculation Formula Math explanation */}
      <div className="bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-2xl space-y-2 border border-transparent">
        <span className="text-[9px] font-black text-blue-600 dark:text-blue-450 uppercase tracking-wider block">Normalized Score Formula</span>
        <div className="text-xs text-slate-805 dark:text-slate-205 font-bold leading-normal text-center py-2 bg-white dark:bg-slate-900/60 rounded-xl">
          {"\\[ \\text{Readiness Index} = \\sum (C_i \\times 0.40) + (H_i \\times 0.30) + (A_i \\times 0.30) \\]"}
        </div>
        <p className="text-[9px] text-slate-500 dark:text-slate-455 leading-relaxed font-semibold">
          {"Where \\(C_i\\) is Credential Authenticity status registry match, \\(H_i\\) is Historical Admissions benchmark comparison, and \\(A_i\\) is Active Requirements coverage status."}
        </p>
      </div>

      <button
        onClick={() => setActiveTab('assistant')}
        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer border-none outline-none text-center block"
        type="button"
      >
        ← Back to AI Assistant
      </button>
    </div>
  );

  const missionWorkspaceContent = (
    <div className="space-y-5 p-4 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="space-y-1">
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-455 uppercase tracking-widest block mb-1">Active Mission Workspace</span>
        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{mission.title}</h3>
        <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold">{workspaceMemory.subtext}</p>
      </div>

      {/* Progress Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold text-slate-550 dark:text-slate-400 uppercase">
          <span>Progress Profile</span>
          <span className="text-blue-600 dark:text-blue-400">{mission.progress}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${mission.progress}%` }}
          />
        </div>
      </div>

      {/* Completed Checklist */}
      <div className="space-y-2">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Completed Steps</span>
        <div className="space-y-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-455">
          {mission.completed.map((task, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span>✓</span>
              <span className="line-through opacity-75">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next step info */}
      <div className="bg-slate-50 dark:bg-slate-955/40 p-4 rounded-2xl flex justify-between items-center gap-3">
        <div>
          <span className="text-[8px] font-black text-blue-600 dark:text-blue-455 uppercase tracking-wider block">Next Immediate Step</span>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">{mission.nextAction}</p>
        </div>
        <span className="text-[8px] font-black text-slate-450 dark:text-slate-550 bg-white dark:bg-slate-900 px-2 py-0.5 rounded shrink-0">
          Est: {mission.estimatedTime}
        </span>
      </div>

      {/* Upcoming checklist */}
      {mission.upcoming.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Upcoming Prerequisites</span>
          <div className="space-y-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-455">
            {mission.upcoming.map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-350 dark:bg-slate-655" />
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Action Button */}
      <button
        onClick={() => {
          setPanelMode('hidden');
          mission.onContinue();
        }}
        className="w-full py-3 bg-blue-600 hover:bg-blue-755 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer border-none outline-none text-center block animate-slide-in"
        type="button"
      >
        Continue Mission →
      </button>
    </div>
  );

  if (dockEnabled) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
        

        <div 
          className={`w-full surface-floating p-4 flex flex-col gap-3.5 pointer-events-auto transition-all duration-350 ease-out ${
            mode === 'expanded' ? 'h-[72vh] rounded-[36px]' : 'h-auto rounded-[32px]'
          }`}
        >
          {mode === 'expanded' ? (
            <div className="flex justify-between items-center pb-2 border-b border-transparent flex-shrink-0">
              <div className="flex gap-4 text-[11px] font-extrabold uppercase tracking-wider">
                <button 
                  onClick={() => setActiveTab('assistant')} 
                  className={`pb-1 outline-none cursor-pointer border-b-2 transition-all ${
                    activeTab === 'assistant' ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent text-slate-455'
                  }`}
                  type="button"
                >
                  Assistant Panel
                </button>
                <button 
                  onClick={() => setActiveTab('mission')} 
                  className={`pb-1 outline-none cursor-pointer border-b-2 transition-all ${
                    activeTab === 'mission' ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent text-slate-455'
                  }`}
                  type="button"
                >
                  Active Mission Workspace
                </button>
                {activeTab === 'metrics' && (
                  <button 
                    onClick={() => setActiveTab('metrics')} 
                    className="pb-1 outline-none cursor-pointer border-b-2 transition-all border-blue-600 text-slate-950 dark:text-white"
                    type="button"
                  >
                    Metrics Intelligence
                  </button>
                )}
              </div>
              <button 
                onClick={() => setPanelMode('hidden')} 
                className="text-slate-450 hover:text-slate-700 dark:hover:text-slate-205 outline-none cursor-pointer text-xs font-bold border-none bg-transparent"
                type="button"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-full">
              {input.trim() !== '' ? (
                <div className="text-[9px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block animate-pulse">
                  ⚡ Command Center: typing query... ({mission.progress}% complete)
                </div>
              ) : (
                <div 
                  onClick={() => { setPanelMode('expanded'); setActiveTab('mission'); }}
                  className="flex items-center justify-between text-xs cursor-pointer hover:opacity-90 select-none transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                    <span className="font-extrabold text-slate-850 dark:text-slate-200">{mission.title}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-455 bg-slate-100/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-lg">
                    Next Action: <span className="text-blue-600 dark:text-blue-455">{mission.nextStep}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'expanded' && (
            <div className="flex-1 overflow-y-auto min-h-0 py-2">
              {activeTab === 'assistant' ? (
                <>
                  {assistantContent}
                  {loading && (
                    <div className="p-4 bg-white/70 dark:bg-[#0f111a]/60 rounded-2xl space-y-2.5 shadow-sm mt-3">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">UniCrypt Research Processing</span>
                      <div className="space-y-1.5">
                        {activePipelineLogs.map((log, idx) => {
                          if (idx < pipelineStep) {
                            return (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                                <span>✓</span>
                                <span className="opacity-75">{log}</span>
                              </div>
                            );
                          } else if (idx === pipelineStep) {
                            return (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-855 dark:text-white animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin text-blue-600 shrink-0" />
                                <span>{log}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-655">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span>{log}</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : activeTab === 'metrics' ? (
                metricsPanelContent
              ) : missionWorkspaceContent}
            </div>
          )}

          <hr className="border-transparent my-0" />

          {contextActions.length > 0 && (
            <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none flex-shrink-0">
              {contextActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleContextAction(action.prompt)}
                  className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/50 dark:hover:bg-slate-900 text-slate-550 dark:text-slate-400 border-none outline-none cursor-pointer transition-all active:scale-95 shrink-0"
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3.5 w-full flex-shrink-0">
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  window.location.hash = '#dashboard';
                  setIsProfileOpen(false);
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all outline-none border-none cursor-pointer ${
                  activeTabRoute === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-555 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900'
                }`}
                title="My Workspace"
                type="button"
              >
                <Home className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#vault';
                  setIsProfileOpen(false);
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all outline-none border-none cursor-pointer ${
                  activeTabRoute === 'vault' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-555 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900'
                }`}
                title="Credential Vault™"
                type="button"
              >
                <Folder className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#activity';
                  setIsProfileOpen(false);
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all outline-none border-none cursor-pointer ${
                  activeTabRoute === 'activity' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-555 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900'
                }`}
                title="UniCrypt Timeline™"
                type="button"
              >
                <Clock className="h-4.5 w-4.5" />
              </button>
            </div>

            <form 
              onSubmit={sendMessage}
              className="flex-1 flex items-center bg-slate-50 dark:bg-slate-950/40 rounded-full h-11 px-4.5 border border-transparent focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
            >
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => {
                  setPanelMode('expanded');
                  setActiveTab('assistant');
                }}
                placeholder="Ask UniCrypt..."
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-205 placeholder-slate-400 shadow-none focus:ring-0"
                disabled={loading}
              />
            </form>

            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all outline-none border-none cursor-pointer ${
                isProfileOpen ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'text-slate-555 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900'
              }`}
              title="Workspace Options"
              type="button"
            >
              <User className="h-4.5 w-4.5" />
            </button>

          </div>

        </div>

        {isProfileOpen && (
          <div className="absolute bottom-[72px] right-4 w-48 text-xs font-bold bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 text-slate-700 dark:text-slate-350 pointer-events-auto space-y-1.5 animate-slide-in z-50">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block pb-1 border-b border-slate-100 dark:border-slate-800/40">
              Workspace Options
            </span>
            <button
              onClick={() => {
                window.location.hash = '#profile';
                setIsProfileOpen(false);
              }}
              className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-55 dark:hover:bg-slate-900/60 transition-colors block border-none outline-none cursor-pointer text-slate-700 dark:text-slate-200 font-bold"
            >
              👤 Profile
            </button>
            <button
              onClick={() => {
                window.location.hash = '#settings';
                setIsProfileOpen(false);
              }}
              className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-55 dark:hover:bg-slate-900/60 transition-colors block border-none outline-none cursor-pointer text-slate-700 dark:text-slate-200 font-bold"
            >
              ⚙ Settings
            </button>
            <div className="border-t border-slate-100 dark:border-slate-800/40 my-1" />
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full text-left py-2 px-2.5 rounded-xl text-rose-600 hover:bg-rose-500/10 transition-colors block border-none outline-none cursor-pointer font-bold"
            >
              🚪 Sign Out
            </button>
          </div>
        )}

      </div>
    );
  }

  return (
    <aside aria-label="UniCrypt OS" className={`unicrypt-os-panel sticky top-[64px] h-[calc(100vh-64px)] z-30 flex flex-col border-l border-slate-200/80 dark:border-slate-850/60 bg-slate-50 dark:bg-[#090a0f] transition-[width,opacity] duration-350 shrink-0 ${mode === 'hidden' ? 'w-0 opacity-0 overflow-hidden border-l-0' : ''}`} style={{ width: mode === 'hidden' ? 0 : mode === 'collapsed' ? 56 : `${Math.min(Math.round(window.innerWidth * 0.45), Math.max(300, width))}px` }}>
      <div className="absolute -left-1 top-0 hidden h-full w-2 cursor-col-resize md:block hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors z-50" onDoubleClick={resetWidth} onPointerDown={beginResize} title="Drag to resize · double click to reset" />
      {mode === 'collapsed' ? <button className="m-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg cursor-pointer" onClick={() => setPanelMode('expanded')} title="Expand UniCrypt OS" type="button"><PanelRightOpen className="h-4 w-4" /></button> : <>
        
        {/* Header Section (Arc/Cursor minimal OS design) */}
        <header className="px-5 pb-3 pt-5 border-b-0 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white font-extrabold text-[9px] tracking-wide">OS</span>
                <h2 className="text-xs font-extrabold text-slate-950 dark:text-white tracking-wider">UniCrypt OS™</h2>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-2 leading-none">{greeting}</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse animate-in fade-in" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Active Workspace</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-850 dark:hover:text-slate-200 cursor-pointer outline-none active:scale-95" onClick={() => setPanelMode('collapsed')} title="Collapse panel" type="button"><PanelRightClose className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Context Display (Branded Intelligence widget) */}
          <div className="p-3.5 bg-white dark:bg-[#0f111a]/70 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl space-y-2.5 text-[10px] animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850/50">
              <span className="font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">Active Workspace Target</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded-lg">UniCrypt Match™: 91%</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-slate-600 dark:text-slate-350">
              <div>
                <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wide block">Journey</span>
                <span className="font-bold text-slate-900 dark:text-white">{localStorage.getItem('unicrypt_active_journey') === 'Career' ? '💼 Career' : localStorage.getItem('unicrypt_active_journey') === 'Immigration' ? '🌍 Immigration' : '🎓 Education'}</span>
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wide block">Target Partner</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block max-w-[120px]">{selectedOrgData?.profile?.name || 'Iowa State University'}</span>
              </div>
              <div className="col-span-2 border-t border-slate-50 dark:border-slate-850/30 pt-2">
                <span className="text-[8px] font-extrabold text-slate-455 dark:text-slate-550 block">Current Workflow</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedProgramData?.name || 'Graduate Admissions Matching'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Minimal Tooltip-based Navigation icons list */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100/40 dark:bg-slate-900/15 rounded-xl mx-4 my-1 border-none">
          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">Navigation</span>
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
                      : 'text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white border border-transparent'
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

        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'assistant' ? assistantContent : 
           activeTab === 'documents' ? documentsPanelContent : 
           activeTab === 'metrics' ? metricsPanelContent : timelinePanelContent}
        </div>
        {inputsPanel}
      </>}
      {mode === 'hidden' && <button className="pointer-events-auto absolute left-0 top-24 -translate-x-full rounded-l-xl bg-blue-600 p-3 text-white shadow-lg cursor-pointer outline-none border-none" onClick={() => setPanelMode('expanded')} type="button"><PanelRightOpen className="h-4 w-4" /></button>}
    </aside>
  );
}
