import { parse, parseNumberAndBigInt, stringify } from "lossless-json";
import { Uuid } from "spacetimedb";

export const SPACETIMEDB_URL = "https://maincloud.spacetimedb.com/v1/database/breakout-5xlpr";
export type SpacetimeRole = "admin" | "user";

export function decodeSqlRows(body: string): unknown[][] {
  const results: unknown = parse(body, undefined, parseNumberAndBigInt);
  if (!Array.isArray(results) || results.length !== 1) throw new Error("Invalid database response.");
  const statement = results[0];
  if (!statement || typeof statement !== "object" || !Array.isArray(statement.rows)) {
    throw new Error("Invalid database response.");
  }
  if (!statement.rows.every(Array.isArray)) throw new Error("Invalid database rows.");
  return statement.rows;
}

function firstField(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 1) throw new Error("Invalid database field.");
  return value[0];
}

export function decodeUuid(value: unknown): string {
  const n = firstField(value);
  if (typeof n !== "bigint" && typeof n !== "number") throw new Error("Invalid member identifier.");
  if (typeof n === "number" && !Number.isSafeInteger(n)) throw new Error("Imprecise member identifier.");
  return new Uuid(BigInt(n)).toString();
}

export function decodeTimestamp(value: unknown): string {
  const n = firstField(value);
  if (typeof n !== "bigint" && typeof n !== "number") throw new Error("Invalid timestamp.");
  const ms = Number(BigInt(n) / 1000n);
  if (!Number.isSafeInteger(ms)) throw new Error("Invalid timestamp.");
  return new Date(ms).toISOString();
}

export function decodeRole(value: unknown): SpacetimeRole {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid role.");
  const keys = Object.keys(value);
  if (keys.length !== 1) throw new Error("Invalid role.");
  if (keys[0] === "0" || keys[0] === "user") return "user";
  if (keys[0] === "1" || keys[0] === "admin") return "admin";
  throw new Error("Invalid role.");
}

export function encodeRoleChange(actorId: string, targetId: string, role: SpacetimeRole): string {
  const encoded = stringify([
    [Uuid.parse(actorId).asBigInt()],
    [Uuid.parse(targetId).asBigInt()],
    { [role === "admin" ? "1" : "0"]: [] },
  ]);
  if (!encoded) throw new Error("Cannot encode role change.");
  return encoded;
}

export function textField(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid database text field.");
  return value;
}