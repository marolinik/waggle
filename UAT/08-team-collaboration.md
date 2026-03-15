# 08 — Team Collaboration

Tests the team mode that transforms Waggle from a solo tool into a shared workspace platform. Team features require PostgreSQL and Redis (Docker Compose). These scenarios validate shared workspaces, presence, task boards, Waggle Dance messaging, and capability governance.

---

## Scenario 8.1: Create Team

**Persona**: Team Lead (Cross-Functional Coordinator)
**Tier**: [TEAMS]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, team server running (PostgreSQL + Redis via Docker Compose), user authenticated via Clerk

### Context

Team Lead is setting up Waggle for their cross-functional product initiative. They need to create a team space where designers, engineers, and PMs can share context. The team creation flow should feel like creating a Slack workspace — give it a name, get a slug, and you're the owner.

### Steps

1. Navigate to Team settings or Admin area. Expect: "Create Team" option is visible and accessible.
2. Enter team name "Product Initiative Alpha" and slug "pi-alpha." Expect: slug is validated (lowercase, no spaces, unique).
3. Confirm team creation. Expect: team is created, confirmation shown, Team Lead is assigned "owner" role.
4. Verify team in PostgreSQL. Expect: team record exists with correct name, slug, and created_at timestamp.
5. Check that default capability policies are seeded. Expect: 3 role-based policies exist (owner, admin, member) with default permission sets.
6. Verify the team appears in the Teams section of the UI. Expect: team is listed with owner badge, member count shows 1.

### Functional Checkpoints

- [ ] Team creation form accepts name and slug
- [ ] Slug validation enforces lowercase, no spaces, uniqueness
- [ ] Team record persisted in PostgreSQL
- [ ] Creator is assigned "owner" role automatically
- [ ] 3 default capability policies seeded (owner, admin, member)
- [ ] Team appears in UI team list with correct metadata
- [ ] Member count initializes to 1 (the owner)

### Emotional Checkpoints

- [ ] Orientation: Team Lead knows where to go and what to do — team creation is a first-class flow
- [ ] Controlled Power: Team Lead is explicitly the owner — their authority is clear from the start
- [ ] Seriousness: The slug, roles, and policies signal a real collaboration platform, not a toy
- [ ] Trust: Default policies exist — the system has sensible security from the start

### Features Exercised

- Team CRUD (create)
- Slug validation
- PostgreSQL persistence
- Automatic role assignment (owner)
- Default capability policy seeding
- Team UI listing

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No team concept. Single user, single terminal. | +2 |
| ChatGPT Desktop | Team/Enterprise plans exist but are admin-provisioned, not user-created. | +1 |
| Cursor AI | No team workspace concept. Per-user IDE. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (team creation is the gateway to the teams tier)
- Emotional: average feeling score >= 3, Controlled Power must score >= 4

---

## Scenario 8.2: Invite & Join

**Persona**: Team Lead + Luka (Project Manager)
**Tier**: [TEAMS]
**Duration**: 5 minutes
**Prerequisites**: Team "pi-alpha" created (from 8.1), Luka has a Waggle account, both users authenticated

### Context

Team Lead needs to add Luka to the team so he can access shared workspaces and the task board. The invite flow should be straightforward — add by username or email, assign a role, and Luka should see the team immediately.

### Steps

1. (Team Lead) Navigate to team settings for "pi-alpha." Expect: member management section is visible.
2. (Team Lead) Click "Invite Member" and enter Luka's identifier (email or username). Expect: user lookup succeeds, Luka is found.
3. (Team Lead) Confirm invite with "member" role. Expect: Luka added to team with "member" role.
4. (Luka) Open Waggle desktop. Navigate to Teams. Expect: "Product Initiative Alpha" appears in Luka's team list.
5. (Luka) Click into the team. Expect: Luka can see shared workspaces, team members, and the task board.
6. (Luka) Verify role. Expect: Luka sees himself as "member" — not owner or admin.
7. (Team Lead) Check member list. Expect: shows 2 members — Team Lead (owner) + Luka (member).

### Functional Checkpoints

- [ ] Team settings show member management for owners
- [ ] Member invite accepts email or username
- [ ] Invited member is assigned the specified role ("member")
- [ ] Invited member sees the team in their team list immediately (or after refresh)
- [ ] Member can access shared workspaces within the team
- [ ] Member can see team member list and task board
- [ ] Member count updates correctly (1 -> 2)
- [ ] Role is correctly displayed for each member

### Emotional Checkpoints

- [ ] Orientation: Both users know exactly where they are — Team Lead sees members, Luka sees the team
- [ ] Trust: Luka sees his role clearly — no ambiguity about permissions
- [ ] Momentum: From invite to productive team member in under 2 minutes
- [ ] Alignment: The flow matches how users expect team onboarding to work (invite -> join -> see stuff)

### Features Exercised

- Team member invitation
- User lookup
- Role assignment
- Team visibility for invited members
- Member list display
- Team navigation from member perspective

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No multi-user support. | +2 |
| ChatGPT Desktop | Team management is admin-only, enterprise-gated. | +1 |
| Cursor AI | No shared workspace concept. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (team onboarding must be frictionless)
- Emotional: average feeling score >= 3, Momentum must score >= 4

---

## Scenario 8.3: Shared Task Board

**Persona**: Team Lead + Luka (Project Manager)
**Tier**: [TEAMS]
**Duration**: 6 minutes
**Prerequisites**: Team "pi-alpha" with both Team Lead and Luka as members

### Context

The team needs to track work items for their initiative. Team Lead creates tasks, assigns some to Luka, and both use the Kanban-style task board to track progress. The task board should feel like a lightweight Linear or Trello — not a full PM tool, but enough to coordinate agent-assisted work.

### Steps

1. (Team Lead) Navigate to team task board. Expect: board view with Kanban columns (e.g., To Do, In Progress, Done).
2. (Team Lead) Create a task: "Draft competitive analysis" with description. Expect: task appears in "To Do" column.
3. (Team Lead) Create 2 more tasks: "Review user feedback Q1" and "Prepare sprint demo." Expect: all 3 tasks visible in "To Do."
4. (Team Lead) Assign "Review user feedback Q1" to Luka. Expect: assignee shows Luka's name/avatar on the task card.
5. (Luka) Open task board. Expect: sees all 3 tasks. "Review user feedback Q1" shows as assigned to him.
6. (Luka) Claim "Review user feedback Q1" — move to "In Progress." Expect: task moves to In Progress column, status updates.
7. (Luka) Update task status to "Done." Expect: task moves to Done column.
8. (Team Lead) Refresh or view board. Expect: sees Luka's task in "Done" column with updated status.

### Functional Checkpoints

- [ ] Task board renders with Kanban columns
- [ ] Task creation works (title, description)
- [ ] Multiple tasks can be created
- [ ] Task assignment to team members works
- [ ] Assigned tasks show assignee name/avatar
- [ ] Task status transitions work (To Do -> In Progress -> Done)
- [ ] Status changes are visible to other team members
- [ ] Task board displays current state for all team members consistently

### Emotional Checkpoints

- [ ] Orientation: Both users immediately understand the board layout — columns, tasks, assignments
- [ ] Momentum: Task creation and status updates are fast (< 2 seconds each)
- [ ] Seriousness: The task board feels like a real work tool, not a demo
- [ ] Alignment: Kanban flow matches how teams actually track work
- [ ] Controlled Power: Team Lead assigns, Luka claims and updates — roles are natural

### Features Exercised

- Task CRUD (create, read, update)
- Task assignment
- Kanban status states (To Do, In Progress, Done)
- Task status transitions
- Multi-user task board consistency
- Assignee display

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No task tracking. | +2 |
| ChatGPT Desktop | No shared task board. | +2 |
| Cursor AI | No built-in task board. Users rely on external tools. | +1 |
| Linear/Trello | Full-featured task boards but no AI agent integration. | 0 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 3 (lightweight task board — not competing with Linear, but integrated with agent)
- Emotional: average feeling score >= 3, no feeling below 2

---

## Scenario 8.4: Waggle Dance Messaging

**Persona**: Team Lead (Cross-Functional Coordinator)
**Tier**: [TEAMS]
**Duration**: 4 minutes
**Prerequisites**: Team "pi-alpha" with at least 2 members, both online

### Context

Team Lead needs to broadcast a status update to the team and request input on a decision. Waggle Dance messages are the platform's team communication layer — not a chat app replacement, but a way to push structured messages (status updates, alerts, requests) that appear in the team context panel.

### Steps

1. (Team Lead) Open the team context panel or Waggle Dance section. Expect: messaging input area is available with message type selection.
2. (Team Lead) Compose a message with type "status": "Sprint 3 kickoff complete. Focus areas: competitive analysis, user feedback review." Expect: message sends successfully.
3. (Team Lead) Send a second message with type "request": "Need input on deployment strategy by Thursday." Expect: request message sends with distinct visual treatment.
4. (Luka) Open team context panel. Expect: both messages are visible with correct type badges.
5. Verify type badges. Expect: "waggle" (general), "alert," "status," and "request" types display with distinct visual indicators (color, icon, or label).
6. Check message ordering. Expect: messages appear in chronological order, newest visible.

### Functional Checkpoints

- [ ] Waggle Dance messaging UI is accessible in team context
- [ ] Messages can be sent with type selection (waggle/alert/status/request)
- [ ] Messages appear in other team members' context panel
- [ ] Type badges display correctly with visual differentiation
- [ ] Messages are chronologically ordered
- [ ] Message content renders correctly (no truncation, formatting preserved)
- [ ] Context panel updates without full page reload (SSE or polling)

### Emotional Checkpoints

- [ ] Orientation: Team Lead knows how to send different message types — the UI makes types obvious
- [ ] Seriousness: Structured message types signal professional communication, not casual chat
- [ ] Alignment: Message types match real team communication patterns (updates, requests, alerts)
- [ ] Trust: Messages are delivered reliably — what was sent is what was received

### Features Exercised

- Waggle Dance message creation
- Message type selection (waggle/alert/status/request)
- Message type badges / visual indicators
- Team context panel
- Cross-user message delivery
- Message chronological ordering

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No team messaging. | +2 |
| ChatGPT Desktop | No structured team messaging. | +2 |
| Slack | Full messaging platform but no AI agent integration or structured types. | 0 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 3 (messaging is supplementary to shared workspaces, not the core value)
- Emotional: average feeling score >= 3, Seriousness must score >= 3

---

## Scenario 8.5: WebSocket Presence

**Persona**: Team Lead + Luka (Project Manager)
**Tier**: [TEAMS]
**Duration**: 4 minutes
**Prerequisites**: Team "pi-alpha" with both members, both have Waggle desktop running

### Context

When team members are working simultaneously, they should see who's online. Presence indicators help with awareness — "Is Luka around? Can I expect a response?" — without requiring a separate chat tool. Presence should update via WebSocket with a polling fallback.

### Steps

1. (Team Lead) Open team view. Expect: member list or presence indicators visible.
2. (Luka) Open team view. Expect: Team Lead shows as "online" (green dot or similar indicator).
3. (Team Lead) Check Luka's status. Expect: Luka shows as "online."
4. (Luka) Close Waggle desktop (simulate going offline). Expect: within 60 seconds, Luka's status changes to "offline" or "away" for Team Lead.
5. (Luka) Reopen Waggle desktop and navigate to team. Expect: within a few seconds, Luka's status returns to "online" for Team Lead.
6. Verify fallback behavior. If WebSocket disconnects, polling should maintain presence updates within 60 seconds.

### Functional Checkpoints

- [ ] Presence indicators visible in team member list
- [ ] Online status shows when user has Waggle open with team active
- [ ] Offline status reflects within 60 seconds of user closing app
- [ ] Reconnection restores online status promptly (< 10 seconds)
- [ ] WebSocket transport is primary (real-time updates)
- [ ] Polling fallback works when WebSocket unavailable (60-second interval)
- [ ] Presence state is team-scoped (not global)

### Emotional Checkpoints

- [ ] Orientation: Team Lead can see at a glance who's available — no guessing
- [ ] Trust: Presence indicators are accurate — online means actually online, not stale
- [ ] Continuity: Presence state transitions are smooth, not jarring (no rapid flickering)
- [ ] Seriousness: Presence is a real collaboration feature, not decorative

### Features Exercised

- WebSocket presence channel
- Presence indicator UI
- Online/offline state transitions
- Polling fallback (60-second interval)
- Team-scoped presence
- Reconnection handling

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No multi-user, no presence. | +2 |
| ChatGPT Desktop | No team presence indicators. | +2 |
| Slack | Excellent presence — Waggle should aim for parity. | 0 |
| Cursor AI | No team features, no presence. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 3 (presence is table-stakes for team features)
- Emotional: average feeling score >= 3, Trust must score >= 3

---

## Scenario 8.6: Capability Governance

**Persona**: Team Lead (admin) + Luka (member)
**Tier**: [TEAMS]
**Duration**: 7 minutes
**Prerequisites**: Team "pi-alpha" with Team Lead as admin/owner and Luka as member, team capability policies in place

### Context

Team Lead needs to control what tools team members' agents can use. In a professional setting, not everyone should have unrestricted access to powerful tools like `bash` (shell execution). The governance flow should let admins set policies, enforce them at agent execution time, and handle access requests gracefully.

### Steps

1. (Team Lead) Navigate to team admin / capability governance settings. Expect: policy management UI shows existing policies by role.
2. (Team Lead) Set policy: "member" role cannot use the `bash` tool. Expect: policy saved, confirmation shown.
3. (Luka) In a team workspace, ask the agent to execute a shell command. Expect: agent attempts to use `bash`, but the request is blocked with a clear message explaining the restriction.
4. Verify the blocked message. Expect: message says something like "This tool is restricted by your team's capability policy. Contact your admin to request access." — not a cryptic error.
5. (Luka) Request access to `bash` (through whatever request mechanism exists). Expect: request is submitted and appears in admin queue.
6. (Team Lead) Check admin queue / access requests. Expect: Luka's request for `bash` access is visible with context.
7. (Team Lead) Approve the request. Expect: policy updated, Luka's role now has `bash` access.
8. (Luka) Try the same shell command again. Expect: agent successfully executes `bash` this time.

### Functional Checkpoints

- [ ] Capability governance UI accessible to team admins/owners
- [ ] Policies are configurable per role per tool
- [ ] Policy enforcement blocks restricted tools at agent execution time
- [ ] Blocked tool shows a clear, human-readable message (not a stack trace)
- [ ] Access request mechanism exists (member can request access)
- [ ] Access requests appear in admin queue with requester and tool context
- [ ] Admin can approve requests, updating the policy
- [ ] Approved access takes effect without requiring app restart
- [ ] Policy changes persist across sessions

### Emotional Checkpoints

- [ ] Controlled Power (Team Lead): Admin feels in control of what the team's agents can do
- [ ] Trust (Team Lead): Governance gives confidence that team agents won't do unauthorized things
- [ ] Orientation (Luka): When blocked, Luka knows WHY and knows how to request access
- [ ] Alignment (Luka): The request flow is dignified — Luka isn't punished, just guided
- [ ] Seriousness: Governance signals enterprise-readiness, not a prototype limitation

### Features Exercised

- Team capability policies (CRUD)
- Per-role tool restrictions
- Agent-level policy enforcement
- Human-readable restriction messages
- Access request submission
- Admin request queue
- Request approval flow
- Dynamic policy updates

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No governance. Every user has full tool access. | +2 |
| ChatGPT Desktop | Enterprise tier has admin controls but no per-tool governance. | +2 |
| Cursor AI | No team governance for AI agent capabilities. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 5 (capability governance is a category differentiator for enterprise sales)
- Emotional: average feeling score >= 4, Controlled Power (admin) and Orientation (member) must score >= 4
