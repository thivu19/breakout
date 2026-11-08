// The published module owner's identity is public metadata, not a credential.
export const MODULE_OWNER = "c200b546c2f4306bf710dd614842576ace632b3fd3d491131a1efd07ce55be39";

export function requireModuleOwner(sender: string) {
  if (sender.replace(/^0x/, "").toLowerCase() !== MODULE_OWNER) {
    throw new Error("Only the trusted application service can write to this database.");
  }
}

export function validateRoleChange(actorIsAdmin: boolean, actorId: string, targetId: string) {
  if (!actorIsAdmin) throw new Error("Only administrators can change roles.");
  if (actorId === targetId) throw new Error("You cannot change your own role.");
}