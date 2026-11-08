import { describe, expect, it } from "vitest";
import { MODULE_OWNER, requireModuleOwner, validateRoleChange } from "../../spacetimedb/src/access";

describe("SpacetimeDB access protections", () => {
  it("rejects writes from a non-owner identity", () => {
    expect(() => requireModuleOwner("0".repeat(64))).toThrow("trusted application service");
    expect(() => requireModuleOwner(MODULE_OWNER)).not.toThrow();
  });
  it("rejects role editing by a regular user", () => {
    expect(() => validateRoleChange(false, "actor", "other")).toThrow("Only administrators");
    expect(() => validateRoleChange(true, "actor", "other")).not.toThrow();
  });
  it("prevents administrators from changing their own role", () => {
    expect(() => validateRoleChange(true, "actor", "actor")).toThrow("own role");
  });
});