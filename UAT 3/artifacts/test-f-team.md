# TEST F: Team Collaboration Simulation
**Waggle UAT Round 3 — March 22, 2026**
**Tester: AI Agent (autonomous)**
**Server: http://localhost:3333**

---

## Executive Summary

Team collaboration in Waggle is architecturally planned but functionally dormant in the current local-server configuration. The infrastructure is more sophisticated than it initially appears — there are well-designed team tools, capability governance, real-time WebSocket protocols, and database schemas for multi-user teams — but **none of this surfaces in actual chat sessions**. A user operating a "team workspace" today gets exactly the same experience as a solo workspace.

**Overall Team Score: 3/10**

Most honest statement: Waggle has a credible team collaboration *blueprint* living entirely in code that no running instance yet activates.

---

## F1: Team Feature Discovery

### What Team APIs Exist

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/team/status` | 200 | Returns connected/disconnected state |
| `GET /api/team/presence` | 200 | Returns member presence (empty without team server) |
| `GET /api/team/activity` | 200 | Returns activity feed (empty without team server) |
| `GET /api/team/messages` | 200 | Returns team messages (empty without team server) |
| `GET /api/team/governance/permissions` | 200 | Returns capability policies (null without team server) |
| `POST /api/team/connect` | 200 | Connects to a team server URL |
| `GET /api/team/teams` | 401 (then error) | Proxies to team server |
| `/api/teams` | 404 | Not implemented at top level |
| `/api/collaboration` | 404 | Not implemented |
| `/api/org` | 404 | Not implemented |

**Critical finding:** All team endpoints that return data require connection to a **separate team server** (`/api/team/connect`). The local server is a client that proxies to an enterprise backend. Without that backend running, all team endpoints return empty arrays or null.

### Architecture Model: Client-Server Federation

The design is a **two-tier architecture**:

1. **Local server** (`packages/server/src/local/`) — single-user Fastify server, runs on `localhost:3333`. This is what users run locally. Has team connection proxy endpoints.
2. **Team server** (`packages/server/src/routes/`) — a separate enterprise Fastify+PostgreSQL+Clerk server that handles multi-user teams. Uses Drizzle ORM, Redis pub/sub, WebSocket via `connection-manager`, and Clerk authentication.

The enterprise team server has a complete schema: `teams`, `teamMembers`, `agents`, `agentGroups`, `tasks`, `messages`, and full capability governance tables.

### What's Implemented (Code-Complete But Unreachable in Test)

- **Waggle Dance Protocol**: WebSocket real-time messaging between agents via Redis pub/sub
- **Capability Governance**: Per-role tool permissions (`GET/PUT /api/teams/:slug/capability-policies`)
- **Capability Override Requests**: Members can request admin approval for blocked tools
- **Team Knowledge Graph**: `check_hive` and `share_to_team` tools for shared team knowledge
- **Presence System**: Real-time member online/away/offline status
- **Agent Team Tools** (defined in `packages/agent/src/team-tools.ts`):
  - `check_hive` — Search team knowledge before doing work
  - `share_to_team` — Push discoveries to team graph
  - `create_team_task` / `claim_team_task` — Team-scoped task management
  - `send_waggle_message` — Waggle Dance protocol messages
  - `request_team_capability` — Permission escalation flow

### What's Missing (Not Yet Wired)

- `createLocalTeamTools()` is defined and exported but **never injected into chat sessions** — confirmed by agent self-report: "0 team collaboration tools"
- No `GET /api/workspaces/:id/members` — workspace membership endpoints don't exist
- No `PATCH /api/workspaces/:id` — workspace update returns 404 (only `PUT`)
- `teamId` filtering on workspace list doesn't filter — it returns all 99 workspaces
- No cross-workspace memory scoping by teamId

---

## F2: Team Setup

### Can Teams Be Created

**Via API directly: No.** `POST /api/teams` returns 404.

**Via workspace metadata: Yes, partially.** Teams are simulated by creating workspaces with `teamId`, `teamRole`, and `teamUserId` fields during workspace creation (`POST /api/workspaces`).

```json
{
  "id": "r3-pm-workspace",
  "name": "R3 PM Workspace",
  "group": "R3-Team-Test",
  "teamId": "r3-team",
  "teamRole": "admin",
  "teamUserId": "pm-ana"
}
```

This works — the fields are stored and returned correctly. The `group` field also functions as a lightweight team grouping mechanism, and `GET /api/workspaces?group=X` filters correctly.

**Response quality:** Creation returns clean JSON with all fields. Error messages are minimal but adequate (e.g., missing `name` and `group` returns `{ "error": "name and group are required" }`).

**Workspace role system (stored, not enforced):**
- `owner` / `admin` / `member` / `viewer` / `shared` — all accepted and stored
- None of these roles currently enforce any access control in the local server
- Viewer and member get identical capabilities to admin

**Created for R3 tests:**
- `r3-pm-workspace` (teamId: r3-team, role: admin, user: pm-ana)
- `r3-dev-workspace` (teamId: r3-team, role: member, user: dev-marko)
- `r3-marketing-workspace` (teamId: r3-team, role: member, user: mktg-sara) — note: ID collision silently resolved to `r3-marketing-workspace` not `r3-mktg-workspace`
- `r3-q2-campaign-shared` (teamId: r3-team, role: shared)

---

## F3: Collaborative Workflow Simulation

### Test Scenario
Simulated a 3-person team (PM Ana, Dev Marko, Marketing Sara) coordinating a Q2 campaign launch.

### PM Workspace → Sends Project Brief

**Result: Functional as solo workspace.** The agent recalled memory, searched for context, and generated a full DOCX project brief. Tools used: `auto_recall`, `search_memory` (×2), `generate_docx`.

The brief contained correct project data but also drew on **global memory contamination** — it referenced Waggle milestone information (M4 Tauri desktop, M5 Web app) from the shared personal mind, not from the PM workspace itself.

### Dev Workspace → Adds Technical Context

**Result: Stored as personal memory, not workspace-isolated.** Agent used `save_memory`. The technical timeline was saved but to the personal/global mind, not a team-scoped store.

### Cross-Workspace Awareness Test (Critical)

**Question asked in PM workspace:** "What is the dev team's technical timeline and what risks have they identified?"

**Result: Agent could NOT use dev workspace memories directly.** It searched the global personal mind and found milestone references already existing from prior sessions — not the specific technical context added in this test session. The response was confusingly accurate (referenced correct milestone data) but for wrong reasons: it was pulling from pre-existing workspace-agnostic global memory.

**Key evidence:** The agent's `search_memory` used `scope: 'all'` — confirming it searches a global mind, not individual workspace minds. Every workspace in the system shares the same personal mind.

### Cross-Workspace Search via `search_all_workspaces`

**This tool works and is genuinely useful.** When PM asked "find what dev team workspace discussed about technical timelines," the agent used `search_all_workspaces` and returned relevant milestone/risk data.

However, this is not true team collaboration — it's a single user searching their own global memory that happens to have records from all their workspaces. In a real multi-user scenario where each person has their own mind database, this would return nothing.

### Isolation vs. Sharing: The Real Architecture

**Current state:** There is **one personal mind** and **one workspace mind** for the entire local server. Every workspace, regardless of `teamId`, draws from the same memory pool. "Workspace isolation" means nothing from a data-separation standpoint — any workspace can find memories from any other workspace.

This is actually correct for a solo user with multiple workspaces (the primary use case), but it means **team collaboration as a multi-user feature does not exist in the local server**. The feature only makes sense when each user runs their own local server and they connect to a shared enterprise team server.

---

## F4: Shared Workspace Test

**Test:** R3 Q2 Campaign Shared workspace asked to coordinate team priorities.

**Result: Partial.** The shared workspace functioned as a regular workspace that could search global memory. It correctly identified the Q2 campaign context from prior sessions and produced a reasonable coordination summary.

**Team-specific enhancements working:**
- `teamContext` field appeared in workspace context: `{ isTeam: true, teamId: 'r3-team', tasks: [] }`
- After creating tasks, context showed them: `tasks: [{ id: '...', title: 'Q2 Campaign kickoff meeting', status: 'open' }]`
- Suggested prompts included team-specific ones: "What has the team been working on?", "What team tasks are open?"

**Team-specific enhancements NOT working:**
- Shared workspace memory doesn't aggregate from r3-pm-workspace, r3-dev-workspace separately — it's all the same pool
- No cross-workspace task visibility: PM workspace tasks are invisible from shared workspace
- No team activity feed (empty, requires team server)
- No member presence indicators

**Shared workspace usefulness: 4/10** — Marginally better than a solo workspace due to task prompts, but functionally identical.

---

## F5: Team Events / Activity Stream

**All team activity endpoints return empty:**
- `/api/events` — 404
- `/api/workspaces/:id/events` — 404
- `/api/team/activity` — `{ items: [] }` (requires team server)
- `/api/team/messages` — `{ messages: [] }` (requires team server)
- `/api/team/presence` — `{ members: [] }` (requires team server)

**After connecting local server to itself as team server:**
- Presence returned: `[{ userId: 'unknown', displayName: 'Unknown User', status: 'online' }]`
- Activity still empty (local server doesn't have team entities endpoint in right format)
- Team tools still NOT injected into agent — team server connection does not trigger tool injection

**Notification system:** Working (`/api/notifications`), but only records "Agent finished" events — not team-scoped activity.

**Mission Control:** 404. Not implemented in local server.

---

## F6: Tier Simulation — Data Volume Test

### Workspace Scale

The system currently has **99 workspaces** across **45 groups**:
- 8 workspaces with explicit `teamId` fields
- 4 distinct `teamId` values in use
- Groups span: Engineering-Mega, Sales-Mega, Marketing-Mega, Legal-Mega, Executive, Q1-Campaign-Mega, R3-Team-Test, UAT-F, etc.

At 99 workspaces, performance remains acceptable — workspace list returns instantly, context loads without delay.

### Task System Performance

The workspace tasks API works well:
- `POST /api/workspaces/:id/tasks` — creates tasks correctly with UUID, timestamps
- `GET /api/workspaces/:id/tasks` — returns task list
- `PATCH /api/workspaces/:id/tasks/:id` — updates task status
- Tasks appear in workspace context under `teamContext.tasks`
- **Gap:** Tasks are workspace-local — PM workspace tasks not visible in shared workspace

### Cost Tracking

All API usage tracked in `/api/costs`:
- Today: 33 turns, $12.72 estimated cost
- Token tracking operational: input/output tokens, by model breakdown
- No per-workspace or per-team cost attribution

### Permission Enforcement

**None.** Despite storing `teamRole` (admin/member/viewer), no endpoint enforces these roles:
- Viewer workspace can use all tools
- Member workspace can access `admin` capabilities
- No authentication on local server endpoints beyond static bearer token shared by all workspaces

---

## F4: Competitive Assessment

### vs. Notion AI

**Notion AI baseline:** Team members collaboratively edit shared pages; AI operates on shared documents visible to all.

**Waggle vs. Notion AI:**
- Waggle BETTER: Per-workspace persistent AI memory that remembers decisions across months
- Waggle BETTER: Active agent that can take actions (bash, browser, files), not just respond to questions
- Waggle WORSE: No real-time collaborative editing — workspaces are not shared documents
- Waggle WORSE: Memory is not team-scoped — no concept of "what the team collectively knows"
- Waggle WORSE: No shared context without explicit team server setup

### vs. Linear + AI (Project Management)

**Linear strength:** Per-task AI summaries, linked across a project, visible to whole team.

**Waggle vs. Linear:**
- Waggle BETTER: AI has full context of workspace history, not just task metadata
- Waggle BETTER: Agent can autonomously execute subtasks, not just describe them
- Waggle WORSE: No unified task board across team members — tasks per workspace, not per team
- Waggle WORSE: No activity timeline visible to team
- Waggle SIMILAR: Both have assignee concepts (Linear executes, Waggle stores)

### vs. Slack AI (Team Messaging)

**Slack AI strength:** Summarizes channel history accessible to all team members; shared knowledge by default.

**Waggle vs. Slack AI:**
- Waggle BETTER: Per-user deep memory that persists long-term, not just message summaries
- Waggle BETTER: Can take actions, not just summarize
- Waggle WORSE: No broadcast capability — no "team channel" equivalent in local mode
- Waggle WORSE: Presence/messaging requires enterprise team server, not available solo
- Waggle WORSE: Zero real-time notification of team activity

---

## F5: The Big Question — Is Team Collaboration a Meaningful Differentiator?

### What Works Today

1. **Team workspace metadata** — `teamId`, `teamRole`, `group` fields stored and queryable
2. **Group-based workspace filtering** — `GET /api/workspaces?group=X` returns correct subset
3. **Per-workspace task boards** — Create, assign, update tasks; visible in workspace context
4. **`search_all_workspaces` tool** — Agent can search global memory from any workspace
5. **Team-aware suggested prompts** — "What has the team been working on?" injected for teamId workspaces
6. **Team task context in workspace** — Tasks surface in catchup context and prompt suggestions
7. **Complete tool definitions** — `team_tasks`, `team_members`, `team_activity`, `assign_task`, `complete_task`, `check_hive`, `share_to_team`, `send_waggle_message`, `request_team_capability` — all well-defined

### What's Clearly Missing

1. **Tool injection not wired** — Team tools (`createLocalTeamTools()`) are defined but never passed to the agent in chat sessions for team workspaces. This is a single missing wiring step in `chat.ts`.
2. **Memory isolation doesn't exist** — "Team workspace mind" and "personal mind" are architectural concepts but currently all workspaces share one mind. Cross-workspace memory contamination is real.
3. **No multi-user authentication** — Every API call uses the same bearer token. There's no concept of "user A cannot see user B's workspace."
4. **Team server not deployed** — The full team feature set (presence, messaging, capability governance, team knowledge graph) requires a PostgreSQL+Clerk+Redis backend that doesn't exist in this test environment.
5. **No team task aggregation** — Tasks are per-workspace. A shared workspace cannot see tasks from member workspaces.
6. **No activity stream** — No broadcast of "Dev workspace did X" to PM workspace.

### How Far from Category-Defining

**Current state: Pre-alpha for team collaboration.** The foundations are well-thought-out — the Waggle Dance protocol, capability governance, role hierarchy, and local tool definitions show real design investment. But the gap between what's designed and what's operational is large.

**Nearest working analogue:** Multiple workspaces on a single-user system with group labels. This is useful but not differentiated.

**Distance to "category-defining":**

| Gap | Effort to Close |
|-----|----------------|
| Wire `createLocalTeamTools()` into chat.ts for teamId workspaces | ~2 hours |
| Multi-user auth on local server (separate mind per user) | 1-2 weeks |
| Deploy enterprise team server (separate service) | 2-4 weeks |
| Cross-workspace task aggregation | 3-5 days |
| Team activity broadcast | 3-5 days |
| Real presence system (WebSocket, multi-device) | 1-2 weeks |

### What Would Need to Be True for This to Be the Killer Feature

1. **Each team member runs their own local Waggle** — currently it's one shared server
2. **Their agents communicate via Waggle Dance** — send_waggle_message routed through team server
3. **Shared team knowledge graph** — what one agent learns, others can `check_hive` for
4. **Capability governance matters in practice** — admin locks down what tools members can use, members can request escalation
5. **Cross-workspace context summaries** — "morning briefing: what did the team's agents do while you were offline?"

The concept is genuinely differentiated if executed. No competitor has "each team member has a persistent AI agent with their own context, and those agents can collaborate." This is the right vision. The implementation gap is execution depth, not direction.

---

## Detailed Findings Summary

### Architecture Insight

Waggle uses a **federated model**: each user runs a local AI agent (local server), which connects to an enterprise team server for shared state. This is clever — it means offline works, personal memory stays private by default, and sharing is opt-in. The enterprise server has PostgreSQL with proper relational schemas for teams, not a quick hack.

### The Wiring Bug

`createLocalTeamTools()` in `packages/agent/src/team-tools.ts` creates 5 real, useful tools (team_tasks, team_members, team_activity, assign_task, complete_task) that query the local server's task and presence endpoints. These are exported from the agent package. But in `packages/server/src/local/routes/chat.ts`, there is **zero reference** to team tools, teamId, or createLocalTeamTools. The team workspace detection in `workspaces.ts` (line 328: `if (ws.teamId)`) exists for context generation but never reaches the chat handler.

This is the single most impactful bug for the team feature: a fully-built, tested set of team tools that simply aren't connected to the thing users interact with.

### Memory Architecture Issue

The personal mind and workspace mind are shared across all workspaces on the local server. This is appropriate for a single user with many project workspaces (the primary solo use case), but means "team isolation" is meaningless locally. User A's memories are visible to User A's other workspaces. In a real team, this becomes User A seeing User B's private context. The architecture is correct for single-user; it needs a separate mind-per-user layer for multi-user.

### Tasks: The Hidden Team Feature

The task system is underdiscovered and actually works well end-to-end:
- REST CRUD fully functional per workspace
- Tasks appear in workspace context and influence suggested prompts
- "What team tasks are open?" suggested prompt appears for teamId workspaces
- `assign_task` and `complete_task` tools exist (just not injected)

**Recommended quick win:** Wire team tools. With a 2-hour change in chat.ts, every team workspace would gain task management through natural conversation.

---

## Score Breakdown

| Dimension | Score | Notes |
|-----------|-------|-------|
| Team feature discovery | 6/10 | Well-designed but requires knowing where to look |
| Team creation UX | 4/10 | Works via workspace fields; no dedicated team API |
| Cross-workspace collaboration | 2/10 | Global memory makes it technically possible but wrong-for-reasons |
| Shared workspace utility | 4/10 | Task prompts help; no real aggregation |
| Team tools activation | 0/10 | Built but not wired into chat sessions |
| Activity/presence | 1/10 | Returns empty; requires separate team server |
| Enterprise governance | 2/10 | Fully designed, inaccessible in local mode |
| **Overall** | **3/10** | Strong blueprint, near-zero team UX today |

---

## Recommendations (Priority Order)

### P0 — Immediate (hours, not days)

1. **Wire `createLocalTeamTools()` into chat.ts** — detect `ws.teamId`, inject team tools. This gives agents access to `team_tasks`, `team_members`, `team_activity`, `assign_task`, `complete_task` in team workspaces immediately.

2. **Add cross-workspace task visibility** — When workspace has `teamId`, fetch tasks from all workspaces with same `teamId` for display in shared context. No new API needed.

### P1 — Short term (days)

3. **Fix teamId workspace filter** — `GET /api/workspaces?teamId=X` returns all 99 workspaces (ignores filter). Should return only the 4-8 with matching teamId.

4. **Team context in system prompt** — Inject team membership, roles, and related workspaces into agent system prompt for team workspaces so agent knows who the team is without needing tools.

### P2 — Medium term (weeks)

5. **Deploy team server for testing** — Stand up the enterprise team server locally (it exists in `packages/server/src/`) to test the full Waggle Dance + presence + governance stack.

6. **Per-user mind isolation** — When workspace has `teamId` and `teamUserId`, use a dedicated mind scoped to that user identity rather than the global personal mind.

7. **Team activity digest** — A `/api/workspaces/:id/team-digest` endpoint that aggregates recent sessions/decisions from all workspaces sharing the same `teamId`.

---

*Test executed: 2026-03-22*
*API calls made: ~85 (chat, workspace, team, context, tasks)*
*Workspaces created: 4 (r3-pm-workspace, r3-dev-workspace, r3-marketing-workspace, r3-q2-campaign-shared)*
*Tasks created: 6 across team workspaces*
*Source files reviewed: team.ts, team-tools.ts, workspaces.ts, chat.ts, gateway.ts, schema.ts, capability-governance.ts*
