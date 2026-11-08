import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceError } from "@/components/breakout/workspace-error";

// Pathless layout gating every app screen behind a signed-in session.
// Client-only (ssr: false): the session lives in browser storage, so a
// server-side gate would redirect-loop on hard refresh.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
  errorComponent: WorkspaceError,
});
