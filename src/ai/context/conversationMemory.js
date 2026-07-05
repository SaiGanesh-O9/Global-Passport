/**
 * Memory Layer for UniCrypt AI Copilot sessions.
 * Maintains conversation history, token pruning, and summarizing context features.
 */

// Memory store map keyed by session or userID
const sessionMemoryStore = new Map();

export function getSessionHistory(sessionId = 'default') {
  if (!sessionMemoryStore.has(sessionId)) {
    sessionMemoryStore.set(sessionId, []);
  }
  return sessionMemoryStore.get(sessionId);
}

export function saveSessionMessage(sessionId = 'default', messageObject) {
  const history = getSessionHistory(sessionId);
  history.push({
    ...messageObject,
    timestamp: new Date().toISOString()
  });

  // Limit checks (prune/summarize history beyond 10 user exchanges)
  if (history.length > 20) {
    const summarizedLog = summarizeHistory(history.slice(0, 10));
    const recentHistory = history.slice(10);
    sessionMemoryStore.set(sessionId, [
      { sender: 'ai', text: `[System Memory Summary]: ${summarizedLog}`, timestamp: new Date().toISOString() },
      ...recentHistory
    ]);
  } else {
    sessionMemoryStore.set(sessionId, history);
  }
}

export function clearSessionMemory(sessionId = 'default') {
  sessionMemoryStore.set(sessionId, []);
}

/**
 * Summarizes the messages list to stay within context windows.
 */
function summarizeHistory(messages) {
  const userPrompts = messages.filter(m => m.sender === 'user').map(m => m.text);
  return `User previously inquired about: "${userPrompts.join(', ')}".`;
}
