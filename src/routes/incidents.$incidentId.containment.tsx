import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Info,
  Lock,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { AppShell, CountChip, Panel } from "@/components/breakout/app-shell";
import { Pill } from "@/components/breakout/badges";
import { Button } from "@/components/ui/button";
import { containment, incidents } from "@/lib/breakout-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidents/$incidentId/containment")({
  loader: ({ params }) => {
    const incident = incidents.find((i) => i.id === params.incidentId);
    if (!incident || incident.id !== containment.incidentId) throw notFound();
    return { incident };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Containment review · ${params.incidentId} — Breakout` },
      { name: "description", content: "Review and approve a containment request, check preflight results, and resolve blockers." },
      { property: "og:title", content: `Containment review · ${params.incidentId} — Breakout` },
      { property: "og:description", content: "Review and approve a containment request, check preflight results, and resolve blockers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="eyebrow text-subtle">No containment request</p>
      <h1 className="text-3xl">There is no open containment review for this incident.</h1>
      <Link to="/command-center" className="text-primary hover:underline">
        Back to Command center
      </Link>
    </div>
  ),
  component: ContainmentReview,
});

type Level = "AUDIT" | "INFO" | "ERROR" | "WARN";
type Filter = "all" | "ERROR" | "WARN";

const levelTone: Record<Level, string> = {
  AUDIT: "text-subtle",
  INFO: "text-subtle",
  ERROR: "text-danger",
  WARN: "text-warning",
};

const nowUtc = () => new Date().toISOString().slice(11, 19);

function ContainmentReview() {
  const { incident } = Route.useLoaderData();
  const [events, setEvents] = useState(containment.events);
  const [filter, setFilter] = useState<Filter>("all");
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState("09:56:03");
  const [decision, setDecision] = useState<"pending" | "rejected" | "changes">("pending");

  const errors = events.filter((e) => e.level === "ERROR").length;
  const warnings = events.filter((e) => e.level === "WARN").length;
  const visible = filter === "all" ? events : events.filter((e) => e.level === filter);

  const rerunPreflight = () => {
    setChecking(true);
    setTimeout(() => {
      const t = nowUtc();
      setEvents((ev) => [
        ...ev,
        { time: t, level: "INFO", title: "Preflight rerun · no execution", detail: "Rechecking connector permissions and host availability." },
        { time: t, level: "ERROR", title: "CrowdStrike permission check failed", detail: "HTTP 403 · Hosts: Write scope still missing on connector token." },
      ]);
      setLastCheck(t);
      setChecking(false);
    }, 1200);
  };

  const decide = (d: "rejected" | "changes") => {
    setDecision(d);
    setEvents((ev) => [
      ...ev,
      {
        time: nowUtc(),
        level: "AUDIT",
        title: d === "rejected" ? "Request rejected by Alex Morgan" : "Changes requested by Alex Morgan",
        detail: d === "rejected" ? "Containment request closed. No commands sent." : "Returned to Sarah Chen for revision.",
      },
    ]);
  };

  const approval =
    decision === "rejected"
      ? { label: "Rejected", tone: "danger" as const }
      : decision === "changes"
        ? { label: "Changes requested", tone: "warning" as const }
        : { label: "Awaiting approval", tone: "warning" as const };

  return (
    <AppShell
      active="command-center"
      breadcrumbs={[{ label: "Command center", to: "/command-center" }, { label: incident.id }, { label: "Containment review" }]}
      footerRight="Every action logged. Every second accounted for."
    >
      <div className="flex items-center justify-between">
        <Link to="/command-center" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Command center
        </Link>
        <p className="eyebrow hidden text-muted-foreground sm:block">Monday, 09 Nov 2026 / Live operations</p>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-normal tracking-tight">Containment review</h1>
            <Pill tone="danger" className="text-xs">Sev 1 / Critical</Pill>
          </div>
          <p className="mt-3 text-lg">
            <span className="mr-3 font-mono text-base text-primary">{incident.id}</span>
            {incident.title}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 text-[0.95rem] text-muted-foreground">
            <span>{incident.source}</span>
            <span className="text-subtle">/</span>
            <span>{incident.status}</span>
            <span className="text-subtle">/</span>
            <span>Owner {incident.owner}</span>
          </p>
        </div>
        <Button variant="panel" size="lg" className="h-12">
          <ArrowUpRight className="text-muted-foreground" /> Open incident
        </Button>
      </div>

      {/* Blocker alert */}
      <div className="mt-7 flex gap-4 rounded-lg border border-danger-border bg-danger-surface px-5 py-5">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">Containment blocked by connector permissions</p>
            <span className="font-mono text-xs text-danger">HTTP 403 · CS_SCOPE_DENIED</span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            CrowdStrike preflight failed: the connector cannot isolate hosts. Restore Hosts: Write permission, then rerun preflight.
          </p>
          <p className="mt-2 text-sm text-danger">
            Approval is still required. No isolation commands have been sent to these 2 endpoints.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {/* Requested containment */}
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-xl font-semibold">Requested containment</h2>
              <CountChip>2 ENDPOINTS</CountChip>
            </div>
            <div className="px-6 pb-5 pt-5">
              <p className="text-lg font-medium">Isolate 2 additional endpoints in Finance</p>
              <p className="mt-1 text-muted-foreground">
                Requested by Sarah Chen at 09:56 UTC. Only the endpoints below are in scope.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="eyebrow border-y border-border text-[0.65rem] text-subtle">
                    <th className="px-6 py-3 font-normal">Endpoint / Address</th>
                    <th className="px-3 py-3 font-normal">Detection / User</th>
                    <th className="px-3 py-3 font-normal">Last seen UTC</th>
                    <th className="px-3 py-3 font-normal">Isolation</th>
                  </tr>
                </thead>
                <tbody>
                  {containment.endpoints.map((e) => (
                    <tr key={e.host} className="border-b border-border">
                      <td className="px-6 py-4">
                        <p className="font-mono">{e.host}</p>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">{e.ip}</p>
                      </td>
                      <td className="px-3 py-4">
                        <p>{e.detection}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{e.user}</p>
                      </td>
                      <td className="px-3 py-4 font-mono text-sm text-muted-foreground tabular">{e.lastSeen}</td>
                      <td className="px-3 py-4">Not isolated</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
              <Info className="size-4" /> 2 of 8 incident endpoints · No changes to the remaining 6 endpoints.
            </p>
          </Panel>

          {/* Event logs */}
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-semibold">Issue & event logs</h2>
                <span className="eyebrow text-subtle">{String(events.length).padStart(2, "0")} events</span>
              </div>
              <Button variant="panel" size="lg">
                <Download className="text-muted-foreground" /> Export logs
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-6 py-5 text-[0.95rem]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn("flex items-center gap-1.5", filter === "all" ? "text-foreground" : "text-muted-foreground")}
              >
                All events <ChevronDown className="size-4" />
              </button>
              <span className="h-4 w-px bg-border" />
              <button
                type="button"
                onClick={() => setFilter(filter === "ERROR" ? "all" : "ERROR")}
                className={cn("text-danger", filter === "ERROR" && "underline underline-offset-4")}
              >
                {errors} {errors === 1 ? "error" : "errors"}
              </button>
              <button
                type="button"
                onClick={() => setFilter(filter === "WARN" ? "all" : "WARN")}
                className={cn("text-warning", filter === "WARN" && "underline underline-offset-4")}
              >
                {warnings} {warnings === 1 ? "warning" : "warnings"}
              </button>
              <span className="eyebrow ml-auto text-[0.65rem] text-subtle">09 Nov 2026 · UTC · Oldest first</span>
            </div>
            <ul>
              {visible.map((e, i) => (
                <li
                  key={`${e.time}-${i}`}
                  className={cn(
                    "grid grid-cols-[6rem_4.5rem_1fr] gap-3 border-t border-border px-6 py-4",
                    e.level === "ERROR" && "bg-danger-surface/70",
                  )}
                >
                  <span className="font-mono text-sm text-subtle tabular">{e.time}</span>
                  <span className={cn("eyebrow pt-0.5 text-[0.65rem]", levelTone[e.level])}>{e.level}</span>
                  <div>
                    <p className={cn("font-medium", e.level === "ERROR" && "text-danger")}>{e.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="eyebrow flex flex-wrap justify-between gap-2 border-t border-border px-6 py-4 text-[0.65rem]">
              <span className="text-subtle">
                Request {containment.requestId} / Trace {containment.trace}
              </span>
              <span className="text-primary">Audit trail preserved</span>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Review & decision */}
          <Panel className="p-6">
            <h2 className="text-xl font-semibold">Review & decision</h2>
            <dl className="mt-5 space-y-4 text-[0.95rem]">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Approval</dt>
                <dd><Pill tone={approval.tone}>{approval.label}</Pill></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Execution</dt>
                <dd><Pill tone="neutral">Not started</Pill></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Preflight</dt>
                <dd><Pill tone="danger">{checking ? "Checking…" : "Failed"}</Pill></dd>
              </div>
            </dl>
            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-[0.95rem]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Requested by</dt>
                <dd>Sarah Chen · 09:56 UTC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reviewer</dt>
                <dd>Alex Morgan · You</dd>
              </div>
            </dl>
            <div className="mt-5 rounded-lg border border-border bg-inset p-5">
              <p className="flex items-center gap-2 font-semibold text-warning">
                <TriangleAlert className="size-4" /> Business impact · High
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                Isolation will interrupt Finance network access and active sessions on both hosts. CrowdStrike
                management traffic stays allowed.
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                Recovery: release isolation after incident-owner validation. Do not reconnect while ransomware activity
                persists.
              </p>
            </div>
            <Button variant="panel" size="xl" className="mt-5 w-full" disabled>
              <Lock /> Approve & isolate 2 endpoints
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Unavailable until preflight passes. Approval will then authorize execution for these 2 hosts only.
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="panel" size="lg" disabled={decision !== "pending"} onClick={() => decide("rejected")}>
                Reject request
              </Button>
              <Button variant="panel" size="lg" disabled={decision !== "pending"} onClick={() => decide("changes")}>
                Ask for changes
              </Button>
            </div>
          </Panel>

          {/* Resolve the blocker */}
          <Panel className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Resolve the blocker</h2>
              <Wrench className="size-5 text-muted-foreground" />
            </div>
            <ol className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
              <li>1. In CrowdStrike, grant Hosts: Write to the Breakout API client and refresh its token.</li>
              <li>2. Recheck permissions. Rerunning preflight does not approve or execute isolation.</li>
            </ol>
            <div className="mt-5 flex gap-3">
              <Button variant="signal" size="lg" className="h-12" onClick={rerunPreflight} disabled={checking}>
                <RefreshCw className={cn(checking && "animate-spin")} />
                {checking ? "Checking…" : "Rerun preflight"}
              </Button>
              <Button variant="panel" size="lg" className="h-12">
                <ArrowUpRight className="text-muted-foreground" /> Integration
              </Button>
            </div>
            <p className="eyebrow mt-5 text-[0.65rem] leading-5 text-subtle">
              CrowdStrike / ACME-PROD
              <br />
              Last check {lastCheck} UTC
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
