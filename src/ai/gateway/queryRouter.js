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
    'missing', 'status', 'vault', 'verified', 'passport', 'transcript', 'essay',
    'degree', 'reject', 'approved', 'pending', 'reuse', 'my document', 'my request',
    'request verification', 'uncrypt', 'veriflash', 'override', 'audit log'
  ];

  const externalKeywords = [
    'what is', 'explain', 'how does', 'definition', 'iso', 'blockchain',
    'difference between', 'study in', 'apostille', 'regulations', 'compliance'
  ];

  const matchesPlatform = platformKeywords.some(kw => msgLower.includes(kw));
  const matchesExternal = externalKeywords.some(kw => msgLower.includes(kw));

  if (matchesPlatform && matchesExternal) {
    return {
      mode: 'HYBRID',
      needsWebSearch: msgLower.includes('latest') || msgLower.includes('regulation') || msgLower.includes('rules') || msgLower.includes('requirements')
    };
  }

  if (matchesPlatform) {
    return {
      mode: 'PLATFORM',
      needsWebSearch: false
    };
  }

  if (matchesExternal) {
    return {
      mode: 'EXTERNAL',
      needsWebSearch: msgLower.includes('study in') || msgLower.includes('latest') || msgLower.includes('requirements')
    };
  }

  // Default to hybrid to be safe
  return {
    mode: 'HYBRID',
    needsWebSearch: false
  };
}

/**
 * Generates Query Router instruction blocks for the LLM system prompts.
 */
export function getRouterInstructions(mode, needsWebSearch) {
  let instructions = `INTENT CLASSIFICATION MODE: ${mode}\n`;
  if (mode === 'PLATFORM') {
    instructions += `- The user is asking about UniCrypt platform records. Limit your response strictly to internal platform context data. Do not make up outside history.\n`;
  } else if (mode === 'EXTERNAL') {
    instructions += `- The user is asking a general knowledge question. Do not reference platform context or leak student details. Explain general terms clearly.\n`;
  } else {
    instructions += `- The user is asking a hybrid query. Synthesize platform context with general knowledge (e.g. explain what an Apostille is, and advise whether the user's specific verified documents qualify).\n`;
  }

  if (needsWebSearch) {
    instructions += `- This query benefits from live web compliance lookups. Present a simulated synthesis of current regulations from authoritative government or academic sources.\n`;
  }

  return instructions;
}
