# Core Loop Tests

The daily-use loop is the single most important test in this entire suite. If this loop breaks, nothing else matters.

> Open workspace → instant context → real work help → memory-first response → visible progress → return later without losing thread

These 6 scenarios validate every link in that chain.

---

### Scenario 2.1: Cold Start → First Message

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Waggle installed, at least one workspace with prior session history (2+ sessions, memories saved). App closed.

#### Context
Mia opens Waggle on Monday morning to resume work on a client strategy project. She hasn't touched this workspace since Friday. She expects to see her workspace, send a message, and get a response that proves the agent remembers her project — not a generic "How can I help you today?"

#### Steps
1. Launch Waggle desktop app. Expect: app opens within 5 seconds, sidebar shows workspace list.
2. Click on the "Client Strategy — Acme Corp" workspace. Expect: workspace loads, Workspace Home shows last session summary, recent memories, and "Welcome back" block.
3. Type: "Where did we leave off on the competitive analysis?" and send. Expect: agent responds within 10 seconds.
4. Read the agent's response. Expect: response references specific past work — competitor names, findings, decisions made — not a generic template.
5. Verify the status bar shows model name and cost counter.

#### Functional Checkpoints
- [ ] App launches and renders sidebar with workspaces in under 5 seconds
- [ ] Workspace Home displays last active timestamp, recent memories, session summary
- [ ] Agent response arrives within 15 seconds
- [ ] Agent response references at least 2 specific details from prior sessions (names, decisions, findings)
- [ ] Response does NOT start with a generic greeting like "Hello! How can I help?"
- [ ] Status bar shows model name and cost tracking
- [ ] Session JSONL file is created for this new session

#### Emotional Checkpoints
- [ ] Orientation: Mia immediately knows which workspace she's in, when she last worked, and what the project state is
- [ ] Relief: She doesn't have to re-explain the project. The agent already knows.
- [ ] Continuity: The response proves the agent remembers — it feels like picking up a conversation with a colleague, not starting fresh with a stranger
- [ ] Momentum: Within 60 seconds of opening the app, Mia is doing real work

#### Features Exercised
- Workspace loading and selection
- Workspace Home (summary, last active, welcome back)
- Memory retrieval (workspace-scoped)
- Agent context injection from memory
- Session creation
- Status bar (model + cost)

#### Competitive Benchmark
- **Claude Code**: No workspace model, no memory. Every session starts from scratch. User must re-explain context manually. Waggle expected: **+2**
- **ChatGPT Desktop**: Has conversation history but no structured workspace memory. No automatic context injection. Waggle expected: **+2**
- **Cursor AI**: Codebase-aware but no cross-session memory for non-code work. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4 (this IS the core value prop)
- Emotional: Orientation >= 4, Relief >= 4, Continuity >= 4, Momentum >= 3

---

### Scenario 2.2: Return After Absence

**Persona**: Luka (Project Manager)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Workspace with sessions from 3+ days ago. Multiple decisions, open items, and discussion threads in memory. App closed for at least 3 days.

#### Context
Luka returns to his "Q2 Launch" workspace after a long weekend. He has three projects and can't remember exactly where Q2 Launch stood. He needs the agent to catch him up — decisions made, items still open, anything that went stale.

#### Steps
1. Launch Waggle, select "Q2 Launch" workspace. Expect: Workspace Home shows it was last active 3 days ago.
2. Observe the Workspace Home content. Expect: "Welcome back" block with context about last session, suggested restart prompts.
3. Type "/catchup" or ask "Catch me up on this project." Expect: agent produces a structured summary.
4. Read the catch-up response. Expect: organized by decisions made, open items, stale threads, and suggested next steps.
5. Ask a follow-up: "What's the most urgent open item?" Expect: agent identifies and explains it with context.

#### Functional Checkpoints
- [ ] Workspace Home accurately shows last active date (3+ days ago)
- [ ] /catchup command (or natural language equivalent) produces a response
- [ ] Catch-up response includes at least 3 categories: decisions, open items, next steps
- [ ] Catch-up references specific details from past sessions, not generic placeholders
- [ ] Follow-up question is answered with relevant context from memory
- [ ] No memory cross-contamination from other workspaces

#### Emotional Checkpoints
- [ ] Orientation: Luka knows exactly where the project stands within 60 seconds
- [ ] Relief: He doesn't have to dig through notes, Slack, or email to reconstruct context
- [ ] Momentum: The catch-up gives him a clear next action — he can start working immediately
- [ ] Seriousness: The summary is structured and professional, not chatty or vague
- [ ] Continuity: It feels like the agent was paying attention all along, not just regurgitating logs

#### Features Exercised
- Workspace Home (welcome back, last active, suggested prompts)
- /catchup command or context preloading
- Memory retrieval (multi-session)
- Session outcome extraction (decisions, open items)
- Context-aware follow-up responses

#### Competitive Benchmark
- **Claude Code**: No catch-up capability. User must manually reconstruct context from files. Waggle expected: **+2**
- **ChatGPT Desktop**: Can scroll old conversations but no structured catch-up. Waggle expected: **+2**
- **Notion AI**: Can summarize a doc but doesn't track decisions across sessions. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Orientation >= 4, Momentum >= 4, Continuity >= 4, Seriousness >= 3

---

### Scenario 2.3: Multi-Workspace Switching

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: SOLO
**Duration**: 8 minutes
**Prerequisites**: 3 workspaces with distinct content and memories. Each workspace has at least 2 prior sessions with different topics.

#### Context
Mia juggles client projects. She needs to switch from "Acme Corp Strategy" to "Beta Inc Rebrand" to "Personal Research" — quickly, without losing her place, and without the agent confusing one client's data with another's.

#### Steps
1. Open "Acme Corp Strategy" workspace. Ask: "What's our main competitor?" Expect: answer references Acme Corp's competitive landscape.
2. Switch to "Beta Inc Rebrand" workspace via sidebar. Expect: workspace loads, Workspace Home shows Beta Inc context.
3. Ask: "What's our main competitor?" Expect: answer references Beta Inc's competitive landscape — completely different from Acme Corp's.
4. Switch to "Personal Research" workspace. Ask: "What am I researching?" Expect: answer about personal research topics, no client data.
5. Switch back to "Acme Corp Strategy." Ask: "Remind me what we discussed about pricing." Expect: Acme-specific pricing discussion, no Beta Inc bleed-through.
6. Verify each workspace switch takes less than 3 seconds.

#### Functional Checkpoints
- [ ] Each workspace loads with its own Workspace Home content
- [ ] "What's our main competitor?" returns different, correct answers in each workspace
- [ ] Personal Research workspace contains zero client-specific information
- [ ] Returning to Acme Corp workspace shows correct Acme-specific context
- [ ] Workspace switching completes in under 3 seconds
- [ ] No memory cross-contamination detected across any switch
- [ ] Sidebar correctly highlights the active workspace

#### Emotional Checkpoints
- [ ] Orientation: Mia always knows which workspace she's in — visual cues (name, hue color) are clear
- [ ] Trust: She trusts that client A's data never appears in client B's workspace
- [ ] Controlled Power: Switching is instant and effortless — she's in control of her context
- [ ] Relief: Each workspace is its own world — no mental overhead managing separation

#### Features Exercised
- Workspace selection and switching
- Workspace-scoped memory isolation
- Workspace hue colors in sidebar
- Memory context injection (per workspace)
- Workspace Home rendering (per workspace)

#### Competitive Benchmark
- **Claude Code**: Single context, no workspace model. Switching projects means manual context management. Waggle expected: **+2**
- **ChatGPT Desktop**: Separate conversations but no workspace-scoped memory or isolation guarantees. Waggle expected: **+2**
- **Notion AI**: Separate pages but AI doesn't scope its knowledge per workspace. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass (memory isolation is a hard requirement — any cross-contamination is an automatic fail)
- Business: score >= 4
- Emotional: Trust >= 5, Orientation >= 4, Controlled Power >= 4

---

### Scenario 2.4: Research → Draft → Decision Workflow

**Persona**: Ana (Product Manager)
**Tier**: SOLO
**Duration**: 20 minutes
**Prerequisites**: Workspace with some prior context about a product feature. Agent has web search tool available.

#### Context
Ana needs to decide whether to add a "dark mode" feature to her product. She wants to research user demand, draft a one-page memo summarizing findings, make a decision, and have the agent remember everything for future reference. This is the full knowledge worker cycle: research → synthesize → decide → remember.

#### Steps
1. Open workspace. Ask: "I need to decide whether to build dark mode for our app. Can you research the demand and best practices?"
2. Expect: agent uses web_search or similar tools to gather information. Tool usage should be visible in the UI (tool cards).
3. Review the research output. Expect: structured findings with sources, not hallucinated claims.
4. Ask: "Draft a one-page memo summarizing the case for and against dark mode, with your recommendation."
5. Expect: agent produces a well-structured memo that references the research findings.
6. Respond: "Good analysis. Let's go ahead with dark mode. Target Q3. Mark this as decided."
7. Expect: agent acknowledges the decision and stores it in memory.
8. Close the session. Reopen the workspace later. Ask: "Have we made any decisions about dark mode?"
9. Expect: agent recalls the decision, the reasoning, and the Q3 timeline.

#### Functional Checkpoints
- [ ] Agent uses at least one tool (web_search, read_file, or similar) during research
- [ ] Tool usage is visible in the UI as tool cards
- [ ] Research output includes structured findings (not a wall of text)
- [ ] Memo draft is well-structured with for/against sections and recommendation
- [ ] Agent acknowledges the decision and confirms memory storage
- [ ] After session restart, agent recalls the decision with specifics (dark mode, Q3, reasoning)
- [ ] Memory browser shows the decision as a stored memory frame

#### Emotional Checkpoints
- [ ] Alignment: The workflow matches how Ana naturally thinks — research, then synthesize, then decide
- [ ] Trust: Research cites sources or uses tools visibly — Ana can verify claims
- [ ] Seriousness: The memo reads like a real business document, not a chatbot response
- [ ] Continuity: Coming back later, the decision is there — nothing lost
- [ ] Controlled Power: Ana made the decision, the agent supported it — not the other way around

#### Features Exercised
- Web search tool
- Tool transparency (tool cards in UI)
- Document drafting from context
- Decision capture in memory
- Memory persistence across sessions
- Session restart with context recall

#### Competitive Benchmark
- **Claude Code**: Can research and draft but forgets everything next session. Waggle expected: **+2**
- **ChatGPT Desktop**: Can research and draft but memory is unreliable and not workspace-scoped. Waggle expected: **+1**
- **Notion AI**: Can draft but can't do multi-step research or remember decisions automatically. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4 (this is a kill-list use case: "draft from accumulated context" + "decision compression")
- Emotional: Trust >= 4, Seriousness >= 4, Continuity >= 4, Alignment >= 4

---

### Scenario 2.5: Session Continuity

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 20 minutes (15 min work + 5 min verification)
**Prerequisites**: Workspace with prior context. Agent functional.

#### Context
Marko is in the middle of designing a database schema with the agent. He works for 15 minutes, iterating on table definitions. Then he has to close the app for a meeting. When he returns, he expects to pick up exactly where he left off — the agent should know what tables they designed, what trade-offs they discussed, and what's still unresolved.

#### Steps
1. Open workspace. Begin a conversation: "Let's design the schema for the notification system. We need to support email, push, and in-app channels."
2. Work through the design iteratively for 10-15 minutes. Make decisions about tables, fields, relationships. Discuss trade-offs.
3. Mid-conversation, note something specific: "Let's use a polymorphic channel_config JSON column — we discussed this."
4. Close the app completely (not just minimize — close the process).
5. Reopen Waggle. Navigate to the same workspace.
6. Ask: "Where were we on the notification schema?" Expect: agent references the specific tables, the polymorphic channel_config decision, and any unresolved items.
7. Ask: "What trade-offs did we discuss?" Expect: agent recalls specific trade-offs from the session.

#### Functional Checkpoints
- [ ] Session JSONL file exists in ~/.waggle/workspaces/{id}/sessions/ after working
- [ ] App closes cleanly without data loss warnings
- [ ] On reopen, workspace loads with prior session visible
- [ ] Agent references at least 3 specific details from the closed session (table names, design decisions, trade-offs)
- [ ] Agent correctly recalls the polymorphic channel_config decision
- [ ] No "I don't have context about our previous conversation" responses

#### Emotional Checkpoints
- [ ] Momentum: Marko picks up exactly where he left off — no lost time
- [ ] Continuity: The agent remembers the specifics — it feels like the same ongoing collaboration
- [ ] Trust: Marko trusts that closing the app doesn't mean losing work
- [ ] Controlled Power: He can close and reopen freely without anxiety about context loss

#### Features Exercised
- Session JSONL persistence
- Session loading on workspace open
- Context reconstruction from session history
- Memory extraction from session content
- App close/reopen cycle

#### Competitive Benchmark
- **Claude Code**: No session persistence. Closing terminal = complete context loss. Waggle expected: **+2**
- **ChatGPT Desktop**: Conversation persists but no structured context reconstruction. Waggle expected: **+1**
- **Cursor AI**: Project context persists but not conversational decisions. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Momentum >= 4, Continuity >= 5, Trust >= 4

---

### Scenario 2.6: Cost-Aware Usage

**Persona**: Elena (Data Analyst)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Workspace with agent functional. Some exchanges already completed in session.

#### Context
Elena is mindful of costs. She uses AI tools daily and needs to track spending. She wants to see how much her session is costing as she works, without having to dig into settings or external dashboards.

#### Steps
1. Open workspace. Send a message: "Summarize the key metrics from our Q1 report."
2. After agent responds, check the status bar at the bottom of the screen. Expect: cost figure visible (e.g., "$0.03") and updating.
3. Send another message: "Break down revenue by region." Expect: cost figure increases.
4. Send a longer, more complex request: "Create a detailed comparison of Q1 vs Q4 performance across all 5 business units, including trend analysis." Expect: cost increases more noticeably for a longer response.
5. Verify the cost display is always visible without scrolling or navigating away.
6. Check that the model name is displayed alongside the cost.

#### Functional Checkpoints
- [ ] Status bar is visible at the bottom of the screen during conversation
- [ ] Cost figure is displayed and updates after each exchange
- [ ] Cost increases proportionally with response length/complexity
- [ ] Model name is displayed in the status bar
- [ ] Cost display persists across messages without manual refresh
- [ ] Cost figure uses a clear format (e.g., "$0.03", not "0.03 USD" or raw token counts)

#### Emotional Checkpoints
- [ ] Controlled Power: Elena knows exactly what she's spending — no surprises
- [ ] Trust: The cost tracking is transparent and always visible
- [ ] Seriousness: The tool respects that cost matters — it doesn't hide or bury this information

#### Features Exercised
- Status bar cost display
- Per-session cost tracking
- Model name display
- Real-time cost updates

#### Competitive Benchmark
- **Claude Code**: Shows token usage but not cost in dollars. Waggle expected: **+1**
- **ChatGPT Desktop**: No per-session cost visibility. Waggle expected: **+1**
- **Cursor AI**: Shows token usage in some views. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Controlled Power >= 4, Trust >= 3
