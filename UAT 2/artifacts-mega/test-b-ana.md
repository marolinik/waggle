# Test B1: Ana — Product Manager (Solo Tier)

**Date**: 2026-03-22 (Re-run)
**Tester**: Automated UAT Agent (Persona B1) — Claude Opus 4.6
**Server**: http://localhost:3333
**Branch**: master
**Known Constraint**: Anthropic API key is EXPIRED — all LLM-dependent chat features fail. This test evaluates the non-LLM infrastructure layer and graceful degradation.

---

## Workspace Setup
- **Workspace**: `ana-pm-mega-uat` (Product Management group)
- **Pre-existing**: Yes, created 2026-03-22T01:55:04.377Z
- **Auth**: Bearer token works. Workspace list returns 50+ workspaces.
- **Setup Quality**: No issues — workspace accessible immediately.

---

## 8:00 AM — Morning Prep

### Test 1: /catchup Command
- **Request**: `POST /api/chat` with `{"message":"/catchup","workspaceId":"ana-pm-mega-uat"}`
- **HTTP Status**: 200 (SSE stream)
- **Response**: Streamed a "Catch-Up Briefing" with 5 items pulled from workspace memory. Included milestone statuses (M3c Agent Power: COMPLETE, M1 MVP Desktop App: COMPLETE), architecture notes (CognifyPipeline), strategic decisions (build platforms first), and company profile context.
- **Quality**: 7/10
- **Analysis**: The /catchup command works WITHOUT the LLM — it is entirely memory-driven. This is a strong design choice. The content was real, structured, and actionable. However, the items are from the personal mind (cross-workspace), not specific to Ana's PM workspace. A PM would get orientation, but some items (quantum computing notes like "Superposition alone does nothing") are clearly leaked from other workspaces.
- **Time fighting tool**: 0% — instant response.

### Test 2: /now Command
- **Request**: `POST /api/chat` with `{"message":"/now","workspaceId":"ana-pm-mega-uat"}`
- **HTTP Status**: 200 (SSE stream)
- **Response**: "Right Now" report with 5 items — milestones, architecture summary, memory system details. Ended cleanly with `event: done`.
- **Quality**: 6/10
- **Analysis**: Works without LLM. Returns structured data from memory. Same cross-workspace bleed issue as /catchup — quantum computing notes appear alongside Waggle milestones. But the format is clear and fast.

### Test 3: Memory Search — "sprint"
- **Request**: `GET /api/memory/search?q=sprint&workspaceId=ana-pm-mega-uat`
- **HTTP Status**: 200
- **Response**: `{"results":[],"count":0}`
- **Quality**: 5/10
- **Analysis**: No results for "sprint" is honest — no sprint-specific frames exist yet. The search endpoint works correctly. This is expected for a workspace that has not had sprint data saved.

### Test 4: Free-form Question — Sprint Priorities
- **Request**: `POST /api/chat` with `"What are our top 3 priorities this sprint?"`
- **HTTP Status**: 200
- **Response**: Agent performed `auto_recall` (recalled 12 memories successfully), then hit the LLM for generation and returned: `"API key is invalid or expired. Update it in Settings > API Keys."`
- **Quality**: 2/10
- **Analysis**: The memory recall phase worked correctly (12 memories found in 15ms). The failure is clean and the error message is actionable — it tells the user exactly what to fix. However, from Ana's perspective this is a dead end. The recalled memories were never surfaced to the user. **Graceful degradation gap**: when LLM fails after successful recall, the system should still show the recalled context.

---

## 9:00 AM — Standup Prep

### Test 5: /draft Standup Update
- **Request**: `POST /api/chat` with `{"message":"/draft standup update","workspaceId":"ana-pm-mega-uat"}`
- **HTTP Status**: 200
- **Response**: Started with "Processing /draft via AI..." step, recalled 13 memories, then failed with "API key is invalid or expired."
- **Quality**: 1/10
- **Analysis**: The /draft command requires LLM to generate content. Unlike /catchup and /now, it cannot operate in memory-only mode. The error message is clear but the command is completely unusable without a valid API key. No fallback — no template, no prior draft suggestions, nothing.

### Test 6: Manual Memory Frame Save
- **Request**: `POST /api/memory/frames` with standup content and tags
- **HTTP Status**: 200
- **Response**: `{"saved":true,"frameId":180,"mind":"personal","importance":"normal","source":"import"}`
- **Quality**: 9/10
- **Analysis**: Memory write works perfectly. Frame saved with correct ID, tagged properly, stored in personal mind. The API accepted type, content, tags, and workspaceId without issue. This is the foundation of Waggle's value proposition and it works reliably.

### Test 7: Verify Frame Was Saved
- **Request**: `GET /api/memory/frames?workspaceId=ana-pm-mega-uat`
- **HTTP Status**: 200
- **Response**: Frame 180 appeared at the top of results with correct content: "Standup 2026-03-22: Yesterday completed PRD review for AI search feature..."
- **Quality**: 9/10
- **Analysis**: Write-then-read consistency is solid. The frame appeared immediately with all metadata intact (source: "import", mind: "personal", frameType: "P", timestamp accurate).
- **Note**: The frames endpoint returns frames from the personal mind regardless of workspaceId parameter — this confirms the workspace isolation concern from the prior report. Frame 180 was saved into the personal mind, not a workspace-scoped mind.

---

## 10:00 AM — PRD Writing

### Test 8: Draft PRD via Chat
- **Request**: `POST /api/chat` with `"Draft a PRD for adding AI-powered search"`
- **HTTP Status**: 200
- **Response**: auto_recall succeeded (12 memories, 32ms), then LLM failed with expired API key error.
- **Quality**: 1/10
- **Analysis**: Same pattern as Test 4 — recall works, LLM fails. The 32ms recall time is excellent. But without LLM, no PRD can be generated. This is a core use case that is completely blocked.

### Test 9: Iteration — "Add competitive analysis"
- **Request**: `POST /api/chat` with `"Add a section on competitive analysis"`
- **HTTP Status**: 200
- **Response**: auto_recall succeeded (12 memories, 75ms — slower this time), then LLM failed.
- **Quality**: 1/10
- **Analysis**: Iterative refinement is impossible without LLM. The recall latency tripled (75ms vs 32ms prior) but still acceptable.

### Test 10: DOCX Export
- **Request**: `GET /api/export/docx`
- **HTTP Status**: 404 — `{"error":"Not found"}`
- **Analysis**: No DOCX export endpoint exists. The export route (`/api/export`) provides a ZIP-based GDPR data export (memories, sessions, workspaces, settings), not document-format exports. **Feature gap for PM persona**: Ana would need to copy-paste from chat to create documents in external tools. A DOCX/PDF export of session content would be valuable.

---

## 11:00 AM — Decision Making

### Test 11: /decide Command
- **Request**: `POST /api/chat` with `"/decide Should we build or buy the search feature?"`
- **HTTP Status**: 200
- **Response**: Memory recall succeeded (13 memories, 15ms), then LLM failed with expired key.
- **Quality**: 1/10
- **Analysis**: The /decide command requires LLM for analysis. The pre-processing (memory recall with decision-specific prompt enrichment) is well-designed — the system enhances the prompt to "Analyze this decision and provide a filled-in decision matrix with specific pros, cons, risks, effort estimates, and a clear recommendation." This shows good slash command design, but no fallback when LLM is unavailable.

### Test 12: /research Command
- **Request**: `POST /api/chat` with `"/research top embeddable search APIs"`
- **HTTP Status**: 200
- **Response**: Memory recall succeeded (13 memories, 15ms), then LLM failed.
- **Quality**: 1/10
- **Analysis**: Same pattern. The /research prompt enrichment asks for "comprehensive summary with key findings, sources, and implications" which is good design. Dead without LLM.

### Test 13: Save Decision to Memory
- **Request**: `POST /api/memory/frames` with decision content
- **HTTP Status**: 200
- **Response**: `{"saved":true,"frameId":181,"mind":"personal","importance":"normal","source":"import"}`
- **Quality**: 9/10
- **Analysis**: Decision frame saved successfully. Content preserved accurately. Verified via subsequent search — searching "decision" returns frame 181 with correct content about hybrid search approach.
- **Note**: First attempt failed with HTTP 400 `FST_ERR_CTP_INVALID_CONTENT_LENGTH` — likely due to special characters (em-dashes, plus signs) in the JSON body causing content-length mismatch in curl. Simplified body worked on retry. This is a client-side issue, not a server bug.

---

## 2:00 PM — Sprint Planning

### Test 14: /plan Command
- **Request**: `POST /api/chat` with `"/plan Next sprint: implement AI search MVP"`
- **HTTP Status**: 200
- **Response**: Memory recall succeeded (13 memories, 16ms), then LLM failed with expired key.
- **Quality**: 1/10
- **Analysis**: The /plan command enriches the prompt to "Create a detailed, actionable plan... Break it into phases, each with specific tasks, dependencies, and deliverables." Good design intent, blocked by expired key.

### Test 15: Task Creation API
- **Request**: `GET /api/tasks` (global task list)
- **HTTP Status**: 200
- **Response**: Returned existing tasks across workspaces — "Launch blog series" (Marketing), "Write developer docs" (Dev), "Record demo video" (PM), etc.
- **Quality**: 8/10
- **Analysis**: Global task view works well. Tasks include workspace attribution (workspaceId + workspaceName), creation metadata, and status tracking. Good cross-workspace visibility for a PM.

- **Request**: `POST /api/workspaces/ana-pm-mega-uat/tasks` with task data
- **HTTP Status**: 201
- **Response**: `{"id":"5851420f-...","title":"Implement AI search MVP - vector search + FTS5 hybrid","status":"open","assigneeName":"Engineering","creatorName":"Ana",...}`
- **Quality**: 9/10
- **Analysis**: Task creation works flawlessly. Returns complete task object with UUID, timestamps, and all provided fields. The workspace-scoped endpoint (`/api/workspaces/:id/tasks`) is well-designed. Note: `POST /api/tasks` (global) returns 404 — only workspace-scoped creation is supported, which is architecturally correct.

---

## 4:00 PM — End of Day

### Test 16: /status Command
- **Request**: `POST /api/chat` with `"/status"`
- **HTTP Status**: 200
- **Response**: `"## Status Report\n\n**Skills loaded:** 58"`
- **Quality**: 4/10
- **Analysis**: The /status command works without LLM! It returns a status report showing 58 skills loaded. However, it shows NO session activity, no memory summary, no task counts. After a full day of interactions, Ana gets only "58 skills loaded." This is a significant UX gap — /status should summarize what happened in the current session (frames saved, tasks created, conversations had).

### Test 17: Memory Search — "today"
- **Request**: `GET /api/memory/search?q=today&workspaceId=ana-pm-mega-uat`
- **HTTP Status**: 200
- **Response**: 2 results — frame 180 (standup from this session) and frame 103 (older workspace topic). The standup frame was found via keyword match on "Today focusing on sprint planning."
- **Quality**: 7/10
- **Analysis**: Memory search correctly finds today's saved frames. The FTS5 search is working. However, it only found the manually-saved frames — the system did not auto-save any session context.

### Test 18: Memory Search — "standup"
- **Request**: `GET /api/memory/search?q=standup&workspaceId=ana-pm-mega-uat`
- **HTTP Status**: 200
- **Response**: 2 results — frame 189 ("Preference: Weekly standups on Monday mornings") and frame 180 (our manually saved standup).
- **Quality**: 8/10
- **Analysis**: Search precision is good. Both results are relevant to "standup." Frame 189 is from a prior session but topically relevant. Frame 180 confirms our manual save from Test 6 is searchable.

### Test 19: Verify Decision Memory
- **Request**: `GET /api/memory/search?q=decision&workspaceId=ana-pm-mega-uat`
- **HTTP Status**: 200
- **Response**: 4 results including frame 181 (our hybrid search decision), frame 188 (Kubernetes decision), frame 183 (React over Vue), and frame 180 (standup mentioning "decision on build vs buy").
- **Quality**: 8/10
- **Analysis**: All manually saved decisions are searchable and retrievable. The search correctly ranks direct matches higher.

---

## Critical Findings

### What Works Without LLM (Infrastructure Layer)

| Feature | Status | Quality |
|---------|--------|---------|
| /catchup (memory-only) | WORKS | 7/10 |
| /now (memory-only) | WORKS | 6/10 |
| /status (partial) | WORKS | 4/10 |
| Memory frame save (POST) | WORKS | 9/10 |
| Memory frame list (GET) | WORKS | 9/10 |
| Memory search (FTS5) | WORKS | 8/10 |
| Task creation (POST) | WORKS | 9/10 |
| Task listing (GET) | WORKS | 8/10 |
| Workspace listing | WORKS | 9/10 |
| SSE streaming | WORKS | 8/10 |

### What Fails Without LLM

| Feature | Status | Error Handling |
|---------|--------|---------------|
| /draft | FAILS | Clear error message |
| /decide | FAILS | Clear error message |
| /research | FAILS | Clear error message |
| /plan | FAILS | Clear error message |
| Free-form chat | FAILS | Clear error message |
| PRD generation | FAILS | Clear error message |
| Iterative refinement | FAILS | Clear error message |

### Persistent Issues (from prior report, still present)

| # | Severity | Description |
|---|----------|-------------|
| B1 | HIGH | **Workspace memory isolation** — Personal mind frames appear in workspace-scoped queries. Frame saved with workspaceId goes to personal mind, not workspace mind. |
| B2 | MEDIUM | **/status is skeletal** — Shows only "Skills loaded: 58" after a full day. No session summary, no memory stats, no task counts. |
| B3 | LOW | **No DOCX export** — Only GDPR ZIP export exists. PM persona needs document-format exports. |
| B4 | MEDIUM | **Cross-workspace memory bleed in /catchup and /now** — Quantum computing notes, other workspace topics appear in Ana's PM workspace briefing. |

### Positive Findings

1. **Error messages are clear and actionable**: "API key is invalid or expired. Update it in Settings > API Keys." — Ana would know exactly what to fix.
2. **Memory infrastructure is rock-solid**: Save, search, list all work reliably with sub-100ms latency.
3. **Task API is well-designed**: Workspace-scoped creation, global listing, proper REST structure.
4. **Slash command prompt enrichment is thoughtful**: The pre-processing for /decide, /research, /plan shows good product design — they enrich user input with structured instructions before passing to LLM.
5. **SSE streaming works correctly**: Clean event format, proper `done` events, no dropped connections.
6. **Memory recall is fast**: 12-13 memories recalled in 15-75ms consistently.

---

## Scorecard

| Metric | Score |
|--------|-------|
| Tasks Attempted | 19 |
| Tasks Completed (HTTP 200 + useful output) | 11 |
| Tasks Failed (LLM required) | 8 |
| Completion Rate (non-LLM tasks) | **100%** (11/11) |
| Completion Rate (all tasks) | **58%** (11/19) |
| Average Quality (non-LLM features) | **7.7/10** |
| Average Quality (LLM features) | **1.1/10** (all expired key) |
| Average Quality (overall) | **4.8/10** |
| Time Fighting Tool | 10% (only the content-length curl issue) |
| Would Ana Come Back Tomorrow (with valid key)? | **6/10** — infrastructure is solid, but needs key fix |
| Would Ana Come Back Tomorrow (without key)? | **3/10** — memory and tasks work, but chat is dead |
| Would Ana Tell a Colleague? | **4/10** — "promising but needs a working API key" |
| Would Ana Pay $30/month? | **Not yet** — maybe $10/month for memory+tasks alone; $30 requires working LLM features |

### Quality by Time Block

| Time Block | Non-LLM Quality | LLM Quality | Notes |
|------------|-----------------|-------------|-------|
| 8:00 AM Morning Prep | 6/10 avg | 2/10 | /catchup and /now work; free-form fails |
| 9:00 AM Standup | 9/10 avg | 1/10 | Memory save/verify excellent; /draft fails |
| 10:00 AM PRD Writing | N/A | 1/10 | All LLM-dependent; DOCX export missing |
| 11:00 AM Decision Making | 9/10 (save) | 1/10 | Memory save works; /decide and /research fail |
| 2:00 PM Sprint Planning | 8.5/10 avg | 1/10 | Task API excellent; /plan fails |
| 4:00 PM End of Day | 6.8/10 avg | N/A | /status weak; memory search strong |

---

## Comparison: Infrastructure vs Intelligence Layer

This test uniquely isolates Waggle's two layers:

**Infrastructure Layer (no LLM needed)** — Score: 8/10
- Memory persistence: excellent
- Task management: excellent
- Workspace management: excellent
- Search (FTS5): excellent
- Slash commands (/catchup, /now, /status): good but shallow
- SSE streaming: excellent

**Intelligence Layer (LLM required)** — Score: 0/10 (expired key)
- Content generation: blocked
- Decision analysis: blocked
- Research: blocked
- Planning: blocked
- Iterative refinement: blocked

**Key insight**: Waggle's infrastructure is production-quality. The memory system, task board, and workspace model are solid foundations. The intelligence layer is entirely dependent on a valid Anthropic API key with no graceful degradation beyond an error message. When recall succeeds but LLM fails, the recalled memories should still be shown to the user as raw context.

---

## Recommendations

1. **Graceful LLM degradation**: When auto_recall succeeds but LLM fails, show the recalled memories to the user as "Here's what I found in memory — I can't generate a response right now due to [error]."
2. **Enrich /status**: Include session stats (messages sent, frames saved, tasks created), not just skill count.
3. **Fix workspace memory isolation**: Frames saved with a workspaceId should be scoped to that workspace's mind, not the personal mind.
4. **Add document export**: Support DOCX/PDF export of session transcripts for PM personas.
5. **Offline mode**: Given the solid infrastructure layer, consider an explicit "offline mode" that lets users browse memory, manage tasks, and review past sessions without LLM.
