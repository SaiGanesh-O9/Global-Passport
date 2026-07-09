import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, ToggleLeft, ToggleRight, Search, Brain, CheckCircle, Database } from 'lucide-react';

export default function AIPreferences() {
  const [settings, setSettings] = useState({
    defaultProvider: 'auto',
    defaultModel: '',
    liveSearch: true,
    conversationMemory: true,
    responseStyle: 'balanced',
    streaming: true,
    retryFailed: true,
    autoSwitching: true,
    platformContext: 'Automatic'
  });

  const [savedMessage, setSavedMessage] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setSettings({
      defaultProvider: localStorage.getItem('unicrypt_ai_default_provider') || 'auto',
      defaultModel: localStorage.getItem('unicrypt_ai_default_model') || '',
      liveSearch: localStorage.getItem('unicrypt_ai_live_search') !== 'false',
      conversationMemory: localStorage.getItem('unicrypt_ai_conversation_memory') !== 'false',
      responseStyle: localStorage.getItem('unicrypt_ai_response_style') || 'balanced',
      streaming: localStorage.getItem('unicrypt_ai_streaming') !== 'false',
      retryFailed: localStorage.getItem('unicrypt_ai_retry_failed') !== 'false',
      autoSwitching: localStorage.getItem('unicrypt_ai_auto_switching') !== 'false',
      platformContext: localStorage.getItem('unicrypt_ai_platform_context') || 'Automatic'
    });
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(`unicrypt_ai_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`, value.toString());
      return next;
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const providerModels = {
    auto: ['Auto-Select Best Available'],
    openrouter: ['google/gemini-2.5-flash', 'meta-llama/llama-3-8b-instruct:free', 'deepseek/deepseek-chat'],
    openai: ['gpt-4o-mini', 'gpt-4o'],
    gemini: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    claude: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620'],
    ollama: ['llama3', 'mistral', 'phi3']
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm max-w-3xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Preferences Config</h3>
        </div>
        {savedMessage && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Preferences saved locally</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        {/* Provider Option */}
        <div className="space-y-1">
          <label className="block text-slate-800 dark:text-slate-200">Default Provider</label>
          <select
            value={settings.defaultProvider}
            onChange={(e) => {
              const prov = e.target.value;
              handleChange('defaultProvider', prov);
              handleChange('defaultModel', providerModels[prov]?.[0] || '');
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none focus:border-indigo-500"
          >
            <option value="auto">Auto (Recommended Failover)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        {/* Model Option */}
        <div className="space-y-1">
          <label className="block text-slate-800 dark:text-slate-200">Default Model</label>
          <select
            value={settings.defaultModel}
            onChange={(e) => handleChange('defaultModel', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none focus:border-indigo-500"
          >
            {(providerModels[settings.defaultProvider] || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Response Style */}
        <div className="space-y-1">
          <label className="block text-slate-800 dark:text-slate-200">Response Style</label>
          <select
            value={settings.responseStyle}
            onChange={(e) => handleChange('responseStyle', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none focus:border-indigo-500"
          >
            <option value="balanced">Balanced (Normal)</option>
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical (Detailed)</option>
          </select>
        </div>

        {/* Platform Context Toggle */}
        <div className="space-y-1">
          <label className="block text-slate-800 dark:text-slate-200">Platform Context</label>
          <select
            value={settings.platformContext}
            onChange={(e) => handleChange('platformContext', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none focus:border-indigo-500"
          >
            <option value="Automatic">Automatic (Intelligent Classify)</option>
            <option value="Always Ask">Always Ask</option>
            <option value="Disabled">Disabled (General LLM Only)</option>
          </select>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Advanced Toggles</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Search Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Live Web Search</p>
                <p className="text-[10px] text-slate-400 font-medium">Weather, news, and college updates lookup</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('liveSearch', !settings.liveSearch)}
              className="text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              {settings.liveSearch ? (
                <ToggleRight className="h-6 w-6 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Conversation Memory Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Brain className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Conversation Memory</p>
                <p className="text-[10px] text-slate-400 font-medium">Retains previous prompts for flow</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('conversationMemory', !settings.conversationMemory)}
              className="text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              {settings.conversationMemory ? (
                <ToggleRight className="h-6 w-6 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Streaming Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Enable Streaming</p>
                <p className="text-[10px] text-slate-400 font-medium">Renders text response on the fly</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('streaming', !settings.streaming)}
              className="text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              {settings.streaming ? (
                <ToggleRight className="h-6 w-6 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Retry failed requests Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Sliders className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Retry Failed Requests</p>
                <p className="text-[10px] text-slate-400 font-medium">Automatic network recovery retries</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('retryFailed', !settings.retryFailed)}
              className="text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              {settings.retryFailed ? (
                <ToggleRight className="h-6 w-6 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
