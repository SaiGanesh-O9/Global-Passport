/**
 * Memory Engine Module
 * Prunes and manages token usage of chat history dynamically on the server side.
 */

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

  if (history.length > 20) {
    const userPrompts = history.filter(m => m.sender === 'user').map(m => m.text);
    const summary = `User previously asked about: "${userPrompts.slice(0, 10).join(', ')}".`;
    const recent = history.slice(10);
    sessionMemoryStore.set(sessionId, [
      { sender: 'ai', text: `[System Memory Summary]: ${summary}`, timestamp: new Date().toISOString() },
      ...recent
    ]);
  } else {
    sessionMemoryStore.set(sessionId, history);
  }
}

export function clearSessionMemory(sessionId = 'default') {
  sessionMemoryStore.set(sessionId, []);
}

export function getPrunedHistory(clientHistory = []) {
  if (!clientHistory || clientHistory.length === 0) return [];
  return clientHistory.slice(-10).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));
}
