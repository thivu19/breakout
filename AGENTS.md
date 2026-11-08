<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The UI is a dark-only operations console; all colors live as oklch tokens in `src/styles.css` and components use semantic utilities only (no light/dark switching).
- App data lives in Lovable Cloud (profiles, user_roles, breakouts, documents, scope_items, auto_runs, audit_events); screens read it through the `createServerFn` functions in `src/lib/breakout.functions.ts` (all gated by `requireSupabaseAuth`). `src/lib/breakout-data.ts` remains only for static UI fixtures (KPIs, permission matrix, containment demo).
- The SpacetimeDB adapter is staged, not active: keep Cloud reads until the private three-table module is deployed, an owner token is stored securely, verified account UUIDs/roles are reconciled, and migrated data reads back; this prevents exposure or privilege escalation from the previously public module. SpacetimeDB access must go through authenticated server functions, with no shared token in browser code.
- Shared screen chrome (sidebar, top bar, auth split layout) lives in `src/components/breakout/`; new app pages wrap their content in `AppShell`.
