import type { ReactNode } from "react";
import { Check, GitMerge, Radar, TriangleAlert } from "lucide-react";
import { Logo } from "./logo";

const timeline = [
  { icon: Radar, title: "Signal detected", meta: "CrowdStrike · behavioral detection", time: "09:12:04", tone: "text-muted-foreground" },
  { icon: TriangleAlert, title: "Incident declared", meta: "SEV 1 · Ransomware / FIN-WS-021", time: "09:14:18", tone: "text-danger" },
  { icon: GitMerge, title: "Response coordinated", meta: "3 responders · 6 endpoints isolated", time: "09:19:32", tone: "text-primary" },
];

export function AuthLayout({
  headline,
  topRight,
  children,
}: {
  headline: ReactNode;
  topRight: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
      {/* Brand panel */}
      <aside className="hidden flex-col border-r border-border bg-panel px-10 py-9 lg:flex xl:px-12">
        <Logo />
        <div className="my-auto max-w-[520px] py-12">
          <p className="eyebrow text-primary">Incident response. Without the friction.</p>
          <h1 className="mt-6 text-5xl font-normal leading-[1.08] tracking-tight text-foreground xl:text-[3.4rem]">
            {headline}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            One command center to investigate threats, coordinate your team, and move from signal
            to resolution.
          </p>

          <div className="mt-10 overflow-hidden rounded-lg border border-border bg-inset">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="eyebrow flex items-center gap-2 text-muted-foreground">
                <span className="size-2 bg-primary" />
                Response in motion
              </span>
              <span className="eyebrow text-subtle">INC-1042</span>
            </div>
            <ol className="relative px-5 pt-5">
              <span className="absolute bottom-16 left-[2.05rem] top-9 w-px bg-border" aria-hidden />
              {timeline.map(({ icon: Icon, title, meta, time, tone }) => (
                <li key={title} className="relative flex gap-4 pb-6">
                  <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <Icon className={`size-4 ${tone}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-medium text-foreground">{title}</p>
                      <span className="font-mono text-xs text-subtle tabular">{time}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{meta}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between px-5 pb-5 pt-1">
              <span className="eyebrow text-muted-foreground">Signal → Action</span>
              <span className="font-mono text-2xl text-primary tabular">07m 28s</span>
            </div>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Unified context", "Coordinated response", "Audit-ready evidence"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-3.5 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="eyebrow flex justify-between text-subtle">
          <span>Breakout / Response platform</span>
          <span>Built for the front line</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <div className="text-sm text-muted-foreground">{topRight}</div>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          {children}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 Breakout</span>
          <div className="flex items-center gap-6">
            <a href="mailto:support@breakout.app" className="hover:text-foreground">
              Contact support
            </a>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              All systems operational
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
