import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, Play, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeRemediation } from "@/lib/spacetimedb.functions";

export const RUNNER_TOOLS = ["isolate_website", "quarantine_files", "kill_process", "restore_backup_snapshot", "verify_system"] as const;
export type RunnerTool = (typeof RUNNER_TOOLS)[number];
type Result = Awaited<ReturnType<typeof executeRemediation>>;

const defaults: Record<RunnerTool, string> = {
  isolate_website: '{ "target": "infected-client" }',
  quarantine_files: '{ "paths": ["/tmp/malware.sh"] }',
  kill_process: '{ "pid": 1234 }',
  restore_backup_snapshot: '{ "target": "infected-client" }',
  verify_system: '{ "target": "infected-client" }',
};

export const isRunnerTool = (tool: string): tool is RunnerTool => (RUNNER_TOOLS as readonly string[]).includes(tool);

function ResultView({ result, error }: { result: Result | null; error: string | null }) {
  if (error) return <p role="alert" className="mt-2 rounded-md border border-danger-border bg-danger-surface p-2 text-xs text-danger">{error}</p>;
  if (!result) return null;
  return (
    <pre className="mt-2 whitespace-pre-wrap break-all rounded-md border border-border bg-secondary p-2 font-mono text-xs">
      <span className={result.status === "success" ? "text-primary" : "text-danger"}>$ {result.tool} → {result.status}</span>
      {result.stdout && `\n${result.stdout}`}{result.stderr && `\n[stderr] ${result.stderr}`}
    </pre>
  );
}

export function RunActionButton({ tool, args }: { tool: RunnerTool; args: Record<string, unknown> }) {
  const run = useServerFn(executeRemediation);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    if (!window.confirm(`Approve and run ${tool} on the client container?`)) return;
    setBusy(true); setError(null); setResult(null);
    try { setResult(await run({ data: { tool, arguments: args } })); }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-2">
      <Button type="button" size="sm" variant="signal" disabled={busy} onClick={() => void go()}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Play />} Approve & run
      </Button>
      <ResultView result={result} error={error} />
    </div>
  );
}

export function ManualRunner() {
  const [tool, setTool] = useState<RunnerTool>("verify_system");
  const [raw, setRaw] = useState(defaults.verify_system);
  let parsed: Record<string, unknown> | null = null;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  return (
    <details className="border-t border-border pt-3 text-sm" open>
      <summary className="flex cursor-pointer items-center gap-2 font-medium"><TerminalSquare className="size-4 text-primary" /> Client container · Run an action</summary>
      <div className="mt-3 space-y-2">
        <select aria-label="Action" value={tool} onChange={e => { const t = e.target.value as RunnerTool; setTool(t); setRaw(defaults[t]); }} className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground">
          {RUNNER_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea aria-label="Action arguments" value={raw} onChange={e => setRaw(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground" />
        {parsed ? <RunActionButton key={tool + raw} tool={tool} args={parsed} /> : <p className="text-xs text-danger">Arguments must be valid JSON.</p>}
      </div>
    </details>
  );
}
