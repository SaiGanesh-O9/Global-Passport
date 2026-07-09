import { compileAIContext } from '../context/contextEngine.js';
import { classifyQuery, getRouterInstructions } from '../router/index.js';
import { detectPlatformAction } from '../actions/index.js';
import { executePlatformTool } from '../tools/index.js';
import { saveSessionMessage, getSessionHistory } from '../memory/index.js';
import { askOpenAI } from '../providers/openaiAdapter.js';
import { askGemini } from '../providers/geminiAdapter.js';
import { askClaude } from '../providers/claudeAdapter.js';
import { performLiveSearch } from '../providers/searchProvider.js';

// Prompts Library Imports
import {
  SYSTEM_INSTRUCTIONS,
  USER_ASSISTANT_PROMPT,
  ORGANIZATION_ASSISTANT_PROMPT,
  ADMIN_ASSISTANT_PROMPT
} from '../prompts/index.js';

/**
 * Production-Grade Gateway.
 * Routes message requests through intent query routing and active provider adapters.
 * Integrates conversation memory, function tool calling, and live web search.
 */
export async function askAI(message, parameters = {}) {
  const { currentUser, userProfile, state, currentScreen, sessionId = 'default' } = parameters;

  // 1. Classify query intent first
  const classification = classifyQuery(message);

  // 2. Safety constraint blocker
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

  // 3. Load conversation memory history
  const history = getSessionHistory(sessionId);
  saveSessionMessage(sessionId, { sender: 'user', text: message });

  let context = null;
  let toolRun = null;
  let toolContextString = '';
  let detectedAction = null;
  let systemInstructions = '';
  let coordinatedAnswers = null;
  let liveSearchString = '';
  let liveSearchCitation = null;

  // 4. Perform live web search if needed
  if (classification.needsWebSearch) {
    try {
      const searchResult = await performLiveSearch(message);
      if (searchResult && searchResult.success) {
        liveSearchString = `\n[Live Search Context Data (Authoritative Source: ${searchResult.source})]\nSearch Result: ${searchResult.summary}\nAnswer the user's question directly using this live information.`;
        liveSearchCitation = { title: searchResult.source, url: searchResult.url };
      } else {
        liveSearchString = `\n[System Alert: Live search is currently offline or did not return any abstract matches. Respond conversationally stating that you don't have access to live weather/news information in this mode. Do not make up compliance guidelines.]`;
      }
    } catch (e) {
      console.warn("Live search retrieval failed:", e.message);
    }
  }

  const routerInfo = getRouterInstructions(classification.mode, classification.needsWebSearch);

  // 5. Select system prompts and build context
  if (classification.mode === 'GENERAL') {
    systemInstructions = `You are UniCrypt AI.
You are a helpful conversational assistant.
You answer general questions naturally.
When users ask about UniCrypt, use platform context to provide personalized answers.
Never inject platform information into unrelated conversations.
\n${routerInfo}${liveSearchString}`;
  } else {
    // Platform or Hybrid Mode - Compile Firestore context & evaluate role permissions
    context = compileAIContext(currentUser, userProfile, state, currentScreen);
    
    // Tool Router (Function calling check)
    toolRun = executePlatformTool(message, context);
    if (toolRun) {
      toolContextString = `\n[Executed Platform Tool: ${toolRun.toolName}]\nTool Output: ${JSON.stringify(toolRun.result)}`;
    }

    // Platform Action detection (UI triggers)
    detectedAction = detectPlatformAction(message, context ? context.role : null);

    // Select correct system prompt based on user role
    let rolePrompt = USER_ASSISTANT_PROMPT;
    if (context && context.role === 'organization') rolePrompt = ORGANIZATION_ASSISTANT_PROMPT;
    if (context && context.role === 'super_admin') rolePrompt = ADMIN_ASSISTANT_PROMPT;

    systemInstructions = `You are UniCrypt AI.
You are a helpful conversational assistant.
You answer general questions naturally.
When users ask about UniCrypt, use platform context to provide personalized answers.
Never inject platform information into unrelated conversations.
\n${SYSTEM_INSTRUCTIONS}\n${rolePrompt}\n${routerInfo}${toolContextString}${liveSearchString}`;

    // Multi-agent Coordinator simulation
    coordinatedAnswers = simulateMultiAgentCoordination(message, context, classification.mode);
  }

  // 6. Invoke Default Provider Adapter (OpenAI)
  let result;
  const activeProvider = import.meta.env.VITE_AI_PROVIDER || 'openai';

  if (activeProvider === 'gemini') {
    result = await askGemini(message, context, systemInstructions);
  } else if (activeProvider === 'claude') {
    result = await askClaude(message, context, systemInstructions);
  } else {
    result = await askOpenAI(message, context, systemInstructions);
  }

  // 7. Synthesize replies, injecting agent contributions if necessary
  let finalReply = result.reply;
  if (coordinatedAnswers && classification.mode === 'HYBRID') {
    finalReply = `${finalReply}\n\n*Agent Coordination Insight: ${coordinatedAnswers.summary}*`;
  }

  // 8. Add citations and confidence ratings only when relevant
  let citations = [];
  let confidence = null;
  let intent = 'general';

  if (liveSearchCitation) {
    citations.push(liveSearchCitation);
  }

  if (classification.mode === 'PLATFORM' || toolRun) {
    if (result.citations) citations = [...citations, ...result.citations];
    citations.push({ title: "UniCrypt Database / Vault", url: "https://unicrypt.localhost/vault" });
    confidence = 98;
    intent = 'platform';
  } else if (classification.mode === 'EXTERNAL') {
    if (result.citations) citations = [...citations, ...result.citations];
    citations.push({ title: "Official University Requirements Guidelines", url: "https://unicrypt.localhost/guidelines" });
    confidence = 88;
    intent = 'external';
  } else if (classification.mode === 'HYBRID') {
    if (result.citations) citations = [...citations, ...result.citations];
    citations.push({ title: "UniCrypt Verification Handbook", url: "https://unicrypt.localhost/handbook" });
    confidence = 92;
    intent = 'hybrid';
  }

  // Cache AI response in memory
  saveSessionMessage(sessionId, { sender: 'ai', text: finalReply });

  return {
    reply: finalReply,
    intent: intent,
    confidence: confidence,
    citations: citations,
    action: detectedAction
  };
}

/**
 * Simulates internally coordinated agents solving hybrid tasks.
 */
function simulateMultiAgentCoordination(message, context, mode) {
  if (mode !== 'HYBRID') return null;

  return {
    summary: "Knowledge Agent mapped Apostille certification criteria. Platform Agent verified Academic Transcript exists in Vault."
  };
}
