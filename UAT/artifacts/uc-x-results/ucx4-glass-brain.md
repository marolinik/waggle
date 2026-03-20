# UCX-4: Glass Brain Test Report

**Persona**: Mirela -- Chief of Staff, fast-growing startup, 36. 8-12 meetings/day, 20+ decisions/week.
**Core Question**: Does Waggle scale with the user -- or does value degrade under load?
**Date**: 2026-03-20
**Server**: http://localhost:3333
**Workspace used**: `marketing` (real workspace with pre-existing 53 frames)

---

## PHASE 1 -- Architecture Advice

**Query**: "I'm putting everything from my work life into Waggle for a week. Help me design the memory architecture: 3 strategic initiatives, daily operations, 200+ stakeholder relationships, my own thinking. One workspace or multiple? How do I retrieve anything in 6 months?"

**Response Summary**:
The agent provided a structured, 4-layer architecture recommendation:
1. **Strategic Containers** (initiative-level frames with status/stakeholder links)
2. **Stakeholder Graph** (structured entries with relationship type, context, recent interactions)
3. **Daily Operations Feed** (daily entries auto-linking to strategic context)
4. **Thinking Capture** (decisions, analysis, learnings, questions)

Also provided: 6-month retrieval strategy using semantic search patterns and consistent prefixes (DECISION:, STAKEHOLDER:, INITIATIVE:, MEETING:, INSIGHT:), a weekly memory discipline schedule, and a 4-week implementation plan.

**Quality Assessment**:
- Recommended **one unified workspace** (correct -- silos hurt cross-connection discovery)
- Provided concrete memory templates with field structures
- Addressed the 6-month retrieval concern with prefix-based patterns and semantic search examples
- Practical advice: "consistency over perfection"
- Missing: No mention of knowledge graph (which exists), no guidance on importance levels, no mention of weaver consolidation

**Architecture Advice Score: 4/5**
Excellent practical advice. Lost one point for not mentioning the knowledge graph entity extraction or the weaver consolidation system, both of which are directly relevant to long-term retrieval at scale.

---

## PHASE 2 -- Mass Ingestion

**Method**: Used `POST /api/chat` with the agent's `save_memory` tool (no direct `POST /api/memory/save` endpoint exists).

**Critical Finding -- No Direct Memory Write API**:
There is no REST endpoint to save memory frames directly. The only paths are:
1. Via the agent chat loop (`save_memory` tool) -- requires LLM round-trip per batch
2. Via `POST /api/import/commit` -- only for ChatGPT/Claude export format
3. Via `POST /api/ingest` -- file ingestion, not raw frame creation

This is a **significant gap** for power users who want to bulk-load structured data. Mirela would need to ask the agent to save each batch, waiting for LLM responses.

**Injection Results** (into `marketing` workspace):

| Category | Target | Injected | Verified |
|----------|--------|----------|----------|
| Decisions | 15 | 15 | 15 confirmed via search |
| Stakeholder Intel | 15 | 15 | 15 confirmed via keyword search |
| Meeting Notes | 10 | 10 | 10 confirmed via frames API |
| Open Questions | 10 | 10 | 10 confirmed via keyword search |
| **Total** | **50** | **50** | **50 confirmed** |

**Workspace mind after injection**: 103 workspace frames (50 new + 53 pre-existing) + 67 personal mind frames.

**"Default" Workspace Bug**:
When chat uses `workspace="default"` (pseudo-workspace), frames are saved to `~/.waggle/workspaces/default/workspace.mind` but the workspace manager does not recognize "default" as a real workspace. Result: frames saved this way are **unretrievable** via the memory search API. The `/api/memory/frames` endpoint shows 0 workspace frames for `workspace=default`. This is a data loss bug for any user who chats without selecting a specific workspace.

---

## PHASE 3 -- Retrieval Stress Test

**Method**: Direct API search via `GET /api/memory/search` + agent-mediated retrieval via `POST /api/chat`.

### Results Table

| # | Query | API Results | API Time | Agent-Mediated | Score |
|---|-------|------------|----------|----------------|-------|
| Q1 | "What did we decide about the Series B timeline?" | 1 result (board meeting, correct) | 300ms | N/A | **Partial** -- found meeting note but missed the DECISION frame about delaying to Q4 |
| Q2 | "What do I know about Viktor?" | 2 results (stakeholder + ministry call) | 329ms | N/A | **Pass** -- both the profile and meeting interaction surfaced |
| Q3 | "All hiring decisions this month" | 0 results (multi-term query failed) | 297ms | N/A | **Fail** -- multi-keyword queries return nothing; single-keyword "Andrej" and "Jelena" each found correct frames |
| Q4 | "Investor concerns" | 1 result (Ana Kovac burn rate) | 331ms | N/A | **Partial** -- found Ana's concern but missed broader investor-related context |
| Q5 | "Open questions -- things I need to think about" | 0 results (multi-term failed) | 326ms | Via keyword "QUESTION": 10/10 | **Partial** -- natural language failed; keyword prefix retrieval worked perfectly |
| Q6 | "Decision log for March 2026" | 20 results (all 15 decisions + related) | 302ms | N/A | **Pass** -- all 15 DECISION frames surfaced via keyword search |
| Q7 | "Team mood based on what I've captured" | 0 results (API) | 372ms | Agent synthesized from 4 search passes: morale high (engineering), retention risk (Aleksandar), cost pressures (travel freeze), investment signals (15% eng budget) | **Pass** -- agent-mediated retrieval was excellent; raw API search failed |
| Q8 | "5 most important external relationships" | 0 results (multi-term) | 324ms | Agent identified 5 external stakeholders with strategic reasoning | **Pass** -- agent needed multiple search passes but produced strong synthesis |

### Retrieval Analysis

**API-direct search performance**: 297-372ms range, consistently fast.

**Critical retrieval weakness**: FTS5 search works well for single keywords and exact prefix matches (e.g., "DECISION", "STAKEHOLDER", "Viktor") but **fails on natural language multi-term queries** like "hiring decisions this month" or "open questions things I need to think about". The hybrid search (FTS5 + vector) does not surface results for conversational queries.

**Agent-mediated search strength**: The agent compensates by running multiple targeted searches. For Q7 (team mood), it ran 4 separate search passes with different term combinations, then synthesized across results. This is the correct pattern but depends entirely on agent intelligence.

**Scaling concern**: At 103 workspace frames, search is fast (sub-400ms). But the search quality degrades on natural language queries, meaning a user with 500+ frames would need to rely heavily on keyword prefixes or agent-mediated multi-pass search.

---

## PHASE 4 -- Adversarial Tests

### GB-1: Contradiction Handling

**Setup**: Two contradicting frames in memory:
- Frame A: "DECISION: No CMO hire until after Series B fundraise completes"
- Frame B: "DECISION: Post CMO role immediately, 60-day close target. Board approved emergency hire."

**Query**: "What did we decide about hiring a CMO?"

**Agent Response**: Presented **only Frame B** (the more recent one) as "the decision" without acknowledging the contradiction. Said: "Board approved this as an emergency hire" with no mention of the prior decision to delay.

**Assessment**: The agent retrieved both frames (visible in search results) but presented only the most recent as authoritative. No contradiction flag, no timeline reconciliation, no "your memory shows conflicting decisions."

**GB-1 Score: 2/5**
Critical failure. A Chief of Staff needs to know when decisions conflict. The agent should have flagged: "I see two contradicting decisions about the CMO hire -- one says to delay until after Series B, another says to hire immediately. Which is current?"

### GB-2: Fuzzy Recall

**Query**: "What was that thing I said about the board?" (deliberately vague)

**Agent Response**: Found and returned the advisory board decision: "You decided to establish a formal advisory board with 4 external advisors."

**Assessment**: Reasonable interpretation of a vague query. Found a relevant board-related memory. Could have been better by surfacing multiple board-related items (board meeting, advisory board, board observer Miroslav) since the query was intentionally ambiguous.

**GB-2 Score: 3/5**
Found something relevant but picked one item rather than presenting the ambiguity. A power user with 200+ frames would want: "I found several board-related items -- which one were you thinking of?"

### GB-3: Knowledge Graph at Scale

**Endpoint**: `GET /api/memory/graph?workspace=marketing`
**Response time**: 332ms
**Results**: 55 entities, 105 relations

**Entity quality**: Mixed. Good entity extraction for people (Aleksandar Ristic, Ana Kovac, Viktor Horvat, Jelena Kovac). But also noise: "Current Priorities" extracted as a person entity, "Basic Tauri" as a person, "Clerk Integration" as a person.

**Relation quality**: All 105 relations are `co_occurs_with` -- no semantic relationship types (e.g., "works_at", "reports_to", "investor_in"). The knowledge graph is shallow.

**GB-3 Score: 3/5**
The graph renders and returns entities in reasonable time. Entity extraction catches most people names. But entity typing is unreliable (non-persons classified as "person"), and relationships lack semantic meaning -- every relationship is `co_occurs_with`, providing no structural intelligence.

### GB-4: Export/Backup

**Export** (`POST /api/export`): Returns 200 OK, ZIP file of 84,671 bytes. Contains memories, sessions, workspaces, settings (masked API keys), vault metadata. GDPR-compliant structure.

**Backup** (`POST /api/backup`): Returns 200 OK, encrypted .waggle-backup file of 4,445,399 bytes (4.2 MB). AES-256-GCM encrypted with vault key.

**GB-4 Score: Pass**
Both export and backup endpoints work. Export produces a structured ZIP with proper data separation. Backup produces an encrypted archive suitable for machine migration. No issues detected.

### GB-5: Weaver Consolidation

**Architecture review** (from `packages/weaver/src/consolidation.ts`):
The `MemoryWeaver` class provides:
- `consolidateGop()` -- merge I-frame + P-frames into consolidated content
- `decayFrames()` -- delete deprecated frames with zero access
- `strengthenFrames()` -- upgrade importance based on access count (temp->normal at 10 accesses, normal->important at 25)
- `createDailySummary()` -- merge multiple GOPs into a summary frame
- `decayByAge()` -- deprecate old temporary frames with low access
- `linkRelatedFrames()` -- create B-frame links between frames sharing knowledge graph entities
- `distillSessionContent()` -- extract durable frames from session content
- `consolidateProject()` -- consolidate across closed sessions for a project

**Cron trigger**: Memory consolidation runs daily at 03:00 (`0 3 * * *`). Manual trigger via `POST /api/cron/1/trigger` returns `{"triggered":true}` -- but this only marks the schedule as run; the actual consolidation job execution depends on the daemon runner.

**No direct consolidation API**: There is no `POST /api/memory/consolidate` endpoint. The weaver can only be triggered via cron schedule, not on demand.

**GB-5 Score: 3/5**
The weaver architecture is well-designed with GOP consolidation, importance strengthening based on access patterns, and decay for unused frames. However: (1) no on-demand consolidation trigger via API, (2) the cron trigger only marks the schedule, actual execution depends on daemon state, (3) no UI visibility into consolidation status or history.

---

## Scaling Ceiling Assessment

### Current State (103 workspace frames + 67 personal = 170 total)
- **Search speed**: 297-372ms, fast and usable
- **Search quality**: Excellent for keyword/prefix, poor for natural language multi-term
- **Agent synthesis**: Strong when agent runs multiple targeted passes
- **Knowledge graph**: 55 entities, 105 relations -- functional but shallow

### Projected Scaling Concerns

**At 500 frames** (2 weeks of Mirela's usage):
- FTS5 search will remain fast (SQLite handles this scale easily)
- Keyword retrieval remains reliable if prefix convention is maintained
- Natural language search quality unlikely to improve (FTS5 limitation)
- Knowledge graph entity noise will increase proportionally
- Agent auto-recall (top 10) will miss relevant frames more often

**At 2,000+ frames** (2 months):
- Search precision becomes critical -- too many results for broad queries
- No date-range filtering in search API (cannot scope to "last week" or "March")
- No category/tag filtering beyond keyword prefix matching
- Weaver consolidation becomes essential but is not controllable
- B-frame linking may become noisy with many co-occurring entities

**At 10,000+ frames** (6 months -- Mirela's scenario):
- The prefix convention (DECISION:, STAKEHOLDER:) is the only reliable retrieval mechanism
- Vector search (sqlite-vec) should improve natural language retrieval but appears underperforming relative to FTS5
- Daily summaries from weaver should compress older content but are not visible to the user
- Export/backup sizes will grow (currently 4.2 MB at 170 frames)

### Missing at Scale
1. **Date-range scoping**: Cannot search "decisions from last week"
2. **Category/tag filtering**: No structured metadata beyond importance level
3. **Contradiction detection**: Critical for a CoS managing 20+ decisions/week
4. **Bulk import API**: No way to mass-load structured data without LLM round-trips
5. **Consolidation visibility**: No way to see what the weaver has merged or decayed
6. **Search analytics**: No way to see what is being found vs. missed

---

## Feature Gaps

| # | Gap | Severity | Impact on Mirela's Use Case |
|---|-----|----------|---------------------------|
| 1 | No direct memory write API | High | Cannot bulk-load data without LLM round-trips; every batch requires chat interaction |
| 2 | Multi-term natural language search fails | High | Queries like "hiring decisions this month" return 0 results; user must know keyword conventions |
| 3 | No contradiction detection | High | Conflicting decisions are silently presented as singular truth; dangerous for a CoS |
| 4 | "Default" workspace frames are unretrievable | Critical | Frames saved without workspace selection are lost to the search API |
| 5 | No date-range filtering in search | Medium | Cannot scope retrieval temporally; critical at scale |
| 6 | Knowledge graph entity typing is noisy | Medium | Non-person entities classified as "person"; reduces graph utility |
| 7 | All KG relations are co_occurs_with | Medium | No semantic relationships; graph provides co-occurrence, not structure |
| 8 | No on-demand consolidation trigger | Low | Weaver only runs on cron schedule; no way to trigger cleanup manually |
| 9 | No category/tag metadata on frames | Medium | Retrieval relies entirely on content-based search; no structured filtering |
| 10 | Agent auto-recall limited to 10 results | Low-Medium | At scale, top-10 may miss critical context |

---

## Scoring Summary

| Test | Score | Notes |
|------|-------|-------|
| Architecture Advice | 4/5 | Excellent practical guidance; missed KG and weaver features |
| Retrieval Q1 (Series B) | Partial | Found meeting note, missed decision frame |
| Retrieval Q2 (Viktor) | Pass | Both profile and interaction surfaced |
| Retrieval Q3 (Hiring decisions) | Fail | Multi-keyword search returned 0; single keywords work |
| Retrieval Q4 (Investor concerns) | Partial | Found one concern, missed broader context |
| Retrieval Q5 (Open questions) | Partial | Natural language failed; keyword prefix worked |
| Retrieval Q6 (Decision log) | Pass | All 15 decisions surfaced via keyword search |
| Retrieval Q7 (Team mood) | Pass | Agent-mediated multi-pass synthesis was excellent |
| Retrieval Q8 (External relationships) | Pass | Agent identified 5 stakeholders with strategic reasoning |
| GB-1 (Contradiction) | 2/5 | Failed to flag conflicting CMO decisions |
| GB-2 (Fuzzy recall) | 3/5 | Found relevant item but didn't surface ambiguity |
| GB-3 (Knowledge graph) | 3/5 | 55 entities, 105 relations; noisy typing, shallow relations |
| GB-4 (Export/backup) | Pass | Both endpoints functional, proper encryption |
| GB-5 (Weaver) | 3/5 | Well-architected but no on-demand trigger or visibility |

---

## One-Sentence Verdict

Waggle handles Mirela's first week admirably -- the agent's multi-pass search compensates for FTS5's natural language weakness -- but the lack of contradiction detection, date-scoped filtering, and a direct memory write API will cause value degradation as her memory grows past 500 frames, and the silent loss of "default" workspace frames is a data integrity bug that needs immediate attention.

---

Report COMPLETE
