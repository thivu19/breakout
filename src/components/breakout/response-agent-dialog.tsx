import { useState, type FormEvent } from "react";
import { Bot, FileText, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getIncidentAdvice } from "@/lib/spacetimedb.functions";
import { actions } from "@/lib/response-agent.js";

type Incident = { key: string; ref: string; title: string; system: string };
type Advice = Awaited<ReturnType<typeof getIncidentAdvice>>;

export function ResponseAgentDialog({ incident, onClose }: { incident: Incident | null; onClose: () => void }) {
  const [question, setQuestion] = useState("What should we investigate first, and which containment steps need approval?");
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!incident || busy) return;
    setBusy(true); setError(null); setAdvice(null);
    try { setAdvice(await getIncidentAdvice({ data: { incidentId: incident.key, question } })); }
    catch (err) { setError(err instanceof Error ? err.message : "The response adviser is unavailable."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={Boolean(incident)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="size-5 text-primary" /> Incident response</DialogTitle>
          <DialogDescription>{incident?.ref} · {incident?.title} · {incident?.system}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-3 text-xs">
          <span className="font-mono text-primary">{advice?.provider === "nemotron" ? "NVIDIA NEMOTRON" : advice?.provider === "ollama" ? `OLLAMA · ${advice.model}` : "OLLAMA PLACEHOLDER"}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="size-3.5" /> Advisory only · No commands sent</span>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="agent-question" className="text-sm font-medium">Investigation question</label>
          <textarea id="agent-question" value={question} onChange={e => setQuestion(e.target.value)} required maxLength={2000} rows={3} className="w-full resize-y rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
          <Button type="submit" variant="signal" disabled={busy || !question.trim()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Send />}{busy ? "Reading workspace…" : "Review incident"}
          </Button>
        </form>
        {error && <p role="alert" className="rounded-md border border-danger-border bg-danger-surface p-3 text-sm text-danger">{error}</p>}
        {advice && <section aria-label="Incident advice" className="border-t border-border pt-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{advice.text}</p>
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-muted-foreground" /> Workspace sources · {advice.documents.length}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{advice.documents.map(doc => <li key={doc.id}>{doc.category} · {doc.title}</li>)}</ul>
            <p className="mt-2 font-mono text-xs text-subtle">SpacetimeDB · Text matching · {new Date(advice.generatedAt).toISOString().slice(11, 19)} UTC</p>
          </div>
        </section>}
        <details className="border-t border-border pt-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">Response actions · Execution unavailable</summary>
          <ul className="mt-3 divide-y divide-border">{Object.entries(actions).map(([name, action]) => <li key={name} className="py-2">
            <div className="flex flex-wrap justify-between gap-2"><span className="font-mono text-xs">{name}</span><span className="text-xs text-muted-foreground">{action.approval === "required" ? "Human approval required" : "Read / verify"}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">{action.description}{action.requires.length > 0 && ` After: ${action.requires.join(", ")}.`}</p>
          </li>)}</ul>
        </details>
      </DialogContent>
    </Dialog>
  );
}