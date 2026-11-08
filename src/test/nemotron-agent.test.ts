import { afterEach, describe, expect, it, vi } from "vitest";
import { runAgent, indexDocument, agentConfig } from "../lib/ai/agent.server.js";
import { sourceHash } from "../lib/ai/weaviate.server.js";
import { parsePlan, toolTemplates } from "../lib/ai/tools.js";

const config = agentConfig({ NVIDIA_API_KEY: "test-credential", WEAVIATE_URL: "https://weaviate.example.test", WEAVIATE_API_KEY: "test-credential" });
const docs = [
  { id: "11111111-1111-4111-8111-111111111111", title: "Policy", category: "CompanyPolicy", content: "Record evidence." },
  { id: "22222222-2222-4222-8222-222222222222", title: "Journal", category: "Journal", content: "Network flood investigation." },
];
const incident = { id: "33333333-3333-4333-8333-333333333333", description: "SYN flooding", system: "edge", status: "detected" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

describe("Nemotron retrieval agent", () => {
  it("requests exactly two Weaviate references and passes full SpacetimeDB documents to Nemotron", async () => {
    const refs = await Promise.all(docs.map(async doc => ({ properties: { documentId: doc.id, sourceHash: await sourceHash(doc) } })));
    const fetcher = vi.fn().mockResolvedValueOnce(response({ data: [{ embedding: [0.1, 0.2] }] }))
      .mockResolvedValueOnce(response({ results: refs }))
      .mockResolvedValueOnce(response({ choices: [{ message: { content: JSON.stringify({ analysis: "Review policy and journal.", actions: [] }) } }] }));
    vi.stubGlobal("fetch", fetcher);
    const loader = vi.fn().mockResolvedValue(docs);
    const result = await runAgent({ incident, question: "Investigate", loadDocuments: loader, config });
    const search = JSON.parse(fetcher.mock.calls[1]?.[1].body);
    expect(search.limit).toBe(2);
    expect(fetcher.mock.calls[1]?.[0]).toContain("/v1/search/BreakoutDocumentSummary/near-vector");
    expect(loader).toHaveBeenCalledWith(docs.map(doc => doc.id));
    const prompt = JSON.parse(JSON.parse(fetcher.mock.calls[2]?.[1].body).messages[1].content);
    expect(prompt.documents[0].content).toBe("Record evidence.");
    expect(prompt.documents[1].category).toBe("Journal");
    expect(result.execution).toBe("disabled");
  });
  it("rejects stale summaries instead of passing outdated documents to the model", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ data: [{ embedding: [1] }] }))
      .mockResolvedValueOnce(response({ results: [{ properties: { documentId: docs[0]?.id, sourceHash: "outdated" } }] }));
    vi.stubGlobal("fetch", fetcher);
    await expect(runAgent({ incident, question: "Investigate", loadDocuments: async () => docs, config })).rejects.toThrow("index is stale");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each(["Legal", "CompanyPolicy", "Playbook", "Journal"])("indexes %s summaries and IDs without copying full source content", async category => {
    const document = { ...docs[0], id: docs[0]?.id ?? "", title: "Source", category, content: "FULL PRIVATE SOURCE" };
    const properties = ["documentId", "summary", "title", "category", "sourceHash", "workspace", "embeddingModel", "summaryModel"].map(name => ({ name }));
    const fetcher = vi.fn().mockResolvedValueOnce(response({ vectorizer: "none", properties }))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ choices: [{ message: { content: "Evidence summary" } }] }))
      .mockResolvedValueOnce(response({ data: [{ embedding: [1, 2] }] }))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ id: document.id }));
    vi.stubGlobal("fetch", fetcher);
    await indexDocument(document, config);
    const object = JSON.parse(fetcher.mock.calls[5]?.[1].body);
    expect(object.id).toBe(document.id);
    expect(object.properties.documentId).toBe(document.id);
    expect(object.properties.summary).toBe("Evidence summary");
    expect(object.properties.category).toBe(category);
    expect(JSON.stringify(object)).not.toContain("FULL PRIVATE SOURCE");
    expect(JSON.parse(fetcher.mock.calls[3]?.[1].body).input_type).toBe("passage");
  });
  it.each(Object.keys(toolTemplates))("keeps %s as a non-executing TODO", async name => {
    await expect(toolTemplates[name]?.execute()).rejects.toThrow("not implemented");
  });
  it("validates tool names and input values before displaying proposals", () => {
    expect(() => parsePlan(JSON.stringify({ analysis: "Test", actions: [{ tool: "delete_database", arguments: {}, reason: "Test" }] }))).toThrow("unknown tool");
    expect(() => parsePlan(JSON.stringify({ analysis: "Test", actions: [{ tool: "kill_process", arguments: { pid: -1 }, reason: "Test" }] }))).toThrow("invalid arguments");
    const plan = parsePlan(JSON.stringify({ analysis: "Review logs", actions: [{ tool: "request_logs", arguments: { keyword: "edge", minutes: 10 }, reason: "Find evidence" }] }));
    expect(plan.proposals[0]?.execution).toBe("TODO");
  });
});