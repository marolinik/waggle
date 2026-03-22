# Mega-UAT Test E1: Previous Bug Retests

**Date:** 2026-03-22
**Tester:** Automated (Claude Opus 4.6)
**Server:** http://localhost:3333
**Auth:** Bearer c553a5...ea37

---

## Summary

| Bug ID | Description | Verdict | Notes |
|--------|-------------|---------|-------|
| F1 | Export drops memory frames | **PARTIAL** | Frames included but `frameType` field missing (uses `frame_type`) |
| F2 | Proxy health check auth | **FAIL** | Health check reports `reachable:true` with invalid API key |
| B1 | Workspace memory isolation | **PASS** | Isolation works when correct API field names used |
| C1 | search_content filesystem scoping | **INCONCLUSIVE** | Cannot verify without working LLM (API key expired) |
| C3-C5 | Slash command fallbacks | **PASS** | Commands gracefully return error message, no crashes |
| H1 | File tools workspace directory | **INCONCLUSIVE** | Cannot verify without working LLM (API key expired) |
| H2 | /spawn fails | **PARTIAL** | /spawn processes correctly but fails at LLM call (expected with expired key) |
| H3 | Approval gates not enforced | **PARTIAL** | Approval infrastructure exists but `/api/governance/capabilities` returns 404 (local mode only) |
| M3 | /api/costs 404 | **PASS** | Returns 200 with valid cost data |
| F18 | Workspace delete EBUSY | **PASS** | Create and immediate delete works (204 response) |
| NEW | Health check false positive | **NEW BUG** | Health reports `llm.reachable:true` but API calls fail with "authentication_error" |
| NEW | POST /api/memory/frames ignores `workspaceId` silently | **NEW BUG** | Body field is `workspace`, not `workspaceId`; wrong field silently falls back to personal mind |

**Overall: 4 PASS, 3 PARTIAL, 1 FAIL, 2 INCONCLUSIVE, 2 NEW BUGS**

---

## Detailed Results

---

### F1: Export Drops Memory Frames

**Verdict: PARTIAL** (improved but not fully fixed)

The old bug was that export did not include memory frames at all. This is fixed -- frames are now included. However, the export uses raw SQLite column names (`frame_type`) instead of the camelCase field name (`frameType`) that the rest of the API uses.

**Test: POST /api/export with workspaceId**

```bash
curl -s -X POST http://localhost:3333/api/export \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"lead-generation"}' \
  --output export-test-e1.zip
```

**Result:** HTTP 200, valid ZIP file returned.

Note: The endpoint is `POST /api/export` (not `GET /api/workspaces/:id/export` as originally documented). The old GET route does not exist (returns 404).

**ZIP contents for lead-generation scoped export:**
```
memories/workspace-lead-generation-frames.json (134234 bytes) — 69 entries
sessions/lead-generation/*.md (7 session files)
workspaces/lead-generation.json (151 bytes)
settings.json (967 bytes)
vault-metadata.json (1069 bytes)
```

**Memory frame fields present:**
```json
["id", "frame_type", "gop_id", "t", "base_frame_id", "content",
 "importance", "access_count", "created_at", "last_accessed", "source"]
```

**Required fields check:**
- `content` -- PRESENT
- `source` -- PRESENT
- `importance` -- PRESENT
- `frameType` -- **MISSING** (field is `frame_type` instead)

**Root cause:** The export route at `packages/server/src/local/routes/export.ts` line 77 calls `wsFrameStore.list()` which returns raw SQLite rows with snake_case column names. The `normalizeFrame()` function in `memory.ts` that converts `frame_type` to `frameType` is not used by the export route. The search/list API endpoints normalize frames but the export does not.

**Remaining issue:** Export should normalize field names to match API convention (`frameType` not `frame_type`, `createdAt` not `created_at`, etc.).

---

### F2: Proxy Health Check Auth

**Verdict: FAIL** (still broken)

**Test:**
```bash
curl -s http://localhost:3333/health
```

**Response:**
```json
{
  "status": "ok",
  "llm": {
    "provider": "anthropic-proxy",
    "health": "healthy",
    "detail": "Built-in Anthropic proxy (API key configured)",
    "reachable": true,
    "lastCheck": "2026-03-22T02:45:29.137Z"
  },
  "database": { "healthy": true }
}
```

**But actual API call fails:**
```bash
curl -s -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"Say hi"}],"max_tokens":5}'
```
```json
{
  "error": {
    "message": "Anthropic API error: {\"type\":\"error\",\"error\":{\"type\":\"authentication_error\",\"message\":\"Invalid authentication credentials\"}}"
  }
}
```

**Analysis:** The health check only verifies that an API key is configured (non-empty), not that it is valid. It reports `reachable: true` and `health: "healthy"` even though the key is expired/invalid. This is misleading and prevents users from diagnosing LLM connectivity issues.

---

### B1: Workspace Memory Isolation

**Verdict: PASS** (when using correct API field names)

**Important discovery:** The POST `/api/memory/frames` body field is `workspace` (NOT `workspaceId`). Using the wrong field name causes frames to silently fall to personal mind. With the correct field name, workspace isolation is properly enforced.

**Test with correct field names:**

```bash
# Post to workspace A
curl -s -X POST http://localhost:3333/api/memory/frames \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"content":"ISOLATION_WS_A_CORRECT_AAAAAA","workspace":"isolation-a-mega","source":"user_stated"}'
# Response: {"saved":true,"frameId":1,"mind":"workspace"}

# Post to workspace B
curl -s -X POST http://localhost:3333/api/memory/frames \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"content":"ISOLATION_WS_B_CORRECT_BBBBBB","workspace":"isolation-b-mega","source":"user_stated"}'
# Response: {"saved":true,"frameId":1,"mind":"workspace"}
```

**Isolation verification:**

| Search | Workspace | Scope | Results | Expected | Status |
|--------|-----------|-------|---------|----------|--------|
| B's content in A | isolation-a-mega | workspace | 0 | 0 | PASS |
| A's content in B | isolation-b-mega | workspace | 0 | 0 | PASS |
| A's content in A | isolation-a-mega | workspace | 1 | 1 | PASS |
| B's content in A | isolation-a-mega | all | 0 | 0 | PASS |

**Note:** See NEW BUG about `workspaceId` vs `workspace` field naming inconsistency below.

---

### C1: search_content Filesystem Scoping

**Verdict: INCONCLUSIVE**

Cannot fully verify because the LLM API key is expired. The `search_content` tool requires the agent loop (LLM) to invoke tools. All chat-based tests fail at the LLM call stage with "API key is invalid or expired."

**Partial test:**
```bash
curl -s http://localhost:3333/api/workspaces/marko-dev-workspace/files?q=README
# Response: {"files":[]}
```

The file search endpoint returns an empty array -- unclear if this is a scoping issue or simply no indexed files. The workspace `marko-dev-workspace` has directory `D:/Projects/MS Claw/waggle-poc` bound.

---

### C3-C5: Slash Command Fallbacks (/research, /draft, /decide)

**Verdict: PASS**

All three commands gracefully handle the LLM failure with a user-friendly error message instead of crashing.

**Test /research:**
```bash
curl -s -X POST http://localhost:3333/api/chat \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"message":"/research test topic","workspaceId":"marko-dev-workspace"}'
```
```
event: step — "Processing /research via AI..."
event: step — "Recalling relevant memories..."
event: tool — auto_recall with query
event: step — "Recalled 13 relevant memories."
event: tool_result — memories recalled (duration: 21ms)
event: error — "API key is invalid or expired. Update it in Settings > API Keys."
```

**Same pattern for /draft and /decide:**
- All commands process through the pipeline (step events, memory recall)
- All fail gracefully at the LLM call with a clear error message
- HTTP status is 200 (SSE stream delivered correctly)
- No crashes, no unhandled exceptions, no raw stack traces

---

### H1: File Tools Workspace Directory

**Verdict: INCONCLUSIVE**

Cannot verify file tool resolution because the LLM API key is expired. The chat endpoint processes the auto_recall step but fails before the agent can invoke file tools.

```bash
curl -s -X POST http://localhost:3333/api/chat \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"message":"read_file README.md","workspaceId":"marko-dev-workspace"}'
```

Response shows memory recall succeeded (12 memories) but then `event: error` with "API key is invalid or expired."

The workspace `marko-dev-workspace` does have directory `D:/Projects/MS Claw/waggle-poc` configured, which is a prerequisite for file tool scoping.

---

### H2: /spawn Fails

**Verdict: PARTIAL**

The `/spawn` command is now recognized and processed. It fails at the LLM call (expected with expired key), but the command pipeline itself works correctly.

```bash
curl -s -X POST http://localhost:3333/api/chat \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"message":"/spawn analyst Research market trends","workspaceId":"marko-dev-workspace"}'
```

```
event: step — "Processing /spawn via AI..."
event: step — "Recalling relevant memories..."
event: tool — auto_recall (query parsed correctly with role "analyst" and task)
event: step — "Recalled 12 relevant memories."
event: tool_result — 12 memories recalled (duration: 24ms)
event: error — "API key is invalid or expired. Update it in Settings > API Keys."
```

The command is processed, memory is recalled, but the actual sub-agent spawn cannot be verified without a working LLM. The command no longer crashes or returns a command-not-found error.

---

### H3: Approval Gates Not Enforced

**Verdict: PARTIAL**

**Findings:**

1. **`/api/governance/capabilities` returns 404:**
```bash
curl -s http://localhost:3333/api/governance/capabilities
# Response: {"error":"Not found"} HTTP 404
```
This endpoint is registered in the team/enterprise server (`packages/server/src/routes/capability-governance.ts`), NOT in local mode. This is by design -- governance is a team feature.

2. **Approval infrastructure exists in local mode:**
```bash
curl -s http://localhost:3333/api/approval/pending
# Response: {"pending":[],"count":0} HTTP 200
```
The approval endpoint works and returns pending approvals.

3. **Capabilities status works:**
```bash
curl -s http://localhost:3333/api/capabilities/status
# Response: 59 tools, 57 skills, 8 plugins, 13 commands, 3 workflows
```

4. **Cannot test approval gates with destructive commands** because the LLM is needed to trigger tool execution (which then triggers approval gates). The chat request for "delete all files" fails at the LLM call before reaching the tool execution layer.

**Assessment:** The approval gate infrastructure is in place (approval route, pending queue, capability trust levels in chat.ts). Cannot verify enforcement without a working LLM. The `/api/governance/capabilities` 404 is expected behavior for local (non-team) mode.

---

### M3: /api/costs 404

**Verdict: PASS** (fixed)

```bash
curl -s -L http://localhost:3333/api/costs
```

**Response (HTTP 200):**
```json
{
  "today": {"inputTokens": 0, "outputTokens": 0, "estimatedCost": 0, "turns": 0},
  "allTime": {"inputTokens": 0, "outputTokens": 0, "estimatedCost": 0, "turns": 0, "byModel": {}},
  "week": {"inputTokens": 0, "outputTokens": 0, "estimatedCost": 0, "turns": 0},
  "daily": [
    {"date": "2026-03-16", "inputTokens": 0, "outputTokens": 0, "cost": 0, "turns": 0},
    {"date": "2026-03-17", "inputTokens": 0, "outputTokens": 0, "cost": 0, "turns": 0},
    ...
  ],
  "budget": {"dailyBudget": null, "todayCost": 0, "budgetStatus": "ok", "budgetPercent": 0}
}
```

Note: The initial request returns HTTP 302 (redirect) which curl follows with `-L`. The endpoint returns comprehensive cost tracking data with daily breakdown, budget status, and per-model stats. All zeroes because the API key is expired and no successful LLM calls have been made.

---

### F18: Workspace Delete EBUSY

**Verdict: PASS** (fixed)

```bash
# Create workspace
curl -s -X POST http://localhost:3333/api/workspaces \
  -H "Authorization: Bearer c553a5...ea37" \
  -H "Content-Type: application/json" \
  -d '{"name":"Delete Test UAT2 MegaE1","group":"Testing"}'
# Response: {"id":"delete-test-uat2-megae1","name":"Delete Test UAT2 MegaE1","group":"Testing","created":"2026-03-22T02:47:21.477Z"}

# Immediate delete
curl -s -w "HTTP_CODE:%{http_code}" -X DELETE http://localhost:3333/api/workspaces/delete-test-uat2-megae1
# Response: HTTP 204 (No Content) — success

# Verify deletion
curl -s http://localhost:3333/api/workspaces/delete-test-uat2-megae1
# Response: {"error":"Workspace not found"} HTTP 404
```

No EBUSY error. Create-then-immediate-delete works cleanly.

---

### NEW BUG: Health Check False Positive

**Verdict: NEW BUG**

The `/health` endpoint reports `llm.reachable: true` and `llm.health: "healthy"` even though the API key is invalid/expired.

**Evidence:**
- Health check says: `"health": "healthy"`, `"reachable": true`
- Actual LLM call returns: `"authentication_error"`, `"Invalid authentication credentials"`

**Impact:** Users cannot rely on the health endpoint to diagnose LLM connectivity issues. The health check provides false confidence that the LLM integration is working.

**Recommended fix:** The health check should make a lightweight API call (e.g., list models or a minimal completion) to validate the key, not just check if the key string is non-empty.

---

### NEW BUG: POST /api/memory/frames Silently Ignores `workspaceId`

**Verdict: NEW BUG**

The POST `/api/memory/frames` endpoint accepts `workspace` in the body but silently ignores `workspaceId`. When `workspaceId` is used (which is the naming convention in other endpoints like `/api/chat`), the frame falls through to personal mind without any error or warning.

**Evidence:**
```bash
# Using 'workspaceId' (WRONG — silently ignored, goes to personal mind)
curl -s -X POST http://localhost:3333/api/memory/frames \
  -d '{"content":"TEST","workspaceId":"isolation-a-mega","source":"user_stated"}'
# Response: {"saved":true,"frameId":192,"mind":"personal"}  <-- personal, not workspace!

# Using 'workspace' (CORRECT — goes to workspace mind)
curl -s -X POST http://localhost:3333/api/memory/frames \
  -d '{"content":"TEST","workspace":"isolation-a-mega","source":"user_stated"}'
# Response: {"saved":true,"frameId":1,"mind":"workspace"}  <-- correct
```

Similarly, the search endpoint uses `workspace` as the query parameter, but many other endpoints (chat, export) use `workspaceId`. This inconsistency is a footgun.

**Impact:** Data loss scenario — frames intended for workspace mind silently go to personal mind. No error returned. The response even shows `mind: "personal"` which could be easily missed.

**Recommended fix:** Either:
1. Accept both `workspace` and `workspaceId` (backwards compatible), or
2. Return 400 error when unknown body fields are present (strict validation), or
3. Standardize all endpoints to use the same field name

**Source:** `packages/server/src/local/routes/memory.ts` lines 164-204 — body type declares `workspace?: string` only.

---

## Test Environment Notes

- **LLM Status:** API key is expired/invalid. All agent loop tests (C1, H1, H2, H3 enforcement) could not be fully verified.
- **Database:** Healthy, 139 frames in mind DB
- **Server Mode:** Local (Fastify on localhost:3333)
- **Plugins:** 8 active plugins, 59 tools, 57 skills, 13 commands

## Recommendations

1. **HIGH:** Fix health check to validate API key with a real API call (F2 + NEW BUG)
2. **HIGH:** Normalize export frame fields to match API convention — use `frameType` not `frame_type` (F1)
3. **MEDIUM:** Standardize `workspace` vs `workspaceId` field naming across all endpoints, or accept both (NEW BUG)
4. **LOW:** Re-test C1, H1, H2, H3 with a valid API key to verify full functionality
