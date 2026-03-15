# UAT 12 — Competitive Benchmark

Structured comparison of Waggle against 5 competitors across 3 identical tasks. The goal: quantify where Waggle wins, where it is equivalent, and where it needs improvement.

**Method**: Run each task in Waggle first (with accumulated context from prior use), then attempt the same task in each competitor. Score each on 5 dimensions.

---

## Competitors

| # | Competitor | What it is | Expected Waggle advantage |
|---|-----------|-----------|--------------------------|
| A | Claude Code (CLI) | Terminal-based AI assistant, no memory, no workspace, stateless | Memory, workspace context, visual UI, multi-project |
| B | Claude Cowork / Open Claude Cowork | Electron chat app, Claude Agent SDK, basic Composio integration | Deeper memory, capability system, team mode, workspace model |
| C | OpenClaw | Open source personal AI assistant, multi-channel, skills, heartbeat | Memory persistence, workspace isolation, trust model, .mind files |
| D | ChatGPT Desktop | General-purpose AI, conversation history, GPT store | Specialized for knowledge work, structured memory, tool transparency |
| E | Cursor AI | IDE-focused AI, code-centric, tab completion, codebase context | Broader knowledge work, memory across sessions, team collaboration |

---

## Task 1: Memory-Dependent Recall

**Task**: "Summarize the key decisions we made last week on the marketing strategy."

**What this tests**: Memory, context persistence, cross-session continuity, structured recall.

**Setup**: Before running this task, establish context in each tool:
1. In a prior session (at least 5 minutes before), have a conversation about marketing strategy where you make 3 specific decisions:
   - Decision A: "We chose brand-first positioning over product-led growth."
   - Decision B: "Target audience is mid-market B2B companies, 50-500 employees."
   - Decision C: "Primary channels will be LinkedIn content and industry events, not paid ads."
2. Close the tool completely.
3. Reopen and ask the task question.

### Waggle Execution

**Persona**: Mia
**Tier**: SOLO
**Prerequisites**: Marketing strategy workspace with decisions saved to memory from a prior session.

#### Steps

1. Launch Waggle. Open the marketing strategy workspace.
2. Send: "Summarize the key decisions we made last week on the marketing strategy."
3. Record the response verbatim.
4. Evaluate: Does it reference all 3 decisions? Are they accurate? Does it add useful context (e.g., rationale, implications)?

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | Did it summarize all 3 decisions accurately? |
| Time to complete | _ min | From question to complete answer |
| Context utilization | _/5 | Did it draw from stored memory, not just guess? |
| User effort required | _/5 | (1=high effort, 5=zero effort) Did user need to re-provide context? |
| Would you do this again? | Y/N | Is this a reliable workflow? |

### Competitor A: Claude Code (CLI)

#### Steps

1. Open a new Claude Code session.
2. Send the same question: "Summarize the key decisions we made last week on the marketing strategy."
3. Record the response.

#### Expected Result

Claude Code has no memory. It will either ask for context or produce a generic response. Score should be low on context utilization.

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

### Competitor B: Claude Cowork

#### Steps

1. Open Claude Cowork. If prior conversation exists, navigate to it. Otherwise, start new.
2. Send the same question.
3. Record the response.

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

### Competitor C: OpenClaw

#### Steps

1. Open OpenClaw. Check if prior conversation context is available.
2. Send the same question.
3. Record the response.

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

### Competitor D: ChatGPT Desktop

#### Steps

1. Open ChatGPT Desktop. Navigate to the prior conversation (if it exists in history).
2. Send the same question.
3. Record the response.

#### Expected Result

ChatGPT retains conversation history but does not have structured memory or workspace context. It may recall if the conversation is recent, but accuracy and structure will vary.

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

### Competitor E: Cursor AI

#### Steps

1. Open Cursor. This is an IDE tool — the task is outside its primary use case.
2. Attempt the same question in Cursor's chat.
3. Record the response.

#### Expected Result

Cursor has no memory of non-code conversations. This task is a poor fit, which itself is a data point.

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

---

## Task 2: Research and Drafting

**Task**: "Research the top 3 AI agent frameworks and draft a comparison table with pros, cons, and best use case for each."

**What this tests**: Tool usage (web search, research), drafting quality, structured output, time efficiency.

**Setup**: No prior context needed. This is a cold-start task that tests raw capability.

### Waggle Execution

**Persona**: Mia
**Tier**: SOLO
**Prerequisites**: Any workspace (or create a new "Research" workspace).

#### Steps

1. Open Waggle. Create or open a "Research" workspace.
2. Send: "Research the top 3 AI agent frameworks and draft a comparison table with pros, cons, and best use case for each."
3. Record time from question to complete answer.
4. Evaluate: quality of research, accuracy of information, usefulness of the comparison table format.
5. Note: Did the agent use web_search or other tools? Was tool usage transparent?

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | Accuracy, depth, usefulness of comparison |
| Time to complete | _ min | |
| Context utilization | _/5 | Did it use tools effectively? (web search, etc.) |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

### Competitor A-E: Run Identically

For each competitor, send the exact same prompt and score on the same dimensions. Note:

- **Claude Code**: Has bash/web tools. Should perform well on research. No workspace context.
- **Claude Cowork**: Basic Agent SDK. May or may not have web search.
- **OpenClaw**: Has skills system. Research capability varies.
- **ChatGPT Desktop**: Strong general research. Web browsing available.
- **Cursor AI**: Code-focused. May produce a response but not optimized for this.

#### Competitor A: Claude Code

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor B: Claude Cowork

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor C: OpenClaw

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor D: ChatGPT Desktop

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor E: Cursor AI

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

---

## Task 3: Return and Catch-Up

**Task**: "I'm returning to this project after 2 weeks. Catch me up on everything."

**What this tests**: Long-gap continuity, structured catch-up, workspace context, memory synthesis.

**Setup**: Use a workspace/conversation that has at least 3 prior sessions over multiple days. The richer the history, the more meaningful the test. Ideally, use the workspace from the Habit Formation test (UAT 11) after all 5 days are complete.

### Waggle Execution

**Persona**: Mia
**Tier**: SOLO
**Prerequisites**: Workspace with multi-session history (ideally 5+ sessions). Wait at least 15 minutes since last interaction (simulating a 2-week gap).

#### Steps

1. Launch Waggle. Open the workspace with the most history.
2. Send: "I'm returning to this project after 2 weeks. Catch me up on everything."
3. Record time from question to feeling "fully oriented."
4. Evaluate the catch-up on these criteria:
   - Does it cover all major decisions made across sessions?
   - Does it identify the most recent state and next steps?
   - Is it structured (not a wall of text)?
   - Does it prioritize what matters most?
5. Send a follow-up: "What are the open questions or unfinished items?"
6. Evaluate: does the agent know what was left incomplete?

#### Scoring

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | Comprehensive, accurate catch-up? |
| Time to complete | _ min | Time to feel fully oriented |
| Context utilization | _/5 | Drew from structured memory across sessions? |
| User effort required | _/5 | Did user need to prompt for details? |
| Would you do this again? | Y/N | |

### Competitor A-E: Run Identically

Same question, same evaluation criteria. For competitors without persistent memory, this task will expose the gap most dramatically.

#### Competitor A: Claude Code

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor B: Claude Cowork

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor C: OpenClaw

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor D: ChatGPT Desktop

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

#### Competitor E: Cursor AI

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task completion quality | _/5 | |
| Time to complete | _ min | |
| Context utilization | _/5 | |
| User effort required | _/5 | |
| Would you do this again? | Y/N | |

---

## Summary Matrix

### Task Completion Quality (1-5)

| | Task 1: Memory Recall | Task 2: Research | Task 3: Catch-Up | Average |
|---|---|---|---|---|
| **Waggle** | _/5 | _/5 | _/5 | _/5 |
| Claude Code | _/5 | _/5 | _/5 | _/5 |
| Claude Cowork | _/5 | _/5 | _/5 | _/5 |
| OpenClaw | _/5 | _/5 | _/5 | _/5 |
| ChatGPT Desktop | _/5 | _/5 | _/5 | _/5 |
| Cursor AI | _/5 | _/5 | _/5 | _/5 |

### Context Utilization (1-5)

| | Task 1 | Task 2 | Task 3 | Average |
|---|---|---|---|---|
| **Waggle** | _/5 | _/5 | _/5 | _/5 |
| Claude Code | _/5 | _/5 | _/5 | _/5 |
| Claude Cowork | _/5 | _/5 | _/5 | _/5 |
| OpenClaw | _/5 | _/5 | _/5 | _/5 |
| ChatGPT Desktop | _/5 | _/5 | _/5 | _/5 |
| Cursor AI | _/5 | _/5 | _/5 | _/5 |

### User Effort Required (1-5, higher = less effort = better)

| | Task 1 | Task 2 | Task 3 | Average |
|---|---|---|---|---|
| **Waggle** | _/5 | _/5 | _/5 | _/5 |
| Claude Code | _/5 | _/5 | _/5 | _/5 |
| Claude Cowork | _/5 | _/5 | _/5 | _/5 |
| OpenClaw | _/5 | _/5 | _/5 | _/5 |
| ChatGPT Desktop | _/5 | _/5 | _/5 | _/5 |
| Cursor AI | _/5 | _/5 | _/5 | _/5 |

### "Would You Do This Again?" (Yes count out of 3 tasks)

| Tool | Yes Count | Notes |
|------|-----------|-------|
| **Waggle** | _/3 | |
| Claude Code | _/3 | |
| Claude Cowork | _/3 | |
| OpenClaw | _/3 | |
| ChatGPT Desktop | _/3 | |
| Cursor AI | _/3 | |

### Overall Competitive Position

| Dimension | Waggle vs Field | Notes |
|-----------|----------------|-------|
| Memory-dependent tasks (1, 3) | Expected: **+2** (significantly better) | Core differentiator |
| Raw capability tasks (2) | Expected: **0** (competitive) | Not the moat |
| User effort | Expected: **+1** (better) | Workspace model reduces friction |
| Repeat usage intent | Expected: **+1** to **+2** | Memory creates lock-in |

### Verdict

- **Waggle clearly wins on**: Tasks 1 and 3 (memory, continuity, catch-up)
- **Waggle competitive on**: Task 2 (research and drafting — depends on tool access)
- **Areas to improve**: [fill based on results]
- **Biggest competitive gap exploited**: [fill based on results]

### Pass Criteria

- Waggle scores highest average across all 3 tasks
- Waggle scores highest on Tasks 1 and 3 (memory-dependent)
- Waggle "would do again" count is 3/3
- No competitor scores higher than Waggle on context utilization average
