import { afterEach, describe, expect, it, vi } from "vitest";
import { generateResponse } from "../lib/response-agent.server.js";

const incident = { id: "a", description: "SYN flooding", system: "network-edge", status: "detected" };
afterEach(() => vi.unstubAllGlobals());
describe("response provider boundary", () => {
  it("makes no external request in placeholder mode", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const result = await generateResponse({ incident, documents: [], question: "Investigate", config: { provider: "ollama" } });
    expect(result.provider).toBe("placeholder");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends real context to the configured OpenAI-compatible model", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Review network logs." } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const result = await generateResponse({ incident, documents: [], question: "Investigate", config: { provider: "ollama", endpoint: "https://models.example.test/v1" } });
    expect(result.provider).toBe("ollama");
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://models.example.test/v1/chat/completions");
    const body = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(body.model).toBe("qwen3:8b");
    expect(JSON.parse(body.messages[1].content).incident.system).toBe("network-edge");
    expect(body.tools).toBeUndefined();
  });
  it("does not fabricate success when a provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Private provider detail", { status: 401 })));
    await expect(generateResponse({ incident, documents: [], question: "Investigate", config: { provider: "ollama", endpoint: "https://models.example.test/v1" } })).rejects.toThrow("The model service rejected the request.");
  });
  it("requires explicit NVIDIA model and credentials", async () => {
    await expect(generateResponse({ incident, documents: [], question: "Investigate", config: { provider: "nemotron", endpoint: "https://models.example.test/v1" } })).rejects.toThrow("NVIDIA Nemotron requires");
  });
});