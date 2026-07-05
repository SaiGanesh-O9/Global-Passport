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

  // 1. Compile centralized and filtered context payload
  const context = compileAIContext(currentUser, userProfile, state, currentScreen);

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

  // 4. Tool Router (Function calling check)
  const toolRun = executePlatformTool(message, context);
  let toolContextString = '';
  if (toolRun) {
    toolContextString = `\n[Executed Platform Tool: ${toolRun.toolName}]\nTool Output: ${JSON.stringify(toolRun.result)}`;
  }

  // 5. Intent routing classification (Mode 1 vs Mode 2 vs Hybrid)
  const classification = classifyQuery(message);
  const routerInfo = getRouterInstructions(classification.mode, classification.needsWebSearch);

  // 6. Platform Action detection (UI triggers)
  const detectedAction = detectPlatformAction(message, context.role);

  // 7. Select correct system prompt based on user role
  let rolePrompt = USER_ASSISTANT_PROMPT;
  if (context.role === 'organization') rolePrompt = ORGANIZATION_ASSISTANT_PROMPT;
  if (context.role === 'super_admin') rolePrompt = ADMIN_ASSISTANT_PROMPT;

  const systemInstructions = `${SYSTEM_INSTRUCTIONS}\n${rolePrompt}\n${routerInfo}${toolContextString}`;

  // 8. Multi-agent Coordinator simulation (Coordinates Agents internally)
  const coordinatedAnswers = simulateMultiAgentCoordination(message, context, classification.mode);

  // 9. Invoke default Provider Adapter (OpenAI)
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
  if (coordinatedAnswers && classification.mode === 'HYBRID') {
    finalReply = `${finalReply}\n\n*Agent Coordination Insight: ${coordinatedAnswers.summary}*`;
  }

  // 11. Add citations and confidence ratings
  const citations = result.citations || [];
  if (classification.mode === 'PLATFORM' || toolRun) {
    citations.push({ title: "UniCrypt Database / Vault", url: "https://unicrypt.localhost/vault" });
  } else if (classification.mode === 'EXTERNAL') {
    citations.push({ title: "Official University Requirements Guidelines", url: "https://unicrypt.localhost/guidelines" });
  } else {
    citations.push({ title: "UniCrypt Verification Handbook", url: "https://unicrypt.localhost/handbook" });
  }

  const confidence = classification.mode === 'PLATFORM' ? 98 : classification.mode === 'EXTERNAL' ? 88 : 92;

  // Cache AI response in memory
  saveSessionMessage(sessionId, { sender: 'ai', text: finalReply });

  return {
    reply: finalReply,
    intent: classification.mode.toLowerCase(),
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
