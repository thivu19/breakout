import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChartNoAxesColumn,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  Database,
  LayoutGrid,
  Plug,
  ScanSearch,
  Search,
  Settings2,
  ShieldAlert,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavKey = "command-center" | "team";

const navItemClass =
  "flex h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] text-sidebar-foreground transition-colors";

function NavItem({
  icon: Icon,
  label,
  count,
  to,
  active,
}: {
  icon: typeof LayoutGrid;
  label: string;
  count?: number;
  to?: "/command-center" | "/team";
  active?: boolean;
}) {
  const content = (
    <>
      <Icon className={cn("size-[18px]", active ? "text-primary" : "text-subtle")} />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="font-mono text-xs text-subtle">{count}</span>}
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          navItemClass,
          active
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        {content}
      </Link>
    );
  }
  return (
    <span className={cn(navItemClass, "cursor-default")} title="Coming soon">
      {content}
    </span>
  );
}

function Sidebar({ active }: { active: NavKey }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
      <Link to="/command-center" className="px-2">
        <Logo />
      </Link>

      <button
        type="button"
        className="mt-7 flex items-center gap-3 rounded-lg border border-sidebar-border bg-panel px-3 py-2.5 text-left hover:bg-sidebar-accent/60"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
          A
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-foreground">Acme Security</span>
          <span className="eyebrow block text-[0.625rem] text-subtle">Production</span>
        </span>
        <ChevronsUpDown className="size-4 text-subtle" />
      </button>

      <p className="eyebrow mb-2 mt-7 px-1 text-[0.625rem] text-subtle">Workspace</p>
      <nav className="space-y-0.5">
        <NavItem icon={LayoutGrid} label="Command center" to="/command-center" active={active === "command-center"} />
        <NavItem icon={ShieldAlert} label="Incidents" count={5} />
        <NavItem icon={ScanSearch} label="Investigations" />
        <NavItem icon={Database} label="Assets" />
        <NavItem icon={Workflow} label="Playbooks" />
        <NavItem icon={ChartNoAxesColumn} label="Reports" />
      </nav>

      <p className="eyebrow mb-2 mt-7 px-1 text-[0.625rem] text-subtle">Manage</p>
      <nav className="space-y-0.5">
        <NavItem icon={Plug} label="Integrations" />
        <NavItem icon={Users} label="Team & access" to="/team" active={active === "team"} />
        <NavItem icon={Settings2} label="Settings" />
      </nav>

      <div className="mt-auto">
        <p className="eyebrow flex items-center gap-2 px-2 text-[0.625rem] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          All systems operational
        </p>
        <span className={cn(navItemClass, "mt-3 cursor-default")}>
          <CircleHelp className="size-[18px] text-subtle" />
          Help & documentation
        </span>
        <div className="mt-3 flex items-center gap-3 border-t border-sidebar-border px-1 pt-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary font-mono text-xs text-info">
            AM
          </span>
          <span className="flex-1">
            <span className="block text-sm text-foreground">Alex Morgan</span>
            <span className="block text-xs text-muted-foreground">Incident commander</span>
          </span>
          <ChevronDown className="size-4 text-subtle" />
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  active,
  breadcrumbs,
  footerRight,
  children,
}: {
  active: NavKey;
  breadcrumbs: { label: string; to?: "/command-center" | "/team" }[];
  footerRight: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur lg:px-8">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-3 text-[0.95rem]">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={b.label} className="flex items-center gap-3">
                  {i > 0 && <span className="text-subtle">/</span>}
                  {b.to && !last ? (
                    <Link to={b.to} className="text-muted-foreground hover:text-foreground">
                      {b.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        last ? "text-foreground" : "text-muted-foreground",
                        /^INC-/.test(b.label) && "font-mono text-sm",
                      )}
                    >
                      {b.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <label className="hidden h-10 w-72 items-center gap-2.5 rounded-md border border-border bg-panel px-3 text-sm md:flex xl:w-80">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Search incidents, assets, evidence..."
                className="w-full bg-transparent text-foreground outline-none placeholder:text-subtle"
              />
              <kbd className="whitespace-nowrap font-mono text-[0.65rem] text-subtle">⌘ K</kbd>
            </label>
            <button type="button" aria-label="Notifications" className="text-muted-foreground hover:text-foreground">
              <Bell className="size-5" />
            </button>
            <span className="h-6 w-px bg-border" />
            <span className="font-mono text-sm text-muted-foreground tabular">10:00 UTC</span>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-8">{children}</main>

        <footer className="eyebrow flex flex-wrap justify-between gap-2 px-6 pb-6 text-[0.625rem] text-subtle lg:px-8">
          <span>Acme Security / Production / All times UTC</span>
          <span>{footerRight}</span>
        </footer>
      </div>
    </div>
  );
}

/** Rounded console card used for every dashboard panel. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-xl border border-border bg-card", className)}>{children}</section>;
}

export function CountChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel font-mono text-[0.65rem] text-muted-foreground",
        className,
      )}
    >
      {init}
    </span>
  );
}
