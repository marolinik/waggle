# UAT Sub-agent 3: Persona Journey Tests (Ana PM + Marko Dev)
## Round 4 — 2026-03-21

**Server**: http://localhost:3333
**Auth**: Bearer token from /health endpoint
**Test approach**: Full API-driven journey testing for two personas

---

## Ana — Product Manager Journey

### Ana Step 1: Create Workspace
**Command**: `POST /api/workspaces`
```json
{"name": "Ana UAT Workspace", "group": "product-management", "description": "Product management workspace for Ana"}
```
**Response**:
```json
{"id":"ana-uat-workspace","name":"Ana UAT Workspace","group":"product-management","created":"2026-03-21T19:43:30.401Z"}
```
- **Status**: PASS
- **Response quality**: 9/10 — Clean JSON, auto-generated slug ID, timestamp
- **Persona fit**: 9/10 — Fast workspace creation, no friction
- **Notes**: Initial attempt failed because `group` field is required but not documented in the error message. Error says "name and group are required" which is helpful. The `description` field was silently ignored (not stored/returned).

---

### Ana Step 2: /catchup — Returns After Weekend
**Command**: `POST /api/chat` with `/catchup`
**Response**:
```
## Catch-Up Briefing
Here's what's been happening in this workspace:
No workspace state available.
```
- **Status**: PASS (expected behavior for fresh workspace)
- **Response quality**: 6/10 — Correct behavior but the response is thin. A fresh workspace could offer onboarding guidance instead of just "No workspace state available."
- **Persona fit**: 5/10 — Ana returning to a fresh workspace gets a dead-end. Would be better to say "This is a new workspace. Try sending a message or saving an insight to get started."
- **Notes**: No tools were used (no toolsUsed in response). The slash command correctly activated catchup mode but the empty-workspace experience is underwhelming.

---

### Ana Step 3: Ask About Decisions
**Command**: `POST /api/chat` — "What key decisions have been made in this project recently?"
**Response**: Used `auto_recall` (10 memories) + `search_memory` (10 results, query: "decision decided key decision major decision"). Found and presented key strategic decisions including:
- Platform-First Development Strategy (March 2026)
- Build platforms before agent intelligence
- Q2 revenue target ($150K MRR)
- Architecture decisions (.mind file, CognifyPipeline)
- Milestone completions (M3b, M3c)

- **Status**: PASS
- **Response quality**: 9/10 — Rich, structured response with context for each decision. Properly categorized and formatted.
- **Persona fit**: 9/10 — Exactly what a PM needs: decisions with rationale and context. The "Major Strategic Decisions" header and numbered list format is ideal for scanning.
- **Notes**: Memory search worked well with hybrid approach (auto_recall + search_memory). The memories came from the personal mind which has rich historical data. Response took ~20 seconds due to dual memory lookups.

---

### Ana Step 4: /draft PRD
**Command**: `POST /api/chat` — `/draft Write a PRD for a new feature: intelligent workspace summarization...`

**Response (via /draft command)**:
```
## Draft Prompt
Please draft the following:
**Write a PRD for...**
_Tip: A review workflow is not available. The agent will draft directly._
```

- **Status**: FAIL — /draft command echoed the prompt back instead of generating the actual PRD
- **Response quality**: 2/10 — Did not produce the requested document. Just reflected the request.
- **Persona fit**: 2/10 — A PM asking for a PRD draft and getting the prompt echoed back is confusing and useless.
- **Notes**: The /draft slash command appears to be a routing/dispatch mechanism that failed to execute the actual draft generation. No tools were used (toolsUsed: []).

**Retry as regular message** (without /draft prefix):
- **Status**: PASS
- **Response quality**: 10/10 — Generated a comprehensive, professional PRD including:
  - Executive summary with target release and priority
  - Problem statement
  - 6 detailed user stories with acceptance criteria
  - Technical requirements (memory system integration, agent intelligence, data sources)
  - Content processing pipeline
  - Performance requirements
  - Detailed UX design (digest structure, delivery mechanisms, customization)
  - 3-phase implementation plan with deliverables
  - Risk assessment (technical, product, business)
  - Success metrics (leading indicators, engagement, outcome, long-term)
  - Future enhancements
- **Persona fit**: 10/10 — This is exactly what a PM needs. Professional-grade PRD with user stories, acceptance criteria, and measurable success metrics.
- **Notes**: The agent also generated a DOCX file (`docs/prd-intelligent-workspace-summarization.docx`). The content was contextually aware of Waggle's architecture (referenced MindDB, CognifyPipeline, etc.). However, the /draft command itself is broken.

**Finding F1 (MEDIUM)**: `/draft` slash command fails to generate content — echoes prompt back instead of drafting. Workaround: send as regular message without the /draft prefix.

---

### Ana Step 5: Save Insight to Memory
**Command**: `POST /api/chat` — "Save this insight to memory: After testing the workspace summarization feature..."

**Response**:
- Used `auto_recall` (10 memories recalled)
- Used `save_memory` with content: "DECISION: Workspace summarization format - After testing, users prefer bullet-point summaries over narrative text..."
- Importance: `important`, Source: `user_stated`
- Agent noted this aligns with existing bullet-point preference in memory

- **Status**: PASS
- **Response quality**: 9/10 — Correctly identified the request as a memory-save action. Properly classified as a DECISION with appropriate importance. Connected it to existing preferences.
- **Persona fit**: 9/10 — Natural language save-to-memory works perfectly. Ana doesn't need to know the memory system internals.
- **Notes**: Good that the agent classified it as importance: "important" and source: "user_stated". Also good cross-referencing with existing preferences.

---

### Ana Step 6: Search Memory
**Command**: `POST /api/chat` — "Search memory for anything about workspace summarization"

**Response**:
- Used `auto_recall` (10 memories)
- Used `search_memory` with query: "workspace summarization"
- Found the previously saved decision as result [1] (score: 0.015)
- Also returned 9 other related memories (milestones, architecture)

- **Status**: PASS
- **Response quality**: 8/10 — Successfully found the saved insight. The search ranked it as top result. However, the other 9 results had low relevance scores (0.013-0.014) and were only tangentially related.
- **Persona fit**: 8/10 — Ana can search for decisions and find them. The search is functional and returns the right content.
- **Notes**: Memory round-trip (save + search) works correctly. The semantic search scores are very close together (0.013-0.015) which suggests the vector similarity may not be strongly differentiating between relevant and tangential results.

---

### Ana Step 7: Export Workspace
**Command**: `POST /api/export` (initially tried GET — returned 404)

**Response**: HTTP 200, ZIP file (214KB)

ZIP contents:
- `memories/personal-frames.json` — All memory frames
- `sessions/` — 100+ session markdown files across 30+ workspaces
- `workspaces/` — 40+ workspace JSON configs (including `ana-uat-workspace.json`)
- `settings.json` — User settings
- `vault-metadata.json` — Vault encryption metadata

- **Status**: PASS
- **Response quality**: 9/10 — Comprehensive export with all data categories. Clean structure.
- **Persona fit**: 8/10 — PM can export all data for backup or compliance purposes.
- **Notes**:
  - Export is POST, not GET. This is non-standard for download endpoints but acceptable.
  - Export includes ALL workspaces and sessions, not just the specified workspace. The `workspaceId` parameter appears to be ignored — this exports everything.

**Finding F2 (LOW)**: Export endpoint ignores `workspaceId` parameter and exports all data. For a PM managing multiple projects, workspace-scoped export would be expected.

---

## Ana Journey Summary

| Step | Test | Status | Quality | Persona Fit |
|------|------|--------|---------|-------------|
| 1 | Create workspace | PASS | 9/10 | 9/10 |
| 2 | /catchup (fresh workspace) | PASS | 6/10 | 5/10 |
| 3 | Ask about decisions | PASS | 9/10 | 9/10 |
| 4a | /draft PRD | FAIL | 2/10 | 2/10 |
| 4b | PRD (regular message) | PASS | 10/10 | 10/10 |
| 5 | Save insight to memory | PASS | 9/10 | 9/10 |
| 6 | Search memory | PASS | 8/10 | 8/10 |
| 7 | Export workspace | PASS | 9/10 | 8/10 |

**Ana Overall Score**: 6/7 PASS, 1 FAIL
**Average Quality (excluding fail)**: 8.6/10
**Average Persona Fit (excluding fail)**: 8.0/10

**Ana Verdict**: Waggle is genuinely useful for a PM. Memory save/recall is the killer feature — Ana can capture decisions in natural language and retrieve them later. The PRD generation (via regular message) is outstanding. Main pain points: /draft command is broken, and fresh workspace catchup is underwhelming.

---

## Marko — Developer Journey

### Marko Step 1: Read File and Summarize Exports
**Command**: `POST /api/chat` — "Read the file packages/core/src/index.ts and summarize what it exports."

**Attempt 1** (relative path): `read_file` tool resolved path to `C:\Users\MarkoMarkovic\packages\core\src\index.ts` — ENOENT
**Attempt 2** (absolute path): `read_file` tool returned "Error: Path resolves outside workspace" for `D:\Projects\MS Claw\waggle-poc\packages\core\src\index.ts`
**Attempt 3** (bash cat): Agent tried `cat packages/core/src/index.ts` from home directory — file not found. Then tried `cd /d/Projects/MS Claw/waggle-poc && cat packages/core/src/index.ts` — awaiting execution.

- **Status**: FAIL — Agent could not read the file despite the workspace having `directory: "D:/Projects/MS Claw/waggle-poc"` configured
- **Response quality**: 4/10 — Agent showed good problem-solving instincts (tried multiple approaches, checked memory for project location) but ultimately couldn't deliver the requested information due to path resolution issues
- **Persona fit**: 3/10 — A developer asking to read a codebase file and getting path errors is a fundamental failure. This is the primary developer use case.
- **Notes**:
  - The `read_file` tool resolves paths relative to the agent's CWD (user home), not the workspace directory
  - The workspace `directory` field is set to `D:/Projects/MS Claw/waggle-poc` but this is not used to scope file operations
  - The "Path resolves outside workspace" error suggests a sandbox that prevents reading from the workspace directory itself

**Finding F3 (HIGH)**: `read_file` tool does not use workspace `directory` field for path resolution. Files in the configured workspace directory are rejected as "outside workspace". This breaks the core developer use case of reading project files.

---

### Marko Step 2: Search for Vault Imports
**Command**: `POST /api/chat` — "Search the codebase for all files that import from the vault module."

**Response**: `search_content` tool searched with pattern `from.*vault|import.*vault` but returned results from `Write-My-Book-OK/platform/node_modules/lucide-react/dist/DynamicIcon.d.ts` — a completely unrelated file listing icon names containing the substring "vault".

- **Status**: FAIL — Search ran against the user's home directory, not the workspace directory. Results were irrelevant noise from node_modules of another project.
- **Response quality**: 2/10 — Returned thousands of lines of icon name definitions instead of actual vault imports
- **Persona fit**: 1/10 — Developer asks for codebase search and gets icon name lists from an unrelated project. Completely useless.
- **Notes**: The `search_content` tool also ignores the workspace `directory` field and searches from the user's home directory. No `node_modules` exclusion or workspace scoping.

**Finding F4 (HIGH)**: `search_content` tool searches from user home directory, not workspace directory. Same root cause as F3 — workspace `directory` is not used to scope tool operations.

---

### Marko Step 3: Run Git Log
**Command**: `POST /api/chat` — "Run git log --oneline -10 and summarize the recent commits"

**Response**: Used `bash` tool to run `git log --oneline -10`. Returned commits from the user's HOME directory git repo (LM TEK Sales project), not the waggle-poc workspace:
```
7f0dcec Scrape 244/245 product images from ekwb.com (99.6% coverage)
51f194c Sales Cockpit: prospect editing, product images, suggested bundles, item dedup
bf3242e Fix margin calculation: use gross margin instead of markup
9fa0233 Sales Cockpit: add bundles, proposals, mailer + fix tier calculator
c17d631 LM TEK Sales: complete contact enrichment (258/258 = 100% coverage)
```

Agent provided a well-structured summary of these commits, categorizing them by type (web scraping, sales features, financial fix, etc.) and identifying key patterns.

- **Status**: PARTIAL — Git log ran successfully and agent summarized well, but it ran in the WRONG directory (home dir instead of waggle-poc workspace)
- **Response quality**: 7/10 — The summary itself was excellent (structured, categorized, identified patterns). But the data was from the wrong project.
- **Persona fit**: 4/10 — A developer asking about their project's git history and getting commits from an unrelated project is misleading. The agent didn't realize the commits were from the wrong project.
- **Notes**: Same root cause as F3/F4 — bash commands execute in user home directory, not workspace directory.

**Finding F5 (HIGH)**: `bash` tool executes commands in user home directory, not workspace directory. All developer-facing tools (read_file, search_content, bash, git_status) share this bug: they ignore the workspace's configured `directory` field.

---

### Marko Step 4: Check Git Status
**Command**: `POST /api/chat` — "What is the current git status? Are there any uncommitted changes?"

**Response**: Used `git_status` tool. Returned status of the user's HOME directory git repo:
- Branch: master (home dir repo)
- Modified files: All from "LM TEK SALES/" subfolder
- Untracked: Dozens of home directory items (.waggle/, .claude/, Desktop/, Downloads/, NTUSER.DAT, etc.)

Agent provided structured summary listing modified files and untracked directories.

- **Status**: PARTIAL — git_status ran but in the wrong directory (user home, not waggle-poc workspace)
- **Response quality**: 6/10 — Good structured output, but from wrong project. Also exposed sensitive home directory contents (NTUSER.DAT, AppData references)
- **Persona fit**: 3/10 — Developer gets git status of their entire home directory instead of the project workspace. Worse, it exposes system files.
- **Notes**: The `git_status` tool (a dedicated tool, not bash) also ignores workspace directory. Additionally, exposing files like NTUSER.DAT, .ssh/, .aws/ etc. in output is a minor security/privacy concern.

**Finding F6 (MEDIUM)**: `git_status` dedicated tool also ignores workspace directory. All tool execution is scoped to user home, not the configured workspace directory. This is a systemic issue affecting the entire developer experience.

---

## Marko Journey Summary

| Step | Test | Status | Quality | Persona Fit |
|------|------|--------|---------|-------------|
| 1 | Read file | FAIL | 4/10 | 3/10 |
| 2 | Search codebase | FAIL | 2/10 | 1/10 |
| 3 | Git log | PARTIAL | 7/10 | 4/10 |
| 4 | Git status | PARTIAL | 6/10 | 3/10 |

**Marko Overall Score**: 0 PASS, 2 PARTIAL, 2 FAIL
**Average Quality**: 4.75/10
**Average Persona Fit**: 2.75/10

**Marko Verdict**: The developer experience is fundamentally broken due to workspace directory scoping. All tools (read_file, search_content, bash, git_status) execute in the user's home directory instead of the workspace's configured directory. A developer cannot: read project files, search the codebase, view project git history, or check project git status. The agent's language generation quality is good (structured summaries, pattern identification) but it operates on the wrong data.

---

## Combined Findings Summary

### Critical Findings

| ID | Severity | Component | Finding |
|----|----------|-----------|---------|
| F3 | HIGH | read_file tool | `read_file` ignores workspace `directory` field; rejects workspace files as "outside workspace" |
| F4 | HIGH | search_content tool | `search_content` searches from user home dir, not workspace directory; no node_modules exclusion |
| F5 | HIGH | bash tool | `bash` executes in user home dir, not workspace directory |
| F6 | MEDIUM | git_status tool | `git_status` dedicated tool also ignores workspace directory |
| F1 | MEDIUM | /draft command | `/draft` slash command echoes prompt instead of generating content |
| F2 | LOW | export endpoint | Export ignores `workspaceId` parameter; exports all data |

### Root Cause Analysis

**F3, F4, F5, F6 share a single root cause**: The workspace `directory` field is stored in the workspace config but is NOT used to set the CWD for tool execution. All tools execute from the agent process's CWD (user home directory `C:\Users\MarkoMarkovic`). This makes the entire developer persona workflow non-functional.

**Likely fix location**: The orchestrator or tool execution layer needs to `chdir` or prefix paths based on the active workspace's `directory` field when executing tools.

### Recommendations

1. **P0 — Fix workspace directory scoping**: All tools must respect the workspace `directory` field as their working directory. This is the single most impactful fix for developer experience.
2. **P1 — Fix /draft command**: The slash command should trigger actual content generation, not echo the prompt.
3. **P2 — Improve empty workspace catchup**: Show onboarding guidance instead of "No workspace state available."
4. **P2 — Scope export to workspace**: Honor the `workspaceId` parameter to allow workspace-specific exports.

---

## Overall Assessment

| Persona | Pass Rate | Avg Quality | Avg Persona Fit | Verdict |
|---------|-----------|-------------|-----------------|---------|
| Ana (PM) | 86% (6/7) | 8.6/10 | 8.0/10 | Strong for PM use cases |
| Marko (Dev) | 0% (0/4) | 4.75/10 | 2.75/10 | Broken for dev use cases |
| **Combined** | **55% (6/11)** | **7.2/10** | **6.0/10** | **PM-ready, Dev-blocked** |

The platform demonstrates strong capabilities for knowledge-work personas (PMs, analysts) — memory, search, document generation, and context awareness all work well. However, the developer persona is completely blocked by a systemic workspace directory scoping bug that affects all file/code/git operations.
