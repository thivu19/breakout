import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Database, FileText, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getIncidentAdvice, getAgentDocumentManifest, indexAgentDocument, reconcileAgentIndex } from "@/lib/spacetimedb.functions";
import { actions } from "@/lib/response-agent.js";

type Incident = { key: string; ref: string; title: string; system: string };
type Advice = Awaited<ReturnType<typeof getIncidentAdvice>>;

export function ResponseAgentDialog({ incident, onClose }: { incident: Incident | null; onClose: () => void }) {
  const [question, setQuestion] = useState("What should we investigate first, and which containment steps need approval?");
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexProgress, setIndexProgress] = useState<string | null>(null);
  const review = useServerFn(getIncidentAdvice);
  const manifest = useServerFn(getAgentDocumentManifest);
  const indexDocument = useServerFn(indexAgentDocument);
  const reconcile = useServerFn(reconcileAgentIndex);

  const syncDocuments = async () => {
    if (busy) return;
    setBusy(true); setError(null); setIndexProgress("Reading document list…");
    try {
      const result = await manifest();
      if (!result.canIndex) throw new Error("Only administrators can index workspace documents.");
      let completed = 0;
      for (const document of result.documents) {
        setIndexProgress(`Indexing ${completed + 1}/${result.documents.length} · ${document.title}`);
        await indexDocument({ data: { documentId: document.id } });
        completed += 1;
      }
      await reconcile();
      setIndexProgress(`${completed} documents synchronized with Weaviate.`);
    } catch (err) {
      setIndexProgress(null);
      setError(err instanceof Error ? err.message : "Document indexing failed.");
    } finally { setBusy(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!incident || busy) return;
    setBusy(true); setError(null); setAdvice(null);
    try { setAdvice(await review({ data: { incidentId: incident.key, question } })); }
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
          <span className="font-mono text-primary">NVIDIA NEMOTRON · NANO</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="size-3.5" /> Advisory only · No commands sent</span>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="agent-question" className="text-sm font-medium">Investigation question</label>
          <textarea id="agent-question" value={question} onChange={e => setQuestion(e.target.value)} required maxLength={2000} rows={3} className="w-full resize-y rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
          <Button type="submit" variant="signal" disabled={busy || !question.trim()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Send />}{busy ? "Reading workspace…" : "Review incident"}
          </Button>
          <Button type="button" variant="panel" className="ml-2" disabled={busy} onClick={() => void syncDocuments()}><Database /> Index documents</Button>
        </form>
        {indexProgress && <p role="status" className="break-words text-sm text-muted-foreground">{indexProgress}</p>}
        {error && <p role="alert" className="rounded-md border border-danger-border bg-danger-surface p-3 text-sm text-danger">{error}</p>}
        {advice && <section aria-label="Incident advice" className="border-t border-border pt-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{advice.text}</p>
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="text-sm font-medium">Proposed actions · {advice.proposals.length}</h3>
            {advice.proposals.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No tool calls proposed.</p>}
            <ul className="mt-2 divide-y divide-border">{advice.proposals.map((proposal, index) => <li key={`${proposal.tool}-${index}`} className="py-3">
              <p className="flex flex-wrap justify-between gap-2 font-mono text-xs"><span>{proposal.tool}</span><span className="text-muted-foreground">TODO · Not executed</span></p>
              <p className="mt-1 break-words text-sm">{proposal.reason}</p>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">{JSON.stringify(proposal.arguments, null, 2)}</pre>
              <p className="mt-1 text-xs text-muted-foreground">{proposal.approval === "required" ? "Human approval required" : "Read / verify"}{proposal.requires.length > 0 ? ` · After ${proposal.requires.join(", ")}` : ""}</p>
            </li>)}</ul>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-muted-foreground" /> Workspace sources · {advice.documents.length}</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{advice.documents.map(doc => <li key={doc.id}>{doc.category} · {doc.title}<p className="break-all font-mono text-xs text-subtle">{doc.id}</p></li>)}</ul>
            <p className="mt-2 break-words font-mono text-xs text-subtle">Weaviate · Top 2 → SpacetimeDB · {new Date(advice.generatedAt).toISOString().slice(11, 19)} UTC</p>
            <p className="mt-1 break-all font-mono text-xs text-subtle">{advice.model}</p>
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