import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, RefreshCw, Trash2, Globe, FileText, Database, ShieldAlert } from 'lucide-react';
import { askAI } from '@/ai/gateway';
import Button from './Button.jsx';
import Card from './Card.jsx';

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 Hello! I am the **VeriFlash AI Copilot**. I can help you search internal Firestore records, query document uploads, or search the web. What would you like to know?',
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
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const response = await askAI(queryText, {
        conversationHistory: history,
      });

      console.log("AI RESPONSE:", response);

      const replyText = response.reply || response.responseText || "No response from AI";

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        intent: response.intent || 'general',
        citations: response.citations || [],
        messageBus: response.messageBus || [],
        agentContributions: response.agentContributions || [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Copilot request failed:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: '⚠️ **System Error**: I encountered an error communicating with the VeriFlash AI service. Please make sure local emulators are running or check your connection.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: '👋 Hello! I am the **VeriFlash AI Copilot**. I can help you search internal Firestore records, query document uploads, or search the web. What would you like to know?',
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
  };

  return (
    <>
      {/* 1. FAB Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 cursor-pointer active:scale-95 transition-all duration-150 border-none outline-none"
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

                    {/* Collapsible Message Bus Trace */}
                    {isAi && msg.messageBus && msg.messageBus.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/40 space-y-1">
                        <details className="outline-none group">
                          <summary className="text-[9px] font-bold text-blue-650 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wide cursor-pointer list-none flex items-center justify-between">
                            <span>View Agent Communication Trace ({msg.messageBus.length})</span>
                            <span className="text-[8px] transform group-open:rotate-180 transition-transform">&darr;</span>
                          </summary>
                          <div className="mt-2 space-y-2 text-[9px] text-slate-550 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-205 dark:border-slate-850">
                            {msg.messageBus.map((item, idx) => (
                              <div key={idx} className="border-b border-slate-100/50 dark:border-slate-850/50 last:border-b-0 pb-1.5 last:pb-0">
                                <div className="flex justify-between font-bold text-slate-705 dark:text-slate-300">
                                  <span>{item.sender} &rarr; {item.receiver}</span>
                                  <span className="text-blue-650 dark:text-blue-400 text-[8px] bg-blue-500/10 px-1 rounded">{item.type}</span>
                                </div>
                                <p className="mt-1 text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                                  {msg.agentContributions[idx]?.contribution}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
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
              className="h-8.5 w-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 cursor-pointer transition-all duration-150 border-none outline-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
