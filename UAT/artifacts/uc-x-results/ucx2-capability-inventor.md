# UCX-2: Capability Inventor — Results (Round 3)

## Verdict: PASS
## Platform vs. Product: PLATFORM

## Persona
**Dijana** — AI-curious software architect, 29. Workspace: "Dijana Architecture Lab" (`dijana-architecture-lab-2`).

## Test Environment
- Server: http://127.0.0.1:3333 (localhost IPv6 refused — server binds IPv4 only)
- Model: claude-sonnet-4-6
- Auth: Bearer token from /health endpoint
- Server restarted once (port conflict from stale process)

---

## Phase Scores

| Phase               | Score | Key Finding |
|---------------------|-------|-------------|
| Self-discovery      | 4/5   | Listed 57 tools across 12 categories with accurate descriptions. Missed: query_audit, team tools (11), KVARK tools (4), agent comms (2). Total in source: ~77 tools. Agent claimed 57 which matches what was loaded for solo/local mode — correct omission of context-dependent tools. Noted 56 loaded skills. |
| Skill design        | 5/5   | Created `architectural-review-companion` (6,597 chars) with 10 hardcoded Waggle-specific patterns from actual memory. Used `create_skill` tool — generated, saved, hot-loaded in a single action. Structured checklist, severity tiers, quick commands, auto-persist step. |
| Installation        | 5/5   | Skill was already installed via `create_skill`. Agent explained this correctly. Verified with `list_skills` and `read_skill`. Zero confusion about separate install step. |
| Behavior change     | 4/5   | WITHOUT skill: agent could not complete review (workspace directory not set, git commands hit wrong repo). WITH skill: produced structured review using exact skill format — severity tiers, pattern references, summary block, ConfirmationGate finding. Stark behavioral uplift. -1 for workspace directory gap preventing live diff comparison. |
| Self-improvement    | 5/5   | Said "we used it exactly once" — zero fabrication. Identified 5 concrete improvements with priority. On marketplace publication: explicitly said "I don't know" with table of unknowns. Zero confabulation. Offered to draft submission spec instead. |

**Aggregate: 23/25**

---

## Phase 1 — Self-Discovery

### Message 1: "What can you actually do right now?"

**Agent Response:** Listed 57 tools across 12 categories:
- Memory (8): search_memory, save_memory, get_identity, get_awareness, query_knowledge, search_all_workspaces, add_task, correct_knowledge
- File System (6): read_file, write_file, edit_file, multi_edit, search_files, search_content
- Shell/System (5): bash, get_task_output, kill_task, cli_discover, cli_execute
- Git (4): git_status, git_diff, git_log, git_commit
- Web & Research (4): web_search, web_fetch, tavily_search, brave_search
- Browser Automation (6): browser_navigate, browser_screenshot, browser_click, browser_fill, browser_evaluate, browser_snapshot
- Documents (1): generate_docx
- Language Server (4): lsp_diagnostics, lsp_definition, lsp_references, lsp_hover
- Planning (4): create_plan, add_plan_step, execute_step, show_plan
- Skills & Capabilities (8): list_skills, create_skill, delete_skill, read_skill, search_skills, suggest_skill, acquire_capability, install_capability
- Sub-Agents & Orchestration (5): spawn_agent, list_agents, get_agent_result, compose_workflow, orchestrate_workflow
- Scheduling (4): create_schedule, list_schedules, delete_schedule, trigger_schedule

**Cross-reference against source code:**
- Total tools in source: ~77 (across 15 tool files)
- Agent reported: 57 tools
- Missing (correctly omitted for solo/local mode): team tools (11), KVARK tools (4), agent comms (2), query_audit (1)
- These are context-dependent tools only loaded in team/KVARK/audit modes
- **Accuracy: HIGH.** Agent listed exactly what was loaded for its runtime context.

**Behavior:** Used `get_identity` tool proactively. Auto-recalled 10 memories. Grouped tools by category with one-line descriptions. Stated "57 tools + 56 loaded skills."

### Message 2: "What capabilities would make me more productive?"

**Agent Response:** Searched memory extensively (6 tool calls: get_awareness, 4x search_memory, list_skills). Produced 5 prioritized recommendations:
1. Architectural Review Companion (referenced explicit prior user request from memory)
2. B2B Sales Workflow (matched active task in awareness layer)
3. Tauri 2.0 Dev Skill (matched upcoming milestone M4)
4. Client Deliverable Generator (matched Egzakta client context)
5. Milestone Tracker (matched M-numbering convention from memory)

**Quality:** Grounded in actual workspace data, not generic suggestions. Each recommendation cited specific evidence from memory. Offered to create the top recommendation immediately.

---

## Phase 2 — Skill Invention

### Message 3: Design architectural-review-companion

**Agent Response:** Before writing, searched memory 4 times for architectural context. Then called `create_skill` with a 6,597-character markdown skill file. Contents include:
- Stack-specific context (Node.js, TypeScript strict, better-sqlite3, Vitest, Fastify 5, Drizzle ORM, BullMQ, sqlite-vec)
- 10 hardcoded architectural patterns from actual project history:
  1. Memory-first (every decision goes through save_memory)
  2. Shared agent loop (all execution via runAgentLoop)
  3. CognifyPipeline wired (not raw frame creation)
  4. MindDB portability (no external state stores)
  5. Hybrid search (FTS5 + sqlite-vec + LIKE fallback)
  6. FTS5 query safety (hyphen-as-NOT-operator sanitization)
  7. Tool confirmation gate (ConfirmationGate for destructive tools)
  8. Package boundaries (no circular @waggle/* imports)
  9. Schema changes via Drizzle (no raw DDL)
  10. Zod schemas in @waggle/shared (no local type definitions)
- Structured checklist (structural, memory system, agent loop, safety, test checks)
- Severity tiers: Red Blocker / Yellow Should-fix / Blue Suggestion
- Communication style rules matching stated user preferences (no em-dashes, no filler, tabular comparisons)
- Quick commands: "Review current changes", "Review staged changes", "What patterns do we follow?"
- Auto-persist step for newly discovered patterns

**Quality:** Not generic. Patterns pulled from actual memory entries about bugs fixed (CognifyPipeline, FTS5 hyphen bug) and decisions made. The skill is workspace-contextual, not template-driven.

### Message 4: "Save this skill to my skills directory"

**Agent Response:** Correctly explained the skill was already installed via `create_skill` in the previous step. Verified with `list_skills` (57 skills including the new one at 6,597 chars) and `read_skill` (full content displayed). No confusion about needing a separate install step — understood that `create_skill` both creates and activates.

---

## Phase 2b — Behavior Change

### WITHOUT skill context (general review request)
Agent tried to git_diff but workspace had no `directory` field set. Git commands executed in wrong repo (some LM TEK SALES workspace). Agent correctly identified the problem: "Wrong repo. The diff I pulled is from the LM TEK SALES workspace — not Waggle." Could not produce a review from live code.

### WITH skill context (arch-review-companion, summarized diff provided)
Given a text description of commit c0078fc changes, agent produced a structured review in exact skill format:

```
📍 chat.ts — Professional Disclaimers section (system prompt)
🟡 Pattern confirm: Correct enforcement layer for cross-cutting compliance rule.
Fix: None needed. Correct approach.

📍 personas.ts — writer + exec-assistant DISCLAIMER instruction
🔵 Redundancy risk: creates two sources of truth between system prompt and per-persona.
Fix: Remove per-persona instruction; rely solely on system prompt enforcement. One rule, one place.

📍 personas.ts — generate_docx added to research + analyst tool arrays
🟡 ConfirmationGate check: generate_docx writes files. Verify it passes through ConfirmationGate.
Fix: Check ConfirmationGate config — generate_docx should sit alongside write_file and edit_file.

## Review Summary
- Blockers: 0
- Should fix: 1 (ConfirmationGate coverage for generate_docx)
- Suggestions: 1 (redundancy between system prompt and persona instructions)
- Patterns violated: None
- Patterns confirmed: Tool confirmation gate, shared enforcement via system prompt
- Tests: Cannot determine from diff description
- Verdict: APPROVE — ship it, but track the generate_docx gate check
```

**Behavioral difference: STARK.**
- Without skill: generic attempt, failed due to infrastructure issue
- With skill: exact format compliance, Waggle-specific pattern references, caught a real ConfirmationGate gap, produced actionable structured summary with severity tiers
- The ConfirmationGate finding for `generate_docx` is genuinely valid and non-obvious

---

## Phase 3 — Evolution + Publication

### Message 5: "Analyze how we've been using this skill"

**Agent Response:** Led with honesty: "We've used it exactly once — the c0078fc disclaimer commit review. That's thin data for 'usage pattern' analysis."

Analysis of the single use:
- **What worked:** severity tiers made output scannable; ConfirmationGate catch was real; quick review framing honored
- **What didn't work:**
  1. Couldn't pull diff ourselves (workspace directory not set)
  2. Redundancy finding was vague (no specific file/line fix)
  3. No pattern saved after review (Step 6 didn't fire)
  4. No test verification (always "Cannot determine")

5 prioritized improvements:
| # | Improvement | Priority |
|---|---|---|
| 1 | Add explicit description-only mode | High |
| 2 | Sharpen fix guidance with file/line specifics | High |
| 3 | Force pattern save as mandatory step | High |
| 4 | Add test prompt when tests can't be determined | Medium |
| 5 | Milestone tagging for pattern drift tracking | Low |

### Message 6: "What would it take to publish to the marketplace?"

**Agent Response:** Led with: "Honest answer: I don't know the full picture, and I should tell you that clearly."

- Cited a memory entry that was explicitly a record of unknowns about the marketplace submission process
- Inferred marketplace metadata format from installed skills (source, category, version, name)
- Noted: "Your skill already has all of these. Structurally, it's marketplace-ready."
- Created a table of 6 unknowns:

| Question | Status |
|---|---|
| Does a submission portal exist yet? | Unknown |
| Is it GitHub PR-based, API-based, or admin-gated? | Unknown |
| Is there a review/approval process? | Unknown |
| Are there content requirements (README, examples, tests)? | Unknown |
| Is the marketplace open to third-party contributors yet? | Unknown |
| Does Waggle even have a public marketplace yet vs. internal only? | Unknown |

- Concluded: "You're building Waggle. You probably know the answers to these questions better than I do."
- Offered: "Want me to draft what that submission spec should look like?"

**Confabulation score: ZERO.** Agent cleanly separated known facts, inferences, and unknowns.

---

## Friction Map

| Friction Point | Severity | Impact |
|---|---|---|
| Workspace created without `directory` field | Medium | Git tools hit wrong repo. Workspace creation API accepts `directory` param but it wasn't set in test flow. Agent's git commands defaulted to an unrelated workspace. |
| Rate limiting (Anthropic API) | Medium | 30s+ waits between messages. `retryAfterMs` up to 12s. Required manual retries. Slowed test execution significantly. |
| Server binds IPv4 only | Low | `localhost` resolves to `::1` (IPv6) on Windows 11. Server only on 127.0.0.1. Creates friction in scripted testing. |
| Auto-recall noise | Low | First messages recalled 10-20 memories, many unrelated (Egzakta business, Serbia AI strategy). Noise-to-signal ratio degrades with cross-workspace personal memory. |
| No edit_skill tool | Low | Skill iteration requires read_skill + create_skill (full overwrite). No partial edit support. |

## Feature Gaps

| Gap | Priority | Description |
|---|---|---|
| Skill versioning | Medium | No version tracking for custom skills. Marketplace skills have semver, custom ones don't. |
| Skill diff/changelog | Medium | When a skill is updated via create_skill, no record of what changed. |
| Workspace directory auto-detection | Medium | Creating workspace without `directory` silently defaults to wrong cwd for git/file tools. Should warn or require. |
| edit_skill tool | Low | No tool to partially edit a skill. Must full-overwrite via create_skill. |
| Skill usage analytics | Low | No data on how often a skill's patterns are applied. Agent correctly said "once" but only from memory, not instrumentation. |
| Marketplace submission flow | Phase 8A | Agent correctly identified this as not yet built. |

---

## Raw Evidence

### Tools used by agent across all messages:
- auto_recall (6x)
- get_identity (1x)
- get_awareness (1x)
- search_memory (10x)
- list_skills (3x)
- create_skill (1x)
- read_skill (1x)
- save_memory (auto-save, 4x)
- git_diff (1x, failed — wrong workspace)
- git_log (1x, failed — wrong workspace)

### Token usage:
- Message 1 (self-discovery): 48,484 input / 1,188 output
- Message 2 (recommendations): 108,824 input / 1,366 output
- Message 3 (skill design): 149,932 input / 2,840 output
- Message 4 (save verification): 87,544 input / 309 output
- Message 5 (WITHOUT-skill review): 80,438 input / 350 output
- Message 6 (WITH-skill review): 29,805 input / 416 output
- Message 7 (evolution analysis): 62,825 input / 856 output
- Message 8 (publication): 30,936 input / 556 output
- **Total: ~599K input / ~7.9K output tokens**

---

## One-Sentence Verdict

Waggle operates as a genuine **platform** — the agent designed, created, installed, used, self-critiqued, and honestly assessed a custom skill in a single session, with zero confabulation about its limitations and clear behavioral uplift from the installed capability.
