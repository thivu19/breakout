import { z } from "zod";
import { actions } from "../response-agent.js";

// Five remediation templates from the uploaded Python action catalog.
// TODO: wire a trusted tool service and server-owned approvals before execution.
const pending = (name) => async () => { throw new Error(`${name} is not implemented. No commands were sent.`); };
export const toolTemplates = {
  isolate_website: { execute: pending("isolate_website") },
  quarantine_files: { execute: pending("quarantine_files") },
  kill_process: { execute: pending("kill_process") },
  restore_backup_snapshot: { execute: pending("restore_backup_snapshot") },
  verify_system: { execute: pending("verify_system") },
};

const schemas = {
  request_logs: z.object({ keyword: z.string().min(1), minutes: z.number().int().positive().max(1440) }).strict(),
  request_playbook: z.object({ query: z.string().min(1) }).strict(),
  request_legal: z.object({ query: z.string().min(1) }).strict(),
  isolate_website: z.object({ target: z.string().min(1) }).strict(),
  quarantine_files: z.object({ paths: z.array(z.string().min(1)).min(1).max(100) }).strict(),
  kill_process: z.object({ pid: z.number().int().positive() }).strict(),
  restore_backup_snapshot: z.object({ target: z.string().min(1) }).strict(),
  verify_system: z.object({ target: z.string().min(1) }).strict(),
};

export const toolCatalog = Object.entries(actions).map(([name, action]) => ({
  name, ...action, execution: "TODO", available: false,
}));

export function parsePlan(text) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  let raw;
  try { raw = JSON.parse(cleaned); } catch { throw new Error("Nemotron returned an invalid action plan. No commands were sent."); }
  const parsed = z.object({
    analysis: z.string().min(1).max(16000),
    actions: z.array(z.object({ tool: z.string(), arguments: z.record(z.unknown()), reason: z.string().min(1).max(2000) }).strict()).max(8),
  }).strict().safeParse(raw);
  if (!parsed.success) throw new Error("Nemotron returned an invalid action plan. No commands were sent.");
  const proposals = parsed.data.actions.map(proposal => {
    const schema = schemas[proposal.tool];
    const definition = actions[proposal.tool];
    if (!schema || !definition || !schema.safeParse(proposal.arguments).success) {
      throw new Error("Nemotron proposed an unknown tool or invalid arguments. No commands were sent.");
    }
    return { ...proposal, approval: definition.approval, requires: definition.requires, execution: "TODO" };
  });
  return { text: parsed.data.analysis, proposals };
}