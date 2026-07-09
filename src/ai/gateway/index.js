import { saveSessionMessage, getSessionHistory } from '../memory/index.js';
import { detectPlatformAction } from '../actions/index.js';

/**
 * Client-Side AI Gateway.
 * Forwards NLP prompts and states directly to the Vercel serverless function /api/ai.
 * The client does not directly connect to any LLM providers or manage API keys.
 */
export async function askAI(message, parameters = {}) {
  const { currentUser, userProfile, state, currentScreen, sessionId = 'default', settings = {} } = parameters;

  // 1. Safety check
  const isDestructiveRequest = /(approve|reject|delete|override|remove|clear request)/i.test(message) &&
                               !(/show|list|view/i.test(message));
  if (isDestructiveRequest) {
    return {
      reply: "⚠️ **Safety Constraint**: UniCrypt AI is restricted to read-only assistance. Database modifications must be executed manually using the dashboard buttons.",
      intent: 'general',
      confidence: 100,
      citations: [{ title: "UniCrypt Safety Rules", url: "https://unicrypt.localhost/safety" }]
    };
  }

  // 2. Read preferences from localStorage (fallback default settings)
  const savedSettings = {
    liveSearch: localStorage.getItem('unicrypt_ai_live_search') !== 'false',
    conversationMemory: localStorage.getItem('unicrypt_ai_conversation_memory') !== 'false',
    responseStyle: localStorage.getItem('unicrypt_ai_response_style') || 'balanced',
    defaultProvider: localStorage.getItem('unicrypt_ai_default_provider') || 'auto',
    defaultModel: localStorage.getItem('unicrypt_ai_default_model') || '',
    platformContext: localStorage.getItem('unicrypt_ai_platform_context') || 'Automatic',
    ...settings
  };

  // 3. Load history and log message
  const history = getSessionHistory(sessionId);
  saveSessionMessage(sessionId, { sender: 'user', text: message });

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
        userProfile,
        state,
        currentScreen,
        settings: savedSettings
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server returned error status ${res.status}`);
    }

    const detectedAction = detectPlatformAction(message, userProfile?.role);
    saveSessionMessage(sessionId, { sender: 'ai', text: data.reply });

    return {
      reply: data.reply,
      provider: data.provider,
      model: data.model,
      usage: data.usage,
      latency: data.latency,
      citations: data.citations || [],
      confidence: data.confidence,
      intent: data.intent,
      action: detectedAction,
      failoverLogs: data.failoverLogs
    };

  } catch (err) {
    console.error("Serverless AI Request failed:", err.message);
    return {
      reply: `⚠️ **AI Service Error**: ${err.message || "Failed to communicate with UniCrypt Serverless AI endpoint."}`,
      citations: [],
      provider: 'none',
      model: 'none',
      latency: 0,
      confidence: 0,
      intent: 'general'
    };
  }
}
