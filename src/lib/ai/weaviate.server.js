export const COLLECTION = "BreakoutDocumentSummary";
export const WORKSPACE = "breakout-5xlpr";

function baseUrl(config) {
  let url;
  try { url = new URL(config.url); } catch { throw new Error("Configure WEAVIATE_URL with the full cluster HTTPS address."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new Error("WEAVIATE_URL must be a secured HTTPS cluster address without a path.");
  }
  if (!config.apiKey) throw new Error("Configure WEAVIATE_API_KEY securely.");
  return url.origin;
}

async function request(config, path, method = "GET", body) {
  let response;
  const base = baseUrl(config);
  try {
    response = await fetch(`${base}/v1${path}`, {
      method, headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000), redirect: "error",
    });
  } catch { throw new Error("Weaviate could not be reached."); }
  return response;
}

async function json(response) {
  if (!response.ok) throw new Error(`Weaviate request failed (${response.status}). Check cluster access and configuration.`);
  return response.status === 204 ? null : response.json();
}

export async function sourceHash(document) {
  const bytes = new TextEncoder().encode(JSON.stringify([document.id, document.title, document.category, document.content]));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}

export async function ensureCollection(config) {
  const existing = await request(config, `/schema/${COLLECTION}`);
  if (existing.ok) {
    const schema = await existing.json();
    if (schema.vectorizer !== "none" || schema.multiTenancyConfig?.enabled || !["documentId", "summary", "title", "category", "sourceHash", "workspace", "embeddingModel", "summaryModel"].every(name => schema.properties?.some(p => p.name === name))) {
      throw new Error("The Weaviate summary collection has an incompatible schema.");
    }
    return;
  }
  if (existing.status !== 404) return json(existing);
  const created = await request(config, "/schema", "POST", {
    class: COLLECTION, vectorizer: "none", vectorIndexConfig: { distance: "cosine" },
    properties: ["documentId", "summary", "title", "category", "sourceHash", "workspace", "embeddingModel", "summaryModel"].map(name => ({ name, dataType: ["text"], tokenization: ["documentId", "workspace", "sourceHash", "embeddingModel", "summaryModel"].includes(name) ? "field" : "word" })),
  });
  // Concurrent indexing may create it first; verify the resulting schema.
  if (!created.ok && created.status === 422) return ensureCollection(config);
  await json(created);
}

export async function getReference(id, config) {
  const response = await request(config, `/objects/${COLLECTION}/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  return (await json(response)).properties;
}

export async function saveReference(document, summary, vector, hash, models, config) {
  const object = { class: COLLECTION, id: document.id, properties: {
    documentId: document.id, title: document.title, category: document.category, summary,
    sourceHash: hash, workspace: WORKSPACE, embeddingModel: models.embeddingModel, summaryModel: models.model,
  }, vector };
  const existing = await getReference(document.id, config);
  await json(await request(config, existing ? `/objects/${COLLECTION}/${document.id}` : "/objects", existing ? "PUT" : "POST", object));
}

export async function topReferences(vector, embeddingModel, config) {
  const response = await request(config, `/search/${COLLECTION}/near-vector`, "POST", {
    vector, limit: 2, returnProperties: ["documentId", "sourceHash", "summary", "category", "title"],
    returnMetadata: ["distance"], where: { operator: "And", operands: [
      { path: ["workspace"], operator: "Equal", valueText: WORKSPACE },
      { path: ["embeddingModel"], operator: "Equal", valueText: embeddingModel },
    ] },
  });
  if (response.status === 404) throw new Error("Document index is missing, or this cluster does not support REST search. Index documents on Weaviate 1.39.7 or newer.");
  const payload = await json(response);
  if (!Array.isArray(payload?.results)) throw new Error("Weaviate returned invalid document references.");
  return payload.results.slice(0, 2).map(result => result.properties);
}

export async function pruneReferences(documentIds, config) {
  const keep = new Set(documentIds);
  let offset = 0;
  const stale = [];
  // Gather before deleting, otherwise offsets shift and leave stale references.
  for (;;) {
    const result = await json(await request(config, `/objects?class=${COLLECTION}&limit=100&offset=${offset}`));
    const objects = result?.objects;
    if (!Array.isArray(objects)) throw new Error("Weaviate returned an invalid index manifest.");
    for (const object of objects) if (object.properties?.workspace === WORKSPACE && !keep.has(object.properties.documentId)) stale.push(object.id);
    if (objects.length < 100) break;
    offset += objects.length;
  }
  for (const id of stale) await json(await request(config, `/objects/${COLLECTION}/${encodeURIComponent(id)}`, "DELETE"));
  return { removed: stale.length };
}