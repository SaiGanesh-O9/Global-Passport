export async function askAI(message) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are VeriFlash Copilot AI." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();

    return {
      reply: data.choices?.[0]?.message?.content || "No response"
    };

  } catch (err) {
    return {
      reply: "AI temporarily unavailable"
    };
  }
}
