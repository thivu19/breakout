# SpacetimeDB replacement

- [x] Save a valid owner token through secure project secrets.
- [x] Deploy the protected module without deleting records (all three tables private; outsiders blocked).
- [x] Copy accounts (admins stay admin, others user) and incidents into SpacetimeDB; demote the unverified old admin record.
- [x] Switch command center, team, and sidebar profile to SpacetimeDB; auto-enrol new sign-ups as user.
- [x] Verify signed-in reads and admin role change + reload against SpacetimeDB.

# HackUTD JavaScript agent

- [ ] Add isolated JavaScript AI modules for Nemotron summaries, Weaviate indexing/top-two retrieval, and SpacetimeDB document hydration.
- [ ] Add five non-executing tool templates and structured Nemotron action proposals.
- [ ] Request missing secure NVIDIA and Weaviate settings, test retrieval boundaries, and verify the signed-in workflow.

- [x] Convert the action catalog and grounded response workflow to JavaScript.
- [x] Wire incident and document context to authenticated SpacetimeDB reads; add visible-dashboard polling.
- [x] Add an incident-response dialog with an explicitly labelled Ollama placeholder and future Nemotron adapter.
- [x] Test action prerequisites and provider boundaries.
- [ ] Verify the signed-in dashboard/dialog on desktop and mobile (blocked: remote module currently has public tables and lacks protected reducers; safety gate correctly rejects it).
- [ ] Verify live model calls and remote remediation (requires reachable Ollama service and missing tool backend).
- [ ] Restore equivalent vector indexing and external endpoint/caller cutover (requires Weaviate/embedding service, missing source data and caller details).

# Preview error recovery

- [x] Handle blocked SpacetimeDB reads with shared workspace navigation, a safe connection message and working retry.
- [x] Verify the Radix dialog opens and closes on a fresh browser load; the reported hook error came from a stale optimized dependency graph.
- [x] Test retry behavior and check the signed-in connection screen.
