# AG-6: Round 2 Memory System Revalidation Report

**Agent**: AG-6 (Memory & Continuity Tester)
**Date**: 2026-03-21
**Repo**: `D:\Projects\MS Claw\waggle-poc`
**Server**: http://localhost:3333 (verified running)
**Branch**: `phase8-wave-8f-ui-ux`
**Round**: 2 (revalidation of W2 + W3 fixes)

---

## Executive Summary

Round 2 revalidates all memory dimensions from Round 1, focusing on the W2 and W3 fixes applied since the initial assessment. **5 of 7 targeted fixes are confirmed in code**. Two residual issues found: (1) the REST API `/api/memory/search` route still uses `MultiMind.ftsSearch` with implicit AND semantics, not the fixed OR-based `HybridSearch`; (2) the `/api/memory/frames` GET route overwrites the provenance `source` column with the mind routing label (`personal`/`workspace`), hiding frame provenance from the UI.

---

## Fix Verification

### W2.1 Source/Provenance -- FIXED

**Schema** (`packages/core/src/mind/schema.ts:56-57`):
The `source` column is defined with a CHECK constraint allowing: `user_stated`, `tool_verified`, `agent_inferred`, `import`, `system`. Default is `user_stated`.

**Type** (`packages/core/src/mind/frames.ts:5`):
`FrameSource` type matches the SQL CHECK constraint exactly.

**Migration** (`packages/core/src/mind/db.ts:40-48`):
The `runMigrations` method checks `pragma_table_info` for the `source` column and adds it via ALTER TABLE if missing. Migration is idempotent.

**Frame creation** (`frames.ts:41-47`, `54-60`): `createIFrame` and `createPFrame` both accept a `source` parameter and pass it to the INSERT statement.

**Agent tool** (`tools.ts:283-286`, `340-343`): `save_memory` tool accepts `source` enum and passes it through to frame creation.

**Residual issue**: The GET `/api/memory/frames` route (`memory.ts:77,86`) overwrites the SQL `source` column value with `'personal'`/`'workspace'` routing labels. The provenance field (`user_stated`, `tool_verified`, etc.) is masked in API responses. The `normalizeFrame` function (`memory.ts:10`) reads `raw.source`, but by that point it has already been overwritten.

**Verdict**: Schema/type/migration FIXED. API surface has a field collision (provenance masked by routing label).

---

### W2.4 Dedup Check -- FIXED

**Code** (`tools.ts:312-321`):
Exact-match content check (`WHERE content = ?`) runs before saving. Non-blocking via try/catch so dedup failures do not prevent saves. Returns informative message with existing frame ID when duplicate detected.

**Verdict**: FIXED. Exact-match dedup is present and non-blocking.

---

### W2.5 Contradiction Detection -- FIXED

**Code** (`tools.ts:178-186`):
Scans all search results for contradiction signal words (`but`, `however`, `instead`, `no longer`, `changed to`, `reversed`, `cancelled`, `not`). Only triggers when multiple results exist. Appends advisory note without blocking.

**Verdict**: FIXED. Heuristic contradiction detection is present in `search_memory` tool output.

---

### W2.6 Workspace Boost (Personal Mind Limit) -- FIXED

**Code** (`tools.ts:166-167`):
When workspace is active and scope is `all`, personal results are capped at `Math.min(limit, 3)`. Workspace results are searched first (lines 153-161), personal second (lines 164-175), establishing correct priority order.

**Verdict**: FIXED. Workspace results are prioritized; personal capped at 3.

---

### W2.7 Default Workspace Fix -- FIXED

**Code** (`chat.ts:736-743`):
The condition checks `workspace` (the raw param from the request body), not `effectiveWorkspace`. When `workspace` is provided (including `"default"`), `activateWorkspaceMind` runs. Failure produces a visible warning via SSE step event.

**Verdict**: FIXED. Explicit workspace param triggers activation.

---

### W3.6 FTS5 OR Search -- PARTIALLY FIXED

**`HybridSearch.keywordSearch`** (`search.ts:104-158`):
Terms are joined with `OR`. Stop words are filtered (58 common words). Short words (<3 chars) are filtered. Quoted phrases are preserved. This is the correct fix.

**However**, the REST API route `GET /api/memory/search` (`memory.ts:57`) calls `server.multiMind.search()`, which uses `MultiMind.ftsSearch` (`multi-mind.ts:163-168`):

```typescript
private ftsSearch(db: MindDB, query: string, limit: number): MemoryFrame[] {
  const safeQuery = query
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => `"${w.replace(/"/g, '')}"`)
    .join(' ');  // <-- IMPLICIT AND, no OR, no stop word filtering
```

This method does NOT apply the W3.6 fix.

**API test confirmation**:
- `GET /api/memory/search?q=architecture` returned 8 results
- `GET /api/memory/search?q=review` returned 7 results
- `GET /api/memory/search?q=architecture+review+testing` returned 0 results (AND of all three returns nothing)

The agent-side `search_memory` tool uses `HybridSearch` (correct OR semantics), but the REST API used by the Memory Browser UI uses `MultiMind.ftsSearch` (old AND semantics).

**Verdict**: PARTIALLY FIXED. Agent tool path uses OR. REST API path still uses implicit AND.

---

### W3.7 Catch-Up Workspace Activation -- FIXED

**Code** (`commands.ts:27-31`):
Workspace mind activation runs before building the command context. The condition checks `workspaceId` (truthy), so any explicit workspace including `"default"` triggers activation.

**API test**: `POST /api/commands/execute` with `/catchup` and `workspaceId: "default"` returned the catch-up briefing structure with "No workspace state available" -- activation ran correctly but the default workspace has no separate .mind file or session data.

**Verdict**: FIXED. Workspace activation is wired correctly for commands.

---

## API Test Results

| Test | Endpoint | Result | Notes |
|------|----------|--------|-------|
| Frame list with source | `GET /api/memory/frames?limit=5` | PASS (5 results) | `source` field present but shows routing label not provenance |
| Multi-term search (matching) | `GET /api/memory/search?q=waggle+agent+memory` | PASS (3 results) | Terms matched individually via LIKE fallback |
| Multi-term search (OR) | `GET /api/memory/search?q=architecture+review+testing` | FAIL (0 results) | MultiMind uses AND; individual terms return 7-8 each |
| Single-term search | `GET /api/memory/search?q=architecture` | PASS (8 results) | FTS5 works for single terms |
| KG entities | `GET /api/memory/graph` | PASS | 46 entities, 90 relations, types: package, person, project, technology |
| Catch-up command | `POST /api/commands/execute /catchup` | PASS (expected empty) | Workspace activation runs; no data for default workspace |
| POST frame (provenance) | `POST /api/memory/frames` | FAIL (404) | Route defined in code but server running older build |
| Health check | `GET /health` | PASS | 68 frames, 66% embedding coverage |

---

## R1 vs R2 Score Comparison

| Dimension | R1 Score | R2 Score | Change | Notes |
|-----------|----------|----------|--------|-------|
| MC-1: Personal vs Workspace Mind Isolation | 4/5 | 4/5 | -- | No regression. W2.6 workspace boost confirmed. W2.7 default workspace activation confirmed. |
| MC-2: Frame Persistence Across Restart | 5/5 | 5/5 | -- | No regression. W2.1 migration adds `source` column idempotently. |
| MC-3: Knowledge Graph Accuracy | 3/5 | 3/5 | -- | No regression. 46 entities, 90 relations still present. No new auto-extraction. |
| MC-4: Habit Formation Design | 3/5 | 3.5/5 | +0.5 | W3.7 catch-up workspace activation fixed. Still empty for default workspace (data-dependent). |
| Embedding System | 4/5 | 4/5 | -- | No regression. 66% coverage reported by health endpoint. |
| Memory Frame Structure | 5/5 | 5/5 | -- | No regression. W2.1 source column and W2.4 dedup added. |
| Workspace Context / Catch-Up | 4/5 | 4/5 | -- | W3.7 activation fix confirmed. Catch-up returns empty for default workspace (no data). |
| **Overall Memory System** | **4.0/5** | **4.1/5** | **+0.1** | Incremental improvement from W2/W3 fixes. |

---

## New Findings (Round 2)

### MEDIUM

| ID | Finding | File | Impact |
|----|---------|------|--------|
| R2-M1 | `MultiMind.ftsSearch` still uses implicit AND semantics (no OR, no stop words). The W3.6 OR fix only applies to `HybridSearch.keywordSearch` used by the agent tool, NOT the REST API `GET /api/memory/search`. | `packages/core/src/multi-mind.ts:163-168` | Memory Browser UI search will miss results when users enter multiple terms. |
| R2-M2 | GET `/api/memory/frames` route overwrites the provenance `source` column (user_stated/tool_verified/etc.) with the mind routing label (personal/workspace). The provenance data is in the DB but masked in API responses. | `packages/server/src/local/routes/memory.ts:77,86` | UI cannot display frame provenance. Field naming collision between routing and provenance. |
| R2-M3 | POST `/api/memory/frames` route returns 404 on the running server despite being defined in code. Server likely needs restart to pick up the new route. | `packages/server/src/local/routes/memory.ts:99-152` | Cannot test provenance write via API until server is restarted. |

### RESOLVED (from Round 1)

| R1 ID | Finding | Status |
|-------|---------|--------|
| H-2 (partial) | /catchup returned empty for default workspace | Root cause addressed: W3.7 ensures workspace mind activation. Empty result is now data-dependent, not a bug. |
| (implicit) | FTS5 AND semantics caused multi-term search failures | Fixed in HybridSearch (agent path). Not yet fixed in MultiMind (REST API path). |

---

## Recommended Next Actions

1. **R2-M1**: Apply the W3.6 OR fix to `MultiMind.ftsSearch` (`multi-mind.ts:163-168`). Either refactor to use `HybridSearch.keywordSearch` or duplicate the OR + stop-word logic.
2. **R2-M2**: Rename the routing label to `mind` or `mindSource` in the frames route to avoid collision with the provenance `source` column. The `normalizeFrame` function should expose both: `source` (provenance) and `mind` (personal/workspace).
3. **R2-M3**: Restart the server to pick up the POST `/api/memory/frames` route, then retest provenance writes.

---

Report COMPLETE.
