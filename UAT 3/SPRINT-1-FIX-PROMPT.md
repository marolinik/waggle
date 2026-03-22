# Sprint 1: Fix All Bugs + Improvements from Retest

## Context
Read these retest reports for full details:
- `UAT 3/FINAL-RETEST-REPORT-2026-03-22.md` — master consolidated report with all bugs
- `UAT 3/RETEST-R1-INFRASTRUCTURE.md` — Round 1 (infrastructure + AI) results
- `UAT 3/RETEST-R2-UX.md` — Round 2 (UX/visual) results with per-view scores
- `UAT 3/RETEST-R3-ADVANCED.md` — Round 3 (teams, audit, storage, stress) results

All tests passed prior to these retests: 4333/4333 vitest. Build: 0 TS errors.

## CRITICAL BUG (fix first)

### BUG-R2-01: Global Search (Ctrl+K) crashes the app
- **Error:** `TypeError: Cannot read properties of undefined (reading 'subscribe')` — Zustand store subscription failure
- **Repro:** Open app → press Ctrl+K or click Search button → error boundary every time
- **Location:** Error trace points to bundled JS (`index-CT9Y9Ge1.js:32`) — likely in the Search modal/component where it subscribes to a Zustand store that isn't initialized
- **Fix:** Find the Search component (likely `SearchModal.tsx` or `CommandPalette.tsx`), check which Zustand store it subscribes to, ensure the store exists and is properly initialized before the component mounts. Add a null guard or lazy initialization.

## HIGH BUGS

### BUG-R1-02: DELETE workspace-mind frames broken
- **Symptom:** `DELETE /api/memory/frames/:id` returns 404 or false 204 for workspace-specific frames. Frames persist after "deletion".
- **Root cause:** Workspace mind SQLite DBs have their own auto-increment ID sequences (1, 2, 3…) but the DELETE route resolves IDs against the **personal** mind DB where those IDs map to different or nonexistent frames.
- **Fix:** The DELETE route must accept an optional `workspaceId` query parameter. When provided, route the delete to `server.agentState.getWorkspaceMind(workspaceId)` instead of the personal mind. Update the route in `packages/server/src/local/routes/memory.ts` (or wherever DELETE /api/memory/frames/:id is handled).

### BUG-R3-01: Audit eventType filter not applied
- **Symptom:** `GET /api/events?eventType=tool_call` returns ALL event types unfiltered (memory_delete, memory_write, tool_result, workspace_create all included)
- **Location:** `packages/server/src/local/routes/events.ts` — the query handler builds a WHERE clause but `eventType` query param is either not parsed or not included in the WHERE conditions
- **Fix:** In the events list handler, check for `request.query.eventType`, and if present, add `AND event_type = ?` to the WHERE clause with the param value bound.

## MEDIUM BUGS

### BUG-R1-03: Workspace model/budget fields missing from list endpoint
- **Symptom:** `GET /api/workspaces` returns only `id, name, group, created` — no `model` or `budgetLimit` fields
- **Fix:** Check that the workspace DB migration added `model` and `budget` columns. Then update the workspace list handler's SELECT query to include these columns. Also return them in the response mapping.

### BUG-R3-02: onboardingCompleted not returned in GET /api/settings
- **Symptom:** `PATCH /api/settings` writes `onboardingCompleted: true` successfully, but `GET /api/settings` never returns it. If localStorage is cleared, wizard re-triggers.
- **Fix:** In the settings GET handler, read `onboardingCompleted` from the config store and include it in the response object.

### BUG-R3-03: Model name validation missing at workspace creation
- **Symptom:** Workspace accepts any string as model ID (e.g., `claude-opus-4` which doesn't exist). Error only surfaces at chat-time as API 404.
- **Fix:** In the workspace create/update handler, if `model` is provided, validate it against the known models list (the same one shown in Settings → Models). Return 400 with helpful error message listing valid model IDs if invalid.

### BUG-R1-01: No content dedup on direct memory import
- **Symptom:** `POST /api/memory/frames` with identical content twice creates 2 separate frames
- **Fix:** Before inserting a new frame, compute a content hash and check if an identical frame already exists in the same workspace mind. If it does, return the existing frame instead of creating a duplicate.

### BUG-R2-02: font-mono on navigation labels (product decision: REMOVE)
- **Symptom:** Sidebar navigation buttons (Chat, Capabilities, Cockpit, Mission Control, Memory, Events, Settings) use `font-mono text-[11px]` Tailwind classes
- **Decision:** Remove `font-mono` from navigation labels. Keep monospace only for: code blocks, terminal output, technical data (token counts, model IDs, file paths), and the status bar. Navigation labels, headings, descriptions, and body text should use the system sans-serif font.

## LOW BUGS

### BUG-R2-03: Settings tabs wrap at 1024px
- Tab labels "Models & Providers", "Backup & Restore", "Vault & Credentials" wrap to 2 lines at 1024px
- **Fix:** Use shorter tab labels at narrower viewports (e.g., "Models", "Backup", "Vault") via responsive classes or truncation.

### BUG-R2-04: Context request storm (100+ parallel calls)
- 100+ parallel `GET /api/workspaces/{id}/context` requests fire on load, hitting rate limiter
- **Fix:** Batch context requests into a single `POST /api/workspaces/batch-context` endpoint that accepts an array of workspace IDs and returns all contexts in one response. Or lazy-load: only fetch context for the active workspace, not all at once.

### BUG-R3-04: Storage read returns text/plain not JSON
- `GET /api/workspaces/:id/storage/read` returns raw `text/plain`
- **Fix:** Return JSON `{"content": "...", "path": "...", "mimeType": "..."}` for consistency with all other endpoints. Keep an option for raw download via `?raw=true` query param.

### BUG-R3-05: Memory API source field required but undocumented
- `POST /api/memory/frames` returns 400 if `source` field is missing, with unhelpful "Bad Request" message
- **Fix:** Make `source` default to `"user_stated"` when not provided. If validation fails on other fields, return a descriptive error message listing required and optional fields.

## IMPROVEMENTS (from retest observations)

### IMP-1: Onboarding wizard — add progress indicator
- The onboarding has 7 steps but no visible progress (dots, step counter, progress bar)
- **Add:** Step indicator dots or "Step 2 of 7" text below the main content

### IMP-2: Capabilities cards need visual differentiation
- All capability pack cards look identical — no icons, illustrations, or color coding
- **Add:** Assign each pack a distinct icon or accent color (e.g., Planning = blue, Research = green, Writing = purple)

### IMP-3: Model card — highlight default/selected model
- In Settings → Models grid, the currently selected default model has no distinct visual state
- **Add:** A border highlight, checkmark badge, or "DEFAULT" label on the active model card

### IMP-4: DELETE endpoints should return confirmation body
- `DELETE /api/teams/:id/members/:userId` and `DELETE /api/workspaces/:id/storage/delete` return empty body
- **Fix:** Return `{"deleted": true, "id": "..."}` or use 204 No Content consistently

### IMP-5: Fleet endpoint — add model attribution to sessions
- `GET /api/fleet` returns sessions but no model info per session
- **Add:** Include `model` field in each session object so the fleet view shows which model each workspace is using

### IMP-6: Cost chart area in Cockpit is empty
- The 7-day chart area in Cost Estimates card appears to be a blank/minimal sparkline that doesn't render
- **Fix:** Either render actual cost-over-time data as a simple bar/line chart, or remove the empty chart area

### IMP-7: Context panel (right rail) — information density low
- R2 UX rated Context panel 6.5/10 for usability — "functional but information density could be improved"
- **Improve:** Show workspace summary (model, budget usage, frame count, last activity) as compact stat cards. Add quick links: "Open in Memory", "View Events", "Edit Settings".

### IMP-8: Workspace sidebar — truncated project names
- At narrow widths, workspace names in the left sidebar are aggressively truncated, making them hard to distinguish
- **Fix:** Show full name on hover (tooltip), and use smarter truncation (keep first + last chars: "Product Lau…aunch")

### IMP-9: Memory embedded percentage low (34%) — surface this as actionable
- Cockpit shows "34% embedded" in Memory Stats — this means 66% of frames have no vector embeddings and won't appear in semantic search
- **Improve:** Add a warning badge or "Run embedding" CTA button in Cockpit Memory Stats card when embedded% < 80%. Link to a bulk-embed action or explain why.

### IMP-10: Audit events pagination — only 100 returned
- R3 test: GET /api/events returns max 100 events (pagination cap) but no `nextPage` or cursor token for fetching more
- **Fix:** Add `page` or `cursor` query parameter + return `hasMore: true/false` and `total` count in response so the Events view can paginate through all events.

### IMP-11: Marketplace "Wave 8A" placeholder still visible
- Capabilities → Marketplace → Suggested section shows "Marketplace suggestions will appear here after Wave 8A"
- **Fix:** Either populate with real suggestions (even if hardcoded) or remove the placeholder entirely. Production users should never see internal wave references.

### IMP-12: Concurrent workspace chat — needs explicit verification
- Per-workspace model routing works (confirmed: haiku workspace uses haiku). Fleet tracking has tier-based session limits (Solo=3, Teams=10).
- But NO test verified **truly simultaneous** requests: two chat messages sent at the same time to different workspaces with different models.
- **Add:** A concurrent-safe test: fire 3 parallel POST /api/chat requests to 3 different workspaces (each with a different model) and verify:
  a) All 3 return correct responses (no cross-contamination)
  b) Each uses its workspace-specific model
  c) Fleet endpoint shows 3 concurrent sessions during execution
  d) Memory saves from each chat go to the correct workspace only
- This is not a code fix but a verification that the architecture is truly concurrent-safe. If it fails, we need request-level isolation fixes.

### IMP-13: Session right panel — session list UX
- R2 noted "Session tab bar at the top is minimal to the point of being slightly ambiguous"
- **Improve:** Add workspace name badge to each session entry. Show message preview (first 40 chars). Add "Delete session" with inline confirm (same pattern as Vault).

### IMP-14: Chat empty state below AI response
- R2: "large empty space below the AI response feels like a void"
- **Improve:** Show a subtle "Ask a follow-up question or try /help for commands" ghost text. Or display related memory/context cards below the last response.

### IMP-15: API discoverability — missing OpenAPI/Swagger
- R3 stress test struggled to find correct endpoints (tried `/api/workspaces/:id/memory` which 404'd; real endpoint is `/api/memory/frames` with `workspaceId` body param)
- **Add:** Serve auto-generated OpenAPI spec at `GET /api/docs` or `/api/openapi.json`. Even a static JSON file listing all endpoints, methods, params, and example payloads would help. This is critical for teams building integrations.

## SUMMARY SCORECARD (what we're fixing)

| Category | Items | IDs |
|----------|-------|-----|
| CRITICAL bugs | 1 | BUG-R2-01 |
| HIGH bugs | 2 | BUG-R1-02, BUG-R3-01 |
| MEDIUM bugs | 5 | BUG-R1-01, BUG-R1-03, BUG-R2-02, BUG-R3-02, BUG-R3-03 |
| LOW bugs | 4 | BUG-R2-03, BUG-R2-04, BUG-R3-04, BUG-R3-05 |
| Improvements | 15 | IMP-1 through IMP-15 |
| **TOTAL** | **27** | |

## CONSTRAINTS
- Do NOT touch files outside `packages/` and `app/` directories
- Run `npm run build` after all changes — must be 0 TS errors
- Run `npx vitest run` — all tests must pass (currently 4333/4333)
- Keep changes surgical — fix bugs, don't refactor unrelated code
- When fixing search crash, test that Ctrl+K opens, allows typing, shows results, and closes cleanly
- For IMP-12 (concurrent test): write a test script at `UAT 3/concurrent-test.ts` that fires 3 parallel chat requests and verifies results

## VERIFICATION
After all fixes, verify:
1. `npm run build` — 0 errors
2. `npx vitest run` — all pass
3. Start server and manually test:
   - Ctrl+K search works (no crash, shows results)
   - DELETE workspace frame works with workspaceId param
   - GET /api/events?eventType=tool_call returns only tool_call events
   - GET /api/workspaces includes model/budget fields
   - GET /api/settings includes onboardingCompleted
   - Navigation labels are sans-serif, not monospace
   - Onboarding wizard shows step progress indicator
   - Model cards: default model visually highlighted
   - Capabilities cards: each pack has distinct icon/color
   - Context panel: shows workspace stats
   - No "Wave 8A" text anywhere
   - Memory stats: shows embedding warning when < 80%
   - Events: pagination with hasMore/total
   - All DELETE endpoints return `{"deleted": true}` or 204
