import { summarizeDocument, embed, reasonAboutIncident, DEFAULT_CHAT_MODEL, DEFAULT_EMBED_MODEL } from "./nemotron.server.js";
import { ensureCollection, getReference, saveReference, sourceHash, topReferences, pruneReferences } from "./weaviate.server.js";

export function agentConfig(env) {
  return {
    nvidia: { apiKey: env.NVIDIA_API_KEY?.trim(), model: env.NEMOTRON_MODEL?.trim() || DEFAULT_CHAT_MODEL, embeddingModel: env.NVIDIA_EMBED_MODEL?.trim() || DEFAULT_EMBED_MODEL },
    weaviate: { url: env.WEAVIATE_URL?.trim(), apiKey: env.WEAVIATE_API_KEY?.trim() },
  };
}

export async function indexDocument(document, config) {
  if (!["Legal", "CompanyPolicy", "Playbook", "Journal"].includes(document.category)) throw new Error("Unsupported document category.");
  await ensureCollection(config.weaviate);
  const hash = await sourceHash(document);
  const previous = await getReference(document.id, config.weaviate);
  if (previous?.sourceHash === hash && previous.embeddingModel === config.nvidia.embeddingModel && previous.summaryModel === config.nvidia.model) {
    return { id: document.id, status: "unchanged" };
  }
  const summary = await summarizeDocument(document, config.nvidia);
  const vector = await embed(`${document.title}\n${document.category}\n${summary}`, "passage", config.nvidia);
  await saveReference(document, summary, vector, hash, config.nvidia, config.weaviate);
  return { id: document.id, status: "indexed" };
}

export async function reconcileIndex(documentIds, config) {
  await ensureCollection(config.weaviate);
  return pruneReferences(documentIds, config.weaviate);
}

export async function runAgent({ incident, question, loadDocuments, config }) {
  const vector = await embed(`${incident.description}\n${incident.system}\n${question}`, "query", config.nvidia);
  const references = await topReferences(vector, config.nvidia.embeddingModel, config.weaviate);
  const ids = references.map(reference => reference?.documentId);
  if (ids.some(id => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error("Weaviate returned invalid or duplicate SpacetimeDB document IDs.");
  }
  const sourceDocuments = await loadDocuments(ids);
  const documents = [];
  for (const reference of references) {
    const document = sourceDocuments.find(doc => doc.id === reference.documentId);
    if (!document || await sourceHash(document) !== reference.sourceHash) {
      throw new Error("The document index is stale. Re-index workspace documents before retrying.");
    }
    if (document.content.length > 100000) throw new Error("A retrieved document exceeds the model context limit.");
    documents.push(document);
  }
  const result = await reasonAboutIncident(incident, documents, question, config.nvidia);
  return { ...result, documents: documents.map(({ id, title, category }) => ({ id, title, category })), retrieval: "weaviate", execution: "disabled" };
}