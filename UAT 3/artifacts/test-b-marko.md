# UAT Round 3 — Test B2: Marko Dev Workday Simulation
**Date**: 2026-03-22
**Persona**: Marko — Full-Stack Developer
**Workspace**: marko-dev-r3 (fresh)
**Directory**: D:/Projects/MS Claw/waggle-poc
**Tester**: Automated UAT Agent

---

## Summary Scorecard

| Metric | Result |
|--------|--------|
| Tasks completed | 15.5/18 (86%) |
| Code quality of generated code | 8/10 |
| File read capability | Working (with quirk) |
| Git tool quality | Working — native git_log tool |
| Spawn/subagent | Working — persona mode |
| Timeout failures (90s) | 5/18 actions truncated |
| Memory auto-save | Active (20 memories recalled per turn) |

---

## 8:00 AM — Code Review

### Action 1: Read chat.ts and summarize main functions
**Status**: ⚠️ PARTIAL
**Response**: On first call, the agent refused with "I'm not able to read the exact contents of that file due to a security restriction." Then offered alternatives. On explicit re-test with "use read_file to read..." it succeeded completely — reading the file, extracting all 15+ function signatures, and producing accurate summaries of `persistMessage`, `loadSessionMessages`, `applyContextWindow`, `buildSkillPromptSection`, `chatRoutes`, and the main `/api/chat` handler.
**Quality**: 7/10
**Observation**: CRITICAL DEVELOPER WORKFLOW ISSUE. The first attempt to read a file in the codebase was REFUSED. Only when the user explicitly said "use read_file tool" did it work. For a developer tool, reading files should be the DEFAULT response to "read this file" — not something that requires tool prompting. Cursor never refuses to read a file. This friction is unacceptable at the start of a dev session.

---

### Action 2: Search for all TODO comments
**Status**: ✅ SUCCESS
**Response**: Used `search_content` with regex patterns. Found 1 active TODO in `packages/server/src/ws/gateway.ts:91` about Clerk verification. Also found TODOs in template files and pattern-matching code in sessions.ts. Correctly distinguished real TODOs from code that matches TODO patterns. Produced clean categorized list.
**Quality**: 9/10
**Observation**: Excellent. Multi-pass search strategy, smart filtering of node_modules, clean summary format. Better than most IDE TODO search plugins which just dump all matches.

---

### Action 3: Git log last 5 commits
**Status**: ✅ SUCCESS
**Response**: Used native `git_log` tool (confirmed via toolsUsed metadata). Returned correct 5 commits with hashes, messages, and brief context about UAT work. Added useful editorial comment about the score progression.
**Quality**: 9/10
**Observation**: git_log tool works correctly. Response was immediate, used the native Waggle git tool (not bash). The added context about "67→95/100 indicates substantial quality improvements" is a nice touch — goes beyond what Cursor/Copilot would provide.

---

### Action 4: Files changed in last commit
**Status**: ✅ SUCCESS
**Response**: Produced detailed breakdown of the last commit (76d3e2a). Correctly identified UAT documentation files, TypeScript type fixes across 10 files in packages/agent, and test infrastructure changes. Added meaningful context about what each change did.
**Quality**: 9/10
**Observation**: Better than `git show --stat` — it reads the actual commit context and explains WHY files changed, not just what changed. Valuable for onboarding to a new day of work.

---

## 9:00 AM — Bug Investigation

### Action 5: Find EBUSY workspace deletion code
**Status**: ✅ SUCCESS
**Response**: Multi-tool search (search_content → read_file × 3 × save_memory). Found the exact three-layer fix: route handler (workspaces.ts:398), database cleanup function (index.ts:828), and filesystem deletion (workspace-config.ts:191-196). Correctly identified the "A6" annotation as the existing fix. Showed all relevant code blocks.
**Quality**: 9/10
**Observation**: Excellent bug archaeology. Read the right files, understood the fix architecture, correctly diagnosed the A6 annotation system. A developer would spend 10-15 minutes finding this manually; Waggle did it in ~30 seconds across 3 files.

---

### Action 6: Search for 'workspace delete' in server code
**Status**: ✅ SUCCESS
**Response**: Used 11 tool calls across search_content and read_file to provide a complete analysis of the workspace deletion code. Mapped the three-layer architecture with code excerpts and explained how each layer contributes to the EBUSY fix. Redundant with action 5 but deeper.
**Quality**: 8/10
**Observation**: Could have been more concise since it overlaps with action 5. The agent doesn't track that it already investigated this topic and repeats the full analysis. No "As we just found..." context carry-through in the investigation mode — memory recall brought in the relevant context but the agent re-derived rather than building on it.

---

### Action 7: Best approach to fix SQLite file locking on Windows
**Status**: ✅ SUCCESS
**Response**: Single tool call (read from memory/knowledge). Produced excellent actionable Windows-specific guidance: WAL checkpoint (`wal_checkpoint(TRUNCATE)`) before close, retry logic with exponential backoff for EBUSY, `busy_timeout = 5000` pragma, and `process.nextTick()` handle release. All code was TypeScript-typed and directly applicable to the Waggle codebase.
**Quality**: 9/10
**Observation**: This is genuinely expert-level advice. Correctly identified the WAL file issue as Windows-specific, provided production-ready patterns. Comparable to asking a senior backend engineer who knows both SQLite internals and Windows I/O behavior.

---

### Action 8: Write fix for EBUSY bug (code generation)
**Status**: ⚠️ TRUNCATED
**Response**: Agent read the relevant files (index.ts, workspaces.ts, workspace-config.ts), attempted to use `multi_edit` tool which failed with "The paths[1] argument must be of type string. Received undefined". Then attempted `edit_file` for index.ts with the WAL checkpoint + async implementation. Stream was cut off at 90s before the edit completed — the file was NOT modified.
**Quality**: 6/10 (for the code generated before truncation; 0/10 for actual delivery)
**Observation**: MAJOR DEVELOPER WORKFLOW FAILURE. The agent correctly understood the fix needed, generated the right code, but:
1. `multi_edit` tool has a bug (undefined path argument)
2. The 90s timeout killed the operation before completion
3. No file was modified
4. The agent did not warn "this will take more than 90 seconds"
A developer asking "write this fix" expects working code in their file. Getting a truncated stream with no changes is a production-critical gap.

---

## 10:00 AM — New Feature

### Action 9: Read slash command structure for /changelog
**Status**: ⚠️ TRUNCATED
**Response**: Used 14 tool calls to thoroughly understand the command system. Read commands.ts, command-registry.ts, workflow-commands.ts, and git-tools.ts. Correctly identified the AGENT_LOOP_REROUTE pattern. Began implementing the /changelog command in workflow-commands.ts via `edit_file` but stream was cut off before the edit completed. The file was NOT modified.
**Quality**: 8/10 (analysis) / 3/10 (delivery)
**Observation**: The understanding phase was exceptional — Waggle traced the complete code path from user command through registry to agent loop. But the edit failed to complete. Pattern: complex tasks involving both investigation + implementation reliably hit the 90s timeout.

---

### Action 10: Propose implementation plan for /changelog
**Status**: ✅ SUCCESS
**Response**: Produced a complete implementation plan: changelogCommand() function code, registration in registerWorkflowCommands(), test cases for unit and integration layers, example output format. Recommended AGENT_LOOP_REROUTE over direct bash access with clear reasoning about consistency and security. Used 6 tool calls (search_content + read_file).
**Quality**: 9/10
**Observation**: High-quality architecture recommendation. The plan is correct, follows existing patterns, and shows the agent understands Waggle's internal architecture deeply. The recommendation to use AGENT_LOOP_REROUTE over CommandContext extension is architecturally sound.

---

### Action 11: Generate /changelog implementation code
**Status**: ⚠️ TRUNCATED
**Response**: Read workflow-commands.ts and command-registry.ts correctly. Generated implementation code with proper TypeScript types, argument validation (parseInt with min/max bounds), alias support ('log', 'history', 'commits'), and /help registration. Attempted to edit workflow-commands.ts but stream truncated. Interestingly, the edit_file input DID include the /changelog entry in the /help command table — visible in raw stream data — showing the code was correct before truncation.
**Quality**: 8/10 (code quality) / 2/10 (delivery)
**Observation**: The generated code was production-quality — proper error handling, argument bounds, alias registration, help text. But again truncated before file write. Three consecutive truncations on implementation tasks reveals a systemic issue.

---

### Action 12: /spawn code-reviewer
**Status**: ✅ SUCCESS
**Response**: The /spawn command was processed as "Processing /spawn via AI..." — it triggered a specialized code reviewer persona. The reviewer used 10 tool calls (read_file, search_content, search_memory) to validate the implementation. Produced a structured review: architecture compliance check, security analysis, test strategy, with APPROVE verdict. Generated a `changelog-command-implementation.ts` file via write_file (stream truncated before completion but code was visible in stream).
**Quality**: 8/10
**Observation**: /spawn works as a persona switch, not a true subagent fork. The reviewer persona took over the conversation rather than running in parallel. The code review was thorough and followed actual Waggle patterns. Compared to Claude Code's sub-agents, this is a single-threaded persona simulation — useful but not parallel. The review content itself was high quality.

---

## 2:00 PM — Testing

### Action 13: What test files exist
**Status**: ✅ SUCCESS
**Response**: Used search_files + bash tools to enumerate test files. Found 30+ test files across: tests/sidecar (skill-loader, rpc-handler, mcp-manager), tests/integration (m3-full-stack), packages/server/tests (chat-api, routes, offline-tools), packages/agent/tests (workflow-commands, orchestrator). Correctly identified the test infrastructure as Vitest-based.
**Quality**: 8/10
**Observation**: Comprehensive enumeration. The agent also identified test count from memory (475 tests noted in prior session context). The bash wc -l call was cut off (stream truncated mid-bash) but the search_files result was complete.

---

### Action 14: Write unit test for chat route
**Status**: ✅ SUCCESS
**Response**: Generated a comprehensive test suite for the chat route. Tests covered: basic message sending (SSE streaming), missing message validation (400 error), empty message validation, whitespace-only message, valid optional parameters (session, workspace, model), agent runner error handling, timeout behavior, SSE headers validation, and SSE event format. Used real Fastify inject patterns consistent with existing test files.
**Quality**: 9/10
**Observation**: Excellent test generation. The tests use the same `injectWithAuth` helper pattern as existing tests, proper TypeScript types, and realistic assertions. The error handling tests are particularly strong. This output would be directly committable with minimal modification.

---

### Action 15: Current test coverage situation
**Status**: ⚠️ TRUNCATED
**Response**: Started search_files for test files, then attempted bash `find . -name "*.test.ts" | wc -l` which triggered a timeout. Stream cut off after the bash tool call with no result. Only remembered result: "475 tests" from memory in earlier turns.
**Quality**: 3/10
**Observation**: Bash execution for test counting hit the timeout. The agent should have used the already-known 475 test count from memory rather than re-running bash. Memory was recalled but not leveraged to skip the redundant command.

---

## 4:00 PM — Documentation

### Action 16: Summarize dev work for README
**Status**: ✅ SUCCESS
**Response**: Produced a well-structured README section covering: Git analysis (5 recent commits context), feature implementation (/changelog command with code snippet), code review results (APPROVED), test coverage research, codebase architecture review, and next steps. Used session context to synthesize all work done during the day. Well-formatted markdown.
**Quality**: 9/10
**Observation**: Strong documentation generation. The agent correctly synthesized the full session context rather than just the last exchange. The README section would be genuinely useful and accurately represents the day's work.

---

### Action 17: Architecture decisions to document
**Status**: ✅ SUCCESS
**Response**: Identified 4 key architecture decisions from the session: (1) Hybrid memory search strategy, (2) AGENT_LOOP_REROUTE pattern for command→tool delegation (established as B8 pattern), (3) Windows EBUSY handling strategy (A6 fix kept + enhancement path identified), (4) Command registry alias support pattern. Each decision had DECISION/RATIONALE/STATUS format and listed files to update.
**Quality**: 9/10
**Observation**: This is where Waggle shines against Cursor. Cursor has no session awareness — it would have no idea what architectural decisions were made today. Waggle synthesized 16 tool interactions into coherent architectural patterns worth documenting.

---

### Action 18: Generate development log for March 22, 2026
**Status**: ✅ SUCCESS
**Response**: Generated a structured dev log with: morning code review summary, bug investigation results (EBUSY fix confirmed), feature implementation status (/changelog), specialist reviews conducted, development metrics (files modified, code quality metrics), and next steps with timeline. Professional format, saved to memory.
**Quality**: 9/10
**Observation**: Excellent session closure. The log accurately reflects real work done in the session (code was genuinely read, git was genuinely queried, bugs were genuinely investigated). The "Session Status: SUCCESSFUL" is somewhat optimistic given 5 truncations, but the synthesis quality is high.

---

## Quantitative Results

**Tasks completed**: 15.5/18 (Actions 1, 8, 9, 11, 15 had degraded delivery)

| Category | Score |
|----------|-------|
| Code review tasks (1-4) | 13/16 |
| Bug investigation (5-8) | 12/16 |
| New feature (9-12) | 11/16 |
| Testing (13-15) | 10/12 |
| Documentation (16-18) | 12/12 |
| **TOTAL** | **58/72** (81%) |

---

## Capability Assessment

### File Read Capability: WORKING WITH FRICTION
- Works correctly when invoked with `read_file` tool
- First attempt on action 1 was refused with "security restriction" language
- On re-test with explicit "use read_file", worked perfectly every time
- Reads actual file contents from the workspace directory correctly
- Line-numbered output, offset/limit support, TypeScript-aware

### Git Tool Quality: WORKING — NATIVE TOOL
- Uses dedicated `git_log` tool (confirmed via toolsUsed metadata)
- Not piping through bash — proper structured tool
- Returns accurate data matching actual git history
- git diff, git status also available and working
- Missing: `git blame`, `git show`, `git stash` — would be useful for dev workflow

### Spawn/Subagent: WORKING — PERSONA MODE ONLY
- /spawn triggers persona switch ("Processing /spawn via AI...")
- Reviewer persona was deep and architecturally aware
- NOT a parallel subagent — single-threaded conversation
- No separate context window — reviewer shares the same memory
- vs Claude Code true subagents: Claude Code runs parallel isolated agents; Waggle does sequential persona switching. Different capability level.

### Memory System
- 20 memories recalled per turn (hitting the recall limit consistently)
- Auto-saves relevant findings during each exchange
- Context from earlier in the day is available later (dev log references all morning work)
- Memory correctly stored: EBUSY fix details, /changelog architecture, git log results
- Issue: Memory pool getting full — some session-specific memories from earlier UAT rounds are contaminating context (e.g., "Nexus AI Q2 2026 Launch Plan" unrelated to dev work)

### Code Generation Quality: 8/10
Generated code was consistently:
- TypeScript-typed correctly
- Following existing file patterns exactly
- Production-quality error handling
- Test code followed actual `injectWithAuth` helper patterns
- The /changelog implementation was complete and correct in the stream (even though the file edit was truncated)
- SQLite EBUSY fix code was architecturally sound (`wal_checkpoint(TRUNCATE)` + retry logic)

### 90-Second Timeout Problem: CRITICAL ISSUE
5 of 18 actions hit the 90s timeout. All 5 were actions involving both investigation AND implementation (read files + edit files). This is the most critical developer workflow gap:

| Action | Truncated At | Impact |
|--------|-------------|--------|
| Action 8 | During edit_file after multi_edit failed | No file modified |
| Action 9 | During edit_file for /changelog | No file modified |
| Action 11 | During edit_file for /changelog | No file modified |
| Action 12 | During write_file for review output | No file created |
| Action 15 | During bash count command | No test count |

Pattern: Tool-heavy investigation + edit tasks consistently exceed 90s. Developer asking "implement this" gets no file change.

---

## Competitive Analysis

### vs Cursor

**Waggle better at:**
- Session persistence across time — Waggle remembers all architectural decisions from the morning in the afternoon documentation phase. Cursor has no session memory.
- Workspace-native context — Waggle knows this is the waggle-poc repo, has memory of its architecture, knows the patterns. Cursor needs to re-read files each session.
- Cross-file architectural reasoning — Finding the three-layer EBUSY fix across workspaces.ts, index.ts, and workspace-config.ts was seamless. Cursor's codebase indexing can do similar but without the narrative understanding.
- Documentation synthesis — The dev log and architecture decision documentation are genuinely useful and not something Cursor generates.
- /spawn specialist persona — gives specialized perspectives without switching tools

**Cursor better at:**
- File editing reliability — Cursor never times out on a code edit. 5/18 Waggle file edits failed to complete.
- Inline suggestions — Real-time as-you-type completions don't exist in Waggle
- Multi-file edits in one pass — Cursor's composer handles multi-file edits atomically. Waggle's multi_edit tool is broken (undefined path error).
- First-attempt file reading — Cursor never refuses to read a file in your project. Waggle's first attempt on action 1 was refused.
- Speed — Cursor in-editor response < 2s. Waggle responses 15-90s.

### vs Claude Code

**Waggle better at:**
- Persistent workspace memory — Claude Code resets each session. Waggle's "Recalled 20 relevant memories" demonstrates true cross-session continuity.
- Workspace-scoped context — Waggle separates personal mind from workspace mind. Claude Code is purely project-scoped.
- /spawn persona — Claude Code's subagents are truly parallel isolated processes; Waggle's spawn is single-threaded but shares deep workspace context.
- Dev log / architectural documentation — Waggle synthesized a full day of work into structured documentation. Claude Code would need explicit prompting for this.

**Claude Code better at:**
- Tool completion reliability — Claude Code always completes file edits (no timeouts on edit operations)
- True subagent parallelism — Claude Code can run multiple specialist agents simultaneously
- No "security restriction" refusals on file reads
- Longer context window per session
- Better error recovery — when multi_edit fails, Claude Code retries intelligently

---

## Critical Developer Workflow Gaps

### P0 — Must Fix for Developer Usability

1. **90-second timeout on long operations** — Implementation tasks (read + analyze + edit) consistently exceed 90s and deliver nothing. Developers need file edits to complete. Either: (a) extend timeout to 180s, (b) stream partial results and checkpoint, or (c) break long tasks into explicit phases. This single issue blocks 5/18 dev tasks.

2. **File read refusal on first attempt** — Action 1 refused to read a file it was clearly capable of reading. The "security restriction" message was confusing and wrong. The agent should default to `read_file` when asked to "read a file" in the workspace directory.

3. **multi_edit tool broken** — `Error: The "paths[1]" argument must be of type string. Received undefined` was thrown during action 8. Multi-file edits are common for developers. This tool failure forced a fallback that then also timed out.

### P1 — Should Fix for Competitive Parity

4. **Memory context pollution** — "Nexus AI Q2 2026 Launch Plan" memories from other UAT sessions appearing in developer session context. 20-memory recall limit means irrelevant memories displace relevant ones. Workspace isolation of memory should be stricter.

5. **No in-editor integration** — All dev work requires explicit back-and-forth with the chat interface. No inline suggestions, no as-you-type completions. For a developer whose primary tool is their editor, Waggle is a separate assistant window, not an integrated tool.

6. **No test runner integration** — Action 15 tried to count tests via bash find + wc but timed out. Waggle should have a `run_tests` tool that returns pass/fail counts directly without bash.

### P2 — Enhancement Opportunities

7. **/changelog edit completed in stream but not written** — The correct code was visible in the SSE stream. Waggle could checkpoint partial work: "I've generated the code but the file edit timed out. Here's the implementation to apply manually: [code]". Currently the truncation gives nothing.

8. **Session-level task tracking** — When a developer does 18 things in a session, Waggle should maintain a task list and mark items complete/pending. The dev log at end of day was good but a real-time view would be better.

---

## Would Marko Pay $30/Month?

**Answer: Not as a primary developer tool today — but closer than any other AI assistant.**

**The case for yes:**
- The architectural memory is genuinely unique. No other tool knows "the EBUSY fix was added as A6 annotation" from a previous session.
- The code generation quality (8/10) matches Claude Code at a workflow level.
- Dev log, architecture documentation, and session synthesis are features no other dev tool offers.
- The /spawn reviewer caught real architectural issues.

**The case for no:**
- 5/18 core tasks produced no file changes due to timeouts. A tool that can't reliably write code is not a developer's primary tool.
- Cursor has a 1-month free trial and is deeply integrated into the editor. Waggle is a separate window requiring copy-paste for actual implementation.
- The file read refusal on action 1 creates distrust. A developer who can't trust the tool to read files without friction won't adopt it.
- At $30/month, Cursor ($20/month) or Claude Code ($20/month from Anthropic) deliver better raw implementation reliability.

**At $15/month as a complement to Cursor:**
Yes, Marko would pay. The persistent memory, workspace-native context, and documentation synthesis fill the gap that Cursor/Copilot leave. The value proposition is "remember everything about this project across all my sessions" — not "write my code faster."

**The one-line verdict**: Waggle is the best AI tool for *understanding* a codebase across time; it is not yet the best tool for *modifying* a codebase reliably.

---

## Recommended Next Slice

Fix the 90-second streaming timeout for file edit operations. This single change would turn 5 failed actions into successes and is the biggest gap between current Waggle and developer adoption. Suggested implementation: stream a "working..." keepalive event every 15 seconds during long operations, and extend the server-side agent timeout to 180s for operations that include edit_file calls.
