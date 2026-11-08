import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ResponseStatus, Severity } from "@/lib/breakout-data";

const sevTone: Record<Severity, string> = {
  1: "bg-danger-surface text-danger",
  2: "bg-warning-surface text-warning",
  3: "bg-info-surface text-info",
};

export function SeverityBadge({ level }: { level: Severity }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs", sevTone[level])}>
      <span className="size-1.5 rounded-full bg-current" />
      SEV {level}
    </span>
  );
}

export const statusDot: Record<ResponseStatus, string> = {
  Triage: "bg-subtle",
  Investigating: "bg-muted-foreground",
  Containing: "bg-warning",
  Monitoring: "bg-success",
};

export function StatusDot({ status }: { status: ResponseStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-foreground">
      <span className={cn("size-1.5 rounded-full", statusDot[status])} />
      {status}
    </span>
  );
}

const pillTone = {
  danger: "bg-danger-surface text-danger",
  warning: "bg-warning-surface text-warning",
  success: "bg-success-surface text-success",
  neutral: "bg-secondary text-muted-foreground",
};

export function Pill({
  tone,
  dot,
  children,
  className,
}: {
  tone: keyof typeof pillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-1.5 rounded px-2 py-1 text-[0.65rem]", pillTone[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Tiny line chart for KPI cards. */
export function Sparkline({ points, tone }: { points: number[]; tone: "danger" | "muted" | "foreground" }) {
  const w = 120;
  const h = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${(i * step).toFixed(1)},${(h - 4 - ((p - min) / (max - min || 1)) * (h - 8)).toFixed(1)}`)
    .join(" ");
  const stroke = { danger: "stroke-danger", muted: "stroke-muted-foreground", foreground: "stroke-foreground" }[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-[120px] min-w-0 shrink" aria-hidden>
      <polyline points={d} fill="none" strokeWidth="1.5" strokeLinejoin="round" className={stroke} />
    </svg>
  );
}
