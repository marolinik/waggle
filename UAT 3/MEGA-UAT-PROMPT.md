# Waggle Mega-UAT: "Is This the Next Platform Event?"

## API KEY (configure first, delete after test)
[REDACTED — configure your own Anthropic API key in Settings > API Keys]

## Context
Previous UAT rounds found and fixed: echo mode bug, proxy auth, slash commands, workspace memory isolation, file tool scoping, message persistence. Owner says all are fixed. VERIFY FIRST before running full tests.

Waggle is positioning as **"The Operating System for AI Work"** — not another chatbot, not another copilot. An OS. With workspaces as filesystems, agents as processes, memory as persistent storage, connectors as drivers, slash commands as CLI, team collaboration as multi-user.

4 tiers: Solo (free/starter), Teams (collaboration), Business (department), Enterprise (governance/KVARK). For Business and Enterprise features that need infrastructure not present, CREATE MOCK DATA (fake team members, fake audit logs, fake KVARK results) to test the UI and flow even if backend isn't fully wired.

## Server
- API: localhost:3333
- Vite frontend: localhost:1420
- Desktop: Tauri app (if available, run `cd app && npm run tauri dev`)

## CRITICAL: Use Sub-Agents Aggressively
This is a 5-test mega-suite. You MUST use Task tool to run parallel sub-agents. Orchestrate, don't do everything yourself.

Recommended agent allocation:
- Agent 1-2: Test A (Zero to WOW) — onboarding + first impressions
- Agent 3-6: Test B (Day in Life) — one agent per persona
- Agent 7-8: Test C (OS Capabilities) — system-level testing
- Agent 9: Test D (UX Retest) — visual/design via Playwright
- Agent 10-11: Test E (Feature/QA Retest) — API + functional coverage
- Agent 12: Test F (Team Simulation) — multi-user collaboration
- Orchestrator (you): compile, score, write master report

---

## PHASE 0: Pre-flight Check (YOU, not sub-agent)

Before ANY testing:
1. Configure the API key in Waggle vault/settings
2. Restart the server if needed (kill port 3333, then: cd packages/server && npx tsx src/local/start.ts)
3. Verify: GET /health → llm.reachable: true
4. Verify: POST /api/chat with "Say hello in exactly 3 words" → get real AI response
5. Verify: /status slash command works in chat
6. Verify: memory search returns workspace-scoped results only
7. Verify: read_file resolves relative to workspace directory
8. If ANY of these fail, FIX THE CONFIG before proceeding (do NOT test with broken basics)

Also check if Tauri desktop builds: cd app && npm run tauri dev (if it doesn't build, skip desktop and note it)

---

## TEST A: "Zero to WOW" Journey (The First 10 Minutes)

### Philosophy
Every platform "moment" (ChatGPT, Claude Code, DeepSeek, Sora) had a specific instant where users said "holy shit." We need to find Waggle's moment — or discover it doesn't exist yet.

### Scenario A1: Brand New User — Web
Simulate a person who just heard about Waggle and opened localhost:1420 (or :3333) for the first time.

Steps (test each, rate 1-10 for "wow factor"):
1. **First Load** — What do they see? Is it intimidating or inviting? Screenshot.
2. **Onboarding** — Is there a wizard? How many clicks to first useful action? Time it.
3. **First Workspace** — Create "My First Project". How intuitive? Screenshot.
4. **First Message** — Type "Help me plan a product launch for a new AI tool". Rate the response.
5. **First Memory** — Does the agent auto-save anything? Can they find it later?
6. **First Tool Use** — Ask "Search the web for top AI product launches in 2025". Does it work?
7. **First Wow** — At what point (if ever) did the experience exceed expectations?
8. **First Confusion** — At what point did the user get lost or confused?
9. **First Frustration** — At what point did something not work as expected?
10. **10-Minute Mark** — After 10 minutes, what has the user accomplished? Screenshot final state.

### Scenario A2: Power User from ChatGPT/Claude — Web
Simulate someone who uses Claude.ai daily and is evaluating Waggle.

Steps:
1. **Comparison Bias** — First impression vs Claude.ai. What's better? What's worse? Screenshot.
2. **Feature Discovery** — How quickly do they find: workspaces, memory, personas, marketplace?
3. **Memory Advantage** — Send 5 messages about a project. Close session. Reopen. Does it remember? How does this compare to Claude Projects?
4. **Multi-Workspace** — Create 3 workspaces (Marketing, Engineering, Legal). Switch between them. Is context truly isolated?
5. **Command Power** — Try /help, /status, /draft, /research, /plan. Are these more powerful than Claude?
6. **Agent vs Assistant** — Does Waggle feel like an AGENT (proactive, autonomous) or just an ASSISTANT (reactive)?

### Scenario A3: First Load — Desktop (Tauri)
If Tauri builds:
1. Does the desktop app feel native? Screenshot.
2. How does it compare to Claude Desktop, ChatGPT Desktop, Cursor?
3. Any advantages over web (speed, offline, system integration)?

### Deliverable
Rate each scenario 1-10 on: Wow Factor, Time to Value, Clarity, Stickiness
Identify THE "holy shit" moment (or document its absence)

---

## TEST B: "Day in the Life" Simulation (Full Workday, 5 Personas)

### Philosophy
Don't test features — test WORKFLOWS. A real person doesn't think "I'll test the memory API." They think "I need to prepare for my 10am meeting." Test through that lens.

### PERSONA B1: Ana — Product Manager (Solo tier)

**8:00 AM — Morning Prep**
- Open Waggle, go to "Product" workspace
- /catchup — "What happened since yesterday?"
- Check memory — any decisions from last week's sprint?
- Ask: "What are our top 3 priorities this sprint?"

**9:00 AM — Standup Prep**
- Ask agent to summarize progress on each priority
- /draft standup update — for sharing with team
- Save the update to memory

**10:00 AM — PRD Writing**
- "Draft a PRD for adding AI-powered search to our product"
- Iterate: "Add a section on competitive analysis"
- Iterate: "Make the success metrics more specific"
- Ask agent to save final version as DOCX

**11:00 AM — Decision Making**
- /decide "Should we build or buy the search feature?"
- Ask agent to research: "What are the top embeddable search APIs?"
- Make a decision, save rationale to memory

**2:00 PM — Sprint Planning**
- /plan "Next sprint: implement AI search MVP"
- Break into tasks with estimates
- Assign tasks (even if team features are stubs, test the flow)

**4:00 PM — End of Day**
- /status — what was accomplished today?
- Ask agent: "What should I focus on tomorrow?"
- Check: does memory have everything from today's work?

**Measure**: How many of these 15+ actions completed successfully? Quality of each output? Total "productive time" vs "fighting the tool" time?

### PERSONA B2: Marko — Full-Stack Developer (Solo tier)

**8:00 AM — Code Review**
- Open "Engineering" workspace
- Ask: "Read the file packages/server/src/routes/chat.ts and summarize the main functions"
- Ask: "Search for all TODO comments in the codebase"
- Ask: "What's the git log for the last 5 commits?"

**9:00 AM — Bug Fix**
- "I need to fix a bug where workspace deletion fails with EBUSY"
- Ask agent to find relevant code: "Search for workspace delete handler"
- Ask: "What's the best approach to fix SQLite file locking?"
- Ask agent to write a fix (even if it can't save to repo, test the code generation)

**10:00 AM — New Feature**
- "I want to add a /changelog command that shows recent git history"
- Ask agent to: read existing command structure, propose implementation, generate code
- /spawn code-reviewer — have sub-agent review the generated code

**2:00 PM — Testing**
- Ask: "Run the test suite and tell me what's failing"
- Ask: "Write a test for the new /changelog command"
- Ask about test coverage

**4:00 PM — Documentation**
- "Update the README to include the new /changelog command"
- Generate DOCX of today's development summary
- Check: did memory capture architecture decisions?

### PERSONA B3: Sara — Marketing Manager (Teams tier)

**8:00 AM — Campaign Research**
- Open "Marketing" workspace
- "Research the top 5 AI productivity tools launching in 2025"
- "Compare their pricing and positioning"
- Save findings to memory

**9:00 AM — Content Creation**
- /draft "Blog post: Why AI agents are replacing AI assistants"
- Iterate: "Make it more provocative, add data points"
- /draft "LinkedIn post summarizing the blog"
- /draft "Twitter thread (5 tweets) about the key insights"

**10:00 AM — Team Collaboration** (Teams tier)
- Share campaign brief with team workspace
- Ask: "What did the team discuss about the campaign?"
- Assign content review task to team member

**2:00 PM — Competitive Analysis**
- "Analyze how Claude.ai, ChatGPT, and Notion AI position themselves"
- "Create a positioning matrix for Waggle vs competitors"
- Save as memory + generate DOCX

**4:00 PM — Reporting**
- "Summarize today's marketing output"
- "What content do we need to create this week?"
- Export workspace for sharing

### PERSONA B4: Nikola — Legal / Compliance (Enterprise tier)

**8:00 AM — Confidential Case Work**
- Create encrypted workspace "Case-2024-0847"
- Ask: "Draft a non-disclosure agreement template"
- Test vault: store sensitive client details
- Verify: audit trail shows all actions
- Verify: workspace content doesn't leak to other workspaces

**10:00 AM — Research**
- /research "EU AI Act compliance requirements for AI agents"
- "What are the data residency requirements?"
- "Draft a compliance checklist for our product"
- Save all findings with source citations

**2:00 PM — Document Review**
- Provide a (mock) contract text, ask agent to review for risks
- Ask: "Flag any clauses that could be problematic"
- Generate marked-up version as DOCX

**Enterprise Features (mock if needed)**:
- Test KVARK integration (enterprise search) — even if stubbed, test the UI flow
- Test permission gates — can agent be restricted from certain tools?
- Test audit trail — is every action logged?

### PERSONA B5: Team Lead — Cross-functional (Teams/Business tier)

**8:00 AM — Team Briefing**
- Open "All Projects" or Mission Control view
- "Give me a status update across all workspaces"
- Check: does each workspace summary show recent activity?

**9:00 AM — Task Management**
- Create tasks for team members across workspaces
- Monitor progress (even simulated)
- /spawn analyst "Research Q4 market trends" — test sub-agent delegation

**10:00 AM — Multi-Agent Orchestration**
- Spawn 3 sub-agents for parallel research tasks
- Monitor their progress
- Collect and synthesize their results

**2:00 PM — Reporting**
- "Generate a weekly team report across all workspaces"
- Include: cost per workspace, tasks completed, decisions made
- Export as DOCX

**4:00 PM — Governance**
- Review cost dashboard — who's spending what?
- Check approval gate history
- Review audit trail for security

### Scoring per persona:
- Tasks attempted vs completed (%)
- Quality of AI output (1-10)
- Time fighting tool vs productive work (ratio)
- "Would they come back tomorrow?" (1-10)
- "Would they tell a colleague?" (1-10)
- "Would they pay $30/month?" (yes/no/how much)

---

## TEST C: "OS Capabilities" Deep Dive

### Philosophy
If Waggle is an OS, test it like an OS. Every OS has: process management, memory management, filesystem, drivers, shell, permissions, networking.

### C1: Process Management (Agents as Processes)
- Spawn 3 sub-agents simultaneously
- Monitor their status (running/completed/failed)
- Kill one mid-execution
- Check: do the other two continue?
- Test: max concurrent agents, queue behavior

### C2: Memory Management
- Save 50 memories across 5 workspaces (10 each, varied types)
- Search within workspace — verify isolation
- Search across workspaces — should this work? Does it?
- Memory consolidation — trigger weaver, verify compaction
- Memory deduplication — save same fact twice, does it dedup?
- Knowledge graph — are entities extracted? Are relations correct?
- Memory aging — do old memories still surface when relevant?

### C3: Filesystem (Workspaces)
- Create workspace with directory binding
- Read files from workspace directory
- Search files within workspace scope
- Write files (via agent) — does it respect workspace boundary?
- Workspace templates — create from each template, verify setup
- Workspace groups — organize, filter, switch
- Workspace export — full fidelity? Does import work?

### C4: Drivers (Connectors)
- List all connectors — how many are configurable?
- For any that can be configured without external auth: test end-to-end
- For others: verify the UI flow exists (connect button, OAuth redirect, config form)
- Test: GitHub connector (if gh CLI is available)
- Test: filesystem connector
- Test: any connector that works with just an API key

### C5: Shell (Commands & CLI)
- Test EVERY slash command: /help, /catchup, /now, /research, /draft, /decide, /review, /spawn, /skills, /status, /memory, /plan, /focus
- For each: does it work? Is output useful? Is it faster than plain chat?
- Command chaining: "/research X" then "/draft based on research"
- Command in wrong context: /spawn in Solo tier — graceful error?

### C6: Proactivity (Cron, Heartbeat, Background)
- Create a cron job: "Every morning, summarize yesterday's activity"
- Create a cron job: "Every hour, check if any workspace has pending tasks"
- Trigger cron manually — does it produce useful output?
- Test: does the agent proactively suggest things? Or only respond?

### C7: Governance & Security
- Approval gates: ask agent to do something "dangerous" (delete a file, run rm command)
- Does it ask for permission? Or just do it?
- Audit trail: is every tool call logged?
- Vault: store a secret, verify encryption, retrieve it
- Tier gating: do Enterprise features show proper "upgrade" messages in lower tiers?

---

## TEST D: UX Retest (Visual/Design via Playwright)

### Philosophy
Retest everything from the Visual/UX Audit (VISUAL-UX-AUDIT-2026-03-21.md) to verify fixes.

### Using Playwright:
1. Install Playwright if not already: npx playwright install chromium
2. Take screenshots of EVERY view at 1920x1080, 1280x800, 1024x768
3. Test both dark and light themes

### Views to screenshot and evaluate:
- Initial load / login
- Home / default view
- Chat view (empty, with messages, with tool cards, with streaming)
- Memory view (empty, with frames, with search results)
- Events view
- Capabilities view
- Cockpit dashboard
- Mission Control
- Settings (all tabs: General, Models, Permissions, Team, Vault, Theme)
- Marketplace (browse, search, detail)
- Onboarding wizard (if accessible)
- Context panel (expanded, collapsed)
- Global search (Ctrl+K)
- Error states (network error, LLM error, empty workspace)

### Evaluate each view (1-10):
- Visual polish (does it look professional?)
- Typography (readable? consistent? NOT monospace everywhere?)
- Spacing/layout (balanced? cramped? too sparse?)
- Color system (consistent? accessible? beautiful?)
- Loading states (skeleton? spinner? empty?)
- Error states (helpful? actionable? friendly?)
- Responsiveness (1920 → 1024 — does it degrade gracefully?)
- Dark/light consistency (both themes polished equally?)

### Specific checks from previous audit:
- [ ] Monospace font replaced with proper sans-serif for body text?
- [ ] Empty states have call-to-action (not just "No items")?
- [ ] Error messages are user-friendly (not raw technical errors)?
- [ ] Loading skeletons exist (not blank screens)?
- [ ] Console errors eliminated?
- [ ] Sidebar navigation polished?
- [ ] Status bar informative?

---

## TEST E: Feature/QA Retest (API + Functional)

### Philosophy
Rerun all previous UAT findings to verify fixes. Every bug from rounds 1-4 must be retested.

### E1: Previous Bug Retests
From FUNCTIONAL-JOURNEY-AUDIT-2026-03-21.md and RETEST-AFTER-FIX:
- [ ] F1: Export drops memory frames → FIXED?
- [ ] F2: Proxy health check auth → FIXED? (already verified in R3)
- [ ] B1: Workspace memory isolation → FIXED?
- [ ] C1: search_content filesystem scoping → FIXED?
- [ ] C2: Result truncation → FIXED?
- [ ] C3-C5: Slash command fallbacks → FIXED?
- [ ] H1: File tools workspace directory → FIXED?
- [ ] H2: /spawn fails → FIXED?
- [ ] H3: Approval gates not enforced → FIXED?
- [ ] M3: /api/costs 404 → FIXED?
- [ ] F18: Workspace delete EBUSY → FIXED?

### E2: API Endpoint Full Sweep
- Test ALL 113+ endpoints from api-endpoint-audit.md
- For each: status code, response shape, data correctness
- CRUD workflows: workspace, memory, marketplace, cron, vault, tasks
- New: test any new endpoints added since last audit

### E3: Test Suite
- Run npx vitest run — report total/passed/failed/skipped
- Compare to baseline (4,332 from last run)
- If any failures: document them

---

## TEST F: Team Collaboration Simulation

### Philosophy
This is the most important differentiator. NO competitor does team AI well. If Waggle nails this, it's a category-defining feature.

### F1: Team Setup
- Create a "team" with 3 simulated members (can be 3 workspaces that represent team members, or use the team API)
- Set up shared workspace "Q1-Campaign"
- Verify: each member can see shared workspace

### F2: Collaborative Workflow
Simulate a cross-functional team:
- PM (Ana): creates project brief, sets priorities
- Dev (Marko): picks up technical tasks, updates progress  
- Marketing (Sara): creates content, shares for review

Test:
- Can PM's decisions be seen by Dev and Marketing?
- Can Dev's code updates be seen by PM?
- Does the agent in each workspace know about team activity?
- Is there a shared timeline/event stream?

### F3: Tier Simulation
For Business and Enterprise features not fully implemented:
- Create mock data that simulates: 10 team members, 20 workspaces, 100 tasks
- Insert mock audit logs, mock KVARK search results, mock cost data
- Test the UI with this realistic data volume
- Does the Cockpit dashboard handle 20 workspaces?
- Does Mission Control handle 10 agents?
- Does the cost dashboard show department-level rollups?

### F4: Governance at Scale
- Permission levels: who can see what workspace?
- Budget controls: can a team lead set spending limits?
- Audit: can an admin see all team activity?
- Data isolation: can one department see another's workspaces?

---

## DELIVERABLES

### Master Report: UAT 2/MEGA-UAT-REPORT-2026-03-22.md

Sections:
1. **Pre-flight Check Results** — did all basics pass?
2. **Test A: Zero to WOW** — per-scenario results, wow moments, confusion points
3. **Test B: Day in the Life** — per-persona full results with completion %, quality, addiction scores
4. **Test C: OS Capabilities** — system-level test results
5. **Test D: UX Retest** — visual comparison with previous audit, screenshots
6. **Test E: Feature/QA Retest** — bug verification, API sweep, test suite
7. **Test F: Team Simulation** — collaboration test results
8. **Tier Readiness Matrix** — Solo/Teams/Business/Enterprise readiness per feature
9. **The "Holy Shit" Moments** — what genuinely impressed, what's missing
10. **Addiction Scorecard** — per persona, would they pay? How much?
11. **Competitive Position** — feature-by-feature vs ChatGPT, Claude.ai, Cursor, Notion AI, Copilot Workspace
12. **The Gap to "Platform Event"** — what needs to happen for this to be newsworthy
13. **Prioritized Roadmap** — P0/P1/P2/P3 with effort estimates
14. **Final Score** — X/100 with breakdown

### Artifacts: UAT 2/artifacts-mega/
- Per-test detailed reports (test-a.md, test-b-ana.md, test-b-marko.md, etc.)
- Screenshots (all views, both themes, 3 viewports)
- API response samples
- Team simulation data

### Screenshots: UAT 2/screenshots-mega/
- Organized by view and theme

## RULES
- USE SUB-AGENTS for everything. This is a 12-agent operation minimum.
- DO NOT modify source code UNLESS it's inserting mock data for Business/Enterprise testing
- Mock data insertions must be clearly marked and reversible
- Be BRUTALLY honest — if something is mediocre, say mediocre
- Compare EVERYTHING to the best in class (ChatGPT, Claude, Cursor)
- Test as a REAL USER, not as a developer
- The question is not "does the API return 200" but "would a human pay for this"
- If you find a new bug, document it and keep testing (don't stop)
- Total runtime target: complete all tests, take your time, quality over speed
