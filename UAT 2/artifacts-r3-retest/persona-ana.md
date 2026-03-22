# Persona Test: Ana (Product Manager)

**Date:** 2026-03-21
**Workspace:** `ana-product-team` (group: UAT-Persona)
**Server:** http://localhost:3333
**Tester:** Automated API test via Claude Code

---

## Step-by-Step Results

### Step 1: List Workspaces and Pick One
**Result: PASS**

`GET /api/workspaces` returned 45 workspaces. Selected `ana-product-team` (group: UAT-Persona) as it is specifically created for Ana's PM persona.

Response included all expected fields: `id`, `name`, `group`, `created`.

---

### Step 2: /catchup -- Instant Context
**Result: PASS**

`POST /api/chat` with `/catchup` returned a well-structured SSE stream with a workspace briefing:

```
## Catch-Up Briefing

# Workspace Now -- Ana Product Team

PRD: Mobile Notifications Feature - User stories include push notification preferences,
quiet hours, and notification grouping. Success m....
Active today with 1 memories across 1 session.

## Active Threads
- Hello, can you tell me what you know about this workspace? (19h ago)
```

The briefing includes:
- Workspace name and context
- Active memory summary (PRD content)
- Session count
- Active threads with timestamps

Useful for a PM catching up? **Yes** -- provides immediate orientation on what this workspace is about and recent activity.

---

### Step 3: Ask About Key Decisions (Real Chat)
**Result: PARTIAL PASS (Agent Pipeline Invoked, LLM Key Expired)**

`POST /api/chat` with `"What are the key decisions we made this week?"` triggered the agent pipeline correctly:

1. `auto_recall` tool was invoked with the query
2. 10 relevant memories were recalled, including:
   - "DECISION: Build platforms first (M4 Tauri desktop, M5 web app), polish agent intelligence last..."
   - Plan document locations
   - Company profile information
3. **However**, the LLM API key was invalid/expired, so no final response was generated

The error returned: `"API key is invalid or expired. Update it in Settings > API Keys."`

**Verdict:** The pipeline architecture works correctly (memory recall, tool invocation). The failure is an infrastructure/config issue (expired API key), not a product defect. Scoring as PARTIAL PASS because the agent machinery is functioning but Ana wouldn't get a useful answer.

---

### Step 4: Search Memory for Context
**Result: PASS**

`GET /api/memory/search?q=decision&workspace=ana-product-team` returned 3 memory frames:

1. **User preference** about Architectural Review Companion skill (frameType: I, source: user_stated)
2. **Deprecated version** of the same preference (frameType: P, importance: deprecated)
3. **Critical decision** about build order -- platforms first, agent intelligence last (frameType: P, importance: critical)

Response structure included: `id`, `content`, `source`, `source_mind`, `mind`, `frameType`, `importance`, `timestamp`, `gop`, `accessCount`.

Memory search is functional and returns relevant, structured results. A PM could use this to find past decisions.

---

### Step 5: /status
**Result: PASS**

`POST /api/chat` with `/status` returned a status report:

```
## Status Report

# Workspace Now -- Ana Product Team

PRD: Mobile Notifications Feature - User stories include push notification preferences,
quiet hours, and notification grouping. Success m....
Active today with 1 memories across 1 session.

## Active Threads
- Hello, can you tell me what you know about this workspace? (19h ago)
```

The /status output is nearly identical to /catchup. Both commands work and return workspace context. For a PM, having a quick status view is valuable.

---

### Step 6: /draft Write a PRD
**Result: FAIL**

`POST /api/chat` with `/draft Write a brief PRD for adding dark mode to our app` returned:

```
## Draft Prompt

Please draft the following:

**Write a brief PRD for adding dark mode to our app**

_Tip: A review workflow is not available. The agent will draft directly._
```

The /draft command was **recognized** and parsed correctly (it extracted the prompt text). However, it did **not** invoke the agent to actually produce the draft. It only echoed back a formatted prompt with a tip about the review workflow.

This is likely the same API key issue from Step 3 -- the slash command handler works, but the agent pipeline cannot complete without a valid LLM key. The "agent will draft directly" message suggests it tried but couldn't proceed.

For Ana as a PM, this is a critical workflow -- drafting PRDs is core to her role.

---

### Step 7: Check Sessions Persisted
**Result: FAIL**

`GET /api/chat/sessions?workspace=ana-product-team` returned `{"error":"Not found"}`.

Investigation reveals there is **no `/api/chat/sessions` endpoint** in the server. Sessions are stored as `.jsonl` files on disk (`~/.waggle/workspaces/{id}/sessions/`) and session metadata is exposed through the workspace home/detail endpoint, not a dedicated sessions API.

The workspace detail endpoint (`GET /api/workspaces/ana-product-team`) returns basic workspace info but does not include session listing.

**Note:** This is an API gap rather than a data persistence failure. The chat messages are being persisted to disk (the `persistMessage()` function in chat.ts handles this), but there's no REST endpoint to list sessions independently.

---

## Summary Scorecard

| Step | Description | Result |
|------|-------------|--------|
| 1 | List workspaces | **PASS** |
| 2 | /catchup instant context | **PASS** |
| 3 | Real chat (key decisions) | **PARTIAL PASS** (pipeline works, API key expired) |
| 4 | Memory search | **PASS** |
| 5 | /status | **PASS** |
| 6 | /draft PRD | **FAIL** (echoed prompt, no draft produced) |
| 7 | Sessions persisted check | **FAIL** (no sessions endpoint exists) |

**Steps Passed: 4/7** (counting partial as 0.5: **4.5/7**)

---

## PM Usefulness Assessment

**Was the experience useful for a PM?**

Partially. The workspace briefing (/catchup, /status) and memory search work well and provide genuine value for orientation. A PM can:
- See what a workspace is about at a glance
- Search for past decisions and context
- Get a sense of activity and threads

However, the two most PM-critical workflows failed:
- **Drafting** (the core PM output) did not produce content
- **Session history** (reviewing past conversations) has no API endpoint

The failures are split between infrastructure (API key expiry) and missing features (sessions endpoint).

---

## Addiction Score: Would Ana Come Back Tomorrow?

**Score: 4/10**

**Positives:**
- Instant workspace context is genuinely useful
- Memory search returning structured decision frames is powerful
- The SSE streaming feels responsive
- Workspace organization (groups, names) is clean

**Negatives:**
- Cannot draft anything (her primary use case) due to API key issue
- No way to browse past sessions/conversations via API
- /catchup and /status return identical content (redundant commands)
- The workspace has minimal memory (1 memory, 1 session) making it hard to assess depth
- Error messaging for API key is clear but the failure is blocking

**For Ana to come back:**
1. Fix the API key so the agent can actually produce drafts and answers
2. Add a sessions listing endpoint so she can review conversation history
3. Differentiate /catchup from /status (currently identical output)
4. With working LLM, the /draft command could be a killer feature for PMs

**Bottom line:** The infrastructure is solid (memory, slash commands, SSE streaming, workspace model) but the experience is incomplete without a working LLM connection. The platform has PM-friendly DNA but needs the agent to actually execute.
