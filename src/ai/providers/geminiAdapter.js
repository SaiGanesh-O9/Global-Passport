import { serializeContextToMarkdown } from '../context/contextEngine.js';

export async function askGemini(message, context, routerInfo) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;

  if (!apiKey) {
    return {
      reply: "Google Gemini Local Simulation: Accessing credentials verification contexts safely.",
      citations: []
    };
  }

  try {
    const serializedContext = serializeContextToMarkdown(context);
    const systemPrompt = `You are Google Gemini UniCrypt Assistant.
${routerInfo}
Context:
${serializedContext}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${systemPrompt}\nUser Query: ${message}` }] }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok || !data.candidates || data.candidates.length === 0) {
      throw new Error(data.error?.message || "Gemini API returned error status or empty candidates.");
    }
    return {
      reply: data.candidates[0].content.parts[0].text,
      citations: []
    };
  } catch (err) {
    return {
      reply: "Gemini fallback simulator: " + err.message,
      citations: []
    };
  }
}
