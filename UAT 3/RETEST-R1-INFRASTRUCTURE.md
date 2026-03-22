# Waggle Infrastructure Retest R1 — Results
**Date:** 2026-03-22
**Server:** localhost:3333
**Tester:** Sequential curl suite (no sub-agents)

---

## Test Results

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Health check | ✅ PASS | LLM healthy (anthropic-proxy, API key configured), DB healthy, 122 frames, defaultModel: claude-sonnet-4-6 |
| 2 | Chat (AI response) | ✅ PASS | "What is the capital of Japan?" → "Tokyo." Correct. Model: claude-sonnet-4-6 |
| 3 | Memory isolation | ✅ PASS | "Secret Alpha 99" in iso-test-a does NOT appear in iso-test-b search. Workspace-mind frames properly scoped. Personal mind is intentionally global (expected behavior). |
| 4a | /help | ✅ PASS | Returns all 13 commands in formatted table |
| 4b | /status | ✅ PASS | Returns "Skills loaded: 58" |
| 4c | /catchup | ✅ PASS | Returns workspace catch-up briefing with 5 memory excerpts |
| 4d | /draft write a haiku | ✅ PASS | Generated: "Digital minds learn / Memory threads weave through time / Agents wake and act". Saved to memory. |
| 4e | /research AI agents | ✅ PASS | Comprehensive 1787-token research report: market data, frameworks, competitive landscape, Waggle positioning. Used web_search + web_fetch tools. |
| 5 | Memory dedup | ❌ FAIL | Two identical frames (IDs 2 and 3) created for same content in same workspace. No dedup on direct `/api/memory/frames` POST. |
| 6 | Memory DELETE | ⚠️ PARTIAL | DELETE personal-mind frames: 204 + confirmed gone ✅. DELETE workspace-mind frames: returns 404 or false 204, frames persist ❌. Bug: workspace mind uses local ID space (1,2,3…) that doesn't match personal mind lookup. |
| 7 | Audit trail | ✅ PASS | 372 events logged. Latest: `memory_delete` of frame 209. Schema: id, timestamp, workspaceId, eventType, toolName, input, model, tokensUsed, cost, sessionId |
| 8 | Teams create | ✅ PASS | POST /api/teams → 201, ID: team-310c39c7, owner auto-assigned as member |
| 9a | Workspace model/budget | ❌ FAIL | GET /api/workspaces returns only `id, name, group, created`. No model or budget fields present. |
| 9b | /api/workspace-templates | ✅ PASS | 7 built-in templates: sales-pipeline, research-project, code-review, marketing-campaign, product-launch, legal-review, agency-consulting |
| 9c | /api/fleet | ✅ PASS | Returns `{sessions:[], count:0, maxSessions:3}` — active agent session tracking operational |

---

## Score: 11/15 PASS (73%)

**Pass:** 11 | **Fail:** 3 | **Partial:** 1

---

## Issues Found

### BUG-R1-1: No dedup on direct memory import (FAIL — Test 5)
- **Symptom:** POST `/api/memory/frames` with identical content twice creates 2 separate frames
- **Impact:** Memory bloat, duplicate recall results
- **Scope:** Only affects direct API imports (`source: import`). Agent-driven saves via `save_memory` tool likely have dedup logic.
- **Fix needed:** Check for content hash match before inserting in workspace mind

### BUG-R1-2: DELETE broken for workspace-mind frames (PARTIAL FAIL — Test 6)
- **Symptom:** `DELETE /api/memory/frames/:id` returns 404 or false 204 for workspace-mind frames (local IDs 1–3)
- **Root cause:** Workspace mind SQLite DBs have their own auto-increment ID sequences (1, 2, 3…) but the DELETE route resolves IDs against the personal mind DB where those IDs map to different (or nonexistent) frames
- **Impact:** Cannot delete workspace-specific memory via API
- **Fix needed:** DELETE route must accept `workspaceId` and route to the correct mind DB

### MISSING-R1-1: Workspace model/budget fields absent (FAIL — Test 9a)
- **Symptom:** GET `/api/workspaces` returns only `id, name, group, created` — no `model` or `budgetLimit` fields
- **Context:** Per-workspace model selection and budget tracking was implemented in commit `53ce8c9` but fields are not returned by the list endpoint
- **Fix needed:** Verify migration ran and list route selects these columns

---

## LLM Status Detail
```json
{
  "provider": "anthropic-proxy",
  "health": "healthy",
  "detail": "Built-in Anthropic proxy (API key configured)",
  "reachable": true,
  "defaultModel": "claude-sonnet-4-6"
}
```

---

## Recommended Fixes (Priority Order)
1. **BUG-R1-2** (DELETE workspace frames) — high impact, breaks memory management
2. **MISSING-R1-1** (model/budget in workspace response) — schema migration likely needed
3. **BUG-R1-1** (dedup on import) — medium impact, prevents noise accumulation
