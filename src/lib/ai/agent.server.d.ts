import type { AgentDocument, AgentIncident } from "../response-agent.js";
export type AgentConfig = { nvidia: { apiKey: string | undefined; model: string; embeddingModel: string }; weaviate: { url: string | undefined; apiKey: string | undefined } };
export function agentConfig(env: Record<string, string | undefined>): AgentConfig;
export function indexDocument(document: AgentDocument, config: AgentConfig): Promise<{ id: string; status: string }>;
export function reconcileIndex(ids: string[], config: AgentConfig): Promise<{ removed: number }>;
export function runAgent(input: { incident: AgentIncident; question: string; loadDocuments: (ids: string[]) => Promise<AgentDocument[]>; config: AgentConfig }): Promise<{
  provider: string; model: string; text: string; documents: { id: string; title: string; category: string }[];
  retrieval: string; execution: string;
  proposals: { tool: string; arguments: Record<string, string | number | string[]>; reason: string; approval: string; requires: string[]; execution: string }[];
}>;