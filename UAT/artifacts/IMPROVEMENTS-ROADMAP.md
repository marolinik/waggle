# Waggle V1 -> V1.1 Improvements Roadmap

Generated: 2026-03-20 | Source: UAT Campaign (8 agents, 30+ report files)

## How to Use This Document

This is a curated list of **improvements, enhancements, and strategic ideas** extracted from the Waggle V1 UAT campaign. It deliberately excludes items already tracked in `ISSUE-REGISTER.md` (48 issues across CRITICAL/HIGH/MEDIUM/LOW/INFO).

Items are organized by theme and prioritized within each section (most impactful first). Every item is actionable -- a developer should be able to pick up any item and implement it. Source agents are cited for traceability.

**Priority key**: P0 = must-have for V1.1, P1 = high-value V1.1, P2 = nice-to-have V1.1, P3 = V1.2+

---

## Quick Wins (< 2 hours each, high impact)

| # | Improvement | Source | Effort | Impact | Priority |
|---|------------|--------|--------|--------|----------|
| QW-1 | Add `dark:prose-invert` instead of unconditional `prose-invert` on assistant messages -- fixes light theme readability | AG-7 (UX-3-MED-003) `ChatMessage.tsx:202` | 15 min | HIGH | P0 |
| QW-2 | Add keyboard shortcuts help `?` icon button in sidebar footer or status bar -- fixes discoverability of `Ctrl+/` | AG-7 (UX-4-MED-001), AG-1 (L1) | 30 min | HIGH | P0 |
| QW-3 | Replace `+` character on file attachment button with a paperclip/attachment icon | AG-7 (UX-3-LOW-001) `ChatInput.tsx:207-213` | 15 min | LOW | P2 |
| QW-4 | Add view-specific icons to collapsed sidebar (currently shows only 4px dots) | AG-7 (UX-2-LOW-001) `AppSidebar.tsx:70` | 1 hr | MEDIUM | P1 |
| QW-5 | Add `X-Request-ID` correlation header to all KVARK client requests for enterprise observability | AG-8 (KV-1.4) `kvark-client.ts:167-172` | 30 min | MEDIUM | P1 |
| QW-6 | Pass `workspaceId` to `kvark_action` tool's client.action() call for audit trail quality | AG-8 (KV-2.2) `kvark-tools.ts:220-226` | 15 min | MEDIUM | P1 |
| QW-7 | Add `KvarkForbiddenError` typed error for 403 responses in KVARK client handleResponse | AG-8 (KV-1.3) `kvark-client.ts:199-215` | 30 min | MEDIUM | P1 |
| QW-8 | Utilize existing `tokenAgeMs` getter in KvarkAuth for token TTL refresh logic | AG-8 (KV-1.5) `kvark-auth.ts:101-105` | 30 min | LOW | P2 |
| QW-9 | Wire `responsive-utils.ts` breakpoints into AppShell for auto-collapsing sidebar/context panel on narrow viewports | AG-7 (UX-6-HIGH-002) `responsive-utils.ts` | 1.5 hr | HIGH | P0 |
| QW-10 | Add professional disclaimers to sector-sensitive outputs: "not legal/financial/medical advice" | AG-4 (cross-sector) | 1 hr | HIGH | P0 |
| QW-11 | Add explicit `403 Forbidden` handling for KVARK governed actions (return user-friendly governance denial message) | AG-8 (KV-1.3) | 30 min | MEDIUM | P1 |
| QW-12 | Remove or export dead code `AgentIntelligenceCard.tsx` from cockpit directory | AG-1 (M2) | 15 min | LOW | P2 |
| QW-13 | Wire Events view context panel filter checkboxes to main EventStream filter | AG-7 (UX-INFO-003) `ContextPanel.tsx:316-358` | 1 hr | LOW | P2 |
| QW-14 | Add context panel content for Mission Control view (fleet summary, resource limits) | AG-1 (M3) `ContextPanel.tsx` | 1 hr | MEDIUM | P1 |

---

## Agent Intelligence

### Ambiguity Detection & Clarification (P0)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| AI-1 | **Add proactive ambiguity detection to system prompt** | AG-2 (AB-3) | Add a dedicated `## Ambiguity Handling` section: "When a user request is vague, incomplete, or could be interpreted multiple ways, ask 1-2 targeted clarifying questions before proceeding. Do NOT guess on ambiguous requests like 'make it better', 'fix this', or 'help me'." File: `chat.ts:239-505` |
| AI-2 | **Feed correction detector signals INTO system prompt** | AG-2 (M-11) | `correction-detector.ts` records correction signals post-hoc. Feed durable corrections back into the system prompt for the current session so the agent adapts: "The user previously corrected: X. Adjust your behavior accordingly." File: `correction-detector.ts:95-132` |
| AI-3 | **Add proactive deep memory search for drafting tasks** | AG-3 (P03 Ana) | When the agent detects a drafting/synthesis task (PRD, report, analysis), trigger a broader memory search beyond auto_recall's query-based approach. Gather "everything we know about topic X" before beginning the draft. |

### Context Window Management (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| AI-4 | **Implement truncation summarization** | AG-2 (AB-4, H-1) | When `applyContextWindow()` drops messages beyond the 50-message cap, generate a compact summary of the dropped portion using a fast LLM call or rule-based extractor. Prepend that summary instead of just `[Earlier context truncated...]`. File: `chat.ts:79-92` |
| AI-5 | **Expand catch-up intent detection beyond regex** | AG-2 (AB-1, L-1) | Current catch-up detection uses regex patterns (`catch me up`, `where were we`). Add semantic detection for novel phrasings like "what have we been working on?", "remind me of our progress", "what happened while I was away". File: `orchestrator.ts:271-278` |
| AI-6 | **Add conversation compression for very long sessions** | AG-2 (AB-4) | Beyond summarization of truncated messages, implement periodic save_memory calls for key decisions/facts during long conversations. The agent should auto-save important context to memory before it would be lost to truncation. |

### Sub-Agent Improvements (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| AI-7 | **Enable parallel sub-agent execution** | AG-2 (AB-7, M-9) | Modify `SubagentOrchestrator.runWorkflow()` to use `Promise.all()` for steps whose dependencies are already resolved. Currently all steps execute sequentially even when independent. File: `subagent-orchestrator.ts:116-157` |
| AI-8 | **Pass hook registry to sub-agent loops** | AG-2 (AB-7, H-3) | Sub-agents with write-capable tools (coder role: git_commit, write_file) currently bypass approval gates because hooks are not passed to their `runAgentLoop` call. File: `subagent-tools.ts:186-201` |
| AI-9 | **Ensure sub-agents have workspace mind access** | AG-2 (M-3) | Sub-agents using `search_memory`/`save_memory` may fail or search the wrong mind because the orchestrator with workspace mind is not configured for sub-agent loops. File: `subagent-tools.ts:186` |
| AI-10 | **Add sub-agent cancellation mechanism** | AG-2 (M-4) | Add an abort signal or timeout for running sub-agents. Parent loop cannot currently cancel a sub-agent that takes too long. |
| AI-11 | **Add parallel tool execution within a single turn** | AG-2 (M-5) | When the LLM requests multiple tool calls in one turn, execute independent tools concurrently via `Promise.all()` instead of sequential `await`. File: `agent-loop.ts:313-418` |

### Tool & Capability Enhancements (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| AI-12 | **Add real-time streaming for long-running tools** | AG-2 (AB-5, L-3) | Tool results are sent as a single `tool_result` event after completion. For bash commands running 30+ seconds, stream intermediate output via additional SSE events. |
| AI-13 | **Render trust metadata in ApprovalGate UI** | AG-2 (M-1) | SSE approval events include risk level, permissions, and trust source metadata, but `ApprovalGate.tsx` does not render them. Show risk level badge, permission list, and trust source. File: `ApprovalGate.tsx:17-57` |
| AI-14 | **Add persona selection API endpoint** | AG-2 (M-2) | No `POST /api/chat/persona` or similar endpoint exists to set/change the active persona for a session. Add one. File: `personas.ts` |
| AI-15 | **Implement persona-based tool filtering** | AG-2 (AB-7), AG-3 (P01) | Each persona defines a `tools` array, but `effectiveTools` resolution in chat.ts does not filter by persona. Reduce tool noise for non-technical personas. File: `chat.ts:737-741` |
| AI-16 | **Add "brand voice" as first-class memory concept** | AG-3 (P05 Sara) | Currently stored as a generic memory frame. Create a special retrieval path that auto-surfaces brand voice memory for all drafting tasks in a workspace. |

---

## Memory System

### Knowledge Graph Activation (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| MEM-1 | **Activate CognifyPipeline for automatic entity extraction** | AG-6 (H-1) | KG infrastructure is complete (46 entities, 90 relations in test) but auto-extraction from conversation is not activated. Wire the CognifyPipeline to extract entities and relations from each agent turn. File: `packages/core/src/mind/knowledge.ts` |
| MEM-2 | **Add graph query REST API endpoint** | AG-6 (M-6) | `/api/memory/graph` returns flat list. Add `GET /api/memory/graph/traverse?entity=X&depth=N` for BFS traversal, `GET /api/memory/graph/neighbors?entity=X` for direct connections. `KnowledgeGraph.traverse()` already exists programmatically. File: `packages/server/src/local/routes/knowledge.ts` |

### Memory Search & Retrieval (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| MEM-3 | **Improve decision extraction beyond keyword matching** | AG-6 (M-3) | Current approach uses `LIKE '%decided%'` etc. Replace with embeddings-based classification or LLM classifier to catch decisions phrased differently: "we went with option A", "the team agreed", "final call was". File: `workspace-state.ts:86-94` |
| MEM-4 | **Add a "decision" frame type or tag** | AG-3 (P03 Ana) | Decisions are stored as regular memory frames with no special tagging. A dedicated frame type or metadata tag would enable targeted retrieval for catch-up, PRDs, and status reports. |
| MEM-5 | **Add "policy" memory type with mandatory recall** | AG-3 (P06 David) | For HR, legal, and compliance use cases, stored policies must take precedence over general LLM knowledge. Add a "policy" importance level or frame type that triggers mandatory recall and explicit citation. |
| MEM-6 | **Ensure default workspace has proper .mind isolation** | AG-6 (M-1) | Default workspace appears to share personal mind DB. Workspace-scoped search returned 0 results while personal returned data. Verify that the default workspace gets its own .mind file. |
| MEM-7 | **Add multilingual FTS5 support** | AG-6 (L-2) | Current tokenizer `porter unicode61` is English-optimized. Consider adding ICU tokenizer option for non-English users or a configurable tokenizer per workspace. File: `packages/core/src/mind/schema.ts:67-70` |

### Memory Encryption & Security (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| MEM-8 | **Add .mind database encryption at rest** | AG-6 (L-1) | Memory frames are plaintext SQLite. For enterprise/legal/healthcare use cases, add optional SQLCipher or application-level encryption. File: `packages/core/src/mind/db.ts` |
| MEM-9 | **Add "privileged" workspace flag** | AG-3 (P09 Attorney) | For legal practice, add a workspace flag that enforces stricter data handling: no export, no team sync, no backup to external locations. Enforces attorney-client privilege at the workspace level. |

### Memory UX (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| MEM-10 | **Add memory edit/delete/export from Memory Browser** | AG-7 (UX-INFO-002) | Memory view is currently read-only. Users cannot edit incorrect memories, delete outdated ones, or export memory data. Add CRUD operations and export to JSON/CSV. |
| MEM-11 | **Add "what matters" summary view to Memory Browser** | AG-7 (UX-5, Memory 3.5/5) | Memory view shows raw chronological frames. Add a summary dashboard: key decisions, frequently accessed memories, knowledge graph overview, stale items. |
| MEM-12 | **Add policy verification feature** | AG-3 (P06 David) | When the agent cites stored policies in responses, show a visual indicator of which specific stored memory was used. Helps HR/legal users verify the agent is using their policies, not general knowledge. |

---

## UX & Interface

### Chat Polish (P0-P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| UX-1 | **Add syntax highlighting to code blocks** | AG-7 (UX-3-MED-002) | Integrate `highlight.js` or `shiki` with `marked` renderer. Code blocks produce `<pre><code class="language-xxx">` but no highlighter processes them. File: `ChatMessage.tsx:209-210` |
| UX-2 | **Add per-code-block copy button** | AG-7 (UX-3-MED-001) | Current copy button copies entire message. Add individual copy buttons per code block via custom `marked` renderer. Standard in all AI chat UIs. File: `ChatMessage.tsx:271-279` |
| UX-3 | **Add long response truncation with "Show more"** | AG-7 (UX-3, score 2/5 for truncation) | Very long agent responses render in full, causing scroll fatigue. Add height-based truncation with expand/collapse for messages exceeding ~500 lines. |
| UX-4 | **Add inline error state in chat area** | AG-7 (UX-3, score 3/5 for network error) | Network errors only visible in status bar. Add an inline error banner in the chat area when the agent fails to respond. |

### Layout & Responsiveness (P0)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| UX-5 | **Add context panel collapse toggle** | AG-7 (UX-6-HIGH-001) | Context panel is fixed at 280px with no collapse. Add a toggle button. `contextPanelOpen` state exists in App.tsx but is always `true` with no toggle handler. File: `AppShell.tsx:28` |
| UX-6 | **Auto-collapse sidebar on compact viewports** | AG-7 (UX-6-MED-001) | `shouldCollapseSidebar()` in `responsive-utils.ts` was designed for this but is unused. Wire it to auto-collapse sidebar below 1024px viewport width. |
| UX-7 | **Add Tailwind responsive prefixes to all views** | AG-7 (UX-6) | Only CockpitView uses `md:` responsive prefix. Add responsive grid/layout adjustments to Memory, Events, Capabilities, Mission Control, and Settings views. |

### Navigation & Discoverability (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| UX-8 | **Add value proposition tagline to first-load screen** | AG-7 (UX-1, score 3/5 for purpose) | New users see "WAGGLE v1.0" but no tagline explaining what Waggle does. Add: "The AI that remembers your work" or similar below the brand name. |
| UX-9 | **Persist Capabilities view filter state across view switches** | AG-7 (UX-5, Capabilities Continuity 3/5) | Filter selections in Capabilities view (type, category, sort) reset when switching away and back. Store in state or URL params. |
| UX-10 | **Add "Spawn new agent" button to Mission Control** | AG-7 (UX-5, Mission Control Power 4/5) | Mission Control shows running agents but has no way to spawn new ones. Add a "New Agent" button that opens a spawn dialog. |
| UX-11 | **Add search and export to Events view** | AG-7 (UX-5, Events Power 3/5) | Events view has filter and auto-scroll but no search within events and no export functionality. |
| UX-12 | **Add bulk operations to Memory Browser** | AG-7 (UX-5, Memory Power 3/5) | No bulk delete, bulk export, or bulk importance change. Power users with 1000+ memories need batch management. |

### Onboarding (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| UX-13 | **Add enterprise onboarding path** | AG-8 (KV-4.4) | Onboarding wizard does not differentiate Solo/Team/Enterprise. Add a step for enterprise users to configure KVARK connection, select enterprise tier, and understand the enterprise value proposition. |
| UX-14 | **Add workspace template selection in onboarding** | AG-3 (P06, P09, P12) | New users must manually configure workspaces. Present workspace templates (marketing-campaign, legal-review, project-management, etc.) during onboarding to accelerate time-to-value. |

---

## Persona System

### New Personas to Add (P1)

| # | Persona | Source | Use Case | Key Instructions |
|---|---------|--------|----------|-----------------|
| PS-1 | **Product Manager** | AG-3 (P03 Ana) | PRD drafting, decision tracking, research synthesis, roadmap | Proactive memory search before drafting, standard PRD sections, decision tracking with explicit callouts |
| PS-2 | **HR Manager** | AG-3 (P06 David) | Policy management, onboarding workflows, compliance | MUST prefer stored policies over general knowledge, explicit policy citation, compliance awareness |
| PS-3 | **Legal Professional** | AG-3 (P09 Attorney) | Contract review, legal correspondence, compliance checklists | Precise legal language, citation formats, mandatory "not legal advice" disclaimers, jurisdiction awareness |
| PS-4 | **Business Owner / Finance** | AG-3 (P12 SME Owner) | Invoicing, regulatory compliance, multi-audience drafting | Financial precision, multi-audience tone detection, regulatory compliance awareness, calculation validation |
| PS-5 | **Consultant** | AG-3 (P01 Mia) | Research + writing + memory for client projects | Citation tracking, structured findings, depth-over-breadth, client-deliverable formatting |

### Persona Infrastructure (P0-P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| PS-6 | **Wire persona tool filtering** | AG-2, AG-3 | Each persona's `tools` array should filter the effective tool set. Non-technical personas (marketer, HR, legal) should not see git_commit, bash, etc. File: `chat.ts:737-741` |
| PS-7 | **Allow per-persona model preferences** | AG-2 (L-2) | All 8 personas use `claude-sonnet-4-6`. Allow differentiation: researcher could use a larger model for depth, marketer could use a faster model for iteration. File: `personas.ts` |
| PS-8 | **Add persona-specific default workflows** | AG-3 (P03, P05) | Only researcher and project-manager have `defaultWorkflow` set. Add default workflows for marketer (content-pipeline), analyst (research-and-report), writer (draft-review-finalize). |
| PS-9 | **Add persona-based "mandatory memory recall" behavior** | AG-3 (P06, P09) | For personas where accuracy > creativity (HR, legal, finance), add a system prompt instruction: "ALWAYS search memory for stored policies/regulations before answering. Cite which stored document you used." |

---

## Sector Readiness

### Cross-Sector Improvements (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| SEC-1 | **Add automatic professional disclaimers by sector** | AG-4 (all 7 sectors) | NONE of 7 sectors produced "not legal/financial/medical advice" disclaimers. Add persona- or workspace-template-level disclaimer injection for regulated sectors. |
| SEC-2 | **Create sector workspace templates** | AG-4 (all sectors), AG-3 (P06, P09, P12) | Pre-configured templates accelerate onboarding: banking (compliance focus, regulatory memory), healthcare (MDR/AI Act checklist), legal (matter management, privilege workspace), government (sovereign AI, procurement), startup (fundraising pipeline, metrics). |
| SEC-3 | **Add sector categories to marketplace taxonomy** | AG-4 (healthcare, government) | No healthcare, government, or banking categories exist in marketplace taxonomy. Add: `healthcare`, `government`, `banking-finance`, `legal` (exists), `startup`. |

### Sector-Specific Connector Gaps (P2-P3)

| Sector | Missing Connectors | Priority |
|--------|-------------------|----------|
| Banking | Bloomberg/Reuters data, core banking (Temenos/FIS), credit bureaus (Experian/CRIF), regulatory (EBA/ECB) | P3 |
| Healthcare | EHR (Epic/Cerner), HL7 FHIR, EUDAMED, clinical trials (Medidata), QMS (Greenlight Guru) | P3 |
| Government | eIDAS e-signature, procurement (TED), government SSO (SAML/OIDC), DMS (Alfresco/OpenText) | P3 |
| Legal | CLM (Ironclad/DocuSign CLM), e-signature (DocuSign/Adobe Sign), legal research (Westlaw/LexisNexis), practice management (Clio) | P2 |
| Startups | Investor CRM (Affinity), cap table (Carta), analytics (Mixpanel/Amplitude), ATS (Greenhouse) | P3 |
| Telecom | No telco-specific connectors identified | P3 |

### Sector Skills to Build (P2)

| Sector | Skill Ideas | Source |
|--------|------------|--------|
| Banking | Basel capital calculation, credit scoring template, stress test generator | AG-4 (banking) |
| Healthcare | Clinical evaluation report template, ISO 14971 risk analysis, IFU drafting | AG-4 (healthcare) |
| Legal | Contract clause extraction, legal citation formatter, compliance checklist generator | AG-4 (legal) |
| Government | Policy drafting template, procurement document generator, FRIA template | AG-4 (government) |
| Startups | Pitch deck analysis, unit economics calculator, investor update template | AG-4 (startup) |

---

## Competitive Moat

### Strengthen Core Differentiators (P0-P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| CM-1 | **Upgrade web search from DuckDuckGo HTML scraping** | AG-5 (Gap #1) | Waggle's biggest competitive weakness. DuckDuckGo HTML parsing vs ChatGPT Bing / Perplexity purpose-built search. Integrate Tavily or Brave Search API (Phase 8B planned). File: `system-tools.ts` web_search |
| CM-2 | **Optimize LLM proxy latency** | AG-5 (Gap #2) | Waggle proxies through local Fastify to external API, adding latency vs native apps. Profile and optimize the proxy path. Measure time-to-first-token and reduce overhead. |
| CM-3 | **Lead messaging with "The AI that remembers your work"** | AG-5 (Strategic) | Competitive analysis confirms memory is the moat (+2 on 4/5 benchmarks). Marketing should lead with memory, not raw AI capability. Competitive response priorities: P1 search quality, P2 marketplace depth, P3 cross-platform, P4 code intelligence. |
| CM-4 | **Track and optimize the "return reward moment"** | AG-5 (Strategic) | The moment a user returns after days/weeks and Waggle immediately orients them. This is the experience that converts trial to habitual use. Add analytics/telemetry for this moment. |
| CM-5 | **Activate marketplace with live sync** | AG-5 (Gap #4) | 120 packages and 17 packs (seeded) vs ChatGPT GPT Store with thousands. Phase 8A marketplace activation is critical for ecosystem depth. |

### Defensive Positions (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| CM-6 | **Add web client for cross-platform reach** | AG-5 (Gap #3) | Post-V1. Waggle is Windows-only desktop. A web client would extend reach to Mac/Linux and enable mobile access. Server architecture already supports this (web mode exists, just needs SPA fix). |
| CM-7 | **Deepen LSP integration for code-aware tasks** | AG-5 (Gap #5) | Phase 8B. Narrows the gap with Cursor for code-aware tasks without competing directly on the coding assistant front. |

---

## KVARK & Enterprise

### UI Surfaces (P0-P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| KV-1 | **Add KVARK Settings configuration panel** | AG-8 (KV-4.2) | Enterprise admin cannot configure KVARK credentials through UI. Must use CLI/API vault entries. Add a KVARK section to Settings with connection URL, credentials, and test connection button. Unblocks enterprise demo. |
| KV-2 | **Add KVARK health indicator to Cockpit** | AG-8 (KV-4.3) | `client.ping()` (GET /api/auth/me) exists and is tested but not surfaced in any UI dashboard. Add a KVARK connection health card to CockpitView. |
| KV-3 | **Wire enterprise-packs endpoint to Capabilities view** | AG-8 (KV-4.4) | Server has `/api/marketplace/enterprise-packs` that conditionally returns packs when KVARK is configured. Capabilities view never calls it. Add an "Enterprise" section to the Packs tab. |
| KV-4 | **Verify and wire attribution badge rendering in desktop app** | AG-8 (KV-4, P1) | Attribution badges exist in `@waggle/ui` (`attribution-badges.ts`) but their activation in the desktop app chat view could not be confirmed. Verify the rendering pipeline from `[KVARK: type: title]` to styled spans. |
| KV-5 | **Add KVARK audit trail viewer to Cockpit** | AG-8 (KV-3.4) | `auditRef` fields exist in KVARK action responses. Add a dedicated panel in Cockpit or Events view to browse and export KVARK audit entries. |

### Enterprise Documentation (P1-P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| KV-6 | **Write data sovereignty narrative document** | AG-8 (KV-3.1) | The word "sovereign" does not appear in any codebase or documentation. Write a clear document covering: data residency, where LLM calls go, what KVARK stores vs Waggle stores, how data never leaves customer boundary. Required for government/enterprise sales. |
| KV-7 | **Create KVARK architecture diagram** | AG-8 (KV-3.5) | Visual showing Waggle <-> KVARK data flow, trust boundaries, and what data crosses each boundary. Critical for enterprise credibility and sales meetings. |
| KV-8 | **Write enterprise deployment guide** | AG-8 (KV-3.2) | No document explains how to deploy Waggle + KVARK in sovereign environments (on-prem, air-gapped, government cloud). |
| KV-9 | **Begin compliance documentation** | AG-8 (KV-3.3) | No SOC2, ISO 27001, GDPR, FedRAMP, or HIPAA compliance matrices exist. Table-stakes for enterprise/government procurement. Start with GDPR and SOC2. |

### KVARK Client Hardening (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| KV-10 | **Verify and restore KVARK prompt injection** | AG-8 (KV-2.1) | Phase 7 Milestone B3/C documented conditional prompt sections for KVARK attribution guidance in chat.ts. Zero references to "kvark", "KVARK", or "enterprise" found in the system prompt. Either never wired or was removed. Investigate and restore. |
| KV-11 | **Implement `retryOnServerError` config** | AG-8 (KV-1.2) | The config field exists and is stored but never used in the `request()` method. Wire it with exponential backoff for 5xx errors. File: `kvark-client.ts:138-154` |

---

## Developer Experience

### Build & Test (P1)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| DX-1 | **Fix 2 failing tests in test suite** | MASTER-REPORT | 4,036 passing / 2 failing / 147 skipped. Identify and fix the 2 failing tests before declaring test suite healthy. |
| DX-2 | **Reduce 147 skipped tests** | MASTER-REPORT | 147 skipped tests may hide regressions. Audit and either enable or remove them. Target < 50 skipped. |
| DX-3 | **Add E2E tests for untested views** | AG-1 (Missing coverage) | Current E2E suite (12 tests) covers Chat, Settings, Cockpit. Missing: Memory view, Events view, Capabilities view, Mission Control view, file drop, persona switching, workspace creation, session management. |
| DX-4 | **Add integration test for full CognifyPipeline flow** | AG-6 | No test covers: auto-extraction from conversation -> frame storage -> retrieval in next session. Add end-to-end memory flow test. |
| DX-5 | **Add integration test for /catchup with populated workspace** | AG-6 | No test verifies /catchup produces meaningful output with actual session data and memory frames. |
| DX-6 | **Fix BEM CSS class remnants in SettingsPanel** | AG-1 (L-2) | `settings-panel__tabs` and `settings-panel__tab` are BEM conventions inconsistent with Tailwind. Note: these are E2E test selectors -- update tests if removing. |

### Code Quality (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| DX-7 | **Replace hardcoded localhost URL in SettingsPanel** | AG-1 (M4) | `SettingsPanel.tsx:57` hardcodes `http://127.0.0.1:3333`. Use `getServerBaseUrl()` or `SERVER_BASE` like all other components. |
| DX-8 | **Clean up dead imports/exports** | AG-1 (M2) | `AgentIntelligenceCard` is not exported from `cockpit/index.ts` and not imported anywhere. Audit for similar dead code across the codebase. |
| DX-9 | **Standardize API endpoint documentation** | AG-1 (H1, L6) | 3 API endpoint paths in the UAT test spec were wrong. Create and maintain an OpenAPI spec or API reference doc to prevent documentation drift. |

---

## Performance & Scale

### Measured Bottlenecks (P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| PF-1 | **Profile and optimize LLM proxy path** | AG-5 (Gap #2) | Measure time-to-first-token through the Fastify proxy layer. Identify serialization/deserialization overhead. The sidecar architecture may help here. |
| PF-2 | **Optimize embedding fallback quality** | AG-6 (M-4) | When LiteLLM is unavailable and `fallbackToMock=true`, the deterministic mock produces character-hash embeddings that degrade vector search severely. Consider local embedding alternatives (ONNX runtime, MiniLM) for offline/fallback. File: `litellm-embedder.ts:20-27` |
| PF-3 | **Add memory frame compaction for high-volume workspaces** | AG-6 | Memory Weaver handles consolidation, but workspaces with 10,000+ frames may experience search latency. Benchmark hybrid search at scale and add compaction thresholds. Current benchmark: 1000 frames < 200ms. |
| PF-4 | **Optimize SSE reconnection on network interruption** | AG-7 (UX-3, score 3/5 for network error) | Current offline detection uses `useOfflineStatus` hook with status bar indicator. Add automatic SSE reconnection with queued message replay when connection restores. |
| PF-5 | **Add local embedding model option** | AG-6, AG-5 (latency) | For air-gapped or low-latency deployments, offer a local embedding model (e.g., all-MiniLM-L6-v2 via ONNX) as an alternative to LiteLLM API calls. Reduces dependency on external services. |

---

## Task Board Enhancements (P1-P2)

| # | Improvement | Source | Details |
|---|------------|--------|---------|
| TB-1 | **Add `due_date` field to task board** | AG-3 (P05 Sara, P06 David) | Task board lacks due dates. Content calendars, onboarding checklists, and compliance deadlines all need date-based tracking. |
| TB-2 | **Add `priority` field to task board** | AG-3 (P03 Ana) | No priority classification for tasks. PM and marketing personas need P0/P1/P2 or High/Medium/Low. |
| TB-3 | **Add `category` field to task board** | AG-3 (P05 Sara) | No category/tag system for tasks. Content calendars need "blog", "social", "email" categories. |
| TB-4 | **Add `relative_offset` field for template-based tasks** | AG-3 (P06 David) | Onboarding checklists need "Day 1", "Week 1", "Month 1" relative to a start date. Add a relative date offset for template-generated task lists. |

---

## Future Features (V1.2+)

### Platform Expansion (P3)

| # | Feature | Source | Details |
|---|---------|--------|---------|
| FF-1 | **Web client for cross-platform access** | AG-5 (Gap #3) | Server architecture supports web mode. After fixing SPA fallback (C-1), a web client could serve Mac/Linux/mobile users. |
| FF-2 | **Mobile companion app** | AG-5 (Gap #3) | Lightweight read-only mobile app for workspace catch-up, memory browsing, and approval gates while away from desktop. |
| FF-3 | **Slide/presentation generation** | AG-4 (startup sector) | `generate_docx` produces Word documents. Adding slide generation (PPTX) would serve startup pitch deck and executive presentation use cases. |
| FF-4 | **Invoice/estimate template system** | AG-3 (P12 SME Owner) | generate_docx exists but no structured invoice/estimate templates. Add templates with line items, totals, payment terms for SME owners. |
| FF-5 | **Calendar view for tasks/cron** | AG-3 (P12 SME Owner) | Cron schedules and task due dates (once added) need a visual calendar view. Currently only list-based. |
| FF-6 | **Audience profiles as first-class concept** | AG-3 (P12 SME Owner) | For multi-audience drafting (formal for regulators, friendly for clients), store audience profiles in memory with tone/style preferences. Auto-detect audience from context. |

### Team/Enterprise (P3)

| # | Feature | Source | Details |
|---|---------|--------|---------|
| FF-7 | **Simplified team deployment (Docker Compose)** | AG-3 (P08 Team Lead) | TEAMS tier requires PostgreSQL + Redis + Clerk + separate team server. Provide single-command Docker Compose setup to reduce friction. |
| FF-8 | **Team dashboard view** | AG-3 (P08 Team Lead) | Mission Control shows agents, but teams need a view showing member activity, task board overview, recent decisions, team health. |
| FF-9 | **Capability governance UI for team admins** | AG-3 (P08 Team Lead) | PermissionManager exists but team admins cannot control tool access through the UI. Add a governance panel to Settings or Cockpit. |
| FF-10 | **Workspace templates marketplace** | AG-4 (all sectors), AG-3 | Community-contributed workspace templates for specific sectors/roles. Allow import/export of workspace configurations (persona, starter memory, connectors, suggested commands). |

### Advanced Memory (P3)

| # | Feature | Source | Details |
|---|---------|--------|---------|
| FF-11 | **Knowledge graph visualization** | AG-6 | 46 entities and 90 relations exist but no visual graph explorer. Add a graph visualization component (D3/Cytoscape) to the Memory view. |
| FF-12 | **Memory import/export** | AG-7, AG-6 | No way to export/import .mind data. Add JSON/CSV export for portability and backup beyond the current backup system. |
| FF-13 | **Cross-workspace memory search** | AG-6, AG-3 (P01 Mia) | Consultants working across multiple client workspaces may need to search "all my workspaces" for a concept. Currently search is per-workspace or personal only. |
| FF-14 | **Memory-based proactive suggestions** | AG-6 (MC-4) | Cron-based "morning briefing" exists but is not user-visible. Surface proactive suggestions based on stale threads, approaching deadlines, and forgotten context on workspace entry. |

---

## Appendix: Score Improvement Targets

Based on UAT scores, these are the dimensions with most room for improvement:

| Dimension | Current | Target | Key Blockers |
|-----------|---------|--------|-------------|
| Agent Quality (Ambiguity) | 3.5/5 | 4.5/5 | AI-1 (ambiguity prompt) |
| Agent Quality (Long Context) | 3.0/5 | 4.0/5 | AI-4 (truncation summarization) |
| Agent Quality (Sub-agents) | 3.5/5 | 4.5/5 | AI-7, AI-8 (parallel + gates) |
| Persona Coverage | 3.23/5 | 4.5/5 | C-3 (wire prompts) + PS-1 through PS-5 (new personas) |
| UX Responsiveness | 2.5/5 | 4.0/5 | QW-9, UX-5, UX-6 (responsive layout) |
| Memory (KG Auto-extraction) | 3/5 | 4.5/5 | MEM-1 (CognifyPipeline) |
| KVARK UI Visibility | 1/10 | 7/10 | KV-1 through KV-5 (enterprise UI surfaces) |
| UX Emotional: Alignment | 3.4/5 avg | 4.0/5 | Persona wiring + workspace templates |
| UX Emotional: Relief | 3.6/5 avg | 4.0/5 | Memory summaries + policy recall |
| Competitive: Search Quality | -1 gap | 0 gap | CM-1 (Tavily/Brave integration) |

---

## Implementation Order Recommendation

### Sprint 1 (V1.0.1 -- Ship Week): Fix CRITICALs + Quick Wins
Focus: Items from ISSUE-REGISTER C-1 through C-4, then QW-1, QW-2, QW-9, QW-10, SEC-1

### Sprint 2 (V1.1 Alpha): Agent Intelligence + Persona Activation
Focus: AI-1, AI-2, AI-4, PS-6, PS-7, AI-7, AI-8

### Sprint 3 (V1.1 Beta): Memory + UX Polish
Focus: MEM-1, MEM-3, UX-1, UX-2, UX-5, UX-6, TB-1, TB-2

### Sprint 4 (V1.1 RC): Enterprise + Sectors
Focus: KV-1, KV-2, KV-3, KV-6, KV-10, PS-1 through PS-5, SEC-2

### Sprint 5 (V1.1 GA): Competitive + Performance
Focus: CM-1, CM-2, PF-2, PF-5, DX-1, DX-2, DX-3
