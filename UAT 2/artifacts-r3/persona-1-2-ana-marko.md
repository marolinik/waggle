# Persona Testing Report: Ana & Marko
## UAT Round 3 - API Journey Testing
**Date:** 2026-03-21
**Server:** localhost:3333 (local mode, LLM offline)
**Auth:** Bearer token via /health endpoint (SEC-011)

---

## Server State at Test Time

- **LLM Status:** OFFLINE (LiteLLM unreachable, Anthropic proxy unhealthy). All /api/chat requests return echo-mode responses.
- **Auth:** Bearer token required on all endpoints except /health. Token retrieved from /health response `wsToken` field.
- **Rate Limiter:** Active. /api/chat limited to 30 req/min (sliding window). Caused repeated 429 errors during testing.
- **Database:** Healthy. 107 memory frames, 43% embedding coverage.
- **Skills:** 58 skills loaded.
- **Connectors:** 29 connectors registered (all disconnected).

---

## Persona 1: Ana -- Product Manager (Solo tier)
### Journey: Morning standup prep -> Review decisions from last week -> Draft PRD for new feature -> Share with team

### Step-by-Step Results

| # | Action | HTTP Request | Status | Works? | Discoverable? | Notes |
|---|--------|-------------|--------|--------|---------------|-------|
| 1 | List workspaces | GET /api/workspaces | 200 | Yes | Yes | Returns 34 workspaces as JSON array. 206ms. Instant, clear structure. |
| 2 | Create workspace | POST /api/workspaces `{"name":"Ana Product Team","group":"UAT-Persona"}` | 201 | Yes | Yes | Clean response with id, name, group, created. 205ms. Auto-generates kebab-case ID `ana-product-team`. |
| 3 | /catchup via chat | POST /api/chat `{"message":"/catchup","workspace":"ana-product-team"}` | 200 | Partial | No | SSE streaming works but returns echo-mode message ("Waggle is running in local mode"). /catchup is NOT processed as a command in echo mode -- it's treated as plain text. 712ms. Ana would be confused: no catch-up summary, just a "configure API key" message. |
| 4 | Search memory for decisions | GET /api/memory/search?q=decisions&workspace=ana-product-team | 200 | Yes | Yes | Returns 3 results from personal mind (no workspace memories yet). FTS5 search works correctly. 215ms. Results are structured with content, importance, timestamps. |
| 5 | Ask about decisions via chat | POST /api/chat `{"message":"What were the key decisions...","workspace":"ana-product-team"}` | 200 | Partial | No | Echo mode: just mirrors the message back. No LLM = no intelligent response. 880ms. Ana gets zero value from this. |
| 6 | /draft PRD via chat | POST /api/chat `{"message":"/draft Create a PRD outline...","workspace":"ana-product-team"}` | 200 | Partial | No | Echo mode again. /draft command requires LLM agent loop. 1143ms. No PRD generated. |
| 7 | Save PRD to memory via chat | POST /api/chat `{"message":"Save this PRD to memory...","workspace":"ana-product-team"}` | 200 | Partial | No | Echo mode. save_memory tool requires LLM agent loop. 963ms. Nothing saved. |
| 8 | Direct memory write | POST /api/memory/frames `{"content":"PRD: Mobile Notifications Feature...","workspace":"ana-product-team","importance":"important"}` | 200 | Yes | Partial | Direct API works perfectly. Returns `{saved:true, frameId:1, mind:"workspace"}`. 210ms. But Ana would never know this endpoint exists -- it's a developer API, not surfaced in UI. |
| 9 | Search for saved PRD | GET /api/memory/search?q=prd&workspace=ana-product-team | 200 | Yes | Yes | Successfully finds the memory written in step 8. Returns content, importance, timestamp. 203ms. |
| 10 | Export workspace data | POST /api/export | 200 | Yes | Yes | Returns ZIP file (application/zip). Includes memories, sessions, workspaces, settings (masked API keys), vault metadata. 615ms. GDPR-compliant export. |
| 11 | List sessions | GET /api/workspaces/ana-product-team/sessions | 200 | Yes (empty) | Partial | Returns `[]`. **BUG FINDING:** Chat messages sent in echo mode are NOT persisted to session files. The `persistMessage()` function is only called inside the `litellmAvailable` branch of the chat route. Echo mode skips session persistence entirely. This means 4 chat messages were lost. |
| 12 | /status command | POST /api/commands/execute `{"command":"/status","workspaceId":"ana-product-team"}` | 200 | Yes | Yes | Returns structured status with workspace summary and memory count. Also tested via /api/chat (initially 429 rate limited, then echo mode). Commands endpoint bypasses LLM dependency. 224ms. |
| 13 | /help command | POST /api/commands/execute `{"command":"/help","workspaceId":"ana-product-team"}` | 200 | Yes | Yes | Returns formatted table of all 13 slash commands with descriptions. 215ms. Clear, comprehensive. |

### Addiction Score: 4/10

### What Hooks Them
- **Workspace creation is instant and frictionless** -- name and group, done
- **Memory search actually works** -- FTS5 returns relevant results quickly
- **Workspace context endpoint** is rich: summary, suggested prompts, recent memories, progress items, stats
- **Export is comprehensive** -- GDPR-compliant, includes everything
- **/help and /status commands** work without LLM -- good offline resilience

### What Loses Them
- **Echo mode kills the entire value prop.** When LLM is offline, chat becomes a mirror that shows "configure API key" for every message. Ana gets zero work done.
- **No graceful degradation.** Slash commands (/catchup, /draft, /research) in chat are useless without LLM. The /api/commands/execute endpoint handles /status and /help offline, but /catchup via commands returns actual data. This inconsistency is confusing.
- **Rate limiter is aggressive for testing/power use.** 30 req/min on /api/chat means rapid workflows hit 429 errors. The rate limiter is per-endpoint, so even echo-mode responses count against the limit.
- **Session persistence gap in echo mode.** Messages sent in echo mode are completely lost -- not saved to disk, not visible in session listings. This breaks the continuity promise.

### Missing Aha Moments
1. **"My context is already here"** -- When Ana opens a workspace, the context endpoint has everything (summary, suggestions, memories), but chat doesn't use it in echo mode
2. **"It remembered what I said"** -- Memory search works, but the chat loop can't leverage it without LLM
3. **"I can pick up where I left off"** -- Sessions show empty because echo mode doesn't persist messages

### Overall Success Rate: 9/13 steps succeeded (69%)
- 4 steps were "Partial" due to echo mode (no LLM = no intelligent response)
- All non-chat API endpoints worked correctly
- Rate limiting caused additional friction

### Bugs Found
1. **BUG: Echo mode does not persist chat messages to session files.** `persistMessage()` is only called inside the `litellmAvailable` branch of chat.ts (around line 752). Echo-mode messages vanish.
2. **BUG: Slash commands sent via /api/chat are not routed to /api/commands/execute in echo mode.** When LLM is offline, commands like /catchup, /status, /help could still be executed via the command registry, but the chat route doesn't attempt this -- it goes straight to echo response.

---

## Persona 2: Marko -- Full-Stack Developer (Solo tier)
### Journey: Pick up coding task -> Search codebase -> Write code -> Run tests -> Git commit -> Create PR

### Step-by-Step Results

| # | Action | HTTP Request | Status | Works? | Discoverable? | Notes |
|---|--------|-------------|--------|--------|---------------|-------|
| 1 | List workspaces | GET /api/workspaces | 200 | Yes | Yes | Returns all 35 workspaces (including Ana's). 200ms. |
| 2 | Create dev workspace | POST /api/workspaces `{"name":"Marko Dev Workspace","group":"UAT-Persona","directory":"D:/Projects/MS Claw/waggle-poc"}` | 201 | Yes | Yes | Workspace created with directory binding. ID: `marko-dev-workspace`. 212ms. |
| 3 | /research via chat | POST /api/chat `{"message":"/research What are the best practices...","workspace":"marko-dev-workspace"}` | 200 (then 429) | Partial | No | First attempt: 429 rate limited (from Ana's test accumulation). Retry after cooldown: echo mode response. /research requires LLM agent loop for web_search and synthesis. 882ms. |
| 4 | Read file via chat | POST /api/chat `{"message":"Read the file packages/server/src/local/index.ts...","workspace":"marko-dev-workspace"}` | 200 | Partial | No | Echo mode. read_file tool requires LLM agent loop. 813ms. Marko can't read files through chat without LLM. |
| 5 | Search codebase via chat | POST /api/chat `{"message":"Search for all files that contain WebSocket...","workspace":"marko-dev-workspace"}` | 200 | Partial | No | Echo mode. search_files/search_content tools require LLM agent loop. 848ms. |
| 6 | Write utility via chat | POST /api/chat `{"message":"Write a simple utility function...","workspace":"marko-dev-workspace"}` | 200 (after 429) | Partial | No | Hit rate limit on first attempt. Echo mode on retry. write_file tool requires LLM. |
| 7 | Run tests via chat | POST /api/chat `{"message":"Run the tests with npx vitest run...","workspace":"marko-dev-workspace"}` | 200 | Partial | No | Echo mode. bash tool requires LLM agent loop. 871ms. |
| 8 | /plan via commands | POST /api/commands/execute `{"command":"/plan Create a plan for...","workspaceId":"marko-dev-workspace"}` | 200 | No | Yes | Returns "Workflow runner is not available in this context." /plan requires runWorkflow which needs full agent loop. 205ms. At least it fails gracefully with a clear message. |
| 9 | /decide via commands | POST /api/commands/execute `{"command":"/decide Should we use native WebSocket or socket.io...","workspaceId":"marko-dev-workspace"}` | 200 | Yes | Yes | Returns a structured decision matrix template with options, evaluation criteria, and recommendation placeholder. 217ms. Not filled in (needs LLM), but the template itself is useful. |
| 10 | List skills | GET /api/skills | 200 | Yes | Yes | Returns 58 installed skills with name, content length, and 200-char preview. Includes categories: code-review, research-synthesis, decision-matrix, etc. |
| 11 | List connectors | GET /api/connectors | 200 | Yes | Yes | Returns 29 connectors including GitHub (7 tools: list_repos, search_code, list_issues, get_file, create_issue, list_prs, create_pr), Jira, Slack, etc. All "disconnected" status. |
| 12 | /spawn via chat | POST /api/chat `{"message":"/spawn researcher Research WebSocket libraries","workspace":"marko-dev-workspace"}` | 200 (after 429) | Partial | No | Multiple 429 rate limit hits before succeeding. Echo mode response. /spawn requires full agent loop. Via commands endpoint: "Sub-agent spawning is not available in this context." |
| 13 | Agent status | GET /api/agent/status | 200 | Yes | Yes | Returns running status, model (claude-sonnet-4-6), token usage (7.3M input, 73K output), estimated cost ($22.94), 149 turns. Very useful for monitoring. |

### Addiction Score: 3/10

### What Hooks Them
- **Workspace with directory binding** -- Marko's workspace is tied to the project directory, which grounds all file operations
- **58 skills available** -- code-review, static-analysis, research-synthesis, etc. Impressive breadth
- **29 connectors with detailed capabilities** -- GitHub connector has 7 specific tools. Clear "what can I do" signal
- **Agent status with cost tracking** -- $22.94 across 149 turns. Transparency builds trust
- **/decide command works offline** -- Generates a useful decision matrix template even without LLM

### What Loses Them
- **Every developer workflow requires LLM.** File reading, code search, bash commands, git operations, test running -- ALL require the agent loop. Echo mode is completely useless for a developer persona.
- **Rate limiter compounds frustration.** When you're already getting echo-mode responses, hitting 429 on top of that is rage-inducing.
- **/plan fails even via commands endpoint.** Returns "Workflow runner is not available" -- no fallback, no local-only plan creation.
- **No direct API for file/code operations.** There's no GET /api/files or GET /api/code/search endpoint that works without LLM. All code intelligence is locked behind the agent loop.

### Missing Aha Moments
1. **"It can read my code"** -- read_file, search_files, search_content tools exist but are only accessible through LLM agent
2. **"It ran my tests"** -- bash tool exists but requires LLM
3. **"It created a PR"** -- GitHub connector is registered but disconnected, and connector execution requires LLM
4. **"It planned my work"** -- /plan requires workflow runner, unavailable in commands context

### Overall Success Rate: 6/13 steps succeeded (46%)
- 5 steps were "Partial" due to echo mode
- 1 step explicitly failed (/plan via commands)
- 1 step was repeatedly blocked by rate limiter before succeeding in echo mode
- Non-chat endpoints (skills, connectors, agent status) all worked correctly

### Bugs Found
1. **Same as Ana Bug 1:** Echo mode does not persist messages to sessions
2. **Same as Ana Bug 2:** Slash commands in chat not routed to command registry in echo mode
3. **BUG: Rate limiter counts echo-mode responses against the limit.** Echo mode responses take ~800ms but use zero LLM resources. They should arguably have a higher rate limit or be exempt from the chat rate limit.

---

## Cross-Persona Findings

### Infrastructure Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| Workspace CRUD | WORKING | Create, list, get, context -- all functional |
| Memory Search (FTS5) | WORKING | Fast, relevant results, handles workspace scope |
| Memory Write (direct API) | WORKING | Saves to workspace mind with entity extraction |
| Session Persistence | BROKEN IN ECHO MODE | Only persists when LLM is available |
| Chat (SSE streaming) | PARTIAL | SSE works, but echo mode provides no value |
| Commands (non-LLM) | WORKING | /status, /help, /memory, /skills, /decide work offline |
| Commands (LLM-dependent) | NOT AVAILABLE | /plan, /spawn, /research, /draft require agent loop |
| Skills API | WORKING | List, install, catalog -- all functional |
| Connectors API | WORKING | 29 connectors listed with capabilities |
| Export | WORKING | GDPR-compliant ZIP with all data |
| Agent Status | WORKING | Cost, tokens, model, turns -- all reported |
| Rate Limiting | WORKING (TOO AGGRESSIVELY) | 30/min for chat causes issues in power-use/testing scenarios |
| Auth (Bearer) | WORKING | Token from /health, consistent enforcement |

### Critical Findings

1. **LLM offline = product is non-functional for primary use cases.** Both personas depend entirely on the agent loop for their core workflows. Without LLM, the product becomes a database with an API.

2. **Slash commands should degrade gracefully in echo mode.** When chat detects a slash command AND LLM is unavailable, it should route to /api/commands/execute instead of echoing. The command registry already handles /catchup, /status, /help, /memory, /skills, /decide locally.

3. **Echo mode should persist messages.** Even without LLM responses, the user's messages should be saved to session files for continuity. The user typed something -- don't lose it.

4. **Rate limiter should distinguish echo from LLM requests.** Echo responses use zero LLM resources. They should either be exempt from the /api/chat rate limit or have a much higher limit (e.g., 200/min).

5. **The /api/workspaces/:id/context endpoint is excellent.** It provides summary, suggested prompts, recent memories, decisions, progress items, and stats -- all without LLM. This should be the foundation of the offline experience.

### Recommendations (Priority Order)

1. **P0: Route slash commands to command registry in echo mode.** In chat.ts, before the echo branch, check if `message.startsWith('/')` and try `commandRegistry.execute()`. Fall back to echo if the command doesn't exist.

2. **P0: Persist echo-mode messages to session files.** Move `persistMessage()` call above the `litellmAvailable` check so user messages are always saved.

3. **P1: Exempt echo-mode responses from aggressive rate limiting.** Either check `litellmAvailable` before applying the chat rate limit, or use a separate higher limit for echo responses.

4. **P1: Surface workspace context in echo-mode responses.** Instead of "configure API key," show the workspace summary, recent memories, and suggested prompts from the context endpoint. Give the user something useful.

5. **P2: Add direct file/search API endpoints.** For developer personas, having GET /api/files/read?path=... and GET /api/code/search?q=... that work without LLM would dramatically improve offline utility.

---

## Test Environment Notes

- All tests executed via curl with Bearer token authentication
- SSE responses captured via tail/head truncation (full events streamed correctly)
- Rate limiter window: 60 seconds, /api/chat limit: 30 requests
- Server in "offline" mode since 2026-03-21T11:16:03.476Z (LiteLLM unreachable)
- Default model: claude-sonnet-4-6
- Total workspace memory: 107 frames, 4.5MB mind database
