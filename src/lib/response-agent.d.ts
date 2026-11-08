export type AgentAction = "request_logs" | "request_playbook" | "request_legal" | "isolate_website" | "quarantine_files" | "kill_process" | "restore_backup_snapshot" | "verify_system";
export interface AgentIncident { id: string; description: string; system: string; status: string }
export interface AgentDocument { id: string; title: string; category: string; content: string }
export const actions: Record<AgentAction, { description: string; approval: "auto" | "required"; requires: AgentAction[]; inputs: Record<string, unknown> }>;
export const agentSystemPrompt: string;
export function checkAction(name: string, completed?: string[], approved?: boolean): { allowed: boolean; reason: string | null };
export function matchDocuments(documents: AgentDocument[], query: string): AgentDocument[];
export function placeholderReply(incident: AgentIncident, documents: AgentDocument[]): string;