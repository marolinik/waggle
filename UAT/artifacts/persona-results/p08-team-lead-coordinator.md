# P08: Team Lead -- Cross-Functional Coordinator

## Persona Summary

**Role**: Leads a cross-functional team (design, eng, PM, QA) on a product initiative
**Tech level**: Mixed -- coordinates between technical and non-technical people
**Tier**: TEAMS
**Daily tools**: Slack, Linear, Google Docs, Figma, various team tools
**Core need**: "Shared workspace where the whole team context lives. Agent that can answer 'where are we on X?' for any team member."
**Emotional priority**: Orientation, Momentum, Continuity

---

## Persona System Analysis

### Matching Persona

The Team Lead maps closest to the **project-manager** persona:
- Tools: create_plan, add_plan_step, execute_step, show_plan, search_memory, save_memory
- Workspace affinity: project, management, coordination, planning
- Suggested commands: /plan, /status, /catchup

However, the Team Lead scenario specifically requires TEAMS tier features that go beyond any single persona.

### Team Infrastructure Analysis

The team system includes:
- **Team routes** (`packages/server/src/local/routes/team.ts`): connect/disconnect/status for team server
- **Team tools** (`packages/agent/src/team-tools.ts`): check_hive (team knowledge graph), plus workspace/task/member management tools
- **Workspace creation with team fields**: teamId, teamServerUrl, teamRole (owner/admin/member/viewer), teamUserId
- **Waggle Dance** (`packages/waggle-dance/`): swarm orchestration protocol

### Team Server Architecture

The team system requires a separate team server (PostgreSQL + Redis):
- Local server connects to team server via token-based auth
- Team workspaces sync between local and team server
- Team knowledge graph accessible via `check_hive` tool
- WebSocket for presence indicators

This is a significant deployment requirement beyond the SOLO tier.

---

## Journey Assessment: Team Coordination (Scenario 13.8)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Team workspace creation | Yes | Yes | POST /api/workspaces with teamId field |
| Member invitation | Yes | Partial | Team server handles members; local routes proxy |
| Task board (CRUD, assignment) | Yes | Yes | Task routes with assigneeId/assigneeName |
| Waggle Dance messages | Yes | Partial | waggle-dance package exists but activation status unclear |
| WebSocket presence | Yes | Partial | Server infrastructure exists; needs team server running |
| Team status generation | Yes | Partial | Agent can draft but needs team context |
| Capability governance | Yes | Partial | Permission system exists (PermissionManager) but governance UI unclear |
| Multi-user data isolation | Yes | Yes | Workspace-scoped data + role-based access |

### Team Server Dependency

The TEAMS tier scenario requires:
1. PostgreSQL database (team data)
2. Redis (real-time features, presence)
3. Clerk authentication (multi-user identity)
4. Team server running separately from local server

This is a complex deployment that may not be configured in most testing environments.

### Task Assignment

The task board supports assignment:
- `assigneeId` and `assigneeName` fields on each task
- Tasks are workspace-scoped (all team members in a workspace see the same tasks)
- No permission-based task filtering (all team members see all tasks)

### Waggle Dance (Swarm Orchestration)

The `packages/waggle-dance/` package provides:
- Protocol for multi-agent orchestration
- Dispatcher for work distribution
- Hive query for team knowledge
- This is the foundation for team-level agent intelligence

### Functional Checkpoint Assessment

- [x] Team workspace creation -- API supports teamId, teamServerUrl, teamRole fields
- [~] Member invitation -- Requires team server; local API proxies to team server
- [x] Task board with assignment -- assigneeId/assigneeName fields present
- [~] Waggle Dance messages -- Package exists but activation depends on Phase 8D
- [~] Presence indicators -- WebSocket infrastructure exists; needs team server
- [~] Team status generation -- Agent can draft but needs team-specific context
- [~] Capability governance -- PermissionManager exists but team governance UI unclear
- [x] Data isolation -- Workspace-scoped data with role-based workspace access

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Workspace structure exists but team dashboard is not implemented |
| Relief | 2 | Requires complex deployment (PG + Redis + Clerk) for basic team features |
| Momentum | 2 | Setup friction is high for teams |
| Trust | 3 | Task assignment and data isolation work at infrastructure level |
| Continuity | 3 | Team context persists if team server is running |
| Seriousness | 2 | Team features feel early-stage, not enterprise-grade yet |
| Alignment | 2 | Team coordination workflow needs significant UX polish |
| Controlled Power | 3 | Role-based access control exists (owner/admin/member/viewer) |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 3 | Core infrastructure exists but requires complex deployment. Many features are partial. |
| Memory support | 3 | Team knowledge via check_hive exists. Personal + workspace + team minds. |
| Output quality potential | 2 | Team context gathering and status generation need more integration work. |
| Team support | 3 | Architecture is designed for teams but activation is incomplete (Phase 8D pending). |

**Overall infrastructure score: 2.75/5**

---

## Key Findings

1. **Team infrastructure is architecturally complete but activation-incomplete**: All the pieces exist (team routes, team tools, waggle-dance, role-based access) but they require Phase 8D activation to become production-ready.

2. **High deployment friction**: TEAMS tier requires PostgreSQL, Redis, Clerk, and a separate team server. This is a significant barrier to testing and adoption.

3. **Task assignment works at API level**: The task board supports assigneeId/assigneeName fields. Team members can be assigned tasks through the API.

4. **Waggle Dance is the key differentiator**: Multi-agent orchestration for team workspaces is architecturally novel. But it is not yet activated.

5. **Presence and real-time features need team server**: WebSocket-based presence indicators are designed but depend on the team server infrastructure being operational.

6. **Role-based access control exists**: owner/admin/member/viewer roles are stored on workspace creation. PermissionManager provides tool-level access control.

---

## Recommendations

1. Phase 8D should prioritize activating the team server with simplified deployment (Docker compose, single-command setup).
2. Add a team dashboard view that shows member activity, task board overview, and recent decisions.
3. Test team workspace creation with team server running to validate the full flow.
4. Create a "team coordination" workspace template with project-manager persona and team-specific starter memory.
5. Implement capability governance UI for team admins to control which tools team members can use.
