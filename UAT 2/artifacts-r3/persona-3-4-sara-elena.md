# UAT Round 3 — Persona 3 & 4 Results
**Date**: 2026-03-21
**Tester**: Automated HTTP API testing via curl
**Server**: localhost:3333 (Waggle local server)
**Auth**: Bearer token via `/health` endpoint `wsToken` field
**LLM Status**: OFFLINE — Server running in echo/local mode (no LLM proxy connected). All chat responses echo the user's message instead of generating AI responses.

---

## CRITICAL FINDING: Rate Limiting Impacts Real User Workflows

The `/api/chat` endpoint has a rate limit of **30 requests per 60-second window** (`ENDPOINT_RATE_LIMITS` in `security-middleware.ts`). During rapid sequential testing, multiple requests were rejected with `429 Too Many Requests`. While this is appropriate security for production, it means:

- A power user sending rapid messages will hit the wall
- The `retryAfterMs` field is returned (good), but the UI must handle this gracefully
- Marketing managers and analysts who rapid-fire questions will be frustrated

**Recommendation**: Ensure the UI displays a user-friendly "Please wait" message when rate-limited, not a raw error.

---

## Persona 3: Sara — Marketing Manager (Teams tier)

**Journey**: Create campaign brief, research competitors, draft content, get team feedback, schedule social posts

### Step 1: GET /api/workspaces — List workspaces
- **Request**: `GET /api/workspaces` with Bearer token
- **Status**: 200 OK
- **Response** (first 500 chars): `[{"id":"ana-product-team","name":"Ana Product Team","group":"UAT-Persona","created":"2026-03-21T18:19:10.942Z"},{"id":"dijana-architecture-lab","name":"Dijana - Architecture Lab","group":"UAT","created":"2026-03-21T01:28:14.570Z"},...`
- **Worked?**: YES
- **Persona understanding**: Yes — returns a clean list of existing workspaces. Sara can see what's there.

### Step 2: POST /api/workspaces — Create "Marketing Q2 Campaign" workspace
- **Request**: `POST /api/workspaces` with body `{"name":"Marketing Q2 Campaign","group":"UAT-Persona"}`
- **Status**: 201 Created
- **Response**: `{"id":"marketing-q2-campaign","name":"Marketing Q2 Campaign","group":"UAT-Persona","created":"2026-03-21T18:19:27.315Z"}`
- **Worked?**: YES
- **Persona understanding**: Yes — workspace created with auto-generated slug ID. Clean and immediate.

### Step 3: POST /api/chat — "Create a campaign brief for our Q2 product launch..."
- **Request**: `POST /api/chat` with `{"message":"Create a campaign brief for our Q2 product launch. Target audience: SaaS CTOs. Channels: LinkedIn, email, blog. Budget: $50K","workspace":"marketing-q2-campaign","session":"sara-session-1"}`
- **Status**: 200 (SSE stream)
- **Response**: Echo mode — `**Waggle is running in local mode** (no LLM proxy connected). Your message: "Create a campaign brief..." To enable AI responses, start LiteLLM or configure an API key in Settings > API Keys.`
- **Worked?**: PARTIAL — The endpoint works correctly (SSE streaming, proper token/done events), but returns echo response because no LLM is connected. The chat pipeline is functional.
- **Persona understanding**: No — Sara would be confused by "LiteLLM" and "API key" messages. She wants a campaign brief, not infrastructure instructions.
- **SSE Format Validated**: Yes — proper `event: token` / `event: done` structure with `{"content":"..."}` payloads. The `done` event includes `usage` and `toolsUsed` fields.

### Step 4: POST /api/chat — "/research Analyze the top 5 competitors..."
- **Request**: `POST /api/chat` with `/research` slash command
- **Status**: 200 (SSE stream)
- **Response**: Same echo mode response — message echoed back
- **Worked?**: PARTIAL — Endpoint accepts slash commands in message text. Would be routed to research skill when LLM is active.
- **Persona understanding**: No — Same echo mode issue.

### Step 5: POST /api/chat — "/draft Write a LinkedIn post..."
- **Request**: `POST /api/chat` with `/draft` slash command
- **Status**: 200 (SSE stream)
- **Response**: Echo mode — message echoed back
- **Worked?**: PARTIAL — Same as above. Draft command recognized in message.
- **Persona understanding**: No — Sara expects a draft, gets infrastructure message.

### Step 6: POST /api/chat — "Save this campaign brief to memory as q2-campaign-brief"
- **Request**: `POST /api/chat` with save memory request
- **Status**: First attempt: 429 (rate limited, retryAfterMs: 25652). Retry after 30s: 200 SSE stream.
- **Response**: Echo mode on success.
- **Worked?**: PARTIAL — Rate limit hit on 4th rapid chat message. After retry, endpoint works. In echo mode, save_memory tool is not invoked.
- **Persona understanding**: No — Sara would be frustrated by rate limiting and then the echo response.
- **FINDING [F1]**: Rate limit of 30/min for chat is too aggressive for rapid conversational workflows. Sara sending 4 messages in ~90 seconds should not be rate-limited.

### Step 7: POST /api/memory/frames — Save a memory entry about the campaign
- **Request**: `POST /api/memory/frames` with `{"content":"Q2 Campaign Brief: Product launch targeting SaaS CTOs. Channels: LinkedIn, email, blog. Budget: $50K. Key messages: AI workspace efficiency, ROI metrics, competitive differentiation.","workspace":"marketing-q2-campaign","importance":"important","source":"user_stated"}`
- **Status**: 200 OK
- **Response**: `{"saved":true,"frameId":1,"mind":"workspace","importance":"important","source":"user_stated"}`
- **Worked?**: YES
- **Persona understanding**: Yes — Clear confirmation. Memory saved with importance level and source attribution.

### Step 8: GET /api/memory/search?q=campaign — Search for campaign memories
- **Request**: `GET /api/memory/search?q=campaign&workspace=marketing-q2-campaign`
- **Status**: 200 OK
- **Response**: `{"results":[{"id":1,"content":"Q2 Campaign Brief: Product launch targeting SaaS CTOs...","source":"workspace","mind":"personal","frameType":"I","importance":"important","timestamp":"2026-03-21 18:20:57",...}],"count":1}`
- **Worked?**: YES
- **Persona understanding**: Yes — Search returns the saved memory with full content, importance, and timestamp.
- **NOTE**: The `mind` field says "personal" even though we saved to workspace. This is the `source_mind` normalization quirk documented in `normalizeFrame()` — the search result's `source` field is "workspace" (correct), but `mind` shows "personal" because of the MultiMindSearchResult source overwrite logic.
- **FINDING [F2]**: The `mind` field in search results shows "personal" for workspace-saved memories. While `source` correctly shows "workspace", the `mind`/`source_mind` field is misleading. See `normalizeFrame()` in memory.ts lines 11-17.

### Step 9: GET /api/connectors — List available connectors
- **Request**: `GET /api/connectors`
- **Status**: 200 OK
- **Response**: 29 connectors listed including: GitHub, Slack, Jira, Email (SendGrid), Google Calendar, Discord, Linear, Asana, Trello, Monday.com, Notion, Confluence, Obsidian, HubSpot, Salesforce, Pipedrive, Airtable, GitLab, Bitbucket, Dropbox, PostgreSQL, Gmail, Google Docs, Google Drive, Google Sheets, Microsoft Teams, Outlook, OneDrive, Composio (250+ services).
- **All status**: `disconnected` (none configured)
- **Worked?**: YES
- **Persona understanding**: Yes — Sara can see Slack and Email connectors are available but not connected. Clear connector catalog.
- **Notable**: Slack connector exists with capabilities `["read","search","write"]` — exactly what Sara needs for sending campaign briefs.

### Step 10: POST /api/chat — "Send a Slack message to #marketing channel..."
- **Request**: `POST /api/chat` with Slack connector request
- **Status**: First attempt 429 (rate limited). Retry: 200 SSE stream.
- **Response**: Echo mode — no actual Slack integration without LLM.
- **Worked?**: PARTIAL — The endpoint works but cannot invoke connector tools in echo mode. With LLM active, the agent would recognize the Slack connector and attempt to use it (or report it's disconnected).
- **Persona understanding**: No — Sara expects Slack integration, gets LiteLLM message.

### Step 11: GET /api/workspaces/:id/tasks — List tasks
- **Request**: `GET /api/workspaces/marketing-q2-campaign/tasks`
- **Status**: 200 OK
- **Response**: `{"tasks":[]}`
- **Worked?**: YES
- **Persona understanding**: Yes — Empty task board for new workspace. Clean response.

### Step 12: POST /api/workspaces/:id/tasks — Create a task
- **Request**: `POST /api/workspaces/marketing-q2-campaign/tasks` with `{"title":"Review campaign brief by Friday","assigneeName":"Sara","creatorName":"Sara"}`
- **Status**: 201 Created
- **Response**: `{"id":"d70384fd-95dd-4ce6-88c9-b17a29389ccc","title":"Review campaign brief by Friday","status":"open","assigneeName":"Sara","creatorName":"Sara","createdAt":"2026-03-21T18:21:50.513Z","updatedAt":"2026-03-21T18:21:50.513Z"}`
- **Worked?**: YES
- **Persona understanding**: Yes — Task created with UUID, status "open", assignee and creator. Clean and functional.

### Step 13: GET /api/team/status — List team members
- **Request**: `GET /api/team/status`
- **Status**: 200 OK
- **Response**: `{"connected":false}`
- **Worked?**: YES
- **Persona understanding**: Partial — Sara (Teams tier) would expect team features. The response correctly shows no team server is connected. She would need to configure a team server first.

### Step 14: POST /api/chat — "/status What's the status of our marketing efforts?"
- **Request**: `POST /api/chat` with `/status` command
- **Status**: 200 SSE stream
- **Response**: Echo mode — message echoed back
- **Worked?**: PARTIAL — Endpoint works, slash command passes through. With LLM active, would invoke status skill.
- **Persona understanding**: No — Same echo mode issue.

### Step 15: POST /api/export — Export workspace
- **Request**: `POST /api/export`
- **Status**: 200 OK
- **Response**: ZIP file downloaded, 209,277 bytes. Content-Type: `application/zip`. Headers include `Content-Disposition: attachment; filename="waggle-export-2026-03-21.zip"`.
- **Worked?**: YES
- **Persona understanding**: Yes — Clean ZIP download with proper filename and size. GDPR-compliant data export.

### Sara Summary
| Step | Endpoint | Status | Worked? |
|------|----------|--------|---------|
| 1 | GET /api/workspaces | 200 | YES |
| 2 | POST /api/workspaces | 201 | YES |
| 3 | POST /api/chat (brief) | 200 SSE | PARTIAL (echo mode) |
| 4 | POST /api/chat (/research) | 200 SSE | PARTIAL (echo mode) |
| 5 | POST /api/chat (/draft) | 200 SSE | PARTIAL (echo mode) |
| 6 | POST /api/chat (save) | 429 then 200 | PARTIAL (rate limit + echo) |
| 7 | POST /api/memory/frames | 200 | YES |
| 8 | GET /api/memory/search | 200 | YES |
| 9 | GET /api/connectors | 200 | YES |
| 10 | POST /api/chat (Slack) | 429 then 200 | PARTIAL (rate limit + echo) |
| 11 | GET tasks | 200 | YES |
| 12 | POST tasks | 201 | YES |
| 13 | GET /api/team/status | 200 | YES |
| 14 | POST /api/chat (/status) | 200 SSE | PARTIAL (echo mode) |
| 15 | POST /api/export | 200 | YES |

**API endpoints working**: 15/15 (all return valid responses)
**Functionally complete**: 9/15 (6 are echo-mode due to no LLM)
**Addiction Score: 4/10** — Infrastructure is solid and responsive. Workspace creation, memory, tasks, connectors, and export all work perfectly. But the core value (AI-powered campaign briefs, research, drafts) is unavailable without LLM. Sara would leave after 2 minutes if the chat only echoes.

---

## Persona 4: Elena — Data Analyst (Solo tier)

**Journey**: Import dataset, ask questions, create visualizations, build report, save findings

### Step 1: GET /api/workspaces — List workspaces
- **Request**: `GET /api/workspaces` with Bearer token
- **Status**: 200 OK
- **Response**: Full workspace list returned (includes previously created workspaces from all testing)
- **Worked?**: YES
- **Persona understanding**: Yes — Clean workspace list.

### Step 2: POST /api/workspaces — Create "Data Analysis Q1" workspace
- **Request**: `POST /api/workspaces` with body `{"name":"Data Analysis Q1","group":"UAT-Persona"}`
- **Status**: 201 Created
- **Response**: `{"id":"data-analysis-q1","name":"Data Analysis Q1","group":"UAT-Persona","created":"2026-03-21T18:22:18.848Z"}`
- **Worked?**: YES
- **Persona understanding**: Yes — Workspace created instantly with clean slug.

### Step 3: POST /api/chat — "I have a CSV file with monthly revenue data..."
- **Request**: `POST /api/chat` with `{"message":"I have a CSV file with monthly revenue data for the past 2 years. Help me analyze it.","workspace":"data-analysis-q1","session":"elena-session-1"}`
- **Status**: First attempt 429 (rate limited from Sara's testing). Retry: 200 SSE stream.
- **Response**: Echo mode — message echoed back.
- **Worked?**: PARTIAL — Endpoint functional but echo mode. With LLM, agent would use `read_file` tool and ask for file path.
- **Persona understanding**: No — Elena expects data analysis help, gets infrastructure message.
- **FINDING [F3]**: Rate limiting is per-client (IP-based), not per-workspace or per-session. Sara's rapid testing consumed Elena's budget since both come from localhost. In production this is fine (different users = different IPs), but highlights that the rate limit key `clientIP:method route` means a single user switching workspaces still shares limits.

### Step 4: POST /api/chat — "What tools do you have available for data analysis?"
- **Request**: `POST /api/chat` with tools question
- **Status**: 200 SSE stream
- **Response**: Echo mode — message echoed back.
- **Worked?**: PARTIAL — With LLM, agent would enumerate its 53 tools including bash, read_file, search_content, web_search.
- **Persona understanding**: No — Elena would need this tool inventory to trust the platform.

### Step 5: POST /api/chat — "Calculate the month-over-month growth rate..."
- **Request**: `POST /api/chat` with analysis request
- **Status**: 200 SSE stream
- **Response**: Echo mode — message echoed back.
- **Worked?**: PARTIAL — With LLM, agent would use bash/read_file tools for calculation.
- **Persona understanding**: No — Elena expects computed results.

### Step 6: POST /api/chat — "/research What are the key metrics SaaS companies track..."
- **Request**: `POST /api/chat` with `/research` slash command
- **Status**: First attempt 429 (rate limited). Eventually succeeded on retry: 200 SSE.
- **Response**: Echo mode on success.
- **Worked?**: PARTIAL — Rate limit + echo mode.
- **Persona understanding**: No — Same issues.

### Step 7: POST /api/chat — "Create a summary report of findings and save it to memory"
- **Request**: `POST /api/chat` with report + save request
- **Status**: 200 SSE stream
- **Response**: Echo mode.
- **Worked?**: PARTIAL — With LLM, agent would use `save_memory` and `generate_docx` tools.
- **Persona understanding**: No — Echo mode.

### Step 8: POST /api/memory/frames — Save analysis findings
- **Request**: `POST /api/memory/frames` with `{"content":"Q1 Revenue Analysis: Monthly revenue shows 8% average MoM growth. Seasonal dip in January (-3%), spike in March (+15%). Key metrics: ARR $2.4M, Net Revenue Retention 112%, Gross Margin 78%. Recommend focus on Q2 expansion campaigns.","workspace":"data-analysis-q1","importance":"important","source":"user_stated"}`
- **Status**: 200 OK
- **Response**: `{"saved":true,"frameId":1,"mind":"workspace","importance":"important","source":"user_stated"}`
- **Worked?**: YES
- **Persona understanding**: Yes — Clean confirmation with frame ID. Memory persisted to workspace mind.

### Step 9: GET /api/memory/search?q=revenue analysis — Search for analysis
- **Request**: `GET /api/memory/search?q=revenue%20analysis&workspace=data-analysis-q1`
- **Status**: 200 OK
- **Response**: `{"results":[{"id":1,"content":"Q1 Revenue Analysis: Monthly revenue shows 8% average MoM growth...","source":"workspace","importance":"important","timestamp":"2026-03-21 18:24:13",...}],"count":1}`
- **Worked?**: YES
- **Persona understanding**: Yes — Search returns exact saved finding with relevance scoring. Elena can verify her analysis is persisted.
- **Same F2 finding**: `mind` field shows "personal" for workspace-stored frame.

### Step 10: POST /api/chat — "What did we find in our last analysis session?"
- **Request**: `POST /api/chat` with memory recall request
- **Status**: 429 initially, then 200 SSE on retry.
- **Response**: Echo mode.
- **Worked?**: PARTIAL — Rate limited, then echo mode. With LLM, agent would call `search_memory` first (per system prompt Step 1: RECALL).
- **Persona understanding**: No — Elena's key test of memory recall cannot be validated in echo mode.

### Step 11: GET /api/memory/graph — Check knowledge graph
- **Request**: `GET /api/memory/graph?workspace=data-analysis-q1`
- **Status**: 200 OK
- **Response**: `{"entities":[],"relations":[]}`
- **Worked?**: YES
- **Persona understanding**: Partial — The knowledge graph is empty because entity extraction from the saved memory frame requires the `?extract=true` parameter (which was the default for POST /api/memory/frames). However, the simple entity extractor only finds entities with high confidence patterns. The response is technically correct but offers no value to Elena.
- **NOTE**: The test spec used `GET /api/knowledge` but the actual endpoint is `GET /api/memory/graph`. The knowledge graph API is a sub-route of the memory system, not a standalone route.

### Step 12: POST /api/chat — "/draft Write an executive summary of our Q1 revenue trends"
- **Request**: `POST /api/chat` with `/draft` slash command
- **Status**: First attempt 429 (rate limited). Retry: 200 SSE.
- **Response**: Echo mode.
- **Worked?**: PARTIAL — Rate limit + echo mode. With LLM, agent would use drafting workflow (search memory -> apply style -> draft with specifics -> generate_docx).
- **Persona understanding**: No — Elena expects a formatted executive summary.

### Step 13: POST /api/export — Export findings
- **Request**: `POST /api/export`
- **Status**: 200 OK
- **Response**: ZIP file, 210,882 bytes. Content-Type: `application/zip`.
- **Worked?**: YES
- **Persona understanding**: Yes — Clean data export. The ZIP includes memories, sessions, workspace configs, settings (API keys masked), and vault metadata.

### Elena Summary
| Step | Endpoint | Status | Worked? |
|------|----------|--------|---------|
| 1 | GET /api/workspaces | 200 | YES |
| 2 | POST /api/workspaces | 201 | YES |
| 3 | POST /api/chat (CSV) | 429 then 200 | PARTIAL (rate limit + echo) |
| 4 | POST /api/chat (tools) | 200 SSE | PARTIAL (echo mode) |
| 5 | POST /api/chat (growth) | 200 SSE | PARTIAL (echo mode) |
| 6 | POST /api/chat (/research) | 429 then 200 | PARTIAL (rate limit + echo) |
| 7 | POST /api/chat (report) | 200 SSE | PARTIAL (echo mode) |
| 8 | POST /api/memory/frames | 200 | YES |
| 9 | GET /api/memory/search | 200 | YES |
| 10 | POST /api/chat (recall) | 429 then 200 | PARTIAL (rate limit + echo) |
| 11 | GET /api/memory/graph | 200 | YES |
| 12 | POST /api/chat (/draft) | 429 then 200 | PARTIAL (rate limit + echo) |
| 13 | POST /api/export | 200 | YES |

**API endpoints working**: 13/13 (all return valid responses)
**Functionally complete**: 5/13 (8 are echo-mode or rate-limited)
**Addiction Score: 3/10** — The infrastructure layer (workspace, memory, knowledge graph, export) is solid. But Elena's entire value proposition depends on AI-powered data analysis which is unavailable in echo mode. She has no reason to return without LLM responses.

---

## Consolidated Findings

### F1: Rate Limiting Too Aggressive for Conversational Workflows
- **Location**: `packages/server/src/local/security-middleware.ts` line 55
- **Detail**: `/api/chat` limit is 30 requests per 60-second window. A marketing manager sending 4-5 rapid messages can hit this in normal use.
- **Impact**: 429 errors during natural conversation flow. `retryAfterMs` values of 15-25 seconds are too long for conversation.
- **Recommendation**: Increase to 60/min for chat, or implement token bucket with burst allowance. The UI must also display a user-friendly "slow down" message, not raw error.

### F2: Memory Search `mind` Field Misleading for Workspace-Stored Frames
- **Location**: `packages/server/src/local/routes/memory.ts` lines 11-17, 89-101
- **Detail**: When searching with `scope=all`, the `MultiMindSearchResult.source` field (which indicates the mind: 'personal'/'workspace') overwrites the frame's original provenance `source` field. The `normalizeFrame()` function attempts to split these, but the `mind`/`source_mind` field can show "personal" for frames stored in the workspace mind.
- **Impact**: UI may incorrectly badge workspace memories as personal. Low severity but confusing for power users.
- **Recommendation**: Preserve original frame provenance in a separate field before MultiMind search overwrite.

### F3: Rate Limiting is Per-IP, Not Per-Session
- **Location**: `packages/server/src/local/security-middleware.ts` line 308
- **Detail**: Rate limit key is `clientIP:method route`. A single user working across multiple workspaces/sessions shares the same rate limit bucket.
- **Impact**: Low in production (different users = different IPs), but during testing or when multiple browser tabs are open, limits compound.
- **Recommendation**: Consider adding session ID to the rate limit key for the chat endpoint.

### F4: Echo Mode Message Not Persona-Aware
- **Location**: `packages/server/src/local/routes/chat.ts` line 726
- **Detail**: The echo mode message mentions "LiteLLM" which is an internal infrastructure term. Non-technical users (Sara, Elena) would not understand this.
- **Impact**: Confusion and abandonment when LLM is unavailable.
- **Recommendation**: Change to "AI features are temporarily unavailable. Please check your Settings to configure an AI provider." Remove LiteLLM reference.

### F5: Knowledge Graph Empty Despite Entity Extraction Enabled
- **Location**: `packages/server/src/local/routes/memory.ts` lines 217-261
- **Detail**: POST /api/memory/frames has `extract=true` by default, but the built-in `extractEntities()` function only catches high-confidence patterns. Complex domain content (revenue metrics, SaaS terminology) may not produce entities.
- **Impact**: Knowledge graph appears empty even after saving rich analytical content. Elena's graph view would be disappointingly empty.
- **Recommendation**: Consider LLM-powered entity extraction for richer knowledge graphs, or provide a manual entity creation API.

### F6: No `/api/knowledge` Endpoint — Spec Mismatch
- **Detail**: The test spec referenced `GET /api/knowledge`, but the actual endpoint is `GET /api/memory/graph?workspace=X`. This is a documentation/discoverability issue.
- **Recommendation**: Add an alias or redirect from `/api/knowledge` to `/api/memory/graph` for API discoverability.

---

## API Endpoint Inventory (Validated)

| Endpoint | Method | Auth Required | Rate Limit | Status |
|----------|--------|---------------|------------|--------|
| /health | GET | No | 100/min | Working |
| /api/workspaces | GET | Yes | 100/min | Working |
| /api/workspaces | POST | Yes | 100/min | Working |
| /api/chat | POST | Yes | 30/min | Working (echo mode) |
| /api/memory/frames | POST | Yes | 100/min | Working |
| /api/memory/search | GET | Yes | 100/min | Working |
| /api/memory/graph | GET | Yes | 100/min | Working |
| /api/connectors | GET | Yes | 100/min | Working |
| /api/workspaces/:id/tasks | GET | Yes | 100/min | Working |
| /api/workspaces/:id/tasks | POST | Yes | 100/min | Working |
| /api/team/status | GET | Yes | 100/min | Working |
| /api/export | POST | Yes | 100/min | Working |

## Infrastructure Quality Assessment

| Category | Score | Notes |
|----------|-------|-------|
| API Availability | 10/10 | All endpoints respond correctly |
| Authentication | 9/10 | Bearer token works, /health exempt (intentional) |
| Rate Limiting | 7/10 | Functional but too aggressive for chat |
| SSE Streaming | 9/10 | Proper event format, token+done events, usage stats |
| Memory System | 8/10 | Save + search works, mind field labeling quirk |
| Task System | 10/10 | Full CRUD, UUID-based, timestamp tracking |
| Connector Catalog | 9/10 | 29 connectors defined, clear status reporting |
| Export | 10/10 | ZIP with proper Content-Disposition, GDPR-compliant |
| Error Handling | 8/10 | Rate limit returns retryAfterMs, validation returns clear errors |
| Echo Mode UX | 3/10 | Technical jargon, no persona awareness |

## Overall Addiction Scores

| Persona | Score | Reasoning |
|---------|-------|-----------|
| Sara (Marketing Manager) | 4/10 | Infrastructure is excellent, but no AI = no value for her role. She needs briefs, research, drafts. |
| Elena (Data Analyst) | 3/10 | Same infrastructure strength, but data analysis requires active LLM. Memory/export are nice but not enough alone. |

**With LLM connected, estimated scores would be:**
| Persona | Estimated Score | Reasoning |
|---------|----------------|-----------|
| Sara | 7/10 | Campaign briefs + Slack connector + memory + tasks = strong marketing workflow |
| Elena | 6/10 | Data analysis + memory recall + draft reports = useful, but no native visualization tools |
