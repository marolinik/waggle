# Persona Test: Marko (Developer)

**Date:** 2026-03-21
**Round:** R3 Retest
**Server:** http://localhost:3333
**Workspace:** `marko-dev-workspace` (group: UAT-Persona, directory: D:/Projects/MS Claw/waggle-poc)

---

## Step Results

### Step 1: List Workspaces
**Result: PASS**

`GET /api/workspaces` returned a full JSON array of 45 workspaces. Response was fast, well-structured, and included all expected fields (`id`, `name`, `group`, `created`, optional `directory` and `personaId`). The dedicated `marko-dev-workspace` was present with the correct directory binding to `D:/Projects/MS Claw/waggle-poc`.

---

### Step 2: Ask Agent to Read a File
**Result: FAIL**

Request: "Read the package.json file and tell me what dependencies this project uses"

The agent correctly triggered `auto_recall` (memory retrieval) as a first step and successfully recalled 10 relevant memories. However, before the agent could proceed to invoke `file_read` or any filesystem tool, the request failed with:

```
event: error
data: {"message":"API key is invalid or expired. Update it in Settings > API Keys."}
```

**Root cause:** The Anthropic/Claude API key configured on the server is invalid or expired. The auth token for the Waggle API itself works fine (memory recall succeeded), but the LLM backend call fails. This blocks all LLM-dependent agent operations.

**Observation:** The `auto_recall` tool DID fire, showing the agent pipeline starts correctly. The failure occurs when the agent loop needs to call the LLM to decide what tool to invoke next.

---

### Step 3: Search Codebase for TODOs
**Result: FAIL**

Request: "Search the codebase for any TODO comments"

Same pattern as Step 2: `auto_recall` succeeded (10 memories recalled), then the LLM API key error terminated the request. The agent never reached the point of invoking `codebase_search` or `grep_search`.

---

### Step 4: /status Command
**Result: PASS (partial)**

Request: `/status`

The slash command was handled without needing the LLM API. Response was streamed via SSE tokens:

```
## Status Report

No workspace state available.
```

The command executed successfully and returned a valid response. However, the content is sparse -- "No workspace state available" -- which is expected for a workspace without prior project state, but not particularly useful for a developer. A better response might show workspace metadata (directory, recent sessions, memory count).

**SSE streaming:** Working correctly with token-by-token delivery.
**Tools used:** None (slash command handled locally).

---

### Step 5: Ask Agent to Run Bash Command
**Result: FAIL**

Request: "Run git log --oneline -5 and show me the last 5 commits"

Same LLM API key failure pattern. `auto_recall` succeeded, then error. The agent never reached the `bash` tool invocation.

---

### Step 6: Memory Search for Architecture
**Result: PASS**

`GET /api/memory/search?q=architecture&workspace=marko-dev-workspace` returned 14 results with rich, relevant content:

- Architecture documentation about .mind files (SQLite + FTS5 + sqlite-vec)
- CognifyPipeline memory enrichment pipeline details
- Architectural Review Companion skill creation
- Technical architecture analysis and documentation records
- Plan document locations
- Company profile (Egzakta Group)

Each result included: `id`, `content`, `source`, `source_mind`, `mind`, `frameType`, `importance`, `timestamp`, `gop`, `accessCount`. The results were semantically relevant to the "architecture" query. Response was fast and comprehensive.

---

### Step 7: /help Command
**Result: PASS**

The `/help` command returned a well-formatted markdown table with all 13 slash commands:

| Command | Description |
|---------|-------------|
| `/catchup` | Workspace restart summary |
| `/now` | Current workspace state |
| `/research <topic>` | Multi-agent research |
| `/draft <type> [topic]` | Drafting workflow |
| `/decide <question>` | Decision matrix |
| `/review` | Critic agent review |
| `/spawn <role> [task]` | Specialist sub-agent |
| `/skills` | Active skills |
| `/status` | Project status |
| `/memory [query]` | Memory search/browse |
| `/plan <goal>` | Task list planning |
| `/focus <topic>` | Narrow agent focus |
| `/help` | Command listing |

SSE streaming worked correctly. No LLM call needed. The command set is impressive for a developer -- `/spawn`, `/research`, `/plan`, and `/focus` are particularly appealing.

---

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | List workspaces | **PASS** |
| 2 | Read a file (agent tool) | **FAIL** -- LLM API key expired |
| 3 | Search codebase (agent tool) | **FAIL** -- LLM API key expired |
| 4 | /status | **PASS** (partial -- sparse output) |
| 5 | Run bash command (agent tool) | **FAIL** -- LLM API key expired |
| 6 | Memory search | **PASS** |
| 7 | /help | **PASS** |

**Steps passed: 4/7** (3 blocked by expired LLM API key, not by Waggle bugs)

---

## Scoring

### Was the experience useful for a developer?
**Partially.** The infrastructure that works (workspaces, memory search, slash commands, SSE streaming) is solid and developer-friendly. The memory search returned genuinely useful architectural context. The /help command shows a powerful command vocabulary. However, the core developer use cases (read files, search code, run commands) all require the LLM agent loop, which was blocked by the expired API key. If the API key were valid, the `auto_recall` behavior suggests the agent would correctly invoke filesystem and bash tools.

### Addiction Score: 4/10

**Reasoning:**
- **What works is genuinely good:** Memory search returning architecture details across sessions is exactly what developers want. The slash command system is well-designed. SSE streaming is smooth.
- **What's broken kills the flow:** A developer's primary interactions (read files, search code, run commands) all failed. These are the "first 5 minutes" actions that determine adoption.
- **The API key error message is clear** ("Update it in Settings > API Keys"), which is good UX for debugging.
- **If the API key were valid**, this score would likely be 6-7/10 based on the infrastructure quality and the promising `auto_recall` behavior showing the agent pipeline is functional.

### Key Observation: Does the agent actually invoke tools or just echo?

**The agent DOES invoke tools** -- specifically, `auto_recall` was consistently triggered as the first step in the agent pipeline for all natural-language requests (Steps 2, 3, 5). The tool invocation is visible in the SSE stream:

```
event: tool
data: {"name":"auto_recall","input":{"query":"..."}}
event: tool_result
data: {"name":"auto_recall","result":"10 memories recalled: ...","duration":12,"isError":false}
```

The agent successfully:
1. Identified the need for memory context
2. Called `auto_recall` with the user's query
3. Retrieved and summarized 10 relevant memories
4. Failed only when it needed to call the LLM to determine the next tool (file_read, grep_search, bash)

**Conclusion:** The tool infrastructure is wired correctly. The agent is not "just echoing" -- it has a real tool pipeline with memory recall, tool invocation events, and result streaming. The only blocker is the expired LLM API key preventing the agent loop from continuing past the first auto_recall step.

---

## Bugs Found

| ID | Severity | Description |
|----|----------|-------------|
| B1 | **P0** | LLM API key expired/invalid -- blocks all agent tool invocations beyond auto_recall. Error: "API key is invalid or expired. Update it in Settings > API Keys." |
| B2 | **P2** | `/status` returns "No workspace state available" for a workspace with directory binding and existing memories. Should at minimum show workspace metadata (directory, memory count, last session). |

## Recommendations

1. **Fix API key** -- This is the single blocker for all developer-facing agent capabilities. Once resolved, re-run Steps 2, 3, 5 to validate the full tool chain.
2. **Enrich /status** -- For workspaces with a bound directory, `/status` should show: directory path, git branch, recent commits, memory frame count, last session timestamp. This would make it immediately useful for developers.
3. **Graceful degradation** -- When the LLM API key is invalid, the agent could still attempt local-only operations (file listing, git status) without needing the LLM, or at minimum surface a more actionable error earlier in the flow.
