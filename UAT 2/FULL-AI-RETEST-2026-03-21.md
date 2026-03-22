# Waggle Full AI Retest — UAT Round 4

**Date**: 2026-03-21
**Branch**: phase8-wave-8f-ui-ux
**Model**: claude-sonnet-4-6 (default), claude-haiku-4-5 (proxy test)
**Server**: localhost:3333, built-in Anthropic proxy
**Tester**: 6 parallel UAT sub-agents + orchestrator
**Previous scores**: R1 = 38/100, R2 = 62/100

---

## 1. Executive Summary

### Overall Score: 67/100 (up from 62 → +5 points)

| Category | Weight | Score | Max | Notes |
|----------|--------|-------|-----|-------|
| AI Response Quality | 20% | 17 | 20 | Excellent LLM responses, correct, contextual |
| Tool Calling | 15% | 8 | 15 | Works but filesystem scoping is broken |
| Memory System | 15% | 12 | 15 | Cross-session persistence is perfect; isolation fails |
| Slash Commands | 10% | 2 | 10 | 6/8 broken (no workflow runner fallback) |
| Streaming & SSE | 5% | 5 | 5 | Flawless SSE format and incremental delivery |
| Persona Journeys | 15% | 9 | 15 | PM excellent, Dev broken, Marketing good, Agency blocked |
| Advanced Features | 10% | 5 | 10 | KG/cron/skills work; spawn/approval gates don't |
| Stress & Stability | 5% | 5 | 5 | Zero crashes under all conditions |
| Security | 5% | 4 | 5 | Auth solid; stored XSS risk; no approval gates |

**Verdict**: Waggle's AI backbone is genuinely impressive — memory persistence, content generation, and streaming all work at production quality. However, three systemic bugs block real-world use:
1. **Slash commands are dead** — no workflow runner fallback
2. **Workspace memory leaks** — personal mind is shared across workspaces
3. **File tools ignore workspace directory** — developer persona is broken

Fix these three and the score jumps to ~85/100.

---

## 2. AI Response Quality — 9/10

The AI responses are **genuinely good**. Not "good for a prototype" — genuinely competitive with Claude.ai direct access.

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Correctness | 9/10 | "Capital of France is Paris" — correct, concise |
| Contextual awareness | 10/10 | PRD referenced CognifyPipeline, .mind architecture, real milestones |
| Helpfulness | 9/10 | Campaign briefs, social posts, status reports all actionable |
| Memory integration | 9/10 | auto_recall fires on every message, surfaces relevant context |
| Streaming quality | 10/10 | Clean SSE with step/tool/token/done events |
| Instruction following | 7/10 | "Say hello in 3 words" → "Hello there, Marko!" (4 words) |

**Highlight**: When Ana asked for a PRD (as plain message, not /draft), the agent produced a professional-grade document with user stories, acceptance criteria, risk assessment, and success metrics — all informed by workspace memory. It also auto-generated a DOCX file. This is the product working as intended.

**Comparison to Claude.ai**: Response quality is equivalent. The added value is persistent memory — the agent knows project context that Claude.ai would need to be told every session.

---

## 3. Tool Calling Assessment

### Working Tools (quality 8-10/10)
| Tool | Status | Quality | Notes |
|------|--------|---------|-------|
| auto_recall | PASS | 9/10 | Fires on every message, returns relevant memories |
| save_memory | PASS | 9/10 | Natural language save works, importance/source classified |
| search_memory | PASS | 9/10 | Semantic search returns relevant frames |
| get_identity | PASS | 9/10 | Returns agent persona correctly |
| bash | PASS | 8/10 | Commands execute, output captured (wrong CWD) |
| web_search | PASS | 8/10 | Fetches real web results for research |
| web_fetch | PASS | 8/10 | Downloads and parses web pages |
| generate_docx | PASS | 9/10 | Professional document generation |
| query_knowledge | PASS | 7/10 | Works with named queries, no wildcard |

### Broken Tools (quality 2-5/10)
| Tool | Status | Quality | Root Cause |
|------|--------|---------|------------|
| read_file | PARTIAL | 5/10 | CWD = user home, not workspace dir |
| search_content | FAIL | 2/10 | Searches entire filesystem, no scoping |
| search_files | FAIL | 2/10 | Same scoping issue |
| git_status | PARTIAL | 5/10 | Runs in user home, not workspace |

### Critical Tool Bugs

**BUG-1 (Critical): search_content searches entire filesystem**
- User asks: "Search for TypeScript files containing vault"
- Result: Matches from `Write-My-Book-OK`, `EK-Forge`, global `node_modules`
- Impact: 211K token overflow → hard API error, no response delivered
- Fix needed: Scope glob resolution to workspace `directory` field

**BUG-2 (Critical): No result truncation**
- When search returns massive results, entire payload injected into prompt
- Exceeds 200K token limit → HTTP 400 from Anthropic API
- Fix: Cap results at 50 matches or 10K chars, append "[truncated]"

**BUG-3 (High): All file tools ignore workspace directory**
- `read_file`, `search_content`, `bash`, `git_status` all execute from `C:\Users\MarkoMarkovic`
- The workspace `directory` field is stored but never used for tool scoping
- Makes the entire developer persona non-functional

---

## 4. Per-Persona Journey Results

### Ana — Product Manager (Score: 8.6/10)
| Step | Test | Status | Quality |
|------|------|--------|---------|
| 1 | Create workspace | PASS | 9/10 |
| 2 | /catchup (fresh) | PASS | 6/10 |
| 3 | Ask about decisions | PASS | 9/10 |
| 4a | /draft PRD | FAIL | 2/10 |
| 4b | PRD (plain message) | PASS | 10/10 |
| 5 | Save insight to memory | PASS | 9/10 |
| 6 | Search memory | PASS | 8/10 |
| 7 | Export workspace | PASS | 9/10 |

**Verdict**: Ana would use Waggle daily. Memory save/recall is the killer feature. PRD generation is outstanding (via plain message). /draft slash command is broken but workaround exists.
**Addiction score**: 7/10 — She'd come back, but would quickly stop using slash commands.

### Marko — Developer (Score: 2.75/10)
| Step | Test | Status | Quality |
|------|------|--------|---------|
| 1 | Read file | FAIL | 4/10 |
| 2 | Search codebase | FAIL | 2/10 |
| 3 | Git log | PARTIAL | 7/10 |
| 4 | Git status | PARTIAL | 6/10 |

**Verdict**: Completely broken. Every tool executes in the wrong directory. Marko gets git history from an unrelated project and file reads fail with ENOENT or "outside workspace" errors.
**Addiction score**: 1/10 — Would abandon after first session.

### Sara — Marketing Manager (Score: 7.2/10)
| Step | Test | Status | Quality |
|------|------|--------|---------|
| 1 | Create workspace | PASS | 9/10 |
| 2 | Campaign brief (/draft) | PARTIAL | 3→9/10 |
| 3 | Research competitors | PARTIAL | 2→8/10 |
| 4 | Draft social posts | PASS | 8/10 |
| 5 | Save campaign insight | PASS | 9/10 |

**Verdict**: Sara would find Waggle genuinely useful for content generation and research. The AI produces excellent campaign briefs and social posts informed by workspace memory. Slash commands are broken but plain-language requests work well.
**Addiction score**: 6/10 — Would use for drafting, skip slash commands.

### Mia — Agency Owner (Score: 5.5/10)
| Step | Test | Status | Quality |
|------|------|--------|---------|
| 1-2 | Create client workspaces | PASS | 9/10 |
| 3-4 | Save client data | PASS | 9/10 |
| 5 | **ISOLATION TEST** | **FAIL** | **BLOCKER** |
| 6 | Verify in own workspace | PASS | 9/10 |
| 7 | Generate client report | PASS | 9/10 |
| 8 | Check costs | FAIL | 0/10 |

**Verdict**: Content generation is excellent. DOCX reports are professional quality. BUT: Alpha Corp's confidential data (CEO, budget, timeline) is fully visible from Beta Inc's workspace. This is a **dealbreaker** for the agency use case.
**Addiction score**: 2/10 — Cannot trust it with client data.

---

## 5. Slash Command Quality

| Command | Status | Quality | Issue |
|---------|--------|---------|-------|
| /catchup | PARTIAL | 3/10 | "No workspace state available" — no memory fallback |
| /status | PARTIAL | 3/10 | Identical to /catchup when state empty |
| /draft | FAIL | 2/10 | Echoes prompt back as template |
| /research | FAIL | 1/10 | "Workflow runner not available" |
| /plan | FAIL | 1/10 | "Workflow runner not available" |
| /decide | PARTIAL | 4/10 | Empty decision matrix template |
| /spawn | FAIL | 2/10 | "Sub-agent spawning not available" |
| /memory (query) | PASS | 7/10 | Works — searches memory, returns frames |
| /memory (bare) | PARTIAL | 5/10 | Shows usage help, not stats |
| /help | PASS | 7/10 | Clean command listing |
| /review | FAIL | 1/10 | Same workflow runner issue |
| /focus | NOT TESTED | — | — |
| /skills | NOT TESTED | — | — |
| /now | NOT TESTED | — | — |

**Root cause**: `chat.ts` routes slash commands through a lightweight `commandRegistry.execute()` that intentionally omits `runWorkflow`, `spawnAgent`, and agent loop capabilities. The code comments say: "runWorkflow and spawnAgent are intentionally omitted — they require LLM and full agent loop."

**Fix**: Either wire up the agent loop capabilities to the command context, or implement LLM-powered fallbacks for each command that degrade gracefully without the workflow runner.

---

## 6. Advanced Features Status

| Feature | Status | Quality | Notes |
|---------|--------|---------|-------|
| Memory persistence | PASS | 10/10 | Cross-session recall is flawless |
| Knowledge graph | PASS | 7/10 | 20 entities, meaningful relationships |
| Skills system | PASS | 9/10 | 57 skills, 59 tools, 14 commands |
| Session tracking | PASS | 8/10 | Auto-titles, summaries, persistence |
| Cron jobs | PARTIAL | 6/10 | Works but field names differ from docs |
| Weaver consolidation | PARTIAL | 8/10 | Trigger works, no status endpoint |
| Sub-agent spawning | FAIL | 2/10 | Command context missing spawnAgent |
| Approval gates | FAIL | 3/10 | Agent runs destructive bash without asking |
| Workflow composer | FAIL | 2/10 | Workflow runner not wired up |
| Cost tracking | FAIL | 0/10 | /api/costs returns 404 |

---

## 7. Stress Test Results

| Test | Status | Notes |
|------|--------|-------|
| Rate limiting (60 req) | PASS | 100/min window works, not triggered sequentially |
| Long message (10KB) | PASS | Handled gracefully |
| Empty message | PASS | Clean 400 error |
| Special chars + emoji | PASS | All preserved; stored XSS concern |
| Code blocks | PASS | Excellent code handling |
| Context isolation | PASS* | Session-level OK; memory-level leaks |
| Invalid workspace | PASS | Created on-the-fly |
| Auth enforcement | PASS | Distinct MISSING_TOKEN vs INVALID_TOKEN |
| Concurrent requests | PASS | Two simultaneous SSE streams, no cross-contamination |
| Malformed JSON | PASS | Clean Fastify error handling |
| Health under load | PASS | 50 concurrent, all 200, ~210ms avg |

**Server stability: 11/11 scenarios handled without any crashes.**

---

## 8. Security Assessment

| Area | Rating | Notes |
|------|--------|-------|
| Authentication | 9/10 | Session token required, distinct error codes |
| API key storage | 9/10 | AES-256-GCM vault, machine-specific key |
| CSP headers | 8/10 | `script-src 'self'` present |
| Stored XSS | 6/10 | `<script>` tags stored verbatim in memory |
| Approval gates | 2/10 | Destructive bash commands execute without confirmation |
| Workspace isolation | 3/10 | Personal mind shared, no workspace filtering |
| Rate limiting | 7/10 | 100/min works but generous for abuse |
| Error disclosure | 9/10 | No stack traces or internal details leaked |

---

## 9. Addiction Score Update

| Persona | R2 Score | R4 Score | Change | Would Pay? |
|---------|----------|----------|--------|------------|
| Ana (PM) | 5/10 | 7/10 | +2 | Yes, for PRD/memory features |
| Marko (Dev) | 4/10 | 1/10 | -3 | No, tools don't work |
| Sara (Marketing) | 5/10 | 6/10 | +1 | Maybe, good for drafting |
| Mia (Agency) | 3/10 | 2/10 | -1 | No, isolation is broken |

**Composite addiction score: 4/10** — Knowledge workers who don't need file tools would find genuine value. Developers and multi-client users are blocked.

---

## 10. Bug Tracker — All Findings

### BLOCKER (1)
| ID | Finding | Root Cause |
|----|---------|------------|
| B1 | Workspace memory isolation not enforced — auto_recall/search_memory return all memories regardless of workspace | Single personal .mind file, no workspace-level filtering |

### CRITICAL (5)
| ID | Finding | Root Cause |
|----|---------|------------|
| C1 | search_content searches entire filesystem | Glob paths not scoped to workspace directory |
| C2 | No result truncation on search_content | Massive results exceed 200K token limit |
| C3 | /draft echoes prompt instead of drafting | No LLM fallback when workflow runner unavailable |
| C4 | /research returns raw error | No fallback behavior |
| C5 | /plan returns raw error | No fallback behavior |

### HIGH (4)
| ID | Finding | Root Cause |
|----|---------|------------|
| H1 | All file tools ignore workspace directory | CWD = user home, workspace.directory never used |
| H2 | /spawn fails silently | spawnAgent not in command context |
| H3 | Approval gates not enforced | PermissionManager not wired to bash tool in chat route |
| H4 | Agent loop auth bug (FIXED) | litellmApiKey was 'built-in' instead of session token |

### MEDIUM (5)
| ID | Finding | Root Cause |
|----|---------|------------|
| M1 | /catchup doesn't search memory as fallback | No degraded mode when workspace state empty |
| M2 | /decide returns empty template | No LLM invocation to fill in analysis |
| M3 | /api/costs returns 404 | Endpoint not implemented |
| M4 | Stored XSS in memory | script tags stored verbatim, rely on CSP only |
| M5 | Export ignores workspaceId | Exports all data regardless of parameter |

### LOW (5)
| ID | Finding | Root Cause |
|----|---------|------------|
| L1 | /memory bare invocation shows help, not stats | Design choice, but stats would be more useful |
| L2 | Memory search results truncated mid-sentence | No complete-sentence boundary |
| L3 | KG entity type misclassification | Concepts typed as "person" |
| L4 | Cron API field naming mismatch | cronExpr vs schedule, jobType required |
| L5 | Empty auto-sessions clutter session list | UUID sessions with 0 messages |

---

## 11. Final Verdict: Is This Ready for Beta Users?

### No. Not yet. Three blockers remain.

**What's genuinely great** (and would impress beta users):
- AI response quality is Claude.ai-equivalent with persistent context
- Memory save/recall across sessions is seamless and accurate
- Content generation (PRDs, campaign briefs, reports, social posts) is production-quality
- DOCX generation produces professional documents
- 57 skills + 59 tools + 14 commands is a rich capability set
- Server stability is excellent — zero crashes under any conditions
- Security fundamentals (auth, vault, CSP) are solid

**What blocks beta launch**:
1. **Fix B1**: Workspace memory isolation — without this, no multi-workspace user can trust the system
2. **Fix C1/H1**: File tool workspace scoping — without this, developer persona is unusable
3. **Fix C3/C4/C5**: Slash command fallbacks — without this, 6/8 advertised commands produce errors

**Estimated effort to unblock**:
- B1 (workspace memory isolation): Add workspaceId to frames table + filter in auto_recall/search_memory — **2-3 hours**
- C1/H1 (workspace directory scoping): Set CWD from workspace.directory in tool execution layer — **1-2 hours**
- C3/C4/C5 (slash command fallbacks): Add LLM-powered fallback in each command handler — **3-4 hours**

**Total: ~8 hours of focused work to reach beta-ready (estimated score: 85/100).**

---

## Appendix: Pre-Testing Bug Fix

During Phase 1 configuration, a critical bug was discovered and fixed:

**File**: `packages/server/src/local/service.ts:187`
**Bug**: When using the built-in Anthropic proxy, `litellmApiKey` was set to the literal string `'built-in'`. The agent loop then called the server's own `/v1/chat/completions` endpoint with `Authorization: Bearer built-in`, which the security middleware rejected (expecting the session token). This caused ALL chat to fail with "API key is invalid or expired."
**Fix**: Changed `server.agentState.litellmApiKey = 'built-in'` to `server.agentState.litellmApiKey = server.agentState.wsSessionToken`.
**Impact**: Without this fix, zero chat functionality would work.
