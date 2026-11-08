import type { AgentIncident, AgentDocument } from "./response-agent.js";
export function generateResponse(input: {
  incident: AgentIncident; documents: AgentDocument[]; question: string;
  config: { endpoint?: string | undefined; provider: "ollama" | "nemotron"; model?: string | undefined; apiKey?: string | undefined };
}): Promise<{ provider: string; model: string | null; text: string }>;