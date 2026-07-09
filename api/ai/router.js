/**
 * Intent Router Module
 * Classifies every user prompt into one of the four categories:
 * - GENERAL (Standard LLM direct reply)
 * - LIVE (Live search retrieval + LLM context integration)
 * - PLATFORM (Internal Firestore credentials compilation + LLM)
 * - HYBRID (Live search guidelines + User vault comparisons)
 */

export function classifyQuery(message) {
  const msgLower = message.toLowerCase();

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

  if (matchesHybrid && matchesPlatform) {
    return {
      mode: 'HYBRID',
      needsWebSearch: msgLower.includes('latest') || msgLower.includes('weather') || msgLower.includes('news') || matchesHybrid
    };
  }

  if (matchesHybrid) {
    return {
      mode: 'HYBRID',
      needsWebSearch: msgLower.includes('latest') || msgLower.includes('weather') || msgLower.includes('news') || matchesHybrid
    };
  }

  if (matchesPlatform) {
    return {
      mode: 'PLATFORM',
      needsWebSearch: false
    };
  }

  const liveKeywords = ['weather', 'latest', 'news', 'today', 'sports', 'events', 'exchange rate'];
  const matchesLive = liveKeywords.some(kw => msgLower.includes(kw));

  if (matchesLive) {
    return {
      mode: 'LIVE',
      needsWebSearch: true
    };
  }

  return {
    mode: 'GENERAL',
    needsWebSearch: false
  };
}

export function getRouterInstructions(mode, needsWebSearch) {
  let instructions = `INTENT CLASSIFICATION MODE: ${mode}\n`;
  if (mode === 'GENERAL') {
    instructions += `- You are UniCrypt AI. You are a helpful conversational assistant. You answer general questions naturally. DO NOT reference or mention the UniCrypt platform, credentials, verification, or compliance. Answer the user's question directly and conversationally as a general-purpose AI assistant like ChatGPT.\n`;
  } else if (mode === 'PLATFORM') {
    instructions += `- You are UniCrypt AI. The user is asking about UniCrypt platform records. Limit your response strictly to internal platform context data. Do not make up outside history.\n`;
  } else if (mode === 'LIVE') {
    instructions += `- You are UniCrypt AI. The user is asking a live query. Use the provided search results to answer conversationally.\n`;
  } else {
    instructions += `- You are UniCrypt AI. The user is asking a hybrid query requiring general knowledge and platform context. First, answer the general question. Then, inspect the user's vault and recommend actions using the platform context.\n`;
  }

  if (needsWebSearch) {
    instructions += `- Live search is currently active. Utilize search results if provided to format your answer naturally, instead of generating compliance details or templates.\n`;
  }

  return instructions;
}
