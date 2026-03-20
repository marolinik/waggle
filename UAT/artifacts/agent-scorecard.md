# Agent Behavior Scorecard

**Tester**: AG-2 (Agent Behavior Tester)
**Date**: 2026-03-20
**Branch**: `phase8-wave-8f-ui-ux`
**Server**: http://localhost:3333 (confirmed running, HTTP 200)
**Method**: Code analysis + API verification

---

## Executive Summary

**Average Score: 3.9 / 5.0**

Waggle's agent layer is architecturally strong. The core loop, tool transparency, approval gates, sub-agent orchestration, and memory pipeline are all implemented with genuine depth — not stubs. The system prompt is one of the most comprehensive agent behavioral specifications I have encountered: 500+ lines covering recall, assessment, action, learning, and response quality. The trust model, loop guard, injection scanner, and approval gate system form a layered security posture that is production-grade.

Key strengths: memory-first recall pipeline, three-layer tool transparency, hook-based approval gates with 5-minute auto-deny timeout, robust loop guard with oscillation detection, and a complete persona system (8 personas).

Key gaps: sub-agents run sequentially (not parallel), persona selection is not wired into the chat route's system prompt composition, context window is capped at 50 messages without summarization of truncated context, and the correction detector records signals but does not feed them back into the system prompt for behavioral adaptation.

| Test | Score | Verdict |
|------|-------|---------|
| AB-1: Workspace Re-Entry | 4.5 | STRONG |
| AB-2: Multi-Tool Orchestration | 4.0 | GOOD |
| AB-3: Ambiguity Detection | 3.5 | ADEQUATE |
| AB-4: Long-Context Coherence | 3.0 | NEEDS WORK |
| AB-5: Tool Transparency | 4.5 | STRONG |
| AB-6: Graceful Failure + Retry Cap | 5.0 | EXCELLENT |
| AB-7: Sub-Agent Spawning | 3.5 | ADEQUATE |
| Approval Gates | 4.5 | STRONG |
| Persona System | 3.5 | ADEQUATE |
| **Average** | **3.9** | **GOOD** |

---

## AB-1: Workspace Re-Entry (Kill List #1 Use Case)

**Score: 4.5 / 5**

### Design Analysis

Waggle's workspace re-entry pipeline is the most complete implementation among the features tested. It operates in three stages:

**Stage 1: Workspace Mind Activation**
- `chat.ts:634-641` — When a message arrives with a workspace ID, `activateWorkspaceMind()` is called to open the workspace-specific `.mind` SQLite database.
- If activation fails, a warning SSE event is emitted (`step` event) and the system falls back to personal memory only. This is not silent — the user sees the warning.
- File: `packages/server/src/local/routes/chat.ts:634`

**Stage 2: Automatic Memory Recall (pre-agent)**
- `chat.ts:648-669` — BEFORE the agent loop runs, the server performs `orchestrator.recallMemory(message)` which:
  - Searches both workspace and personal minds using HybridSearch (FTS5 + vector similarity)
  - Detects "catch-up" intent via regex patterns (`catch me up`, `where were we`, etc.) and switches to importance-based retrieval
  - Returns recalled memories that are injected into the system prompt as `recalledContext`
  - Emits `tool` and `tool_result` SSE events so the UI shows an `auto_recall` ToolCard with content snippets
- File: `packages/agent/src/orchestrator.ts:269-310`

**Stage 3: Workspace Now Block (system prompt injection)**
- `chat.ts:511-530` and `packages/server/src/local/routes/workspace-context.ts:93-267` — The `buildWorkspaceNowBlock()` function:
  - Opens the workspace mind DB
  - Extracts: summary, recent decisions, active threads, progress items (tasks/blockers/completed), next actions
  - Uses `buildWorkspaceState()` for structured state with open questions, stale threads, and blockers
  - Formats this into a `# Workspace Now` prompt section injected into the system prompt
- Result: On first message in a workspace session, the agent already has: workspace summary, recent decisions, active threads, progress items, next actions, and recalled memories.

**Stage 4: Session History Persistence**
- `chat.ts:620-630` — Session history is loaded from `.jsonl` files on disk if not in RAM, ensuring persistence across server restarts.
- `applyContextWindow()` at `chat.ts:79-92` applies a sliding window of 50 messages.

### Gaps

1. **No summarization of truncated context** — When history exceeds 50 messages, older messages are simply dropped with a notice `[Earlier context truncated...]`. There is no summarization pipeline to compress dropped messages into a summary. This means very long sessions lose context rather than compressing it.
2. **Catch-up recall is heuristic** — The catch-up pattern detection (`orchestrator.ts:271-278`) uses regex, which may miss novel phrasings like "what have we been working on?" or non-English equivalents.

### Evidence

- `packages/server/src/local/routes/chat.ts:511-530` (WorkspaceNow injection)
- `packages/server/src/local/routes/chat.ts:648-669` (auto_recall pipeline)
- `packages/server/src/local/routes/workspace-context.ts:93-267` (WorkspaceNowBlock builder)
- `packages/agent/src/orchestrator.ts:269-310` (recallMemory with catch-up detection)
- `packages/server/src/local/routes/chat.ts:79-92` (applyContextWindow)

### Verdict

The workspace re-entry pipeline is genuinely impressive. The three-stage approach (activate mind, recall memories, inject workspace now block) means the agent has substantial context before it even starts processing the user's message. The catch-up intent detection is a thoughtful touch. The main gap is the lack of summarization for truncated history, which limits coherence in very long sessions.

---

## AB-2: Multi-Tool Orchestration

**Score: 4.0 / 5**

### Design Analysis

**Tool Count**: The agent has access to approximately 53 unique tools across 12 categories:
- **Mind tools** (7): get_identity, get_awareness, search_memory, save_memory, query_knowledge, add_task, correct_knowledge
- **System tools** (11): bash, read_file, write_file, edit_file, search_files, search_content, web_search, web_fetch, multi_edit, get_task_output, kill_task
- **Plan tools** (4): create_plan, add_plan_step, execute_step, show_plan
- **Git tools** (4): git_status, git_diff, git_log, git_commit
- **Skill tools** (8): list_skills, create_skill, delete_skill, read_skill, search_skills, suggest_skill, acquire_capability, install_capability
- **Sub-agent tools** (3): spawn_agent, list_agents, get_agent_result
- **Document tools** (1): generate_docx
- **Workflow tools** (2): compose_workflow, orchestrate_workflow
- **KVARK tools** (4): kvark_search, kvark_feedback, kvark_action, kvark_ask_document
- **Cron tools** (4): create_schedule, list_schedules, delete_schedule, trigger_schedule
- **Audit tools** (1): query_audit
- **Team tools** (11): check_hive, share_to_team, create_team_task, claim_team_task, send_waggle_message, request_team_capability, team_activity, team_tasks, team_members, assign_task, complete_task
- **CLI tools** (2): cli_discover, cli_execute
- **Search tools** (2): tavily_search, brave_search
- **LSP tools** (4): lsp_diagnostics, lsp_definition, lsp_references, lsp_hover
- **Browser tools** (6): browser_navigate, browser_screenshot, browser_click, browser_fill, browser_evaluate, browser_snapshot
- **Agent comms** (2): send_agent_message, check_agent_messages

Plus 56 installed skills and plugin tools via `pluginTools` integration.

**Tool Execution Visibility**: Every tool call emits three SSE events:
1. `step` — Human-readable description via `describeToolUse()` (chat.ts:118-197)
2. `tool` — Raw tool name + input payload
3. `tool_result` — Result text + duration + isError flag

These events flow to the UI where `ToolCard.tsx` renders them with three layers of detail (inline summary, formatted detail, raw JSON).

**Capability Router**: When the LLM calls a tool that doesn't exist, the `CapabilityRouter` (`chat.ts:748-759`) resolves alternatives from installed skills, MCP servers, and sub-agent roles — and suggests `acquire_capability` if a matching skill might be installable. This prevents dead-end "tool not found" errors.

**Tool Utilization Tracker**: `tools.ts:34-61` tracks unique tools used per session and reports utilization percentage, which helps the agent self-assess whether it's using its full capability set.

### Gaps

1. **No parallel tool execution** — The agent loop (`agent-loop.ts:313-418`) executes tool calls sequentially even when the LLM requests multiple tool calls in one turn. Each tool_call is awaited before the next starts.
2. **Max turns is 200** — While generous (`chat.ts:774`), complex research tasks that chain many tools could theoretically hit this limit.

### Evidence

- `packages/agent/src/agent-loop.ts:313-418` (sequential tool execution)
- `packages/server/src/local/routes/chat.ts:781-817` (SSE event emission for tool use/result)
- `packages/agent/src/capability-router.ts` (intelligent tool-not-found handling)
- `packages/agent/src/tools.ts:34-61` (ToolUtilizationTracker)

---

## AB-3: Ambiguity Detection

**Score: 3.5 / 5**

### Design Analysis

Waggle does NOT have a dedicated ambiguity detection module. Instead, ambiguity handling is delegated to the LLM via system prompt instructions.

**System Prompt Approach** (`chat.ts:260-282`):
The system prompt contains explicit behavioral rules:
- "Step 2: ASSESS" — "Is this a simple greeting/question? -> Respond directly... Is this a complex task? -> Think through the approach before acting."
- "Step 5: RESPOND" — Includes conciseness rules but no explicit "ask for clarification" instruction.

**What IS explicitly in the prompt**:
- Anti-hallucination discipline (`chat.ts:306-311`): "ALWAYS distinguish what you KNOW from what you're REASONING"
- Error recovery: "If you can't find a file, search for it. Can't search? Ask the user."
- Tool intelligence: "NEVER guess at facts. If unsure, use tools."

**What is NOT in the prompt**:
- There is no explicit instruction like "If the user's request is ambiguous or could be interpreted multiple ways, ask a clarifying question before proceeding."
- The Scenario 5.1 UAT test requires the agent to ask clarifying questions on "Make it better" — this behavior depends entirely on the LLM's base behavior, not system prompt guardrails.

**Correction Detection** (`correction-detector.ts`):
There IS a robust correction detector that identifies when users are correcting the agent (strong signals: "No, not that", "I said", "that's wrong"; moderate: "actually", "prefer", "should be"). It classifies corrections as durable vs task-local and records improvement signals. However, this is post-hoc analysis — it detects corrections after the agent has already responded incorrectly, rather than preventing incorrect responses by asking first.

### Gaps

1. **CRITICAL: No explicit ambiguity detection prompt instruction** — The system prompt instructs the agent to be concise and direct, but never explicitly says "ask for clarification when the request is ambiguous." This is a significant gap for Scenario 5.1 compliance. The agent may default to guessing on "Make it better" rather than asking.
2. **Correction detection is reactive, not proactive** — `analyzeAndRecordCorrection()` runs after the response is sent (`chat.ts:848-864`), not before.

### Evidence

- `packages/server/src/local/routes/chat.ts:239-505` (full system prompt — search for "clarif" or "ambig" yields zero hits)
- `packages/agent/src/correction-detector.ts:1-199` (post-hoc correction detection)

### Recommendation

Add an explicit ambiguity handling rule to the system prompt:
```
## Ambiguity Handling
When a user request is vague, incomplete, or could be interpreted multiple ways:
- Ask 1-2 targeted clarifying questions before proceeding
- Do NOT guess the user's intent on ambiguous requests
- "Make it better", "fix this", "help me" are ambiguous — ask what specifically
```

---

## AB-4: Long-Context Coherence

**Score: 3.0 / 5**

### Design Analysis

**Context Window Management** (`chat.ts:71-92`):
- `MAX_CONTEXT_MESSAGES = 50` — Hard cap on messages sent to the LLM per turn.
- `applyContextWindow()` takes the most recent 50 messages from the full history.
- When truncated, a system message is prepended: `[Earlier context truncated. The conversation has N older messages not shown.]`
- Full history is kept in RAM (`sessionHistories` Map) and persisted to `.jsonl` files for cross-restart survival.

**Session Persistence** (`chat.ts:17-68`):
- Messages are persisted to `~/.waggle/workspaces/{id}/sessions/{sessionId}.jsonl` via `persistMessage()`.
- On session resume, `loadSessionMessages()` reads from disk and populates the in-memory history.

**No Summarization Pipeline**:
- When history exceeds 50 messages, older messages are simply dropped. There is no mechanism to:
  - Summarize the truncated portion
  - Extract key decisions/facts from dropped messages
  - Compress the conversation into a summary frame
- The only mitigation is the `auto_recall` pipeline which searches memory for relevant context — but this depends on the agent having previously saved important facts via `save_memory`.

**Memory as Compensator**:
- The system prompt instructs the agent to save important facts via `save_memory` (Step 4: LEARN), and to search memory before claiming ignorance.
- The `auto_recall` pipeline and `WorkspaceNow` block provide structured context injection.
- However, conversational nuance (tone, evolving requirements, back-and-forth refinements) is lost when messages are truncated.

### Gaps

1. **HIGH: No truncation summarization** — 50 messages is approximately 10-15 conversational turns. A 20-turn coherence test (Scenario 5.3) would lose the first 5-10 turns entirely.
2. **MEDIUM: No conversation compression** — Tools like `save_memory` are invoked by the agent but are not guaranteed. If the agent forgets to save a key decision in messages 1-10, that context is permanently lost after message 50.
3. **LOW: Memory recall is query-dependent** — `auto_recall` searches for memories related to the current user message, which may not retrieve context from the beginning of a long session if the topic has evolved.

### Evidence

- `packages/server/src/local/routes/chat.ts:71` (`MAX_CONTEXT_MESSAGES = 50`)
- `packages/server/src/local/routes/chat.ts:79-92` (`applyContextWindow()`)
- `packages/server/src/local/routes/chat.ts:830-843` (auto-save from exchange — compensating mechanism)

### Recommendation

Implement a summarization step when `applyContextWindow` truncates:
1. When history exceeds `MAX_CONTEXT_MESSAGES`, summarize the dropped portion into a compact summary
2. Prepend that summary (not just a truncation notice) so the agent retains compressed awareness of the full conversation

---

## AB-5: Tool Transparency

**Score: 4.5 / 5**

### Design Analysis

Tool transparency is one of Waggle's strongest features, implemented across server (SSE events) and UI (ToolCard component).

**Server-Side SSE Events** (`chat.ts:781-817`):

| Event | Data | Purpose |
|-------|------|---------|
| `step` | `{ content: string }` | Human-readable action description |
| `tool` | `{ name, input }` | Tool invocation with raw parameters |
| `tool_result` | `{ name, result, duration, isError }` | Completion with timing data |
| `approval_required` | `{ requestId, toolName, input, ...trustMeta }` | Pause for user approval |

Each tool call emits a human-readable `step` event via `describeToolUse()` (chat.ts:118-197) which maps tool names to plain English: `web_search` -> "Searching the web for '...'", `read_file` -> "Reading file: ...", etc. This covers 25+ tool names with specific descriptions.

**UI: ToolCard Component** (`packages/ui/src/components/chat/ToolCard.tsx`):

Three-layer transparency model:
- **Layer 1 (always visible)**: Status icon (running/done/error/denied/pending_approval) + human-readable description + result summary + duration
- **Layer 2 (click to expand)**: Formatted input (e.g., search query, file path) + formatted output
- **Layer 3 (deep inspection)**: Raw JSON of input and full result text

Status states with distinct visual treatment:
- Running: hollow circle with pulse animation
- Done: green checkmark
- Error: red X
- Denied: red no-entry symbol
- Pending approval: yellow warning triangle

Auto-hide behavior: Read-only tools (search_memory, read_file, git_status, etc.) auto-hide after 3 seconds at Layer 1, showing as a minimal inline indicator. Users can click to re-expand.

**Tool Grouping** (`ChatMessage.tsx:26-110`):
Adjacent completed read-only tools are grouped into a collapsed "N tools completed" indicator, preventing tool card spam in research-heavy conversations. Users can expand to see individual cards.

**ToolCard Result Summarization** (`ToolCard.tsx:125-177`):
Each tool type has a custom result summarizer:
- `web_search`: "N results found"
- `search_memory`: "N memories found"
- `auto_recall`: "N recalled: 'first snippet...'"
- `bash`: line count or single-line output
- `read_file`: "N lines"

**Duration Tracking** (`chat.ts:744-799`):
Tool execution time is tracked per invocation and included in the `tool_result` event, displayed in the ToolCard.

### Gaps

1. **LOW: No real-time streaming for long-running tools** — Tool results are sent as a single `tool_result` event after completion. A bash command running for 30 seconds shows "running" the entire time with no intermediate output.
2. **INFO: auto_recall was removed from AUTO_HIDE_TOOLS** (ToolCard.tsx:24-25, comment "B5: auto_recall removed — its trust signal should stay visible") — Good design decision, showing the team prioritizes trust signals.

### Evidence

- `packages/ui/src/components/chat/ToolCard.tsx:1-362` (three-layer component)
- `packages/ui/src/components/chat/ChatMessage.tsx:26-110` (tool grouping)
- `packages/server/src/local/routes/chat.ts:118-197` (describeToolUse)
- `packages/server/src/local/routes/chat.ts:781-817` (SSE event emission)

---

## AB-6: Graceful Failure + Retry Cap

**Score: 5.0 / 5**

### Design Analysis

This is the highest-scoring area. The failure handling is comprehensive and well-designed.

**Rate Limit Handling** (`agent-loop.ts:139-150`):
- HTTP 429 responses trigger retry with `MAX_RETRIES = 3`
- Respects `Retry-After` header (capped at 60 seconds)
- Emits a human-readable message to the user: `[Rate limited -- waiting Ns (retry M/3)...]`
- `turn--` ensures the retry doesn't consume a turn
- After 3 consecutive 429s: throws with clear message "Rate limit retry cap exceeded"

**Server Error Handling** (`agent-loop.ts:152-166`):
- HTTP 502, 503, 504 trigger retry with `MAX_RETRIES = 3`
- Exponential backoff: `Math.min(2000 * retryCount, 10_000)`
- Emits user-visible message: `[Server error 503 -- retrying in Ns...]`
- `turn--` preserves turn count
- After 3 consecutive server errors: throws with clear message including the error body

**Retry Counter Reset** (`agent-loop.ts:279`):
- `retryCount = 0` after any successful response — only consecutive failures count.

**Loop Guard** (`packages/agent/src/loop-guard.ts:1-68`):
- **Consecutive repeat detection**: Same tool + same args called > 3 times in a row = blocked
- **Oscillation detection**: Rolling window of 10 recent calls; if any hash appears >= 4 times in the window = blocked
- Returns human-readable error: "Loop detected -- called X with identical arguments too many times. Try a different approach."

**Malformed JSON Recovery** (`agent-loop.ts:317-324`):
- Tool arguments that are not valid JSON are caught and returned as a tool error: "Error: Invalid arguments for X. The arguments were not valid JSON."
- This prevents the loop from crashing on malformed LLM output.

**Tool Execution Error Handling** (`agent-loop.ts:369-373`):
- Tool execution errors are caught per-tool and returned as error messages, not thrown — the loop continues with the error context so the LLM can recover.

**Max Turns Safety** (`agent-loop.ts:421-426`):
- `maxTurns` defaults to 10 in base config, set to 200 in chat route (`chat.ts:774`)
- When exceeded: returns "Max tool turns reached." — no infinite loop possible.

**Token Budget** (`agent-loop.ts:282-289`):
- Optional `maxTokenBudget` terminates the loop gracefully when exceeded.

**Abort Signal** (`agent-loop.ts:110-116`):
- `AbortSignal` support — when client disconnects (SSE close), the loop exits cleanly between turns.

**User-Facing Error Messages** (`chat.ts:884-903`):
- ECONNREFUSED: "Could not reach the AI model. Check that your API key is configured in Settings."
- 401/Unauthorized: "API key is invalid or expired. Update it in Settings > API Keys."
- Timeout: "The request timed out. The model may be overloaded -- try again in a moment."
- Context length: "The conversation is too long for the model. Try clearing the chat and starting fresh."
- Generic: Clean message, never raw stack traces.

**Injection Scanner** (`agent-loop.ts:408-411`):
- Tool output is scanned for injection patterns before being added to messages. Flagged content is sanitized: `[SECURITY] Tool output flagged (flags). Content sanitized.`

### Gaps

None identified. This is production-grade failure handling.

### Evidence

- `packages/agent/src/agent-loop.ts:105-106` (MAX_RETRIES = 3)
- `packages/agent/src/agent-loop.ts:139-166` (rate limit + server error retry)
- `packages/agent/src/agent-loop.ts:279` (retry counter reset)
- `packages/agent/src/agent-loop.ts:317-324` (malformed JSON recovery)
- `packages/agent/src/agent-loop.ts:366-367` (loop guard check)
- `packages/agent/src/loop-guard.ts:1-68` (dual detection: consecutive + oscillation)
- `packages/server/src/local/routes/chat.ts:884-903` (user-friendly error messages)

---

## AB-7: Sub-Agent Spawning

**Score: 3.5 / 5**

### Design Analysis

**Sub-Agent Tools** (`packages/agent/src/subagent-tools.ts`):
Three tools: `spawn_agent`, `list_agents`, `get_agent_result`.

**Spawning Mechanism**:
- Sub-agents are spawned by calling `spawn_agent` with: name, role, task, optional context, optional custom tools, optional model, optional max_turns.
- 6 role presets define tool subsets: researcher, writer, coder, analyst, reviewer, planner.
- Each sub-agent gets its own system prompt, tool subset, and runs as an independent `runAgentLoop` call.
- Sub-agents run in the same process (no worker threads or child processes).

**Isolation**:
- Sub-agents have their own system prompt and tool subset — they cannot access tools outside their role preset.
- Sub-agents DO NOT have access to the hook registry, so they cannot trigger approval gates or fire pre/post tool hooks.
- Sub-agents run in non-streaming mode (`stream: false`) — their output is not visible to the user in real-time during execution.
- Sub-agents do NOT have access to the conversation history — they only receive the `task` as a single user message.

**Registry Management**:
- Active agents tracked in `activeAgents` Map; completed in `agentResults` Map.
- `MAX_AGENT_RESULTS = 100` with LRU eviction by `completedAt` timestamp.
- `STALE_THRESHOLD_MS = 30 minutes` — stale entries are cleaned up via `cleanupStaleEntries()`.

**Sub-Agent Orchestrator** (`packages/agent/src/subagent-orchestrator.ts`):
A more sophisticated layer on top of `subagent-tools.ts`:
- Supports dependency-ordered execution (topological sort)
- Context injection from previous steps (`contextFrom` field)
- Circular dependency detection with fail-safe
- Result aggregation modes: concatenate, last, synthesize (spawns a synthesizer agent)
- Event emission via EventEmitter for UI status tracking (`worker:status` events)

**UI: SubAgentProgress** (`packages/ui/src/components/chat/SubAgentProgress.tsx`):
- Collapsible panel showing active sub-agents
- Status dots (pending/running/done/failed) with animations
- Agent name, role, current tool, elapsed time
- Auto-hides when no agents are active

### Gaps

1. **HIGH: Sub-agents run sequentially, not in parallel** — `subagent-orchestrator.ts:116-157` processes steps in a `while` loop, executing one worker at a time. Even when two steps have no dependencies on each other, they run sequentially. The `spawn_agent` tool also blocks until the sub-agent completes (`subagent-tools.ts:186-218` — the `await runLoop()` call blocks the parent loop).
2. **MEDIUM: Sub-agents have no approval gates** — Since hooks are not passed to sub-agent loops, a sub-agent with the `coder` role can call `git_commit` or `write_file` without any user approval. This is a trust/safety gap.
3. **MEDIUM: Sub-agents cannot access memory** — While `researcher` and other roles include `search_memory` and `save_memory` in their tool presets, the sub-agent loop doesn't receive a configured orchestrator with workspace mind. Memory tools may fail or search the wrong mind.
4. **LOW: No sub-agent cancellation** — There is no mechanism to cancel a running sub-agent. The parent loop cannot abort a sub-agent that is taking too long.

### Evidence

- `packages/agent/src/subagent-tools.ts:107-298` (sub-agent tool definitions)
- `packages/agent/src/subagent-orchestrator.ts:59-302` (orchestrator with dependency ordering)
- `packages/ui/src/components/chat/SubAgentProgress.tsx:1-144` (UI component)
- `packages/agent/src/subagent-tools.ts:186` (`await runLoop()` — blocking)

---

## Additional: Approval Gates

**Score: 4.5 / 5**

### Design Analysis

**Confirmation Logic** (`packages/agent/src/confirmation.ts`):

The `needsConfirmation()` function implements a sophisticated tiered system:

**Always-confirm tools**: `write_file`, `edit_file`, `git_commit`, `install_capability`

**Bash command analysis**:
- Safe patterns (auto-approved): `date`, `ls`, `cat`, `git status/log/diff`, `--version` commands, `df`, `ps`, etc.
- Destructive patterns (always confirm): `rm -rf`, `git push/reset/rebase`, `npm publish`, `sudo`, `chmod`, `curl --data` (exfiltration), `netcat`
- Chain operator guard: If `&&`, `||`, `;`, or `|` appear in any bash command, safe pattern exemptions are voided — always confirm. This prevents `echo safe && rm -rf /` bypass.
- Empty commands: auto-confirm required (suspicious)
- Default for unknown bash: confirm (fail-safe)

**Connector tool analysis** (`confirmation.ts:59-67`):
- Connector tools are analyzed by name pattern, NOT by LLM-provided metadata (preventing injection)
- Write patterns: `_create_`, `_update_`, `_delete_`, `_send_`, etc. require confirmation
- High-risk actions: `send_email`, `send_template` are always critical

**Hook-Based Gate in Chat Route** (`chat.ts:678-734`):
- A per-request `pre:tool` hook is registered that:
  1. Checks `needsConfirmation(toolName, args)` — if false, the tool proceeds without gate
  2. Generates a UUID `requestId`
  3. For `install_capability`, enriches the SSE event with trust metadata (risk level, permissions, trust source) via `assessTrust()`
  4. Sends an `approval_required` SSE event to the client
  5. **Waits on a Promise** — the hook blocks until the user responds via `POST /api/approval/:requestId`
  6. **Auto-DENY after 5 minutes** (`chat.ts:720-726`) — if no response within 300 seconds, the approval is automatically denied. This is a fail-safe, not fail-open design.
  7. On deny: sends `step` event with denial message, returns `{ cancel: true }` to block tool execution
  8. On approve: sends `step` event with approval confirmation, tool proceeds

**Approval API** (`packages/server/src/local/routes/approval.ts`):
- `POST /api/approval/:requestId` — approve or deny with `{ approved: boolean }`
- `GET /api/approval/pending` — list pending approvals (for UI reconnection)

**UI: ApprovalGate Component** (`packages/ui/src/components/chat/ApprovalGate.tsx`):
- Human-readable descriptions via `describeApproval()` — covers bash, write_file, edit_file, git_commit, generate_docx, delete_skill
- Approve (green) and Deny (red) buttons
- Toggle to show raw JSON data
- Visually prominent: yellow border, warning icon, "Approval Required" header

**Trust Model Integration** (`packages/agent/src/trust-model.ts`):
- When `install_capability` is gated, the approval event includes:
  - `riskLevel`: low/medium/high (computed from source provenance + content analysis)
  - `approvalClass`: standard/elevated/critical
  - `trustSource`: builtin/starter_pack/local_user/third_party_verified/third_party_unverified/unknown
  - `permissions`: fileSystem, network, codeExecution, externalServices, secrets, browserAutomation
  - `explanation`: Human-readable risk summary
- This is a defense-in-depth approach: source trust and execution risk are computed independently.

### Gaps

1. **LOW: Approval gate does not show trust metadata in the UI** — The SSE event includes trust metadata (`chat.ts:708`), but `ApprovalGate.tsx` does not render risk level, permissions, or trust source. The UI shows what the tool wants to do, but not the risk assessment.
2. **INFO: Per-invocation hook registration** — The approval hook is registered per-request and unregistered after the agent loop completes (`chat.ts:823`). This is correct behavior.
3. **INFO: The 5-minute auto-deny timeout is correctly implemented** — `chat.ts:720-726` uses `setTimeout(300_000)` with cleanup on resolution.

### Evidence

- `packages/agent/src/confirmation.ts:1-151` (needsConfirmation logic)
- `packages/server/src/local/routes/chat.ts:678-734` (hook-based gate with auto-deny)
- `packages/server/src/local/routes/approval.ts:1-32` (approval API)
- `packages/ui/src/components/chat/ApprovalGate.tsx:1-113` (UI component)
- `packages/agent/src/trust-model.ts:1-420` (trust assessment)

---

## Additional: Persona System

**Score: 3.5 / 5**

### Design Analysis

**Persona Definitions** (`packages/agent/src/personas.ts`):
8 personas are defined, each with:
- `id`, `name`, `description`, `icon`
- `systemPrompt`: Role-specific instructions (5-8 lines of behavioral guidance)
- `modelPreference`: Currently all `claude-sonnet-4-6`
- `tools`: Curated tool subset for the role
- `workspaceAffinity`: Tags for workspace type matching
- `suggestedCommands`: Relevant slash commands
- `defaultWorkflow`: Optional workflow template (researcher -> "research-team", project-manager -> "plan-execute")

The 8 personas:
1. **Researcher** — Deep investigation, multi-source synthesis, citation tracking
2. **Writer** — Document drafting, editing, formatting, tone adaptation
3. **Analyst** — Data analysis, pattern recognition, decision matrices
4. **Coder** — Software development, debugging, code review, architecture
5. **Project Manager** — Task tracking, status reports, timeline management
6. **Executive Assistant** — Email drafting, meeting prep, calendar management
7. **Sales Rep** — Lead research, outreach drafting, pipeline management
8. **Marketer** — Content creation, campaign planning, SEO

**Composition API** (`personas.ts:201-218`):
- `composePersonaPrompt(corePrompt, persona, maxChars)` appends persona instructions after the core system prompt
- Truncation safety: If combined length exceeds 32,000 chars (~8k tokens), persona prompt is truncated with marker

**Persona API** (`packages/server/src/local/routes/personas.ts`):
- `GET /api/personas` returns all 8 personas (verified via API call — returned 8 entries)
- System prompts are intentionally omitted from the API response (large + sensitive)

### Gaps

1. **CRITICAL: Persona is NOT wired into the chat route** — Searching `chat.ts` for "persona", "composePersonaPrompt", or "getPersona" yields zero results. The `buildSystemPrompt()` function at `chat.ts:217-536` does NOT call `composePersonaPrompt()`. The persona system is fully defined but the chat route never applies a selected persona to the agent's system prompt. The UI can display personas, but selecting one has no effect on agent behavior.
2. **MEDIUM: No persona selection API** — There is no `POST /api/chat/persona` or similar endpoint to set the active persona for a session/workspace.
3. **MEDIUM: Persona tool filtering not wired** — Each persona defines a `tools` array, but the chat route's `effectiveTools` resolution (`chat.ts:737-741`) does not filter tools by the active persona.
4. **LOW: All personas use the same model** — Every persona has `modelPreference: 'claude-sonnet-4-6'`. There's no differentiation (e.g., researcher could use a larger model for depth).

### Evidence

- `packages/agent/src/personas.ts:1-218` (8 personas defined)
- `packages/server/src/local/routes/personas.ts:1-22` (API route)
- `packages/server/src/local/routes/chat.ts:217-536` (buildSystemPrompt — NO persona integration)
- API verified: `GET /api/personas` returns 8 personas

---

## Findings Classification

### CRITICAL

| ID | Finding | Location |
|----|---------|----------|
| C-1 | Persona system not wired into chat route — selecting a persona has no effect on agent behavior | `chat.ts:217-536` (missing `composePersonaPrompt` call) |
| C-2 | No explicit ambiguity detection instruction in system prompt — agent may guess instead of asking clarifying questions | `chat.ts:239-505` (system prompt) |

### HIGH

| ID | Finding | Location |
|----|---------|----------|
| H-1 | No summarization when context window truncates — conversations beyond 50 messages lose older context entirely | `chat.ts:79-92` (`applyContextWindow`) |
| H-2 | Sub-agents run sequentially, not in parallel — even independent tasks execute one at a time | `subagent-orchestrator.ts:116-157` |
| H-3 | Sub-agents bypass approval gates — no hook registry passed to sub-agent loops | `subagent-tools.ts:186-201` |

### MEDIUM

| ID | Finding | Location |
|----|---------|----------|
| M-1 | Approval gate UI does not show trust metadata (risk level, permissions) even though it's sent in the SSE event | `ApprovalGate.tsx:17-57` |
| M-2 | No persona selection API endpoint | `personas.ts` (route only has GET, no POST/PUT) |
| M-3 | Sub-agents may not have proper workspace mind access for memory tools | `subagent-tools.ts:186` |
| M-4 | No sub-agent cancellation mechanism | `subagent-tools.ts` |
| M-5 | No parallel tool execution within a single turn | `agent-loop.ts:313-418` |

### LOW

| ID | Finding | Location |
|----|---------|----------|
| L-1 | Catch-up recall uses regex heuristic — may miss novel phrasings | `orchestrator.ts:271-278` |
| L-2 | All personas use the same model preference | `personas.ts:42,63,79,99,...` |
| L-3 | No real-time streaming for long-running tool execution | `agent-loop.ts:369-373` |

### INFO

| ID | Finding | Location |
|----|---------|----------|
| I-1 | auto_recall intentionally kept visible (not auto-hidden) for trust signal | `ToolCard.tsx:24-25` |
| I-2 | 56 skills installed (verified via API) | `GET /api/skills` |
| I-3 | Agent status shows 922,628 tokens used, $2.85 estimated cost | `GET /api/agent/status` |
| I-4 | 5-minute auto-deny timeout correctly implemented | `chat.ts:720-726` |
| I-5 | Injection scanner runs on both user input (non-blocking) and tool output (blocking) | `chat.ts:550-553`, `agent-loop.ts:408-411` |
| I-6 | Chain operator guard in bash confirmation prevents `echo safe && rm -rf /` bypass | `confirmation.ts:49-51,82-89` |
| I-7 | Correction detector distinguishes durable vs task-local corrections with confidence scoring | `correction-detector.ts:95-132` |

---

## Score Summary

| Test | Score | Key Strength | Key Gap |
|------|-------|-------------|---------|
| AB-1: Workspace Re-Entry | 4.5 | Three-stage recall pipeline (mind activation + auto_recall + WorkspaceNow) | No summarization of truncated history |
| AB-2: Multi-Tool Orchestration | 4.0 | 53+ tools, CapabilityRouter for intelligent fallback, utilization tracking | Sequential tool execution |
| AB-3: Ambiguity Detection | 3.5 | Correction detector with durability classification | No explicit "ask for clarification" system prompt instruction |
| AB-4: Long-Context Coherence | 3.0 | Session persistence across restarts, 50-message window | No summarization = hard context loss beyond 50 messages |
| AB-5: Tool Transparency | 4.5 | Three-layer ToolCard, tool grouping, auto-hide, duration tracking | No streaming for long-running tools |
| AB-6: Graceful Failure + Retry | 5.0 | Dual retry (429 + 5xx), loop guard (consecutive + oscillation), injection scanner, abort signal | None |
| AB-7: Sub-Agent Spawning | 3.5 | Orchestrator with dependency ordering, 6 role presets, UI progress panel | Sequential execution, no approval gates |
| Approval Gates | 4.5 | Hook-based with auto-deny timeout, chain operator guard, trust model | Trust metadata not rendered in UI |
| Persona System | 3.5 | 8 well-defined personas with tool presets, workspace affinity | Not wired into chat route |
| **Average** | **3.9** | | |

---

## Recommendations (Priority Order)

1. **Wire personas into `buildSystemPrompt()`** — Accept a `personaId` parameter in the chat request body, resolve via `getPersona()`, compose via `composePersonaPrompt()`. Filter tools by persona's `tools` array. [Fixes C-1]

2. **Add ambiguity handling instruction to system prompt** — Explicit behavioral rule for when to ask clarifying questions vs proceed. [Fixes C-2]

3. **Implement truncation summarization** — When `applyContextWindow()` drops messages, generate a compact summary of the dropped portion using the LLM or a rule-based extractor. [Fixes H-1]

4. **Enable parallel sub-agent execution** — Modify `SubagentOrchestrator.runWorkflow()` to use `Promise.all()` for steps with resolved dependencies. [Fixes H-2]

5. **Pass hook registry to sub-agent loops** — Ensure sub-agents with write-capable tools trigger approval gates. [Fixes H-3]

6. **Render trust metadata in ApprovalGate UI** — Show risk level badge, permission list, and trust source when available in the SSE event payload. [Fixes M-1]
