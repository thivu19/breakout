# HackUTD response agent integration

The uploaded Python workflow is ported to JavaScript in `src/lib/response-agent.js` and `src/lib/response-agent.server.js`. No archived credentials, repository metadata or Python runtime are imported.

## Current workflow

Open the robot action beside an incident on Command center. The authenticated server reloads that incident and matching Legal/Playbook document content from the private SpacetimeDB module. Only the selected incident and up to five matching documents enter model context. User questions and document content are untrusted evidence. The dashboard refreshes every ten seconds while visible; this is polling, not a native streaming subscription.

Without a configured model endpoint, the result is explicitly marked a deterministic Ollama placeholder. No model inference or remediation is claimed. Placeholder output is grounded in current incident records. Questions reach the model only when configured. Document lookup is text matching, not vector search.

## Provider configuration

Configure server-side values securely, never in browser code or a committed environment file:

- `RESPONSE_AI_PROVIDER`: `ollama` initially, `nemotron` for the future NVIDIA adapter.
- `RESPONSE_AI_BASE_URL`: reachable HTTPS OpenAI-compatible API base ending in `/v1`; the adapter appends `/chat/completions`. Do not use localhost for a hosted app. Protect any externally exposed Ollama service with authentication and access restrictions.
- `RESPONSE_AI_MODEL`: Ollama defaults to `qwen3:8b`, matching the upload. For NVIDIA, supply the exact supported model identifier; none is invented.
- `RESPONSE_AI_API_KEY`: service authentication credential; required for Nemotron. Use secure provider configuration when connecting a live service.

Model errors do not silently downgrade to fabricated success. The endpoint is deployment-controlled, never user input. No external request occurs when it is absent. Publish after configuring production values.

## Missing source capabilities

The ZIP does not contain the referenced `spacetime.py`, the Node `/tools/*` backend, legal Markdown files, or a deployed Ollama/Weaviate service. Remote logs, isolation, quarantine, process termination, restoration, verification, live token streaming, persistent approval runs, Weaviate vector indexing, `/health`, `/reindex`, and `/ws` caller cutover are not verified or implemented as live equivalents. No destructive execution button is exposed.

The JavaScript action catalog preserves all eight source actions, human approval requirements and ordering prerequisites. Connect a trusted authenticated tool service and durable, server-owned run/approval storage before implementing execution. Client-submitted completion lists or approval flags must never authorize real commands. Weaviate remains a pending derived index; SpacetimeDB stays the source of truth. Existing Cloud sign-in, records and roles are unchanged.