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
- App data (members, roles, breakouts, documents) lives in the private SpacetimeDB module `spacetimedb/` (maincloud `breakout-5xlpr`); screens read/write it only through `requireSupabaseAuth` server functions in `src/lib/spacetimedb.functions.ts`, which hold the owner token server-side. Lovable Cloud provides sign-in only; its old app tables are kept as a backup, not read by screens. `src/lib/breakout-data.ts` remains only for static UI fixtures.
- SpacetimeDB reducers accept writes only from trusted identities in `spacetimedb/src/access.ts`; new accounts are auto-enrolled as `user`, and admin is granted only by an existing admin — never trust client-supplied roles or identities.
- Shared screen chrome (sidebar, top bar, auth split layout) lives in `src/components/breakout/`; new app pages wrap their content in `AppShell`.
- AI orchestration lives in native JavaScript under `src/lib/ai/`; authenticated functions index Nemotron summaries and source IDs in a dedicated Weaviate collection, retrieve two references and hydrate verified current SpacetimeDB documents. Admin-only per-document indexing bounds request work; source hashes reject stale references. Five remediation templates remain non-executing TODOs because trusted tools and durable approvals are absent.
- Dashboard incident reads poll only while visible through TanStack Query; no persistent background loop or claim of native SpacetimeDB streaming is made.
- Authenticated route failures render shared workspace chrome and a recoverable connection boundary; keep protection checks fail-closed and never substitute empty records or cached roles after a failed verification.
