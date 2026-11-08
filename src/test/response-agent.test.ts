import { describe, it, expect } from "vitest";
import { actions, checkAction, matchDocuments, placeholderReply } from "../lib/response-agent.js";

describe("ported HackUTD action rules", () => {
  it.each(["isolate_website", "quarantine_files", "kill_process", "restore_backup_snapshot"])("requires human approval for %s", name => {
    expect(checkAction(name, Object.keys(actions), false).allowed).toBe(false);
    expect(checkAction(name, Object.keys(actions), true).allowed).toBe(true);
  });
  it.each(["quarantine_files", "kill_process"])("requires isolation before %s", name => {
    expect(checkAction(name, [], true).allowed).toBe(false);
    expect(checkAction(name, ["isolate_website"], true).allowed).toBe(true);
  });
  it("requires both quarantine and termination before restore", () => {
    expect(checkAction("restore_backup_snapshot", ["quarantine_files"], true).allowed).toBe(false);
    expect(checkAction("restore_backup_snapshot", ["kill_process"], true).allowed).toBe(false);
    expect(checkAction("restore_backup_snapshot", ["quarantine_files", "kill_process"], true).allowed).toBe(true);
  });
  it("requires restore before verification", () => {
    expect(checkAction("verify_system", []).allowed).toBe(false);
    expect(checkAction("verify_system", ["restore_backup_snapshot"]).allowed).toBe(true);
  });
  it("rejects an unknown tool", () => expect(checkAction("delete_database", [], true).allowed).toBe(false));
  it("grounds text search only in matching legal and playbook records", () => {
    const docs = [
      { id: "p1", title: "DDoS response", content: "Rate limit network traffic", category: "Playbook" },
      { id: "j1", title: "DDoS journal", content: "traffic", category: "Journal" },
      { id: "l1", title: "Privacy", content: "Personal data", category: "Legal" },
    ];
    expect(matchDocuments(docs, "DDoS traffic").map(d => d.id)).toEqual(["p1"]);
    expect(matchDocuments(docs, "ransomware")).toEqual([]);
  });
  it("keeps the placeholder tied to the actual incident", () => {
    const text = placeholderReply({ id: "a", description: "SYN flooding", system: "network-edge", status: "detected" }, []);
    expect(text).toContain("SYN flooding");
    expect(text).toContain("network-edge");
  });
});