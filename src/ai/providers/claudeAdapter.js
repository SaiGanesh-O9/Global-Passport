import { serializeContextToMarkdown } from '../context/contextEngine.js';

export async function askClaude(message, context, routerInfo) {
  const apiKey = import.meta.env.VITE_CLAUDE_KEY;

  if (!apiKey) {
    return {
      reply: "Anthropic Claude Local Simulation: Processing credentials metadata context fields.",
      citations: []
    };
  }

  try {
    const serializedContext = serializeContextToMarkdown(context);
    const systemPrompt = `You are Anthropic Claude UniCrypt Assistant.
${routerInfo}
Context:
${serializedContext}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await res.json();
    return {
      reply: data.content?.[0]?.text || "Claude returned empty message.",
      citations: []
    };
  } catch (err) {
    return {
      reply: "Claude fallback simulator: " + err.message,
      citations: []
    };
  }
}
