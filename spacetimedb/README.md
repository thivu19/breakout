# Protected Breakout database

This module retains exactly the supplied `person`, `breakout`, and `documents` tables. All tables are private; all write reducers require the existing published owner's identity. The caller is `ctx.sender`, not `ctx.identity` (the database identity).

## Required activation steps

1. Publish this module to **breakout-5xlpr** on **maincloud** as its current owner. Review the CLI migration report; do not clear/delete the database or accept destructive migration prompts. Back up existing records first.
2. Store the owner's SpacetimeDB bearer token in the app's secure secret form as `SPACETIMEDB_OWNER_TOKEN`. Never put this token in frontend code or browser storage.
3. Verify anonymous reads and writes are rejected and that authenticated owner reads succeed. Confirm `update_person_role` and `provision_person` are deployed.
4. Reconcile person UUIDs against verified existing account UUIDs. Copy roles only from the existing trusted role store; never inherit admin status from rows inserted into the previously public module. Regular roles collapse to `user`; administrators remain `admin`. Use `provision_person` with verified identities, not email matching at runtime. Review duplicate identities.
5. Import existing incidents and documents with explicit mappings and verify counts. Preserve Cloud records until read-back succeeds. The supplied breakout layout cannot retain severity, owner, or reference fields; avoid inventing them in the UI.
6. Activate the staged authenticated adapter. Update team and command-center screens to the two-role/three-table layout and remove audit history claims. Lovable Cloud continues to provide account sign-in only. Verify an administrator changes another member's role and the member sees the updated role after reload.

The currently active app remains on Cloud until these checks pass. Deploying the frontend does not publish this external database module.