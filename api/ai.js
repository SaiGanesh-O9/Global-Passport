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
    console.error("Vercel Serverless Function: OpenAI API Key is undefined or empty!");
    return res.status(500).json({ error: 'OpenAI API Key is not configured on the Vercel server. Please set VITE_OPENAI_API_KEY.' });
  } else {
    console.log("Vercel Serverless Function: API Key is present, length:", apiKey.length);
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
      console.log("OpenAI Status:", response.status);
      console.log("OpenAI Raw Response Payload:", JSON.stringify(data));

      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || JSON.stringify(data.error) || "OpenAI API returned error status";
        console.error("OpenAI API Error payload:", errorMsg);
        return res.status(response.status).json({ error: errorMsg });
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
