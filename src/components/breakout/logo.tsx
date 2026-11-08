import { cn } from "@/lib/utils";

/** Breakout mark: a lime frame with an arrow breaking out of its top-right corner. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 text-primary", className)}>
      <path
        fill="currentColor"
        d="M0 0h18v6H6v20h20V14h6v18H0z"
      />
      <path fill="currentColor" d="M21 0h11v11l-3.6-3.6-9.2 9.2-3.8-3.8 9.2-9.2z" />
      <path fill="currentColor" opacity=".55" d="M9 15h4v4h4v4H9z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[1.65rem] font-normal leading-none tracking-tight text-foreground">
        breakout
      </span>
    </span>
  );
}
