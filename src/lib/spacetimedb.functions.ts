import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { encodeRoleChange } from "./spacetimedb-wire";

// Staged adapter: deliberately not imported by live screens until external activation checks pass.
export const getSpacetimeTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = process.env['SPACETIMEDB_OWNER_TOKEN'];
    if (!token) throw new Error("SpacetimeDB is awaiting secure activation.");
    const { getVerifiedPeople } = await import("./spacetimedb.server");
    const { people, currentUser } = await getVerifiedPeople(token, context.userId);
    return {
      members: people.map(p => ({ ...p, you: p.id === context.userId })),
      currentUserIsAdmin: currentUser.role === "admin",
      currentUserId: context.userId,
    };
  });

export const getSpacetimeBreakouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = process.env['SPACETIMEDB_OWNER_TOKEN'];
    if (!token) throw new Error("SpacetimeDB is awaiting secure activation.");
    const { getVerifiedPeople, readBreakouts } = await import("./spacetimedb.server");
    await getVerifiedPeople(token, context.userId);
    return { breakouts: await readBreakouts(token) };
  });

export const updateSpacetimeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]) }))
  .handler(async ({ context, data }) => {
    const token = process.env['SPACETIMEDB_OWNER_TOKEN'];
    if (!token) throw new Error("SpacetimeDB is awaiting secure activation.");
    const { getVerifiedPeople, callRoleChange } = await import("./spacetimedb.server");
    const { currentUser, people } = await getVerifiedPeople(token, context.userId);
    if (currentUser.role !== "admin") throw new Error("Only administrators can change roles.");
    if (context.userId === data.userId) throw new Error("You cannot change your own role.");
    if (!people.some(p => p.id === data.userId)) throw new Error("Member not found.");
    await callRoleChange(token, encodeRoleChange(context.userId, data.userId, data.role));
    const updated = await getVerifiedPeople(token, context.userId);
    if (updated.people.find(p => p.id === data.userId)?.role !== data.role) throw new Error("Role update could not be confirmed.");
    return { ok: true };
  });