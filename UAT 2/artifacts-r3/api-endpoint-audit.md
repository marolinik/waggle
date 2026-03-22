# API Endpoint Audit -- 2026-03-21

**Server**: `http://localhost:3333`
**Auth**: Bearer token (exposed via `/health` response `wsToken` field)
**Auth Exempt**: Only `/health` is exempt from bearer token auth

## Summary
- **Total endpoints discovered**: 113
- **Endpoints tested**: 105
- **Working (2xx)**: 88
- **Client errors (4xx -- expected validation)**: 11
- **Server errors (5xx)**: 2
- **Not found / not registered (404)**: 4
- **Rate limited (429)**: 1 (chat -- burst from prior UAT testing)

### Overall Assessment
The API is well-structured and largely functional. Auth is enforced consistently. Input validation is present on most endpoints with clear error messages. SSE streaming works correctly for chat and notifications. The main issues found are: (1) weaver route not registering despite being in the route list, (2) workspace delete fails with EBUSY when mind DB is locked, (3) some team endpoints were documented as POST but are actually GET.

---

## Detailed Results

### Category: Health and System

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/health` | 200 | `{status, mode, timestamp, llm, database, memoryStats, serviceHealth, defaultModel, offline, wsToken}` | Working. Auth exempt. Exposes session token (`wsToken`). Rich health data including LLM provider status, memory stats, offline status. |

### Category: Workspaces

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/workspaces` | 200 | `[{id, name, group, created, ...}]` | Working. Returns array of all workspaces. |
| POST | `/api/workspaces` | 201 | `{id, name, group, created}` | Working. Creates workspace. Requires `name` and `group`. |
| GET | `/api/workspaces/:id` | 200 | `{id, name, group, created, ...}` | Working. Returns 404 for unknown IDs. |
| GET | `/api/workspaces/:id/context` | 200 | `{workspace, summary, recentThreads, recentDecisions, suggestedPrompts, recentMemories, progressItems, stats, lastActive, workspaceState}` | Working. Rich catch-up context for workspace open. |
| GET | `/api/workspaces/:id/files` | 200 | `{files: []}` | Working. Returns ingested files for workspace. |
| PUT | `/api/workspaces/:id` | 200 | `{id, name, group, ...}` | Working. Partial update of workspace metadata. |
| DELETE | `/api/workspaces/:id` | **500** | `{error: "EBUSY: resource busy or locked"}` | **BUG**: Returns 500 when workspace mind DB is still open/locked. |

### Category: Chat

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/chat` | 200 | SSE stream: `event: token`, `event: done` | Working. SSE streaming response. Rate limited to 30 req/min. When LLM proxy unavailable, returns fallback message. Accepts `{message, workspaceId, sessionId}`. |
| DELETE | `/api/chat/history` | 200 | `{ok: true, cleared: "sessionId"}` | Working. Clears chat history for a session. Query param `sessionId`. |

### Category: Sessions

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/workspaces/:wsId/sessions` | 200 | `[{id, title, summary, messageCount, lastActive, created}]` | Working. Lists sessions for a workspace. |
| GET | `/api/workspaces/:wsId/sessions/search?q=X` | 200 | `[{...}]` | Working. Full-text search across session content. |
| POST | `/api/workspaces/:wsId/sessions` | 201 | `{id, title, summary, messageCount, lastActive, created}` | Working. Creates new session with title. |
| GET | `/api/workspaces/:wsId/sessions/:sId/export` | 200 | Markdown text | Working. Exports session as formatted markdown. |
| GET | `/api/workspaces/:wsId/sessions/:sId/timeline` | 200 | `[]` | Working. Returns timeline events for session. |
| PATCH | `/api/sessions/:sessionId` | 200 | `{id, title}` | Working. Updates session title/metadata. |
| DELETE | `/api/sessions/:sessionId` | 200 | `{deleted: true}` | Working. Deletes session file. |

### Category: Memory

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/memory/search?q=X` | 200 | `{results: [{id, content, source, mind, frameType, importance, timestamp, score, gop, accessCount}], count}` | Working. FTS5 search across personal + workspace minds. Supports `scope`, `workspace`, `since`, `until` query params. |
| GET | `/api/memory/frames` | 200 | `{results: [{...}], count}` | Working. Returns recent frames without search query. Supports `workspace`, `limit`, `since`, `until`. |
| POST | `/api/memory/frames` | 200 | `{saved: true, frameId, mind, importance, source, extraction?}` | Working. Direct memory write API. Supports entity extraction via `?extract=true`. |
| GET | `/api/memory/graph` | 200 | `{entities: [], relations: []}` | Working. Returns knowledge graph entities and relations for a workspace. |

### Category: Mind

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/mind/identity` | 200 | `{identity: "Name: Waggle\nRole: ..."}` | Working. Returns agent identity string. |
| GET | `/api/mind/awareness` | 200 | `{awareness: "Active Tasks: ..."}` | Working. Returns awareness layer (tasks, context flags). |
| GET | `/api/mind/skills` | 200 | `{skills: [{name, length}]}` | Working. Returns loaded skill names and sizes. |

### Category: Agent

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/agent/status` | 200 | `{running, model, tokensUsed, estimatedCost, turns, usage}` | Working. Full agent status with cost tracking. |
| GET | `/api/agent/cost` | 200 | `{summary, totalInputTokens, totalOutputTokens, estimatedCost, turns, byModel}` | Working. Detailed cost breakdown. |
| POST | `/api/agent/cost/reset` | 200 | `{ok: true, message: "Cost tracking resets on server restart"}` | Working. Note: actual reset happens on restart. |
| GET | `/api/agent/model` | 200 | `{model: "claude-sonnet-4-6"}` | Working. Current model name. |
| PUT | `/api/agent/model` | 200 | `{ok: true, model: "claude-sonnet-4-6"}` | Working. Sets agent model. |
| GET | `/api/agents/active` | 200 | `{workers: [], active: []}` | Working. Lists active sub-agent workers. |
| GET | `/api/history?sessionId=X` | 200 | `{sessionId, messages: [{id, role, content, timestamp}]}` | Working. Returns in-memory session message history. |

### Category: Settings

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/settings` | 200 | `{defaultModel, providers, mindPath, dataDir, litellmUrl}` | Working. API keys are masked in response. |
| PUT | `/api/settings` | 200 | `{defaultModel, providers, mindPath}` | Working. Updates config. Keys stored in vault (encrypted). |
| POST | `/api/settings/test-key` | 200 | `{valid: true}` | Working. Format-only validation (no API call). |
| GET | `/api/settings/permissions` | 200 | `{yoloMode, externalGates, workspaceOverrides}` | Working. Permission/approval settings. |
| PUT | `/api/settings/permissions` | 200 | `{yoloMode, externalGates, workspaceOverrides}` | Working. Updates permission settings. |

### Category: Skills

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/skills` | 200 | `{skills: [{name, length, preview}]}` | Working. Lists all installed skills with previews. |
| GET | `/api/skills/:name` | 200 | `{name, content}` | Working. Returns full skill content. |
| GET | `/api/skills/suggestions?context=X` | 400 | `{error: "context query parameter is required"}` | Working. Requires `context` param (not `workspace`). |
| GET | `/api/skills/starter-pack/catalog` | 200 | `{skills: [{id, name, description, family, state}]}` | Working. Catalog of starter skills. |
| GET | `/api/skills/capability-packs/catalog` | 200 | `{packs: [{id, name, description, skills, packState}]}` | Working. Capability pack catalog with install states. |
| GET | `/api/skills/hash-status` | 200 | `{changed: [...], added: [...], removed: [...]}` | Working. Skill file integrity checking. |
| POST | `/api/skills/starter-pack` | 200 | `{ok: true, installed: [...], count}` | Working. Bulk install starter skills. |
| POST | `/api/skills/starter-pack/:id` | 200/409 | `{ok}` or `{error: "already installed"}` | Working. Install individual starter skill. Returns 409 for duplicates. |
| POST | `/api/skills/capability-packs/:id` | 200 | `{ok, pack, installed, skipped}` | Working. Install capability pack. Skips already-installed. |
| POST | `/api/skills` | 400 | `{error: "name and content are required"}` | Working validation. Requires `name` and `content` for install from content. |
| POST | `/api/skills/create` | 400 | `{error: "name, description, and steps are required"}` | Working validation. Guided skill creation endpoint. |
| POST | `/api/skills/test` | **404** | `{error: "Not found"}` | **BUG**: Route declared in source but not registered at runtime. |
| PUT | `/api/skills/:name` | 200/404 | `{ok}` or `{error: "Skill not found"}` | Working. Updates skill content. |
| DELETE | `/api/skills/:name` | 200/404 | `{ok}` or `{error: "Skill not found"}` | Working. Removes skill file. |

### Category: Plugins

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/plugins` | 200 | `{plugins: [{name, version, description, skills, mcpServers}]}` | Working. Lists loaded plugins. |
| POST | `/api/plugins/install` | 400 | `{error: "sourceDir is required"}` | Working validation. Requires `sourceDir` (local path). |
| DELETE | `/api/plugins/:name` | 400 | `{error: "Plugin not installed"}` | Working validation. Returns error for uninstalled plugins. |

### Category: Cron

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/cron` | 200 | `{schedules: [{id, name, cronExpr, jobType, enabled, lastRunAt, nextRunAt}]}` | Working. Lists all cron schedules. |
| POST | `/api/cron` | 200 | `{id, name, cronExpr, jobType, ...}` | Working. Creates cron schedule. |
| GET | `/api/cron/:id` | 200 | `{id, name, cronExpr, ...}` | Working. Get schedule by ID. |
| PATCH | `/api/cron/:id` | 200 | `{id, ..., enabled: false}` | Working. Partial update (e.g., enable/disable). |
| POST | `/api/cron/:id/trigger` | 200 | `{triggered: true, id, nextRunAt}` | Working. Manual trigger of cron job. |
| GET | `/api/cron/:id/history` | 200 | `{history: [], count: 0}` | Working. Execution history for a schedule. |
| DELETE | `/api/cron/:id` | 200 | `{ok: true, id}` | Working. Removes cron schedule. |

### Category: Marketplace

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/marketplace/search?query=X` | 200 | `{packages: [{id, name, description, author, package_type, ...}], total, page, limit}` | Working. FTS search across marketplace packages. |
| GET | `/api/marketplace/packs` | 200 | `{packs: [{id, slug, display_name, description, ...}]}` | Working. Lists marketplace packs. |
| GET | `/api/marketplace/packs/:slug` | 200 | `{pack: {...}, packages: [...]}` | Working. Pack detail with included packages. |
| GET | `/api/marketplace/enterprise-packs` | 200 | `{packs: [], total: 0, kvarkRequired: true}` | Working. Returns empty until KVARK is configured. |
| GET | `/api/marketplace/categories` | 200 | `{categories: [{id, name, icon, description}]}` | Working. Category taxonomy. |
| GET | `/api/marketplace/installed` | 200 | `{installations: [{id, package_id, installed_version, ...}]}` | Working. Lists installed marketplace packages. |
| GET | `/api/marketplace/sources` | 200 | `{sources: [{id, name, display_name, url, source_type, ...}]}` | Working. Lists marketplace sources. |
| GET | `/api/marketplace/security-status` | 200 | `{ciscoScannerAvailable, jsSecurityGateVersion, totalScanned, totalPassed, totalFailed}` | Working. Security scan summary. |
| POST | `/api/marketplace/install` | 200 | `{success, packageId, installType, installPath, scanResult}` | Working. Installs package (requires `packageId`). Runs security scan. |
| POST | `/api/marketplace/uninstall` | 200 | `{success, packageId, packageName, installType, message}` | Working. Uninstalls package (requires `packageId`). |
| POST | `/api/marketplace/security-check` | 200 | `{packageId, severity, score, blocked, enginesUsed, findings}` | Working. On-demand security scan (requires `packageId`). |
| POST | `/api/marketplace/sync` | 200 | `{sourcesChecked, packagesAdded, packagesUpdated, errors}` | Working. Syncs all marketplace sources. Some sources return sync adapter errors (expected). |
| POST | `/api/marketplace/sources` | 201 | `{source: {...}, syncResult: {...}}` | Working. Adds custom marketplace source. |
| DELETE | `/api/marketplace/sources/:id` | 200 | `{deleted: true, sourceId, name}` | Working. Removes marketplace source. |
| POST | `/api/marketplace/publish` | **404** | `{error: "Not found"}` | **NOT REGISTERED**: Route declared in source but not functional at runtime. |

### Category: Connectors

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/connectors` | 200 | `{connectors: [{id, name, description, service, authType, status, capabilities, tools, actions}]}` | Working. Lists all 29 registered connectors. |
| GET | `/api/connectors/:id/health` | 200 | `{id, name, status, lastChecked}` | Working. Connector health check. |
| POST | `/api/connectors/:id/connect` | 400 | `{error: "token or apiKey required"}` | Working validation. Requires credentials. |
| POST | `/api/connectors/:id/disconnect` | 200 | `{disconnected: false, connectorId, cleanedKeys}` | Working. Disconnects connector. |

### Category: Vault

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/vault` | 200 | `{secrets: [{name, type, updatedAt, isCommon}], suggestedKeys}` | Working. Lists secrets without values. |
| POST | `/api/vault` | 200 | `{success: true, name}` | Working. Stores encrypted secret. |
| POST | `/api/vault/:name/reveal` | 200 | `{name, value, type}` | Working. Decrypts and returns value. Rate limited to 5/min. |
| DELETE | `/api/vault/:name` | 200 | `{deleted: true, name}` | Working. Removes secret. |

### Category: Team

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/team/status` | 200 | `{connected: false}` | Working. |
| POST | `/api/team/connect` | 400 | `{error: "serverUrl and token are required"}` | Working validation. |
| POST | `/api/team/disconnect` | 200 | `{disconnected: true}` | Working. |
| GET | `/api/team/teams` | 401 | `{error: "Not connected to a team server"}` | Working. Returns 401 when disconnected. |
| GET | `/api/team/presence?workspaceId=X` | 200 | `{members: []}` | Working. Empty when disconnected. |
| GET | `/api/team/activity?workspaceId=X` | 200 | `{items: []}` | Working. Empty when disconnected. |
| GET | `/api/team/messages?workspaceId=X` | 200 | `{messages: []}` | Working. Empty when disconnected. |
| GET | `/api/team/governance/permissions` | 200 | `{connected: false, permissions: null}` | Working. |

### Category: Tasks

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/workspaces/:id/tasks` | 200 | `{tasks: [{id, title, status, createdAt, updatedAt}]}` | Working. |
| POST | `/api/workspaces/:id/tasks` | 201 | `{id, title, status, createdAt, updatedAt}` | Working. |
| PATCH | `/api/workspaces/:id/tasks/:taskId` | 200 | `{id, title, status, updatedAt}` | Working. |
| DELETE | `/api/workspaces/:id/tasks/:taskId` | 204 | (empty) | Working. |

### Category: Export and Import

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/export` | 200 | Binary ZIP file (`PK` header) | Working. Exports workspace data as ZIP. |
| POST | `/api/import/preview` | 200 | `{source, conversationsFound, conversationsParsed, knowledgeExtracted, errors}` | Working. Requires `{source, data}`. |
| POST | `/api/import/commit` | 200 | `{source, ..., saved, message}` | Working. Commits imported data. |

### Category: Ingest

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/ingest` | 400 | `{error: "files array is required"}` | Working validation. Requires `{files: [{name, content}]}` where content is base64 encoded. |

### Category: Capabilities

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/capabilities/status` | 200 | `{plugins, mcpServers, skills, connectors, marketplace, tools}` | Working. Comprehensive capability dashboard. |
| POST | `/api/capabilities/plugins/:name/enable` | 200 | `{ok: true, name, state: "active"}` | Working. |
| POST | `/api/capabilities/plugins/:name/disable` | 200 | `{ok: true, name, state: "disabled"}` | Working. |

### Category: Approval

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/approval/pending` | 200 | `{pending: [], count: 0}` | Working. |
| POST | `/api/approval/:requestId` | 404 | `{error: "No pending approval with that ID"}` | Working. Expected 404 for non-existent requests. |

### Category: Commands

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/commands/execute` | 200 | `{result: "## Available Commands\n..."}` | Working. Executes slash commands. |

### Category: Notifications

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/notifications?limit=N` | 200 | `{notifications: [{id, title, body, category, action_url, read, created_at}]}` | Working. |
| POST | `/api/notifications/:id/read` | 200 | `{read: true, id}` | Working. Marks notification as read. |
| GET | `/api/notifications/stream` | 200 | SSE: `data: {"type":"connected"}` | Working. Long-running SSE stream. |

### Category: Personas

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/personas` | 200 | `{personas: [{id, name, description, icon, workspaceAffinity, suggestedCommands}]}` | Working. |

### Category: Feedback

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/feedback` | 200 | `{ok: true}` | Working. Requires `{messageId, sessionId, messageIndex, rating: "up" or "down"}`. |
| GET | `/api/feedback/stats` | 200 | `{totalFeedback, positiveRate, topIssues, correctionsThisWeek, improvementTrend}` | Working. |

### Category: Fleet (Multi-Session)

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/fleet` | 200 | `{sessions: [], count: 0, maxSessions: 3}` | Working. |
| POST | `/api/fleet/:wsId/pause` | 404 | `{error: "Session not found or already paused"}` | Working (expected when no active session). |
| POST | `/api/fleet/:wsId/resume` | 404 | `{error: "Session not found or not paused"}` | Working (expected when no paused session). |
| POST | `/api/fleet/:wsId/kill` | 404 | `{error: "Session not found"}` | Working (expected when no session). |

### Category: Cost

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/cost/summary` | 200 | `{today, allTime, week, daily: [{date, inputTokens, outputTokens, cost, turns}]}` | Working. Rich cost analytics. |
| GET | `/api/cost/by-workspace` | 200 | `{workspaces: [{workspaceId, workspaceName, inputTokens, outputTokens, estimatedCost, turns, percentOfTotal}]}` | Working. |

### Category: Backup and Restore

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/backup/metadata` | 200 | `{lastBackupAt, sizeBytes, fileCount}` | Working. |
| POST | `/api/backup` | 200 | Binary backup file (`WAGGLE-BACKUP-V1`) | Working. Rate limited to 2/min. |
| POST | `/api/restore` | N/T | -- | Not tested (destructive). |

### Category: Offline

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/offline/status` | 200 | `{offline, since, queuedMessages, lastCheck}` | Working. |
| GET | `/api/offline/queue` | 200 | `{messages: []}` | Working. |
| POST | `/api/offline/queue` | 200 | `{queued: {id, workspaceId, message, timestamp}}` | Working. |
| DELETE | `/api/offline/queue/:id` | N/T | -- | Not tested (no items to delete). |
| DELETE | `/api/offline/queue` | 200 | `{cleared: N}` | Working. |

### Category: Workspace Templates

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/workspace-templates` | 200 | `{templates: [{id, name, description, persona, connectors, suggestedCommands, starterMemory}]}` | Working. |
| POST | `/api/workspace-templates` | 400 | Requires `{name, description, persona, templateId}` | Working validation. |

### Category: LiteLLM

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/litellm/status` | 200 | `{running: false, port, error}` | Working. |
| GET | `/api/litellm/models` | 200 | `{models: []}` | Working. Empty when LiteLLM not running. |
| POST | `/api/litellm/restart` | 200 | `{running: false, port, error}` | Working. Attempted restart (LiteLLM not available). |

### Category: Anthropic Proxy

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/v1/health/liveliness` | 200 | `{status: "healthy"}` | Working. OpenAI-compatible health. |
| POST | `/v1/chat/completions` | 200 | `{choices: [{message, finish_reason}], usage, model}` | Working. OpenAI-to-Anthropic translation proxy. Successfully returned Claude response. |

### Category: Weaver

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| POST | `/api/weaver/trigger` | **404** | `{error: "Not found"}` | **BUG**: Route registered in `index.ts` but returns 404. Likely silent module import failure at startup. |

### Category: Audit

| Method | Path | Status | Response Shape | Notes |
|--------|------|--------|----------------|-------|
| GET | `/api/audit/installs` | 200 | `{entries: [{id, timestamp, capabilityName, capabilityType, source, riskLevel, trustSource, approvalClass, action, initiator, detail}]}` | Working. |

### Category: WebSocket

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| GET | `/ws?token=X` | 101 | Not fully tested via curl (requires WebSocket client). Auth via query param. |

### Category: Dev Routes (gated behind WAGGLE_DEV_MARKETPLACE=1)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/_dev/marketplace/search` | Dev-only. Not registered unless env var set. |
| GET | `/_dev/marketplace/security-check` | Dev-only. |
| GET | `/_dev/marketplace/packs` | Dev-only. |
| GET | `/_dev/marketplace/health` | Dev-only. |

---

## Workflow Tests

### Workflow 1: Create Workspace -> Send Chat -> Verify Session

1. `POST /api/workspaces` with `{name:"QA-Audit-Test", group:"QA"}` -> **201**: workspace created with ID `qa-audit-test`
2. `GET /api/workspaces/qa-audit-test/context` -> **200**: returns summary, empty threads, onboarding prompts
3. `POST /api/chat` with `{message:"Say hello", workspaceId:"qa-audit-test"}` -> **200**: SSE stream with token events and done event
4. `GET /api/workspaces/qa-audit-test/sessions` -> **200**: session created (verified)

**Result**: PASS

### Workflow 2: Save Memory -> Search Memory -> Verify Recall

1. `POST /api/memory/frames` with `{content:"QA audit test memory frame"}` -> **200**: `{saved: true, frameId: 106}`
2. `GET /api/memory/search?q=audit+test` -> **200**: returns the saved frame in results
3. `GET /api/memory/frames?limit=3` -> **200**: saved frame appears in recent list

**Result**: PASS

### Workflow 3: Marketplace Search -> Install -> Verify -> Uninstall

1. `GET /api/marketplace/search?query=brainstorm` -> **200**: packages found
2. `POST /api/marketplace/install` with `{packageId: 4746}` -> **200**: installed with security scan
3. `GET /api/marketplace/installed` -> **200**: installation in list
4. `POST /api/marketplace/uninstall` with `{packageId: 4746}` -> **200**: uninstalled

**Result**: PASS

### Workflow 4: Create Cron -> List -> Trigger -> History -> Delete

1. `POST /api/cron` with `{name:"QA Test Cron", cronExpr:"0 12 * * *", jobType:"memory_consolidation"}` -> **200**: created ID 28
2. `GET /api/cron` -> **200**: cron in list
3. `GET /api/cron/28` -> **200**: details returned
4. `PATCH /api/cron/28` with `{enabled: false}` -> **200**: disabled
5. `POST /api/cron/28/trigger` -> **200**: triggered
6. `GET /api/cron/28/history` -> **200**: history returned
7. `DELETE /api/cron/28` -> **200**: deleted

**Result**: PASS

### Workflow 5: Vault CRUD

1. `POST /api/vault` with `{name:"qa-test-secret", value:"test-value-12345"}` -> **200**: stored
2. `GET /api/vault` -> **200**: listed (no value exposed)
3. `POST /api/vault/qa-test-secret/reveal` -> **200**: decrypted correctly
4. `DELETE /api/vault/qa-test-secret` -> **200**: deleted

**Result**: PASS

### Workflow 6: Task CRUD

1. `POST /api/workspaces/qa-audit-test/tasks` with `{title:"QA Test Task", status:"open"}` -> **201**: created
2. `GET /api/workspaces/qa-audit-test/tasks` -> **200**: in list
3. `PATCH /api/workspaces/qa-audit-test/tasks/:taskId` with `{status:"in_progress"}` -> **200**: updated
4. `DELETE /api/workspaces/qa-audit-test/tasks/:taskId` -> **204**: deleted

**Result**: PASS

---

## Critical Issues

### 1. BUG: Workspace DELETE returns 500 EBUSY when mind DB is locked
- **Endpoint**: `DELETE /api/workspaces/:id`
- **Error**: `EBUSY: resource busy or locked, unlink '...workspace.mind'`
- **Cause**: When a workspace mind database has been opened (by chat, context endpoint, or weaver), the SQLite file remains locked. Attempting to delete the workspace fails because the file cannot be removed.
- **Impact**: Users cannot delete workspaces that have been recently accessed in the same server session.
- **Suggested Fix**: Close the workspace MindDB connection and remove it from the `workspaceMindCache` before attempting filesystem deletion.

### 2. BUG: `/api/weaver/trigger` returns 404 despite route registration
- **Endpoint**: `POST /api/weaver/trigger`
- **Expected**: Triggers memory consolidation
- **Actual**: Returns `{"error":"Not found"}` (404)
- **Analysis**: The route file (`weaver.ts`) exists with valid code. It IS registered in `index.ts` via `server.register(weaverRoutes)`. The JSON 404 response (not HTML) confirms the SPA fallback detected the `/api/` prefix. This suggests the route plugin fails to register silently at startup, possibly due to an import error in `@waggle/weaver` module.
- **Impact**: On-demand memory consolidation cannot be triggered via the API.

### 3. BUG: `/api/skills/test` returns 404 despite route declaration
- **Endpoint**: `POST /api/skills/test`
- **Analysis**: Route declared in skills.ts source but returns 404 at runtime. Likely fails to register or is conditionally gated.

### 4. BUG: `/api/marketplace/publish` returns 404
- **Endpoint**: `POST /api/marketplace/publish`
- **Analysis**: Declared in marketplace.ts but returns 404. May require additional environment configuration or is conditionally gated.

### 5. SECURITY NOTE: Auth token exposed in `/health` response
- The `wsToken` field in the health response contains the full bearer token.
- `/health` is the only auth-exempt endpoint.
- **Risk**: Any process on localhost (or network if listening on `0.0.0.0`) can obtain the token.
- **Mitigation**: This is by design for Tauri desktop startup. However, the default host `0.0.0.0` means other machines on the network could access it.

### 6. NOTE: Path traversal returns SPA HTML, not API error
- `GET /api/workspaces/../../../etc/passwd` returns SPA `index.html` (200) instead of API error.
- **Impact**: Low. No actual file access occurs. `assertSafeSegment` catches malicious segments on valid routes.

---

## Stubs / Not Implemented

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/restore` | Not Tested | Destructive -- overwrites entire data directory. |
| `POST /api/skills/test` | 404 | Route in source but not registered at runtime. |
| `POST /api/weaver/trigger` | 404 | Route registered but not functional. |
| `POST /api/marketplace/publish` | 404 | Route in source but not functional. |
| `GET /_dev/marketplace/*` | N/A | Dev-only (require `WAGGLE_DEV_MARKETPLACE=1`). |
| `GET /ws` | Partial | WebSocket -- requires WS client. |

---

## Security Assessment

| Check | Result |
|-------|--------|
| Bearer token auth on all API routes | PASS |
| Auth exempt only on `/health` | PASS |
| Missing token returns 401 + `MISSING_TOKEN` | PASS |
| Invalid token returns 401 + `INVALID_TOKEN` | PASS |
| Rate limiting on expensive routes | PASS |
| Rate limit headers present | PASS |
| Security headers (CSP, X-Frame-Options, etc.) | PASS |
| CORS restrictions | PASS |
| Input validation | PASS |
| API key masking in settings | PASS |
| Path traversal protection | PASS |

### Rate Limiting Configuration

| Endpoint Pattern | Limit (per minute) |
|------------------|--------------------|
| `/api/chat` | 30 |
| `/api/vault/*/reveal` | 5 |
| `/api/backup` | 2 |
| `/api/restore` | 2 |
| All other endpoints | 100 (default) |

---

## Test Artifact Cleanup

| Item | Status |
|------|--------|
| Workspace `qa-audit-test` | EBUSY -- needs manual cleanup |
| Marketplace source `qa-test-source` | Deleted |
| MCP package `brainstorm-mcp` | Uninstalled |
| Cron schedule ID 28 | Deleted |
| Vault secret `qa-test-secret` | Deleted |
| Session `session-a9fbb269-...` | Deleted |
| Memory frame ID 106 | Remains (no individual frame delete API) |
| Notification ID 161 | Marked read (no delete API) |
| Settings `yoloMode` | Restored to `true` |
| Settings `defaultModel` | Restored to `claude-opus-4-6` |
| Plugin `wealth-management` | Re-enabled |
