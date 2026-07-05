export async function askAI(message, context = {}) {
  return {
    reply: `🟢 DEMO MODE ACTIVE

You asked: "${message}"

Status: System is running in safe demo mode
All core modules: stable
AI module: temporarily simulated for presentation`
  };
}
