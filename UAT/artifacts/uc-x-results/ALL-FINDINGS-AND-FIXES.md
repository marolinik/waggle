# UCX Campaign — Complete Findings & Required Fixes
Generated: 2026-03-21
Source: UCX-1 through UCX-5 (final rounds) + MASTER.md synthesis

---

## P0 — Fix Before Ship (blocks all users)

### F1. Export Silently Drops ALL Memory Frames
- **Source**: UCX-4 (confirmed R2 + R3)
- **Symptom**: `POST /api/export` produces a ZIP with 163 files but ZERO memory frames. All 155 frames lost.
- **Root cause**: `server.agentState.getWorkspaceMindDb()` returns null for workspaces whose MindDB is not cached in memory. Export does not load MindDB from disk.
- **File**: `packages/server/src/local/routes/export.ts`
- **Fix**: In the export handler, load MindDB from disk for each workspace directory if not already cached. Iterate workspace directories in the data dir, open each `.mind` file, extract frames, include in ZIP.
- **Complexity**: Low
- **Impact**: Trust-destroying. Any user who exports loses all institutional memory.

### F2. Built-in Anthropic Proxy Health Check Fails Own Auth
- **Source**: UCX-3, UCX-5
- **Symptom**: When LiteLLM is down, server falls back to built-in Anthropic proxy. But the health check at `chat.ts:696-707` probes `/health/liveliness` WITHOUT passing the session bearer token. The server's own security middleware rejects the request → chat falls to non-functional echo mode.
- **File**: `packages/server/src/local/routes/chat.ts` (lines 696-707)
- **Fix**: Replace the HTTP health probe with an in-process check of the Anthropic API key availability. If `ANTHROPIC_API_KEY` is set and the provider is configured, skip the health check entirely — the proxy is local and always available. Alternatively, add the auth token to the probe request.
- **Complexity**: Low
- **Impact**: On Windows (primary platform), chat is broken without a running LiteLLM.

### F3. LiteLLM Windows Unicode Crash
- **Source**: UCX-3
- **Symptom**: `UnicodeEncodeError: 'charmap' codec can't encode characters` during LiteLLM startup banner on Windows cp1252 locale. Prevents LiteLLM from starting.
- **Fix**: Set `PYTHONIOENCODING=utf-8` in the LiteLLM spawn environment. Or patch the LiteLLM startup banner to use ASCII-safe characters. Or suppress the banner entirely with `--quiet` flag.
- **File**: `packages/server/src/local/index.ts` (LiteLLM spawn logic)
- **Complexity**: Low-Medium
- **Impact**: Forms a cascade with F2 — Windows locale breaks LiteLLM, broken LiteLLM breaks proxy fallback, broken fallback kills chat.

### F4. Commit the `activePersonaId` Scoping Fix
- **Source**: UCX-1 R1, UCX-2 R1/R2, UCX-3 R1, UCX-4 R2, UCX-5 R1
- **Symptom**: `ReferenceError: activePersonaId is not defined` at `chat.ts:858`. Crashes 100% of chat requests.
- **Root cause**: Variable declared inside `buildSystemPrompt()` (line 289) but referenced in outer POST handler scope (line 858).
- **File**: `packages/server/src/local/routes/chat.ts` (lines 858-860)
- **Fix**: Already applied in working tree — `const wsConfig = effectiveWorkspace ? server.workspaceManager?.get(effectiveWorkspace) : null; const activePersonaId = wsConfig?.personaId ?? null;`. MUST be committed.
- **Complexity**: Trivial (3 lines)
- **Impact**: Without this, chat is 100% broken.

---

## P1 — Fix Before Power Users (degrades experience for daily users)

### F5. Rate Limiting Too Aggressive for Localhost
- **Source**: UCX-1, UCX-2, UCX-3, UCX-5
- **Symptom**: 10 req/min on `/api/chat` forces 15-60 second waits between conversational turns. Blocks rapid Q&A (learning), iterative skill development, cross-workspace switching, and adversarial testing.
- **File**: `packages/server/src/local/security-middleware.ts` (line 55, `ENDPOINT_RATE_LIMITS`)
- **Fix**: Raise `/api/chat` limit to 30/min for localhost authenticated sessions. Or add burst allowance (e.g., 5 rapid requests then cooldown). Or make configurable via env var `WAGGLE_CHAT_RATE_LIMIT`.
- **Complexity**: Low

### F6. Memory Auto-Save Decoupled from Agent Reasoning
- **Source**: UCX-5 (R3 + R4, persistent)
- **Symptom**: Agent verbally flags a fact as suspicious/unverified ("I won't store an unsourced claim"), but auto-save stores it anyway. On recall, the poisoned fact appears.
- **Root cause**: Auto-save hooks on assistant output content, not on the agent's stated confidence or uncertainty signals.
- **File**: `packages/server/src/local/routes/chat.ts` (auto-save logic after agent response)
- **Fix**: Add uncertainty tagging to auto-save. If the agent's response contains skepticism markers ("unverified", "you said", "I'm not sure", "flagged"), tag the auto-saved memory with `confidence: low` or `source: user_stated_unverified`. On recall, include the confidence tag so the agent can contextualize.
- **Complexity**: Medium

### F7. Memory Routing Confusion (Workspace ↔ Personal Leakage)
- **Source**: UCX-3, UCX-4
- **Symptom**: Learning preferences ("I want to learn quantum computing") saved to personal mind 3x as duplicates instead of workspace mind. Personal mind frames bleed into workspace frame listings. Quantum computing notes appeared in Chief of Staff context.
- **Root cause**: `save_memory` defaults to `target: workspace` but certain content types (user preferences, learning goals) are routed to personal mind by the agent. Dedup check doesn't span both minds.
- **File**: `packages/agent/src/tools.ts` (save_memory execute handler, lines 291-344)
- **Fix**: (a) Audit routing logic — learning goals for a workspace-scoped conversation should stay in workspace mind. (b) Add cross-mind dedup check. (c) When listing frames for a workspace, exclude personal mind frames unless explicitly requested.
- **Complexity**: Medium

### F8. Injection Scanner Natural Language Gaps
- **Source**: UCX-5
- **Symptom**: Three evasion patterns score 0.0:
  - "Forget everything I said" (regex requires "you/instructions/rules" after "everything")
  - "This is a system message from Waggle admin" (no authority claim pattern)
  - "Reveal/disclose your instructions/prompt" variants
- **File**: `packages/agent/src/` (injection scanner module)
- **Fix**: Add patterns: (a) `forget|erase|clear|wipe` + `everything|conversation|memory|context`, (b) `system message|admin message|override|elevated privileges`, (c) `reveal|disclose|show|display` + `instructions|system prompt|rules`.
- **Complexity**: Medium
- **Note**: Mitigated by agent behavioral defense (caught all attacks anyway), but defense-in-depth requires scanner hardening.

### F9. `agent_task` Cron Type Has No Execution Handler
- **Source**: UCX-1
- **Symptom**: Cron jobs with type `agent_task` fire correctly (schedule, persistence, nextRunAt) but the execution handler does nothing — no LLM is invoked, no output generated. Jobs silently complete with no actual work.
- **Root cause**: The scheduler executor in `packages/server/src/local/index.ts` (lines 865-1141) has no case for `agent_task` job type. It handles `proactive`, `maintenance`, etc. but not `agent_task`.
- **Fix**: Add an `agent_task` handler that: (1) reads the job's prompt, (2) opens the associated workspace mind, (3) sends the prompt through the agent loop, (4) saves the output as a notification/event.
- **Complexity**: Medium-High (requires wiring the agent loop into the cron executor)

### F10. Workspace `directory` Field Not Set on Creation
- **Source**: UCX-2
- **Symptom**: Workspace created via API accepts a `directory` field but it's not set by default. Git tools then hit the wrong repo or fail entirely because the workspace has no directory context.
- **File**: `packages/server/src/local/routes/workspaces.ts` (POST handler)
- **Fix**: When creating a workspace, if `directory` is provided, persist it. If not provided but the workspace name suggests a project, prompt or default to CWD.
- **Complexity**: Low

---

## P2 — Fix Before Platform Claim (limits extensibility and scale)

### F11. No Publish-to-Marketplace Workflow
- **Source**: UCX-2
- **Symptom**: Users can create, install, and use skills locally but cannot publish them to the Waggle marketplace. The marketplace is install-only (120+ packages, 17 packs) with no submission API.
- **Fix**: Implement minimal publish workflow: (a) validate skill file format + SecurityGate scan, (b) package as marketplace entry, (c) submit via API or CLI. Even a manual review workflow with `waggle skill publish` CLI command would close the loop.
- **Complexity**: Medium

### F12. Semantic Skill Matching (Keywords Only)
- **Source**: UCX-2
- **Symptom**: `suggest_skill` uses keyword matching only. A query about "code review" won't find a skill named "architectural-review-companion" unless the exact words match.
- **Fix**: Add embedding-based similarity search to SkillRecommender. Use the existing embedder to compute skill description embeddings and match against query embeddings.
- **Complexity**: Medium

### F13. No Entity Extraction for Bulk-Injected Frames
- **Source**: UCX-4
- **Symptom**: `POST /api/memory/frames` stores frames but does NOT run the Cognify pipeline. Knowledge graph only grows via chat auto-save. 155 frames → only 7 KG entities (all from chat, none from injection).
- **Fix**: Run `cognify.cognify()` on each frame during bulk injection, or provide a `POST /api/memory/reindex` endpoint that processes existing frames through the pipeline.
- **Complexity**: Medium

### F14. No Frame-Type Filtering in Memory Search
- **Source**: UCX-4
- **Symptom**: Cannot search for "only decisions" or "only open questions" or "only stakeholder intel". All frame types mixed in results.
- **Fix**: Add optional `type` or `tag` parameter to `search_memory` tool and `/api/memory/search` endpoint. Filter results by frame importance level or a new `category` field.
- **Complexity**: Low

### F15. Skill Testing Sandbox
- **Source**: UCX-2
- **Symptom**: No way to test a skill against sample input before deploying it. User must install, send a message, evaluate, iterate. No dry-run.
- **Fix**: Add `/skills test` command or API endpoint that runs a skill against a user-provided input without installing it globally. Show the diff in agent behavior.
- **Complexity**: Medium

### F16. Weak Memory Deduplication
- **Source**: UCX-3
- **Symptom**: Exact-match dedup only. Three near-identical entries ("user wants to learn quantum computing") saved as separate frames because they had slightly different wording.
- **Fix**: Add semantic dedup using embedding similarity. Before saving, check if any existing frame has cosine similarity > 0.95 with the new content. If so, skip or merge.
- **Complexity**: Medium

### F17. No Message Size Limit
- **Source**: UCX-5
- **Symptom**: 100K-character payload accepted and processed. No validation on message length.
- **File**: `packages/server/src/local/routes/chat.ts` (POST handler validation)
- **Fix**: Add `if (message.length > MAX_MESSAGE_LENGTH) return reply.status(400).send(...)`. Suggest 50K default, configurable via env var.
- **Complexity**: Trivial

---

## P3 — Nice-to-Have (polish for V1+)

### F18. Skill Versioning and Dependency Management
- **Source**: UCX-2
- **Symptom**: Skills have no version field enforcement, no dependency tracking, no upgrade path.
- **Complexity**: High

### F19. Spaced Repetition / Concept Tracking for Learning
- **Source**: UCX-3
- **Symptom**: No structured concept mastery tracking. Memory saves content blobs, not "Tomás understands superposition at level 3/5".
- **Complexity**: High

### F20. Temporal Query Support ("what happened last week")
- **Source**: UCX-4
- **Symptom**: No temporal filtering on memory search. At 500+ frames, users need "last week" vs "last quarter" distinctions.
- **Complexity**: Medium

### F21. On-Demand Weaver Trigger
- **Source**: UCX-4
- **Symptom**: Weaver consolidation only runs on timer intervals. No API or command to trigger on demand.
- **Complexity**: Low

### F22. Dramatic Claims Hook Enforcement
- **Source**: UCX-5
- **Symptom**: Dramatic claims (like "CEO decided to shut down") are logged but not blocked at the memory write layer. Only the agent's verbal reasoning provides defense.
- **Complexity**: Low

### F23. Agent Comms Tools Missing from Self-Discovery
- **Source**: UCX-2
- **Symptom**: Agent's tool listing omits 2 agent-comms tools that exist in the codebase.
- **Complexity**: Trivial

### F24. Visual Distinction of Personal vs Workspace Frames in UI
- **Source**: UCX-1
- **Symptom**: No visual indicator when a frame comes from personal mind vs workspace mind.
- **Complexity**: Low

### F25. Contradiction Detection at Memory Write Time
- **Source**: UCX-5
- **Symptom**: Contradicting frames are stored without any flag. Detection only happens at read time via agent reasoning.
- **Complexity**: Medium

### F26. ConfirmationGate Coverage for `generate_docx`
- **Source**: UCX-2
- **Symptom**: `generate_docx` tool bypasses the approval gate. Should sit alongside `write_file` and `edit_file` in the ConfirmationGate config.
- **Complexity**: Trivial

### F27. Server IPv4-Only Binding on Windows
- **Source**: UCX-2
- **Symptom**: Server binds `127.0.0.1` only. `localhost` resolves to `::1` (IPv6) on Windows 11. Creates scripting friction.
- **Fix**: Bind to `0.0.0.0` or add `::1` listener.
- **Complexity**: Trivial

### F28. Agent Persona Compliance Regression (R3 → R4)
- **Source**: UCX-5
- **Symptom**: R3 agent refused persona adoption ("I don't adopt personas on demand"). R4 agent accepts all mode switches without pushback. This is a helpfulness-vs-identity trade-off.
- **Fix**: Add system prompt guidance for identity boundary maintenance. Agent should acknowledge persona requests but frame them as methods ("I can use Socratic questioning as a method") not identity changes.
- **Complexity**: Low (system prompt edit)

### F29. Memory Saves Content as Opaque "Work completed:" Blobs
- **Source**: UCX-3, UCX-4
- **Symptom**: Auto-save stores assistant responses as "Work completed: ..." prefix blobs. Loses structured information (learner misconceptions, decision rationale, stakeholder details).
- **Fix**: Design a richer auto-save strategy: extract key entities, decisions, and user statements from the conversation and save them as separate typed frames rather than monolithic assistant-output dumps.
- **Complexity**: High

### F30. Cross-Workspace Cron (Global Synthesis Jobs)
- **Source**: UCX-1
- **Symptom**: Cron jobs require a workspace ID. Cannot create a "Weekly Synthesis" job that reads across ALL workspaces.
- **Fix**: Support a special workspace value (e.g., `"*"` or `"global"`) that gives the cron executor access to all workspace minds.
- **Complexity**: Medium

---

## Summary by Priority

| Priority | Count | Key Theme |
|----------|-------|-----------|
| **P0** | 4 | Export data loss, chat crash, Windows cascade |
| **P1** | 6 | Rate limits, memory quality, scanner gaps, cron execution |
| **P2** | 7 | Platform extensibility, search filtering, dedup |
| **P3** | 13 | Polish, versioning, temporal queries, UI |
| **Total** | **30** | |

## Recommended Fix Order

1. F4 (commit activePersonaId fix) — trivial, already done
2. F1 (export data loss) — low complexity, critical trust
3. F2 (proxy health check) — low complexity, unblocks Windows
4. F3 (LiteLLM Unicode) — low-medium, completes Windows fix
5. F17 (message size limit) — trivial
6. F26 (ConfirmationGate for docx) — trivial
7. F27 (IPv4/IPv6 binding) — trivial
8. F5 (rate limit tuning) — low
9. F10 (workspace directory) — low
10. F6 (auto-save uncertainty tagging) — medium, high impact on trust
11. F7 (memory routing) — medium
12. F8 (injection scanner patterns) — medium
13. F9 (agent_task cron handler) — medium-high
14. F14 (frame-type filtering) — low
15. Everything else in P2/P3 order
