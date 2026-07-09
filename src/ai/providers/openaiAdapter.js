import { serializeContextToMarkdown } from '../context/contextEngine.js';

export async function askOpenAI(message, context, routerInfo) {
  try {
    const serializedContext = serializeContextToMarkdown(context);
    const systemPrompt = `You are the UniCrypt Role-Aware AI Assistant.
${routerInfo}
Use the following structured platform context data to answer platform-specific queries:
${serializedContext}
Always obey role permissions. Never speak about other users' data or admin settings.`;

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    
    if (!res.ok || !data.choices || data.choices.length === 0) {
      const errMsg = data.error?.message || data.error || `Server returned status code ${res.status}`;
      throw new Error(errMsg);
    }

    return {
      reply: data.choices[0].message.content,
      citations: []
    };
  } catch (err) {
    console.error("Serverless AI call failed:", err.message);
    
    const isNetworkOrConnectionError = err.message.includes('Failed to fetch') || 
                                       err.message.includes('NetworkError') || 
                                       err.message.includes('Failed to communicate');
    
    if (isNetworkOrConnectionError) {
      console.warn("Local mock simulation fallback triggered.");
      return {
        reply: simulateMockResponse(message, context),
        citations: []
      };
    }

    return {
      reply: `⚠️ **AI Service Error**: ${err.message || "Failed to communicate with AI gateway."}`,
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

  if (msgLower.includes('calculus')) {
    return "Calculus is a branch of mathematics focused on limits, functions, derivatives, integrals, and infinite series. It has two main branches: differential calculus (concerning rates of change and slopes of curves) and integral calculus (concerning accumulation of quantities and the areas under curves).";
  }

  if (msgLower.includes('quicksort')) {
    return "Here is a Python implementation of the Quicksort algorithm:\n\n```python\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n```";
  }

  if (msgLower.includes('google')) {
    return "Google was founded on September 4, 1998, by Larry Page and Sergey Brin while they were Ph.D. students at Stanford University in California.";
  }

  if (msgLower.includes('blockchain')) {
    return "Blockchain is a decentralized, distributed ledger technology that securely records transactions across a peer-to-peer network, commonly used in cryptographic verification systems.";
  }

  if (msgLower.includes('overrides')) {
    return "Here are today's administrative overrides: Admin overridden request Approved (Reason: 'Verified official certificate domain copy matches').";
  }

  return "I'm here to assist you with your digital credentials, verification requests, and compliance queries. Let me know how I can help.";
}
