import { SPACETIMEDB_URL, encodeProvision, decodeRole, decodeSqlRows, decodeTimestamp, decodeUuid, textField } from "./spacetimedb-wire";

type Schema = {
  tables?: { name: string; table_access?: { Private?: unknown } }[];
  reducers?: { name: string }[];
};

export type ModuleMode = "protected" | "demo";

async function fetchSchema(token: string): Promise<Schema> {
  if (!token) throw new Error("SpacetimeDB activation requires a securely stored owner token.");
  const response = await fetch(`${SPACETIMEDB_URL}/schema?version=9`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Cannot verify SpacetimeDB access protections.");
  return await response.json() as Schema;
}

const REQUIRED_TABLES = ["person", "breakout", "documents"];

function isProtected(schema: Schema) {
  return schema.tables?.length === 3 && REQUIRED_TABLES.every(name =>
    schema.tables?.some(table => table.name === name && table.table_access && "Private" in table.table_access),
  ) && ["update_person_role", "provision_person"].every(name => schema.reducers?.some(r => r.name === name));
}

// No env reads or credentials at module scope. Token comes only from authenticated handlers.
export async function verifyProtectedModule(token: string): Promise<void> {
  if (!isProtected(await fetchSchema(token))) {
    throw new Error("The protected SpacetimeDB module must be published before activation.");
  }
}

/**
 * Hackathon demo: the owner chose to run against the original public module with mock data.
 * Demo mode reads only; it never writes new members or roles into public tables.
 */
export async function detectModuleMode(token: string): Promise<ModuleMode> {
  const schema = await fetchSchema(token);
  if (isProtected(schema)) return "protected";
  if (REQUIRED_TABLES.every(name => schema.tables?.some(t => t.name === name))) return "demo";
  throw new Error("The SpacetimeDB database is missing the person, breakout and documents tables.");
}

async function readRows(token: string, table: "person" | "breakout" | "documents") {
  const response = await fetch(`${SPACETIMEDB_URL}/sql`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: `SELECT * FROM ${table}`, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("SpacetimeDB records could not be read.");
  return decodeSqlRows(await response.text());
}

export type Member = { id: string; name: string; email: string; role: ReturnType<typeof decodeRole> };

async function readPeople(token: string): Promise<Member[]> {
  return (await readRows(token, "person")).map(row => ({
    id: decodeUuid(row[0]), name: textField(row[1]), email: textField(row[3]), role: decodeRole(row[5]),
  }));
}

export async function getVerifiedPeople(token: string, userId: string) {
  await verifyProtectedModule(token);
  const people = await readPeople(token);
  if (new Set(people.map(p => p.id)).size !== people.length) throw new Error("Duplicate member identities must be reconciled before activation.");
  const currentUser = people.find(p => p.id === userId);
  if (!currentUser) throw new Error("Your verified account has not been migrated to SpacetimeDB yet.");
  return { people, currentUser, mode: "protected" as ModuleMode };
}

/** Demo mode: match the signed-in account by email; unknown accounts view as a plain user without being written. */
async function getDemoPeople(token: string, userId: string, name: string, email: string) {
  const people = await readPeople(token);
  const match = email ? people.find(p => p.email.trim().toLowerCase() === email.trim().toLowerCase()) : undefined;
  const currentUser: Member = match ?? { id: userId, name, email, role: "user" };
  return { people: match ? people : [...people, currentUser], currentUser, mode: "demo" as ModuleMode };
}

export async function readBreakouts(token: string) {
  return (await readRows(token, "breakout")).map(row => ({
    id: decodeUuid(row[0]), startTime: decodeTimestamp(row[1]), status: textField(row[2]),
    system: textField(row[3]), description: textField(row[4]),
  }));
}

export async function readAgentDocuments(token: string) {
  const categories = ["Legal", "CompanyPolicy", "Playbook", "Journal"];
  return (await readRows(token, "documents")).map(row => {
    const categoryValue = row[2];
    const tag = Array.isArray(categoryValue) ? Number(categoryValue[0]) :
      categoryValue && typeof categoryValue === "object" ? Object.keys(categoryValue)[0] : undefined;
    const category = typeof tag === "number" || (typeof tag === "string" && /^\d+$/.test(tag))
      ? categories[Number(tag)] : tag;
    if (!category || !categories.includes(category)) throw new Error("Invalid document category.");
    return { id: decodeUuid(row[0]), title: textField(row[1]), category, content: textField(row[3]) };
  });
}

/** Ensure the signed-in account has a person row; new members always start as "user". */
export async function ensurePerson(token: string, userId: string, name: string, email: string) {
  if (await detectModuleMode(token) === "demo") return getDemoPeople(token, userId, name, email);
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