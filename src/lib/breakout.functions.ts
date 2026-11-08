import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "incident_commander" | "analyst" | "legal" | "observer";

export const roleDisplay: Record<AppRole, string> = {
  admin: "Administrator",
  incident_commander: "Incident commander",
  analyst: "Responder",
  legal: "Legal",
  observer: "Observer",
};

export const roleFromDisplay: Record<string, AppRole> = {
  Administrator: "admin",
  "Incident commander": "incident_commander",
  Responder: "analyst",
  Legal: "legal",
  Observer: "observer",
};

// ---------- Command center ----------

export const getCommandCenterData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: breakouts, error: bErr }, { data: events, error: eErr }] = await Promise.all([
      context.supabase.from("breakouts").select("*").order("created_at", { ascending: false }),
      context.supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(8),
    ]);
    if (bErr) throw new Error(bErr.message);
    if (eErr) throw new Error(eErr.message);
    return { breakouts: breakouts ?? [], events: events ?? [] };
  });

export const commandCenterQuery = queryOptions({
  queryKey: ["command-center"],
  queryFn: () => getCommandCenterData(),
});

// ---------- Team & access ----------

export const getTeamData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }, { data: accessEvents, error: aErr }] =
      await Promise.all([
        context.supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        context.supabase.from("user_roles").select("*"),
        context.supabase
          .from("audit_events")
          .select("*")
          .like("action", "user.%")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);
    if (aErr) throw new Error(aErr.message);

    const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role as AppRole]));
    const members = (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: roleByUser.get(p.id) ?? ("observer" as AppRole),
      you: p.id === context.userId,
    }));

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    return {
      members,
      accessEvents: accessEvents ?? [],
      currentUserId: context.userId,
      currentUserIsAdmin: Boolean(isAdmin),
    };
  });

export const teamQuery = queryOptions({
  queryKey: ["team"],
  queryFn: () => getTeamData(),
});

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only administrators can change roles.");
    if (data.userId === userId) throw new Error("You cannot change your own role.");
    if (!Object.keys(roleDisplay).includes(data.role)) throw new Error("Unknown role.");

    const { data: target } = await supabase.from("profiles").select("name").eq("id", data.userId).single();
    if (!target) throw new Error("Member not found.");

    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (insErr) throw new Error(insErr.message);

    const { data: me } = await supabase.from("profiles").select("name").eq("id", userId).single();
    await supabase.from("audit_events").insert({
      actor: userId,
      actor_name: me?.name ?? "Unknown",
      action: "user.role",
      detail: { user_id: data.userId, user_name: target.name, role: data.role },
    });

    return { ok: true };
  });
