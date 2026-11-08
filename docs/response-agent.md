# Nemotron / Weaviate response agent

AI logic lives in `src/lib/ai/` as JavaScript. The original action catalog remains in `src/lib/response-agent.js`. No archived credentials or Python runtime are imported.

## Current workflow

Open the robot beside an incident. An administrator uses **Index documents** to summarize each Legal, CompanyPolicy, Playbook, and Journal document with Nemotron, embed the summary with NVIDIA, and upsert it in the dedicated `BreakoutDocumentSummary` Weaviate collection. Each object uses its SpacetimeDB document UUID and holds title/category, summary, source hash, workspace and model identifiers; full source content stays in SpacetimeDB. Indexing runs one document per authenticated request and skips unchanged hashes/models. Reconciliation removes references to deleted source documents.

**Review incident** embeds the question plus current incident, queries Weaviate's REST near-vector search with `limit: 2`, then hydrates those IDs from private SpacetimeDB. Source hashes must match; stale/missing documents stop the run and require re-indexing. Nemotron receives the incident and full retrieved documents, and returns validated JSON analysis and tool proposals. There is no text-match or fabricated-response fallback. Empty indexes yield no source documents, which the model must disclose. Documents above 100,000 characters must be split before indexing; they are not silently truncated.

## Provider configuration

Configure server-side values securely, never in browser code or a committed environment file:

- `NVIDIA_API_KEY`: rotated NVIDIA API credential, securely saved.
- `WEAVIATE_URL`: full HTTPS cluster origin, without `/v1` or other paths.
- `WEAVIATE_API_KEY`: cluster API credential with access to schema, objects and search.
- Optional `NEMOTRON_MODEL`: defaults to `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, verified callable on November 8, 2026. The text Nano aliases returned 404/410 despite appearing in catalog metadata; no silent provider/model fallback is used.
- Optional `NVIDIA_EMBED_MODEL`: defaults to `nvidia/nemotron-3-embed-1b`, verified with 2048-dimensional vectors. Re-index after changing either model.
- Existing `SPACETIMEDB_OWNER_TOKEN` stays server-only.

Requires Weaviate REST search (1.39.7+, verified cluster 1.40.3); no deprecated GraphQL dependency. Model errors stop the run. Both service credentials stay inside authenticated server handlers. Indexing/reconciliation require the current SpacetimeDB admin role, checked server-side; reviews require a verified member. Publish to update the deployed app.

## Missing source capabilities

The ZIP does not contain the referenced `spacetime.py`, the Node `/tools/*` backend, or legal Markdown files. Current SpacetimeDB documents and the configured Weaviate service replace the missing retrieval bridge. Remote logs, isolation, quarantine, process termination, restoration, verification, live token streaming, persistent approval runs, and `/health`, `/reindex`, `/ws` caller cutover remain unimplemented. No destructive execution button is exposed. Live verification indexed three existing playbooks and returned two document IDs with a validated request-logs proposal; Legal/CompanyPolicy/Journal indexing is covered by tests but no real documents of those categories were available in the verified workspace.

`src/lib/ai/tools.js` contains the five remediation templates: `isolate_website`, `quarantine_files`, `kill_process`, `restore_backup_snapshot`, and `verify_system`. Every handler throws an explicit not-implemented error. The three source retrieval/log requests remain in the eight-action catalog, but are also not executable tool calls. Model proposals never grant approvals or imply prerequisites completed. Connect a trusted tool service and durable server-owned approvals before implementing execution. SpacetimeDB remains authoritative; Cloud sign-in, records and roles are unchanged.