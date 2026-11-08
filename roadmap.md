# SpacetimeDB replacement

- [x] Save a valid owner token through secure project secrets (accepted by SpacetimeDB).
- [x] Deploy the protected module without deleting records: all three tables now private; outsiders cannot read or write; existing rows preserved (1 person, 1 breakout, 0 documents).
- [x] Prepare private three-table module, protected role editing, staged authenticated adapter, precision-safe decoding.
- [ ] Reconcile accounts: map each signed-in account to a `person` row with a trusted role (admin from the existing roles store, everyone else `user`). Needs the user's go-ahead because it writes to SpacetimeDB.
- [ ] Switch command center and team screens to SpacetimeDB (two roles, no audit history, simplified incident fields).
- [ ] Verify signed-in reads and admin role editing against SpacetimeDB.
