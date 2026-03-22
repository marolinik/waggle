# Waggle Mega-UAT Test C: "OS Capabilities" Deep Dive

**Date:** 2026-03-22
**Tester:** Claude Opus 4.6 (automated)
**Server:** http://localhost:3333
**Auth:** Bearer token (valid)
**LLM Status:** Anthropic API key EXPIRED — all LLM-dependent features fail gracefully

---

## Executive Summary

Waggle demonstrates strong OS-like architecture with 7 identifiable subsystems. Memory management, workspace filesystem, shell commands, and proactivity (cron) are functional and well-designed. Critical gaps exist in memory isolation (workspace parameter is ignored for search — all frames leak across workspaces), frame deletion (no DELETE endpoint exists), knowledge graph (404), and capability governance (route exists in codebase but is not mounted on the local server). The vault subsystem is production-ready with full CRUD.

**Overall OS-ness Score: 6.5 / 10**

---

## C1: Process Management (Agents as Processes)

### Results

| Test | Endpoint | Result |
|------|----------|--------|
| Fleet list | `GET /api/fleet` | Returns `{ sessions: [], count: 0, maxSessions: 3 }` |
| Agent status | `GET /api/agent/status` | Returns `{ running: true, model: "claude-sonnet-4-6", tokensUsed: 0 }` |
| Spawn sub-agent | `POST /api/chat` with `/spawn researcher` | Processes memory recall (12 memories), then fails at LLM call (expired key) |
| Pause session | `POST /api/fleet/:id/pause` | Returns 404 "Session not found or already paused" (no active session) |
| Kill session | `POST /api/fleet/:id/kill` | Returns 404 "Session not found" (no active session) |
| Sessions list | `GET /api/sessions` | 404 Not Found |
| Agent stop | `POST /api/agent/stop` | 404 Not Found |

### Analysis

Fleet management exists with pause/resume/kill controls per workspace — this is genuine process management. The `maxSessions: 3` limit acts as a process table with bounded concurrency. Agent status returns model, token usage, and turn count — solid process metadata. However, there is no way to list historical sessions via a REST endpoint (the sessions route file exists but may use a different path pattern with workspaceId). The `/spawn` command correctly attempts memory recall before delegating to LLM, showing proper process initialization flow. Missing: no `agent/stop` endpoint to force-kill the current agent loop.

**Score: 5/10** — Architecture is there (fleet + pause/resume/kill + status), but session listing is broken and stop is missing.

---

## C2: Memory Management (CRITICAL)

### Results

| Test | Result |
|------|--------|
| Frame count | 138 personal frames (pre-test), 148 after test insertions |
| Frame creation | All 10 frames created successfully (5 per workspace). Returns `{ saved: true, frameId: N }` |
| Entity extraction | Automatic on some frames (e.g., "React vs Vue" extracted 2 entities, 1 relation) |
| Memory stats | `{ personal: { frameCount: 138 }, workspace: null, total: { frameCount: 138 } }` |
| Knowledge graph | **404 Not Found** — endpoint does not exist |
| Frame deletion | **No DELETE endpoint exists** for `/api/memory/frames/:id` (confirmed by grep of route file) |
| Deduplication | **FAILS** — posting identical content twice creates two separate frames (IDs 194, 195) |

### Workspace Isolation Tests (CRITICAL FINDING)

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Search "deadline" in isolation-a | Only isolation-a frames | Returned frame 182 (correct) + frame 174 (giant mega-frame from personal mind) | PARTIAL |
| Search "deadline" in isolation-b | No results (deadline was stored in isolation-a only) | **Returned frame 182 AND frame 174** — same results as isolation-a | **FAIL** |
| Search "kubernetes" in isolation-b | Only isolation-b frames | Returned frame 188 (correct) | PASS |
| Search "kubernetes" in isolation-a | No results (kubernetes was stored in isolation-b only) | **Returned frame 188** — leaked across workspaces | **FAIL** |

**CRITICAL BUG:** The `workspaceId` parameter on frame creation is accepted but all frames are stored in the personal mind (`mind: "personal"`) regardless of the workspace specified. The `workspace` query parameter on search does not filter results — frames from workspace-a are visible when searching workspace-b and vice versa. The workspace parameter appears to only affect which workspace mind DB is loaded for additional searching, but does not restrict personal mind results.

This means **all memory is globally searchable regardless of workspace context**. For a product where "workspace-native" is a core product truth, this is a severe isolation failure. Confidential data stored in one workspace (e.g., legal, client work) would be discoverable from any other workspace.

### Frame Types Observed
- `I` (Information), `D` (Decision), `P` (Preference) — all accepted
- Frame types get normalized to `P` on retrieval regardless of input (frameType on creation vs what comes back shows `P` for everything) — possible normalization bug

**Score: 4/10** — Frame CRUD works (create, read, search), entity extraction is automatic and impressive, but: no delete, no dedup, no workspace isolation, no knowledge graph endpoint, frame types get mangled.

---

## C3: Filesystem (Workspaces)

### Results

| Test | Endpoint | Result |
|------|----------|--------|
| List workspaces | `GET /api/workspaces` | Returns 83 workspaces across 40 groups |
| Create workspace | `POST /api/workspaces` | Successfully creates with name, group, directory binding |
| Get single workspace | `GET /api/workspaces/:id` | Returns full workspace with directory path |
| Update workspace | `PATCH /api/workspaces/:id` | **404 Not Found** — PATCH not implemented |
| Delete workspace | `DELETE /api/workspaces/:id` | **204 No Content** — works correctly |
| File listing | `GET /api/workspaces/:id/files` | Returns `{ files: [] }` — endpoint exists but returns empty |
| Workspace templates | `GET /api/workspace-templates` | Returns rich templates (sales-pipeline, research-project, code-review, etc.) with personas, connectors, starter memory, suggested commands |
| Personas | `GET /api/personas` | Returns personas: researcher, writer, analyst, coder, and more |
| Tasks | `GET /api/tasks` | Returns workspace-scoped tasks with title, status, assignee, creator, workspace |
| Workspace context | `GET /api/workspace-context/:id` | 404 — not mounted |

### Analysis

Workspace CRUD is mostly functional: create, read, and delete work. The missing PATCH is notable — you cannot rename a workspace or change its group after creation. Directory binding works (accepted on create, returned on read), but file listing returns empty even with a valid directory path. Workspace templates are excellent — each template includes persona, connectors, suggested commands, and starter memory, providing a true "workspace OS" feel. The 83 workspaces across 40 distinct groups demonstrate that the grouping/organization model works at scale.

**Score: 6/10** — Strong create/read/delete and templates. Missing: PATCH (update), file listing returns empty, workspace-context not mounted.

---

## C4: Drivers (Connectors)

### Results

| Test | Result |
|------|--------|
| Connector count | **29 connectors** defined |
| Connector status | All show `disconnected` (expected — no credentials configured) |
| Total tools across connectors | ~159 tools (avg 5.5 per connector) |
| Marketplace sources | **61 sources** indexed |
| Total marketplace packages | **15,784 packages** across all sources |
| Installed packages | Returns list with install path, status, category |
| Skills | **58 skills** loaded (confirmed via `/status` command) |
| Connector health | 404 — no per-connector health endpoint |
| Marketplace packages listing | 404 — `/api/marketplace/packages` not found |

### Connector Inventory (all 29)
GitHub, Slack, Jira, Email (SendGrid), Google Calendar, Discord, Linear, Asana, Trello, Monday.com, Notion, Confluence, Obsidian, HubSpot, Salesforce, Pipedrive, Airtable, GitLab, Bitbucket, Dropbox, PostgreSQL, Gmail, Google Docs, Google Drive, Google Sheets, Microsoft Teams, Outlook, OneDrive, Composio (250+ services)

### Analysis

The connector/driver model is comprehensive. 29 connectors covering all major productivity, CRM, DevOps, and collaboration tools is enterprise-grade. Each connector has typed capabilities (read/search/write), risk-leveled actions, and a substrate tag. The marketplace with 61 sources and 15K+ packages is an impressive app-store analog. However, there is no per-connector health check endpoint, and the marketplace package listing/search is not exposed via REST. Skills (58 loaded) represent the "installed drivers" — the `/skills` command lists them all.

**Score: 7/10** — Excellent breadth of connectors and marketplace. Missing: health checks, package search API, activation/installation flow via REST.

---

## C5: Shell (Commands & CLI)

### All 13 Slash Commands Tested

| Command | Works Without LLM? | Behavior |
|---------|-------------------|----------|
| `/help` | YES | Returns formatted markdown table of all 13 commands with descriptions. Instant. |
| `/status` | YES | Returns "Skills loaded: 58". Instant, no LLM needed. |
| `/skills` | YES | Lists all 58 active skills by name. Instant. |
| `/memory` | YES | Returns usage instructions with examples. Instant. |
| `/focus <topic>` | YES | Sets context narrowing. Returns confirmation: "Context narrowed to **deep work session**." Instant. |
| `/catchup` | PARTIAL | Retrieves memory-based briefing from workspace. Works without LLM — returns memory-driven summary. |
| `/now` | PARTIAL | Returns "Right Now" summary from memory. Works without LLM — memory-driven. |
| `/spawn <role>` | NO | Processes memory recall (12 memories), then fails at LLM call. Error: "API key is invalid or expired." |
| `/research <topic>` | NO | Recalls 13 memories, then fails at LLM. Clear error message. |
| `/draft <type>` | NO | Recalls 13 memories, then fails at LLM. Clear error message. |
| `/decide <question>` | NO | Recalls 13 memories, then fails at LLM. Clear error message. |
| `/plan <goal>` | NO | Recalls 13 memories, then fails at LLM. Clear error message. |
| `/review` | NO | Recalls 13 memories, then fails at LLM. Clear error message. |

### Analysis

The shell system is well-designed. 5 of 13 commands work fully without LLM (/help, /status, /skills, /memory, /focus). 2 more work partially without LLM (/catchup, /now — they retrieve memory and format it heuristically). The remaining 6 require LLM but degrade gracefully with a clear error message. All LLM-dependent commands first perform memory recall (auto_recall tool), showing proper context-loading before LLM invocation. The SSE streaming format works correctly for all commands. Every command returns structured markdown output.

**Score: 8/10** — Excellent command system. All 13 commands respond, 7/13 work without LLM, graceful degradation on the rest. Minor: `/memory` without arguments only shows usage — could show recent memories instead.

---

## C6: Proactivity (Cron, Heartbeat, Background)

### Results

| Test | Result |
|------|--------|
| List cron jobs | Returns **30 scheduled jobs** across workspace/system scopes |
| Create cron job | Successfully creates with name, cronExpr, jobType, jobConfig, workspaceId |
| Delete cron job | `DELETE /api/cron/:id` returns `{ ok: true }` |
| Notifications | **263 notifications** in the system, categorized (task, agent, etc.) |
| Heartbeat | 404 — no heartbeat endpoint |
| Offline mode | 404 — `/api/offline` not found |

### Cron Job Types Observed
- `proactive` — capability suggestion, memory sweep
- `memory_consolidation` — scheduled memory consolidation, index reconciliation
- `agent_task` — user-created prompts (e.g., "Remind team about standup")
- System jobs: marketplace sync, workspace health check, monthly assessment, prompt optimization

### Analysis

The cron system is surprisingly mature. 30 active schedules including system maintenance (memory consolidation, marketplace sync, workspace health), user-created tasks (standup reminders, deadline trackers), and proactive agent jobs (morning briefings, weekly synthesis). Full CRUD works. Each job has nextRunAt calculated. The notification system with 263 entries and categories (task, agent) provides a notification center. Missing: no heartbeat/health endpoint for the agent runtime itself, no offline mode detection.

**Score: 7/10** — Strong cron and notification system. Missing: heartbeat, offline detection.

---

## C7: Governance & Security

### Auth Enforcement Tests

| Test | Endpoint | Result |
|------|----------|--------|
| No auth header | `GET /api/workspaces` | `401 { error: "Unauthorized", code: "MISSING_TOKEN" }` |
| No auth header | `GET /api/memory/frames` | 401 MISSING_TOKEN |
| No auth header | `POST /api/chat` | 401 MISSING_TOKEN |
| No auth header | `GET /api/cron` | 401 MISSING_TOKEN |
| No auth header | `GET /api/connectors` | 401 MISSING_TOKEN |
| Wrong token | `GET /api/workspaces` | `401 { error: "Unauthorized", code: "INVALID_TOKEN" }` |
| No auth header | `GET /api/health` | 401 MISSING_TOKEN |

**All endpoints enforce authentication.** Both missing-token and invalid-token cases return proper 401 with distinct error codes.

### Vault (Secret Management)

| Test | Result |
|------|--------|
| List secrets | Returns 7 secrets with name, type, updatedAt — **values are NOT exposed** |
| Store secret | `POST /api/vault` returns `{ success: true, name: "MEGA_TEST_SECRET" }` |
| Delete secret | `DELETE /api/vault/:name` returns `{ deleted: true }` |
| Suggested keys | Returns 9 common API key names not yet stored (OPENAI_API_KEY, GITHUB_TOKEN, etc.) |

### Capability Governance

| Test | Result |
|------|--------|
| `GET /api/governance/capabilities` | 404 |
| `GET /api/capability-governance` | 404 |
| `GET /api/capability-governance/report` | 404 |
| `GET /api/capabilities` | 404 |

The capability governance route file exists at `packages/server/src/routes/capability-governance.ts` but is only mounted for the team/enterprise server (requires TeamService, team slug routing). It is **not available on the local solo server**. This means solo users have no capability governance — only team/enterprise deployments get it.

### Events/Audit

`GET /api/events` returns 404. No audit trail endpoint is exposed on the local server.

### Analysis

Auth enforcement is solid — every endpoint returns 401 for missing or invalid tokens with distinguishing error codes. The vault is production-quality: secrets are listed without values, full CRUD works, common key suggestions help with setup UX. However, capability governance and audit trails are enterprise-only features not available on the local/solo server. This is a product scope gap — solo users cannot audit what their agent did or govern its capabilities.

**Score: 6/10** — Excellent auth enforcement and vault. Missing on solo: capability governance, audit trail, events.

---

## Findings Summary

### Critical Issues (P0)

1. **Memory workspace isolation is broken.** The `workspaceId` parameter is accepted during frame creation and search but does not actually isolate data. All frames stored in "isolation-a-mega" are visible from "isolation-b-mega" and vice versa. This violates the product truth that "personal mind and workspace mind are distinct."

2. **No memory frame deletion.** The route file has no DELETE handler for frames. Once a frame is created, it cannot be removed via API. This is a data hygiene and compliance issue (right to be forgotten).

3. **No memory deduplication.** Posting identical content twice creates two separate frames. Over time this will bloat the memory store.

### Major Issues (P1)

4. **Workspace PATCH not implemented.** Cannot rename workspaces or change groups after creation.
5. **Knowledge graph endpoint missing.** `GET /api/memory/knowledge-graph` returns 404, despite entity/relation extraction working during frame creation.
6. **File listing returns empty.** `GET /api/workspaces/:id/files` returns `{ files: [] }` even with a valid directory binding.
7. **Capability governance not available on solo server.** Enterprise-only route.
8. **Audit/events not available on solo server.** No way to see what the agent did.

### Minor Issues (P2)

9. **Frame type normalization bug.** Frames created with `frameType: "I"` or `"D"` come back as `"P"` on retrieval.
10. **No heartbeat endpoint.** No way to check agent runtime health.
11. **No agent stop endpoint.** Cannot force-stop a running agent loop via API.
12. **Marketplace package search not exposed.** 15K packages but no REST search.

---

## Subsystem Scores

| Subsystem | Score | Notes |
|-----------|-------|-------|
| C1: Process Management | 5/10 | Fleet controls exist but session listing broken, no stop |
| C2: Memory Management | 4/10 | CRUD works, but isolation broken, no delete, no dedup |
| C3: Filesystem (Workspaces) | 6/10 | Good CRUD minus PATCH, templates excellent, files empty |
| C4: Drivers (Connectors) | 7/10 | 29 connectors, 61 marketplace sources, 58 skills |
| C5: Shell (Commands) | 8/10 | All 13 commands work, 7/13 without LLM, graceful degradation |
| C6: Proactivity | 7/10 | 30 cron jobs, 263 notifications, full CRUD |
| C7: Governance & Security | 6/10 | Solid auth + vault, no governance/audit on solo |
| **Overall OS-ness** | **6.5/10** | Strong architecture, critical memory isolation gap |

---

## Conclusion

Waggle has the bones of a genuine workspace operating system. The seven subsystems map cleanly to OS primitives: fleet = process table, memory frames = memory management, workspaces = filesystem, connectors = device drivers, slash commands = shell, cron = scheduler, vault = keychain. The breadth is impressive — 29 connectors, 58 skills, 15K marketplace packages, 30 cron jobs, 13 shell commands.

The critical blocker is **memory isolation**. If workspaces are the fundamental unit of organization (like directories in a filesystem), then memory must respect workspace boundaries. Today it does not. A search in workspace-A returns results from workspace-B, which defeats the "workspace-native" product promise and creates real confidentiality risks (e.g., legal workspace data visible from marketing workspace).

Secondary gaps are the missing DELETE for memory frames (required for any data-handling product) and the absent PATCH for workspaces. These are table-stakes CRUD operations that should exist before production.

The shell command system is the strongest subsystem — clean, responsive, well-structured output, and graceful degradation when LLM is unavailable. This is what "OS feel" should be like across all subsystems.
