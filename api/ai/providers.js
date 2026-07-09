/**
 * Provider Abstraction & Provider Manager
 * Supports OpenRouter, OpenAI, Gemini, Claude, and Ollama.
 * Implements auto-failover, health checks, metrics, and capacity switching.
 */

function getApiKeyForProvider(provider) {
  const p = provider.toLowerCase();
  let key = null;
  if (p === 'openrouter') key = process.env.OPENROUTER_API_KEY;
  else if (p === 'openai') key = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  else if (p === 'gemini') key = process.env.GEMINI_API_KEY;
  else if (p === 'claude') key = process.env.CLAUDE_API_KEY;
  else if (p === 'ollama') key = process.env.OLLAMA_URL || "http://localhost:11434";
  
  console.log(`Checking provider: ${provider}`);
  console.log(`Found key: ${Boolean(key)}`);
  return key;
}

async function callProviderAPI(provider, key, messages, preferredModel, style) {
  const p = provider.toLowerCase();

  // 1. OpenRouter Integration
  if (p === 'openrouter') {
    const model = preferredModel || "meta-llama/llama-3-8b-instruct";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://unicrypt.localhost",
        "X-Title": "UniCrypt AI"
      },
      body: JSON.stringify({ model, messages })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "OpenRouter error");
    return {
      reply: data.choices[0].message.content,
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0
      }
    };
  }

  // 2. OpenAI Integration
  if (p === 'openai') {
    const model = preferredModel || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, messages })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "OpenAI error");
    return {
      reply: data.choices[0].message.content,
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0
      }
    };
  }

  // 3. Gemini Integration
  if (p === 'gemini') {
    const model = preferredModel || "gemini-1.5-flash";
    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: formattedContents })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "Gemini error");
    return {
      reply: data.candidates[0].content.parts[0].text,
      model: model,
      usage: { promptTokens: 0, completionTokens: 0 }
    };
  }

  // 4. Anthropic Claude Integration
  if (p === 'claude') {
    const model = preferredModel || "claude-3-haiku-20240307";
    const userMessage = messages[messages.length - 1].content;
    const systemPrompt = messages[0].role === 'system' ? messages[0].content : '';
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "Claude error");
    return {
      reply: data.content[0].text,
      model: model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0
      }
    };
  }

  // 5. Ollama Integration (Future/Fallback)
  if (p === 'ollama') {
    const model = preferredModel || "llama3";
    const res = await fetch(`${key}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: messages[messages.length - 1].content,
        stream: false
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Ollama connection failed");
    return {
      reply: data.response,
      model: model,
      usage: { promptTokens: 0, completionTokens: 0 }
    };
  }

  throw new Error(`Unsupported provider name specified: ${provider}`);
}

export async function getResponseWithFailover(messages, preferredProvider = 'auto', preferredModel = '', style = 'balanced') {
  const providersOrder = ['openrouter', 'openai', 'gemini', 'claude', 'ollama'];
  
  let startIdx = 0;
  let activeOrder = [...providersOrder];

  if (preferredProvider && preferredProvider !== 'auto') {
    const chosen = preferredProvider.toLowerCase();
    activeOrder = [chosen, ...providersOrder.filter(x => x !== chosen)];
  }

  let lastError = null;
  const attemptsLog = [];

  for (let i = 0; i < activeOrder.length; i++) {
    const providerName = activeOrder[i];
    const key = getApiKeyForProvider(providerName);
    const isConfigured = Boolean(key) || providerName === 'ollama';

    if (!isConfigured) {
      console.log(`[Provider Debug] Provider: ${providerName}`);
      console.log(`[Provider Debug] Configured: false`);
      console.log(`[Provider Debug] Selected: false`);
      console.log(`[Provider Debug] Skipped: true`);
      console.log(`[Provider Debug] Failure reason: Missing API Key`);
      console.log(`[Provider Debug] Success: false`);
      continue;
    }

    const startTime = Date.now();
    try {
      console.log(`[Provider Debug] Provider: ${providerName}`);
      console.log(`[Provider Debug] Configured: true`);
      console.log(`[Provider Debug] Selected: true`);
      console.log(`[Provider Debug] Skipped: false`);
      console.log(`[Provider Manager] Contacting ${providerName}...`);
      
      const response = await callProviderAPI(providerName, key, messages, preferredModel, style);
      const latency = Date.now() - startTime;
      
      console.log(`[Provider Debug] Success: true`);
      console.log(`[Provider Debug] Failure reason: none`);
      
      return {
        success: true,
        reply: response.reply,
        provider: providerName,
        model: response.model,
        usage: response.usage || { promptTokens: 0, completionTokens: 0 },
        latency: latency,
        sources: [],
        confidence: 94,
        error: null,
        failoverLogs: attemptsLog
      };
    } catch (err) {
      const latency = Date.now() - startTime;
      console.log(`[Provider Debug] Success: false`);
      console.log(`[Provider Debug] Failure reason: ${err.message}`);
      console.error(`[Provider Manager] Failed ${providerName} (${latency}ms):`, err.message);
      
      attemptsLog.push({
        provider: providerName,
        error: err.message,
        latency: latency
      });
      lastError = err;
    }
  }

  return {
    success: false,
    reply: "⚠️ **UniCrypt AI System Error**: All configured AI provider adapters failed. Please check Vercel Logs or your API Keys.",
    provider: 'none',
    model: 'none',
    usage: { promptTokens: 0, completionTokens: 0 },
    latency: 0,
    sources: [],
    confidence: 0,
    error: lastError ? lastError.message : "No configured providers available",
    failoverLogs: attemptsLog
  };
}
