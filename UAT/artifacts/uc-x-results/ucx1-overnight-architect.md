# UCX-1: Overnight Architect -- Test Report

**Persona**: Nikola -- Senior Strategy Consultant, 34. Four concurrent client engagements.
**Core Question**: Is Waggle actually working while the user sleeps?
**Test Date**: 2026-03-20
**Server**: http://localhost:3333 (status: healthy, LLM: anthropic-proxy, DB: healthy)
**Tester**: UCX-1 automated test agent

---

## Setup Summary

### Workspaces Created
| Workspace | ID | Status |
|---|---|---|
| Telco CEE M&A Advisory | `telco-cee-m-a-advisory` | Created |
| Ministry of Finance AI Strategy | `ministry-of-finance-ai-strategy` | Created |
| RetailCo Digital Transformation | `retailco-digital-transformation` | Created |
| Personal Quarterly Review | `personal-quarterly-review` | Created |

### Memory Seeding
Memories were injected via the chat endpoint (POST /api/chat with save_memory tool invocations).
**Critical finding**: There is NO direct REST endpoint for writing memory frames (POST /api/memory/save returns 404). Memories can only be created through the agent's `save_memory` tool during chat conversations. This is a significant gap for programmatic memory injection, testing, and any "overnight processing" pipeline that needs to write results back as durable memories.

- **Telco workspace**: 5 memory frames saved (acquisition targets, valuation, regulatory risk, deadline, strategy)
- **Ministry workspace**: Memory saved (EU AI Act framework, deliverable deadline, phased rollout recommendation) -- agent consolidated into fewer frames
- **RetailCo workspace**: Memory saved (stakeholder gap, cloud migration, capacity risk, change management)
- **Personal workspace**: Memory saved (delegation reflection, quarterly review deadline) -- agent consolidated

### Cron Infrastructure Verified
9 pre-seeded cron schedules found, all with valid next_run_at times. Watchdog (LocalScheduler) confirmed running.

---

## Checkpoint Scores

| # | Checkpoint | What Was Tested | Score | Notes |
|---|---|---|---|---|
| 1 | Jobs Infrastructure | Cron CRUD API completeness + execution daemon | **4/5** | Full CRUD + trigger works. Daemon runs. But trigger only marks-as-run; does not truly execute the job handler for all types. |
| 1b | Notification UX | Where cron output surfaces | **3/5** | SSE stream exists at /api/notifications/stream. Notifications emit for some job types. No in-app notification history/inbox endpoint. |
| 2 | 30-Second Orientation | Catch-up query referencing seeded memories | **4/5** | Agent recalled all 5 Telco-specific memories in ~7 seconds. Workspace context auto-loaded via WorkspaceNowBlock. However, a spurious memory from prior user activity ("CEO shut down company") polluted the response. |
| 2b | Continuity | Memory persistence across sessions | **4/5** | Memories persisted and were retrievable via search. Session .jsonl files created. WorkspaceNowBlock correctly builds structured state from memory frames. |
| 3 | Compounding Context (Cross-Workspace) | Morning planning across all 4 workspaces | **1/5** | FAILED. Agent only searched the workspace it was chatting in (personal mind). Did NOT reference Telco, Ministry, RetailCo, or Personal workspace memories. Cross-workspace morning briefing is not available through chat. The cron-based morning briefing handler reads all workspaces but only counts pending awareness items -- it does NOT synthesize a cross-workspace narrative. |
| 4 | Personal Reflection Quality | Retrieving saved personal reflections | **2/5** | Agent searched broadly but did NOT find the workspace-specific reflections we saved to "Personal Quarterly Review". Instead surfaced pre-existing personal mind data (dog Rex, favorite color). The workspace search did not correctly target the right mind for reflection content. |

---

## Checkpoint 1 -- Jobs Infrastructure (Detailed)

### Cron API Completeness: 4/5

**What works:**
- `POST /api/cron` -- Create schedule with name, cronExpr, jobType, jobConfig, workspaceId, enabled. Validates cron expressions via cron-parser. Validates job types against allowlist (agent_task, memory_consolidation, workspace_health, proactive, prompt_optimization, monthly_assessment).
- `GET /api/cron` -- Lists all schedules with count, ordered by name.
- `GET /api/cron/:id` -- Get single schedule.
- `PATCH /api/cron/:id` -- Update schedule fields, recomputes next_run_at on cronExpr change.
- `DELETE /api/cron/:id` -- Delete schedule.
- `POST /api/cron/:id/trigger` -- Manual trigger. Marks as run, emits notification, computes next run time.

**What's missing:**
- `POST /api/cron/:id/trigger` only calls `cronStore.markRun()` and emits a generic notification. It does NOT actually execute the job handler (memory_consolidation, proactive briefing, etc.). The trigger is cosmetic -- it updates timestamps but does not run the job logic. To actually execute a job, the `LocalScheduler.tick()` method must find the schedule as "due" (next_run_at <= now).
- No execution history/log endpoint (e.g., GET /api/cron/:id/runs).
- No way to see job execution results or errors through the API.

### Pre-Seeded Schedules (9 total):
| Schedule | Cron | Type | Enabled | Last Run |
|---|---|---|---|---|
| Memory consolidation | 0 3 * * * | memory_consolidation | Yes | 2026-03-19 |
| Workspace health check | 0 8 * * 1 | workspace_health | Yes | 2026-03-17 |
| Marketplace sync | 0 2 * * 0 | memory_consolidation | Yes | Never |
| Morning briefing | 0 8 * * * | proactive | Yes | Triggered (manual) |
| Stale workspace check | 0 9 * * 1 | proactive | Yes | Never |
| Task reminder | 30 8 * * * | proactive | Yes | Never |
| Capability suggestion | 0 10 * * 3 | proactive | Yes | Never |
| Prompt optimization | 0 2 * * * | prompt_optimization | No (opt-in) | Never |
| Monthly assessment | 0 6 1 * * | monthly_assessment | Yes | Never |

### Scheduler Daemon: Exists and Runs

The `LocalScheduler` (packages/server/src/local/cron.ts) is a proper tick-loop scheduler:
- Default interval: 60 seconds
- Concurrency guard: prevents overlapping ticks
- Failure tracking: auto-disables jobs after 5 consecutive failures
- `getDue()` query: `SELECT * FROM cron_schedules WHERE enabled = 1 AND next_run_at <= datetime('now')`
- Executor function injected at construction, handles all job types (memory_consolidation, workspace_health, proactive, prompt_optimization, monthly_assessment)

The executor (defined in packages/server/src/local/index.ts, lines 865-1141) is comprehensive:
- memory_consolidation: Runs personalWeaver, marketplace sync, or index reconciliation
- workspace_health: Logs stale frame counts per workspace
- proactive: Dispatches to morning_briefing, stale_workspace_check, task_reminder, capability_suggestion handlers
- prompt_optimization: Full GEPA pipeline -- reads optimization logs, generates prompt variants via LLM
- monthly_assessment: Generates structured self-assessment report, saves as I-frame

**Verdict**: The cron infrastructure is genuinely functional. Jobs are defined, the daemon runs, and the executor handles real work. This is not a stub.

### Notification UX: 3/5

**What works:**
- SSE endpoint at `/api/notifications/stream` -- connected successfully, heartbeat every 30 seconds.
- Notifications emitted for: cron completion, marketplace sync results, monthly assessment, prompt optimization signals, proactive briefing/stale/task/capability events.
- WebSocket relay at `/ws` also forwards notification events to the desktop app.
- Notification schema includes: type, title, body, category (cron|approval|task|message|agent), timestamp, actionUrl.

**What's missing:**
- No notification history endpoint (GET /api/notifications) -- notifications are fire-and-forget via eventBus. If the client is disconnected when a cron job runs (e.g., overnight), the notification is lost forever.
- No notification persistence (no SQLite table for notifications).
- No unread count or badge endpoint.
- No way to retrieve past cron execution results after the fact.

This is the critical gap for the "overnight architect" use case: if Waggle processes things while the user sleeps, there is no durable record of what happened. The user must be connected (SSE/WebSocket) at the exact moment a notification fires.

---

## Checkpoint 2 -- 30-Second Orientation (Detailed)

### Test: "What's the current state of the Telco CEE M&A project?"
- **Workspace**: telco-cee-m-a-advisory
- **Response time**: ~7 seconds (including auto_recall and token streaming)
- **Memory recall**: Agent used `auto_recall` and found 9 relevant memories
- **Specific memories referenced**: Orange/DT priorities, 6.2x EV/EBITDA valuation, regulatory uncertainty in Serbia, dual-track approach -- ALL correctly recalled

### How Context Loading Works

When a chat message targets a workspace, the system:
1. Activates the workspace mind via `activateWorkspaceMind(workspaceId)`
2. Builds a `WorkspaceNowBlock` containing: summary, recent decisions, active threads, progress items, next actions
3. Optionally builds a `WorkspaceState` (structured: active, openQuestions, pending, blocked, completed, stale, recentDecisions, nextActions)
4. Injects this as a system prompt section: "# Workspace Now -- [Name]"
5. The agent then has context BEFORE the user even asks a question

This is well-designed. The workspace context is pre-loaded into the system prompt, so the agent does not start from zero.

### Issue: Memory Pollution
The agent recalled a spurious memory: "CEO decided to shut down the company effective immediately." This was from a prior user session saved to the personal mind and surfaced via cross-mind search. It caused the agent to declare the Telco project "CANCELLED" -- a hallucination amplified by noisy memory. This demonstrates the risk of unrestricted cross-mind search: workspace memories should be prioritized over personal mind results when inside a workspace context.

### Score: 4/5 (Orientation), 4/5 (Continuity)

---

## Checkpoint 3 -- Compounding Context (Detailed)

### Test: "What should I work on first this morning? I have 4 active engagements."
- **Workspace**: None (sent without workspace parameter -- testing cross-workspace awareness)
- **Result**: Agent searched the personal mind only. Referenced pre-existing awareness items (Tauri 2.0 desktop app, B2B banking lead generation). Did NOT reference Telco, Ministry, RetailCo, or Personal workspace memories.

### Root Cause Analysis

The agent's memory search is scoped:
- Inside a workspace: searches workspace mind + personal mind
- Outside a workspace (no workspace param): searches personal mind only
- There is NO mechanism to search across ALL workspace minds simultaneously

The `generateMorningBriefing()` proactive handler (packages/server/src/local/proactive-handlers.ts) does iterate all workspaces, but:
1. It only counts `pending` awareness items per workspace (from the awareness table)
2. It does NOT synthesize a narrative cross-workspace briefing
3. It only fires as a cron job notification -- not as an interactive chat response
4. If there are no pending awareness items, it returns null (no notification)

### What the "Overnight Architect" Use Case Needs

Nikola opens Waggle at 8 AM. He needs:
1. A cross-workspace morning briefing that references ALL 4 engagements
2. Prioritized action items synthesized from memories across workspaces
3. Deadline awareness (Ministry deliverable Friday, Telco shortlist end of month)
4. The ability to ask "what's most urgent?" and get a holistic answer

**None of this works today.** The morning briefing cron produces at best a count of pending items. There is no cross-workspace memory search. There is no interactive morning briefing that synthesizes context from all workspaces.

### Score: 1/5

---

## Checkpoint 4 -- Personal Reflection Quality (Detailed)

### Test: "What personal reflections have I captured recently?"
- **Workspace**: personal-quarterly-review
- **Result**: Agent searched broadly but returned pre-existing personal mind data (dog Rex, favorite color, technical insights). The workspace-specific reflections (delegation, quarterly review) were not surfaced.

### Root Cause
The search_memory tool searched both the workspace mind and personal mind, but the results were dominated by older personal mind entries with higher access counts. The freshly saved reflections in the workspace mind may have lower relevance scores. Additionally, the agent's `auto_recall` first hits the personal mind, and the workspace results get mixed in without clear prioritization.

### Score: 2/5

---

## Feature Gaps for "Overnight Architect" Use Case

### Critical Gaps (Blocks the use case entirely)

1. **No cross-workspace memory search** -- Cannot ask "what's most urgent across all my projects?" The agent can only search within one workspace at a time. The morning briefing cron counts awareness items but does not synthesize a narrative.

2. **No notification persistence** -- Cron results are fire-and-forget SSE events. If the user is offline when the morning briefing fires at 8 AM, they never see it. There is no notification inbox, no history endpoint, no way to retrieve past notifications.

3. **No direct memory write API** -- POST /api/memory/save does not exist. Memories can only be created through agent chat conversations. This blocks any overnight processing pipeline that needs to persist results as memories.

4. **Morning briefing is count-only** -- The `generateMorningBriefing()` handler counts pending awareness items across workspaces but does not synthesize context, surface decisions, or produce a narrative "here's what happened while you slept" briefing.

### Significant Gaps (Degrades the experience)

5. **No cron execution history** -- Cannot see "what cron jobs ran last night and what was the result." Jobs execute and log to console, but there is no API endpoint for execution history.

6. **Cron trigger is cosmetic** -- POST /api/cron/:id/trigger updates timestamps but does not execute the actual job handler. This makes manual testing and "run now" functionality misleading.

7. **Memory pollution across minds** -- Cross-mind search can surface irrelevant personal memories when inside a workspace, causing hallucinated context (e.g., "company shutdown" affecting Telco workspace).

8. **No workspace switching in chat** -- Cannot say "check my Ministry workspace and then my Telco workspace" in a single conversation. Each chat message targets exactly one workspace.

### Nice-to-Have Gaps

9. **No scheduled agent tasks** -- Cron supports `agent_task` job type but there is no implementation that actually runs an agent loop autonomously (e.g., "every morning, check all workspaces and draft a summary").

10. **No deadline extraction** -- The proactive handlers do not parse dates from memory content (e.g., "due Friday EOD") to create deadline-aware reminders.

11. **Index reconciliation has never run** -- The weekly index reconciliation cron is defined but its `last_run_at` is null, suggesting it has never been triggered on this installation.

---

## Delight Moments

1. **WorkspaceNowBlock is genuinely smart** -- The structured state injection into the system prompt means the agent is contextually grounded before the user even types. This is the core of the "30-second orientation" promise and it works within a single workspace.

2. **Cron seeding is thoughtful** -- The server auto-seeds 9 cron schedules on first run covering memory consolidation, workspace health, morning briefing, stale checks, task reminders, capability suggestions, prompt optimization, monthly assessment, and index reconciliation. This is a real attempt at background intelligence.

3. **LocalScheduler is well-engineered** -- Concurrency guard, failure tracking with auto-disable after 5 failures, clean tick loop. Not a stub -- production-grade scheduler.

4. **Monthly self-assessment is real** -- The `monthly_assessment` cron generates a structured report (correction rate, improvement trend, strengths, weaknesses, capability gaps, recommendations) and saves it as a memory I-frame. This is genuine compounding self-awareness.

5. **Proactive handlers exist** -- Morning briefing, stale workspace detection, task reminders, and capability suggestions are implemented as real handlers. They just need richer synthesis.

6. **Agent tool transparency** -- During chat, every tool call is streamed as SSE events (tool name, input, result, duration). The user sees exactly what the agent is doing. This builds trust.

---

## Emotional Scores (Nikola's perspective)

| Feeling | Target | Actual | Score |
|---|---|---|---|
| Orientation | "I know where I am instantly" | Works within one workspace. Cross-workspace: lost. | 3/5 |
| Relief | "I don't have to reconstruct context" | Strong within workspace. No cross-workspace relief. | 3/5 |
| Momentum | "I can start working immediately" | Workspace-specific momentum good. Morning start: poor. | 2/5 |
| Trust | "The system remembers correctly" | Memory recall works but pollution is a risk. | 3/5 |
| Continuity | "I can return without losing thread" | Workspace sessions persist. Cross-workspace: broken. | 3/5 |
| Seriousness | "This is a real tool, not a toy" | Cron infrastructure, structured state, tool transparency say yes. Cross-workspace gap says not yet. | 3/5 |
| Personal alignment | "It knows how I work" | Personal mind exists but is noisy. Reflections not well-surfaced. | 2/5 |
| Controlled power | "I have an overnight architect" | The infrastructure exists (cron, handlers, scheduler). The synthesis does not. | 2/5 |

**Overall Emotional Score: 2.6/5**

---

## Infrastructure vs. Experience Gap

This test revealed a pattern: **Waggle's infrastructure for overnight intelligence is 70% built, but the user-facing experience is 20% there.**

| Layer | Completeness | Notes |
|---|---|---|
| Cron scheduling (CRUD + execution) | 90% | Missing: execution history API, true trigger execution |
| Proactive handlers | 60% | Exist but produce counts, not narratives |
| Notification delivery | 40% | SSE works real-time; no persistence, no inbox |
| Cross-workspace intelligence | 10% | Morning briefing counts items. No cross-workspace search, no synthesis. |
| Memory API for automation | 0% | No write endpoint. Chat-only memory creation. |

---

## One-Sentence Verdict

Waggle has a genuine cron scheduler, proactive handlers, and per-workspace context grounding, but the "overnight architect" use case is blocked by the absence of cross-workspace memory search, notification persistence, and narrative synthesis across engagements.

---

## Recommended Next Steps

1. **Cross-workspace search tool** -- Add a `search_all_workspaces` tool or parameter to `search_memory` that iterates all workspace minds and returns merged, ranked results. This is the single most impactful addition for multi-engagement users.

2. **Notification persistence** -- Add a `notifications` SQLite table. Store every emitted notification. Expose `GET /api/notifications?since=...` for the UI to show "what happened while you were away."

3. **Morning briefing synthesis** -- Upgrade `generateMorningBriefing()` to produce a narrative summary. Pull recent decisions, deadlines, and open threads from each workspace mind. Format as "Here's your morning brief across 4 workspaces: [Telco] target shortlist due end of month, [Ministry] exec summary due Friday..."

4. **Memory write API** -- Add `POST /api/memory/frames` that writes directly to a workspace or personal mind. Essential for testing, data import, and any future automation that needs to persist results.

5. **Cron execution log** -- Add a `cron_execution_log` table (schedule_id, executed_at, result_summary, error). Expose via `GET /api/cron/:id/runs`.

6. **Fix trigger endpoint** -- Make `POST /api/cron/:id/trigger` actually execute the job handler, not just update timestamps.

---

Report COMPLETE
