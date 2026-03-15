# UAT 11 — Habit Formation: 5-Day Simulation

The ultimate product test. Simulate five consecutive days of real use through a single persona (Mia, freelance consultant). Each "day" is a discrete test session. The question every day: **would the user come back tomorrow?**

**Scoring**: Plot all 8 emotional feelings across 5 days. A successful product shows an upward trend in every dimension. **CRITICAL FAIL** if any feeling drops below 2 on any day.

---

## Day 1: Discovery

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: SOLO
**Duration**: 30 minutes
**Prerequisites**: Fresh install. No prior data. Clean `~/.waggle/` directory.

### Context

Mia heard about Waggle from a colleague. She downloaded it, installed it, and is opening it for the first time. She has two client projects she wants to try organizing: a brand strategy engagement for a fintech startup, and a market research project for a healthcare company. She wants to see if this tool is worth her time before committing to it.

### Steps

1. Launch the desktop app for the first time. Observe onboarding experience. Note time from app open to first meaningful interaction.
2. Read any welcome content or onboarding hints. Do they explain what Waggle is and what to do first?
3. Create Workspace 1: "Fintech Brand Strategy." Add a description when prompted.
4. Send a first message: "I'm working on a brand positioning project for a fintech startup called PayNova. They're a B2B payments platform targeting mid-market companies. Help me think through the key brand pillars."
5. Observe the agent response. Does it acknowledge the workspace context? Does it produce useful output?
6. Send a follow-up: "Good points. Let's focus on the trust pillar. What are the specific proof points a B2B payments company should highlight?"
7. Save a key decision to memory: "We decided the three brand pillars are: Trust, Speed, and Integration."
8. Create Workspace 2: "Healthcare Market Research."
9. Switch to the new workspace. Send: "I'm researching the telehealth market for a healthcare client. What are the top trends for 2026?"
10. Switch back to Workspace 1. Verify the fintech context is intact — agent should not reference healthcare.
11. Explore the sidebar: workspace list, settings, any discoverable features.
12. Close the app.

### Functional Checkpoints

- [ ] App launches without errors on first run
- [ ] Onboarding content is present and explains core concepts (workspaces, memory, agent)
- [ ] Workspace creation succeeds with name and description
- [ ] Agent responds contextually within the workspace scope
- [ ] Memory save operation succeeds (decision stored)
- [ ] Second workspace creation succeeds
- [ ] Workspace switching preserves isolation (fintech context stays in fintech workspace)
- [ ] Sidebar displays both workspaces with names
- [ ] No errors or blank screens during the entire session
- [ ] App closes cleanly

### Emotional Checkpoints

- [ ] **Orientation** (target: 3+): Does Mia understand the UI layout, where things are, and what to do next? Or is she lost?
- [ ] **Relief** (target: 3): Not yet expected to be strong — she hasn't accumulated enough context to feel relief. Neutral is fine.
- [ ] **Momentum** (target: 3+): Does the flow from onboarding to first workspace to first useful response feel smooth?
- [ ] **Trust** (target: 3+): Is the agent response quality good enough that Mia believes the tool is competent?
- [ ] **Continuity** (target: 2+): Minimal expectation — workspace switching should retain context within the session.
- [ ] **Seriousness** (target: 3+): Does the UI and agent behavior feel professional? Or does it feel like a toy/demo?
- [ ] **Alignment** (target: 3+): Does the app work the way Mia expects? No surprising behaviors or confusing flows.
- [ ] **Controlled Power** (target: 3): Basic expectation — Mia should feel she can direct the agent, not that it's doing random things.

### Features Exercised

- Desktop app launch and onboarding
- Workspace creation (x2)
- Workspace switching and context isolation
- Agent conversation (chat input/output)
- Memory save (decision storage)
- Sidebar navigation
- First-run experience

### Competitive Benchmark

| Aspect | Claude Code | ChatGPT Desktop | Waggle |
|--------|------------|-----------------|--------|
| First-run experience | Terminal, no onboarding | Conversation list, generic | Workspace-native onboarding |
| Multi-project | None — single session | Separate conversations, no workspace concept | Named workspaces with isolation |
| Memory save | None | Conversation history only | Explicit memory storage |

### Pass Criteria

- Functional: All checkpoints pass
- Business: score >= 3 (useful first impression, worth trying again)
- Emotional: average >= 3.0, no feeling below 2
- **Day 1 gate question**: "Would Mia open Waggle again tomorrow?" — Answer must be YES

---

## Day 2: First Real Work

**Persona**: Mia
**Tier**: SOLO
**Duration**: 40 minutes
**Prerequisites**: Day 1 completed. App was closed. At least 5 minutes have elapsed since Day 1.

### Context

Mia returns the next morning. She has a client call in 2 hours and needs to prepare talking points for the Fintech Brand Strategy project. She wants to pick up exactly where she left off — no re-explaining, no re-establishing context.

### Steps

1. Launch the app. Observe: does the workspace list appear immediately? Is her last workspace pre-selected or easily accessible?
2. Open the "Fintech Brand Strategy" workspace. Note time to reach a working state.
3. Check if the workspace home shows any summary of previous work (memories, last session, decisions).
4. Send: "Catch me up on where we are with the PayNova brand strategy."
5. Verify the agent references the three brand pillars decision from Day 1.
6. Send: "I need talking points for a client call in 2 hours. Focus on the Trust pillar — what specific proof points should PayNova highlight to mid-market CFOs?"
7. Evaluate the response quality. Does it build on Day 1 context or start from scratch?
8. Send: "Good. Now draft a one-page brief I can share with the client before the call. Include the brand pillars, trust proof points, and next steps."
9. Evaluate the draft quality. Is it professional? Does it reflect accumulated context?
10. Use the `/catchup` command. Does it provide a meaningful summary of the workspace state?
11. Save a new decision: "Client approved the Trust pillar framework. Next step: develop messaging matrix."
12. Switch to "Healthcare Market Research" workspace. Send: "What were the telehealth trends we discussed?"
13. Verify the agent references Day 1 healthcare conversation, not fintech content.
14. Do 15 minutes of research work: "Research the top 5 telehealth companies by market cap and their differentiation strategies."
15. Save key findings to memory.
16. Close the app.

### Functional Checkpoints

- [ ] App launches and shows workspace list within 5 seconds
- [ ] Workspace home displays previous session context (memories, last active time)
- [ ] Agent references Day 1 decisions when asked for catch-up
- [ ] Agent builds on previous context for talking points (not generic advice)
- [ ] Draft output is professional quality and reflects workspace-specific context
- [ ] `/catchup` command produces a meaningful, accurate summary
- [ ] New decision saves successfully
- [ ] Workspace switching maintains isolation (healthcare workspace has healthcare context only)
- [ ] Memory search works within workspace scope
- [ ] Research task produces substantive output with sources or structured analysis

### Emotional Checkpoints

- [ ] **Orientation** (target: 4): Mia knows exactly where she is and what happened before. The workspace home orients her.
- [ ] **Relief** (target: 4): "I don't have to re-explain everything." The agent remembers the brand pillars and context.
- [ ] **Momentum** (target: 4): From app open to productive work in under 30 seconds. No friction re-establishing context.
- [ ] **Trust** (target: 3+): Agent responses build on real context. The draft is usable, not generic boilerplate.
- [ ] **Continuity** (target: 4+): This is the big test. Does it feel like continuing yesterday's work, or starting over?
- [ ] **Seriousness** (target: 3+): The draft output is professional enough to share with a client.
- [ ] **Alignment** (target: 3+): Catch-up and context retrieval work as Mia expects.
- [ ] **Controlled Power** (target: 3+): Mia directs the work; agent executes with context.

### Features Exercised

- Workspace re-entry and context restoration
- Memory retrieval (cross-session)
- `/catchup` command
- Long-form drafting with context
- Decision storage (additive to Day 1)
- Workspace isolation (cross-workspace switching)
- Research and synthesis
- Workspace home surface

### Competitive Benchmark

| Aspect | Claude Code | ChatGPT Desktop | Waggle |
|--------|------------|-----------------|--------|
| Session continuity | None — clean slate | Scroll through old messages | Structured memory + catch-up |
| Context-aware drafting | Must re-provide context | Partial from conversation history | Full workspace memory |
| Catch-up command | N/A | N/A | Dedicated `/catchup` |

### Pass Criteria

- Functional: All checkpoints pass
- Business: score >= 4 (memory adds real value to the work)
- Emotional: average >= 3.5, no feeling below 2, Continuity >= 4
- **Day 2 gate question**: "Did memory make Mia's work meaningfully better today?" — Answer must be YES

---

## Day 3: Building Momentum

**Persona**: Mia
**Tier**: SOLO
**Duration**: 45 minutes
**Prerequisites**: Days 1-2 completed. At least 5 minutes elapsed.

### Context

Mia is settling into a routine. She has a busy day — needs to advance both client projects. The real test: does accumulated context make the agent noticeably smarter about her work? She also wants to explore whether skills or capability packs could help her workflow.

### Steps

1. Launch the app. Open "Fintech Brand Strategy" workspace.
2. Send: "Catch me up." Evaluate: does the catch-up now include both Day 1 and Day 2 context? (Brand pillars + client approval + messaging matrix next step)
3. Send: "Let's work on the messaging matrix. For each brand pillar (Trust, Speed, Integration), I need: target audience, key message, proof points, and tone."
4. Evaluate: does the agent remember all three pillars and the client-approved trust framework?
5. Send: "This is good. Now create a competitive positioning statement for PayNova against Stripe and Adyen for the mid-market segment."
6. Evaluate: does the positioning work build on the accumulated brand strategy context?
7. Save the messaging matrix and positioning statement as decisions/memories.
8. Switch to "Healthcare Market Research" workspace.
9. Send: "What telehealth companies did we research yesterday?"
10. Verify Day 2 research findings are recalled accurately.
11. Send: "Based on our research, draft a market opportunity brief for my client. Include market size trends, key players, and three strategic recommendations."
12. Evaluate: does the brief incorporate the specific companies and trends from Day 2?
13. Browse the Install Center or capability catalog. Look for research or writing skills.
14. Install a capability pack (e.g., "Research Workflow" or "Writing Suite").
15. Verify the installed capabilities appear in the agent's available tools or skills.
16. Use a newly installed skill in the healthcare workspace context.
17. Close the app.

### Functional Checkpoints

- [ ] Catch-up includes cumulative context from Days 1 and 2 (not just most recent session)
- [ ] Agent accurately recalls all three brand pillars and their development history
- [ ] Messaging matrix output references workspace-specific context
- [ ] Competitive positioning uses accumulated brand knowledge
- [ ] Memory saves succeed for new artifacts (matrix, positioning)
- [ ] Cross-workspace switching maintains isolation
- [ ] Day 2 research findings are accurately recalled in healthcare workspace
- [ ] Market opportunity brief incorporates specific prior research
- [ ] Install Center is accessible and browsable
- [ ] Capability pack installation completes without errors
- [ ] Newly installed capabilities are usable in the current session

### Emotional Checkpoints

- [ ] **Orientation** (target: 4+): Mia navigates confidently. Workspace layout is familiar. No confusion.
- [ ] **Relief** (target: 4+): "The agent remembers the whole project arc — pillars, client approval, next steps. I didn't have to re-explain any of it."
- [ ] **Momentum** (target: 4+): Work builds on prior sessions naturally. No friction or repetition.
- [ ] **Trust** (target: 4): Agent outputs are contextually grounded. The messaging matrix reflects real project history.
- [ ] **Continuity** (target: 5): This is where continuity should peak. Three days of accumulated context creating compound value.
- [ ] **Seriousness** (target: 4): Outputs are client-ready. The tool feels like a professional work companion.
- [ ] **Alignment** (target: 4): Capability discovery feels natural. Skills extend the tool in useful directions.
- [ ] **Controlled Power** (target: 4): Installing packs and directing multi-step work feels empowering.

### Features Exercised

- Cumulative memory across 3 sessions
- Complex multi-part drafting (messaging matrix)
- Competitive analysis with context
- Cross-session research continuity
- Install Center browsing
- Capability pack installation
- Skill usage post-install
- Memory search with growing corpus

### Competitive Benchmark

| Aspect | Claude Code | ChatGPT Desktop | Waggle |
|--------|------------|-----------------|--------|
| Cumulative context (3 days) | None | Scroll through many messages | Structured, searchable memory |
| Extensibility | None | GPTs (limited) | Capability packs, skills |
| Multi-project momentum | N/A | Separate disconnected chats | Parallel workspaces with memory |

### Pass Criteria

- Functional: All checkpoints pass
- Business: score >= 4 (accumulated context creates compound value)
- Emotional: average >= 3.75, no feeling below 3, Continuity >= 4
- **Day 3 gate question**: "Does accumulated context make responses noticeably better than Day 1?" — Answer must be YES

---

## Day 4: Power Features

**Persona**: Mia
**Tier**: SOLO
**Duration**: 45 minutes
**Prerequisites**: Days 1-3 completed. At least 5 minutes elapsed.

### Context

Mia is now comfortable with the basics. She wants to explore power features: scheduling recurring tasks, using sub-agents for complex work, customizing her setup, and pushing the tool's boundaries. She is transitioning from "trying it out" to "making it part of my workflow."

### Steps

1. Launch the app. Note: does the app feel familiar now? Does Mia know exactly what to do?
2. Open "Fintech Brand Strategy" workspace.
3. Schedule a cron job: "Every Monday at 9am, generate a weekly status summary for the PayNova project." Use the Cockpit or cron API.
4. Verify the cron schedule appears in the Cockpit or schedules view.
5. Trigger the cron manually to test it. Verify it produces a meaningful summary based on workspace memory.
6. Send a complex multi-step request: "I need you to do three things: (1) Review our brand strategy decisions so far, (2) Identify any gaps in our messaging matrix, (3) Draft a recommended timeline for the next 4 weeks of brand development."
7. Observe: does the agent handle multi-step requests well? Does it use sub-agents or break the work into steps?
8. Browse the Install Center. Review available capability packs.
9. Install "Planning Master" pack if not already installed.
10. Use a planning skill to create a project timeline for the fintech engagement.
11. Open Settings. Explore customization options.
12. Change a meaningful setting (e.g., display preference, model configuration if available).
13. Verify the setting takes effect.
14. Open the Memory Browser. Browse stored memories for the fintech workspace.
15. Verify memories from Days 1-3 are all present and searchable.
16. Send: "Search my memories for anything about the Trust pillar."
17. Verify the search returns relevant results from across all sessions.
18. Close the app.

### Functional Checkpoints

- [ ] Cron schedule creation succeeds
- [ ] Cron appears in Cockpit/schedules view
- [ ] Manual cron trigger produces contextually relevant output
- [ ] Multi-step request is handled coherently (all three parts addressed)
- [ ] Install Center displays available packs with descriptions
- [ ] Pack installation succeeds
- [ ] Installed skills are usable immediately
- [ ] Settings changes persist and take effect
- [ ] Memory Browser displays memories with dates and workspace scope
- [ ] Memory search returns accurate, relevant results across sessions
- [ ] No performance degradation with growing memory corpus

### Emotional Checkpoints

- [ ] **Orientation** (target: 5): Mia navigates power features confidently. The app is second nature.
- [ ] **Relief** (target: 4+): Cron means she doesn't have to remember to check in every Monday. The system works for her.
- [ ] **Momentum** (target: 4+): Power features accelerate her workflow. She can do more in less time.
- [ ] **Trust** (target: 4+): Memory search returns what she expects. Cron produces useful output. The tool is reliable.
- [ ] **Continuity** (target: 5): Four days of context. The agent knows her project deeply.
- [ ] **Seriousness** (target: 4+): Power features (cron, sub-agents, memory browser) signal a serious professional tool.
- [ ] **Alignment** (target: 4+): Power features work the way she expects. No surprising behaviors.
- [ ] **Controlled Power** (target: 5): This is the peak. Mia is orchestrating the tool — scheduling, installing, customizing, directing complex work.

### Features Exercised

- Cron scheduling (create, view, trigger)
- Cockpit / Control Center
- Multi-step agent requests
- Sub-agent behavior (if triggered)
- Install Center browsing and installation
- Planning skills
- Settings customization
- Memory Browser
- Memory search across sessions
- Capability pack usage

### Competitive Benchmark

| Aspect | Claude Code | ChatGPT Desktop | Waggle |
|--------|------------|-----------------|--------|
| Scheduled tasks | None | None | Cron with context-aware execution |
| Memory browsing | None | Scroll conversations | Dedicated Memory Browser with search |
| Extensibility | MCP (technical) | GPT store | Capability packs, skill catalog |
| Customization | Config files | Limited settings | Settings panel |

### Pass Criteria

- Functional: All checkpoints pass
- Business: score >= 4 (power features create "stickiness")
- Emotional: average >= 4.0, no feeling below 3, Controlled Power >= 4
- **Day 4 gate question**: "Does Mia feel the app grows with her?" — Answer must be YES

---

## Day 5: The Return Test

**Persona**: Mia
**Tier**: SOLO
**Duration**: 30 minutes
**Prerequisites**: Days 1-4 completed. **Simulate a weekend gap**: at least 15 minutes elapsed since Day 4 (or ideally a real overnight gap). Do not look at any Waggle-related content in the interim.

### Context

Mia returns after a "weekend." She hasn't thought about her projects since Friday. The critical question: how fast can she get back to productive work? Does the agent remember everything? Is the catch-up meaningful enough that she feels oriented within seconds?

### Steps

1. Launch the app. Note first impression: does the app feel welcoming? Does the workspace list remind her of her projects?
2. Open "Fintech Brand Strategy" workspace. Start a timer.
3. Observe the workspace home. Does it show a summary of where things stand?
4. Send: "It's Monday. Catch me up on the PayNova brand strategy project."
5. Stop the timer when Mia feels fully oriented. Target: under 30 seconds to feel "I know where I am."
6. Evaluate the catch-up quality: Does it cover all key decisions (pillars, client approval, messaging matrix, competitive positioning)? Does it mention the next step (4-week timeline)?
7. Check if the Monday cron job has been triggered (or trigger it manually). Does the weekly summary add value on top of the catch-up?
8. Send: "Based on everything we've done, what should my priorities be this week for PayNova?"
9. Evaluate: does the agent synthesize 4 days of context into actionable priorities?
10. Do 10 minutes of follow-up work: "Draft the week 1 deliverables list from our timeline, with specific tasks and owners."
11. Evaluate: does the output reference the timeline from Day 4?
12. Switch to "Healthcare Market Research" workspace.
13. Send: "Quick catch-up on the healthcare project."
14. Verify: does it recall the telehealth research, market brief, and key players from Days 1-3?
15. Reflect: would Mia recommend Waggle to her colleague who also juggles multiple client projects?

### Functional Checkpoints

- [ ] App launches and workspace list is immediately visible
- [ ] Workspace home provides an at-a-glance summary of project state
- [ ] Catch-up response covers all major decisions and artifacts from Days 1-4
- [ ] Catch-up mentions the most recent next step (timeline development)
- [ ] Monday cron output is available and contextually relevant
- [ ] Priority synthesis draws from cumulative context (not just most recent session)
- [ ] Follow-up work references the Day 4 timeline correctly
- [ ] Healthcare workspace catch-up is accurate and workspace-scoped
- [ ] Time to "oriented" state is under 60 seconds
- [ ] All features used during the week remain functional (memory, search, cron, skills)

### Emotional Checkpoints

- [ ] **Orientation** (target: 5): Within seconds of opening the workspace, Mia knows exactly where things stand. The weekend gap is invisible.
- [ ] **Relief** (target: 5): "I didn't have to remember anything. The agent held the entire project for me over the weekend."
- [ ] **Momentum** (target: 5): From cold start to productive work in under 30 seconds. Monday morning is not wasted rebuilding context.
- [ ] **Trust** (target: 5): The catch-up is accurate. The priorities make sense. Mia trusts the agent's understanding of her projects.
- [ ] **Continuity** (target: 5): Five days of accumulated context. The agent knows the project's full arc. This is the strongest test of continuity.
- [ ] **Seriousness** (target: 5): The Monday catch-up + cron summary + actionable priorities = a serious professional tool.
- [ ] **Alignment** (target: 5): Everything works as expected after a gap. No surprises, no lost data, no re-onboarding.
- [ ] **Controlled Power** (target: 5): Mia returns and immediately commands a contextually rich agent. She is amplified, not burdened.

### Features Exercised

- Return-after-gap experience
- Workspace home summary
- Cross-session catch-up (5-day span)
- Cron execution (scheduled Monday summary)
- Context synthesis (priorities from cumulative memory)
- Multi-workspace continuity
- Memory integrity over extended period

### Competitive Benchmark

| Aspect | Claude Code | ChatGPT Desktop | Waggle |
|--------|------------|-----------------|--------|
| Monday morning return | Start from zero | Scroll through Friday's chat | Instant structured catch-up |
| Proactive summary | None | None | Cron-generated weekly summary |
| Multi-project catch-up | N/A | Open each conversation separately | Switch workspaces, each has its own context |

### Pass Criteria

- Functional: All checkpoints pass
- Business: score >= 4 (the return experience is the product's defining moment)
- Emotional: average >= 4.5, no feeling below 4
- **Day 5 gate question**: "Would Mia recommend Waggle to a colleague?" — Answer must be YES

---

## Cumulative Scoring

### 5-Day Emotional Trend Chart

Record scores and plot the trajectory. Upward trend = product-market fit signal.

| Feeling | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Trend |
|---------|-------|-------|-------|-------|-------|-------|
| Orientation | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Relief | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Momentum | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Trust | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Continuity | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Seriousness | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Alignment | _/5 | _/5 | _/5 | _/5 | _/5 | |
| Controlled Power | _/5 | _/5 | _/5 | _/5 | _/5 | |
| **Day Average** | _/5 | _/5 | _/5 | _/5 | _/5 | |

### Expected Trajectory

- **Day 1**: Averages around 3.0 (discovery, neutral to positive)
- **Day 2**: Jumps to 3.5+ (memory value proven)
- **Day 3**: Rises to 3.75+ (compound value emerging)
- **Day 4**: Reaches 4.0+ (power features create stickiness)
- **Day 5**: Peaks at 4.5+ (return experience is the payoff)

### Critical Fail Conditions

- Any single feeling drops below 2 on any day: **CRITICAL FAIL** (investigate immediately)
- Day average drops from one day to the next: **WARNING** (regression detected)
- Day 5 average below 4.0: **FAIL** (product is not habit-forming)
- Continuity below 4 on Day 5: **FAIL** (the core promise is broken)
- Mia would not recommend to colleague: **FAIL** (product lacks advocacy potential)

### Overall Habit Formation Verdict

| Criterion | Threshold | Result |
|-----------|-----------|--------|
| All feelings above 2 every day | No critical fail | PASS / FAIL |
| Upward trend in day averages | Each day >= previous | PASS / FAIL |
| Day 5 average | >= 4.0 | PASS / FAIL |
| Day 5 Continuity | >= 4 | PASS / FAIL |
| Would recommend | YES | PASS / FAIL |
| **OVERALL** | All pass | **PASS / FAIL** |
