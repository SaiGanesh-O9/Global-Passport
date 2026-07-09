/**
 * Vercel Serverless Function: /api/ai
 * Handles secure server-side communications with OpenAI API.
 * Keeps API Key hidden from the client browser.
 */

export default async function handler(req, res) {
  // Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, model = 'gpt-4o-mini' } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages payload' });
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Vercel Serverless Function: Missing OpenAI API Key");
    return res.status(500).json({ error: 'OpenAI API Key is not configured on the server.' });
  }

  let attempts = 0;
  const maxAttempts = 3;
  let lastError = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Serverless AI Call (Attempt ${attempts}/${maxAttempts})...`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages
        })
      });

      const data = await response.json();
      console.log("OpenAI Server Status:", response.status);

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "OpenAI API returned error status");
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error.message);
      lastError = error;
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, attempts * 500));
      }
    }
  }

  return res.status(502).json({ error: `Bad Gateway: ${lastError.message}` });
}
