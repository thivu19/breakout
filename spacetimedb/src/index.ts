import { schema, table, t } from "spacetimedb/server";
import { requireModuleOwner, validateRoleChange } from "./access";

const UserType = t.enum("UserType", ["user", "admin"]);
const Category = t.enum("Category", ["Legal", "CompanyPolicy", "Playbook", "Journal"]);

// Keep the original three table layouts; private reads require the owner's token.
const db = schema({
  person: table({ public: false }, {
    id: t.uuid(), name: t.string(), birthday: t.string(), email: t.string(),
    phone: t.string(), usertype: UserType,
  }),
  breakout: table({ public: false }, {
    id: t.uuid(), startTime: t.timestamp(), status: t.string(),
    system: t.string(), description: t.string(),
  }),
  documents: table({ public: false }, {
    id: t.uuid(), title: t.string(), category: Category, content: t.string(),
    file_name: t.string(), created_at: t.timestamp(), created_by: t.string(),
  }),
});
export default db;
export const init = db.init(() => {});
export const onConnect = db.clientConnected(() => {});
export const onDisconnect = db.clientDisconnected(() => {});

export const addPerson = db.reducer({
  name: t.string(), birthday: t.string(), email: t.string(), phone: t.string(), usertype: UserType,
}, (ctx, fields) => {
  requireModuleOwner(ctx.sender.toHexString());
  ctx.db.person.insert({ id: ctx.newUuidV4(), ...fields });
});

// Only the verified app service can provision Cloud-authenticated UUIDs.
// Existing imported identities must be reconciled before activating the adapter.
export const provisionPerson = db.reducer({
  id: t.uuid(), name: t.string(), email: t.string(), usertype: UserType,
}, (ctx, fields) => {
  requireModuleOwner(ctx.sender.toHexString());
  const matches = [...ctx.db.person.iter()].filter(p => p.id.toString() === fields.id.toString());
  for (const row of matches) ctx.db.person.delete(row);
  ctx.db.person.insert({ ...fields, birthday: "", phone: "" });
});

export const updatePersonRole = db.reducer({
  actor_id: t.uuid(), person_id: t.uuid(), usertype: UserType,
}, (ctx, { actor_id, person_id, usertype }) => {
  requireModuleOwner(ctx.sender.toHexString());
  const people = [...ctx.db.person.iter()];
  const actors = people.filter(p => p.id.toString() === actor_id.toString());
  const targets = people.filter(p => p.id.toString() === person_id.toString());
  if (actors.length !== 1 || targets.length !== 1) throw new Error("Member identity must be unique.");
  const actor = actors[0];
  const target = targets[0];
  if (!actor || !target) throw new Error("Member not found.");
  validateRoleChange(actor.usertype.tag === "admin", actor_id.toString(), person_id.toString());
  ctx.db.person.delete(target);
  ctx.db.person.insert({ ...target, usertype });
});

export const addBreakout = db.reducer({
  status: t.string(), system: t.string(), description: t.string(),
}, (ctx, fields) => {
  requireModuleOwner(ctx.sender.toHexString());
  ctx.db.breakout.insert({ id: ctx.newUuidV4(), startTime: ctx.timestamp, ...fields });
});

export const addDocument = db.reducer({
  title: t.string(), category: Category, content: t.string(), file_name: t.string(), created_by: t.string(),
}, (ctx, fields) => {
  requireModuleOwner(ctx.sender.toHexString());
  ctx.db.documents.insert({ id: ctx.newUuidV4(), created_at: ctx.timestamp, ...fields });
});