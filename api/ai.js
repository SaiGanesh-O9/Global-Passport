import { classifyQuery, getRouterInstructions } from './ai/router.js';
import { compileAIContext, serializeContextToMarkdown } from './ai/context.js';
import { executePlatformTool } from './ai/tools.js';
import { getPrunedHistory } from './ai/memory.js';
import { performLiveSearch } from './ai/search.js';
import { getResponseWithFailover } from './ai/providers.js';
import {
  SYSTEM_INSTRUCTIONS,
  studentPrompt,
  organizationPrompt,
  adminPrompt,
  toolPrompt
} from './ai/prompts.js';

/**
 * Main Serverless Gate Function for UniCrypt AI Platform.
 * Executes query routing, context boundaries, live tool lookups, and auto-failovers.
 */
export default async function handler(req, res) {
  // Task 1 Debug Logging
  console.log("=== VERCEL SERVERLESS ENVIRONMENT DEBUG ===");
  console.log("Node version:", process.version);
  console.log("process.cwd():", process.cwd());
  console.log("process.env.AI_PROVIDER:", process.env.AI_PROVIDER);
  console.log("Boolean(process.env.OPENROUTER_API_KEY):", Boolean(process.env.OPENROUTER_API_KEY));
  console.log("Boolean(process.env.GEMINI_API_KEY):", Boolean(process.env.GEMINI_API_KEY));
  console.log("Boolean(process.env.OPENAI_API_KEY):", Boolean(process.env.OPENAI_API_KEY));
  console.log("=========================================");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    message,
    history = [],
    currentUser = null,
    userProfile = null,
    state = null,
    currentScreen = '#dashboard',
    settings = {}
  } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing user message prompt' });
  }

  // 1. Run intent detection
  const classification = classifyQuery(message);

  let context = null;
  let toolRun = null;
  let toolContextString = '';
  let systemPrompt = SYSTEM_INSTRUCTIONS;
  let liveSearchString = '';
  let liveSearchCitation = null;

  // 2. Fetch live weather or news search if toggle is enabled & matches mode
  const isLiveSearchEnabled = settings.liveSearch !== false; // default true
  if (isLiveSearchEnabled && classification.needsWebSearch) {
    try {
      const searchResult = await performLiveSearch(message);
      if (searchResult && searchResult.success) {
        liveSearchString = `\n[Live Search Context Data (Source: ${searchResult.source})]\nSearch Result: ${searchResult.summary}\nAnswer utilizing this live data.`;
        liveSearchCitation = { title: searchResult.source, url: searchResult.url };
      } else {
        liveSearchString = `\n[Live weather/news search is currently unavailable. State clearly that current live information could not be retrieved.]`;
      }
    } catch (e) {
      console.warn("Live search retrieval failed:", e.message);
    }
  }

  // 3. Assemble prompt context based on Intent Mode
  const isPlatformContextEnabled = settings.platformContext !== 'Disabled'; // default Automatic/Always Ask/Automatic
  const shouldCompileContext = isPlatformContextEnabled && (classification.mode === 'PLATFORM' || classification.mode === 'HYBRID');

  if (shouldCompileContext) {
    // Compile and filter based on strict role authorization boundaries
    context = compileAIContext(currentUser, userProfile, state, currentScreen);
    
    // Evaluate tools
    toolRun = executePlatformTool(message, context);
    if (toolRun) {
      toolContextString = `\n[Executed Platform Tool: ${toolRun.toolName}]\nTool Output: ${JSON.stringify(toolRun.result)}`;
    }

    // Role prompt determination
    let roleInstructions = studentPrompt;
    if (context) {
      if (context.role === 'organization') roleInstructions = organizationPrompt;
      if (context.role === 'super_admin') roleInstructions = adminPrompt;
    }

    const serialized = context ? serializeContextToMarkdown(context) : '';
    const routerInfo = getRouterInstructions(classification.mode, classification.needsWebSearch);

    systemPrompt = `${SYSTEM_INSTRUCTIONS}
${roleInstructions}
${routerInfo}
${toolPrompt}
=== PLATFORM CONTEXT DATA ===
${serialized}
${toolContextString}
${liveSearchString}`;
  } else {
    // General or Live Mode - Bypass context compilation to protect resources & privacy
    const routerInfo = getRouterInstructions(classification.mode, classification.needsWebSearch);
    systemPrompt = `${SYSTEM_INSTRUCTIONS}
${routerInfo}
${liveSearchString}`;
  }

  // 4. Memory History Integration
  const isMemoryEnabled = settings.conversationMemory !== false; // default true
  const prunedHistory = isMemoryEnabled ? getPrunedHistory(history) : [];

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...prunedHistory,
    { role: 'user', content: message }
  ];

  // 5. Query LLM via Provider Failover Manager
  const providerPref = settings.defaultProvider || 'auto';
  const modelPref = settings.defaultModel || '';
  const stylePref = settings.responseStyle || 'balanced';

  const result = await getResponseWithFailover(messagesPayload, providerPref, modelPref, stylePref);

  // 6. Synthesize reply and citations
  let citations = [];
  if (liveSearchCitation) citations.push(liveSearchCitation);

  // Expose sources only if internal platform details were used
  if (shouldCompileContext && context) {
    citations.push({ title: "UniCrypt Database / Vault", url: "https://unicrypt.localhost/vault" });
  }

  // Response Formatter
  return res.status(200).json({
    success: result.success,
    reply: result.reply,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    latency: result.latency,
    citations: citations,
    confidence: result.confidence,
    intent: classification.mode,
    failoverLogs: result.failoverLogs,
    debug: {
      nodeVersion: process.version,
      cwd: process.cwd(),
      env: {
        AI_PROVIDER: process.env.AI_PROVIDER || null,
        HAS_OPENROUTER_KEY: Boolean(process.env.OPENROUTER_API_KEY),
        HAS_GEMINI_KEY: Boolean(process.env.GEMINI_API_KEY),
        HAS_OPENAI_KEY: Boolean(process.env.OPENAI_API_KEY)
      }
    }
  });
}
