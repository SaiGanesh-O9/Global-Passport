export async function askAI(message) {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API Key");
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are UniCrypt Copilot AI." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    console.log("OpenAI Status:", res.status);
    console.log("OpenAI Response:", data);

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || "OpenAI API returned error status";
      console.error("OpenAI Error Payload:", errMsg);
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
