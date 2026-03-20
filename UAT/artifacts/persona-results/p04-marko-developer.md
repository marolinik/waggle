# P04: Marko -- Developer / Technical Lead

## Persona Summary

**Role**: Senior dev, leads a small team, writes code + reviews PRs
**Tech level**: Expert
**Tier**: SOLO
**Daily tools**: VS Code, Terminal, GitHub, Slack, Claude Code
**Core need**: "Agent that remembers our architecture, past bugs, team conventions. Drafts that build on accumulated context."
**Competitive bar**: Must be clearly better than raw Claude Code for project-level work.
**Emotional priority**: Controlled Power, Trust, Momentum

---

## Persona System Analysis

### Matching Persona

Marko maps directly to the **coder** persona:
- Tools: `bash`, `read_file`, `write_file`, `edit_file`, `search_files`, `search_content`, `git_status`, `git_diff`, `git_log`, `git_commit`
- Workspace affinity: development, coding, engineering, debugging
- Suggested commands: `/review`, `/plan`
- Default workflow: null

### Persona Prompt Content

The coder persona instructs the agent to:
- Read existing code before suggesting changes
- Write tests alongside implementations
- Use git tools to understand project history and context
- Prefer small, focused changes over large refactors
- Explain technical decisions when the impact isn't obvious
- Search the codebase before writing new utilities

These are excellent instructions for Marko's workflow, but **not injected** into the chat.

---

## Journey Assessment: Architecture Decision (Scenario 13.4)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Bash/git tools | Yes | Yes | Full bash, git_status, git_diff, git_log, git_commit |
| Codebase search | Yes | Yes | search_files (glob), search_content (grep) |
| File read/write | Yes | Yes | read_file, write_file, edit_file |
| Web search (research) | Yes | Yes | web_search, web_fetch |
| ADR drafting | Yes | Yes | Agent can generate structured text |
| Memory save (ADR) | Yes | Yes | save_memory tool |
| Memory search (past decisions) | Yes | Yes | search_memory with cross-session support |
| Tool transparency | Yes | Yes | SSE events expose tool name + input + result |

### System Tools Analysis

The system tools (`packages/agent/src/system-tools.ts`) provide:
- **bash**: Full shell command execution with security sandboxing (denied binaries, sanitized env vars, 1MB output limit, background task support)
- **read_file**: File reading with binary detection (image files skipped)
- **write_file**: File writing within workspace boundaries
- **edit_file**: File editing with path traversal protection
- **search_files**: Glob-based file search
- **search_content**: Content search (grep-like)
- **web_search**: DuckDuckGo search with rate limiting and caching
- **web_fetch**: URL fetching with content extraction

### Git Tools Analysis

Dedicated git tools (`packages/agent/src/git-tools.ts`):
- `git_status`, `git_diff`, `git_log`, `git_commit`
- These are separate from bash to provide structured git operations

### Tool Transparency

The SSE streaming chat endpoint emits:
- `tool` events with name and input (what the agent is about to do)
- `tool_result` events with name, result, duration, and error status
- `step` events with human-readable descriptions (e.g., "Searching for files matching...")

This directly serves Marko's need to see what the agent searched/read/changed.

### Competitive Benchmark: vs. Claude Code

| Dimension | Claude Code | Waggle | Advantage |
|---|---|---|---|
| Code exploration | Excellent | Good (bash + file tools) | Claude Code |
| Memory persistence | None (session-only) | Full (cross-session, cross-workspace) | Waggle +2 |
| ADR generation | Manual (lost on session end) | Generated + saved to memory | Waggle +1 |
| Tool transparency | Visible in terminal | Visible in UI (SSE events) | Tie |
| Context window | Large (200K) | Smaller (50-message window + memory recall) | Claude Code |
| Codebase understanding | Excellent (agentic search) | Good (search_files + search_content) | Claude Code |

Waggle's advantage is memory persistence. The competitive gap is in raw code exploration quality.

### Functional Checkpoint Assessment

- [x] Bash/git tools execute successfully -- Bash with security sandboxing, git tools dedicated
- [x] Codebase findings presented clearly -- Tool transparency via SSE events
- [~] Research relevant to tech stack -- Depends on web_search quality
- [~] ADR format correct with codebase references -- Agent can do this but no ADR template
- [x] Memory save for ADR -- save_memory confirmed working
- [~] Implementation plan references specific files -- Possible but not guaranteed without persona
- [x] Memory search returns technical decisions -- FTS5 + vector search works
- [x] Tool usage is transparent -- SSE events expose all tool operations

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 4 | Codebase exploration tools are solid |
| Relief | 3 | Research + ADR in one session works, but Claude Code does exploration better |
| Momentum | 4 | Question -> exploration -> decision -> plan flow is supported |
| Trust | 3 | Codebase references need to be accurate; no persona-guided code reading |
| Continuity | 5 | ADR saved to memory -- this is Waggle's killer feature for Marko |
| Seriousness | 3 | ADR quality is generic without templates or persona guidance |
| Alignment | 4 | Developer workflow is well-supported by the tool set |
| Controlled Power | 4 | Marko directs exploration; agent has full tool access |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | Full tool set: bash, git, file ops, web search, memory. All functional. |
| Memory support | 5 | Cross-session memory is the killer feature. ADRs persist. |
| Output quality potential | 3 | Without coder persona prompt, output lacks technical precision guidance. |
| Team support | 1 | SOLO tier. N/A. |

**Overall infrastructure score: 3.75/5**

---

## Key Findings

1. **Memory persistence is the key differentiator**: Marko's scenario is where Waggle most clearly beats Claude Code. An ADR saved today can be recalled months later. Architecture decisions accumulate.

2. **Coder persona is well-designed but unused**: The persona prompt includes excellent instructions (read before writing, write tests, prefer small changes) that would make the agent significantly more Marko-friendly.

3. **Bash sandboxing is production-quality**: Denied binary list, sanitized env vars, output truncation, background task support. This is enterprise-appropriate.

4. **50-message context window is limiting**: The MAX_CONTEXT_MESSAGES = 50 cap means long technical discussions lose early context. Auto-recall partially compensates, but Marko may notice missing earlier discussion points.

5. **No ADR template in skills**: An ADR skill template (/draft ADR) would significantly improve the output quality for Marko's workflow.

---

## Recommendations

1. Wire the coder persona prompt into the chat flow.
2. Create an ADR skill template for structured architecture decision recording.
3. Consider increasing MAX_CONTEXT_MESSAGES for technical workspaces, or implementing smarter context selection.
4. The code review template (workspace-templates.ts) correctly maps to the coder persona -- ensure this is surfaced in workspace creation.
