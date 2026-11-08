import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { encodeRoleChange, splitDescription, type SpacetimeRole } from "./spacetimedb-wire";

export type { SpacetimeRole };

function ownerToken(): string {
  const token = process.env["SPACETIMEDB_OWNER_TOKEN"]?.trim();
  if (!token) throw new Error("The workspace database is not configured.");
  return token;
}

/** Signed-in account from Cloud auth, enrolled into SpacetimeDB on first visit. */
async function currentMember(context: {
  userId: string;
  claims: { email?: string };
  supabase: { from: (t: "profiles") => any };
}) {
  const token = ownerToken();
  const { data: profile } = await context.supabase.from("profiles").select("name, email").eq("id", context.userId).maybeSingle();
  const email = (profile?.email as string | undefined) ?? context.claims.email ?? "";
  const name = (profile?.name as string | undefined) ?? (email.split("@")[0] || "Member");
  const { ensurePerson } = await import("./spacetimedb.server");
  return { token, ...(await ensurePerson(token, context.userId, name, email)) };
}

export const getSpacetimeMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { currentUser } = await currentMember(context);
    return { name: currentUser.name, role: currentUser.role };
  });

export const getSpacetimeTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { people, currentUser, mode } = await currentMember(context);
    return {
      members: people.map((p) => ({ ...p, you: p.id === currentUser.id })),
      // Demo (public) module has no role-editing reducer, so controls stay read-only there.
      currentUserIsAdmin: mode === "protected" && currentUser.role === "admin",
      currentUserId: currentUser.id,
      mode,
    };
  });

export const getSpacetimeBreakouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { token } = await currentMember(context);
    const { readBreakouts } = await import("./spacetimedb.server");
    const breakouts = (await readBreakouts(token))
      .map((b) => ({ ...b, ...splitDescription(b.description, b.id) }))
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
    return { breakouts };
  });

export const updateSpacetimeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]) }))
  .handler(async ({ context, data }) => {
    const { token, currentUser, people, mode } = await currentMember(context);
    if (mode === "demo") throw new Error("Role editing needs the protected SpacetimeDB module; the demo database is read-only for roles.");
    if (currentUser.role !== "admin") throw new Error("Only administrators can change roles.");
    if (context.userId === data.userId) throw new Error("You cannot change your own role.");
    if (!people.some((p) => p.id === data.userId)) throw new Error("Member not found.");
    const { callRoleChange, getVerifiedPeople } = await import("./spacetimedb.server");
    await callRoleChange(token, encodeRoleChange(context.userId, data.userId, data.role));
    const updated = await getVerifiedPeople(token, context.userId);
    if (updated.people.find((p) => p.id === data.userId)?.role !== data.role) {
      throw new Error("Role update could not be confirmed.");
    }
    return { ok: true };
  });

export const getIncidentAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ incidentId: z.string().uuid(), question: z.string().trim().min(1).max(2000) }))
  .handler(async ({ context, data }) => {
    const { token } = await currentMember(context);
    const { readBreakouts, readAgentDocuments } = await import("./spacetimedb.server");
    const incident = (await readBreakouts(token)).find(row => row.id === data.incidentId);
    if (!incident) throw new Error("Incident not found in this workspace.");
    const { matchDocuments } = await import("./response-agent.js");
    const documents = matchDocuments(await readAgentDocuments(token), `${incident.description} ${data.question}`);
    const { generateResponse } = await import("./response-agent.server.js");
    const result = await generateResponse({
      incident, documents, question: data.question,
      config: {
        endpoint: process.env["RESPONSE_AI_BASE_URL"]?.trim(),
        provider: process.env["RESPONSE_AI_PROVIDER"] === "nemotron" ? "nemotron" : "ollama",
        model: process.env["RESPONSE_AI_MODEL"]?.trim(),
        apiKey: process.env["RESPONSE_AI_API_KEY"]?.trim(),
      },
    });
    return { ...result, incidentId: incident.id, documents: documents.map(({ id, title, category }) => ({ id, title, category })), generatedAt: new Date().toISOString(), execution: "disabled" as const };
  });

export const spacetimeMeQuery = queryOptions({ queryKey: ["stdb", "me"], queryFn: () => getSpacetimeMe() });
export const spacetimeTeamQuery = queryOptions({ queryKey: ["stdb", "team"], queryFn: () => getSpacetimeTeam() });
export const spacetimeBreakoutsQuery = queryOptions({
  queryKey: ["stdb", "breakouts"],
  queryFn: () => getSpacetimeBreakouts(),
  refetchInterval: 10000,
  refetchOnWindowFocus: true,
});
