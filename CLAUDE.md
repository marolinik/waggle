# Waggle — Claude Code Execution Protocol

## Project Identity
- **Name**: Waggle (workspace-native AI agent platform)
- **Repo**: `waggle-poc` monorepo (14 packages)
- **Owner**: Marko Markovic
- **Stack**: Tauri 2.0 (Rust + WebView2), React + TypeScript, Fastify, SQLite + FTS5 + sqlite-vec, Claude Agent SDK
- **Run server**: `cd packages/server && npx tsx src/local/start.ts`
- **Run desktop**: `cd app && npm run tauri dev`
- **Run tests**: `npx vitest run` (root — runs all ~2583 tests, target 2900+ after Phase 8)
- **Test baseline**: 2583 tests across 190 files, ALL PASSING (as of Phase 8 start)

---

## Execution Rules — READ BEFORE ANY CODE

You are implementing Waggle under strict product-preservation and milestone-discipline rules.

Waggle is a workspace-native AI agent with persistent memory. It is NOT a generic chat app and NOT a scope-minimized prototype unless explicitly stated.

### Core Rule
Claude Code is **not allowed to infer that simplifying the product is helpful.**

Hard rules:
- Do not reduce scope without explicit approval
- Do not silently remove product behaviors
- Do not rewrite architecture mid-task
- Do not replace rich workflows with simpler ones "for now" unless explicitly approved
- Do not convert roadmap ambition into accidental MVP shrinkage
- Do not broad-refactor when the task is implementation
- If something is unclear, **stop and ask** instead of improvising

---

## Three-Pass Protocol

### Pass 1 — Understanding (no code)
- Read relevant docs/plan
- Restate current milestone/slice goal
- Identify dependencies
- List preserve rules
- Produce implementation slices

### Pass 2 — Delivery (code only the approved slice)
- No unrelated refactors
- No "cleanup sweep"
- No speculative architecture changes

### Pass 3 — Stabilization
- Run tests (`npx vitest run`)
- Inspect regressions
- Patch breakages
- Report what changed, what passed, what remains

---

## Pre-Coding Output (mandatory before any edits)

1. **Outcome summary** — What exactly is being built in this slice?
2. **Files-in-scope** — Which files will change?
3. **Preserve list** — What existing behaviors must remain intact?
4. **Risks / unknowns** — What might break or remain ambiguous?
5. **Smallest sensible slice** — Why is this the right scope?

---

## Product Truths (preserve always)

- Waggle is **workspace-native** (not one global chat)
- Memory is a **product primitive**, not decorative
- **Personal mind** and **workspace mind** are distinct
- KVARK is the governed enterprise substrate, NOT Waggle memory
- Tool transparency matters (users see what agent searched/read/changed)
- Permission-aware action flow matters (approval gates)
- Architecture stays extensible toward KVARK integration
- UX must NOT collapse into "just a chat app"

## Execution Truths (preserve always)

- Milestone boundaries matter
- Design docs are not optional flavor text
- Implementation follows explicit milestone intent
- Tests are part of the product, not an afterthought
- Always visually verify the app before declaring done

---

## Slice Sizing

Good slices:
- Implement one component with tests
- Wire one tool path end-to-end
- Add one UI feature with mocked state
- Implement one approval gate flow

Bad slices:
- "Refactor the core architecture first"
- "Simplify memory model for now"
- "Stub everything and move on"
- "Rewrite server and UI together in one pass"

---

## Post-Slice Report Format

After every slice, output:

```
### Slice completed
- Goal: [what was requested]
- Result: [what was delivered]

### Files changed
- [list]

### Preserved behavior
- [what was intentionally left intact]

### Verification
- Tests run: [count]
- Build: [pass/fail]

### Known gaps
- [anything missing]

### Recommended next slice
- [one clear next step]
```

---

## Anti-Drift Prompts

If simplifying too aggressively:
> Stop. Re-audit the requested behavior against the docs. List what would be lost.

If broad refactoring:
> Stop. Re-scope to the smallest change set for the current slice.

If uncertain but still coding:
> Stop writing code. List unresolved ambiguities and what clarification is needed.

If saying "for now" too much:
> Identify every temporary simplification. Mark which were explicitly approved.

---

## Recovery Audit

If work gets messy, immediately:
1. What the slice originally required
2. What has actually been implemented
3. What was skipped or reduced
4. What may have been broken
5. What unrelated changes were introduced
6. Smallest correction plan

No new code until audit is complete.

---

## Architecture Overview

### 15 Packages
- `@waggle/core` — memory, embeddings, .mind files, vault (AES-256-GCM), cron-store
- `@waggle/agent` — agent loop, 53 tools, sub-agents, capability router, workflow composer, trust model, hooks
- `@waggle/server` — Fastify local server (localhost:3333), 20 route modules, KVARK client, daemons, scheduler
- `@waggle/ui` — React component library (chat, memory, settings, workspace, onboarding, events, cockpit)
- `@waggle/cli` — CLI REPL
- `@waggle/sdk` — plugin/skill SDK, capability packs (5 packs), starter skills
- `@waggle/marketplace` — marketplace catalog (120 packages, 17 packs, 40 sources, SecurityGate)
- `@waggle/optimizer` — prompt optimization (Ax/GEPA)
- `@waggle/weaver` — memory consolidation daemon
- `@waggle/worker` — background task processing (BullMQ), execution strategies (parallel/sequential/coordinator)
- `@waggle/shared` — shared types/utilities
- `@waggle/admin-web` — admin dashboard
- `@waggle/waggle-dance` — swarm orchestration (protocol, dispatcher, hive-query)
- `@waggle/sidecar` — Node.js agent sidecar for Tauri
- `app` — Tauri desktop app

### Key Paths
- Server routes: `packages/server/src/local/routes/` (20 route modules)
- Agent tools: `packages/agent/src/` (system-tools, tools, subagent-tools, plan-tools, kvark-tools, team-tools, skill-tools, workflow-tools, git-tools, audit-tools, document-tools)
- UI components: `packages/ui/src/components/`
- Memory/mind: `packages/core/src/`
- Desktop app views: `app/src/views/` (Chat, Cockpit, Capabilities, Memory, Events, Settings)
- Desktop app components: `app/src/components/`
- Tauri backend: `app/src-tauri/src/`
- Marketplace: `packages/marketplace/src/` (db, installer, security, sync, cli)
- Connector types: `packages/shared/src/types.ts` (ConnectorDefinition, ConnectorHealth, etc.)

### Runtime
- Local server: Fastify on `localhost:3333`, SSE streaming
- Built-in Anthropic proxy: `/v1/chat/completions` (OpenAI → Anthropic translation)
- Agent: 53 tools across 12 categories, approval gates, 200 max turns
- 13 slash commands: /catchup, /now, /research, /draft, /decide, /review, /spawn, /skills, /status, /memory, /plan, /focus, /help
- Session persistence: `.jsonl` files in `~/.waggle/workspaces/{id}/sessions/`
- Config: `~/.waggle/config.json`
- Mind DB: `~/.waggle/default.mind`
- Marketplace DB: `~/.waggle/marketplace.db` (auto-seeded from package)

---

## Never Do Without Explicit Approval

- Collapse multiple minds into one
- Replace workspace-native behavior with global-chat behavior
- Remove event/tool transparency
- Bypass permission-aware flows "temporarily"
- Replace real behavior with mocks and call the slice done
- Silently defer tests
- Rewrite package structure unless the slice explicitly requires it
- Delete or restructure existing working features

---

## V1 Build Order (strategic priority)

**Authoritative plan**: `docs/plans/2026-03-11-waggle-v1-revised-plan.md`
**Phase 8 design spec**: `docs/superpowers/specs/2026-03-18-phase8-activate-execute-harden-design.md`

1. **Phase 1 — Memory truth** — COMPLETE
2. **Phase 2 — Execution truth** — COMPLETE
3. **Phase 3 — Screenflow & UX truth** — COMPLETE
4. **Phase 4 — Habit formation** — COMPLETE
5. **Phase 5 — Team mode** — COMPLETE
6. **Phase 6 — Capability truth** — COMPLETE
7. **Phase 7 — KVARK integration** — IN PROGRESS (Milestone A done, B in progress)
8. **Phase 8 — Activate, Execute, Harden** — NOT STARTED (design approved)
   - 8F: UI/UX Overhaul (shadcn/ui, surface hidden features)
   - 8A: Activate the Arsenal (marketplace live, auto-routing, agent intelligence)
   - 8B: Tool Parity + Extensions (LSP, browser, Tavily/Brave, enhanced grep)
   - 8C: Execution Layer (connector SDK, 5 core connectors, CLI-Anything)
   - 8D: Swarm & Parallel (Waggle Dance live, parallel workspaces, Mission Control)
   - 8G: Fortify (code review, security audit, dependency cleanup)
   - 8E: Harden & Ship (E2E scenarios, benchmarks, installer, regression)
9. **Phase 9 — Comprehensive Testing** — TBD (separate planning session)

Order: **Standalone → Teams → KVARK → Activate → Ship**.

## V1 Kill List (must-win use cases)

1. Workspace restart / instant catch-up
2. Draft from accumulated context
3. Decision compression / next-step thinking
4. Research and synthesis in context
5. Ongoing project memory for solo operators
6. Capability discovery and installation (marketplace → install → use)
7. External action execution (email, Jira, GitHub, Slack via connectors)
8. Multi-agent workflows (research → analyze → draft using swarm)

## Daily-Use Loop (the product standard)

> Open workspace → instant context → real work help → memory-first response → visible progress → return later without losing thread

If this loop doesn't work, nothing else matters.

## Emotional Standard (what users must feel)

Core: "I don't have to hold this whole project in my head alone anymore."

8 feelings: orientation, relief, momentum, trust, continuity, seriousness, personal alignment, controlled power.
Never: lost, overloaded, buried in architecture, managing the system to get value.

## Feature Priority

- **P0**: workspace model, persistent memory, instant catch-up, useful output, low friction, basic transparency, **marketplace activation**, **connector execution**
- **P1**: memory browser, event visibility, sessions model, workspace home, drafting workflows, **browser automation**, **swarm orchestration**, **agent personas**, **Mission Control**
- **P2**: file workflows, planning modes, personalization, local polish, **LSP integration**, **CLI-Anything**
- **P3** (NOT NOW): multi-channel messaging (Slack/Teams/WhatsApp as user channels), mobile native apps, enterprise admin (SSO/SAML, on-prem docs), voice interaction, full connector catalog (250+), KG perfectionism

## Not-Now List

Do not let these hijack V1: multi-channel messaging, mobile native apps, enterprise SSO/SAML, on-prem deployment, voice interaction, full connector catalog (250+ — V1 ships 5 core + adapter bridge), competing with coding tools on their turf, KG perfectionism.

**Moved to Phase 8 (no longer NOT-NOW)**: swarm/Waggle Dance (8D), marketplace activation (8A), browser automation (8B), connectors (8C). Rationale: infrastructure is 100% built from Phases 1-7. Phase 8 activates dormant systems, not building new ones. See design spec for full justification.

## Information Architecture

Workspace = brain. Session = thread. Everything else = support surfaces.
Three-zone layout: Left (workspace nav) → Center (work + chat) → Right (context panel, collapsible).
Home screen: Workspace Now block (summary, threads, decisions, next actions) + restart prompts + input area. Never a blank chat.

## MVP Scorecard (gate before Phase 5)

10 categories (A-J), score 1-5 each. All P0 categories must be 4+. Habit potential 3+. Product coherence 4+.
Brutal question: "Would a serious user open Waggle first for recurring project work after two weeks?"
