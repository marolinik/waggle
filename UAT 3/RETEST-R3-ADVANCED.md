# Waggle Advanced Re-Test Round 3 — Teams / Audit / Model / Storage / Stress
**Date:** 2026-03-22
**Server:** localhost:3333
**Auth:** Bearer token (d375bb81…)
**WAGGLE_AUTO_APPROVE:** 1
**Previous score:** 62/100

---

## TEAM SIMULATION

| # | Test | Result | Notes |
|---|------|--------|-------|
| T1 | POST /api/teams — create 'Engineering Squad' | ✅ PASS | `team-deb0d3e5` returned with owner member pre-attached |
| T2 | GET /api/teams — verify listed | ✅ PASS | Team visible in list (3 teams total) |
| T3 | GET /api/teams/:id — detail | ✅ PASS | Returns `members[]` and `workspaces[]` arrays |
| T4 | Add member `ana` as `member` | ✅ PASS | Returns member object with join timestamp |
| T5 | Add member `sara` as `viewer` | ✅ PASS | Correct role persisted |
| T6 | Verify 3 members (owner + ana + sara) | ✅ PASS | Exactly 3 members: `local-user/owner`, `ana/member`, `sara/viewer` |
| T7 | Create workspace with teamId | ✅ PASS | `squad-workspace` created with `teamId: team-deb0d3e5` |
| T8 | GET /api/workspaces?teamId=X — filter works | ✅ PASS | Returns only the 1 team workspace |
| T9 | PUT /api/teams/:id/members/sara — role→member | ✅ PASS | Role updated correctly |
| T10 | DELETE /api/teams/:id/members/ana | ✅ PASS | Ana removed; final state: owner + sara-as-member |

**Team score: 10/10**

---

## AUDIT TRAIL

| # | Test | Result | Notes |
|---|------|--------|-------|
| A1 | GET /api/events — list all | ✅ PASS | 100 returned (pagination cap). Types: `tool_result: 45`, `tool_call: 44`, `workspace_create: 5`, `memory_delete/write: 3 each` |
| A2 | GET /api/events?eventType=tool_call | ❌ FAIL | **Filter NOT applied.** Returns 100 events with ALL types (tool_result, memory_write, workspace_create included). The `eventType` query param is ignored by the server. |
| A3 | GET /api/events?workspaceId=default | ✅ PASS | Returns 30 events scoped to `default` workspace — filter works for workspaceId |
| A4 | GET /api/events/stats | ✅ PASS | Rich stats: totalEvents=375, byType breakdown, byDay, topTools (add_plan_step: 47, search_memory: 44) |
| A5 | 3 actions → verify new events | ✅ PASS | Before: 375. Created workspace (+1 workspace_create), sent chat (+2 tool events). After: 378 — 3 new events correctly recorded. Note: memory save via `/api/workspaces/:id/memory` → 404 (wrong endpoint; real endpoint is `/api/memory/frames`) |

**Audit score: 4/5** — `eventType` filter bug is a significant regression.

### Audit Bug Detail
```
GET /api/events?eventType=tool_call
Expected: only tool_call events
Actual: {'memory_delete', 'memory_write', 'tool_call', 'tool_result', 'workspace_create'} — all 100 events
```

---

## PER-WORKSPACE MODEL

| # | Test | Result | Notes |
|---|------|--------|-------|
| M1 | POST /api/workspaces with `model: 'claude-opus-4'` | ✅ PASS | Model field stored and returned |
| M2 | GET /api/workspaces/:id — model field present | ✅ PASS | `"model": "claude-opus-4"` in response |
| M3 | Chat to opus workspace — model routing | ⚠️ PARTIAL | Routing IS attempted (Anthropic returned `not_found_error: model: claude-opus-4`). The model setting is respected — the issue is `claude-opus-4` is not a valid Anthropic model ID (correct: `claude-opus-4-6`). Model routing plumbing works; model name validation/docs are missing. |
| M4 | Create workspace with `model: 'claude-haiku-4-5-20251001'` | ✅ PASS | Valid model stored correctly |
| M5 | Chat haiku workspace — routing | ✅ PASS | `event: done` received; no model errors — haiku used successfully |
| M6 | GET /api/fleet for model attribution | ⚠️ PARTIAL | `{"sessions":[],"count":0}` — fleet only shows active concurrent sessions; no historical model attribution. Not a bug per-se but no insight between calls. |

**Model score: 4/6** — routing works, haiku confirmed. Opus fails only on invalid model name. Fleet attribution requires active session.

---

## VIRTUAL STORAGE

| # | Test | Result | Notes |
|---|------|--------|-------|
| S1 | POST /api/workspaces WITHOUT directory | ✅ PASS | `virtual-storage-test` created without `directory` field |
| S2 | GET /api/workspaces/:id/storage — `storageType: 'virtual'` | ✅ PASS | `{"storageType":"virtual","usedBytes":0,"fileCount":0,"rootPath":"C:\\Users\\MarkoMarkovic\\.waggle\\workspaces\\virtual-storage-test\\files"}` |
| S3 | POST storage/write?path=test.txt | ✅ PASS | `{"written":true,"path":"test.txt"}` |
| S4 | GET storage/files — file listed | ✅ PASS | `{"files":[{"name":"test.txt","size":35,"isDirectory":false}],"storageType":"virtual"}` |
| S5 | GET storage/read?path=test.txt | ✅ PASS | Returns `text/plain` (not JSON) — content: `"Hello from R3 virtual storage test!"` — exact match. Note: response content-type is `text/plain`, not JSON, which may surprise clients. |
| S6 | Verify file in `.waggle` managed storage (not homedir) | ✅ PASS | rootPath contains `.waggle/workspaces/virtual-storage-test/files` — correctly isolated |
| S7 | Create workspace WITH directory — `storageType: 'linked'` | ✅ PASS | `{"storageType":"linked","usedBytes":9799703486,"fileCount":7356,"directory":"D:/Projects/MS Claw/waggle-poc"}` — reads real fs |
| S8 | DELETE storage/delete?path=test.txt | ✅ PASS | Empty 200 response (no body). Files list after: `[]` — file gone. |

**Storage score: 8/8 — PERFECT**

### Minor: Read returns `text/plain` not JSON
The read endpoint returns raw file content as `text/plain`. Clients that expect JSON (e.g., `{"content":"..."}`) will fail to parse. No functional regression but a UX inconsistency vs all other endpoints.

---

## ONBOARDING CHECK

| # | Test | Result | Notes |
|---|------|--------|-------|
| O1 | GET /api/settings → `onboardingCompleted` field | ❌ FAIL | Field absent from settings response. Settings returns: `defaultModel, providers, mindPath, dataDir, litellmUrl, dailyBudget`. `onboardingCompleted` is never read back from server — it's stored only in `localStorage` client-side. |
| O2 | Onboarding wizard component exists | ✅ PASS | Full wizard implemented: `OnboardingWizard.tsx`, `useOnboarding.ts`, `steps/ApiKeyStep.tsx`, `steps/NameStep.tsx`, `steps/ReadyStep.tsx`, `steps/WorkspaceStep.tsx`. App.tsx mounts it when `!s.completed`. |

**Onboarding score: 1/2**

### Onboarding Architecture Gap
`useOnboarding.ts` writes `onboardingCompleted: true` to server via `PATCH /api/settings` on completion, but the settings `GET` handler never reads/returns this field from config. If the user's localStorage is cleared, there is no way to recover onboarding completion state from the server. The flag is write-only on the server side.

---

## STRESS TESTS

| # | Test | Result | Notes |
|---|------|--------|-------|
| ST1 | Create 5 workspaces rapidly (sequential) | ✅ PASS | All created: `stress-ws-1` through `stress-ws-5` with correct IDs |
| ST2 | Save 10 memory frames across workspaces | ✅ PASS (with friction) | `/api/workspaces/:id/memory` → 404 (not the right path). Correct: `POST /api/memory/frames` with `workspaceId` + `source` field required. All 10 saved after discovery. API discoverability is poor — undocumented `source` constraint. |
| ST3 | Isolation verification | ✅ PASS | Each workspace's unique terms (Alpha/Gamma/Epsilon/Eta/Iota) found only in own workspace. Cross-searches: 0 contamination hits in both directions. |
| ST4 | GET /api/workspaces — all 5 present | ✅ PASS | 5/5 stress workspaces confirmed in listing |
| ST5 | Delete all 5 — verify cleanup | ✅ PASS | All 5 deleted; 0 remaining in listing |

**Stress score: 5/5** (API friction noted but not a FAIL)

### Memory API Discovery Issue
The stress test expected `/api/workspaces/:id/memory` to work (it doesn't — 404). The actual memory save API is:
```
POST /api/memory/frames
Body: { content, workspaceId, importance, source: "user_stated" | "tool_verified" | "agent_inferred" | "import" | "system" }
```
The `source` field is required but undocumented. First attempt returned `400 Bad Request`. This is an API usability issue.

---

## SCORE SUMMARY

| Category | Score | Max | % |
|----------|-------|-----|---|
| Team Simulation | 10 | 10 | 100% |
| Audit Trail | 4 | 5 | 80% |
| Per-Workspace Model | 4 | 6 | 67% |
| Virtual Storage | 8 | 8 | 100% |
| Onboarding Check | 1 | 2 | 50% |
| Stress Tests | 5 | 5 | 100% |
| **TOTAL** | **32** | **36** | **89%** |

---

## FINAL SCORE: **82/100**

*(Weighted: deducted for audit filter regression impact, onboarding server-side gap, and model name validation absence)*

**Previous score: 62/100 → +20 improvement**

---

## BUGS / REGRESSIONS

### 🔴 HIGH — Audit eventType filter broken
```
GET /api/events?eventType=tool_call
Returns: ALL event types (not filtered)
Expected: only tool_call events
```
The filter param is either not parsed or not applied in the events route handler.

### 🟡 MEDIUM — onboardingCompleted not in GET /api/settings
- Write-only on server (PATCH works, GET doesn't return it)
- localStorage-only persistence means wizard re-triggers after cache clear
- Fix: include `onboardingCompleted` in config schema and GET response

### 🟡 MEDIUM — Model name validation missing
- Workspace accepts invalid model IDs (e.g., `claude-opus-4` → should be `claude-opus-4-6`)
- No validation or helpful error at workspace creation time
- Error only surfaces at chat-time as API 404

### 🟢 LOW — Storage read endpoint returns text/plain
- `GET /api/workspaces/:id/storage/read` returns raw `text/plain`
- All other storage endpoints return JSON
- Should return `{"content":"...", "path":"..."}` for consistency

### 🟢 LOW — Memory API undocumented `source` requirement
- `POST /api/memory/frames` silently requires `source` field
- Returns `400` with only `Bad Request` message — no field guidance
- Fix: make `source` default to `"user_stated"` or include in error message

### 🟢 LOW — DELETE endpoints return empty body
- `DELETE /api/teams/:id/members/:userId` → empty body (no confirmation)
- `DELETE /api/workspaces/:id/storage/delete?path=X` → empty body
- Convention: return `{"deleted": true}` or `204 No Content`

---

## WHAT IMPROVED SINCE R2

| Area | Was | Now |
|------|-----|-----|
| Teams CRUD | Partial (member mgmt gaps) | Full 10/10 |
| Storage types | Not tested | 8/8 perfect |
| Memory isolation | Some contamination risk | Proven clean |
| Stress create+delete | Untested | 5/5 clean |
| Event stats | No topTools | Rich stats with topTools |

## WHAT REMAINS BROKEN

1. `eventType` filter in `/api/events` — broken since at least R2
2. `onboardingCompleted` in settings GET — architectural gap
3. Model name validation at workspace creation time

---

## RECOMMENDATIONS (Priority Order)

1. **Fix audit eventType filter** — impacts every audit/compliance feature
2. **Return `onboardingCompleted` from GET /api/settings** — 2-line fix
3. **Validate model IDs at workspace creation** — check against known models list
4. **Make `source` optional in memory API** — default to `"user_stated"`
5. **Standardize DELETE responses** — return `{"deleted": true}` consistently
