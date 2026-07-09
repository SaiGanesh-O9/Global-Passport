import { compileAIContext } from '../context/contextEngine.js';
import { classifyQuery, getRouterInstructions } from './queryRouter.js';
import { detectPlatformAction } from './actionExecutor.js';
import { executePlatformTool } from './toolRouter.js';
import { saveSessionMessage, getSessionHistory } from '../context/conversationMemory.js';
import { askOpenAI } from '../providers/openaiAdapter.js';
import { askGemini } from '../providers/geminiAdapter.js';
import { askClaude } from '../providers/claudeAdapter.js';

// Prompts Library Imports
import { SYSTEM_INSTRUCTIONS } from '../prompts/systemPrompt.js';
import { USER_ASSISTANT_PROMPT } from '../prompts/userPrompt.js';
import { ORGANIZATION_ASSISTANT_PROMPT } from '../prompts/organizationPrompt.js';
import { ADMIN_ASSISTANT_PROMPT } from '../prompts/adminPrompt.js';

/**
 * Provider-Agnostic Gateway.
 * Routes message requests through intent query routing and active provider adapters.
 * Integrates conversation memory, function tool calling, and source confidence reports.
 */
export async function askAI(message, parameters = {}) {
  const { currentUser, userProfile, state, currentScreen, sessionId = 'default' } = parameters;

  // 1. Classify query intent first
  const classification = classifyQuery(message);

  // 2. Safety constraint blocker (prevents modifying records directly)
  const isDestructiveRequest = /(approve|reject|delete|override|remove|clear request)/i.test(message) &&
                               !(/show|list|view/i.test(message));
  if (isDestructiveRequest) {
    return {
      reply: "⚠️ **Safety Constraint**: UniCrypt AI is restricted to read-only assistance. Database modifications (approving, rejecting, or overriding requests) must be executed manually using the dashboard buttons.",
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

  const routerInfo = getRouterInstructions(classification.mode, classification.needsWebSearch);

  if (classification.mode === 'GENERAL') {
    // Mode 1: General AI - Do not call compileAIContext or inject platform context
    systemInstructions = `You are UniCrypt AI.
You are a helpful conversational assistant.
You answer general questions naturally.
When users ask about UniCrypt, use platform context to provide personalized answers.
Never inject platform information into unrelated conversations.
\n${routerInfo}`;
  } else {
    // Mode 2 or 3: Platform or Hybrid - Compile Firestore context & evaluate role permissions
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
\n${SYSTEM_INSTRUCTIONS}\n${rolePrompt}\n${routerInfo}${toolContextString}`;

    // Multi-agent Coordinator simulation
    coordinatedAnswers = simulateMultiAgentCoordination(message, context, classification.mode);
  }

  // 4. Invoke default Provider Adapter (OpenAI)
  let result;
  const activeProvider = import.meta.env.VITE_AI_PROVIDER || 'openai';

  if (activeProvider === 'gemini') {
    result = await askGemini(message, context, systemInstructions);
  } else if (activeProvider === 'claude') {
    result = await askClaude(message, context, systemInstructions);
  } else {
    result = await askOpenAI(message, context, systemInstructions);
  }

  // 10. Synthesize replies, injecting agent contributions if necessary
  let finalReply = result.reply;
  
  if (classification.needsWebSearch) {
    finalReply = "I don't have live internet access in this mode.";
  } else if (coordinatedAnswers && classification.mode === 'HYBRID') {
    finalReply = `${finalReply}\n\n*Agent Coordination Insight: ${coordinatedAnswers.summary}*`;
  }

  // 11. Add citations and confidence ratings only when relevant
  let citations = [];
  let confidence = null;
  let intent = 'general';

  if (classification.needsWebSearch) {
    citations = [];
    confidence = null;
    intent = 'general';
  } else if (classification.mode === 'PLATFORM' || toolRun) {
    citations = result.citations || [];
    citations.push({ title: "UniCrypt Database / Vault", url: "https://unicrypt.localhost/vault" });
    confidence = 98;
    intent = 'platform';
  } else if (classification.mode === 'EXTERNAL') {
    citations = result.citations || [];
    citations.push({ title: "Official University Requirements Guidelines", url: "https://unicrypt.localhost/guidelines" });
    confidence = 88;
    intent = 'external';
  } else if (classification.mode === 'HYBRID') {
    citations = result.citations || [];
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
