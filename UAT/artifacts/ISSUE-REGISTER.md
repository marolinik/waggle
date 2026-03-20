# Waggle V1 UAT — Issue Register

**Generated**: 2026-03-20 | **Branch**: `phase8-wave-8f-ui-ux`

---

## CRITICAL (4 issues — must fix before any external user)

| ID | Issue | Source | File | Fix Effort |
|----|-------|--------|------|------------|
| C-1 | **Web mode renders blank page** — SPA fallback intercepts `/assets/*` requests, serving HTML instead of JS/CSS. Static asset MIME types wrong. | AG-7 (UX-1) | `packages/server/src/local/index.ts:1224-1232` | 30 min |
| C-2 | CSP header discrepancy: source code defines `script-src 'self'` but running server sends `'self' 'unsafe-inline' 'unsafe-eval'` — stale build or override | Orchestrator | `packages/server/src/local/security-middleware.ts:26` vs HTTP response | 30 min |
| C-3 | **Persona prompt injection NOT wired** — `composePersonaPrompt()` defined in `personas.ts` but never called in `buildSystemPrompt()`. Selecting a persona has zero effect on agent behavior. | AG-2 + AG-3 | `packages/server/src/local/routes/chat.ts`, `packages/agent/src/personas.ts` | 1 hr |
| C-4 | No explicit ambiguity detection in system prompt — agent may guess on vague requests instead of asking clarifying questions | AG-2 (AB-3) | `packages/server/src/local/routes/chat.ts:239-505` | 30 min |

---

## HIGH (11 issues — ship-week V1.0.1)

| ID | Issue | Source | File | Fix Effort |
|----|-------|--------|------|------------|
| H-1 | EventsView Session Replay not wired — `workspaceId` prop not passed from App.tsx | AG-1 | `app/src/App.tsx:986-993` | 15 min |
| H-2 | Sidebar shortcut labels (`^1-^7`) ambiguous — actual shortcuts are `Ctrl+Shift+1-7` but `^` suggests `Ctrl` only | AG-1 | `app/src/components/AppSidebar.tsx` | 30 min |
| H-3 | Sidebar nav order differs from shortcut numbering — `^2` next to "Capabilities" but `Ctrl+Shift+2` goes to Memory | AG-1 | `app/src/components/AppSidebar.tsx`, `app/src/hooks/useKeyboardShortcuts.ts` | 1 hr |
| H-4 | Context panel fixed at 280px with no collapse toggle — content squeeze on narrow viewports | AG-7 | `packages/ui/src/components/layout/AppShell.tsx:28` | 2 hr |
| H-5 | `responsive-utils.ts` defines breakpoints but is never imported — zero responsive behavior | AG-7 | `packages/ui/src/utils/responsive-utils.ts` | 2 hr |
| H-6 | Sub-agents bypass approval gates — no hook registry passed to sub-agent execution | AG-2 | `packages/agent/src/agent-loop.ts` | 2 hr |
| H-7 | No automatic entity extraction from conversation — KG requires CognifyPipeline activation | AG-6 | `packages/core/src/mind/knowledge.ts` | 4 hr |
| H-8 | /catchup returns empty for default workspace — infrastructure built but requires workspace .mind setup | AG-6 | `packages/server/src/local/routes/commands.ts` | 2 hr |
| H-9 | KVARK: Missing 429 rate-limit handling + exponential backoff | AG-8 | `packages/server/src/kvark/kvark-client.ts` | 2 hr |
| H-10 | Context window capped at 50 messages with no summarization of truncated context | AG-2 | `packages/server/src/local/routes/chat.ts:79-92` | 4 hr |
| H-11 | KVARK: Missing 403 Forbidden handling in client | AG-8 | `packages/server/src/kvark/kvark-client.ts:201-213` | 30 min |

---

## MEDIUM (12 issues — V1.1)

| ID | Issue | Source | File |
|----|-------|--------|------|
| M-1 | LiteLLM models endpoint returns empty — model selector shows no options | AG-1 | `/api/litellm/models` |
| M-2 | AgentIntelligenceCard exists but unused (dead code) | AG-1 | `app/src/components/cockpit/AgentIntelligenceCard.tsx` |
| M-3 | ContextPanel for Mission Control returns null (no context content) | AG-1 | `app/src/components/ContextPanel.tsx` |
| M-4 | SettingsPanel hardcodes `http://127.0.0.1:3333` instead of configurable base URL | AG-1 | `packages/ui/src/components/settings/SettingsPanel.tsx:57` |
| M-5 | Default workspace may share personal mind DB — workspace-scoped search returned 0 results | AG-6 | `packages/server/src/local/routes/memory.ts` |
| M-6 | Knowledge graph API returns flat list — no graph query endpoint (traverse, neighbors) | AG-6 | `packages/server/src/local/routes/knowledge.ts` |
| M-7 | Decision extraction uses brittle keyword matching (`LIKE '%decided%'`) | AG-6 | `packages/server/src/local/workspace-state.ts:86-94` |
| M-8 | Embedding quality degrades to deterministic mock when LiteLLM unavailable | AG-6 | `packages/core/src/mind/litellm-embedder.ts:20-27` |
| M-9 | Sub-agents execute sequentially — no parallel tool execution | AG-2 | `packages/agent/src/agent-loop.ts:313-418` |
| M-10 | Persona selection not wired into chat route system prompt composition | AG-2 | `packages/server/src/local/routes/chat.ts` |
| M-11 | Correction detector is reactive (post-response) not proactive (pre-response) | AG-2 | `packages/agent/src/correction-detector.ts` |
| M-12 | KVARK: Zero enterprise tier UI visibility (Settings, Cockpit, Onboarding, Chat) | AG-8 | Multiple UI files |

---

## LOW (6 issues — polish)

| ID | Issue | Source | File |
|----|-------|--------|------|
| L-1 | Keyboard shortcuts help overlay has no visible entry point (Ctrl+/ is hidden) | AG-1 | `app/src/components/KeyboardShortcutsHelp.tsx` |
| L-2 | BEM-style CSS class names in SettingsPanel (style inconsistency with Tailwind) | AG-1 | `packages/ui/src/components/settings/SettingsPanel.tsx` |
| L-3 | Chat endpoint is `POST /api/chat` (SSE) — no REST endpoint for simple request/response | AG-1 | `packages/server/src/local/routes/chat.ts` |
| L-4 | .mind database NOT encrypted at rest — only vault secrets encrypted | AG-6 | `packages/core/src/mind/db.ts` |
| L-5 | FTS5 tokenizer `porter unicode61` may miss non-English content | AG-6 | `packages/core/src/mind/schema.ts:67-70` |
| L-6 | API endpoint paths in test spec don't match actual routes (documentation errors) | AG-1 | UAT test spec |

---

## INFO (notable observations)

| ID | Observation | Source |
|----|-------------|--------|
| I-1 | Server health endpoint is comprehensive (LLM status, DB health, memory stats, service health) | AG-1 |
| I-2 | All 5 recommended capability packs installed and complete | AG-1 |
| I-3 | 29 connectors registered with typed tools and risk levels | AG-1 |
| I-4 | 8 personas with distinct profiles and workspace affinities | AG-1 |
| I-5 | 9 cron schedules configured (8 enabled) | AG-1 |
| I-6 | I/P/B frame memory model is a genuine architectural differentiator | AG-6 |
| I-7 | Hybrid search (FTS5 + sqlite-vec + RRF) is production-grade | AG-6 |
| I-8 | Vault uses AES-256-GCM with atomic writes and Windows permission hardening | AG-6 |
| I-9 | Approval gates: 5-minute auto-deny timeout, hook-based, 3-tier risk classification | AG-2 |
| I-10 | Loop guard: oscillation detection, MAX_RETRIES=3, exponential backoff with user messages | AG-2 |
| I-11 | KVARK client contract 100% implemented with typed error hierarchy | AG-8 |
| I-12 | Competitive position: Waggle wins +2 on 4 of 5 benchmark dimensions | AG-5 |
| I-13 | Code-split views via React.lazy() + Suspense (ChatView eagerly loaded) | AG-1 |
| I-14 | 15,238 marketplace packages across MCP servers, plugins, and skills | Orchestrator |
| I-15 | 46 knowledge graph entities and 90 relations in live system | AG-6 |

---

## Status Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 4 | Must fix pre-launch (~2.5 hr total) |
| HIGH | 11 | Ship-week V1.0.1 (~21 hr total) |
| MEDIUM | 12 | V1.1 roadmap |
| LOW | 6 | Polish / future sprints |
| INFO | 15 | Observations, no action |
| **Total** | **48** | |
