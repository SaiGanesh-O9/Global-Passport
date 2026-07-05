import { serializeContextToMarkdown } from '../context/contextEngine.js';

export async function askOpenAI(message, context, routerInfo) {
  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  if (!apiKey) {
    return {
      reply: simulateMockResponse(message, context),
      citations: [
        { title: "UniCrypt Local Core", url: "https://unicrypt.localhost" }
      ]
    };
  }

  try {
    const serializedContext = serializeContextToMarkdown(context);
    const systemPrompt = `You are the UniCrypt Role-Aware AI Assistant.
${routerInfo}
Use the following structured platform context data to answer platform-specific queries:
${serializedContext}
Always obey role permissions. Never speak about other users' data or admin settings.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    
    if (!res.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || "OpenAI API returned error status or empty choices.");
    }

    return {
      reply: data.choices[0].message.content,
      citations: []
    };
  } catch (err) {
    console.warn("OpenAI API call failed, falling back to local simulation:", err.message);
    return {
      reply: simulateMockResponse(message, context),
      citations: []
    };
  }
}

function simulateMockResponse(message, context) {
  const msgLower = message.toLowerCase();

  if (msgLower.includes('missing') || msgLower.includes('abc university')) {
    const missing = context.verificationRequests.length === 0 
      ? "Degree Certificate, Academic Transcript"
      : context.verificationRequests.map(r => 
          (r.checklist || []).filter(c => c.status !== 'Approved').map(c => c.type).join(', ')
        ).join(', ');
    return `Looking at your checklist requirements, you are currently missing: **${missing || 'None. All documents are satisfied!'}**. You can start an upload directly.`;
  }

  if (msgLower.includes('passport') || msgLower.includes('reuse')) {
    const hasPassport = context.credentials.some(c => c.type === 'Passport' && c.status === 'Approved');
    return hasPassport
      ? "Yes! Your **Passport** is verified in your vault. Future institution templates requiring a Passport will automatically reuse it."
      : "You do not have a verified Passport in your vault yet. Please upload it to enable reuse.";
  }

  if (msgLower.includes('pending') || msgLower.includes('summarize')) {
    if (context.role === 'organization') {
      const count = context.verificationRequests.length;
      return `You have **${count} pending request(s)** awaiting review. John Doe's transcript is submitted and looks consistent.`;
    }
  }

  if (msgLower.includes('blockchain')) {
    return "Blockchain is a decentralized, distributed ledger technology that securely records transactions across a peer-to-peer network, commonly used in cryptographic verification systems.";
  }

  if (msgLower.includes('overrides')) {
    return "Here are today's administrative overrides: Admin overridden request Approved (Reason: 'Verified official certificate domain copy matches').";
  }

  return `Hello! I am the UniCrypt ${context.role.replace('_', ' ')} AI Assistant. Let me know how I can help you with your digital credentials or compliance search queries.`;
}
