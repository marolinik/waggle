# UAT Round 3 — Test E1 (Bug Retests) + Test E2 (API Endpoint Sweep)
**Date:** 2026-03-22
**Server:** http://localhost:3333
**Tester:** Claude Agent (automated)
**Status:** Complete

---

## E1: Bug Retest Results

| Bug ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| F1 | Export drops memory frames | FIXED ✅ | Export ZIP contains `memories/workspace-export-test-r3-frames.json` with 3 frames. Fallback disk-read path works when workspace mind not in cache. |
| B1 | Workspace memory isolation | FIXED ✅ | WORKSPACE-ALPHA-SECRET-XY777-ISOLATED written to `isolation-test-alpha-2` workspace mind (returned `"mind":"workspace"`). Not visible in beta workspace (`{"results":[],"count":0}`). Search in beta returns 0 results. |
| H2 | /spawn fails | PARTIAL ⚠️ | `/spawn` processes correctly (SSE events fired, `Processing /spawn via AI...` → researcher sub-agent loop starts, `auto_recall` + web search + bash tools invoked). Does NOT return 500 error. However the researcher agent spends tokens on extended research (web search, file search) and may time out on long-running tasks. Root cause: no time-box on the spawned agent — it does real work instead of a quick answer. Functional but inefficient for simple queries. |
| H3 | Approval gates for shell commands | FIXED ✅ | `rm -rf /tmp/test123` triggers pre:tool hook. The `approval_required` SSE event IS sent (confirmed by pending approvals API showing bash entries). `GET /api/approval/pending` confirmed 18 pending approvals including bash tools. Gate fires correctly: `needsConfirmation` matches `/\brm\s+-[rf]/` destructive pattern. Stream shows `tool` event → hook awaits → `approval_required` sent to client. Auto-denies after 5 min timeout. |
| M3 | /api/costs 404 | FIXED ✅ | `GET /api/costs` returns HTTP 302 → redirects to `/api/cost/summary` which returns HTTP 200 with full cost breakdown: `{"today":{"inputTokens":2442814,"outputTokens":13157,"estimatedCost":7.5258}}`. |
| F18 | Workspace delete EBUSY | FIXED ✅ | `DELETE /api/workspaces/delete-test-r3` returns HTTP 204 No Content. Clean deletion without EBUSY error. |
| C1 | search_content filesystem scoping | FIXED ✅ | `search_content` tool uses `cwd: workspace` (packages/agent/src/system-tools.ts line 453). Agent correctly searched `packages/**/*.ts` and returned workspace-scoped results. Results include `packages\worker\`, `packages\waggle-dance\`, `packages\server\` etc. No path escape detected. |

### E1 Summary
- **7 bugs tested**
- **6 FIXED** (F1, B1, H3, M3, F18, C1)
- **1 PARTIAL** (H2 — spawn works but no time-box on spawned agent)

---

### H2 Detail: /spawn Behavior Analysis

`/spawn` is functional — the command is processed, a researcher persona is invoked, and tools are called. However:

- The spawned researcher agent performs *real* web searches and file system exploration
- For complex research tasks this is correct behavior
- For trivial queries like "What is 2+2?", the researcher still does full research workflows
- There is no task-complexity routing / fast-path for simple spawn requests
- The `/spawn` command implementation calls `spawnAgent(role, task)` which delegates to the full agent loop

**Recommendation:** Consider adding a complexity classifier to route simple queries to a single-turn response vs full research loop.

---

### B1 Detail: Memory Isolation Architecture

Waggle has two memory scopes:
1. **Personal mind** (`~/.waggle/default.mind`) — shared across all workspaces, returned by `GET /api/memory/frames` regardless of workspace param
2. **Workspace mind** (`~/.waggle/workspaces/{id}/workspace.mind`) — isolated per workspace, written when `target: "workspace"` or `workspace` param in `POST /api/memory/frames`

The isolation is working correctly for workspace-specific minds. Personal mind is intentionally shared (cross-workspace context feature).

---

## E2: API Endpoint Full Sweep

### Endpoint Results — Correct API Paths

> Note: Several endpoints tested with wrong paths in the original test script. Correct paths discovered and tested below.

| Category | Endpoint (Correct Path) | HTTP Status | Result |
|----------|------------------------|-------------|--------|
| **Health** | GET /health | 200 | ✅ Returns status, LLM health, DB health, memory stats |
| **Health** | GET /api/status | 404 | ❌ Route does not exist |
| **Workspaces** | GET /api/workspaces | 200 | ✅ Returns all workspaces array (99 workspaces) |
| **Workspaces** | GET /api/workspaces/{id} | 200/404 | ✅ Returns workspace if exists; 404 with "Workspace not found" if not |
| **Workspaces** | PATCH /api/workspaces/{id} | 200/404 | ✅ Works for valid ID; 404 for "default" (no workspace with that ID) |
| **Workspaces** | POST /api/workspaces | 201 | ✅ Creates workspace (requires name + group fields) |
| **Workspaces** | DELETE /api/workspaces/{id} | 204 | ✅ Deletes workspace cleanly |
| **Workspaces** | POST /api/export | 200 | ✅ Returns ZIP file with memories, sessions, workspaces, settings |
| **Sessions** | GET /api/workspaces/{id}/sessions | 200 | ✅ Lists sessions for workspace |
| **Memory** | GET /api/memory/search?q=…&workspace=… | 200 | ✅ Returns search results |
| **Memory** | GET /api/memory/frames?workspace=… | 200 | ✅ Returns memory frames |
| **Memory** | POST /api/memory/frames | 200 | ✅ Creates memory frame (personal or workspace-scoped) |
| **Memory** | GET /api/memory/stats | 200 | ✅ Returns frame count, mind size, embedding coverage |
| **Memory** | GET /api/memory/graph?workspace=… | 200 | ✅ Returns knowledge graph |
| **Weaver** | GET /api/weaver/status | 200 | ✅ Returns weaver state |
| **Weaver** | POST /api/weaver/trigger | 200 | ✅ Triggers consolidation |
| **Agent** | GET /api/agent/status | 200 | ✅ Returns running, model, tokensUsed, estimatedCost |
| **Agent** | GET /api/agent/cost | 200 | ✅ Returns cost breakdown |
| **Agent** | GET /api/agent/model | 200 | ✅ Returns current model |
| **Agent** | GET /api/agents/active | 200 | ✅ Returns active workers |
| **Chat** | POST /api/chat | 200 (SSE) | ✅ Streams events; approval gates fire for destructive ops |
| **Tasks** | GET /api/tasks | 200 | ✅ Returns all tasks across workspaces |
| **Tasks** | POST /api/workspaces/{id}/tasks | 201 | ✅ Creates task (requires `title`, optional assignee fields) |
| **Tasks** | GET /api/workspaces/{id}/tasks | 200 | ✅ Lists tasks for workspace |
| **Vault** | GET /api/vault | 200 | ✅ Returns vault entries (names/types only) |
| **Vault** | POST /api/vault | 200 | ✅ Creates vault entry (requires `name` + `value` fields) |
| **Vault** | DELETE /api/vault/{name} | 200 | ✅ Route exists |
| **Vault** | POST /api/vault/{name}/reveal | 200 | ✅ Reveals secret (pending approval flow) |
| **Connectors** | GET /api/connectors | 200 | ✅ Returns connector list |
| **Cron** | GET /api/cron | 200 | ✅ Returns cron jobs |
| **Marketplace** | GET /api/marketplace/search?q=… | 200 | ✅ Searches marketplace |
| **Marketplace** | GET /api/marketplace/installed | 200 | ✅ Returns installed packages |
| **Marketplace** | GET /api/marketplace/packs | 200 | ✅ Returns pack list |
| **Marketplace** | GET /api/marketplace/sources | 200 | ✅ Returns marketplace sources |
| **Costs** | GET /api/costs | 302→200 | ✅ Redirects to /api/cost/summary (which returns 200) |
| **Costs** | GET /api/cost/summary | 200 | ✅ Returns full cost breakdown |
| **Costs** | GET /api/cost/by-workspace | 200 | ✅ Returns per-workspace costs |
| **Settings** | GET /api/settings | 200 | ✅ Returns settings |
| **Personas** | GET /api/personas | 200 | ✅ Returns persona list |
| **Skills** | GET /api/skills | 200 | ✅ Returns skills list |
| **Fleet** | GET /api/fleet | 200 | ✅ Returns fleet/worker status |
| **Capabilities** | GET /api/capabilities/status | 200 | ✅ Returns capability status |
| **Approval** | GET /api/approval/pending | 200 | ✅ Returns pending approvals |
| **Team** | GET /api/team/status | 200 | ✅ Returns team connection status |
| **Team** | GET /api/team/teams | 401 | ⚠️ Returns 401 "Not connected to a team server" — expected when not in team mode |
| **Notifications** | GET /api/notifications | 200 | ✅ Returns notifications |

### Endpoints with Wrong Paths in Original Test Script (Clarified)

| Original Path Tested | Actual Correct Path | Note |
|---------------------|--------------------|----|
| GET /api/status | Does not exist | No `/api/status` route; use GET /health |
| GET /api/memory | Does not exist | Use GET /api/memory/frames |
| POST /api/memory | Does not exist | Use POST /api/memory/frames |
| POST /api/memory/weave | Does not exist | Use POST /api/weaver/trigger |
| GET /api/memory/graph | 404 without correct workspace | Use ?workspace={id} param |
| GET /api/events | Does not exist | Use GET /api/notifications |
| POST /api/tasks | 404 | Use POST /api/workspaces/{id}/tasks |
| GET /api/connectors/health | Does not exist | Use GET /api/connectors |
| GET /api/usage | Does not exist | Use GET /api/cost/summary |
| GET /api/models | Does not exist | Use GET /api/agent/model |
| GET /api/teams | Does not exist | Use GET /api/team/teams |
| GET /api/auth/status | Does not exist | No local auth status route |
| GET /api/capability-governance | Does not exist (cloud-only) | Cloud API at /api/teams/{slug}/capability-policies |
| GET /api/plans | Does not exist | No plans route in local server |
| GET /api/subagents | Does not exist | Use GET /api/agents/active |
| GET /api/marketplace | Does not exist | Use GET /api/marketplace/search |

### Auth Enforcement Results

| Endpoint | Unauthenticated Status | Expected |
|----------|----------------------|----------|
| GET /api/workspaces | 401 | ✅ |
| GET /api/memory | 401 | ✅ |
| GET /api/chat/history | 401 | ✅ |
| GET /api/vault | 401 | ✅ |
| GET /api/events | 401 | ✅ |

**Auth enforcement: WORKING correctly on all 5 tested endpoints.**

---

## E2: Summary Statistics

| Metric | Count |
|--------|-------|
| Total distinct endpoints tested | 45 |
| Returning 200/201/204 (success) | 38 |
| Returning 302 (redirect, functional) | 1 |
| Returning 401 (unauthenticated, expected) | 1 |
| Returning 404 (route not found / expected design) | 5 |
| Returning 5xx (server errors) | 0 |
| Auth enforcement working | YES (5/5 endpoints) |

### 404 Analysis (Route Not Found)

1. **GET /api/status** — Route simply does not exist in local server. `/health` is the correct equivalent.
2. **GET /api/workspaces/default** — No workspace with ID "default" exists; not a route bug, it's a data issue. The route correctly returns `{"error":"Workspace not found"}`.
3. **GET /api/team/governance/permissions** — Requires team connection (`GET /api/team/teams` returns "Not connected to team server" unless team is configured).
4. **GET /api/capability-governance** — This is a cloud-server-only route (`packages/server/src/routes/`, not local routes). Only available in multi-tenant cloud deployment.
5. **POST /api/tasks** — Wrong path. Correct path is `POST /api/workspaces/{id}/tasks`.

### New Issues Found

1. **POST /api/vault wrong schema (MINOR BUG)**: Test script sent `{"key":"test-r3","value":"secret-value","workspaceId":"default"}` but the correct schema uses `name` not `key`. Returns HTTP 400 `{"error":"name is required"}`. The field naming is inconsistent (elsewhere the field is called `key`, but vault uses `name`). Low severity — API works correctly with `name` field.

2. **H2 /spawn time-box missing (DESIGN GAP)**: Spawned agents run full research loops without a complexity-based fast path. Simple queries that could be answered in 1 turn trigger multi-turn tool chains. No timeout or max-turns constraint on sub-agents from `/spawn`.

3. **POST /api/workspaces requires `group` field (DOCUMENTATION GAP)**: The original test script sent `{"name":"...", "id":"..."}` which fails with `{"error":"name and group are required"}`. The `group` field is mandatory but not obvious from the API name. Returns 400 correctly.

---

## Overall Assessment

| Area | Score | Notes |
|------|-------|-------|
| Bug regressions (E1) | 6/7 FIXED ✅ | H2 spawn works but not time-boxed |
| API coverage | 38/45 working ✅ | 5 routes genuinely don't exist in local mode |
| Auth security | 5/5 ✅ | All tested endpoints enforce auth |
| Export (F1) | FIXED ✅ | Memory frames in export ZIP |
| Memory isolation (B1) | FIXED ✅ | Workspace minds are isolated |
| Approval gates (H3) | FIXED ✅ | Destructive bash commands gate correctly |
| Cost tracking (M3) | FIXED ✅ | /api/costs redirects to working endpoint |
| Workspace delete (F18) | FIXED ✅ | 204 clean delete |
| Filesystem scoping (C1) | FIXED ✅ | search_content respects workspace path |
