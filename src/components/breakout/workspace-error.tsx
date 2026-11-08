import { useState } from "react";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryClient, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Database, RefreshCw } from "lucide-react";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";

export function WorkspaceError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryBoundary = useQueryErrorResetBoundary();
  const [retrying, setRetrying] = useState(false);
  const protectionBlocked = error instanceof Error && error.message.includes("protected SpacetimeDB module");
  const teamPage = router.state.location.pathname === "/team";

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    queryBoundary.reset();
    await queryClient.invalidateQueries({ queryKey: ["stdb"], refetchType: "none" });
    try { await router.invalidate(); reset(); }
    finally { setRetrying(false); }
  };

  return <AppShell active={teamPage ? "team" : "command-center"} breadcrumbs={[{ label: "Workspace" }, { label: teamPage ? "Team & access" : "Command center" }]} footerRight="Workspace connection unavailable">
    <h1 className="text-4xl font-normal">{teamPage ? "Team & access" : "Command center"}</h1>
    <section role="alert" className="mt-8 border-y border-border py-8">
      <Database className="size-8 text-warning" />
      <h2 className="mt-4 text-xl font-semibold">{protectionBlocked ? "SpacetimeDB connection needs protection" : "Workspace connection unavailable"}</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">{protectionBlocked
        ? "The published database does not have the required private tables and protected account controls. Workspace data is blocked until the protected module is restored."
        : "We could not load your workspace securely. Your records have not been changed. Try reconnecting in a moment."}</p>
      <Button variant="signal" className="mt-5" onClick={() => void retry()} disabled={retrying}><RefreshCw className={retrying ? "animate-spin" : ""} />{retrying ? "Reconnecting…" : "Retry connection"}</Button>
    </section>
  </AppShell>;
}