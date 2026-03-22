# Mega-UAT Test F: Team Collaboration Simulation

**Test Date:** 2026-03-22
**Tester:** Automated UAT Agent (Claude Opus 4.6)
**Server:** localhost:3333
**Build:** waggle-poc master @ 76d3e2a

---

## Executive Summary

Team collaboration is positioned as Waggle's most important differentiator. This test reveals that the **infrastructure scaffolding exists** but the **enforcement and isolation layers are critically absent**. Workspace metadata supports team fields (teamId, teamRole, teamUserId), but neither memory isolation nor role-based access control is actually enforced at the API level. A "viewer" can write memory frames. All workspaces share a single global memory pool. There is no dedicated `/api/teams` endpoint, no shared event stream, and no per-team cost tracking. The team feature set is at approximately **15-20% completion** for a shippable product.

**Overall Score: 3.5 / 10**

---

## F1: Team Setup

### Test Results

| Test | Result | Notes |
|------|--------|-------|
| GET /api/teams | **404 Not Found** | No dedicated teams endpoint exists |
| GET /api/team/status | 200 `{"connected":false}` | Team connection infrastructure present but disconnected |
| GET /api/team/teams | Returns 401 "Not connected to a team server" | Proxies to external team server (not standalone) |
| Workspaces with teamId | **2 found** (of 81 total) | `team-test-teamid-mega` and `team-viewer-mega` |
| POST workspace with teamId/teamRole | **201 Created** | Fields stored and returned correctly |
| Create admin workspace | **PASS** | `f-test-team` created with teamId="uat-team-f", role="admin" |
| Create member workspace | **PASS** | `f-test-member` created with teamId="uat-team-f", role="member" |
| Filter workspaces by group | **PASS** | `?group=UAT-F` correctly returns only 2 workspaces |

### Analysis

Team setup works at the **metadata storage level**. The workspace POST endpoint accepts and persists `teamId`, `teamRole`, and `teamUserId` fields. However, there is no first-class team entity -- teams are implicit groupings of workspaces that happen to share a `teamId` value. There is no way to:

- List all teams
- List members of a team
- Invite or remove team members
- View a team dashboard

The `team.ts` route file implements a **team server proxy model** where the local Waggle desktop connects to an external team server (POST /api/team/connect). This is designed for the Business/Enterprise tier but has no standalone team functionality for the Teams tier.

**Score: 5/10** -- Metadata plumbing works; no actual team management.

---

## F2: Collaborative Workflow Simulation

### Test Results

| Action | Actor | Result |
|--------|-------|--------|
| PM saves "Q1 Campaign Strategy Approved" decision frame | team-pm-mega | **200** -- frameId 198 saved |
| Dev saves "API v2 Endpoint Deployed" observation frame | team-dev-mega | **200** -- frameId 199 saved |
| Marketing saves "Campaign Landing Page Draft" frame | team-marketing-mega | **200** -- frameId 200 saved |
| Dev searches for PM's "campaign strategy" | team-dev-mega | **200** -- Found PM's frame (id 198) |
| Marketing searches for Dev's "API v2 endpoint" | team-marketing-mega | **200** -- Found Dev's frame (id 199) |

### Critical Finding: Zero Data Isolation

**Every workspace returns the exact same 50 frames from the personal mind.** When querying GET /api/memory/frames with `x-workspace-id: team-pm-mega`, `team-dev-mega`, `team-marketing-mega`, or `team-viewer-mega`, the response is identical: all 50 most recent frames from the shared personal MindDB.

Code evidence from `memory.ts` lines 121-138: The `/api/memory/frames` endpoint always pulls from `server.multiMind.getFrameStore('personal')` first, then optionally adds workspace-specific frames if a `workspace` query parameter is present. The `x-workspace-id` header is **not used for filtering or scoping**.

This means:
- PM's strategic decisions are visible to every workspace
- Dev's technical frames leak to Marketing
- Confidential client data ("Alpha Corp secret") appears in all workspace frame listings
- There is no concept of "team-scoped memory" vs "personal memory" vs "workspace-private memory"

Cross-workspace search also returns all frames from the personal mind regardless of which workspace issued the query. The `workspace` query parameter on search only adds the workspace mind's frames to the result set -- it does not filter OUT personal frames.

**Score: 2/10** -- Data flows, but isolation is fundamentally broken. This is a security/compliance blocker for any team use.

---

## F3: Tier Simulation (Business/Enterprise Scale)

### Performance Results

| Endpoint | Items | Response Time | Size | Status |
|----------|-------|---------------|------|--------|
| GET /api/workspaces | 81 workspaces | **0.231s** | 10,354 bytes | 200 |
| GET /api/memory/search | 11 results | **0.209s** | 17,935 bytes | 200 |
| GET /api/memory/frames | 50 frames | **0.212s** | ~15KB | 200 |
| GET /api/cost/summary | 7-day breakdown | **0.212s** | 838 bytes | 200 |
| GET /api/fleet | 0 sessions | **0.215s** | 41 bytes | 200 |
| GET /api/workspaces/:id/context | Full context | **0.22s** | ~2KB | 200 |
| GET /api/cockpit | N/A | **404** | -- | Not found |
| GET /api/dashboard | N/A | **404** | -- | Not found |

### Analysis

**Performance is excellent** for the current scale. All endpoints respond in under 250ms with 81 workspaces and 200+ memory frames. The SQLite + FTS5 architecture handles this load trivially. However:

- **No cockpit/dashboard endpoint exists** for multi-workspace team overview
- **Fleet endpoint** returns `{"sessions":[],"count":0,"maxSessions":3}` -- designed for agent session management, not team overview
- **Cost tracking** is global, not per-workspace or per-team. The cost/summary endpoint returns the same zeros regardless of workspace header
- There is no way to view aggregate team activity across workspaces
- **Workspace context** (`/api/workspaces/:id/context`) provides good per-workspace summaries including summary text, recent decisions, suggested prompts, and stats. This is the strongest team-adjacent feature.

The system could likely handle 500+ workspaces at the current architecture level (SQLite scales well for reads), but without team-scoped views it becomes unmanageable beyond ~20 workspaces.

**Score: 5/10** -- Fast and stable, but missing multi-workspace/team aggregation views entirely.

---

## F4: Governance at Scale

### Permission Enforcement Tests

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| Viewer writes memory frame | **BLOCKED** | 200, frameId 201 saved | **FAIL -- No enforcement** |
| Viewer POST /api/chat | **BLOCKED** | 200, streamed response | **FAIL -- No enforcement** |
| Viewer reads all frames | Scoped to own data | Returns all 50 global frames | **FAIL -- No scoping** |
| Admin vs Member difference | Different permissions | Identical behavior | **FAIL -- Roles decorative** |
| teamRole field stored | Stored on workspace | Confirmed stored | PASS (metadata only) |

### Detailed Governance Findings

1. **Role enforcement is completely absent.** The `teamRole` field ("admin", "member", "viewer") is stored as workspace metadata but **no middleware checks it before allowing operations**. A viewer-role workspace (`team-viewer-mega`, role: "viewer") can:
   - Write memory frames (POST /api/memory/frames) -- succeeded with frameId 201
   - Send chat messages (POST /api/chat with "/status") -- received full streamed response
   - Read all memory across the system
   - There is zero difference in behavior between admin, member, and viewer roles

2. **Cost tracking** returns identical zero-value results regardless of workspace. No per-team budget controls exist. The budget system (`dailyBudget: null`) is present but not connected to team-level governance.

3. **Audit trail (Events):** The `/api/events` endpoint returns **404 Not Found** both with and without workspace headers. Event tracking for team actions does not exist at the API level, though the codebase includes event infrastructure (eventBus in team.ts).

4. **Capability governance proxy** (GET /api/team/governance/permissions) exists but returns `{"connected":false,"permissions":null}` because it requires an external team server connection. No standalone capability governance.

5. **Data isolation** is the most critical governance gap. All workspaces read from the same personal MindDB. Confidential data from one workspace (e.g., "Alpha Corp secret: this data belongs only here") is returned when querying from any other workspace.

**Score: 1/10** -- Governance is cosmetic. Roles are stored but never enforced. This is the most serious gap for team/enterprise use.

---

## F5: Shared Event Stream

### Test Results

| Test | Result |
|------|--------|
| GET /api/events | **404 Not Found** |
| GET /api/events?teamId=team-q1 | **404 Not Found** |
| GET /api/events (with x-workspace-id) | **404 Not Found** |
| GET /api/team/activity | 200 `{"items":[]}` (requires team server) |
| GET /api/team/messages | 200 `{"messages":[]}` (requires team server) |
| GET /api/team/presence | 200 `{"members":[]}` (requires team server) |

### Analysis

There is **no shared event stream**. The events endpoint does not exist. Team activity, team messages, and team presence endpoints exist in the codebase but all proxy to an external team server, returning empty results when not connected.

The team.ts code shows a well-designed proxy architecture:
- `/api/team/activity` proxies to team server's entities API
- `/api/team/messages` proxies to team server's messages API
- `/api/team/presence` proxies to team server's presence API with a fallback to show the current user as online

None of this works standalone. The local Waggle instance has no built-in event or activity aggregation.

**Score: 1/10** -- Infrastructure stubs exist but nothing works without an external team server.

---

## Architecture Assessment

The team collaboration architecture follows a **hub-and-spoke proxy model**:

```
Local Waggle Desktop --> POST /api/team/connect --> External Team Server
                    <-- Proxied team data (presence, activity, messages)
```

This is designed for the Business/Enterprise tier where a central team server manages coordination. However, for the Teams tier (5 users, $150/month), this architecture requires deploying a separate server -- a significant barrier.

### What Exists (Infrastructure Layer)
- Workspace metadata: teamId, teamRole, teamUserId fields stored and returned
- Team server connection flow: connect, disconnect, status
- Proxy routes for presence, activity, messages, governance
- Policy cache with 5-minute TTL for governance permissions
- WebSocket eventBus for presence updates
- Group-based workspace filtering

### What Is Missing (Application Layer)
- **Standalone team management** (create team, invite members, list teams)
- **Memory isolation** (workspace-scoped or team-scoped frame storage)
- **Role-based access control middleware** (check teamRole before operations)
- **Per-team cost tracking** (budget per team, usage per member)
- **Shared event stream** (cross-workspace activity timeline)
- **Team dashboard/cockpit** (aggregated view across team workspaces)
- **Conflict resolution** (what happens when two team members edit the same decision?)
- **Notification system** (team member activity notifications)

---

## Competitive Comparison

| Capability | Waggle | Notion AI Teams | Google Workspace AI | Microsoft Copilot |
|-----------|--------|-----------------|--------------------|--------------------|
| Team creation | Metadata only | Full team management | Org-level | Org-level via M365 |
| Role enforcement | None (decorative) | Full RBAC | Full RBAC | Full RBAC via Azure AD |
| Data isolation | None | Per-workspace | Per-org + sharing | Per-tenant |
| Shared activity feed | None | Page history + comments | Activity stream | Copilot activity |
| Cost tracking per team | None | Per-workspace billing | Per-org billing | Per-user licensing |
| Real-time presence | Stub (empty) | Real-time cursors | Real-time indicators | Real-time presence |
| Cross-workspace search | Leaks all data | Scoped with permissions | Scoped with permissions | Scoped with permissions |

Waggle is **significantly behind** all three competitors on team collaboration fundamentals. The competitors have years of battle-tested RBAC, data isolation, and team management. Waggle's advantage (workspace-native AI memory) is undermined by the fact that memory is not isolated between workspaces.

---

## Scoring Summary

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Team Setup (F1) | 5/10 | 20% | 1.0 |
| Collaboration (F2) | 2/10 | 30% | 0.6 |
| Governance (F4) | 1/10 | 25% | 0.25 |
| Scale (F3) | 5/10 | 15% | 0.75 |
| Shared Events (F5) | 1/10 | 10% | 0.1 |
| **TOTAL** | | | **2.7 / 10** |

---

## Would a Team of 5 Pay $150/month?

**No. Not in the current state.**

The value proposition of team AI collaboration requires three non-negotiable foundations:

1. **Data isolation** -- Team members must not see each other's private workspace data unless explicitly shared. Currently, every frame leaks to every workspace. This is a deal-breaker for any professional team handling client data, financial information, or confidential strategy.

2. **Permission enforcement** -- A "viewer" role that can write data is worse than having no roles at all. It creates a false sense of security. Teams need actual RBAC before they can trust the system.

3. **Shared context** -- The flip side of isolation: when team members DO want to share, there needs to be a deliberate mechanism (shared workspace mind, team decision log, activity feed). Currently sharing happens by accident (all data is global), not by design.

A team evaluating Waggle today would find:
- **Solo use:** Strong. Persistent memory, workspace context, catch-up -- these are real differentiators.
- **Team use:** Broken. No isolation means the PM's sensitive client data appears in the intern's workspace. No enforcement means the viewer role is meaningless. No shared feed means team members cannot coordinate through the tool.

To reach the $150/month threshold, Waggle needs:
1. Per-workspace memory isolation (workspace mind actually scoping frame reads)
2. Role enforcement middleware on all write endpoints
3. A standalone team management layer (not requiring an external team server)
4. A shared team activity feed
5. Per-team cost attribution

Estimated effort to reach minimum viable team collaboration: **3-4 weeks of focused development**.

---

## Critical Bugs Found

| ID | Severity | Description |
|----|----------|-------------|
| F-BUG-1 | **P0 BLOCKER** | Memory frames endpoint returns all personal frames regardless of workspace. Zero data isolation. |
| F-BUG-2 | **P0 BLOCKER** | teamRole "viewer" can write memory frames and send chat messages. Role enforcement absent. |
| F-BUG-3 | **P1** | Memory search returns cross-workspace results without permission checks. Confidential data leaks. |
| F-BUG-4 | **P1** | /api/events returns 404. No event logging or audit trail available. |
| F-BUG-5 | **P2** | Cost tracking is global-only. No per-workspace or per-team breakdown. |
| F-BUG-6 | **P2** | No /api/teams endpoint. Teams are implicit, not manageable entities. |
| F-BUG-7 | **P2** | No cockpit/dashboard endpoint for multi-workspace team views. |
| F-BUG-8 | **P3** | Team presence/activity/messages only work via external team server proxy. |

---

## Recommended Next Steps (Priority Order)

1. **Memory isolation middleware** -- Add workspace-scoping to /api/memory/frames and /api/memory/search so that frames are filtered by the requesting workspace's teamId or workspaceId. The personal mind should only return frames that were created in the requesting workspace context.

2. **Role enforcement middleware** -- Add a Fastify preHandler that checks `teamRole` on the workspace before allowing write operations. Viewer = read-only. Member = read + write own data. Admin = full access.

3. **Standalone team CRUD** -- Create a /api/teams endpoint backed by SQLite (not requiring external server) with create, list, invite, and remove operations.

4. **Shared team activity log** -- Aggregate events from all workspaces sharing a teamId into a queryable timeline.

5. **Per-team cost tracking** -- Attribute token usage to the workspace that triggered it, aggregatable by teamId.
