# CRUD Workflow Retest Results

**Date:** 2026-03-21T19:00-19:05 UTC
**Server:** http://localhost:3333
**Auth:** Bearer token (SHA-256 verified)
**Tester:** Automated curl-based CRUD validation

---

## 1. Workspace CRUD

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| Create | `POST /api/workspaces` | 201 | **PASS** | Required `group` field (not in test spec). Body: `{"name":"RETEST-Workspace","group":"RETEST","description":"Retest CRUD"}`. Response: `{"id":"retest-workspace","name":"RETEST-Workspace","group":"RETEST","created":"2026-03-21T19:00:54.536Z"}` |
| List | `GET /api/workspaces` | 200 | **PASS** | Returns ~46 workspaces. Newly created workspace present in list. |
| Get by ID | `GET /api/workspaces/:id` | 200 | **PASS** | Returns correct workspace: `{"id":"retest-workspace","name":"RETEST-Workspace","group":"RETEST",...}` |
| Update | `PUT /api/workspaces/:id` | 200 | **PASS** | Name updated from "RETEST-Workspace" to "RETEST-Updated". Response confirmed: `{"id":"retest-workspace","name":"RETEST-Updated",...}` |
| Delete | `DELETE /api/workspaces/:id` | 204 | **PASS** | No content returned (correct for 204). Workspace removed. |

**Verdict: 5/5 PASS**

> **Note:** The test spec used `{"name":"...","description":"..."}` but the API requires `group` as a mandatory field. Initial attempt returned HTTP 400: `"name and group are required"`. Fixed by adding `"group":"RETEST"`.

---

## 2. Memory CRUD

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| Create | `POST /api/memory/frames` | 200 | **PASS** | Correct endpoint is `/api/memory/frames` (not `/api/memory`). Field is `workspace` (not `workspaceId`). Response: `{"saved":true,"frameId":34,"mind":"workspace","importance":"normal","source":"import"}` |
| Search | `GET /api/memory/search?q=RETEST&workspace=test-project` | 200 | **PASS** | Found 1 result. Field is `workspace` (not `workspaceId`). Response: `{"results":[{"id":34,"content":"RETEST memory frame for CRUD validation","source":"user_stated","source_mind":"workspace",...}],"count":1}` |
| List | `GET /api/memory/frames?workspace=test-project&limit=5` | 200 | **PASS** | Correct endpoint is `/api/memory/frames` (not `/api/memory`). Returns frames including the newly created one. |
| Delete | `DELETE /api/memory/:id` | N/A | **N/A - NOT IMPLEMENTED** | No DELETE endpoint exists for memory frames. The route file has no `server.delete()` handler. |

**Verdict: 3/3 PASS (delete endpoint does not exist in the API)**

> **API Contract Differences from Test Spec:**
> - Create endpoint: `/api/memory/frames` not `/api/memory`
> - List endpoint: `/api/memory/frames` not `/api/memory`
> - Query param: `workspace` not `workspaceId`
> - No DELETE endpoint for memory frames exists

---

## 3. Marketplace CRUD

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| List/Browse | `GET /api/marketplace/search?limit=5` | 200 | **PASS** | No `/api/marketplace/packages` endpoint exists. Use `/search` without `query` to browse. Returns packages array. |
| Search | `GET /api/marketplace/search?query=research&limit=3` | 200 | **PASS** | Search param is `query` (not `q`). Returns matching packages. Found "Learning Research Designer" and others. |
| Stats | `GET /api/marketplace/stats` | N/A | **N/A - NOT IMPLEMENTED** | No `/api/marketplace/stats` endpoint exists. |
| Installed | `GET /api/marketplace/installed` | 200 | **PASS** | Returns installed packages with metadata. |
| Packs | `GET /api/marketplace/packs` | 200 | **PASS** | Returns 17+ capability packs with metadata. |
| Categories | `GET /api/marketplace/categories` | 200 | **PASS** | Returns all package categories. |

**Verdict: 5/5 PASS (on existing endpoints; `/packages` and `/stats` do not exist)**

> **API Contract Differences from Test Spec:**
> - No `/api/marketplace/packages` endpoint -- use `/api/marketplace/search` without query param
> - No `/api/marketplace/stats` endpoint -- no equivalent exists
> - Search param is `query` (not `q`)

---

## 4. Cron CRUD

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| Create | `POST /api/cron` | 200 | **PASS** | Required fields: `name`, `cronExpr`, `jobType`. Valid jobTypes: `agent_task`, `memory_consolidation`, `workspace_health`, `proactive`, `prompt_optimization`, `monthly_assessment`. `agent_task` type requires `workspaceId`. Response: `{"id":31,"name":"RETEST-cron","cronExpr":"0 9 * * *","jobType":"agent_task",...}` |
| List | `GET /api/cron` | 200 | **PASS** | Returns `{"schedules":[...],"count":29}`. Count incremented after create. |
| Get by ID | `GET /api/cron/:id` | 200 | **PASS** | Returns exact cron job: `{"id":31,"name":"RETEST-cron",...}` |
| Delete | `DELETE /api/cron/:id` | 200 | **PASS** | Response: `{"ok":true,"id":31}` |

**Verdict: 4/4 PASS**

> **API Contract Differences from Test Spec:**
> - Field names: `cronExpr` (not `schedule`), `jobType` (not `type`), `jobConfig` (not `config`)
> - `jobType` must be one of: `agent_task`, `memory_consolidation`, `workspace_health`, `proactive`, `prompt_optimization`, `monthly_assessment` (not free-form like `reminder`)
> - `agent_task` jobs require `workspaceId`

---

## 5. Vault CRUD

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| Store | `POST /api/vault` | 200 | **PASS** | Field is `name` (not `key`). Body: `{"name":"RETEST_SECRET","value":"test123"}`. Response: `{"success":true,"name":"RETEST_SECRET"}` |
| List | `GET /api/vault` | 200 | **PASS** | Returns `{"secrets":[...]}` with name, type, updatedAt, isCommon. RETEST_SECRET present in list. |
| Get/Reveal | `POST /api/vault/:name/reveal` | 200 | **PASS** | Reveal is POST (not GET). Returns decrypted value: `{"name":"RETEST_SECRET","value":"test123","type":"api_key"}` |
| Delete | `DELETE /api/vault/:name` | 200 | **PASS** | Response: `{"deleted":true,"name":"RETEST_SECRET"}`. Verified removal: RETEST_SECRET absent from subsequent list. |

**Verdict: 4/4 PASS**

> **API Contract Differences from Test Spec:**
> - Store field: `name` (not `key`)
> - Reveal/Get: `POST /api/vault/:name/reveal` (not `GET /api/vault/:name`)

---

## 6. Export

| Operation | Endpoint | HTTP | Result | Notes |
|-----------|----------|------|--------|-------|
| Export | `POST /api/export` | 200 | **PASS** | Must NOT send `Content-Type: application/json` header (Fastify rejects empty JSON bodies). Response is a ZIP stream. |
| File check | `ls -la` | -- | **PASS** | File size: 211,955 bytes (207 KB) |
| ZIP contents | `unzip -l` | -- | **PASS** | Contains: `memories/personal-frames.json`, `sessions/` (multiple workspace session transcripts as markdown), workspace configs. 27+ files across multiple workspace session directories. |

**Verdict: 3/3 PASS**

> **API Contract Differences from Test Spec:**
> - Method is POST (not GET)
> - Must NOT include `Content-Type: application/json` header
> - No `workspaceId` query param -- exports everything

---

## Summary

| # | Workflow | Operations Tested | Passed | Failed | Not Implemented |
|---|----------|------------------|--------|--------|----------------|
| 1 | Workspace CRUD | 5 | 5 | 0 | 0 |
| 2 | Memory CRUD | 3 (+1 N/A) | 3 | 0 | 1 (delete) |
| 3 | Marketplace CRUD | 5 (+2 N/A) | 5 | 0 | 2 (packages list, stats) |
| 4 | Cron CRUD | 4 | 4 | 0 | 0 |
| 5 | Vault CRUD | 4 | 4 | 0 | 0 |
| 6 | Export | 3 | 3 | 0 | 0 |
| **Total** | | **24** | **24** | **0** | **3** |

### Overall: 24/24 PASS (0 failures)

All existing API endpoints returned correct responses. Three operations from the test spec reference endpoints that do not exist in the current API surface:
1. `DELETE /api/memory/:id` -- no memory deletion endpoint
2. `GET /api/marketplace/packages` -- use `/api/marketplace/search` instead
3. `GET /api/marketplace/stats` -- no stats endpoint

### Key API Contract Corrections (vs. test spec)

| Test Spec | Actual API |
|-----------|-----------|
| `POST /api/workspaces` with `name`, `description` | Requires `group` field |
| `POST /api/memory` with `workspaceId` | `POST /api/memory/frames` with `workspace` |
| `GET /api/memory?workspaceId=` | `GET /api/memory/frames?workspace=` |
| `GET /api/memory/search?q=&workspaceId=` | `GET /api/memory/search?q=&workspace=` |
| `DELETE /api/memory/:id` | Not implemented |
| `GET /api/marketplace/packages` | `GET /api/marketplace/search` (no query = browse) |
| `GET /api/marketplace/search?q=` | `GET /api/marketplace/search?query=` |
| `GET /api/marketplace/stats` | Not implemented |
| Cron: `schedule`, `type`, `config` | Cron: `cronExpr`, `jobType`, `jobConfig` |
| Cron jobType: `reminder` | Must be: `agent_task`, `memory_consolidation`, `workspace_health`, `proactive`, `prompt_optimization`, `monthly_assessment` |
| Vault: `key` | Vault: `name` |
| `GET /api/vault/:name` | `POST /api/vault/:name/reveal` |
| `GET /api/export?workspaceId=` | `POST /api/export` (no params, no Content-Type header) |
