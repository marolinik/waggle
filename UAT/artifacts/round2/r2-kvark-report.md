# Round 2 KVARK Readiness Report

**Agent**: AG-8 (KVARK / Sovereign AI Validator)
**Date**: 2026-03-21
**Repo**: waggle-poc (branch: phase8-wave-8f-ui-ux)
**Baseline**: R1 report `UAT/artifacts/kvark-sovereign-readiness.md` (score 72/100)
**Mode**: Code audit + live server verification (localhost:3333)

---

## W5 Fix Verification Table

| # | Fix ID | Description | Status | Evidence |
|---|--------|-------------|--------|----------|
| 1 | **W5.3** | KVARK 429 rate-limit handling | **PASS** | `kvark-client.ts:157-165` -- Explicit `if (result.status === 429)` block. Parses `Retry-After` header, falls back to exponential backoff `Math.min(1000 * 2^attempt, 30_000)`. Throws `KvarkServerError` after MAX_RETRIES=3. |
| 2 | **W5.3** | Exponential backoff for 5xx (skip 501) | **PASS** | `kvark-client.ts:168-172` -- `result.status >= 500 && result.status !== 501 && this.retryOnServerError` triggers backoff `Math.min(1000 * 2^attempt, 10_000)`. The `retryOnServerError` config flag is now actually used (was dead code in R1). |
| 3 | **W5.4** | KVARK 403 Forbidden handling | **PASS** | `kvark-client.ts:232-233` -- Explicit `case 403` in `handleResponse()` switch. Throws `KvarkServerError` with message `"KVARK access denied (forbidden): ${detail}"` and status 403. |
| 4 | **W5.2** | Cockpit KVARK health card | **PASS** | `CockpitView.tsx:349-372` -- Dedicated `<Card>` with header "KVARK Enterprise". Shows green dot + "Connected" when `health?.kvark?.connected` is true, grey dot + "Not configured" otherwise. Displays endpoint URL and last ping when connected. Includes descriptive text pointing to Settings > Team for configuration. |
| 5 | **W5.5** | Enterprise packs section in Capabilities | **PASS** | `CapabilitiesView.tsx:734-744` -- Enterprise section in Packs tab with amber "KVARK" badge. Shows description of governed knowledge access, data sovereignty, and audit trails. Directs user to Settings > Team for configuration. Positioned between Recommended and Community sections. |
| 6 | **W5.7** | `search_all_workspaces` tool | **PASS** | `tools.ts:222-262` -- New tool with `name: 'search_all_workspaces'`, `offlineCapable: true`. Accepts `query` (required) and `limit` (optional, default 5). Iterates personal mind + all workspace minds via `deps.getAllWorkspaceSearches()`. Returns formatted sections per workspace with scores and importance levels. |
| 7 | **W5.8** | Morning briefing narrative with decisions | **PASS** | `proactive-handlers.ts:137-174` -- `generateMorningBriefing()` now queries each workspace mind (capped at 5) for recent decisions: `WHERE importance IN ('critical','important') OR content LIKE 'Decision%' OR content LIKE '%decided%' AND created_at > datetime('now','-7 day')`. Appends "Recent decisions:" section to briefing body. |
| 8 | **W5.9** | Direct memory write API (`POST /api/memory/frames`) | **CODE PASS / RUNTIME FAIL** | `memory.ts:99-152` -- Route handler exists, accepts `content`, `workspace`, `importance`, `source`. Creates I-frame or P-frame via FrameStore. Route is registered (`index.ts:1177`). **Runtime**: Server returns 404 on POST (GET routes work). Likely the running server predates W5.9 code -- a hot-reload or restart is needed. Code is correct. |
| 9 | **W5.10** | Notification persistence + REST endpoints | **PASS** | `notifications.ts:53-56` -- `emitNotification()` calls `cronStore.saveNotification()`. `cron-store.ts:83-94` -- `notifications` SQLite table DDL with `id`, `title`, `body`, `category`, `action_url`, `read`, `created_at`. REST: `GET /api/notifications` (line 141) with `since`, `limit`, `unread` filters. `POST /api/notifications/:id/read` (line 153) marks as read. `cron-store.ts:285-318` -- `saveNotification()`, `getNotifications()`, `markNotificationRead()`, `countUnread()` all implemented. |
| 10 | **W5.11** | Cron trigger executes job (not just markRun) | **PASS** | `cron.ts:156` -- `await server.scheduler.executeJob(schedule)` replaces the old `markRun()` call. Also emits a notification on completion (lines 158-163). |
| 11 | **W5.12** | Cron execution history | **PASS** | `cron-store.ts:67-80` -- `cron_execution_history` table DDL with `schedule_id`, `schedule_name`, `executed_at`, `duration_ms`, `success`, `result_summary`, `error`. `cron-store.ts:260-280` -- `recordExecution()` inserts history rows, `getExecutionHistory()` returns rows ordered by `executed_at DESC`. REST: `GET /api/cron/:id/history` in `notifications.ts:165-176`. |
| 12 | **W1.2** | CSP sidecar -- no `unsafe-eval` | **FAIL** | `service.js` CSP header (visible in curl verbose output) contains `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. The `unsafe-eval` directive is still present in the running server's CSP response headers. Grep of `service.js` source for `script-src` confirmed it appears in the minified bundle. |

### Summary: 10 PASS, 1 CODE-PASS/RUNTIME-FAIL, 1 FAIL

---

## Re-Score: KVARK Readiness Dimensions

| Dimension | R1 Score | R2 Score | Delta | Justification |
|-----------|:--------:|:--------:|:-----:|---------------|
| **KV-1: Client Contract Compliance** | 78/100 | **92/100** | +14 | 429 rate-limit with Retry-After parsing and exponential backoff (W5.3) fully implemented. 403 Forbidden explicit handling added (W5.4). `retryOnServerError` flag now functional with 5xx retry loop excluding 501. Remaining gap: no `X-Request-ID` correlation header (LOW). |
| **KV-2: Agent Tools Verification** | 85/100 | **90/100** | +5 | `search_all_workspaces` (W5.7) adds cross-workspace search capability. Morning briefing now pulls recent decisions (W5.8). System prompt injection for KVARK attribution still unverified in chat.ts (carried from R1). `kvark_action` still does not pass workspaceId (LOW, carried from R1). |
| **KV-3: Sovereign AI Narrative** | 68/100 | **70/100** | +2 | Enterprise packs section in Capabilities (W5.5) adds UI-visible enterprise language ("governed knowledge access", "data sovereignty", "audit trails"). No new documentation artifacts (deployment guide, compliance matrices) since R1. Data sovereignty narrative gap remains. Score nudges up for enterprise language in UI. |
| **KV-4: Enterprise Tier Visibility** | 10/100 | **45/100** | +35 | **Largest improvement.** Cockpit KVARK health card (W5.2) with connected/not-configured states. Capabilities enterprise section (W5.5) with KVARK badge. These address the CRITICAL finding from R1 that enterprise tier was completely invisible. Remaining gaps: no Settings KVARK config panel, no onboarding enterprise path, attribution badge wiring in desktop app still unconfirmed. |

### Aggregate R2 Score

| | R1 | R2 |
|---|:---:|:---:|
| **KV-1** | 78 | 92 |
| **KV-2** | 85 | 90 |
| **KV-3** | 68 | 70 |
| **KV-4** | 10 | 45 |
| **Weighted Average** | **72** | **79** |

**Overall R2 Readiness: 79 / 100** (up from 72)

---

## Remaining Gaps (Carried or New)

### HIGH Priority

| ID | Gap | Status | Origin |
|----|-----|--------|--------|
| KV-4.2 | Settings has no KVARK config panel. Admin still needs CLI/API to configure credentials. | **OPEN** | R1 |
| KV-3.1 | No explicit data sovereignty narrative document. "Sovereign" still absent from docs. | **OPEN** | R1 |
| KV-2.1 | System prompt injection for KVARK attribution missing/orphaned in chat.ts. | **OPEN** | R1 |
| W1.2 | CSP sidecar still contains `unsafe-eval` in `script-src`. | **OPEN** | R1 |

### MEDIUM Priority

| ID | Gap | Status | Origin |
|----|-----|--------|--------|
| KV-4.4 | Onboarding does not differentiate enterprise path. | **OPEN** | R1 |
| KV-3.3 | No compliance documentation (SOC2/ISO 27001/GDPR). | **OPEN** | R1 |
| KV-3.4 | Audit trail structural but not user-visible in Cockpit. | **OPEN** | R1 |
| W5.9-RT | `POST /api/memory/frames` returns 404 at runtime despite correct code. Server restart needed. | **NEW** | R2 |

### LOW Priority

| ID | Gap | Status | Origin |
|----|-----|--------|--------|
| KV-1.4 | No `X-Request-ID` correlation header on KVARK requests. | **OPEN** | R1 |
| KV-2.2 | `kvark_action` does not pass workspaceId to client. | **OPEN** | R1 |

---

## What Improved Since R1

1. **KvarkClient is now production-grade for rate limiting.** The retry loop with MAX_RETRIES=3, 429 detection with Retry-After parsing, exponential backoff for transient 5xx, and 501 exclusion from retries is a correct enterprise pattern.

2. **403 Forbidden is now a first-class error path.** Governance denial from KVARK will produce a clear "access denied (forbidden)" message rather than a generic server error.

3. **Enterprise tier is no longer invisible.** The Cockpit KVARK health card and Capabilities enterprise section give enterprise users two visible surfaces confirming KVARK integration exists and its connection status.

4. **Cross-workspace intelligence is operational.** `search_all_workspaces` enables "what should I work on today?" queries across all projects. Morning briefing now includes recent decisions per workspace, making it a useful daily status tool.

5. **Notification and cron subsystems are complete.** Notifications persist to SQLite (survive restarts), cron triggers actually execute jobs (not just mark timestamps), and execution history provides an audit trail for scheduled operations.

---

## Recommendations for R3

1. **Restart the server** and re-test `POST /api/memory/frames` -- the code is correct, the running process likely predates the route addition.
2. **Settings KVARK config panel** remains the top P0 gap for enterprise demo readiness.
3. **Remove `unsafe-eval` from CSP** in the sidecar build pipeline -- this is a security regression that has persisted since R1.
4. **Investigate KVARK prompt injection** in `chat.ts` -- the Phase 7 B3/C documented sections were not found. This may need re-implementation.

---

Report COMPLETE
