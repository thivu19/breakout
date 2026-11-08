# SpacetimeDB replacement

- [x] Save the replacement owner token through secure project secrets.
- [ ] Deploy the protected module without deleting existing records: blocked because SpacetimeDB rejects the replacement token with HTTP 401.
- [x] Verify the published three-table module: reachable, but tables are public and reducers are unrestricted.
- [x] Prepare a private three-table module, protected role editing, staged authenticated adapter, and precision-safe record decoding without deleting Cloud data.
- [ ] Activate simplified screens and migrate records: blocked on the owner publishing the protected external module and replacing the saved token (SpacetimeDB rejected it with HTTP 401); existing account UUIDs and trusted roles must be reconciled first.
- [ ] Verify signed-in reads and administrator role editing against SpacetimeDB: blocked on secure external activation.