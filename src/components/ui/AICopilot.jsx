import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Trash2, Globe, FileText, Database, ShieldAlert } from 'lucide-react';
import { askAI } from '../../ai/gateway/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocuments } from '../../hooks/useDocuments.js';
import { useNavigate } from 'react-router-dom';
import { clearSessionMemory } from '../../ai/context/conversationMemory.js';
import Button from './Button.jsx';
import Card from './Card.jsx';

export default function AICopilot() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const documentsState = useDocuments();
  const [isOpen, setIsOpen] = useState(false);

  const role = userProfile?.role || 'student';
  const suggestions = role === 'super_admin' ? [
    "Show recent overrides.",
    "Summarize platform activity.",
    "Which organizations are inactive?"
  ] : role === 'organization' ? [
    "Summarize pending requests.",
    "Which applications need review?",
    "Show incomplete submissions."
  ] : [
    "What documents are missing?",
    "Can I reuse my passport?",
    "Explain my request status."
  ];

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 Hello! I am the **UniCrypt AI Copilot**. I can help you verify credentials, search internal context documents, or retrieve general rules. What would you like to know?',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const queryText = input;
    setInput('');
    setLoading(true);

    try {
      const response = await askAI(queryText, {
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

      console.log("AI RESPONSE:", response);

      const replyText = response.reply || "No response from AI";

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        intent: response.intent || 'general',
        confidence: response.confidence || 90,
        citations: response.citations || [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Fire platform UI action if detected
      if (response.action) {
        if (response.action.type === 'SWITCH_TAB') {
          navigate(response.action.hash);
        }
        window.dispatchEvent(new CustomEvent('unicrypt-ai-action', { detail: response.action }));
      }
    } catch (err) {
      console.error('AI Copilot request failed:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: '⚠️ **System Error**: I encountered an error communicating with the UniCrypt AI service. Please make sure local emulators are running or check your connection.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearSessionMemory();
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: '👋 Hello! I am the **UniCrypt AI Copilot**. I can help you verify credentials, search internal context documents, or retrieve general rules. What would you like to know?',
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
  };

  return (
    <>
      {/* 1. FAB Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 cursor-pointer active:scale-95 transition-all duration-150 border-none outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#12131a]"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* 2. Chat Panel Overlay */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-[380px] sm:w-[400px] h-[500px] flex flex-col bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden animate-slide-in transition-all duration-200">
          
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">VeriFlash Copilot</h3>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">Active Assistant Layer</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearHistory}
                title="Clear conversation history"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-900/10">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              
              // Resolve intent styling
              const intentIcon = msg.intent === 'internal' ? <Database className="h-3 w-3 text-indigo-500 shrink-0" /> :
                                 msg.intent === 'web' ? <Globe className="h-3 w-3 text-cyan-500 shrink-0" /> :
                                 msg.intent === 'document' ? <FileText className="h-3 w-3 text-emerald-500 shrink-0" /> : null;
              
              return (
                <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold px-1.5">
                    {isAi && intentIcon}
                    <span>{isAi ? 'VeriFlash AI' : 'You'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isAi
                        ? 'bg-white dark:bg-[#181922] border border-slate-205/60 dark:border-slate-850 text-slate-800 dark:text-slate-200'
                        : 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/10'
                    }`}
                  >
                    {/* Basic Markdown Parser for Bold/Lists */}
                    {msg.text.split('\n').map((line, idx) => {
                      let parsedLine = line;
                      // Replace bold markdown
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const parts = [];
                      let lastIdx = 0;
                      let match;
                      
                      while ((match = boldRegex.exec(parsedLine)) !== null) {
                        parts.push(parsedLine.substring(lastIdx, match.index));
                        parts.push(<strong key={match.index}>{match[1]}</strong>);
                        lastIdx = boldRegex.lastIndex;
                      }
                      parts.push(parsedLine.substring(lastIdx));

                      return (
                        <p key={idx} className="mt-1 first:mt-0">
                          {parts.length > 1 ? parts : parsedLine}
                        </p>
                      );
                    })}

                    {/* Citations display */}
                    {isAi && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/40 space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Sources</span>
                        <div className="flex flex-wrap gap-1">
                          {msg.citations.map((cite, cIdx) => (
                            <a
                              key={cIdx}
                              href={cite.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 px-1.5 py-0.5 rounded"
                            >
                              <Globe className="h-2.5 w-2.5" />
                              {cite.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Execution Banner */}
                    {isAi && msg.intent && msg.intent !== 'general' && (
                      <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <Database className="h-2.5 w-2.5" />
                          <span>Mode: {msg.intent} Knowledge</span>
                        </span>
                        {msg.confidence && (
                          <span>Confidence: {msg.confidence}%</span>
                        )}
                      </div>
                    )}

                    {/* Render starter suggestions under welcome message bubble */}
                    {msg.id === 'welcome' && (
                      <div className="mt-4 pt-3 border-t border-slate-105/80 dark:border-slate-800/40 space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Suggested starter prompts</p>
                        <div className="flex flex-col gap-1.5 mt-2">
                          {suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setInput(suggestion);
                              }}
                              className="w-full text-left px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-xl border border-slate-200 dark:border-slate-800/50 hover:border-slate-350 transition-all duration-150 cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Retry button for system errors */}
                    {msg.text.includes('⚠️ System Error') && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 flex justify-end">
                        <button
                          onClick={() => {
                            // Clear error and resubmit input message
                            setInput(messages[messages.length - 2]?.text || '');
                          }}
                          className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[9px] font-bold uppercase rounded border border-rose-500/20 cursor-pointer"
                        >
                          Retry Call
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loader */}
            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold px-1.5">
                  VeriFlash AI is analyzing...
                </div>
                <div className="bg-white dark:bg-[#181922] border border-slate-205/60 dark:border-slate-850 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800/40 flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Ask about users, files, weather..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-850 px-3.5 py-2 text-xs font-semibold rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-8.5 w-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 cursor-pointer transition-all duration-150 border-none outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-[#12131a]"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
