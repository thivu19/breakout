import { SPACETIMEDB_URL, encodeProvision, decodeRole, decodeSqlRows, decodeTimestamp, decodeUuid, textField } from "./spacetimedb-wire";

type Schema = {
  tables?: { name: string; table_access?: { Private?: unknown } }[];
  reducers?: { name: string }[];
};

// No env reads or credentials at module scope. Token comes only from authenticated handlers.
export async function verifyProtectedModule(token: string): Promise<void> {
  if (!token) throw new Error("SpacetimeDB activation requires a securely stored owner token.");
  const response = await fetch(`${SPACETIMEDB_URL}/schema?version=9`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Cannot verify SpacetimeDB access protections.");
  const schema = await response.json() as Schema;
  const required = ["person", "breakout", "documents"];
  if (schema.tables?.length !== 3 || !required.every(name =>
    schema.tables?.some(table => table.name === name && table.table_access && "Private" in table.table_access),
  ) || !["update_person_role", "provision_person"].every(name => schema.reducers?.some(r => r.name === name))) {
    throw new Error("The protected SpacetimeDB module must be published before activation.");
  }
}

async function readRows(token: string, table: "person" | "breakout" | "documents") {
  const response = await fetch(`${SPACETIMEDB_URL}/sql`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: `SELECT * FROM ${table}`, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("SpacetimeDB records could not be read.");
  return decodeSqlRows(await response.text());
}

export async function getVerifiedPeople(token: string, userId: string) {
  await verifyProtectedModule(token);
  const people = (await readRows(token, "person")).map(row => ({
    id: decodeUuid(row[0]), name: textField(row[1]), email: textField(row[3]), role: decodeRole(row[5]),
  }));
  if (new Set(people.map(p => p.id)).size !== people.length) throw new Error("Duplicate member identities must be reconciled before activation.");
  const currentUser = people.find(p => p.id === userId);
  if (!currentUser) throw new Error("Your verified account has not been migrated to SpacetimeDB yet.");
  return { people, currentUser };
}

export async function readBreakouts(token: string) {
  return (await readRows(token, "breakout")).map(row => ({
    id: decodeUuid(row[0]), startTime: decodeTimestamp(row[1]), status: textField(row[2]),
    system: textField(row[3]), description: textField(row[4]),
  }));
}

/** Ensure the signed-in account has a person row; new members always start as "user". */
export async function ensurePerson(token: string, userId: string, name: string, email: string) {
  try {
    return await getVerifiedPeople(token, userId);
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("not been migrated")) throw err;
  }
  const response = await fetch(`${SPACETIMEDB_URL}/call/provision_person`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: encodeProvision(userId, name, email), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Your account could not be added to the workspace.");
  return getVerifiedPeople(token, userId);
}

export async function callRoleChange(token: string, body: string) {
  const response = await fetch(`${SPACETIMEDB_URL}/call/update_person_role`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body, signal: AbortSignal.timeout(10000),
  });
  // Never expose the provider response, which may include private request context.
  if (!response.ok) throw new Error("The member’s role could not be updated in SpacetimeDB.");
}