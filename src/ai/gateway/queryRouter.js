/**
 * Query Router Heuristics.
 * Classifies user query intents to decide which knowledge modes to apply:
 * - PLATFORM: Mode 1 (Use internal context Engine details).
 * - EXTERNAL: Mode 2 (General knowledge).
 * - HYBRID: Both combined.
 */
export function classifyQuery(message) {
  const msgLower = message.toLowerCase();

  // Heuristic keywords lists
  const platformKeywords = [
    'missing', 'vault', 'pending', 'verified', 'passport', 'transcript', 'essay',
    'degree', 'reject', 'approved', 'override', 'audit', 'log', 'history',
    'notification', 'credential', 'document', 'my request', 'my file', 'my status',
    'unicrypt', 'uncrypt'
  ];

  const hybridKeywords = [
    'apply', 'visa', 'admission', 'university', 'college', 'iowa state', 
    'central missouri', 'missouri state', 'arizona state', 'texas at dall', 
    'northeastern', 'stanford', 'oxford', 'melbourne', 'singapore', 'requirement'
  ];

  const matchesPlatform = platformKeywords.some(kw => msgLower.includes(kw));
  const matchesHybrid = hybridKeywords.some(kw => msgLower.includes(kw));

  // Determine mode
  if (matchesHybrid && matchesPlatform) {
    return {
      mode: 'HYBRID',
      needsWebSearch: msgLower.includes('latest') || msgLower.includes('weather') || msgLower.includes('news')
    };
  }

  if (matchesHybrid) {
    return {
      mode: 'HYBRID',
      needsWebSearch: msgLower.includes('latest') || msgLower.includes('weather') || msgLower.includes('news')
    };
  }

  if (matchesPlatform) {
    return {
      mode: 'PLATFORM',
      needsWebSearch: false
    };
  }

  return {
    mode: 'GENERAL',
    needsWebSearch: msgLower.includes('weather') || msgLower.includes('latest') || msgLower.includes('news') || msgLower.includes('today')
  };
}

/**
 * Generates Query Router instruction blocks for the LLM system prompts.
 */
export function getRouterInstructions(mode, needsWebSearch) {
  let instructions = `INTENT CLASSIFICATION MODE: ${mode}\n`;
  if (mode === 'GENERAL') {
    instructions += `- You are UniCrypt AI. You are a helpful conversational assistant. You answer general questions naturally. DO NOT reference or mention the UniCrypt platform, credentials, verification, or compliance. Answer the user's question directly and conversationally as a general-purpose AI assistant like ChatGPT.\n`;
  } else if (mode === 'PLATFORM') {
    instructions += `- You are UniCrypt AI. The user is asking about UniCrypt platform records. Limit your response strictly to internal platform context data. Do not make up outside history.\n`;
  } else {
    instructions += `- You are UniCrypt AI. The user is asking a hybrid query requiring general knowledge and platform context. First, answer the general question. Then, inspect the user's vault and recommend actions using the platform context.\n`;
  }

  if (needsWebSearch) {
    instructions += `- Live search is currently unavailable. If the user asks for real-time data like weather, news, stock prices, or current events, respond naturally stating: "I currently don't have access to live weather/news information" or similar, instead of generating compliance details or templates.\n`;
  }

  return instructions;
}
