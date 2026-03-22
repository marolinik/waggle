# Session Handoff — UAT 3 Status
**Updated:** 2026-03-22 ~17:00 CET

---

## ALL ITEMS COMPLETE ✅

- 29/29 bugs addressed (16 fixed this session, 13 already working)
- 7/7 UX items addressed (2 fixed, 5 already working)
- F2: Audit trail — BUILT
- F3: Team CRUD — BUILT
- Prompt 1: Per-workspace agent + model config + UI — BUILT
- Prompt 2: Virtual storage + FileStore — BUILT
- P1-6: Onboarding wizard — BUILT (enhanced existing, 468 lines, 7 steps with tooltips)
- Tests: 4333/4333 pass
- Total: ~2,400 lines across 45 files

## NEXT: RE-TEST (3 focused rounds) — see Step 7 below

---

## Execution Queue (IN ORDER)

### Step 1: F2 — Audit Trail (3-5 days)
Prompt for Claude Code:
```
Build the /api/events audit trail system.

Requirements:
1. Create packages/server/src/local/routes/events.ts
2. Create audit_events table in SQLite (via migration):
   - id (auto), timestamp, workspaceId, userId, eventType, toolName, input (JSON), output (JSON), model, tokensUsed, cost, sessionId, approved (boolean)
3. Event types: tool_call, tool_result, memory_write, memory_delete, workspace_create, workspace_update, workspace_delete, session_start, session_end, approval_requested, approval_granted, approval_denied, export, cron_trigger
4. Emit events from: chat.ts (tool calls, approvals), memory.ts (writes/deletes), workspaces.ts (CRUD), export.ts
5. API endpoints:
   - GET /api/events?workspaceId=X&type=tool_call&from=2026-03-01&to=2026-03-22&limit=100 — paginated, filterable
   - GET /api/events/stats?workspaceId=X — { totalEvents, byType: { tool_call: 150, memory_write: 30, ... }, byDay: [...] }
   - GET /api/events/stream — SSE stream of live events (for dashboard)
6. Wire into Cockpit UI: AuditTrailCard component should use real data from /api/events
7. Performance: index on (workspaceId, timestamp), (eventType, timestamp)
8. Retention: configurable, default 90 days, auto-cleanup via cron

DO NOT break existing SSE chat streaming. The events stream is SEPARATE from chat SSE.
Tests must pass.
```

### Step 2: F3 — Team Entity CRUD (3-5 days)
Prompt for Claude Code:
```
Build team entity management for Waggle.

Requirements:
1. Create teams table in SQLite:
   - id, name, description, ownerId, created, updated
2. Create team_members table:
   - teamId, userId, role (owner/admin/member/viewer), joined
3. API endpoints:
   - POST /api/teams — create team
   - GET /api/teams — list teams (user's teams)
   - GET /api/teams/:id — team detail with members
   - PUT /api/teams/:id — update team
   - DELETE /api/teams/:id — delete team (owner only)
   - POST /api/teams/:id/members — invite member (by email or userId)
   - DELETE /api/teams/:id/members/:userId — remove member
   - PUT /api/teams/:id/members/:userId — change role
4. Link workspaces to teams:
   - Add teamId field to workspace config
   - GET /api/workspaces?teamId=X — filter workspaces by team
   - Team members can see/access team workspaces based on role
5. Team activity feed:
   - GET /api/teams/:id/activity — aggregated events from all team workspaces (uses audit trail from F2)
6. UI:
   - TeamSection in Settings already exists — wire it to real API
   - Team switcher in sidebar (if multiple teams)
   - Team member list with role badges
   - Invite flow (email input + role select)
7. For local/solo mode: teams work with local userId only. In cloud mode: teams use auth provider userId.

Tests must pass. This builds on F2 (audit trail) for the activity feed.
```

### Step 3: Prompt 1 — Per-Workspace Agent + Model Config + UI
File: `D:\Projects\MS Claw\waggle-poc\UAT 3\PROMPTS-POST-FIX.md` (first prompt)

### Step 4: Prompt 2 — Virtual Workspace Storage + FileStore
File: `D:\Projects\MS Claw\waggle-poc\UAT 3\PROMPTS-POST-FIX.md` (second prompt)

### Step 5: P1-6 — Onboarding Wizard (3-5 days)
Prompt for Claude Code:
```
Build a first-run onboarding wizard for Waggle that makes new users say "wow" within 60 seconds.

## Context
Waggle has 268 capabilities (53 tools + 157 connector tools + 58 skills), 29 connectors, 8 personas, 14 slash commands, 7 workspace templates, and a 15,784-package marketplace. A new user currently sees a blank SPA with no guidance. The breadth is completely hidden.

## What to Build

### Onboarding Wizard Component
Location: app/src/components/onboarding/OnboardingWizard.tsx

A multi-step, full-screen overlay that appears on first launch (check localStorage or server flag). Must feel premium — smooth transitions, clean design, NOT a boring form wizard.

### Step 1: Welcome (3 seconds)
- Waggle logo + tagline: "Your AI team that remembers everything"
- Animated: show icons flowing in representing tools, memory, workspaces
- Auto-advance after 3 seconds or click to skip
- Vibe: like the first time you open a new iPhone

### Step 2: Meet Your Agent (10 seconds)
- "I'm your AI agent. I can research, draft, plan, code, and remember."
- Show 5 key capability icons with labels: Research, Draft, Plan, Code, Remember
- Small text: "268 capabilities • 29 integrations • persistent memory"
- This is the "holy shit this is big" moment — the NUMBER matters
- Button: "Let's set up"

### Step 3: API Key Setup (30 seconds)
- "First, I need an AI brain. Paste your Anthropic API key:"
- Input field with paste button and "Get a key →" link to console.anthropic.com
- Validate key in real-time (call /health or test endpoint)
- Green checkmark animation when valid
- "Or use another provider:" collapsible section with OpenAI, Google options
- Skip option: "I'll do this later" (but show warning that AI features won't work)
- On success: store in vault via POST /api/vault

### Step 4: First Workspace (20 seconds)
- "What are you working on?"
- Show 7 workspace templates as beautiful cards with icons:
  - Sales Pipeline 🎯
  - Research Project 🔬
  - Code Review 💻
  - Marketing Campaign 📣
  - Product Launch 🚀
  - Legal Review ⚖️
  - Agency Consulting 🏢
- Plus "Blank workspace" option
- User picks one → auto-creates workspace with template settings (persona, connectors, starter memory)
- Workspace name input with smart default from template

### Step 5: Choose Your Persona (10 seconds)
- "How should I work in this workspace?"
- Show personas relevant to chosen template (pre-selected from template)
- 8 persona cards with avatar, name, description, key tools
- Quick select, not overwhelming — template default is pre-highlighted

### Step 6: First Message — The "Wow" Moment (instant)
- Wizard disappears, user lands in their new workspace
- Chat input is pre-focused with suggested first message based on template:
  - Sales: "Research the top 5 competitors in [my industry]"
  - Research: "Help me design a literature review on [my topic]"
  - Code: "Read my project and tell me what you see"
  - Marketing: "Draft a campaign brief for [my product launch]"
  - Product: "Help me write a PRD for [my next feature]"
  - Legal: "Draft a standard NDA template"
  - Agency: "Set up client workspaces for my 3 biggest accounts"
- Agent IMMEDIATELY starts working (auto_recall + response)
- User sees: memory recall animation → tool cards → streaming response
- THIS is the moment they get hooked

### Step 7: Quick Tips (dismissible tooltip layer)
After first response, show 3 floating tips (one at a time, dismissible):
1. Point at slash command area: "Type / for 14 powerful commands"
2. Point at memory panel: "I remember everything — try asking about past work"
3. Point at workspace switcher: "Create workspaces to organize different projects"

## Technical Requirements

### State Management
- Track onboarding progress in localStorage: { completed: boolean, step: number, workspaceId: string }
- Also store on server: POST /api/settings with { onboardingCompleted: true }
- If onboarding not completed, show wizard on app load
- "Show onboarding again" option in Settings for re-run

### API Calls During Wizard
- Step 3: POST /api/vault (store API key) + GET /health (validate)
- Step 4: POST /api/workspaces (create from template)
- Step 5: PUT /api/workspaces/:id (set persona)
- Step 6: POST /api/chat (first message — critical this works!)

### Design Requirements
- Use existing shadcn/ui components (Button, Card, Input, Dialog)
- Smooth step transitions (fade or slide, not jump)
- Progress indicator (dots or bar) at top
- "Skip setup" link always visible but subtle
- Dark theme by default (matches app), respect system preference
- Mobile responsive (even if desktop-first)
- Total time: under 90 seconds for a motivated user, under 30 seconds for "skip to chat"

### Files to Create
- app/src/components/onboarding/OnboardingWizard.tsx — main wizard
- app/src/components/onboarding/steps/ — individual step components
- app/src/components/onboarding/OnboardingTooltips.tsx — post-wizard tips
- app/src/hooks/useOnboarding.ts — state management

### Files to Modify
- app/src/App.tsx — conditionally render OnboardingWizard
- app/src/providers/ — add onboarding context if needed
- packages/server/src/local/routes/ — add onboarding status to settings

### Inspiration
- Linear's onboarding (clean, fast, opinionated)
- Notion's first-run (template selection)
- Superhuman's speed trial (forced value demonstration)
- Arc browser's intro (personality, delight)

## Rules
- Must feel PREMIUM — this is the first impression
- Do NOT make it optional to skip API key if the user hasn't set one before
- The first AI response in Step 6 MUST work — if it fails, the entire onboarding fails
- Test the full flow end-to-end
- Build passes: npm run build
- Tests pass: npx vitest run
```

### Step 6: Build + Verify
```
npm run build && npx vitest run
```

### Step 7: RE-TEST (3 focused rounds)

---

## Re-Test Plan (3 Rounds)

### Round 1: Infrastructure + AI Verification (30 min)
Prompt for Claude Code:
```
Waggle functional re-test Round 1: Infrastructure + AI.
Server: localhost:3333. Use WAGGLE_AUTO_APPROVE=1 env var.

PRE-FLIGHT (stop if any fail):
1. GET /health → verify llm.reachable: true, health: healthy
2. POST /api/chat with "Say hello in 3 words" → verify real AI response (not echo, not error)
3. Create workspace "retest-isolation-a", save memory frame "Secret Alpha Data"
4. Create workspace "retest-isolation-b", search for "Secret Alpha" → must NOT find it (isolation test)
5. If isolation fails, STOP and report

SLASH COMMANDS (all 14):
Test each via POST /api/chat. For LLM-dependent ones (/draft, /research, /plan, /decide, /spawn, /review): verify they produce real AI output, not error or template.

MEMORY:
- Save 5 frames across 3 workspaces, verify isolation
- Search within workspace, verify scoping
- Test deduplication (save same content twice → should not create duplicate)
- Test DELETE endpoint
- Test knowledge graph endpoint

PERSONA MINI-JOURNEYS (5 chat messages each):
- Ana (PM): /catchup → ask about priorities → /draft PRD → save to memory → verify recall
- Marko (Dev): ask to read a file → search codebase → run a command → git status
- Mia (Agency): create client workspace → chat about client → check costs → export

Write results to: UAT 3/RETEST-R1-INFRASTRUCTURE.md
Artifacts to: UAT 3/artifacts-retest/
Score: X/100 with breakdown
```

### Round 2: UX + Visual Retest (20 min)
Prompt for Claude Code:
```
Waggle UX re-test Round 2: Visual and design verification via Playwright.
Server: localhost:3333 (API) + localhost:1420 (Vite frontend, start with: cd app && npm run dev)

SCREENSHOTS (all at 1920x1080 + 1024x768, dark + light themes):
- Home/Chat view (empty + with messages)
- Memory view (with frames + search results)
- Events view
- Capabilities view
- Cockpit dashboard
- Mission Control
- Settings (all tabs)
- Marketplace

VERIFY FIXES:
- [ ] font-mono removed from non-code elements (check sidebar, headers, dashboard cards, context panel)
- [ ] Loading skeletons in SettingsView, MemoryBrowser, EventsView
- [ ] Empty states have CTAs
- [ ] No "Wave 8A" placeholder text
- [ ] AlertDialog instead of window.confirm()
- [ ] Responsive sidebar at 1024px
- [ ] Auto-recall ToolCard visible in chat
- [ ] Console: zero errors on all views

COMPARE to previous audit (UAT 2/VISUAL-UX-AUDIT-2026-03-21.md):
- Previous score: 5.5/10 visual, 6/10 usability, 4/10 addiction, 3.5/10 production
- Give new scores with justification

Write results to: UAT 3/RETEST-R2-UX.md
Screenshots to: UAT 3/screenshots-retest/
```

### Round 3: Advanced Features + Team (30 min)
Prompt for Claude Code:
```
Waggle advanced re-test Round 3: Team simulation, agent fleet, audit trail, storage.
Server: localhost:3333. Use WAGGLE_AUTO_APPROVE=1 env var.

TEAM SIMULATION:
1. Create team "Engineering" with POST /api/teams
2. Create 3 workspaces linked to team
3. Invite 2 mock members with different roles
4. Verify: member can access team workspace, viewer has read-only
5. Check team activity feed (GET /api/teams/:id/activity)

AUDIT TRAIL:
1. Perform 10 actions (chat, memory write, workspace create, etc.)
2. GET /api/events → verify all 10 actions logged
3. Filter by workspace, by type, by date range
4. Check event stats endpoint
5. Verify SSE live event stream

PER-WORKSPACE AGENTS:
1. Create 3 workspaces with different models (Sonnet, Haiku, Opus)
2. Send chat to each → verify correct model used (check response metadata)
3. Check fleet status (GET /api/fleet) → 3 active agents
4. Kill one agent → verify fleet shows 2
5. Send chat to killed workspace → verify new agent spawns
6. Check per-workspace cost tracking

VIRTUAL STORAGE:
1. Create workspace WITHOUT directory (virtual)
2. Ask agent to write a file → verify it goes to managed storage, NOT homedir
3. GET /api/workspaces/:id/files → verify file listed
4. Read file back via API
5. Check storage stats endpoint
6. Create workspace WITH directory (linked) → verify file tools use linked dir

STRESS:
1. Send 3 concurrent chat messages to 3 different workspaces → all complete
2. Create 10 workspaces rapidly → all succeed
3. Save 50 memory frames across 5 workspaces → isolation holds

Write results to: UAT 3/RETEST-R3-ADVANCED.md
Artifacts to: UAT 3/artifacts-retest/
Final score: X/100 with per-category breakdown
Compare to previous: 62/100 (offline) → new score
```

---

## How to Test Teams (Detailed)

Since local Waggle is single-user, team testing requires simulating multiple users:

### Option A: Multiple API tokens (simplest)
The team API should work with a single server. Create teams and members using different "userIds" (simulated). The local server doesn't have real auth, so the userId can be a parameter:
```
POST /api/teams { name: "Engineering", ownerId: "marko" }
POST /api/teams/:id/members { userId: "ana", role: "member" }
POST /api/teams/:id/members { userId: "sara", role: "viewer" }
```
Then test access control by passing userId in requests (if supported) or by checking that the API enforces roles.

### Option B: Docker multi-instance (realistic)
For real multi-user testing later:
1. Build Docker image of Waggle server
2. Run 3 instances sharing same SQLite DB (or PostgreSQL)
3. Each instance = different user
4. Test concurrent access, role enforcement, shared workspaces

### Option C: Cloud deployment (production-like)
1. Deploy to VPS/cloud with real auth (Clerk)
2. Create real user accounts
3. Test end-to-end with browser sessions

For NOW: Option A is sufficient. The team API should work regardless of auth backend — it just needs userId context.

---

## File Locations

| What | Where |
|------|-------|
| Bug fix status | This file (above) |
| Prompt 1 (agents + models + UI) | UAT 3/PROMPTS-POST-FIX.md |
| Prompt 2 (storage + FileStore) | UAT 3/PROMPTS-POST-FIX.md |
| Prompt for F2 (audit trail) | This file (Step 1) |
| Prompt for F3 (team CRUD) | This file (Step 2) |
| Re-test prompts (3 rounds) | This file (Step 6) |
| Previous UAT reports | UAT 2/*.md |
| Previous artifacts | UAT 2/artifacts-mega/, UAT 2/artifacts-r3/, UAT 2/artifacts-r4/ |
| Consolidated action plan (original) | UAT 3/CONSOLIDATED-ACTION-PLAN.md |
| Mega-UAT prompt template | UAT 3/MEGA-UAT-PROMPT.md |
