# SpacetimeDB replacement

- [x] Save a valid owner token through secure project secrets.
- [x] Deploy the protected module without deleting records (all three tables private; outsiders blocked).
- [x] Copy accounts (admins stay admin, others user) and incidents into SpacetimeDB; demote the unverified old admin record.
- [x] Switch command center, team, and sidebar profile to SpacetimeDB; auto-enrol new sign-ups as user.
- [x] Verify signed-in reads and admin role change + reload against SpacetimeDB.

# HackUTD JavaScript agent

- [ ] Convert the action catalog and grounded response workflow to JavaScript.
- [ ] Connect incident and document context to authenticated SpacetimeDB reads; refresh the dashboard automatically.
- [ ] Add an incident-response dialog with an explicitly labelled Ollama placeholder and future Nemotron adapter.
- [ ] Test action prerequisites and the signed-in dashboard flow.
- [ ] Verify live model calls and remote remediation (requires reachable Ollama service and missing tool backend).
