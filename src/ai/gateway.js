export async function askAI(message) {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are UniCrypt Copilot AI." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    console.log("Local Serverless Route Status:", res.status);
    console.log("Local Serverless Route Response:", data);

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || data.error || "API returned error status";
      console.error("Local Serverless Route Error:", errMsg);
      throw new Error(errMsg);
    }

    return {
      reply: data.choices?.[0]?.message?.content || "No response"
    };

  } catch (err) {
    console.error("AI gateway request failed:", err);
    return {
      reply: err.message || "AI temporarily unavailable"
    };
  }
}
