import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Download,
  Lock,
  LockKeyhole,
  Mail,
  Minus,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell, Avatar, CountChip, Panel } from "@/components/breakout/app-shell";
import { Pill } from "@/components/breakout/badges";
import { Button } from "@/components/ui/button";
import { spacetimeTeamQuery, updateSpacetimeRole, type SpacetimeRole } from "@/lib/spacetimedb.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/team")({
  loader: ({ context }) => context.queryClient.ensureQueryData(spacetimeTeamQuery),
  head: () => ({
    meta: [
      { title: "Team & access — Breakout" },
      { name: "description", content: "Manage workspace members and administrator access for your response team." },
      { property: "og:title", content: "Team & access — Breakout" },
      { property: "og:description", content: "Manage workspace members and administrator access for your response team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamAccess,
});

type Tab = "members" | "roles";

const roleLabel: Record<SpacetimeRole, string> = { admin: "Administrator", user: "User" };
const roles: SpacetimeRole[] = ["admin", "user"];

const permissionMatrix: { label: string; locked?: boolean; values: [boolean, boolean] }[] = [
  { label: "View incidents & breakouts", values: [true, true] },
  { label: "Review containment actions", values: [true, true] },
  { label: "Change member roles", locked: true, values: [true, false] },
];

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="relative">
      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-border bg-secondary pl-9 pr-4 text-sm font-semibold text-foreground outline-none hover:bg-accent"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function TeamAccess() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(spacetimeTeamQuery);
  const [tab, setTab] = useState<Tab>("members");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [pendingRoleFor, setPendingRoleFor] = useState<string | null>(null);

  const members = data.members;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
        (roleFilter === "All roles" || roleLabel[m.role] === roleFilter),
    );
  }, [members, query, roleFilter]);

  const adminCount = members.filter((m) => m.role === "admin").length;

  const changeRole = async (userId: string, next: SpacetimeRole) => {
    const m = members.find((x) => x.id === userId);
    if (!m || m.role === next) return;
    setRoleError(null);
    setPendingRoleFor(userId);
    try {
      await updateSpacetimeRole({ data: { userId, role: next } });
      await queryClient.invalidateQueries({ queryKey: ["stdb"] });
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Role change failed.");
    } finally {
      setPendingRoleFor(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "members", label: "Members", count: members.length },
    { key: "roles", label: "Roles", count: roles.length },
  ];

  const rolePermissions = (
    <Panel className="mt-6 overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold">Role permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Two roles. Role changes take effect immediately; only administrators can make them.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[0.95rem]">
          <thead>
            <tr className="border-y border-border">
              <th className="eyebrow px-6 py-3 text-[0.65rem] font-normal text-subtle">Permission</th>
              {roles.map((r) => {
                const count = members.filter((m) => m.role === r).length;
                return (
                  <th key={r} className="px-3 py-3 text-center font-normal">
                    <span className="font-medium">{roleLabel[r]}</span>
                    <span className="eyebrow block text-[0.6rem] text-subtle">
                      {count} {count === 1 ? "member" : "members"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {permissionMatrix.map((p) => (
              <tr key={p.label} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-2">
                    {p.label}
                    {p.locked && <LockKeyhole className="size-3.5 text-warning" />}
                  </span>
                </td>
                {p.values.map((allowed, i) => (
                  <td key={i} className="px-3 py-3 text-center text-sm">
                    {allowed ? (
                      <span className="inline-flex items-center gap-2 text-success">
                        <Check className="size-4" /> Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Minus className="size-4" /> Denied
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  return (
    <AppShell
      active="team"
      breadcrumbs={[{ label: "Workspace" }, { label: "Team & access" }]}
      footerRight="Only administrators can change access."
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">Workspace management / Role-based access</p>
          <h1 className="mt-3 text-4xl font-normal tracking-tight">Team & access</h1>
          <p className="mt-2 text-muted-foreground">
            Give your response team the right access. Keep critical actions in trusted hands.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="panel" size="lg" className="h-12">
            <Download className="text-muted-foreground" /> Export access
          </Button>
          <Button variant="signal" size="lg" className="h-12">
            <Plus /> Invite user
          </Button>
        </div>
      </div>

      <div role="tablist" className="mt-7 flex gap-8 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 pb-3 text-[0.95rem] transition-colors",
              tab === t.key
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="font-mono text-[0.65rem] text-subtle">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "members" && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Workspace members <Users className="size-4" />
              </div>
              <p className="mt-3 text-3xl tabular">{members.length}</p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Administrators <ShieldCheck className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-3xl tabular">{adminCount}</p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Pending invitations <Mail className="size-4 text-warning" />
              </div>
              <p className="mt-3 flex items-baseline gap-4">
                <span className="text-3xl tabular">0</span>
                <span className="text-sm text-muted-foreground">No open invitations</span>
              </p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Authentication policy <Lock className="size-4 text-success" />
              </div>
              <p className="mt-3 text-lg text-success">Email + password</p>
            </Panel>
          </div>

          <Panel className="mt-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Workspace members</h2>
                <CountChip>{String(members.length).padStart(2, "0")}</CountChip>
              </div>
              <span className="text-sm text-muted-foreground">
                {data.currentUserIsAdmin
                  ? "Select a role to change a member’s access"
                  : data.mode === "demo"
                    ? "Demo database · roles are view-only"
                    : "Only administrators can change roles"}
              </span>
            </div>
            {roleError && (
              <p className="mx-6 mt-4 rounded-md border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger">
                {roleError}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 px-6 py-5">
              <label className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-md border border-border bg-inset px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-transparent outline-none placeholder:text-subtle"
                />
              </label>
              <SelectBox value={roleFilter} onChange={setRoleFilter} options={["All roles", ...roles.map((r) => roleLabel[r])]} />
              <span className="eyebrow ml-auto text-[0.6rem] text-subtle">{filtered.length} members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="eyebrow border-y border-border text-[0.65rem] text-subtle">
                    <th className="px-6 py-3 font-normal">Member ↑</th>
                    <th className="px-3 py-3 font-normal">Role</th>
                    <th className="px-3 py-3 font-normal">Authentication</th>
                    <th className="px-3 py-3 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b border-border hover:bg-panel">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} className={cn("size-10", m.you && "bg-secondary text-info")} />
                          <div>
                            <p className="font-medium">
                              {m.name}
                              {m.you && <span className="eyebrow ml-2 text-[0.6rem] text-subtle">You</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{m.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <label className="relative flex w-48 items-center">
                          <span className="pointer-events-none absolute left-3">
                            {m.role === "admin" ? (
                              <ShieldCheck className="size-4 text-primary" />
                            ) : (
                              <Shield className="size-4 text-muted-foreground" />
                            )}
                          </span>
                          <select
                            value={m.role}
                            disabled={m.you || !data.currentUserIsAdmin || pendingRoleFor === m.id}
                            onChange={(e) => changeRole(m.id, e.target.value as SpacetimeRole)}
                            aria-label={`Role for ${m.name}`}
                            className="h-10 w-full appearance-none rounded-md border border-border bg-inset pl-10 pr-8 text-sm text-foreground outline-none hover:border-input disabled:cursor-not-allowed"
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>
                                {roleLabel[r]}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
                        </label>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-success" /> Email + password
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <Pill tone="success" dot>
                          Active
                        </Pill>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                        No members match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4">
              <span className="eyebrow text-[0.6rem] text-subtle">
                Showing {filtered.length} of {members.length} members
              </span>
            </div>
          </Panel>

          {rolePermissions}
        </>
      )}

      {tab === "roles" && rolePermissions}
    </AppShell>
  );
}
