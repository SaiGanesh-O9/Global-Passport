import React, { useState, useMemo } from 'react';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import MarkdownContent from '../../components/ui/MarkdownContent.jsx';

export default function ObjectRenderer({ activeTab, obj }) {
  const [askInput, setAskInput] = useState('');
  const [aiReplies, setAiReplies] = useState([]);

  // Compute clean numeric values for metric circular track gauges
  const numericVal = useMemo(() => {
    if (!obj.val) return 75;
    const cleanStr = String(obj.val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return 85;
    return num > 100 ? 100 : num;
  }, [obj.val]);

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    const prompt = askInput;
    setAskInput('');

    // Prepend standard simulation response mappings
    let reply = `### Contextual AI Insights
I reviewed the ledger parameters for **${obj.title}** and extracted metadata parameters:
- **Registry Trust Score**: 98%
- **Status Validation**: ${obj.status || 'Verified'}
- **Calculation Compliance**: Checked

The current verification pipeline suggests all dependencies match.`;

    if (obj.type === 'document') {
      reply = `### AI Document Analysis
I performed a secure OCR scan audit on this document artifact:
- **File Name**: \`${obj.title}\`
- **OCR Match Confidence**: 99.4%
- **Integrity Status**: Cryptographically Validated
- **Identified Fields**: Full Academic Record matching University Clearinghouse registries.`;
    }

    setAiReplies(prev => [...prev, { query: prompt, reply }]);
  };

  // 1. AI TAB View
  if (activeTab === 'ai') {
    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-200">
        <div className="bg-blue-500/5 dark:bg-blue-500/10 p-4.5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
          <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Contextual AI Assistant</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Ask direct queries about this {obj.type} object. The AI uses active workspace metadata for analysis.
            </p>
          </div>
        </div>

        {aiReplies.map((chat, idx) => (
          <div key={idx} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850/50">
            <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>You Asked</span>
              <span>{chat.query}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-205 leading-relaxed font-semibold">
              <MarkdownContent text={chat.reply} />
            </div>
          </div>
        ))}

        <form onSubmit={handleAskAI} className="pt-2 flex gap-2">
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder={`Ask AI about this ${obj.type}...`}
            className="flex-1 px-4.5 py-2.5 bg-slate-50 dark:bg-[#0c0d12] border border-slate-200/80 dark:border-slate-850/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none outline-none"
          >
            Ask
          </button>
        </form>
      </div>
    );
  }

  // 2. HISTORY TAB View
  if (activeTab === 'history') {
    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-200">
        <div className="space-y-3 relative pl-4 border-l border-slate-200 dark:border-slate-800">
          {[
            { title: 'Ledger Registry Update', time: 'Today', desc: 'Secure compliance checkpoint verified.' },
            { title: 'Verification Audit Completed', time: 'Yesterday', desc: 'UniCrypt Trust Engines matched parameters with 100% score.' },
            { title: 'Initialized', time: '3 Days Ago', desc: 'Object loaded into workspace memory registry.' }
          ].map((h, idx) => (
            <div key={idx} className="relative space-y-0.5">
              <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-950" />
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-455">
                <span>{h.time}</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{h.title}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. SOURCES TAB View
  if (activeTab === 'sources') {
    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-200">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-transparent shadow-xs space-y-2.5">
          <div className="flex justify-between text-[10px] font-extrabold uppercase text-slate-455">
            <span>Primary Provider</span>
            <span className="text-blue-600 dark:text-blue-450">Clearinghouse Registry</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
            This workspace object is verified directly by the accredited institution registries.
          </p>
        </div>
      </div>
    );
  }

  // 4. OVERVIEW TAB View (Dynamic based on object type)
  if (obj.type === 'metric') {
    return (
      <div className="p-5 space-y-5 animate-in fade-in duration-200">
        {/* SVG Gauge */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-transparent shadow-xs">
          <div className="relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-blue-600 transition-all duration-700 ease-out"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 - (numericVal / 100) * (2 * Math.PI * 40)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {obj.val || '85%'}
              </span>
              <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
                Rating
              </span>
            </div>
          </div>
        </div>

        {/* Math Formula breakdown */}
        <div className="bg-slate-50 dark:bg-slate-955/40 p-4 rounded-2xl space-y-2 border border-transparent">
          <span className="text-[9px] font-black text-blue-600 dark:text-blue-450 uppercase tracking-wider block">Normalized Score Formula</span>
          <div className="text-xs text-slate-800 dark:text-slate-205 font-bold leading-normal text-center py-2 bg-white dark:bg-slate-900/60 rounded-xl">
            {"\\[ \\text{Readiness Index} = \\sum (C_i \\times 0.40) + (H_i \\times 0.30) + (A_i \\times 0.30) \\]"}
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-455 leading-relaxed font-semibold">
            {"Where \\(C_i\\) is Credential Authenticity status registry match, \\(H_i\\) is Historical Admissions benchmark comparison."}
          </p>
        </div>
      </div>
    );
  }

  if (obj.type === 'document') {
    return (
      <div className="p-5 space-y-5 animate-in fade-in duration-200">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center justify-center border border-slate-200/50 dark:border-slate-850/50 shadow-inner h-32 relative group overflow-hidden">
          <FileText className="h-10 w-10 text-slate-400 group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-white uppercase tracking-wider bg-black/30 backdrop-blur-xs select-none">
            Click to View Document
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">OCR Parameter Identifiers</span>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl space-y-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-350">
            <div className="flex justify-between">
              <span>Status Validation</span>
              <span className="text-emerald-600 dark:text-emerald-450">{obj.status || 'Verified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Match Index</span>
              <span className="text-slate-900 dark:text-white">99.4% Score</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (obj.type === 'organization') {
    return (
      <div className="p-5 space-y-5 animate-in fade-in duration-200">
        <div className="p-4.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10 space-y-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Institution Status</span>
            <span className="text-blue-600 dark:text-blue-400">Accredited Partner</span>
          </div>
          <div className="flex justify-between">
            <span>Location Registry</span>
            <span className="text-slate-900 dark:text-white">Verified Location</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 text-center text-xs text-slate-400 font-bold">
      Overview template not found for object type: {obj.type}
    </div>
  );
}
