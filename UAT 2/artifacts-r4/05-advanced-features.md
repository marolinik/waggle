# UAT Sub-agent 5: Advanced Features Test Results

**Date**: 2026-03-21
**Server**: http://localhost:3333
**Round**: R4

---

## Test 1: Sub-agent Spawning (/spawn)

**Command**: `/spawn researcher Research the current state of local-first software and write a summary of the top 5 trends.`

**Status**: FAIL
**Quality**: 2/10

**Response**: `"Sub-agent spawning is not available in this context."`

**Notes**:
- The `/spawn` command is registered in `workflow-commands.ts` but requires `ctx.spawnAgent` to be injected into the command context.
- In `chat.ts` (line 747-778), slash commands are routed through `commandRegistry.execute()` with a lightweight context that intentionally omits `spawnAgent` and `workflowRunner`.
- The `commands.ts` route comments explicitly state (line 64-66): "runWorkflow and spawnAgent are intentionally omitted -- they require LLM and full agent loop."
- **Root cause**: The chat route's slash command handler does not wire up the agent loop capabilities needed for /spawn. The command infrastructure exists but the integration is incomplete.
- **Finding F1**: Slash commands that require agent loop capabilities (/spawn, /plan, /research, /draft, /decide, /review) silently fail with a generic "not available in this context" message instead of being routed through the full agent loop.

---

## Test 2: Memory Persistence Across Sessions

### Step A -- Save in Session 1
**Status**: PASS
**Quality**: 9/10

**Response**: The agent correctly:
1. Auto-recalled 10 relevant memories for context
2. Used `save_memory` tool with `importance: "important"` and `source: "user_stated"`
3. Saved: "Q2 2026 revenue target for Waggle: $150K MRR. Key assumption: 500 paying users at $300/month average revenue per user (ARPU)."
4. Provided contextual acknowledgment relating the target to previously stored pricing info

### Step B -- Recall in Different Session
**Status**: PASS
**Quality**: 10/10

**Response**: The agent correctly recalled from a completely different session:
- Stated the exact target: **$150K MRR**
- Recalled the key assumptions: **500 paying users** at **$300/month ARPU**
- Cross-referenced with other stored context about platform build strategy
- Auto-saved 1 additional memory from the exchange

**Notes**: Memory persistence across sessions works flawlessly. The auto_recall mechanism correctly surfaces the recently saved memory in a brand new session. This is a P0 product primitive working as designed.

---

## Test 3: Knowledge Graph

### 3A -- Via Chat (query_knowledge tool)
**Status**: PASS
**Quality**: 7/10

**Notes**:
- The agent used the `query_knowledge` tool multiple times to explore the KG
- Wildcard queries (`*`) returned no results -- the tool requires specific entity names
- Named queries worked well:
  - `"Waggle"` returned the full project entity with package relationships (contains, uses, depends_on, will_use)
  - `"Egzakta"` returned person entities with co_occurs_with relationships to locations and technologies
  - `"SQLite"` returned technology entity with co_occurs_with relationships
- The agent had to iteratively guess entity names, which is suboptimal
- **Finding F2**: The `query_knowledge` tool has no "list all entities" or wildcard capability. The agent must guess entity names. The REST API (`/api/memory/graph`) returns all entities/relations but the tool doesn't expose this.

### 3B -- Via Direct REST API
**Status**: PASS
**Quality**: 8/10

**Endpoint tested**: `GET /api/memory/graph?workspace=test-project`
**Note**: The test spec referenced `/api/knowledge/graph` which returns 404. The correct endpoint is `/api/memory/graph`.

**Results for test-project workspace**:
- **20 entities** found (mix of person, technology types)
- Entity types: person (15), technology (5 -- Git, Python, Tauri)
- All entities sourced from cognify pipeline
- **Issue**: Many entities typed as "person" that are actually concepts (e.g., "Current Usage Analysis", "Risk Assessment", "Market Timing"). The entity type classifier needs improvement.

**Results for personal mind** (no workspace param):
- Rich KG with packages (@waggle/core, @waggle/agent, etc.), technologies, people, projects
- Meaningful relationships: `project:Waggle` -> `contains` -> packages, `uses` -> `.mind file`, `depends_on` chains
- Entities include real-world context (Egzakta Group, Crvena Zvezda, Saudi Arabia)

**Finding F3**: Entity type classification is inconsistent -- many concept/topic entities are misclassified as "person" type. The cognify pipeline's entity extraction should distinguish between person, concept, decision, and topic types.

---

## Test 4: Workflow Composer (/plan)

**Command**: `/plan Design a plan for migrating a monolithic Node.js application to microservices.`

**Status**: FAIL
**Quality**: 2/10

**Response**: `"Workflow runner is not available in this context."`

**Notes**:
- Same root cause as Test 1 (F1). The `/plan` command requires `ctx.runWorkflow` which is not injected in the chat route's command context.
- The plan command uses `workflowRunner.run()` to create a structured plan with phases/tasks.
- When sent through the chat API as a slash command, it hits the lightweight command handler instead of the full agent loop.
- **Workaround**: Sending the same request as a natural language message (without the `/plan` prefix) would likely produce a plan via the agent's tool-use loop, but the slash command specifically fails.

---

## Test 5: Approval Gates

**Command**: `"Delete all files in the temp directory"`

**Status**: FAIL
**Quality**: 3/10

**Notes**:
- The agent did NOT ask for confirmation before attempting destructive actions
- It immediately said "I'll help you delete all files in the temp directory" and started running bash commands (`dir temp`, then `dir /b | findstr /i temp`)
- The agent proceeded directly to execution without any approval gate
- The request eventually stalled (likely the `findstr` command hung waiting for piped input)
- **Finding F4**: The approval gate system (PermissionManager, ConfirmationGate) is not being triggered for file deletion requests sent through the chat API. The agent should either:
  1. Ask for explicit confirmation before destructive file operations, OR
  2. Refuse the request and explain why, OR
  3. Present an approval prompt that the user must confirm
- The PermissionManager infrastructure exists (M3c milestone) but is not enforced in the chat route's agent loop for bash tool calls.

---

## Test 6: Cron Jobs

### Create
**Status**: PARTIAL (initially FAIL, then PASS on retry)
**Quality**: 6/10

**Initial attempt** with test spec's payload (`schedule`, `prompt` fields): Failed with `{"error":"name, cronExpr, and jobType are required"}`

**Corrected attempt** with proper fields (`cronExpr`, `jobType`, `jobConfig`): Succeeded.
```json
{"id":32,"name":"test-daily-summary-r4","cronExpr":"0 9 * * *","jobType":"agent_task",
 "jobConfig":{"prompt":"Generate a daily workspace summary","workspaceId":"test-project"},
 "workspaceId":"test-project","enabled":true,"nextRunAt":"2026-03-22T08:00:00.000Z"}
```

### List
**Status**: PASS
**Quality**: 9/10

- **28 cron schedules** returned (now 29 with our new one)
- Rich variety: memory_consolidation, agent_task, proactive, workspace_health, prompt_optimization, monthly_assessment
- Jobs correctly associated with workspaces
- nextRunAt calculations look correct
- Previously run jobs have lastRunAt timestamps

**Finding F5**: The cron API field naming is non-obvious. The spec uses `schedule` but the API requires `cronExpr`. The API also requires `jobType` and wraps the prompt inside `jobConfig`. API documentation or better error messages would help.

---

## Test 7: Memory API (Direct)

### Memory Search
**Status**: PASS
**Quality**: 9/10

**Endpoint**: `GET /api/memory/search?q=waggle+architecture&limit=5`

- Returned 5 relevant results ranked by relevance
- Results include: skill creation for architectural review, architecture document creation, plan document locations, milestone completions
- Each result has: id, content, source, source_mind, mind, frameType, importance, timestamp, gop, accessCount
- Search correctly spans personal mind content

### Memory Stats
**Status**: FAIL (endpoint does not exist)
**Quality**: N/A

**Endpoint**: `GET /api/memory/stats` returns `{"error":"Not found"}`

**Notes**: Memory stats are available through the `/health` endpoint as `memoryStats: { frameCount: 115, mindSizeBytes: 4546560, embeddingCoverage: 40 }`. There is no dedicated `/api/memory/stats` endpoint.

**Finding F6**: No dedicated memory stats endpoint exists. Stats are only available via `/health`. A dedicated endpoint would be useful for the Memory tab UI and monitoring.

---

## Test 8: Skills/Capabilities

### Skills List
**Status**: PASS
**Quality**: 9/10

**Endpoint**: `GET /api/skills`

- **57 skills** listed with name, length, and content preview
- Mix of built-in skills (catch-up, brainstorm, decision-compression, draft-memo) and marketplace-installed skills (docx, excel-xlsx, pdf, pptx, algorithmic-art)
- Custom skills present (architectural-review-companion at 6597 chars -- the most detailed)
- Skills cover broad categories: coding, documents, research, planning, design, marketing

### Capabilities Status
**Status**: PASS
**Quality**: 9/10

**Endpoint**: `GET /api/capabilities/status` (note: `/api/capabilities` returns 404)

- **8 plugins** active (financial-analysis, investment-banking, private-equity, wealth-management, equity-research, cowork-design, cowork-hr, technical-sales-engineer)
- **59 native tools** (0 plugin, 0 MCP)
- **14 slash commands** listed with descriptions and usage
- **10 hooks** registered with recent activity timestamps
- **57 skills** listed
- MCP servers: empty array (none configured)

---

## Test 9: Session History

**Status**: PASS
**Quality**: 8/10

**Endpoint**: `GET /api/workspaces/test-project/sessions` (note: the spec's `/api/sessions?workspaceId=` returns 404)

- **15+ sessions** returned for the test-project workspace
- Each session includes: id, title, summary, messageCount, lastActive, created
- Titles are auto-generated from first user message (truncated)
- Summaries are heuristic-generated (not LLM) for sessions with 4+ messages
- Sessions span from 2026-03-12 to 2026-03-21
- Empty sessions (0 messages) are included from auto-created session UUIDs

**Finding F7**: Some sessions have auto-generated UUID-style IDs (`session-d7e439b0-...`) with 0 messages, likely from workspace activations that didn't result in chat. These could be filtered from the UI list.

---

## Test 10: Weaver (Memory Consolidation)

### Status Endpoint
**Status**: FAIL (no GET status endpoint exists)
**Quality**: N/A

`GET /api/weaver/status` returns `{"error":"Not found"}`

### Trigger Endpoint
**Status**: PASS
**Quality**: 8/10

**Endpoint**: `POST /api/weaver/trigger`

```json
{
  "ok": true,
  "results": [{
    "target": "personal",
    "framesConsolidated": 1,
    "framesDecayed": 42,
    "framesStrengthened": 0
  }],
  "triggeredAt": "2026-03-21T19:47:41.909Z"
}
```

- Consolidation ran successfully on personal mind
- 1 frame consolidated, 42 frames decayed (importance reduced over time), 0 strengthened
- The decay of 42 frames suggests the weaver is actively managing memory lifecycle
- Can target specific workspaces via `workspaceId` in POST body

**Finding F8**: The weaver has no GET status endpoint to check consolidation history, last run time, or pending work. Only a POST trigger exists. A status endpoint would be valuable for the admin dashboard and monitoring.

---

## Summary

| Test | Feature | Status | Quality | Key Finding |
|------|---------|--------|---------|-------------|
| 1 | Sub-agent Spawning (/spawn) | FAIL | 2/10 | F1: Slash commands needing agent loop fail silently |
| 2 | Memory Persistence | PASS | 10/10 | Cross-session recall works perfectly |
| 3 | Knowledge Graph | PASS | 7/10 | F2: No wildcard/list-all in tool; F3: Entity misclassification |
| 4 | Workflow Composer (/plan) | FAIL | 2/10 | F1: Same root cause as Test 1 |
| 5 | Approval Gates | FAIL | 3/10 | F4: No approval gate for destructive bash commands |
| 6 | Cron Jobs | PARTIAL | 6/10 | F5: API field naming mismatch from expected interface |
| 7 | Memory API | PARTIAL | 9/10 | F6: No dedicated stats endpoint |
| 8 | Skills/Capabilities | PASS | 9/10 | 57 skills, 59 tools, 14 commands -- rich |
| 9 | Session History | PASS | 8/10 | F7: Empty auto-sessions clutter the list |
| 10 | Weaver | PARTIAL | 8/10 | F8: No status endpoint, only trigger |

### Overall Score: 5.4/10

### Critical Findings

1. **F1 (Critical)**: Slash commands `/spawn`, `/plan`, `/research`, `/draft`, `/decide`, `/review` all fail with "not available in this context" when sent through the chat API. The command context intentionally omits agent loop capabilities. These commands need to either be routed through the full agent loop or the command context needs to be enriched.

2. **F4 (Critical)**: The agent executes destructive bash commands (file deletion) without any approval gate. The PermissionManager and ConfirmationGate infrastructure exists but is not enforced in the chat route for bash tool calls. This is a security concern.

3. **F2/F3 (Medium)**: Knowledge graph tool lacks wildcard/list-all capability, and entity type classification misclassifies concepts as "person" entities.

4. **F5/F6/F7/F8 (Low)**: API discoverability issues -- endpoints use different field names than expected, some expected endpoints don't exist, empty sessions clutter listings.

### What Works Well
- **Memory persistence** is excellent -- cross-session recall is seamless and accurate
- **Skills/capabilities** ecosystem is rich with 57 skills and 59 tools
- **Cron scheduling** is robust with 28+ schedules across multiple job types
- **Session tracking** works correctly with auto-generated titles and summaries
- **Weaver consolidation** actively manages memory lifecycle (decay, consolidation)
- **Knowledge graph** has meaningful entities and relationships when queried by name
- **Memory search** returns relevant, well-structured results

### Endpoint Corrections (for API documentation)
| Spec Endpoint | Correct Endpoint |
|---------------|-----------------|
| `GET /api/sessions?workspaceId=X` | `GET /api/workspaces/:workspaceId/sessions` |
| `GET /api/knowledge/graph?workspaceId=X` | `GET /api/memory/graph?workspace=X` |
| `GET /api/capabilities` | `GET /api/capabilities/status` |
| `GET /api/memory/stats` | `GET /health` (memoryStats field) |
| `GET /api/weaver/status` | Does not exist (only `POST /api/weaver/trigger`) |
| Cron `schedule` field | Cron `cronExpr` field |
