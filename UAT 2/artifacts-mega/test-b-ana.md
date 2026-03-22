# Test B1: Ana — Product Manager (Solo Tier)

**Date**: 2026-03-22
**Tester**: Automated UAT Agent (Persona B1)
**Server**: http://localhost:3333
**Branch**: phase8-wave-8f-ui-ux

---

## Workspace Setup
- **Created**: `ana-pm-mega-uat` (Product Management group)
- **Workspace ID**: `ana-pm-mega-uat`
- **Creation Response**: `{"id":"ana-pm-mega-uat","name":"Ana PM Mega-UAT","group":"Product Management","created":"2026-03-22T01:55:04.377Z"}`
- **Setup Quality**: Clean, immediate, no issues.

---

## 8:00 AM — Morning Prep

### Test 1: /catchup
- **Command**: `/catchup`
- **Response**: `"## Catch-Up Briefing\n\nHere's what's been happening in this workspace:\n\nNo workspace state available."`
- **Quality**: 3/10
- **Issue**: For a brand-new workspace, this is expected — but the output is bare minimum. No tips like "You haven't done anything yet — try X." A PM opening Waggle for the first time gets a dead-end. Claude.ai Projects would at least acknowledge the empty state more gracefully.
- **BUG**: None — but UX is poor for first-use experience.

### Test 2: Sprint Priorities
- **Prompt**: "What are our top 3 priorities this sprint?"
- **Response**: Full structured response with 3 priorities (M4 Tauri Desktop, B2B Banking Lead Gen, M5 Web App Planning). Used `auto_recall` + `search_memory` tools. Referenced strategy context from personal mind.
- **Quality**: 7/10
- **Positive**: Pulled real data from memory, gave structured Markdown output, referenced strategic context about platform-first build order. This felt genuinely useful.
- **Negative**: The data came from the *personal* mind (shared across workspaces from prior tests), not this workspace. A fresh user with no prior data would get nothing useful. The agent recalled 10 memories but they were from other workspaces and test sessions.
- **Comparison to Claude.ai**: Claude.ai Projects would require the user to set up project context manually, but wouldn't hallucinate cross-workspace data. Waggle's memory advantage is real here IF the data is workspace-scoped.

### Test 3: Memory Frames Check
- **Endpoint**: `GET /api/memory/frames?workspaceId=ana-pm-mega-uat`
- **Result**: 50 frames returned — all from prior test sessions (personal mind + workspace bleed).
- **Quality**: N/A (infrastructure check)
- **BUG (CRITICAL)**: Memory frames returned include data from OTHER workspaces/test sessions: "Workspace topic: Team-Test-TeamId-Mega", "Alpha Corp engagement key facts", "User's favorite color is cerulean blue". This is **workspace isolation failure** — Ana's PM workspace should NOT contain memories from "Team-Test-TeamId-Mega" or "Client-Acme-Corp". Either the query is not workspace-scoped, or the personal mind is leaking into workspace queries.

---

## 9:00 AM — Standup Prep

### Test 4: /draft Standup Update
- **Command**: `/draft standup update for my team based on our sprint priorities`
- **Response (initial)**: The `/draft` slash command returned a template stub: "## Draft Prompt\n\nPlease draft the following:\n\n**standup update for my team based on our sprint priorities**\n\n_Tip: A review workflow is not available. The agent will draft directly._"
- **Quality**: 2/10
- **BUG (HIGH)**: The `/draft` command does NOT actually draft anything. It outputs a meta-template telling the user to ask again. This is a broken slash command — it should either generate the draft OR pass through to the agent for generation. A PM would be confused and frustrated.

- **Retry (direct prompt)**: "Write a standup update for my team based on the sprint priorities we just discussed. Format it as Yesterday/Today/Blockers."
- **Response**: The agent recalled memories, then **triggered a web search for "top AI product launches 2025 productivity tools startups"** instead of writing a standup.
- **Quality**: 3/10
- **BUG (HIGH)**: The agent's tool selection is broken. A standup update request should use memory recall only, not web search. The agent wasted tokens and time fetching Mashable articles about Veo 3 and Zoom AI Companion. Eventually it produced a standup, but also hallucinated an **NDA Template** appended to the response — completely unrelated content bleeding in.

### Test 5: Save Standup to Memory
- **Prompt**: "Save this standup update to memory for future reference"
- **Response**: Agent recalled 19 memories, tried a web search (rate limited), ran `git_log`, then generated a standup AND an NDA template (again). Memory save rate limit was hit (50 saves).
- **Quality**: 2/10
- **BUG (HIGH)**: Memory save rate limit of 50 was already exhausted from prior test sessions or auto-saves. The agent could not save. Also, the agent ran `git_log` to check recent commits — useful in theory, but the git log showed commits from an unrelated project (EK Forge sales cockpit).
- **BUG (CRITICAL)**: The response AGAIN included an NDA template that was never requested. This appears to be a persistent context pollution issue — something in the recalled memories or system prompt is causing the agent to generate legal documents unprompted.

---

## 10:00 AM — PRD Writing

### Test 6: Draft PRD
- **Prompt**: "Draft a PRD for adding AI-powered search to our product. Include problem statement, proposed solution, success metrics, and timeline."
- **Response (attempt 1)**: Agent recalled 20 memories, searched for "Waggle product features search AI", then **leaked raw XML tool invocation as text**: `<invoke name="search_memory">\n<parameter name="query">Waggle platform features architecture search memory</parameter>\n</invoke>`
- **Quality**: 0/10
- **BUG (CRITICAL)**: The agent returned a raw XML tool call as response text instead of executing it. The streaming pipeline broke — the LLM attempted a tool call but the orchestrator rendered it as output. This is a **protocol-level bug** in the agent's tool-call handling.

- **Prompt (retry)**: "Please write a complete PRD for AI-powered search. I need: 1) Problem Statement 2) Proposed Solution 3) Success Metrics 4) Timeline. Make it specific to our Waggle product."
- **Response**: Agent recalled 17 memories, then **attempted save_memory with empty content 4 times** (NOT NULL constraint failures), got a loop detection error, tried saving stale data ("Rust microservice for payment processing", "John Smith is our lead investor") that was already stored, then ran `search_content` across the entire D:\Projects directory for "EBUSY|sqlite.*lock|database.*lock" — completely unrelated to a PRD request. Finally returned massive Lucide icon type definitions from node_modules.
- **Quality**: 0/10
- **BUG (CRITICAL)**: Multiple cascading failures:
  1. `save_memory` called with empty content (NOT NULL crash) — 4 times
  2. Loop detection triggered correctly but too late
  3. Agent then searched for SQLite lock errors — hallucinated debugging task
  4. `search_content` and `search_files` are scoped to D:\Projects (parent), not waggle-poc — returns results from Write-My-Book-OK, EK-Forge, clawd, etc.
  5. No PRD was ever generated

### Test 7: Add Competitive Analysis
- **Prompt**: "Add a competitive analysis section to the PRD"
- **Response**: Agent recalled 20 memories (including "John Smith is our lead investor"), attempted to save a fabricated "Secret code: ALPHA-777-MEGA-TEST" as critical importance (this was from a prior test session's memory, not from this conversation), then generated a decent competitive analysis table.
- **Quality**: 6/10
- **Positive**: The competitive analysis itself was well-structured — comparison table of Waggle vs Notion AI vs Microsoft Copilot vs Claude, with features like Semantic Search, Multi-Source Search, Persistent Context, Privacy-First. Market gaps and competitive threats were relevant.
- **Negative**: The agent saved fabricated "secret code" data to memory without user request. The recalled memories were polluted with data from other workspaces.
- **BUG (MEDIUM)**: Agent autonomously saves fabricated/stale data to memory from prior test sessions. Memory hygiene is poor.

### Test 8: Refine Success Metrics
- **Prompt**: "Make the success metrics more specific with actual numbers and KPIs"
- **Response**: Agent recalled 20 memories, hit memory save rate limit, then **generated an EU AI Act Compliance Checklist** — completely unrelated to the request.
- **Quality**: 0/10
- **BUG (CRITICAL)**: Complete topic drift. The agent ignored the user's request entirely and generated a legal compliance document. This is likely caused by context window pollution — the recalled memories (secret codes, payment processing deadlines, investor emails) overwhelmed the actual user request.

---

## 11:00 AM — Decision Making

### Test 9: /decide Command
- **Command**: `/decide Should we build or buy the search feature?`
- **Response**: Empty decision matrix template — "Option A | | | | |" with no analysis filled in. Says "Ask the agent to help fill it in."
- **Quality**: 2/10
- **BUG (HIGH)**: The `/decide` command, like `/draft`, generates an empty template instead of performing analysis. It has the context (Waggle, search, build vs buy) but doesn't use it. The instruction to "ask the agent to help fill it in" is self-referential — the user IS asking the agent.

### Test 10: Research Search APIs
- **Prompt**: "Research the top 5 embeddable search APIs and compare them"
- **Response**: Agent recalled 20 memories (secret codes, investor info), tried to save fabricated data (board meeting, deployment pipeline info — never mentioned by user), hit save rate limit, then searched for `**/commands/**/*` across D:\Projects and returned 100+ unrelated files from viralpen, clawd, Write-My-Book-OK, etc.
- **Quality**: 0/10
- **BUG (CRITICAL)**:
  1. Agent fabricated and attempted to save data the user never said ("Board meeting scheduled for April 15, 2026", "Deployment pipeline: Uses GitHub Actions")
  2. File search tool (`search_files`) is scoped to D:\Projects parent directory, not the workspace
  3. No research on search APIs was ever conducted
  4. The `web_search` tool was rate-limited from earlier abuse

### Test 11: Save Decision Rationale
- **Prompt**: "I've decided to build. Save the rationale: we need custom ranking + data stays in-house"
- **Response**: Agent recalled 20 memories, searched for files (same D:\Projects-wide scope issue), returned massive file lists from unrelated projects.
- **Quality**: 1/10
- **BUG (HIGH)**: Memory save rate limit prevented saving the decision. The agent could not fulfill the core request. Also wasted tokens on file searches.

---

## 2:00 PM — Sprint Planning

### Test 12: /plan Command
- **Command**: `/plan Next sprint: implement AI search MVP`
- **Response**: `"Workflow runner is not available in this context."`
- **Quality**: 1/10
- **BUG (HIGH)**: The `/plan` slash command returns an error instead of generating a plan. The workflow runner dependency is not met in the local server context.

### Test 13: Break Plan into Tasks
- **Prompt**: "Break the AI search MVP plan into tasks with story points and assignees"
- **Response**: Well-structured task breakdown with 67 total story points across 3 phases: Search Infrastructure (21 pts), Search Intelligence (18 pts), Frontend Experience (16 pts). Included specific tasks with story points and role assignments.
- **Quality**: 8/10
- **Positive**: This was the best response of the entire session. Detailed, actionable, properly sized tasks with clear ownership. Referenced FTS5 and sqlite-vec from Waggle's actual architecture. Story points were realistic.
- **Negative**: Memory save rate limit prevented persisting this plan. The agent tried to save the build decision but was blocked.

---

## 4:00 PM — End of Day

### Test 14: /status Command
- **Command**: `/status`
- **Response**: `"## Status Report\n\nNo workspace state available."`
- **Quality**: 1/10
- **BUG (HIGH)**: After a full day of 13 interactions, `/status` shows NOTHING. The slash command does not look at session history — it only checks workspace state which was never set. This is a critical failure for the "return later without losing thread" product promise.

### Test 15: Tomorrow Focus
- **Prompt**: "What should I focus on tomorrow?"
- **Response**: Structured daily schedule with 3 priorities: Client Meeting Preparation (from leaked cross-workspace memory), M4 Tauri Desktop App Progress, AI Search MVP Foundation. Included a time-blocked schedule table.
- **Quality**: 5/10
- **Positive**: Remembered the build decision from this session, correctly prioritized AI search tasks, provided a time-blocked schedule.
- **Negative**: Priority #1 was "Client Meeting Preparation" — but Ana never mentioned a client meeting. This came from cross-workspace memory bleed (another persona's workspace had "prepare for client meeting tomorrow"). The agent also fabricated "Deployment pipeline: Uses GitHub Actions" and tried to save it.
- **BUG (MEDIUM)**: Cross-workspace memory contamination caused incorrect prioritization.

### Test 16: Final Memory Frame Count
- **Endpoint**: `GET /api/memory/frames?workspaceId=ana-pm-mega-uat`
- **Result**: 50 frames — same as start. No new memories were saved during this session due to the 50-save rate limit already being exhausted.
- **Quality**: N/A
- **BUG (CRITICAL)**: The memory save rate limit (50 per session) was already exhausted before Ana's session began — likely from prior test sessions. This means the entire session's work (PRD, decisions, plans) was lost. The rate limit appears to be per-workspace or global, not per-session as documented.

---

## Critical Bugs Found

| # | Severity | Description |
|---|----------|-------------|
| B1 | CRITICAL | **Memory workspace isolation failure** — Frames from other workspaces/personas bleed into Ana's workspace queries. Personal mind data leaks into workspace-scoped endpoints. |
| B2 | CRITICAL | **Agent leaks raw XML tool calls as response text** — `<invoke name="search_memory">` rendered as output instead of executed (Test 6, attempt 1). |
| B3 | CRITICAL | **save_memory called with empty content** — NOT NULL constraint crash, 4 consecutive failures with no fallback (Test 6, attempt 2). |
| B4 | CRITICAL | **File search tool scoped to parent directory** — `search_files` and `search_content` scan all of D:\Projects instead of the workspace directory, returning results from 10+ unrelated projects. |
| B5 | CRITICAL | **Memory save rate limit exhausted before session start** — 50-save limit was already hit, preventing ALL saves during Ana's workday. Session work is entirely ephemeral. |
| B6 | CRITICAL | **Complete topic drift** — Agent generates EU AI Act Compliance Checklist when asked for success metrics (Test 8). Context window pollution from recalled memories overwhelms user requests. |
| B7 | HIGH | **/draft command returns empty template** — Does not generate content, just echoes the prompt back as a "draft prompt" stub. |
| B8 | HIGH | **/decide command returns empty matrix** — Template with empty cells, tells user to "ask the agent" (they already did). |
| B9 | HIGH | **/plan command fails** — "Workflow runner is not available in this context." |
| B10 | HIGH | **/status shows nothing after 13 interactions** — No session history awareness. |
| B11 | HIGH | **Agent fabricates data and saves to memory** — Creates entries like "Board meeting scheduled for April 15, 2026" that the user never mentioned. |
| B12 | HIGH | **Web search triggered for standup request** — Agent uses web_search for internal tasks, gets rate limited, wastes tokens. |
| B13 | MEDIUM | **NDA template hallucination** — Agent appends legal document templates to standup updates (Tests 4b, 5). |
| B14 | MEDIUM | **Cross-workspace memory contamination** — Recommendations based on other personas' data ("client meeting tomorrow" from Team Alpha workspace). |

---

## Scorecard

| Metric | Score |
|--------|-------|
| Tasks Attempted | 16 |
| Tasks Completed Successfully | 4 |
| Tasks Partially Completed | 5 |
| Tasks Failed | 7 |
| Completion Rate | 25% |
| Average Response Quality | 2.6/10 |
| Time Fighting Tool | 70% |
| Would Come Back Tomorrow | 2/10 |
| Would Tell a Colleague | 1/10 |
| Would Pay $30/month | **No** — would not pay anything in current state |

### Quality Breakdown by Test

| Test | Quality | Status |
|------|---------|--------|
| 1. /catchup | 3/10 | Partial — empty but correct for new workspace |
| 2. Sprint priorities | 7/10 | Success — good output despite cross-workspace data |
| 3. Memory frames | N/A | Infrastructure check — revealed isolation bug |
| 4. /draft standup | 2/10 | Failed — empty template |
| 4b. Direct standup | 3/10 | Partial — eventually generated but with NDA hallucination |
| 5. Save standup | 2/10 | Failed — rate limit, git_log from wrong project |
| 6. Draft PRD (attempt 1) | 0/10 | Failed — raw XML leaked |
| 6. Draft PRD (attempt 2) | 0/10 | Failed — save_memory crash loop, wrong file search |
| 7. Competitive analysis | 6/10 | Success — good table despite memory pollution |
| 8. Refine metrics | 0/10 | Failed — generated EU AI Act checklist instead |
| 9. /decide | 2/10 | Failed — empty template |
| 10. Research APIs | 0/10 | Failed — file search across wrong directory, fabricated data |
| 11. Save decision | 1/10 | Failed — rate limit, no save |
| 12. /plan | 1/10 | Failed — workflow runner not available |
| 13. Task breakdown | 8/10 | Success — best response of session |
| 14. /status | 1/10 | Failed — no state after full day |
| 15. Tomorrow focus | 5/10 | Partial — good structure but wrong priorities from memory bleed |
| 16. Memory count | N/A | 50 frames, all from prior sessions |

---

## Comparison to Claude.ai Projects

| Capability | Waggle | Claude.ai Projects |
|------------|--------|--------------------|
| Workspace creation | Instant, good | Manual project setup |
| Memory persistence | Broken (rate limits, isolation) | Reliable (project knowledge) |
| Slash commands | 4/5 broken (/catchup, /draft, /decide, /plan, /status) | N/A — no slash commands |
| PRD generation | Failed completely | Would produce excellent PRD |
| Decision frameworks | Empty template | Would fill in analysis |
| Context continuity | Cross-workspace contamination | Clean project isolation |
| Task breakdown | Excellent (8/10) | Similar quality |
| Research | Web search rate limited | Reliable web search |
| Sprint planning | Good when it works | Similar quality |
| Overall reliability | ~25% success rate | ~95% success rate |

**Bottom line**: A PM would get more value from Claude.ai Projects in 5 minutes than from Waggle in an hour. The memory advantage Waggle promises is currently a liability due to cross-workspace contamination, rate limits, and fabricated saves.

---

## Root Cause Analysis

The session's failures cluster around **5 systemic issues**:

1. **Memory save rate limit is session-global, not workspace-scoped** — 50 saves were already used by prior test personas, leaving Ana with zero save capacity. This single issue caused cascading failures across Tests 5, 11, and all auto-save attempts.

2. **File/content search tools scope to D:\Projects, not workspace directory** — The agent's `search_files` and `search_content` tools operate on the user's home directory, not the workspace. This causes massive token waste returning node_modules from unrelated projects.

3. **Memory recall returns cross-workspace data** — The personal mind and workspace mind are not properly isolated. Ana's workspace recalls "Secret code ALPHA-777-MEGA-TEST" and "John Smith is our lead investor" from other test sessions.

4. **Slash commands are skeletal templates** — `/draft`, `/decide`, `/plan`, `/status` output static scaffolds instead of leveraging the agent's LLM capabilities. They feel like v0.1 prototypes.

5. **Context window pollution** — When 20 irrelevant memories are recalled (secret codes, investor emails, file paths from other projects), the agent loses focus on the actual user request and hallucates unrelated content (EU AI Act checklist, NDA templates).

---

## Recommendations (Priority Order)

1. **Fix memory save rate limit** — Make it per-workspace AND per-session, not global. Reset on new session.
2. **Scope file tools to workspace directory** — `search_files` and `search_content` must be restricted to the workspace's configured path.
3. **Fix workspace memory isolation** — Ensure `/api/memory/frames?workspaceId=X` only returns frames created in workspace X.
4. **Upgrade slash commands** — `/draft`, `/decide`, `/plan` should pipe through the agent LLM, not return static templates.
5. **Fix /status** — Should summarize session history, not just workspace state.
6. **Fix empty save_memory calls** — Add input validation before database call; never call with null/empty content.
7. **Fix XML tool-call leak** — Agent should never render tool invocations as text output.
8. **Limit auto-recall to 5-10 relevant memories** — 20 memories flood the context and cause topic drift.
9. **Add memory relevance threshold** — Don't recall memories with score < 0.02 (many had 0.013).
10. **Prevent fabricated memory saves** — Agent should not invent and save data the user never stated.
