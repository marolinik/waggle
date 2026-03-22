# Persona Test: Mia — Agency Owner

**Date**: 2026-03-21
**Server**: http://localhost:3333
**Tester**: Automated (Claude Agent)
**Branch**: phase8-wave-8f-ui-ux

---

## Journey Summary

Mia runs a marketing agency and needs multi-workspace management for clients, cost tracking per workspace, and the ability to export workspace data for client deliverables. She also wants to discover marketplace capabilities relevant to her domain.

---

## Step-by-Step Results

### Step 1: Create workspace for client (Acme Corp)
**Result: PASS**

- Endpoint: `POST /api/workspaces`
- Payload: `{"name":"Client-Acme-Corp","description":"Agency client workspace for Acme Corp","group":"agency-clients"}`
- Response: `{"id":"client-acme-corp-2","name":"Client-Acme-Corp","group":"agency-clients","created":"2026-03-21T19:08:18.868Z"}`
- Workspace created successfully with correct name and group assignment.
- Note: ID was `client-acme-corp-2` due to a pre-existing `client-acme-corp` from earlier testing.

### Step 2: Chat with agent in new workspace
**Result: PARTIAL PASS**

- Endpoint: `POST /api/chat`
- SSE stream started correctly.
- `auto_recall` tool executed and returned 10 memories.
- Agent identified workspace context correctly ("Client-Acme-Corp (agency-clients)").
- **Error**: Stream ended with `API key is invalid or expired` — the configured Anthropic key appears expired for actual LLM calls.
- **Verdict**: Chat infrastructure works (SSE, tool execution, memory recall). LLM response blocked by expired API key — not a product bug.

### Step 3: Check cost tracking
**Result: FAIL**

- Endpoint: `GET /api/workspaces/client-acme-corp-2`
- Response: `{"id":"client-acme-corp-2","name":"Client-Acme-Corp","group":"agency-clients","created":"2026-03-21T19:08:18.868Z"}`
- **No cost/token tracking fields present** in workspace response.
- Missing fields an agency owner would expect: `totalTokens`, `totalCost`, `inputTokens`, `outputTokens`, `sessionCount`.
- **This is a significant gap for the agency use case.** Mia cannot track per-client AI costs.

### Step 4: Create second workspace (Beta Inc)
**Result: PASS**

- Endpoint: `POST /api/workspaces`
- Response: `{"id":"client-beta-inc","name":"Client-Beta-Inc","group":"agency-clients","created":"2026-03-21T19:08:38.191Z"}`
- Second workspace created without issue.

### Step 5: List all workspaces (multi-workspace verification)
**Result: PASS**

- Endpoint: `GET /api/workspaces`
- Returned 47 workspaces total.
- Both new workspaces present: `client-acme-corp-2` and `client-beta-inc`.
- Both correctly grouped under `agency-clients`.
- Groups work well for organizing client workspaces vs internal ones.
- **Observation**: No filtering by group is available via query params — Mia would need to filter client-side. Adding `?group=agency-clients` would be helpful.

### Step 6: Export workspace
**Result: PASS**

- Endpoint: `POST /api/export`
- Payload: `{"workspaceId":"client-acme-corp-2"}`
- Exported successfully: 213,835 bytes (213 KB) zip file.
- Zip is valid and contains:
  - `memories/personal-frames.json`
  - `sessions/` directory with session markdown files
  - Sessions from the workspace's chat history included
- **Note**: Export includes ALL workspace sessions globally, not just the target workspace. This could be a privacy concern for agency clients — Mia would not want Client A seeing Client B's session data.

### Step 7: Marketplace capability discovery
**Result: PASS**

- Endpoint: `GET /api/marketplace/search?query=marketing&limit=5`
- Returned 5 relevant marketing packages from a total of 392 matches.
- Results included:
  1. "Marketing Ideas" — 139 proven SaaS marketing tactics
  2. "Marketing Mode" — 23 comprehensive marketing skills
  3. "Timmeck Marketing Brain" — Self-learning marketing intelligence (MCP server)
  4. "Marketing Skills" — CRO, copywriting, SEO, analytics
  5. "coreyhaines31/marketing-ideas" — from awesome-agent-skills
- Categories well-organized with facets (types, categories, sources).
- 43 packages already installed.
- **Excellent result for agency persona** — Mia can find and install domain-specific skills.

### Step 8: Settings check
**Result: PASS**

- Endpoint: `GET /api/settings`
- Returned complete settings including:
  - Default model: `claude-opus-4-6`
  - Available providers with masked API keys
  - Mind path and data directory locations
  - LiteLLM proxy URL
- API keys properly masked in response (e.g., `sk-ant-...8AAA`).

### Step 9: Cleanup — delete test workspaces
**Result: FAIL**

- Endpoint: `DELETE /api/workspaces/client-acme-corp-2` and `DELETE /api/workspaces/client-beta-inc`
- Both failed with HTTP 500: `EBUSY: resource busy or locked, unlink '...workspace.mind'`
- The SQLite `.mind` database file is locked, preventing deletion.
- **Root cause**: The mind DB connection is not being closed before file deletion is attempted.
- **Impact**: Mia cannot clean up old client workspaces without restarting the server. This is a significant operational issue for an agency managing many client workspaces over time.

---

## Scorecard

| Step | Description | Result |
|------|-------------|--------|
| 1 | Create client workspace | **PASS** |
| 2 | Chat with agent | **PARTIAL PASS** (infra works, API key expired) |
| 3 | Cost tracking | **FAIL** (no cost fields in workspace) |
| 4 | Create second workspace | **PASS** |
| 5 | List all workspaces | **PASS** |
| 6 | Export workspace | **PASS** (but exports all sessions, not scoped) |
| 7 | Marketplace search | **PASS** |
| 8 | Settings check | **PASS** |
| 9 | Delete workspaces | **FAIL** (EBUSY file lock) |

**Steps passed: 6/9** (counting Step 2 as partial = 6.5/9)

---

## Ratings

| Category | Score | Notes |
|----------|-------|-------|
| **Multi-workspace experience** | **7/10** | Creating, listing, and grouping workspaces works well. The `group` field is excellent for agency organization. Missing: group filtering endpoint, workspace archival. Deletion is broken (EBUSY). |
| **Cost tracking visibility** | **2/10** | No cost/token tracking data exposed in workspace API. This is a critical gap for agency billing. Mia cannot attribute AI costs to specific clients. |
| **Export reliability** | **6/10** | Export produces a valid zip quickly. However, the export appears to include sessions from ALL workspaces rather than scoping to the requested workspace — a potential data isolation issue for agency clients. |
| **Addiction score (would Mia come back?)** | **5/10** | The workspace model with groups fits her mental model well. Marketplace is rich and relevant. However, the lack of cost tracking is a dealbreaker for agency billing, the export scope issue is a trust concern, and inability to delete workspaces creates clutter over time. She would need these fixed before relying on Waggle for client work. |

---

## Key Findings

### Critical Issues
1. **No cost/token tracking per workspace** — Agency owners need to bill clients for AI usage. The workspace object has no cost-related fields. This needs `totalTokens`, `estimatedCost`, `inputTokens`, `outputTokens` at minimum.
2. **Workspace deletion fails with EBUSY** — SQLite mind DB file lock prevents workspace cleanup. The server needs to close the DB connection before attempting file deletion.

### Important Issues
3. **Export may not be workspace-scoped** — The zip contained sessions from multiple workspaces, not just the target. For agency use, exports must be isolated to the requested workspace to prevent client data leakage.
4. **No group-based workspace filtering** — `GET /api/workspaces?group=agency-clients` would help Mia quickly see only her client workspaces.

### Minor Issues
5. **No workspace archival** — Instead of delete, an archive option would let Mia preserve old client data while keeping the workspace list clean.
6. **API key error could be more helpful** — The error message says "Update it in Settings > API Keys" but the settings API shows the key is present. A more specific diagnostic would help.

---

## Recommendations for Agency Persona Support

1. **P0**: Add token/cost tracking fields to workspace model and API response
2. **P0**: Fix EBUSY error on workspace deletion (close mind DB before unlink)
3. **P1**: Scope exports to requested workspace only
4. **P1**: Add `?group=` filter parameter to `GET /api/workspaces`
5. **P2**: Add workspace archival capability
6. **P2**: Add billing summary endpoint (`GET /api/billing/summary?group=agency-clients`)
