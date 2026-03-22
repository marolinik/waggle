# Waggle — Consolidated Action Plan
**Source:** 6 UAT rounds (Visual, Functional, Retest, Full-AI, Mega-UAT offline, Mega-UAT partial-AI)
**Compiled:** 2026-03-22
**Status:** Pre-beta — Solo tier 90% ready, Teams 50%, Enterprise 25%

---

## Current Score: 62/100 (75/100 with working LLM)

---

## P0 — MUST FIX BEFORE ANY USER SEES THIS (~2-3 days)

### P0-1: Proxy API Key Priority Bug ✅ FIXED
- **File:** `packages/server/src/local/routes/anthropic-proxy.ts:282-307`
- **Bug:** `getAnthropicKey()` reads vault (stale key) before env var. `hasAnthropicKey()` reads env var first. Mismatch → health says "healthy" but proxy uses expired vault key.
- **Fix applied:** Swapped priority order so env var wins in both functions.

### P0-2: Workspace Memory Isolation ❌ NOT FIXED
- **Files:** `packages/core/src/mind/`, `packages/agent/src/orchestrator.ts`, `packages/server/src/local/routes/memory.ts`
- **Bug:** All memory frames go to personal `.mind` file regardless of `workspaceId`. `auto_recall` and `search_memory` return ALL frames from personal mind — no workspace filtering. Alpha Corp data visible from Beta Inc workspace.
- **Impact:** BLOCKS multi-workspace use, agency use case, team tier, enterprise tier. Trust-destroying.
- **Fix needed:**
  1. Frame creation: store frames in workspace-specific mind when `workspaceId` is provided
  2. `auto_recall` / `search_memory`: filter results to current workspace + personal (shared) mind
  3. API query: `workspace` parameter must actually restrict results
- **Effort:** 2-3 hours
- **Test:** Create frame in workspace-a, search from workspace-b → should NOT find it

### P0-3: Health Check False Positive ❌
- **File:** `packages/server/src/local/index.ts` (health endpoint)
- **Bug:** Health reports `llm.reachable: true` and `health: healthy` when API key is present but expired/invalid. Should validate key on startup or first use.
- **Fix needed:** On health check, if provider is `anthropic-proxy`, do a lightweight API call (list models or send minimal completion) to verify key actually works. Cache result for 5 min.
- **Effort:** 1-2 hours

### P0-4: Field Naming Inconsistency (`workspaceId` vs `workspace`)
- **Files:** Multiple route files, client code
- **Bug:** Some endpoints expect `workspaceId`, others expect `workspace`. Memory search uses `workspace` but frame creation uses `workspaceId`. Causes silent failures.
- **Fix needed:** Standardize on ONE name (recommend `workspace` for query params, `workspaceId` for body params). Accept both with alias for backwards compat.
- **Effort:** 1 day

### P0-5: Font-Mono on Non-Code Elements
- **Files:** `app/src/views/CockpitView.tsx`, sidebar components, context panel, various UI components
- **Bug:** `font-mono` class applied to headings, navigation labels, dashboard cards, status text. Makes app look like a terminal, not a product.
- **Fix needed:** Replace `font-mono` with `font-sans` on all non-code text. Keep mono ONLY for: code blocks, technical values (tokens, hashes), terminal output.
- **Effort:** 2-3 hours

### P0-6: Remove Stale Placeholder Text
- **File:** `app/src/views/MissionControlView.tsx`
- **Bug:** "Wave 8A" placeholder text visible in production UI.
- **Fix:** Remove or replace with real content.
- **Effort:** 15 minutes

### P0-7: Replace `window.confirm()` with AlertDialog
- **File:** `app/src/views/MissionControlView.tsx`
- **Bug:** Uses browser native confirm dialog — looks unprofessional, breaks desktop app UX.
- **Fix:** Replace with shadcn AlertDialog component (already imported elsewhere).
- **Effort:** 30 minutes

---

## P1 — BLOCKS RETENTION / FIRST DAY (~1-2 weeks)

### P1-1: search_content / search_files Filesystem Scoping
- **Files:** `packages/agent/src/system-tools.ts` or tool execution layer
- **Bug:** `search_content` and `search_files` search entire filesystem (D:\Projects\...) instead of workspace directory. Returns node_modules junk, other projects, causes 211K token overflow → API error.
- **Fix needed:** Scope glob resolution to `workspace.directory` field. If no directory set, use CWD. Cap results at 50 matches or 10K chars.
- **Effort:** 2-3 hours

### P1-2: File Tools Ignore Workspace Directory
- **Files:** Tool execution layer, `packages/agent/src/system-tools.ts`
- **Bug:** `read_file`, `bash`, `git_status` all execute from `C:\Users\MarkoMarkovic` (server CWD), not workspace directory.
- **Fix needed:** Set CWD from `workspace.directory` before tool execution. Relative paths resolve to workspace root.
- **Effort:** 2-3 hours

### P1-3: Slash Command LLM Fallbacks
- **File:** `packages/server/src/local/routes/chat.ts` (command handlers)
- **Bug:** `/draft`, `/research`, `/plan`, `/decide`, `/review`, `/spawn` return errors or empty templates when workflow runner unavailable.
- **Fix needed:** For each command, wire up LLM-powered fallback that uses the agent loop (memory recall → LLM response). The prompt enrichment already exists and is well-designed — just needs connection to agent loop.
- **Effort:** 3-4 hours

### P1-4: Graceful LLM Degradation
- **Bug:** When `auto_recall` succeeds but LLM call fails, user sees only error message. The 12 recalled memories are thrown away.
- **Fix needed:** When LLM fails after recall, show recalled memories as context: "Here's what I found in memory [memories]. I can't generate a response right now because [error]."
- **Effort:** 2 hours

### P1-5: /status Should Show Workspace Activity
- **File:** `/status` command handler
- **Bug:** Returns only "Skills loaded: 58" — no session stats, memory count, task count, cost.
- **Fix needed:** Include: workspace name, frame count, session count, tasks (open/total), cost today, last activity time.
- **Effort:** 1-2 hours

### P1-6: Onboarding Wizard
- **Files:** New component in `app/src/components/onboarding/`
- **Bug:** New user sees blank SPA with no guidance. 268 capabilities hidden.
- **Fix needed:** First-run wizard: choose template → set API key → first workspace → first message → show "268 capabilities" → done.
- **Effort:** 3-5 days

### P1-7: Approval Gates — Test Mode / Auto-Approve Config
- **Files:** `packages/agent/src/confirmation.ts`, server config
- **Bug:** In automated testing, approval gates timeout and auto-deny all tool calls (bash, write_file, generate_docx). No way to bypass for testing.
- **Fix needed:** Add `WAGGLE_AUTO_APPROVE=1` env var or config flag that auto-approves all tool requests. Document that this is for testing only.
- **Effort:** 1-2 hours

### P1-8: Result Truncation for search_content
- **Bug:** When search returns massive results, entire payload injected into prompt → exceeds 200K token limit → HTTP 400.
- **Fix needed:** Cap search results at 50 matches or 10K chars. Append "[truncated — N more results]".
- **Effort:** 1 hour

### P1-9: Memory Frame Deduplication
- **Bug:** Posting identical content twice creates two separate frames.
- **Fix needed:** Before insert, hash content and check for existing frame with same hash in same mind. If exists, update access count instead of creating duplicate.
- **Effort:** 2-3 hours

### P1-10: Memory Frame Deletion
- **Bug:** No `DELETE /api/memory/frames/:id` endpoint exists.
- **Fix needed:** Add DELETE endpoint with proper auth.
- **Effort:** 1 hour

---

## P2 — BLOCKS GROWTH / TEAMS TIER (~3-4 weeks)

### P2-1: Team CRUD API
- **Bug:** No `/api/teams` endpoint. Teams are implicit groupings only.
- **Fix needed:** Full CRUD: create team, invite members, list teams, assign workspace to team.
- **Effort:** 1 week

### P2-2: Role Enforcement
- **Bug:** Viewer-role workspaces can write memory frames. Roles are decorative.
- **Fix needed:** Middleware that checks role before write operations. Viewer = read only, Member = read/write, Admin = all.
- **Effort:** 1 week

### P2-3: Audit Trail (`/api/events`)
- **Bug:** Endpoint returns 404. No audit logging.
- **Fix needed:** Log all tool calls, memory writes, workspace changes to events table. Expose via API with filters.
- **Effort:** 1 week

### P2-4: Per-Workspace Cost Tracking
- **Bug:** `/api/costs` exists but no per-workspace breakdown accessible.
- **Fix needed:** Track cost per workspace per day. Expose via API and Cockpit dashboard.
- **Effort:** 3 days

### P2-5: Shared Activity Feed
- **Bug:** No cross-workspace event stream for teams.
- **Fix needed:** Aggregate events across team workspaces. Show in Mission Control.
- **Effort:** 1 week

### P2-6: Export Per-Workspace Filter
- **Bug:** Export dumps ALL data regardless of workspace parameter.
- **Fix needed:** Add workspace filter to export endpoint.
- **Effort:** 1 day

### P2-7: Workspace PATCH (Update)
- **Bug:** Cannot rename workspace or change group after creation.
- **Fix needed:** Add PATCH endpoint.
- **Effort:** 2 hours

### P2-8: Knowledge Graph API
- **Bug:** `/api/knowledge-graph` returns 404 despite entity extraction working internally.
- **Fix needed:** Mount knowledge graph routes on local server.
- **Effort:** 1 day

---

## P3 — ENTERPRISE (~3-6 months)

### P3-1: KVARK Integration (enterprise search, governance substrate)
### P3-2: SSO/SAML Authentication
### P3-3: Immutable Audit Logs
### P3-4: Data Residency Controls
### P3-5: Department-Level Dashboards
### P3-6: SOC 2 Certification Prep
### P3-7: Budget Controls Per Team/Department

---

## UX FIXES (from Visual Audit)

### UX-1: Typography — Remove font-mono from non-code (= P0-5)
### UX-2: Loading Skeletons for All Views
- Only Cockpit has skeletons. Chat, Memory, Events, Settings use basic spinners or blank screens.
- **Effort:** 2 days

### UX-3: Empty States with CTA
- "No memories yet" should say "Send your first message and I'll start remembering" with button.
- **Effort:** 1 day

### UX-4: Frame Type Labels
- I-Frame/P-Frame/B-Frame → "Facts" / "Decisions" / "Context" (user-friendly labels)
- **Effort:** 1 hour

### UX-5: Console Error Cleanup
- Previous audit found "console error storm" on load.
- **Effort:** 1-2 days

### UX-6: Responsive Sidebar at 1024px
- Sessions and search hidden at narrow viewports, no alternative access.
- **Effort:** 1 day

### UX-7: Auto-Recall Visualization
- When auto_recall fires, show memory chips/bubbles in chat UI. Make the "I remember" moment visible and delightful. This IS the killer feature — make it feel magical.
- **Effort:** 2-3 days

---

## BUGS FOUND ACROSS ALL ROUNDS (Consolidated)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| B1 | P0 | Workspace memory isolation not enforced | OPEN |
| B2 | P0 | Health check false positive (expired key → healthy) | OPEN |
| B3 | P0 | Proxy key priority mismatch (vault vs env) | ✅ FIXED |
| B4 | P0 | Font-mono on non-code elements | OPEN |
| B5 | P0 | Stale "Wave 8A" placeholder | OPEN |
| C1 | P1 | search_content searches entire filesystem | OPEN |
| C2 | P1 | No result truncation (211K token overflow) | OPEN |
| C3 | P1 | /draft echoes template instead of drafting | OPEN |
| C4 | P1 | /research returns error | OPEN |
| C5 | P1 | /plan returns error | OPEN |
| H1 | P1 | File tools ignore workspace directory | OPEN |
| H2 | P1 | /spawn fails (spawnAgent not in command context) | OPEN |
| H3 | P1 | Approval gates timeout in automated testing | OPEN |
| H4 | P1 | litellmApiKey was 'built-in' | ✅ FIXED (service.ts) |
| M1 | P1 | /catchup doesn't search memory as fallback | PARTIAL |
| M2 | P1 | /decide returns empty template | OPEN |
| M3 | P1 | /api/costs returns 302 redirect | OPEN |
| M4 | P2 | Stored XSS in memory (script tags stored verbatim) | OPEN |
| M5 | P2 | Export ignores workspaceId filter | OPEN |
| F1 | P2 | Viewer-role can write memory (roles decorative) | OPEN |
| F2 | P2 | No /api/events (audit trail) | OPEN |
| F3 | P2 | No /api/teams CRUD | OPEN |
| L1 | P2 | Memory dedup missing (identical content → 2 frames) | OPEN |
| L2 | P2 | No DELETE for memory frames | OPEN |
| L3 | P2 | Frame types mangled (all become P on retrieval) | OPEN |
| L4 | P2 | Knowledge graph API 404 | OPEN |
| L5 | P2 | Workspace PATCH missing | OPEN |
| L6 | P3 | Empty auto-sessions clutter list | OPEN |
| L7 | P3 | KG entity type misclassification | OPEN |

**Total: 29 bugs, 3 fixed, 26 open**

---

## WHAT'S GENUINELY GREAT (Don't Break These)

1. **Auto-recall** — Every message triggers semantic memory search. No competitor does this. THE killer feature.
2. **268 capabilities** — 53 tools + 157 connector tools + 58 skills. Massive surface.
3. **29 connectors + Composio 250+** — Enterprise-grade integration breadth.
4. **4,333 tests, 100% pass** — Engineering discipline is real.
5. **15,784 marketplace packages** — An ecosystem, not a feature.
6. **AI response quality** — When LLM works, responses are Claude.ai equivalent WITH persistent context.
7. **Vault** — AES-256-GCM, production-ready secret management.
8. **SSE streaming** — Clean protocol, incremental delivery, proper event types.
9. **Workspace templates** — 7 templates with persona, connectors, starter memory, suggested commands.
10. **Cost tracking** — Per-workspace, per-model, daily. Nobody else has this.

---

## RECOMMENDED EXECUTION ORDER

**Sprint 1 (3 days): P0 fixes**
→ Memory isolation, health check, field naming, font-mono, placeholders
→ After this: Solo tier is shippable for alpha users

**Sprint 2 (1 week): P1 core**
→ File scoping, slash command fallbacks, LLM degradation, result truncation, test mode bypass
→ After this: Full functional testing possible, dev persona works

**Sprint 3 (1 week): P1 UX + polish**
→ Onboarding wizard, auto-recall visualization, loading skeletons, /status enrichment
→ After this: Product feels professional, "wow" moment visible

**Sprint 4 (2 weeks): P2 teams**
→ Team CRUD, role enforcement, audit trail, shared feed
→ After this: Teams tier launchable

**After that: P3 enterprise (ongoing)**

---

## RE-TEST PLAN (After Fixes)

Run in 3 focused rounds, not one mega-test:

**Round 1: Infrastructure + AI (30 min)**
- Pre-flight: verify key, verify chat, verify memory isolation
- Test all 14 slash commands with real AI
- Memory CRUD with isolation verification
- 3 persona mini-journeys (Ana, Marko, Mia) — 5 chat messages each

**Round 2: UX + Visual (20 min)**
- Playwright screenshots all views (3 viewports, 2 themes)
- Compare to previous audit scores
- Check font-mono removal, loading states, empty states

**Round 3: Advanced + Team (30 min)**
- Sub-agent spawning, cron jobs, connectors
- Multi-workspace isolation stress test (5 workspaces, 10 frames each)
- Team simulation (mock data)
- Approval gates with auto-approver running

*Each round as separate Claude Code invocation to avoid context limit.*
