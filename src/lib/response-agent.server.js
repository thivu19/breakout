import { agentSystemPrompt, placeholderReply } from "./response-agent.js";

// Fetch-based OpenAI-compatible adapter: Ollama now, NVIDIA Nemotron later.
// Configuration is passed from the authenticated server handler, never read here.
export async function generateResponse({ incident, documents, question, config }) {
  if (!config.endpoint) return { provider: "placeholder", model: null, text: placeholderReply(incident, documents) };
  const url = new URL(config.endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("The model service requires a secured HTTPS endpoint.");
  }
  if (config.provider === "nemotron" && (!config.apiKey || !config.model)) {
    throw new Error("NVIDIA Nemotron requires a model name and a securely configured API key.");
  }
  const model = config.model || "qwen3:8b";
  let response;
  try {
    response = await fetch(`${url.toString().replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
      body: JSON.stringify({ model, temperature: 0, stream: false, messages: [
        { role: "system", content: agentSystemPrompt },
        { role: "user", content: JSON.stringify({ incident, documents, question }) },
      ] }),
      signal: AbortSignal.timeout(45000),
      redirect: "error",
    });
  } catch {
    throw new Error("The model service could not be reached. No response actions were executed.");
  }
  if (!response.ok) throw new Error("The model service rejected the request. Check its secure configuration.");
  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("The model service returned no advice.");
  return { provider: config.provider, model, text: text.slice(0, 16000) };
}