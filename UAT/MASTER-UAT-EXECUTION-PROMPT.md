# WAGGLE — MASTER UAT EXECUTION PROMPT
## Pre-Production Full-Spectrum User Acceptance Testing
### Multi-Agent Automated + Human-Simulated Test Campaign

**Version**: 1.0 — Pre-Production Gate
**Date**: 2026-03-20
**Branch**: `phase8-wave-8f-ui-ux`
**Current State**: CONDITIONAL GO (per `docs/production-readiness/09-LAUNCH_RECOMMENDATION.md`)
**Confidence Score**: 6.9/10 — 3,895 tests passing, 8 CRITICAL pre-launch fixes required
**Scope**: Full UAT sweep across all tiers (Solo, Teams, KVARK/Sovereign AI), all personas,
  all sectors, all user journeys — automated where possible, persona-simulated where required

---

## CONTEXT FOR THE EXECUTING AGENT

You are executing a pre-production UAT campaign for **Waggle** — a workspace-native AI agent
platform built on Tauri 2.0 (Rust + WebView2), React/TypeScript, Fastify, SQLite + FTS5 +
sqlite-vec, and the Anthropic Claude Agent SDK.

**What is NOT yet live** (do not test, flag as deferred):
- KVARK API integration (client exists in `packages/server/src/kvark/`, server not wired into
  the running local instance — KVARK tier tests run in simulation mode only)
- Windows Store publishing certificate (installer builds, Store publishing is blocked)

**What IS fully live and under test**:
- Solo mode: full agent loop, memory, connectors, marketplace, personas, cron, capabilities
- Teams mode: multi-user Fastify + PostgreSQL + Redis + Clerk + WebSocket presence
- Desktop app: Tauri 2.0 Windows installer (8.2MB MSI, built and signed pending cert)
- Web frontend: served from `app/dist/` at `localhost:3333`
- 15,238+ marketplace packages (skills, MCP, plugins across 61 sources)
- 29 native connectors + Composio (250+)

**Repo root**: `D:\Projects\MS Claw\waggle-poc\`
**Server entry**: `packages/server/src/local/start.ts`
**Desktop entry**: `app/src-tauri/`
**Tests (unit)**: `npx vitest run`
**Tests (E2E)**: `npx playwright test`
**Existing E2E baseline**: `tests/e2e/user-journeys.spec.ts` (J1-J12)
**Existing UAT docs**: `UAT/00-methodology.md` through `UAT/16-chrome-devtools-inspection.md`
**Playwright config**: `playwright.config.ts` — baseURL `http://localhost:3333`, Chromium only

---

## AGENT TEAM ARCHITECTURE

This UAT campaign is executed by a coordinated team of 8 specialized agents. Each agent
owns a defined test domain and reports to the Orchestrator. Sub-agents operate in parallel
where their domains are independent; sequentially where shared state is required.

```
┌──────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT (AG-0)                   │
│  Coordinates all sub-agents, aggregates findings,             │
│  produces the final UAT Report and Issue Register             │
└────────────────┬─────────────────────────────────────────────┘
                 │
     ┌───────────┼──────────────┬─────────────┬────────────┐
     │           │              │             │            │
     ▼           ▼              ▼             ▼            ▼
  [AG-1]      [AG-2]         [AG-3]        [AG-4]       [AG-5]
  SHELL       AGENT          PERSONA       SECTOR        BENCH
  TESTER      TESTER         TESTER        TESTER       MARKER
     │
     ├── [AG-6]  MEMORY & CONTINUITY TESTER
     ├── [AG-7]  UX & ERGONOMICS AUDITOR
     └── [AG-8]  KVARK / SOVEREIGN AI VALIDATOR
```

### AG-0: ORCHESTRATOR
Mandate: Session control, agent dispatching, conflict resolution, final report assembly.
Does NOT: Write test code or run scenarios directly.
Outputs: `UAT/artifacts/MASTER-REPORT.md`, updated `UAT/15-results-template.md`

### AG-1: SHELL TESTER (Browser Automation)
Mandate: Extend `tests/e2e/user-journeys.spec.ts` with full coverage of every clickable
element, every navigation path, every form, every modal, every sidebar state.
Tool: Playwright (existing config in `playwright.config.ts`), Chrome DevTools MCP
Input docs: `UAT/16-chrome-devtools-inspection.md`, `UAT/02-core-loop-tests.md`
Outputs: Extended `user-journeys.spec.ts`, screenshots in `UAT/artifacts/screenshots/`

### AG-2: AGENT BEHAVIOR TESTER
Mandate: Validate agent quality — ambiguity handling, tool transparency, approval gates,
sub-agent coordination, persona behavior, loop safety, graceful failure.
Input docs: `UAT/05-agent-behavior.md`, `UAT/10-trust-transparency.md`
Outputs: `UAT/artifacts/agent-scorecard.md`

### AG-3: PERSONA TESTER
Mandate: Execute all 8 canonical personas (UAT/01-personas.md) plus 4 new sector personas
defined below through their complete journeys. Simulates realistic human behavior.
Input docs: `UAT/01-personas.md`, `UAT/13-persona-scenarios.md`
Outputs: Per-persona results in `UAT/artifacts/persona-results/`

### AG-4: SECTOR TESTER
Mandate: Execute sector-specific enterprise scenarios across legal, banking, telco, government,
SME, marketing agency, AI consulting, and startup through Waggle's full capability surface.
Outputs: `UAT/artifacts/sector-results/`

### AG-5: BENCH MARKER
Mandate: Run identical tasks in Waggle vs. 5 competitors. Score and document delta.
Competitors: Claude Code (CLI), Claude Cowork/OpenClaw, Perplexity Computer, GenSpark, ChatGPT Desktop
Input docs: `UAT/12-competitive-benchmark.md`
Outputs: `UAT/artifacts/competitive-benchmark.md`

### AG-6: MEMORY & CONTINUITY TESTER
Mandate: Validate memory persistence, cross-session continuity, workspace isolation,
personal vs. workspace mind separation, knowledge graph accuracy, habit compounding.
Input docs: `UAT/04-memory-continuity.md`, `UAT/11-habit-formation.md`
Outputs: `UAT/artifacts/memory-report.md`

### AG-7: UX & ERGONOMICS AUDITOR
Mandate: Systematically audit every screen and interaction for UX quality.
Scores against the 8 emotional dimensions from `UAT/00-methodology.md`.
Input docs: `UAT/03-first-contact.md`, `docs/production-readiness/02-UX_AUDIT.md`
Outputs: `UAT/artifacts/ux-audit.md`

### AG-8: KVARK / SOVEREIGN AI VALIDATOR
Mandate: Validate Waggle's readiness for enterprise/government sovereign AI deployment.
All tests run in simulation mode (KVARK API not live in current build).
Input docs: `docs/kvark-http-api-requirements.md`, `docs/plans/2026-03-12-kvark-integration-contract.md`
Outputs: `UAT/artifacts/kvark-sovereign-readiness.md`

---

## PRE-FLIGHT CHECKLIST

Execute in order before dispatching any sub-agent:

```bash
# 1. Confirm server is up
curl -s http://localhost:3333/health | jq .

# 2. Confirm frontend is served
curl -s http://localhost:3333/ | grep -c "waggle"

# 3. Confirm unit test suite is green
cd "D:\Projects\MS Claw\waggle-poc"
npx vitest run --reporter=verbose 2>&1 | tail -20
# Expected: ~3,895 tests, 0 failures

# 4. Confirm E2E baseline passes
npx playwright test tests/e2e/user-journeys.spec.ts --reporter=line
# Expected: J1-J12 passing (or documented skip reasons)

# 5. Confirm known CRITICAL issues status
# Re-check all 8 issues from docs/production-readiness/09-LAUNCH_RECOMMENDATION.md:
# [ ] CORS origin: true — fixed or still open?
# [ ] CSP unsafe-eval + unsafe-inline — fixed or still open?
# [ ] OAuth refresh tokens plaintext — fixed or still open?
# [ ] Leaked API key in branch phase6-capability-truth — revoked?
# [ ] Zero React error boundaries — fixed or still open?
# [ ] Streaming loading indicator invisible CSS — fixed or still open?
# [ ] SplashScreen wrong Direction D palette — fixed or still open?
# [ ] Rate-limit retry infinite loop — fixed or still open?
```

If server is not running, start it:
```bash
cd packages/server && npx tsx src/local/start.ts --skip-litellm
```

---

## AG-1: SHELL TESTER — FULL BROWSER AUTOMATION SPEC

AG-1 extends `tests/e2e/user-journeys.spec.ts`. Existing tests J1-J12 are the baseline.
All new tests follow the established helper/pattern conventions in that file.
Add tests J13 through J25 as new `test()` blocks in the same file.

### J13: Onboarding Flow — Complete First-Run Path
```
Prerequisites: Clear or mock config to force fresh onboarding state.

Steps:
1. Navigate to localhost:3333
2. Verify onboarding overlay appears (fixed, z-[1000])
3. Step 1 — Enter API key: verify validation rejects invalid key
4. Step 1 — Enter valid key format: verify Next button enables
5. Step 2 — Name workspace: verify empty state blocked, character limit
6. Step 3 — Starter skills: verify ≥ 3 skills shown with install toggles
7. Step 4 — Memory import: verify ChatGPT + Claude import options visible
8. Complete wizard: verify main AppShell renders (no overlay)
9. Verify new workspace name matches entry from Step 2
10. Verify: on refresh, onboarding does NOT reappear

Checkpoints:
- [ ] Each step validates before allowing Next
- [ ] Back navigation preserves entered values
- [ ] Completion creates workspace and routes to workspace home
- [ ] Post-onboarding: no onboarding overlay on page refresh
```

### J14: Workspace Create, Name, Switch, Isolate
```
Steps:
1. Click "Create Workspace" in sidebar
2. Enter name: "Test Legal Office Q2"
3. Confirm — verify workspace appears in sidebar list immediately
4. Open workspace switcher — verify both workspaces listed
5. Switch to new workspace — verify workspace home renders with correct name
6. Type a message in the new workspace chat
7. Switch to original workspace — verify original chat content preserved
8. Switch back to "Test Legal Office Q2" — verify message still present

Checkpoints:
- [ ] Create dialog renders correctly
- [ ] New workspace visible in sidebar without full page reload
- [ ] Switching preserves all chat history per workspace
- [ ] Workspace home shows correct workspace name
- [ ] Zero cross-contamination between workspaces
```

### J15: Chat — Full Send/Receive Cycle (Mock LLM Mode)
```
Prerequisites: Server running with --skip-litellm

Steps:
1. Navigate to Chat view in a workspace
2. Click textarea — verify auto-focus
3. Type a multi-sentence message
4. Press Enter (or click Send)
5. Verify user message appears in conversation immediately
6. Verify loading/streaming indicator appears (CRITICAL: this was broken — CSS classes)
7. Verify agent response renders (mocked or real depending on server mode)
8. Verify tool event cards appear in Events view if tools were called
9. Verify chat input clears after send
10. Verify scroll follows new messages

Checkpoints:
- [ ] User message in chat bubble immediately on send
- [ ] Loading indicator VISIBLE during response stream (not invisible)
- [ ] Response renders with markdown preserved
- [ ] Tool cards present for any tool calls
- [ ] Input cleared and focused after send
- [ ] Chat scroll auto-follows
```

### J16: All 14 Slash Commands Execute Without Error
```
For each command: /help /memory /workspace /skills /personas /clear
                  /export /import /status /debug /reset /search /plan /cron

Steps per command:
1. Navigate to Chat view
2. Type "/" — verify autocomplete suggestion list appears
3. Type full command (e.g., /help) — verify suggestion highlights
4. Press Enter — verify command executes
5. Verify response is non-empty and relevant to command intent
6. Verify no unhandled exception thrown (check browser console)

Checkpoints:
- [ ] Autocomplete fires on "/" keystroke
- [ ] All 14 commands execute without throwing
- [ ] /help lists available commands
- [ ] /memory shows memory frame count or empty state message
- [ ] /workspace shows current workspace name
- [ ] /personas lists all 8 personas
- [ ] /status shows server health data
```

### J17: Memory Browser — Full CRUD + Search
```
Steps:
1. Navigate to Memory view (Ctrl+Shift+2)
2. Verify frame list renders or empty state shows
3. Type search query — verify results filter in real time
4. Click a frame — verify detail/expand view appears
5. Verify importance score visible in detail
6. Verify timestamp visible in detail
7. Click delete on a frame — verify confirmation dialog appears
8. Confirm delete — verify frame removed from list
9. Verify knowledge graph section visible (graph or empty state — not error)
10. Verify FTS5 full-text search returns relevant results

Checkpoints:
- [ ] Memory view loads without error
- [ ] FTS5 search filters correctly
- [ ] Frame detail shows all metadata
- [ ] Delete confirmation prevents accidental deletion
- [ ] Knowledge graph renders without error
```

### J18: Capabilities — Install, Verify, Uninstall
```
Steps:
1. Navigate to Capabilities (Ctrl+Shift+4)
2. Verify skill family group list renders (≥ 3 families)
3. Verify skill count badge shows (15K+ expected)
4. Click a skill — verify detail panel opens
5. Click Install — verify install state changes (button label, badge)
6. Filter by "Installed" — verify the skill appears
7. Click Uninstall — verify state reverts
8. Search for skill by name — verify results narrow correctly
9. Verify trust/security badge visible on each skill card

Checkpoints:
- [ ] View renders without error
- [ ] Install triggers immediate optimistic UI update
- [ ] Installed filter works
- [ ] Uninstall restores default state
- [ ] Security badges present (SecurityGate integration)
```

### J19: Settings — All 6 Tabs, No Blank Renders
```
Steps:
1. Navigate to Settings (Ctrl+Shift+7)
2. Click each tab: General / Models / Vault / Permissions / Team / Advanced
3. General: workspace name editable, theme selector present
4. Models: provider selector populated, model list loads
5. Vault: secret list loads, Add Secret button present
6. Permissions: permission toggles render
7. Team: team server config fields present
8. Advanced: debug toggle visible
9. Verify no tab renders blank or throws to console error

Checkpoints:
- [ ] All 6 tabs render content (not blank)
- [ ] Settings values persist after navigating away and back
- [ ] Vault: no secret values visible in plaintext
- [ ] Model selector updates correctly
```

### J20: Cockpit — All 10 Dashboard Cards Load
```
Steps:
1. Navigate to Cockpit (Ctrl+Shift+5)
2. Wait 2000ms for async data fetches
3. Check for each card: System Health, Service Health, Cost, Memory Stats,
   Vault, Cron, Capability Overview, Agent Topology, Connectors, Audit Trail
4. For each card: verify title visible, no raw error stack exposed
5. Click Refresh if available — verify cards update without flash

Checkpoints:
- [ ] All 10 cards render (or loading skeleton — not blank/errored)
- [ ] No card shows "undefined" or raw exception text
- [ ] Cost tracking shows numeric values (or zero)
- [ ] Cron card shows scheduled jobs or clean empty state
- [ ] Connectors card reflects connected services
```

### J21: Mission Control — Parallel Sessions
```
Steps:
1. Navigate to Mission Control (Ctrl+Shift+6)
2. Verify workspace session list renders
3. Launch session on Workspace A — verify chat panel opens
4. Launch session on Workspace B — verify second session panel
5. Send message in session A — verify session B unaffected
6. Close session A — verify removed from grid cleanly
7. Verify session B continues uninterrupted

Checkpoints:
- [ ] Multiple sessions visible simultaneously
- [ ] Sessions are isolated (no cross-contamination)
- [ ] Session launch does not reload the full app
- [ ] Session close is clean
```

### J22: Approval Gates — Deny and Approve Both Work
```
Steps:
1. Open Chat in any workspace
2. Send a prompt that triggers a high-risk tool call:
   "Run a bash command to list all files in the current directory"
3. Verify approval gate renders inline in chat
4. Verify gate shows: tool name, risk level, action description
5. Click Deny — verify tool execution cancelled
6. Verify agent acknowledges denial gracefully
7. Repeat the request and click Approve
8. Verify tool executes and result appears
9. Navigate to Events view — verify audit trail records both outcomes

Checkpoints:
- [ ] Approval gate renders inline (not a blocking modal overlay)
- [ ] Risk level clearly displayed
- [ ] Deny cancels with no side effects
- [ ] Approve executes correctly
- [ ] Audit trail captures denied + approved events
```

### J23: Persona Switching — Mid-Conversation, History Preserved
```
Steps:
1. Open Chat in a workspace
2. Exchange 2-3 turns to establish conversation history
3. Type /personas — verify list of 8 options appears
4. Select "Researcher" persona
5. Verify status bar shows active persona changed
6. Send a research-type question — verify response reflects Researcher style
7. Switch to "Writer" persona mid-conversation
8. Verify conversation history intact after switch
9. Verify new responses reflect Writer persona characteristics

Checkpoints:
- [ ] All 8 personas listed with descriptions
- [ ] Persona switch updates active system prompt
- [ ] Conversation history preserved across persona switch
- [ ] Response style reflects selected persona
```

### J24: Cron Job — Create, Verify, Delete
```
Steps:
1. Navigate to Cockpit > Cron card (or Settings > Advanced)
2. Create new cron job: name "Daily Summary", expression "0 9 * * *"
3. Save — verify job appears in Cron card with next run time
4. Verify next run time is calculated correctly (9:00 AM tomorrow)
5. Delete the job — verify it disappears from list
6. Verify no orphaned job entries remain

Checkpoints:
- [ ] Cron expression validated before save
- [ ] Next run time displayed and accurate
- [ ] Deletion is clean
```

### J25: Error Boundary — Graceful Recovery (CRITICAL Fix Verification)
```
This test directly verifies the CRITICAL fix from the launch recommendation:
"Zero error boundaries — one render error = permanent white screen"

Steps:
1. Load the app to confirmed functional state
2. Inject a render error via browser console:
   - If dev mode accessible: trigger a null ref in a component
   - Or navigate to any route that produces a React render error
3. Verify ErrorBoundary catches the error (NOT a white screen)
4. Verify fallback UI shows: "Something went wrong" + retry button
5. Click Retry — verify the view recovers without full page reload
6. Verify rest of app (sidebar, other views) remains functional

Result interpretation:
- PASS: ErrorBoundary present, fallback shown, recovery works
- CRITICAL FAIL: White screen, no recovery — fix required before launch
```

---

## AG-2: AGENT BEHAVIOR TESTER — QUALITY VALIDATION

AG-2 sends messages via the API endpoint `POST /api/chat/message` and evaluates responses
against quality rubrics. Tests are semi-automated: send → observe → score.

### AB-1: Workspace Re-Entry — The #1 Kill List Use Case
```
This is Waggle's core product promise. Must score 4/5 minimum.

Setup (Session A):
  - Open workspace "DACH Expansion Strategy"
  - Conduct 5-turn strategic discussion
  - Establish 3 explicit decisions:
    D1: "We chose direct sales over channel partners for the first 12 months"
    D2: "Target: mid-market manufacturing companies, 200-1000 employees"
    D3: "Entry market: Austria first, then Germany"
  - Note 2 open threads:
    T1: "Pricing model not yet finalized"
    T2: "Partnership with local consulting firm still under evaluation"
  - Close app completely

Test (Session B — new session):
  - Reopen app, navigate to "DACH Expansion Strategy"
  - Ask: "What's the current state of the DACH expansion project?"

Expected:
  - All 3 decisions referenced accurately
  - Both open threads identified
  - No confabulated decisions
  - Suggested next logical steps
  - Response time < 10 seconds

Score:
  5/5: All decisions accurate, open threads identified, smart suggestions
  4/5: 2/3 decisions, threads identified
  3/5: General topic recalled but decisions missing
  2/5: No specific context, generic response
  1/5: Error or blank
```

### AB-2: Multi-Tool Orchestration Under a Complex Brief
```
Task: "Research the top 3 enterprise AI agent platforms,
       compare their enterprise pricing models,
       and draft a one-page competitive brief suitable for investor review."

Expected tool sequence visible in Events log:
  1. web_search → "enterprise AI agent platforms 2026"
  2. web_fetch → [top result URLs]
  3. web_search → refinement query (pricing, enterprise features)
  4. save_memory → "Competitive intel: enterprise AI agent platforms"
  5. generate_docx or write_file → formatted competitive brief

Checkpoints:
- [ ] ≥ 3 distinct tool calls visible in Events view
- [ ] Tool cards show accurate descriptions (not generic "tool call")
- [ ] Final brief is structured: executive summary, comparison table, conclusion
- [ ] Memory saved correctly (verifiable via /memory command)
- [ ] Total execution time < 90 seconds
```

### AB-3: Ambiguity Detection — Ask Before Acting
```
Setup: Establish a 2-turn conversation about a marketing brief.

Test: Send: "Make it better."

Expected behavior:
  - Agent does NOT immediately rewrite anything
  - Agent asks ≥ 2 targeted clarifying questions:
    "What aspect needs improvement? (tone / structure / length)"
    "Who is the intended audience?"
    etc.

Failure: Agent produces immediate output without asking.

Follow-up: Answer "The opening paragraph is too weak for C-level executives."
  - Agent should then revise ONLY the opening paragraph
  - Agent should NOT touch other sections

Score: Pass = asked ≥ 2 relevant questions then targeted the correct section
       Fail = guessed without asking
```

### AB-4: Long-Context Coherence (20-Turn Conversation)
```
Conduct a 20-turn conversation covering 3 distinct topics:
  - Topic A (turns 1-7): Product roadmap decisions
  - Topic B (turns 8-14): Hiring plan
  - Topic C (turns 15-20): Budget allocation

At turn 20, ask:
  "Summarize the conversation. What was the main decision made on each topic?"

Expected:
  - Correctly identifies main decision per topic
  - Does not conflate topics
  - Does not confabulate decisions not made

Failure: Wrong attributions, hallucinated decisions, topic confusion
```

### AB-5: Tool Transparency — Every Tool Visible
```
For each of these 4 tasks:
  T1: "Search for news about Serbia AI strategy 2026"
  T2: "List the files in my current workspace directory"
  T3: "Remember that our Q2 AI budget is €120,000"
  T4: "What did we decide last week about pricing?"

For each task, verify in Events view:
  - Tool card appears (not silent execution)
  - Tool card shows: tool name, key input parameters, execution time
  - Expand arrow shows full tool output
  - Correct tool called for each task:
    T1 → web_search
    T2 → list_directory
    T3 → save_memory
    T4 → search_memory

Checkpoints:
- [ ] 4/4 tool cards appear
- [ ] Tool names match expected tools
- [ ] No tool executes silently
```

### AB-6: Graceful Failure — Bad Tool Call Recovery
```
Send: "Read the contents of the file /nonexistent/path/classified.txt"

Expected:
  - Agent calls read_file with the path
  - Tool returns file-not-found error
  - Error visible in tool card (not swallowed silently)
  - Agent acknowledges failure in natural language
  - Agent suggests alternative: check path, verify file exists
  - No infinite retry loop (max 3 retries per audit spec)
  - Agent remains responsive to follow-up messages

Checkpoints:
- [ ] Error shown in tool card
- [ ] Agent acknowledges failure clearly
- [ ] No more than 3 retry attempts
- [ ] Follow-up messages handled normally
```

### AB-7: Sub-Agent Spawning
```
Task: "Spawn a research sub-agent to collect competitive intelligence on
       the top 5 enterprise AI platforms in Europe while I continue working."

Expected:
  - spawn_agent tool call appears in Events view
  - Main conversation remains responsive during sub-agent execution
  - Notification appears when sub-agent completes
  - Sub-agent results are coherent and structured

Checkpoints:
- [ ] spawn_agent tool card appears
- [ ] Main UI interactive during sub-agent execution (no freeze)
- [ ] Notification delivered on completion
- [ ] Sub-agent results intelligible and useful
```

---

## AG-3: PERSONA TESTER — COMPLETE JOURNEY EXECUTION

AG-3 executes all 8 canonical personas from `UAT/01-personas.md` per their scenarios in
`UAT/13-persona-scenarios.md`. In addition, AG-3 executes 4 new high-value sector personas:

### P9: Attorney — Legal Office (5-Person Boutique Firm)
```
Tier: SOLO → TEAMS
Context: Preparing for contract dispute mediation. Needs precedent research,
         position paper draft, and colleague brief.

Journey:
1. Create workspace: "Acme Corp — SLA Dispute Mediation"
2. Ask: "Identify key risk clauses in a standard SaaS SLA contract and flag
        language that typically causes disputes under Serbian and EU contract law."
3. Evaluate: Legal terminology correct? Structured by clause type?
4. Ask: "Draft a position paper arguing breach of performance obligations
        based on 3 missed SLA targets over a 6-month period."
5. Evaluate: Structure matches professional legal memo format?
6. Ask: "Condense this into a 200-word brief for two colleagues joining
        the mediation session."
7. Save all deliverables to workspace memory.
8. Simulate Teams access: can colleague retrieve the brief via shared workspace?

Pass criteria:
  - Legal terminology: accurate
  - Position paper: professional structure (facts, argument, conclusion)
  - Brief: accurate condensation of longer document
  - Memory: brief retrievable from new session
  - Isolation: legal content not visible from other workspaces
```

### P10: Account Lead — Digital Marketing Agency (20 Staff)
```
Tier: TEAMS
Context: Running a 3-month social media campaign for a retail client.
         Needs content calendar, competitive research, weekly reporting.

Journey:
1. Create workspace: "RetailCo — Q2 Spring Campaign"
2. Ask: "Build a 4-week social media content calendar for a mid-market
        fashion retail brand. Channels: Instagram + LinkedIn.
        Tone: aspirational but accessible. Include: post date, platform,
        format (image/video/carousel), caption concept, CTA."
3. Evaluate: 20+ posts? All fields present? Tone appropriate?
4. Ask: "Identify top 5 competitors in mid-market fashion retail and
        summarize their social media strategies and posting cadence."
5. Ask: "Draft a weekly campaign performance report template for
        client presentation. Include: KPIs, week-on-week comparison,
        insights section, next week recommendations."
6. Invite team member to workspace (Teams tier).
7. From team member session: "What's our content strategy for next week?"
   Evaluate: Can team member access shared workspace context?

Pass criteria:
  - Content calendar: actionable, complete, brand-appropriate
  - Competitive research: substantive (not generic)
  - Report template: professional, suitable for client-facing use
  - Team member access: shared context retrievable
```

### P11: R&D Engineer — Deep Tech Startup (15 Staff)
```
Tier: SOLO
Context: Evaluating LLM inference frameworks for a 70B parameter production deployment.

Journey:
1. Create workspace: "Inference Framework Evaluation — Q2 2026"
2. Ask: "Compare vLLM, Hugging Face TGI, and NVIDIA Triton Inference Server
        for serving a 70B parameter model in production.
        Evaluation dimensions: throughput (req/s), latency (p50/p99),
        memory efficiency (GPU utilization), deployment complexity,
        Kubernetes compatibility."
3. Evaluate: Technically accurate? Structured as decision matrix?
4. Ask: "For a 4x H100 cluster running 80% batch inference + 20% interactive,
        which framework do you recommend and why?"
5. Ask: "Write the Architecture Decision Record (ADR) for this choice.
        Include: context, decision, consequences, alternatives considered."
6. Save recommendation to memory.
7. New session: "What did we decide on the inference framework evaluation?"
   Evaluate: Accurate recall of recommendation and rationale.

Pass criteria:
  - Framework comparison: technically accurate for current versions
  - Recommendation: clearly reasoned for the stated constraints
  - ADR: follows standard ADR format
  - Memory recall: accurate in new session
```

### P12: Owner — Accounting Firm (12 Staff, Quarter Close)
```
Tier: SOLO
Context: End of Q1. Needs client communication, team briefing, client newsletter.

Journey:
1. Open workspace: "Q1 2026 Quarter Close"
2. Ask: "Draft a client communication about the Q1 reporting deadline.
        Tone: professional, reassuring. Include a checklist of documents
        clients should prepare (Serbian regulatory context)."
3. Ask: "Create talking points for our internal team meeting covering:
        Q1 workload review, Q2 capacity planning, one process improvement.
        Format: structured for a 30-minute meeting."
4. Ask: "Draft a client newsletter covering 3 tax regulation changes
        effective Q2 2026 relevant to Serbian SME owners."
5. Evaluate all three deliverables: professional quality, correct tone,
   appropriate level of technical detail for each audience.

Pass criteria:
  - Client communication: professional, correct tone, actionable checklist
  - Team talking points: structured for stated meeting duration
  - Newsletter: clear, accurate regulatory context, appropriate formality
```

---

## AG-4: SECTOR TESTER — ENTERPRISE AND GOVERNMENT SCENARIOS

### SECTOR-1: Banking & Financial Services
```
Scenario: Senior credit analyst at a retail bank.

Tasks:
1. "Summarize the key indicators for assessing SME credit risk in a
   post-pandemic European banking context. Reference Basel III / Basel IV
   capital requirements where relevant."
2. "Draft a one-page credit risk memo for the credit committee on a
   hypothetical SME lending case: €500K facility, manufacturing sector,
   18% debt-to-equity, 3-year operating history."
3. "What workspace memory architecture would you recommend for a credit
   analyst managing 40+ recurring client review cycles?"

Evaluation:
  - Correct banking/regulatory terminology
  - Memo structure matches standard credit committee format
  - Appropriate disclaimer (not providing financial advice)
  - Memory recommendation is operationally practical
```

### SECTOR-2: Telecommunications
```
Scenario: Product manager at a CEE regional telco designing enterprise connectivity.

Tasks:
1. "Analyze competitive positioning of enterprise SD-WAN bundled with managed
   security services in Central and Eastern European markets, 2025-2026."
2. "Draft a one-page product brief for the enterprise sales team for a new
   MPLS + SD-WAN hybrid connectivity product at €2,400/month.
   Include: value proposition, target segment, key differentiators, pricing rationale."
3. "Create a competitive battle card vs. our top 3 competitors in the enterprise
   connectivity segment."

Evaluation:
  - Technical telco terminology accurate (MPLS, SD-WAN, SLA, uptime tiers)
  - Product brief is sales-ready
  - Battle card is actionable (not generic)
```

### SECTOR-3: Government and Public Administration
```
Scenario: Digital transformation advisor at a national ministry.
(This directly maps to the KVARK sovereign AI positioning — evaluate rigorously.)

Tasks:
1. "Summarize the key sovereign AI infrastructure principles relevant to
   public sector AI deployment under the EU AI Act, with specific focus
   on high-risk AI systems in government."
2. "Draft terms of reference for a public procurement tender for a national
   AI platform. Requirements: data residency within national borders,
   open-source LLM support, multi-ministry access governance,
   audit trail for all AI-generated decisions."
3. "Identify the 5 highest-risk areas in government AI deployment and
   propose concrete mitigation measures."
4. "What workspace memory structure would you recommend for a government
   digital advisor working across 4 ministries with different classification levels?"

Evaluation:
  - EU AI Act references: accurate
  - ToR: standard public procurement structure
  - Risk assessment: substantive and actionable
  - Memory architecture: acknowledges classification sensitivity
  - Note: this scenario is ALSO a KVARK sovereign AI test (feed findings to AG-8)
```

### SECTOR-4: Legal Offices and Law Firms
```
Scenario: Managing partner at a 20-attorney commercial law firm.

Tasks:
1. "Analyze the enforceability risk in an exclusivity clause that restricts
   a software vendor from serving direct competitors for 24 months post-contract
   under Serbian and EU competition law."
2. "Draft a client briefing on the legal implications of the EU AI Act
   for companies using AI in HR screening and recruitment."
3. "Generate a contract review checklist for commercial SaaS agreements,
   organized by risk category."

Evaluation:
  - Legal analysis is structured and credible
  - Appropriate disclaimer: not legal advice
  - Checklist covers standard commercial SaaS risk areas (IP, liability cap, data, SLA)
```

### SECTOR-5: AI Agency and Management Consulting
```
This is the primary Egzakta Advisory / KVARK positioning scenario.
Evaluate with the highest rigor of any sector test.

Scenario: Senior AI transformation consultant preparing a client engagement.

Tasks:
1. Create workspace: "Client: IndustryCo — AI Readiness Assessment"
2. Ask: "Build an AI readiness assessment framework for a 500-person
   manufacturing company. Five dimensions: data maturity, process automation
   potential, talent capability, governance readiness, infrastructure.
   Include: assessment questions per dimension, scoring rubric (1-5),
   maturity level definitions."
3. Ask: "Draft a full-day discovery workshop agenda for this assessment.
   Include: objectives, session breakdown with timing, facilitator notes."
4. Ask: "Based on these scores — Data: 3/5, Process: 2/5, Talent: 2/5,
   Governance: 1/5, Infrastructure: 3/5 — what is the recommended
   AI transformation roadmap? Sequence initiatives by value/effort."
5. Save complete framework and roadmap to workspace memory.
6. New session: "What AI transformation roadmap did we recommend for IndustryCo?"
   Evaluate: Accuracy of recall.

Pass criteria:
  - Framework: comprehensive, defensible for client presentation
  - Workshop agenda: structured, time-boxed, practical
  - Roadmap: correctly sequenced by value/effort, coherent
  - Memory recall: accurate and complete across sessions
```

### SECTOR-6: Healthcare and MedTech
```
Tasks:
1. "Summarize regulatory requirements for AI-assisted diagnostic tools
   under EU MDR Class IIa classification, including post-market surveillance
   obligations."
2. "Draft a GDPR-compliant data processing agreement template for
   sharing de-identified patient imaging data with an AI research platform."

Evaluation:
  - Correct EU MDR framework references (Article 10, Annex IX)
  - DPA template structure matches GDPR Article 28 requirements
  - Appropriate disclaimers: not legal/medical/regulatory advice
```

### SECTOR-7: Startups (Seed to Series A)
```
Scenario: Founder preparing a Series A fundraise in the B2B SaaS space.

Tasks:
1. "Help me build the competitive moat analysis for my Series A pitch deck.
   We are a supply chain visibility platform, $1.2M ARR, 15% MoM growth.
   Core differentiator: proprietary logistics graph with 200+ carrier integrations."
2. "Draft the 3-year financial model assumptions slide. Stage: Series A.
   ARR now: $1.2M. Growth target: 5x over 3 years. Key assumptions to include."
3. "Write the opening 60-second pitch hook. Audience: tier-1 VC partner."
4. Save all pitch materials to workspace.
5. New session: "What were the key talking points from our investor pitch prep?"

Pass criteria:
  - Moat analysis: investor-grade quality
  - Financial assumptions: realistic for stated stage and sector
  - Pitch hook: compelling, VC-appropriate
  - Memory continuity: materials retrievable across sessions
```

---

## AG-5: BENCH MARKER — COMPETITIVE BENCHMARK SUITE

AG-5 runs 5 tasks across Waggle and 5 competitors. The goal is to quantify Waggle's
differentiation precisely — not directionally. All competitors tested at their optimum.

### Competitor Benchmarking Conditions
```
A. Claude Code (CLI): Latest version, fresh session each test, no tricks
B. OpenClaw / Claude Cowork: With memory features enabled, best configuration
C. Perplexity Computer: With focus mode appropriate to task
D. GenSpark: With appropriate agent configuration for the task type
E. ChatGPT Desktop: With Projects feature enabled, GPT-4o model
```

### BT-1: Memory-Dependent Recall
```
Setup: Establish 3 specific decisions in a prior session (close → reopen).
  D1: "Brand-first positioning over product-led growth"
  D2: "Mid-market B2B, 50-500 employees"
  D3: "LinkedIn + events, not paid ads"

Test: "Summarize the key strategic decisions we made last week."

Score per competitor:
| Dimension             | Waggle | Claude Code | OpenClaw | Perplexity | GenSpark | ChatGPT |
|-----------------------|--------|-------------|----------|------------|----------|---------|
| All 3 decisions recalled |     |             |          |            |          |         |
| User effort to reestablish |  |             |          |            |          |         |
| Time to answer        |        |             |          |            |          |         |
| Hallucinated content? |        |             |          |            |          |         |
```

### BT-2: Multi-Workspace Context Isolation
```
Setup: Work in Workspace A (legal brief). Switch to Workspace B (marketing).
Test: From Workspace B, ask about Workspace A content.

Expected: Waggle maintains strict isolation.
Expected competitor behavior: Most tools have no workspace model at all.
```

### BT-3: Structured Deliverable Chain
```
Single prompt: "Research the top 3 enterprise AI agent platforms,
                compare pricing models, draft an investor-ready brief."

Score:
  - Tool invocation quality (did it search, then synthesize, not just answer from memory?)
  - Final output quality (investor-appropriate, structured, accurate?)
  - Time to complete
```

### BT-4: 5-Day Longitudinal Memory Compounding
```
Day 1: New project. 3 decisions.
Day 2: 2 new decisions. Ask "where are we?"
Day 3: Status update referencing Day 1-2 decisions.
Day 5: "What have we accomplished and what remains open?"

Score: Does accumulated memory create compounding usefulness?
       Does each session feel more productive than the last?
       Or does it feel like starting over each time?
```

### BT-5: Sovereign AI / On-Premise Data Narrative
```
Task: "I need to analyze a 100-page internal policy document
       that cannot leave our enterprise environment.
       How would your platform support this?"

Score per competitor:
  - Clarity of on-premise / data sovereignty story
  - Enterprise credibility of the response
  - Waggle + KVARK should clearly win this dimension

Note for AG-5: Flag whether Waggle's current response (without KVARK live)
               is sufficient to win this benchmark in narrative terms.
               If not, this is a HIGH priority narrative gap to fix.
```

### Scoring Template
```
| Task | Dimension              | Weight | Waggle | Claude Code | OpenClaw | Perplexity | GenSpark | ChatGPT |
|------|------------------------|--------|--------|-------------|----------|------------|----------|---------|
| BT-1 | Task completion        | 25%    |        |             |          |            |          |         |
| BT-1 | Context utilization    | 25%    |        |             |          |            |          |         |
| BT-1 | User effort required   | 20%    |        |             |          |            |          |         |
| BT-1 | Output quality         | 20%    |        |             |          |            |          |         |
| BT-1 | Time to completion     | 10%    |        |             |          |            |          |         |
[Repeat for BT-2 through BT-5]
```

---

## AG-6: MEMORY & CONTINUITY TESTER

### MC-1: Personal Mind vs. Workspace Mind Strict Isolation
```
Setup:
  - Personal mind: "My name is Marko. I am a strategy consultant."
  - Workspace A mind: "This is the KVARK enterprise sales engagement."
  - Workspace B mind: "This is the LM TEK hardware evaluation project."

Tests:
  1. From Workspace A: "What is my name?" → expect personal mind data (Marko)
  2. From Workspace A: "What project is this?" → expect KVARK sales
  3. From Workspace B: "What project is this?" → expect LM TEK hardware
  4. From Workspace B: ask about KVARK → must NOT return Workspace A content

CRITICAL: Any cross-workspace contamination = P0 failure. Document immediately.

Verify via MultiMind implementation in `packages/core/src/MultiMind.ts`:
  - Personal mind accessible from all workspaces ✓
  - Workspace minds strictly isolated ✓
  - MultiMind router merges personal + workspace correctly ✓
```

### MC-2: Frame Persistence Across Full App Restart
```
Steps:
  1. Save 5 memory frames with distinct, verifiable content
  2. Close the Waggle Tauri app completely (not just tab close — kill the process)
  3. Reopen the app
  4. Search for all 5 frames
  5. Verify all 5 persist with accurate content and metadata

Checkpoints:
- [ ] All 5 frames survive full app restart
- [ ] Metadata preserved: importance, timestamp, access count
- [ ] FTS5 search returns all 5 frames
- [ ] sqlite-vec semantic search still returns frames
- [ ] WAL mode (write-ahead log) functioning correctly
```

### MC-3: Knowledge Graph Accuracy
```
Setup: Over 10 turns, discuss named entities with explicit relationships:
  "Project Alpha is led by Sarah Chen."
  "Sarah Chen reports to Marcus Weber."
  "Project Alpha depends on the authentication platform."
  "The authentication platform is maintained by the infrastructure team."
  "Marcus Weber approved the Q2 budget of €200,000."

Test: Navigate to Memory view → Knowledge Graph section.

Expected entities: Project Alpha, Sarah Chen, Marcus Weber, Auth Platform, Infra Team
Expected relations: led by, reports to, depends on, maintained by, approved

Checkpoints:
- [ ] ≥ 4 of 5 entities extracted correctly
- [ ] ≥ 3 of 4 relations correct
- [ ] Graph renders visually (not blank, not error)
- [ ] Temporal validity: valid_from timestamps present
```

### MC-4: 5-Day Habit Formation Simulation
```
(Automates UAT/11-habit-formation.md for the analytical portion)

Day 1: Create workspace "Q2 Strategic Plan". Establish 3 decisions. End session.
Day 2: Open workspace. Ask: "What did we decide?" Verify all 3 recalled.
       Add 2 new decisions. End session.
Day 3: Open workspace. Ask: "Summarize where we are and what remains open."
       Verify references Day 1 AND Day 2 decisions accurately.
Day 5: Ask: "What have we accomplished since we started, and what are our open threads?"
       Verify: accumulated memory creates compounding value.

Success signal: Each session opens with more orientation, not less.
Failure signal: Each session feels like starting over.

Score per day: 1-5 on Orientation, Continuity, Momentum (from methodology rubric)
```

---

## AG-7: UX & ERGONOMICS AUDITOR

### UX-1: First Impression — 30-Second Test
```
Questions to answer with scores (1-5):
1. Does the splash screen feel professional? (Known issue: wrong palette — verify fix)
2. Does onboarding communicate Waggle's value proposition in ≤ 3 steps?
3. Is the first post-onboarding screen orienting or overwhelming?
4. Can a new user understand what Waggle does in < 15 seconds?
5. Is the typography (font, weight, size) appropriate for a professional tool?

Document: screenshots of splash screen, onboarding step 1, first workspace home
```

### UX-2: Navigation Efficiency Measurement
```
For each of the 7 views, measure and record:
  - Sidebar click to visual response: target < 200ms
  - Keyboard shortcut to visual response: target < 100ms
  - Time for new user to understand view purpose: target < 5 seconds

Audit for common failures:
  - Dead clicks (clickable elements that do nothing)
  - Missing hover states on interactive elements
  - Unlabeled or ambiguous icons
  - Missing active state indicator on current view
  - Inconsistent click targets (too small, misaligned)
```

### UX-3: Chat Interface Deep Audit
```
Evaluate each element:
  1. Loading indicator: VISIBLE during streaming? (CRITICAL fix verification)
  2. Message bubbles: user vs. agent visually distinct?
  3. Tool cards: compact/expand pattern discoverable?
  4. Scroll: auto-follows new messages?
  5. Code blocks: syntax highlighting + copy button present?
  6. Markdown: headers, bold, lists, tables render correctly?
  7. Long responses: graceful truncation + "show more"?
  8. Network error state: displayed gracefully, not raw error?
  9. Empty workspace state: inviting, not blank?
  10. Input field: auto-focused, placeholder text meaningful, Enter = send?

Score each 1 (broken/missing) to 5 (excellent)
```

### UX-4: Information Architecture Discoverability
```
Test without documentation. Can a first-time user find:
  [ ] How to install a skill?
  [ ] How to see what the agent did (tool transparency)?
  [ ] How to switch workspaces?
  [ ] The workspace home / orientation view?
  [ ] Settings?
  [ ] Keyboard shortcuts list?
  [ ] How to create a new workspace?

Score: (found without docs = 1 point each) / 7 × 5 = score out of 5
Any navigation dead-end (no way back from a screen) = automatic CRITICAL
```

### UX-5: Emotional Dimension Scoring — All 8 Views × 8 Dimensions
```
Rate each view on each of the 8 emotional dimensions (1-5 scale):
(Reference: UAT/00-methodology.md for scoring rubrics)

| View            | Orient | Relief | Momentum | Trust | Continuity | Serious | Align | Power | AVG |
|-----------------|--------|--------|----------|-------|------------|---------|-------|-------|-----|
| Chat            |        |        |          |       |            |         |       |       |     |
| Memory Browser  |        |        |          |       |            |         |       |       |     |
| Capabilities    |        |        |          |       |            |         |       |       |     |
| Cockpit         |        |        |          |       |            |         |       |       |     |
| Mission Control |        |        |          |       |            |         |       |       |     |
| Events          |        |        |          |       |            |         |       |       |     |
| Settings        |        |        |          |       |            |         |       |       |     |

Target: Average ≥ 4.0 per view. No dimension below 3.0 on any view.
Known weakness from pre-production audit: Settings = 3.4 — investigate root cause.
Known strength from pre-production audit: Cockpit = 4.3, Capabilities = 4.3.
```

### UX-6: Viewport Responsiveness
```
Test at: 1920×1080, 1440×900, 1280×800, 1024×768

Check at each viewport:
  - No horizontal scroll
  - Sidebar collapses gracefully at narrow widths
  - Chat textarea usable at all viewports
  - No text overflow or cropped UI elements
  - Cockpit dashboard grid adapts gracefully
```

---

## AG-8: KVARK / SOVEREIGN AI VALIDATOR

All tests in this section run in simulation mode — KVARK HTTP API is not yet wired into
the running local server. AG-8 validates: client implementation, tool definitions,
contract compliance, and the sovereign AI narrative strength.

Reference documents (read before executing):
  - `docs/kvark-http-api-requirements.md`
  - `docs/plans/2026-03-12-kvark-integration-contract.md`
  - `docs/plans/2026-03-17-phase7-milestone-a-execution.md`
  - `packages/server/src/kvark/` (implementation)

### KV-1: KVARK Client Contract Compliance Audit
```
Read packages/server/src/kvark/ and cross-reference against
docs/plans/2026-03-12-kvark-integration-contract.md

Validate:
  [ ] /search endpoint implemented correctly
  [ ] /ask (document Q&A) endpoint implemented
  [ ] /feedback endpoint implemented
  [ ] /action endpoint implemented
  [ ] Bearer token auth (user-level) implemented
  [ ] 401/403/429/500 error handling present
  [ ] Retry with exponential backoff present
  [ ] Request timeout configuration present
  [ ] Response mapping to Waggle data structures correct

Output: compliance table (endpoint × requirement × implemented/missing)
```

### KV-2: KVARK Agent Tools Verification
```
Check packages/agent/src/tools/ for KVARK tool definitions:
  - kvark_search
  - kvark_ask_document
  - kvark_feedback
  - kvark_action

For each tool verify:
  [ ] Tool registered in agent tool registry
  [ ] Tool description is clear and usable by the LLM
  [ ] Tool parameters correctly typed
  [ ] Tool calls the correct KVARK client method
  [ ] Tool error handling surfaces to chat gracefully
  [ ] Tool card renders correctly in Events view

Note: These tests run against mock/stub mode — not live KVARK API.
      Flag any tool that cannot be tested in stub mode.
```

### KV-3: Sovereign AI Narrative Quality Test
```
This tests how well Waggle communicates its sovereign AI positioning to enterprise buyers.

From a fresh workspace, ask the agent:
  "We are a government ministry evaluating AI platforms.
   Our primary requirement is that no data can leave our national infrastructure.
   How does Waggle address data sovereignty, and how does KVARK enable
   secure enterprise knowledge access?"

Score the response on 5 dimensions (1-5):
  1. Data sovereignty: Does it explain on-premise deployment correctly?
  2. KVARK positioning: Is KVARK explained as the governed knowledge layer?
  3. Audit capability: Is audit trail and governance mentioned?
  4. Accuracy: No false claims about capabilities not yet implemented?
  5. Enterprise credibility: Would a government CIO find this convincing?

Minimum passing score: 4.0 average across 5 dimensions.
This narrative gap — if present — is a HIGH priority fix before enterprise sales.
```

### KV-4: Enterprise Tier Differentiation Visibility
```
Walk through the product UI and answer:

  1. Capabilities view: Is KVARK/Enterprise tier clearly labeled and explained?
  2. Chat view: When KVARK is connected, is the knowledge source indicated
     in responses or tool cards?
  3. Settings > Team: Is KVARK connection configuration present and clear?
  4. Cockpit: Is KVARK connection health shown as a dedicated card or indicator?
  5. Onboarding: Does the Enterprise path mention KVARK as the upgrade story?

Score each: 0 (not present), 1 (present but unclear), 2 (present and clear)
Total: X/10. Target: ≥ 7/10 for enterprise-ready differentiation clarity.
```

---

## ISSUE CLASSIFICATION PROTOCOL

All findings from all agents use this classification:

```
CRITICAL  — Blocks launch. Must fix before any external user touches the product.
HIGH      — Ship-week fix. Address in V1.0.1 within 7 days of launch.
MEDIUM    — V1.1 roadmap item. Meaningful quality gap, not launch-blocking.
LOW       — Polish. Log for future sprints.
INFO      — Observation, no action required. Includes competitive intelligence.
```

Known CRITICAL issues from pre-production audit — re-verify status as part of this campaign:
```
[ ] 1. CORS origin: true — verify fixed (change to allowlist of Tauri origins)
[ ] 2. CSP unsafe-eval + unsafe-inline — verify fixed or mitigated
[ ] 3. OAuth refresh tokens stored plaintext — verify encrypted
[ ] 4. Leaked API key in branch phase6-capability-truth — verify revoked at Anthropic
[ ] 5. Zero React ErrorBoundaries — verify added (J25 tests this directly)
[ ] 6. Streaming loading indicator invisible CSS — verify fix in chat (J15 tests this)
[ ] 7. SplashScreen wrong Direction D palette — verify corrected (UX-1 tests this)
[ ] 8. Rate-limit retry can loop indefinitely — verify capped at 3 retries (AB-6 tests this)
```

---

## OUTPUT DELIVERABLES

Campaign completes when Orchestrator has assembled all of the following:

```
UAT/artifacts/
  MASTER-REPORT.md                  — Executive summary, overall score, top 10 findings,
                                      CRITICAL issue status, GO/NO GO recommendation
  ISSUE-REGISTER.md                 — All findings classified, owner assigned, effort estimated
  agent-scorecard.md                — Agent quality scores, AB-1 through AB-7
  competitive-benchmark.md          — Full scoring matrix: 5 tasks × 6 tools
  ux-audit.md                       — UX scores per view, per emotional dimension
  memory-report.md                  — Memory system validation results, MC-1 through MC-4
  kvark-sovereign-readiness.md      — Contract compliance, narrative score, differentiation score
  sector-results/
    legal.md
    banking.md
    telco.md
    government.md
    ai-agency-consulting.md
    healthcare-medtech.md
    startup-series-a.md
  persona-results/
    p01-mia-solo-consultant.md
    p02-luka-project-manager.md
    p03-ana-product-manager.md
    p04-marko-developer.md
    p05-sara-marketing-manager.md
    p06-david-hr-manager.md
    p07-elena-data-analyst.md
    p08-team-lead.md
    p09-attorney-legal-office.md
    p10-marketing-agency-lead.md
    p11-rnd-engineer-startup.md
    p12-sme-owner-accountant.md
  screenshots/                      — Annotated screenshots for CRITICAL and HIGH findings
```

### MASTER-REPORT.md Required Structure
```markdown
# Waggle V1 UAT — Master Report
Generated: [date] | Branch: [branch] | Agent Team: 8 sub-agents

## Executive Decision
GO / CONDITIONAL GO / NO GO

## Overall Score: X.X / 10

## Top 10 Findings (ranked by severity × impact)
1. [CRITICAL/HIGH/MEDIUM] — [finding] — [estimated fix effort]
...

## Scorecard by Dimension
| Dimension              | Score | Target | Status       |
|------------------------|-------|--------|--------------|
| Functional Correctness |       | 8/10   |              |
| User Experience        |       | 7/10   |              |
| Agent Quality          |       | 8/10   |              |
| Memory System          |       | 9/10   |              |
| Security Posture       |       | 7/10   |              |
| Competitive Position   |       | 7/10   |              |
| KVARK Readiness        |       | 6/10   |              |

## CRITICAL Issue Re-Verification (all 8 from pre-production audit)
| # | Issue                              | Status          | Evidence |
|---|------------------------------------|-----------------|----------|
| 1 | CORS origin: true                  | Fixed / Open    |          |
| 2 | CSP unsafe-eval + unsafe-inline    | Fixed / Open    |          |
| 3 | OAuth refresh tokens plaintext     | Fixed / Open    |          |
| 4 | Leaked API key                     | Revoked / Risk  |          |
| 5 | Zero React error boundaries        | Fixed / Open    |          |
| 6 | Streaming indicator invisible      | Fixed / Open    |          |
| 7 | SplashScreen wrong palette         | Fixed / Open    |          |
| 8 | Rate-limit infinite retry          | Fixed / Open    |          |

## Recommended Next Actions (ordered by priority and effort)
1. [action] — [owner] — [effort] — [deadline]
...
```

---

## EXECUTION ORDER FOR ORCHESTRATOR

```
Phase 1 — Setup and Pre-Flight (15 min)
  [ ] Read this document completely
  [ ] Read UAT/00-methodology.md (scoring rubrics)
  [ ] Read docs/production-readiness/09-LAUNCH_RECOMMENDATION.md (current state)
  [ ] Read CLAUDE.md (repo execution rules — apply to all test agents)
  [ ] Execute Pre-Flight Checklist
  [ ] Confirm server running, frontend serving, test suite green
  [ ] Create UAT/artifacts/ directory structure

Phase 2 — Shell and UX in Parallel (45 min)
  [ ] Dispatch AG-1: implement and run J13-J25 browser automation tests
  [ ] Dispatch AG-7: begin UX & ergonomics audit (UX-1 through UX-6)
  [ ] Both agents operate independently (no shared state dependencies)

Phase 3 — Functional, Behavioral, Memory (60 min)
  [ ] Dispatch AG-2: agent behavior tests AB-1 through AB-7
  [ ] Dispatch AG-6: memory and continuity tests MC-1 through MC-4
  [ ] AG-1 reports shell test results to Orchestrator
  [ ] AG-7 reports UX audit results to Orchestrator

Phase 4 — Personas and Sectors (60 min)
  [ ] Dispatch AG-3: persona journeys P1-P8 (from existing scenarios) + P9-P12 (new)
  [ ] Dispatch AG-4: all 7 sector scenarios
  [ ] AG-2 and AG-6 report results to Orchestrator

Phase 5 — Competitive Benchmark and Enterprise (30 min)
  [ ] Dispatch AG-5: competitive benchmark BT-1 through BT-5
  [ ] Dispatch AG-8: KVARK sovereign AI validation KV-1 through KV-4
  [ ] AG-3 and AG-4 report results to Orchestrator

Phase 6 — Synthesis and Report Assembly (30 min)
  [ ] All agents deliver findings to Orchestrator
  [ ] Orchestrator assembles UAT/artifacts/MASTER-REPORT.md
  [ ] Orchestrator assembles UAT/artifacts/ISSUE-REGISTER.md
  [ ] Orchestrator updates docs/production-readiness/07-ISSUE_REGISTER.md
  [ ] Orchestrator delivers final GO / CONDITIONAL GO / NO GO recommendation
  [ ] Orchestrator commits all artifacts to branch: git add UAT/artifacts/ && git commit
```

**Total campaign duration: 3-4 hours automated + 1 hour human review**
**Minimum viable run (CRITICAL path only): 90 minutes**

---

## ANTI-DRIFT RULES FOR ALL AGENTS

These rules are mandatory for every sub-agent in this campaign.
They mirror Waggle's own CLAUDE.md philosophy.

1. **Do not simplify test scenarios.** Complex scenarios are complex because real users
   are complex. Execute the full scenario, not a shortened version.

2. **Do not skip failing tests.** A failure IS the finding. Document it precisely,
   classify it by severity, move on. Do not attempt application code fixes during UAT.

3. **Do not confabulate results.** "Approval gate renders but Deny button has no effect"
   is more valuable than "approval gates partially working." Precision matters.

4. **Do not benchmark charitably.** Test all competitors at their optimum configuration.
   Waggle must win on merit. An unfair comparison is strategically useless.

5. **Always capture screenshots for CRITICAL and HIGH findings.**
   A finding without visual evidence is weak. Screenshots in `UAT/artifacts/screenshots/`.

6. **KVARK tier = simulation mode only.** Do not attempt to call a live KVARK API.
   Test client implementation, tool definitions, narrative quality.
   Flag gaps between contract spec and current implementation.

7. **Security findings are non-negotiable.** Any security issue, however minor,
   is logged immediately. If it's a new finding not in the pre-production audit,
   it becomes CRITICAL by default until classified otherwise.

---

## SESSION START COMMAND

Paste this into a Claude Code session (or any capable agent loop) to begin execution:

```
You are the Waggle UAT Orchestrator for a pre-production acceptance test campaign.

Your mission: execute the full UAT campaign defined in
`D:\Projects\MS Claw\waggle-poc\UAT\MASTER-UAT-EXECUTION-PROMPT.md`

Before taking any action:
1. Read this document completely
2. Read UAT/00-methodology.md
3. Read docs/production-readiness/09-LAUNCH_RECOMMENDATION.md
4. Read CLAUDE.md

Then execute the Pre-Flight Checklist.
Then dispatch sub-agents in the order defined in the Execution Order section.
Aggregate all findings into UAT/artifacts/MASTER-REPORT.md on completion.

Deliver a production-quality UAT report suitable for a CxO launch decision.

ULTRATHINK before acting. This is a pre-production gate.
Quality matters more than speed.
The repo path is: D:\Projects\MS Claw\waggle-poc\
```
