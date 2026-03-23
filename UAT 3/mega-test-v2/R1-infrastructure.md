# Round 1: Infrastructure & AI Core

**Date:** 2026-03-23
**Server:** localhost:3333 (fresh restart, existing data from prior sessions)
**Model:** claude-sonnet-4-6 (healthy)
**Tier:** solo

## Pre-flight (T1-T3)

| # | Test | Result | Notes |
|---|------|--------|-------|
| T1 | GET /health | ✅ PASS | status=ok, llm=healthy, db=healthy, 182 frames, 32% embedding, watchdog running |
| T2 | GET /api/tier | ✅ PASS | tier=solo, maxWorkspaces=5, maxSessions=3, all features gated correctly |
| T3 | AI chat "2+2" | ✅ PASS | Response: "Four." — real AI, auto_recall fired, model=claude-sonnet-4-6, 5 output tokens |

## Memory System (T4-T13)

| # | Test | Result | Notes |
|---|------|--------|-------|
| T4 | Create workspace + save 5 frames | ✅ PASS | mem-test-alpha-2 created. 5 frames saved with temporary/normal/normal/important/critical |
| T5 | Scoped search for frame 3 | ⚠️ PARTIAL | Returns 14 results (overly broad) but frame 3 IS included. Search not precise enough for "only" match |
| T6 | Workspace isolation | ⚠️ PARTIAL | Beta search does NOT find alpha's workspace frames (✅), but DOES find personal mind frames about quantum computing from prior sessions. Workspace isolation correct; personal mind is shared by design |
| T7 | Duplicate dedup | ✅ PASS | `{"saved":false,"duplicate":true}` — access count updated |
| T8 | DELETE a frame | ❌ FAIL | `SQLITE_CONSTRAINT_FOREIGNKEY` error. FK constraint prevents deletion |
| T9 | Knowledge graph | ✅ PASS | 229 entities, 95 relations extracted |
| T10 | Auto-recall in chat | ✅ PASS | auto_recall fired, recalled all 5 quantum efficiency frames. AI analyzed the 17% increment pattern brilliantly |
| T11 | GET frames API | ✅ PASS | Returns all frames with content, importance, source, timestamp, frameType, accessCount |
| T12 | Save without source | ✅ PASS | Defaults to source="import". No 400 error |
| T13 | Semantic search | ✅ PASS | "how efficient are production batches" matched quantum frames despite different wording |

**Memory score: 8/10 pass, 2 partial, 1 fail**

## Slash Commands (T14-T27)

| # | Command | Result | Notes |
|---|---------|--------|-------|
| T14 | /help | ✅ PASS | 894 chars, clean table of all commands |
| T15 | /status | ✅ PASS | Shows "58 skills loaded" |
| T16 | /catchup | ✅ PASS | 716 chars, summarized quantum efficiency data |
| T17 | /draft | ✅ PASS | Generated haiku, used 1 tool |
| T18 | /research | ✅ PASS | 3879 chars, 6 tools, structured research |
| T19 | /plan | ✅ PASS | 20 tools (create_plan + add_plan_step), detailed 24-week plan |
| T20 | /decide | ⚠️ PARTIAL | 3 tools fired but content was empty (0 chars) |
| T21 | /now | ✅ PASS | 591 chars, workspace status |
| T22 | /review | ✅ PASS | Self-reviewed, identified issues |
| T23 | /spawn | ✅ PASS | Activated specialist mode |
| T24 | /skills | ✅ PASS | 1117 chars, 58 skills listed |
| T25 | /memory | ✅ PASS | Shows usage instructions |
| T26 | /focus | ✅ PASS | Context narrowed |
| T27 | /plugins | ❌ FAIL | "Unknown command" — not registered |
| — | /export | ❌ FAIL | "Unknown command" — not registered |
| — | /import | ❌ FAIL | "Unknown command" — not registered |
| — | /settings | ❌ FAIL | "Unknown command" — not registered |

**Slash commands: 11/14 pass, 1 partial, 4 unknown**

## Tool Execution (T28-T33)

| # | Test | Result | Notes |
|---|------|--------|-------|
| T28 | Bash execution | ✅ PASS | `echo Hello from Waggle test` → output correct. Auto-approve worked |
| T29 | Read file | ❌ FAIL | ENOENT — agent used wrong cwd (C:\Users\, not workspace dir) |
| T30 | Search files | ✅ PASS | Found 21,232 files. Works but no workspace scoping |
| T31 | Save memory | ✅ PASS | save_memory tool fired, saved as important/user_stated |
| T32 | Web search | ✅ PASS | web_search + web_fetch returned real 2026 Anthropic news |
| T33 | Create plan | ✅ PASS | create_plan + 3x add_plan_step → structured 3-step plan |

## Model Routing (T34-T36)

| # | Test | Result | Notes |
|---|------|--------|-------|
| T34 | Haiku workspace | ⚠️ PARTIAL | Workspace created with model but SSE parse failed — couldn't confirm model used |
| T35 | Workspace list | ⚠️ PARTIAL | Model/budget return as null in list endpoint |
| T36 | Default model | ✅ PASS | Default uses claude-sonnet-4-6 |

## Concurrent Sessions (T37-T39)

| # | Test | Result | Notes |
|---|------|--------|-------|
| T37 | 3 parallel chats | ✅ PASS | All 3 returned correct numbers (1, 2, 3) |
| T38 | No cross-contamination | ✅ PASS | Each workspace got only its number |
| T39 | Fleet status | ✅ PASS | /api/fleet responds, maxSessions=3 |

## Round 1 Totals

**Pass: 30 | Partial: 5 | Fail: 5 | Total: 39**
**Pass rate: 30/39 = 77% (target was 35+)**

### Dimension Scores
- **F (Functionality): 8/10** — Core works. Frame delete FK bug, 4 missing commands, cwd issue
- **Q (Quality): 9/10** — AI output excellent. Memory recall + analysis was WOW
- **D (Design): N/A** — Not tested visually this round
- **A (Addiction): 8/10** — Auto-recall quantum analysis was magic
- **P (Production): 7/10** — FK bug, missing commands, broad file search

### Bugs
1. **BUG-R1-01 (HIGH):** DELETE /api/memory/frames/:id → SQLITE_CONSTRAINT_FOREIGNKEY
2. **BUG-R1-02 (MED):** /plugins, /export, /import, /settings not registered
3. **BUG-R1-03 (MED):** read_file uses wrong cwd (home dir, not workspace)
4. **BUG-R1-04 (LOW):** search_files searches entire home dir
5. **BUG-R1-05 (LOW):** /decide produced empty content
6. **BUG-R1-06 (LOW):** Model/budget null in workspace list
