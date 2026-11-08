import { describe, expect, it } from "vitest";
import { decodeRole, decodeSqlRows, decodeTimestamp, decodeUuid, encodeRoleChange } from "@/lib/spacetimedb-wire";

describe("SpacetimeDB record encoding", () => {
  it("preserves UUID integers above JavaScript’s safe numeric range", () => {
    const rows = decodeSqlRows('[{"rows":[[[340282366920938463463374607431768211455]]]}]');
    expect(decodeUuid(rows[0]?.[0])).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff");
  });
  it("encodes exact UUIDs for role changes", () => {
    const encoded = encodeRoleChange("ffffffff-ffff-ffff-ffff-ffffffffffff", "00000000-0000-0000-0000-000000000001", "admin");
    expect(encoded).toBe('[[340282366920938463463374607431768211455],[1],{"1":[]}]');
  });
  it("maps only the two supplied roles", () => {
    expect(decodeRole({ "0": [] })).toBe("user");
    expect(decodeRole({ "1": [] })).toBe("admin");
    expect(() => decodeRole({ "2": [] })).toThrow("Invalid role");
    // Live SQL responses use the [tag, payload] form.
    expect(decodeRole([0, []])).toBe("user");
    expect(decodeRole([1, []])).toBe("admin");
    expect(() => decodeRole([2, []])).toThrow("Invalid role");
  });
  it("decodes microsecond timestamps", () => {
    expect(decodeTimestamp([1000000n])).toBe("1970-01-01T00:00:01.000Z");
  });
});