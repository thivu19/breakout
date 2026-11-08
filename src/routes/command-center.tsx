import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Eye,
  ListFilter,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AppShell, Avatar, CountChip, Panel } from "@/components/breakout/app-shell";
import { SeverityBadge, Sparkline, StatusDot, statusDot } from "@/components/breakout/badges";
import { Button } from "@/components/ui/button";
import { activity, incidents, kpis, type ResponseStatus } from "@/lib/breakout-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/command-center")({
  head: () => ({
    meta: [
      { title: "Command center — Breakout" },
      { name: "description", content: "Live response posture, active incidents, and next actions for Acme Security." },
      { property: "og:title", content: "Command center — Breakout" },
      { property: "og:description", content: "Live response posture, active incidents, and next actions for Acme Security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

const activityIcon = {
  shield: <ShieldCheck className="size-4 text-muted-foreground" />,
  approval: <ShieldAlert className="size-4 text-warning" />,
  resolved: <CircleCheck className="size-4 text-success" />,
  monitor: <Eye className="size-4 text-muted-foreground" />,
};

function CommandCenter() {
  const [owner, setOwner] = useState("All responders");
  const owners = useMemo(() => ["All responders", ...new Set(incidents.map((i) => i.owner))], []);
  const rows = owner === "All responders" ? incidents : incidents.filter((i) => i.owner === owner);

  const posture: { status: ResponseStatus; count: number }[] = (
    ["Triage", "Investigating", "Containing", "Monitoring"] as ResponseStatus[]
  ).map((status) => ({ status, count: incidents.filter((i) => i.status === status).length }));

  return (
    <AppShell
      active="command-center"
      breadcrumbs={[{ label: "Workspace" }, { label: "Command center" }]}
      footerRight="Every action logged. Every second accounted for."
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">Monday, 09 Nov 2026 / Live operations</p>
          <h1 className="mt-3 text-4xl font-normal tracking-tight">Command center</h1>
          <p className="mt-2 text-muted-foreground">Your response posture, active incidents, and next actions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="panel" size="lg" className="h-12">
            <CalendarDays className="text-muted-foreground" />
            Today · UTC
          </Button>
          <Button variant="signal" size="lg" className="h-12">
            <Plus />
            Declare incident
          </Button>
        </div>
      </div>

      {/* Approval alert */}
      <div className="mt-7 flex flex-wrap items-center gap-4 rounded-lg border border-danger-border bg-danger-surface px-5 py-4">
        <ShieldAlert className="size-5 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Containment approval required</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            INC-1042 · Isolate 2 additional endpoints in Finance. Requested by Sarah Chen at 09:56 UTC.
          </p>
        </div>
        <span className="eyebrow text-danger">Sev 1 / Critical</span>
        <Button variant="alert" size="lg" asChild>
          <Link to="/incidents/$incidentId/containment" params={{ incidentId: "INC-1042" }}>
            <ArrowRight />
            Review action
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Panel key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-[0.95rem] text-muted-foreground">{k.label}</p>
              <ArrowUpRight className="size-4 text-subtle" />
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-4xl font-normal tracking-tight tabular">{k.value}</p>
              <Sparkline points={k.trend} tone={i === 0 ? "danger" : "foreground"} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className={cn("mr-2 font-mono", k.tone === "danger" ? "text-danger" : "text-success")}>
                {k.delta}
              </span>
              {k.deltaNote}
            </p>
          </Panel>
        ))}
      </div>

      {/* Incidents table */}
      <Panel className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-6 py-5">
          <h2 className="text-xl font-semibold">Active incidents</h2>
          <CountChip>05</CountChip>
          <span className="eyebrow text-subtle">1 critical / 2 high / 2 medium</span>
          <div className="ml-auto flex gap-3">
            <label className="relative">
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="h-10 appearance-none rounded-md border border-border bg-secondary pl-9 pr-4 text-sm font-semibold text-foreground outline-none hover:bg-accent"
              >
                {owners.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <Button variant="panel" size="lg" className="h-10">
              <ListFilter className="text-muted-foreground" />
              Filter
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="eyebrow border-y border-border text-[0.65rem] text-subtle">
                <th className="px-6 py-3 font-normal">Severity</th>
                <th className="px-3 py-3 font-normal">Incident</th>
                <th className="px-3 py-3 font-normal">Response status</th>
                <th className="px-3 py-3 font-normal">Owner</th>
                <th className="px-3 py-3 font-normal">Age ↓</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((inc) => {
                const critical = inc.severity === 1;
                return (
                  <tr
                    key={inc.id}
                    className={cn("border-b border-border last:border-0", critical ? "bg-danger-surface/60" : "hover:bg-panel")}
                  >
                    <td className="px-6 py-4">
                      <SeverityBadge level={inc.severity} />
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium">{inc.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="mr-3 font-mono text-xs">{inc.id}</span>
                        {inc.source}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusDot status={inc.status} />
                    </td>
                    <td className="px-3 py-4">
                      <span className="flex items-center gap-3 text-sm">
                        <Avatar name={inc.owner} />
                        {inc.owner}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-mono text-sm text-muted-foreground tabular">{inc.age}</td>
                    <td className="pr-6">
                      {critical ? (
                        <Link
                          to="/incidents/$incidentId/containment"
                          params={{ incidentId: inc.id }}
                          aria-label={`Open ${inc.id}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ArrowUpRight className="size-4" />
                        </Link>
                      ) : (
                        <ArrowUpRight className="size-4 text-subtle" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="eyebrow flex items-center gap-2 text-[0.65rem] text-subtle">
            <span className="size-1.5 rounded-full bg-success" />
            Synced 10:00:00 UTC · Updates every 30s
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-primary">
            View all incidents <ArrowRight className="size-4" />
          </span>
        </div>
      </Panel>

      {/* Bottom row */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_1fr_1fr]">
        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <span className="eyebrow text-[0.65rem] text-subtle">Today / UTC</span>
          </div>
          <ul className="mt-5 space-y-5">
            {activity.map((a) => (
              <li key={a.time} className="flex gap-4">
                <span className="w-10 pt-0.5 font-mono text-xs text-subtle tabular">{a.time}</span>
                <span className="pt-0.5">{activityIcon[a.kind]}</span>
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Response posture</h2>
            <span className="eyebrow text-[0.65rem] text-subtle">5 active</span>
          </div>
          <div className="mt-6 flex h-2.5 gap-1">
            {posture.flatMap(({ status, count }) =>
              Array.from({ length: count }, (_, i) => (
                <span key={`${status}-${i}`} className={cn("flex-1", statusDot[status])} />
              )),
            )}
          </div>
          <ul className="mt-6 space-y-4">
            {posture.map(({ status, count }) => (
              <li key={status} className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[0.95rem]">
                  <span className={cn("size-2", statusDot[status])} />
                  {status}
                </span>
                <span className="font-mono text-sm tabular">{String(count).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-6 text-[0.65rem] text-subtle">12 resolved / 17 total today</p>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">On call</h2>
            <span className="font-mono text-xs text-subtle">08:00–16:00</span>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Avatar name="Alex Morgan" className="size-12 bg-secondary text-sm text-info" />
            <div>
              <p className="font-medium">Alex Morgan</p>
              <p className="text-sm text-muted-foreground">Incident commander · You</p>
            </div>
          </div>
          <dl className="mt-6 space-y-4 text-[0.95rem]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Responders online</dt>
              <dd className="font-mono text-success">4 / 4</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Next handoff</dt>
              <dd className="font-mono">16:00 UTC</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Connected integrations</dt>
              <dd className="font-mono">8 / 8</dd>
            </div>
          </dl>
          <Link
            to="/team"
            className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm font-medium text-primary"
          >
            View response roster <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>
    </AppShell>
  );
}
