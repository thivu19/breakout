// Public identities (not credentials): the database owner and the app's server identity.
export const MODULE_OWNER = "c200b546c2f4306bf710dd614842576ace632b3fd3d491131a1efd07ce55be39";
export const APP_SERVICE = "c200b546c2f4306bf710dd614842576ace632b3fd3d491131a1efd07ce55be39";
const TRUSTED = new Set([MODULE_OWNER, APP_SERVICE]);

export function requireModuleOwner(sender: string) {
  if (!TRUSTED.has(sender.replace(/^0x/, "").toLowerCase())) {
    throw new Error("Only the trusted application service can write to this database.");
  }
}

export function validateRoleChange(actorIsAdmin: boolean, actorId: string, targetId: string) {
  if (!actorIsAdmin) throw new Error("Only administrators can change roles.");
  if (actorId === targetId) throw new Error("You cannot change your own role.");
}