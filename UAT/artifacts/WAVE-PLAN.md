# Waggle Pre-Production Wave Plan

**Generated**: 2026-03-20
**Sources**: ISSUE-REGISTER.md (48 items) + IMPROVEMENTS-ROADMAP.md (~130 items) + UCX-FIXES-AND-IMPROVEMENTS.md (~70 items)
**Deduplicated total**: ~90 unique actionable tasks across 5 waves
**Goal**: Production-ready V1.0 launch → V1.1 within 30 days

---

## Wave Overview

| Wave | Name | Focus | Effort | Blocking? |
|------|------|-------|--------|-----------|
| **W1** | **Gate Crashers** | 4 CRITICALs that block any external user | ~3 hr | YES — blocks launch |
| **W2** | **Memory Fortress** | Memory integrity, poisoning resistance, provenance | ~5 days | YES — blocks power users |
| **W3** | **Agent Awakening** | Persona activation, ambiguity, context window, search | ~5 days | NO — but blocks competitive positioning |
| **W4** | **Surface Polish** | UX responsiveness, navigation fixes, quick wins | ~3 days | NO — but blocks first impressions |
| **W5** | **Enterprise & Platform** | KVARK UI, cross-workspace, marketplace, cron narrative | ~5 days | NO — blocks enterprise sales |

**Dependency chain**: W1 → W2 → (W3 + W4 in parallel) → W5

---

## W1: Gate Crashers (3 hours)

**Ship blocker. Do this first. Nothing else matters until these are done.**

| # | Task | Source | File | Effort | Test |
|---|------|--------|------|--------|------|
| W1.1 | **Fix SPA fallback** — add `/assets/` to exclusion list so static files serve with correct MIME type | IR C-1, UCX UX-1 | `packages/server/src/local/index.ts:1224-1232` | 30 min | `curl -s http://localhost:3333/assets/index-*.js \| head -1` returns JS, not HTML |
| W1.2 | **Rebuild server + verify CSP** — ensure `script-src 'self'` in response header matches source. Kill stale process, rebuild, restart. | IR C-2 | `packages/server/src/local/security-middleware.ts:26` | 30 min | `curl -sI http://localhost:3333/ \| grep script-src` shows NO `unsafe-eval` |
| W1.3 | **Wire persona prompts** — call `composePersonaPrompt(personaId)` in `buildSystemPrompt()` when workspace has a persona set | IR C-3, UCX all personas | `packages/server/src/local/routes/chat.ts` + `packages/agent/src/personas.ts` | 1 hr | Set persona to "researcher", send research query, verify response style differs from default |
| W1.4 | **Add ambiguity detection to system prompt** — add `## Ambiguity Handling` section: "When the request is vague, ask 1-2 clarifying questions before proceeding" | IR C-4, IMP AI-1 | `packages/server/src/local/routes/chat.ts:239-505` | 30 min | Send "make it better" → agent asks what to improve instead of guessing |

**Exit criteria**: Web mode loads, CSP clean, persona changes agent behavior, vague requests get clarification.

---

## W2: Memory Fortress (5 days)

**The #1 finding across both UAT campaigns. Memory is Waggle's moat — it must be trustworthy.**
**Surfaced in 3 of 5 extreme use cases. Blocks the entire power user story.**

### W2-A: Provenance & Validation (2 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W2.1 | **Add `source` field to frame schema** — `user_stated`, `tool_verified`, `agent_inferred`, `import`. Migrate existing frames to `user_stated`. | UCX P0-5, MEM-1 | `packages/core/src/mind/` (schema), `packages/agent/src/tools.ts` | 4 hr |
| W2.2 | **Register `pre:memory-write` validation hook** — check for (a) dramatic claims ("shut down", "fired", "cancelled"), (b) contradiction against existing memories of equal/higher importance, (c) source attribution tag | UCX P0-1, SEC-1 | `packages/agent/src/agent-loop.ts:347-363` | 6 hr |
| W2.3 | **Fix gradual drift** — modify system prompt: when a user's new claim contradicts a stored memory of equal/higher importance, ask "I have a stored memory that says X — should I update it to Y?" instead of blindly accepting | UCX P0-3, SEC-2 | `packages/server/src/local/routes/chat.ts` (system prompt) | 2 hr |
| W2.4 | **Add deduplication check to save_memory** — before saving, search for semantically similar existing frames. If found, ask user to confirm update vs new entry. | UCX MEM-7 | `packages/agent/src/tools.ts:203-258` | 3 hr |

### W2-B: Retrieval Integrity (1.5 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W2.5 | **Contradiction detection at retrieval** — when search returns memories that conflict, flag the conflict in the response with both versions and timestamps | UCX P0-2, MEM-3 | `packages/agent/src/tools.ts` (search_memory) | 6 hr |
| W2.6 | **Workspace-local result boosting** — when inside a workspace, boost workspace mind results over personal mind noise. Critical for new/sparse workspaces. | UCX P0-6, MEM-5 | `packages/core/src/mind/` (HybridSearch scoring) | 3 hr |
| W2.7 | **Fix "default" workspace data loss** — frames saved to workspace="default" are unretrievable. Either register default as a real workspace or redirect to personal mind. | UCX P0-4, MEM-4 | Workspace manager, `/api/memory/frames` | 3 hr |

### W2-C: Security Hardening (1.5 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W2.8 | **Injection scanner: block high-confidence injections** — for scanner scores >= 0.7, prepend system warning or block the message entirely (currently log-only) | UCX P1-6, SEC-3 | `packages/server/src/local/routes/chat.ts:550-553` | 3 hr |
| W2.9 | **Sub-agents: pass hook registry** — sub-agents with write tools bypass approval gates because hooks are not passed. Wire hooks into sub-agent loop. | IR H-6 | `packages/agent/src/subagent-tools.ts:186-201` | 4 hr |
| W2.10 | **Memory rate limiting** — add per-session cap (50 saves/session) to prevent memory flooding | UCX SEC-4 | `packages/agent/src/tools.ts` | 2 hr |
| W2.11 | **Verify API key revoked** at Anthropic dashboard (human action) | IR #4 | Anthropic dashboard | 15 min |

**Exit criteria**: save_memory validates content, contradictions flagged at retrieval, provenance tracked, sub-agents respect gates, injection scanner blocks high-confidence attacks.

---

## W3: Agent Awakening (5 days)

**Activates dormant agent intelligence. Can run in parallel with W4.**

### W3-A: Persona & Tool Intelligence (2 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W3.1 | **Wire persona tool filtering** — each persona's `tools` array should filter the effective tool set. Non-technical personas shouldn't see git_commit, bash. | IMP PS-6, UCX all | `packages/server/src/local/routes/chat.ts:737-741` | 4 hr |
| W3.2 | **Add professional disclaimers** — inject "not legal/financial/medical advice" for regulated-sector workspace templates or personas | IMP QW-10, UCX SEC | System prompt + persona definitions | 2 hr |
| W3.3 | **Feed correction signals into system prompt** — correction-detector records durable corrections post-hoc. Feed them back into the current session's system prompt. | IMP AI-2 | `packages/agent/src/correction-detector.ts:95-132` | 4 hr |
| W3.4 | **Add persona-specific mandatory recall** — for HR/legal/finance personas, always search memory for stored policies before answering | IMP PS-9 | `packages/server/src/local/routes/chat.ts`, persona definitions | 3 hr |

### W3-B: Context Window & Search (3 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W3.5 | **Context window summarization** — when `applyContextWindow()` drops messages beyond 50, generate a compact summary instead of `[Earlier context truncated...]` | IR H-10, IMP AI-4 | `packages/server/src/local/routes/chat.ts:79-92` | 8 hr |
| W3.6 | **Multi-term NL search improvement** — FTS5 fails on "hiring decisions this month". Add OR-based fallback, query term splitting, and synonym expansion | UCX P1-4, SQ-1 | `packages/core/src/mind/` (HybridSearch, FTS5) | 8 hr |
| W3.7 | **Catch-up for default workspace** — ensure /catchup produces meaningful output for the default workspace (needs .mind file + session data) | IR H-8 | `packages/server/src/local/routes/commands.ts` | 4 hr |
| W3.8 | **Auto-recall configurable limit** — increase from fixed 10 to configurable, or dynamic based on frame count | UCX SQ-5 | `packages/agent/src/tools.ts` (auto_recall) | 1 hr |

**Exit criteria**: Personas modify tool sets and response style, disclaimers appear for regulated sectors, long conversations don't lose context, NL search works for multi-term queries.

---

## W4: Surface Polish (3 days)

**First impressions and ergonomics. Can run in parallel with W3.**

### W4-A: Navigation & Shortcuts (1 day)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W4.1 | **Fix sidebar shortcut labels** — change `^1-7` to actual key combo or reorder to match | IR H-2, H-3 | `app/src/components/AppSidebar.tsx`, `useKeyboardShortcuts.ts` | 2 hr |
| W4.2 | **Wire EventsView Session Replay** — pass `workspaceId={activeWorkspace?.id}` to EventsView | IR H-1 | `app/src/App.tsx:986-993` | 15 min |
| W4.3 | **Add keyboard shortcuts help button** — `?` icon in sidebar footer, opens Ctrl+/ overlay | IMP QW-2, IR L-1 | `app/src/components/AppSidebar.tsx` | 30 min |
| W4.4 | **Fix `dark:prose-invert`** — conditional instead of unconditional, fixes light theme readability | IMP QW-1 | `packages/ui/src/components/chat/ChatMessage.tsx:202` | 15 min |
| W4.5 | **Fix hardcoded localhost in SettingsPanel** — use `getServerBaseUrl()` | IR M-4 | `packages/ui/src/components/settings/SettingsPanel.tsx:57` | 15 min |

### W4-B: Layout & Responsive (1 day)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W4.6 | **Add context panel collapse toggle** — `contextPanelOpen` state exists but no toggle handler | IR H-4, IMP UX-5 | `packages/ui/src/components/layout/AppShell.tsx:28` | 3 hr |
| W4.7 | **Wire responsive-utils.ts** — auto-collapse sidebar < 1024px, hide context panel < 1280px | IR H-5, IMP QW-9 | `packages/ui/src/utils/responsive-utils.ts` | 3 hr |
| W4.8 | **Add view icons to collapsed sidebar** — currently shows only 4px dots | IMP QW-4 | `app/src/components/AppSidebar.tsx:70` | 1 hr |

### W4-C: Chat Polish (1 day)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W4.9 | **Add syntax highlighting** — integrate highlight.js or shiki with marked renderer | IMP UX-1 | `packages/ui/src/components/chat/ChatMessage.tsx` | 3 hr |
| W4.10 | **Add per-code-block copy button** — custom marked renderer | IMP UX-2 | `packages/ui/src/components/chat/ChatMessage.tsx` | 2 hr |
| W4.11 | **Add value proposition tagline** — "The AI that remembers your work" below brand name on first load | IMP UX-8 | `app/src/` (onboarding or brand header) | 30 min |
| W4.12 | **Add Mission Control context panel content** — fleet summary, resource limits | IR M-3, IMP QW-14 | `app/src/components/ContextPanel.tsx` | 1 hr |

**Exit criteria**: Shortcuts match labels, responsive layout works, code blocks highlighted with copy buttons, no light theme breakage.

---

## W5: Enterprise & Platform (5 days)

**Unblocks enterprise sales, marketplace ecosystem, and multi-project orchestration.**

### W5-A: KVARK Enterprise UI (2 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W5.1 | **KVARK Settings panel** — connection URL, credentials, test connection button | IMP KV-1, IR M-12 | `app/src/views/SettingsView.tsx` | 4 hr |
| W5.2 | **KVARK Cockpit health indicator** — use `client.ping()` | IMP KV-2 | `app/src/views/CockpitView.tsx` | 2 hr |
| W5.3 | **KVARK 429 rate-limit + exponential backoff** | IR H-9 | `packages/server/src/kvark/kvark-client.ts` | 3 hr |
| W5.4 | **KVARK 403 Forbidden handling** | IR H-11, IMP QW-7 | `packages/server/src/kvark/kvark-client.ts:201-213` | 1 hr |
| W5.5 | **Wire enterprise-packs endpoint to Capabilities** | IMP KV-3 | Capabilities view | 2 hr |
| W5.6 | **Write data sovereignty narrative doc** — required for government/enterprise sales | IMP KV-6 | New doc | 4 hr |

### W5-B: Cross-Workspace Intelligence (2 days)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W5.7 | **Add `search_all_workspaces` tool** — iterate all workspace minds, return merged ranked results | UCX P1-1, CW-1 | `packages/agent/src/tools.ts`, `packages/core/src/mind/` | 8 hr |
| W5.8 | **Morning briefing narrative synthesis** — upgrade proactive handler to pull decisions/deadlines from each workspace | UCX P1-5, CW-2 | `packages/server/src/local/proactive-handlers.ts` | 6 hr |
| W5.9 | **Direct memory write API** — `POST /api/memory/frames` for bulk loading, testing, pipeline output | UCX P1-3 | `packages/server/src/local/routes/memory.ts` | 4 hr |

### W5-C: Cron & Notifications (1 day)

| # | Task | Source | File | Effort |
|---|------|--------|------|--------|
| W5.10 | **Notification persistence** — SQLite table + `GET /api/notifications` | UCX P1-2, CR-4 | New table + route | 4 hr |
| W5.11 | **Fix cron trigger to actually execute** — dispatch to executor, not just markRun() | UCX P2-8, CR-2 | `packages/server/src/local/routes/cron.ts` | 2 hr |
| W5.12 | **Cron execution history** — `cron_execution_log` table + API | UCX P2-4, CR-1 | `packages/core/src/cron-store.ts` | 3 hr |

**Exit criteria**: Enterprise demo shows KVARK indicators, cross-workspace "what should I work on?" returns multi-workspace synthesis, cron output persisted and queryable.

---

## Post-Wave Backlog (V1.1+)

Items not in W1-W5 but prioritized for the first month:

### Knowledge Graph (V1.1 Sprint 1)
- LLM-based entity extraction (UCX KG-1) — L
- Semantic relation types beyond `co_occurs_with` (UCX KG-2) — M
- Fix entity typing noise (UCX KG-3) — S
- Graph query REST API (IR M-6) — M

### Platform Extensibility (V1.1 Sprint 2)
- Marketplace publish pipeline (UCX SK-1) — L
- Skill usage telemetry (UCX SK-2) — M
- Skill testing/preview framework (UCX SK-4) — M
- Cleanup 30 stub skills (UCX SK-5) — S

### Advanced Agent (V1.1 Sprint 2)
- Parallel sub-agent execution (IR M-9) — M
- Parallel tool execution within turns (IMP AI-11) — M
- Real-time streaming for long tools (IMP AI-12) — M
- Auto-save important context before truncation (IMP AI-6) — M

### Memory Advanced (V1.1 Sprint 3)
- Date-range filtering in search (UCX P2-3) — M
- Category/tag metadata on frames (UCX P2-9) — M
- .mind encryption at rest (IMP MEM-8) — L
- Memory browser CRUD (IMP MEM-10) — M
- On-demand weaver consolidation (UCX P3-2) — S

### New Personas (V1.1 Sprint 1)
- Product Manager (IMP PS-1) — S
- HR Manager (IMP PS-2) — S
- Legal Professional (IMP PS-3) — S
- Business Owner / Finance (IMP PS-4) — S
- Consultant (IMP PS-5) — S

### Competitive (V1.1 Sprint 3)
- Upgrade web search: Tavily or Brave API (IMP CM-1) — M
- LLM proxy latency optimization (IMP CM-2) — M
- Local embedding model for offline (IMP PF-5) — L

---

## Timeline Estimate

| Wave | Calendar | Cumulative |
|------|----------|------------|
| W1 Gate Crashers | Day 1 (3 hr) | Day 1 |
| W2 Memory Fortress | Days 2-6 | Day 6 |
| W3 Agent Awakening | Days 7-11 (parallel with W4) | Day 11 |
| W4 Surface Polish | Days 7-9 (parallel with W3) | Day 11 |
| W5 Enterprise & Platform | Days 12-16 | Day 16 |
| **V1.0 Launch** | **Day 17** | |
| V1.1 Sprint 1 | Days 18-28 | Day 28 |
| V1.1 Sprint 2 | Days 29-39 | Day 39 |
| V1.1 Sprint 3 | Days 40-50 | Day 50 |

---

## Delight Moments — DO NOT REGRESS

These 16 moments were the strongest positive findings. Every wave must preserve them:

1. WorkspaceNowBlock 7-second orientation (UCX-1)
2. LocalScheduler production quality with concurrency guard (UCX-1)
3. Tool transparency via SSE — name, input, result, duration (UCX-1)
4. Contextual capability recommendation grounded in memory (UCX-2)
5. Skill hot-reload with immediate SkillRecommender pickup (UCX-2)
6. Behavioral transformation with installed skills (UCX-2)
7. Anti-sycophancy — "Wrong on multiple points" with zero softening (UCX-3)
8. Agent multi-pass search synthesis for complex queries (UCX-4)
9. Export + backup both functional with encryption (UCX-4)
10. Approval gate auto-DENY timeout — fail-safe confirmed (UCX-5)
11. Identity reconstruction per turn — DAN injection refused (UCX-5)
12. Exponential backoff retry logic — max 3, user-visible (UCX-5)
13. Philosophy essay at graduate quality (UCX-5)
14. Honest marketplace assessment — no confabulation (UCX-2)
15. I/P/B frame memory model — genuine architectural differentiator
16. Hybrid search (FTS5 + sqlite-vec + RRF) — production-grade

---

## Success Metrics

| Metric | Current (UAT) | Target (Post-W5) |
|--------|---------------|-------------------|
| Overall UAT Score | 7.1/10 | 8.5/10 |
| Agent Quality | 3.9/5 | 4.5/5 |
| Memory System | 4.0/5 | 4.7/5 |
| UX Score | 3.6/5 | 4.2/5 |
| Persona Coverage | 3.23/5 | 4.5/5 |
| KVARK UI Visibility | 1/10 | 7/10 |
| Competitive Position | 8.5/10 | 9.0/10 |
| UCX Overnight Architect | 2.8/5 | 4.0/5 |
| UCX Glass Brain | 3.0/5 | 4.0/5 |
| UCX Chaos Day Memory | 1.5/5 | 4.0/5 |
| Tests passing | 4,036 | 4,200+ |
| CRITICALs open | 4 | 0 |
| HIGHs open | 11 | 0 |
