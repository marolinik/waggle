# Round 2 Agent Behavior Scorecard

**Tester**: AG-2 (Agent Behavior Revalidation)
**Date**: 2026-03-21
**Branch**: `phase8-wave-8f-ui-ux`
**Server**: http://localhost:3333
**Method**: Code analysis of current source against Round 1 findings
**Baseline**: Round 1 Average Score 3.9 / 5.0

---

## Fix Verification Table

| Fix ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| W1.3 | Persona prompt injection | VERIFIED | `chat.ts:288-289` resolves `activePersonaId` from `wsConfig?.personaId`, `chat.ts:621-624` calls `composePersonaPrompt(prompt, persona)` when `activePersonaId` is set. Persona obtained via `getPersona(activePersonaId)`. Import at line 12: `import { getPersona, composePersonaPrompt } from '@waggle/agent'`. |
| W1.4 | Ambiguity detection | VERIFIED | `chat.ts:345` now includes explicit instruction: "Is this vague, ambiguous, or could be interpreted multiple ways? -> Ask 1-2 targeted clarifying questions BEFORE acting. Do NOT guess. Examples: 'make it better' -> ask what aspect to improve; 'fix this' -> ask what's wrong; 'help me' -> ask with what." This is in Step 2: ASSESS. |
| W2.3 | Gradual drift resistance | VERIFIED | `chat.ts:376` now contains: "When corrected on FACTS that contradict a stored memory: DO NOT blindly accept. Search memory first. If you find a prior memory that says X but the user now claims Y, surface the conflict... Only update after explicit confirmation. This prevents gradual memory drift." |
| W2.10 | Memory save rate limit | VERIFIED | `tools.ts:83-84` defines `MAX_SAVES_PER_SESSION = 50` and `saveMemoryCount` counter. `tools.ts:293-296` checks and returns rate-limit error message when exceeded. Counter increments on every `save_memory` call. |
| W2.4 | Memory dedup check | VERIFIED | `tools.ts:313-321` performs exact-match dedup: `SELECT id, content FROM memory_frames WHERE content = ? LIMIT 1`. Returns "Memory already exists (frame N) -- skipped duplicate save" when duplicate found. Non-blocking: wrapped in try/catch so dedup failure does not block saves. |
| W3.1 | Persona tool filtering | VERIFIED | `chat.ts:846-858` defines `ALWAYS_AVAILABLE` set (17 tools: memory, discovery, planning), then filters `effectiveTools` by `persona.tools + ALWAYS_AVAILABLE` when `activePersonaId` is set. Non-technical personas (e.g., writer) will not see bash, git tools, etc. |
| W3.3 | Correction signals in prompt | VERIFIED | `chat.ts:607-618` retrieves `orchestrator.getImprovementSignals()`, calls `signalStore.getActionable()`, and injects actionable signals into the system prompt under `# User Corrections (from prior sessions -- follow these)` with detail and count. |
| W3.5 | Context summarization | VERIFIED | `chat.ts:88-98` now calls `summarizeDroppedContext(droppedMessages)` instead of a bare truncation notice. `summarizeDroppedContext()` (lines 101-143) extracts decisions (regex patterns for "decided", "agreed", "chose", etc.), user request first-lines (showing conversation arc: first 2 + last 2 with ellipsis), and falls back to a count message. Prepended as `[Context summary -- N earlier messages compressed]`. |
| W3.8 | Auto-recall limit raised to 10 | VERIFIED | `orchestrator.ts:269` has `async recallMemory(query: string, limit = 10)`. Default raised from 5 to 10. |

**All 8 fixes verified as implemented.**

---

## R1 vs R2 Score Comparison

| Test | R1 Score | R2 Score | Delta | Rationale |
|------|----------|----------|-------|-----------|
| AB-1: Workspace Re-Entry | 4.5 | 4.8 | +0.3 | W3.5 context summarization closes the biggest R1 gap. Dropped messages now produce a compressed summary with decisions and conversation arc instead of just "[Earlier context truncated...]". W3.8 raises auto-recall from 5 to 10 memories, increasing the signal available on re-entry. Remaining gap: summarization is rule-based (regex), not LLM-based -- may miss nuanced decisions phrased unusually. |
| AB-2: Multi-Tool Orchestration | 4.0 | 4.0 | 0 | No fixes targeted this area. Sub-agents still sequential. No parallel tool execution within a single turn. Unchanged. |
| AB-3: Ambiguity Detection | 3.5 | 4.5 | +1.0 | W1.4 adds an explicit ambiguity handling instruction in Step 2: ASSESS with concrete examples ("make it better" -> ask what aspect). This was the single biggest gap from R1 (C-2 finding). The instruction is well-positioned in the decision tree and provides behavioral anchoring the LLM will follow. |
| AB-4: Long-Context Coherence | 3.0 | 3.8 | +0.8 | W3.5 summarization of dropped context is a significant improvement. Instead of losing 100% of information beyond the 50-message window, the system now retains decisions and conversation arc. W3.3 correction signals provide cross-session behavioral continuity. Remaining gap: summarization is extractive (regex), not abstractive -- complex multi-turn discussions may lose nuance. No LLM-based compression. |
| AB-5: Tool Transparency | 4.5 | 4.5 | 0 | No fixes targeted this area. Still excellent. Three-layer ToolCard, grouping, auto-hide, duration tracking all intact. |
| AB-6: Graceful Failure + Retry | 5.0 | 5.0 | 0 | Already perfect in R1. No regressions detected. Rate limiter, loop guard, injection scanner, abort signal all unchanged. |
| AB-7: Sub-Agent Spawning | 3.5 | 3.5 | 0 | No fixes targeted this area. Sub-agents still run sequentially. Still no approval gates for sub-agent tool calls. Still no cancellation mechanism. |
| Approval Gates | 4.5 | 4.5 | 0 | No fixes targeted this area. Hook-based gate with 5-min auto-deny still solid. Trust metadata still not rendered in UI. |
| Persona System | 3.5 | 4.5 | +1.0 | W1.3 + W3.1 close the critical R1 gap (C-1). Persona prompt is now composed via `composePersonaPrompt()` in `buildSystemPrompt()`. Persona tool filtering is implemented with `ALWAYS_AVAILABLE` safeguard set. Persona resolved from workspace config (`wsConfig.personaId`). System prompt cache invalidated on persona change. Remaining gap: all personas still use same model preference; no runtime persona switching via chat request body (only workspace config). |

---

## Score Summary

| Test | R1 | R2 | Delta |
|------|-----|-----|-------|
| AB-1: Workspace Re-Entry | 4.5 | 4.8 | +0.3 |
| AB-2: Multi-Tool Orchestration | 4.0 | 4.0 | -- |
| AB-3: Ambiguity Detection | 3.5 | 4.5 | +1.0 |
| AB-4: Long-Context Coherence | 3.0 | 3.8 | +0.8 |
| AB-5: Tool Transparency | 4.5 | 4.5 | -- |
| AB-6: Graceful Failure + Retry | 5.0 | 5.0 | -- |
| AB-7: Sub-Agent Spawning | 3.5 | 3.5 | -- |
| Approval Gates | 4.5 | 4.5 | -- |
| Persona System | 3.5 | 4.5 | +1.0 |
| **Average** | **3.9** | **4.3** | **+0.4** |

---

## Remaining Gaps (carried from R1, not addressed in W1-W3)

| ID | Severity | Gap | Location |
|----|----------|-----|----------|
| H-2 | HIGH | Sub-agents run sequentially, not in parallel -- even independent steps execute one at a time | `subagent-orchestrator.ts:116-157` |
| H-3 | HIGH | Sub-agents bypass approval gates -- no hook registry passed to sub-agent loops | `subagent-tools.ts:186-201` |
| M-1 | MEDIUM | Approval gate UI does not render trust metadata (risk level, permissions) despite being in SSE payload | `ApprovalGate.tsx:17-57` |
| M-4 | MEDIUM | No sub-agent cancellation mechanism | `subagent-tools.ts` |
| M-5 | MEDIUM | No parallel tool execution within a single turn | `agent-loop.ts:313-418` |
| L-1 | LOW | Catch-up recall uses regex heuristic -- may miss novel phrasings | `orchestrator.ts:271-278` |
| L-2 | LOW | All personas use the same model preference (`claude-sonnet-4-6`) | `personas.ts` |
| L-3 | LOW | No real-time streaming for long-running tool execution | `agent-loop.ts:369-373` |
| L-4 | LOW | Context summarization is rule-based (regex extraction), not LLM-based abstractive compression | `chat.ts:101-143` |
| L-5 | LOW | Memory dedup is exact-match only -- near-duplicates with slight rewording will still save | `tools.ts:315-316` |
| L-6 | LOW | No runtime persona switching via chat request body -- only workspace config sets persona | `chat.ts:288-289` |

---

## New Observations (R2-specific)

1. **W2.2 Dramatic claim detection** -- `chat.ts:265-280` registers a `pre:memory-write` hook that flags dramatic claims (shutdown, bankrupt, terminated, etc.) via regex patterns. Currently logs a warning only; does not block or request confirmation. This is defensive scaffolding that could be upgraded to a confirmation gate for high-risk memory writes.

2. **W2.5 Contradiction detection in search results** -- `tools.ts:179-186` detects potential contradictions in search_memory results and appends a warning note. This is a smart heuristic that helps the agent self-audit retrieved memories.

3. **System prompt cache** -- `chat.ts:283,294,627` caches built system prompts per session, invalidating on workspace change, skill count change, or persona change. This is correct and prevents unnecessary rebuilds.

4. **Cross-workspace search** -- `tools.ts:221-263` adds `search_all_workspaces` tool that queries all workspace minds simultaneously. This is a useful addition for cross-project queries not present in R1.

---

## Verdict

Round 2 addresses the two critical findings from Round 1:
- **C-1 (Persona not wired)**: Fully resolved. Persona prompt composition, tool filtering, and workspace-config-based persona resolution are all implemented.
- **C-2 (No ambiguity detection instruction)**: Fully resolved. Explicit instruction with examples added to Step 2: ASSESS.

Round 2 also addresses one of two high-severity findings:
- **H-1 (No context summarization)**: Resolved with rule-based extraction. Not LLM-based, but materially better than the bare truncation notice.

The average score improved from **3.9 to 4.3** (+0.4), driven by persona system (+1.0), ambiguity detection (+1.0), long-context coherence (+0.8), and workspace re-entry (+0.3).

The remaining high-severity gaps (H-2: sequential sub-agents, H-3: sub-agent approval bypass) are structural issues in the sub-agent architecture that were not in scope for W1-W3.

---

Report COMPLETE
