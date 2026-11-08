import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Eye,
  Lock,
  LockKeyhole,
  Mail,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell, Avatar, CountChip, Panel } from "@/components/breakout/app-shell";
import { Pill } from "@/components/breakout/badges";
import { Button } from "@/components/ui/button";
import { members as initialMembers, permissions, roles, type Member, type Role } from "@/lib/breakout-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & access — Breakout" },
      { name: "description", content: "Manage workspace members, roles, and least-privilege permissions for your response team." },
      { property: "og:title", content: "Team & access — Breakout" },
      { property: "og:description", content: "Manage workspace members, roles, and least-privilege permissions for your response team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamAccess,
});

type Tab = "members" | "roles" | "audit";

function RoleIcon({ role }: { role: Role }) {
  if (role === "Observer") return <Eye className="size-4 text-muted-foreground" />;
  if (role === "Responder") return <Shield className="size-4 text-muted-foreground" />;
  return <ShieldCheck className="size-4 text-primary" />;
}

function SelectBox({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <label className={cn("relative", className)}>
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

function PermissionCell({ value }: { value: string }) {
  if (value === "Allowed")
    return (
      <span className="inline-flex items-center gap-2 text-success">
        <Check className="size-4" /> Allowed
      </span>
    );
  if (value === "Denied")
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Minus className="size-4" /> Denied
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Eye className="size-4" /> {value}
    </span>
  );
}

function TeamAccess() {
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [audit, setAudit] = useState<{ time: string; text: string }[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
        (roleFilter === "All roles" || m.role === roleFilter) &&
        (statusFilter === "All statuses" || m.status === statusFilter),
    );
  }, [members, query, roleFilter, statusFilter]);

  const roleCounts = roles.map((r) => members.filter((m) => m.role === r).length);
  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.email));

  const changeRole = (email: string, role: Role) => {
    const m = members.find((x) => x.email === email);
    if (!m || m.role === role) return;
    setMembers((prev) => prev.map((x) => (x.email === email ? { ...x, role } : x)));
    const now = new Date();
    const time = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC`;
    setAudit((a) => [{ time, text: `Alex Morgan changed ${m.name} from ${m.role} to ${role}` }, ...a]);
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "members", label: "Members", count: members.length },
    { key: "roles", label: "Roles", count: roles.length },
    { key: "audit", label: "Audit log" },
  ];

  const rolePermissions = (
    <Panel className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold">Role permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Least privilege by default. Role changes take effect immediately and are recorded in the audit log.
          </p>
        </div>
        <Button variant="panel" size="lg">
          <Plus /> Create role
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[0.95rem]">
          <thead>
            <tr className="border-y border-border">
              <th className="eyebrow px-6 py-3 text-[0.65rem] font-normal text-subtle">Permission</th>
              {roles.map((r, i) => (
                <th key={r} className="px-3 py-3 text-center font-normal">
                  <span className="inline-flex items-center gap-2 font-medium">
                    {r}
                    {r === "Administrator" ? (
                      <Lock className="size-3.5 text-subtle" />
                    ) : (
                      <Pencil className="size-3.5 text-primary" />
                    )}
                  </span>
                  <span className="eyebrow block text-[0.6rem] text-subtle">
                    {roleCounts[i]} {r === "Observer" ? "invited" : roleCounts[i] === 1 ? "member" : "members"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p.label} className="border-b border-border">
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-2">
                    {p.label}
                    {p.locked && <LockKeyhole className="size-3.5 text-warning" />}
                  </span>
                </td>
                {p.values.map((v, i) => (
                  <td key={i} className="px-3 py-3 text-center text-sm">
                    <PermissionCell value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="size-4 text-warning" />
          Sensitive actions require MFA. Containment approval must come from someone other than the requester.
        </span>
        <span className="eyebrow text-[0.6rem] text-subtle">Administrator is a protected role</span>
      </div>
    </Panel>
  );

  return (
    <AppShell
      active="team"
      breadcrumbs={[{ label: "Workspace" }, { label: "Team & access" }]}
      footerRight="Every access change logged. No exceptions."
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
            {t.count !== undefined && <span className="font-mono text-[0.65rem] text-subtle">{t.count}</span>}
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
              <p className="mt-3 flex items-baseline gap-4">
                <span className="text-3xl tabular">{members.length}</span>
                <span className="text-sm text-muted-foreground">
                  {members.filter((m) => m.status === "Active").length} active ·{" "}
                  {members.filter((m) => m.status === "Invited").length} invited
                </span>
              </p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Privileged access <ShieldCheck className="size-4 text-primary" />
              </div>
              <p className="mt-3 flex items-baseline gap-4">
                <span className="text-3xl tabular">{roleCounts[0] + roleCounts[1]}</span>
                <span className="text-sm text-muted-foreground">
                  {roleCounts[0]} admin · {roleCounts[1]} commander
                </span>
              </p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Pending invitations <Mail className="size-4 text-warning" />
              </div>
              <p className="mt-3 flex items-baseline gap-4">
                <span className="text-3xl tabular">1</span>
                <span className="text-sm text-muted-foreground">Expires in 6 days</span>
              </p>
            </Panel>
            <Panel className="p-5">
              <div className="flex justify-between text-[0.95rem] text-muted-foreground">
                Authentication policy <Lock className="size-4 text-success" />
              </div>
              <p className="mt-3 text-lg text-success">MFA enforced · SSO connected</p>
              <p className="eyebrow mt-2 text-[0.6rem] text-subtle">5 / 5 active members protected</p>
            </Panel>
          </div>

          <Panel className="mt-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Workspace members</h2>
                <CountChip>{String(members.length).padStart(2, "0")}</CountChip>
              </div>
              <span className="text-sm text-muted-foreground">Select a role to change a member’s access</span>
            </div>
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
              <SelectBox value={roleFilter} onChange={setRoleFilter} options={["All roles", ...roles]} />
              <SelectBox value={statusFilter} onChange={setStatusFilter} options={["All statuses", "Active", "Invited"]} />
              <span className="eyebrow ml-auto text-[0.6rem] text-subtle">{filtered.length} members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="eyebrow border-y border-border text-[0.65rem] text-subtle">
                    <th className="w-12 py-3 pl-6">
                      <input
                        type="checkbox"
                        aria-label="Select all members"
                        checked={allSelected}
                        onChange={(e) =>
                          setSelected(e.target.checked ? new Set(filtered.map((m) => m.email)) : new Set())
                        }
                        className="size-4 accent-primary"
                      />
                    </th>
                    <th className="px-3 py-3 font-normal">Member ↑</th>
                    <th className="px-3 py-3 font-normal">Role</th>
                    <th className="px-3 py-3 font-normal">Incident scope</th>
                    <th className="px-3 py-3 font-normal">Authentication</th>
                    <th className="px-3 py-3 font-normal">Status</th>
                    <th className="px-3 py-3 font-normal">Last active</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.email} className="border-b border-border hover:bg-panel">
                      <td className="py-4 pl-6">
                        <input
                          type="checkbox"
                          aria-label={`Select ${m.name}`}
                          checked={selected.has(m.email)}
                          onChange={(e) =>
                            setSelected((s) => {
                              const n = new Set(s);
                              if (e.target.checked) n.add(m.email);
                              else n.delete(m.email);
                              return n;
                            })
                          }
                          className="size-4 accent-primary"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} className={cn("size-10", m.you && "bg-secondary text-info")} />
                          <div>
                            <p className="font-medium">
                              {m.name}
                              {m.you && <span className="eyebrow ml-2 text-[0.6rem] text-subtle">You</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <label className="relative flex w-56 items-center">
                          <span className="pointer-events-none absolute left-3">
                            <RoleIcon role={m.role} />
                          </span>
                          <select
                            value={m.role}
                            disabled={m.role === "Administrator"}
                            onChange={(e) => changeRole(m.email, e.target.value as Role)}
                            aria-label={`Role for ${m.name}`}
                            className="h-10 w-full appearance-none rounded-md border border-border bg-inset pl-10 pr-8 text-sm text-foreground outline-none hover:border-input disabled:cursor-not-allowed"
                          >
                            {roles.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
                        </label>
                      </td>
                      <td className="px-3 py-4 text-[0.95rem]">{m.scope}</td>
                      <td className="px-3 py-4 text-sm">
                        {m.auth === "SSO + MFA" ? (
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-success" /> SSO + MFA
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Minus className="size-4" /> Pending setup
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <Pill tone={m.status === "Active" ? "success" : "warning"} dot>
                          {m.status}
                        </Pill>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-4 font-mono text-xs",
                          m.lastActive === "Online now" ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {m.lastActive}
                      </td>
                      <td className="pr-6">
                        <button type="button" aria-label={`More actions for ${m.name}`} className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                        No members match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="eyebrow text-[0.6rem] text-subtle">
                Showing {filtered.length} of {members.length} members
              </span>
              <button
                type="button"
                onClick={() => setTab("audit")}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View access audit log <ArrowRight className="size-4" />
              </button>
            </div>
          </Panel>

          {rolePermissions}
        </>
      )}

      {tab === "roles" && rolePermissions}

      {tab === "audit" && (
        <Panel className="mt-6 p-6">
          <h2 className="text-xl font-semibold">Access audit log</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every role change made in this workspace is recorded here.</p>
          {audit.length === 0 ? (
            <p className="mt-8 rounded-lg border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
              No access changes yet today. Change a member’s role on the Members tab to see it logged.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {audit.map((a, i) => (
                <li key={i} className="flex gap-6 py-3">
                  <span className="w-20 font-mono text-xs text-subtle">{a.time}</span>
                  <span className="eyebrow w-14 text-[0.65rem] text-muted-foreground">Audit</span>
                  <span className="text-sm">{a.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
