import type { AgentIncident, AgentDocument } from "./response-agent.js";
export function generateResponse(input: {
  incident: AgentIncident; documents: AgentDocument[]; question: string;
  config: { endpoint?: string; provider: "ollama" | "nemotron"; model?: string; apiKey?: string };
}): Promise<{ provider: string; model: string | null; text: string }>;