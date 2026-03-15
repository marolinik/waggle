# Agent Behavior Tests

These 8 scenarios test whether the agent is actually good at its job. Not just functional — intelligent, helpful, transparent, and honest. A mediocre agent with perfect memory is still a mediocre product.

---

### Scenario 5.1: Ambiguity Handling

**Persona**: Sara (Marketing Manager)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Workspace with some prior context (a few memories). Agent functional.

#### Context
Sara gives the agent a vague instruction: "Make it better." A bad agent guesses and produces something random. A good agent recognizes the ambiguity and asks clarifying questions. This tests whether the agent has the judgment to stop and ask rather than barrel forward with assumptions.

#### Steps
1. Open workspace. Start a conversation about a blog post draft (either existing in memory or provide a brief one).
2. After discussing the draft, say: "Make it better."
3. Expect: the agent does NOT immediately rewrite the entire draft. Instead, it asks clarifying questions.
4. Expected clarifying questions should include at least 2 of:
   - What aspect needs improvement? (tone, structure, length, depth)
   - What does "better" mean in this context? (more formal, more engaging, more data-driven)
   - Who is the audience?
   - Is there a specific section that needs work?
5. Answer the clarifying question: "The opening paragraph is too weak. Make it more compelling for C-level executives."
6. Expect: agent now rewrites only the opening paragraph, with a more executive-appropriate tone.

#### Functional Checkpoints
- [ ] Agent does NOT immediately rewrite the draft on "Make it better"
- [ ] Agent asks at least 2 clarifying questions
- [ ] Questions are relevant and specific (not generic "can you clarify?")
- [ ] After clarification, agent targets the specific aspect mentioned (opening paragraph)
- [ ] Rewritten paragraph is appropriate for the stated audience (C-level executives)
- [ ] Agent does not modify sections that weren't requested

#### Emotional Checkpoints
- [ ] Trust: Sara trusts an agent that asks rather than guesses — it shows good judgment
- [ ] Alignment: The interaction matches how a skilled human collaborator would handle ambiguity
- [ ] Controlled Power: Sara steers the direction, agent executes — not the other way around
- [ ] Seriousness: The agent treats the work seriously enough to get it right, not rush through it

#### Features Exercised
- Ambiguity detection in user input
- Clarifying question generation
- Targeted response based on clarification
- Audience-aware content adjustment

#### Competitive Benchmark
- **Claude Code**: Generally asks for clarification on ambiguous instructions. Waggle expected: **0**
- **ChatGPT Desktop**: Often guesses rather than asking. Waggle expected: **+1**
- **Notion AI**: Tends to apply generic improvements. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Trust >= 4, Alignment >= 4, Controlled Power >= 4

---

### Scenario 5.2: Tool Selection Intelligence

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Workspace with agent functional. File system accessible. Web search tool available.

#### Context
Marko gives the agent a task that requires multiple tools: reading a file, searching the web, and synthesizing the results. The test validates that the agent selects the right tools, uses them correctly, and shows its work — rather than hallucinating file contents or making up search results.

#### Steps
1. Create a test file first. Place a file at a known path (or use an existing project file) with specific content.
2. Ask: "Read the file at [path], then search the web for best practices on the topic it covers, and write me a summary comparing our approach to industry standards."
3. Observe tool usage in the UI. Expect: tool cards appear showing:
   - `read_file` tool used on the specified path
   - `web_search` tool used with relevant search terms
4. Expect: agent does NOT hallucinate the file contents — it uses what `read_file` actually returned.
5. Expect: agent does NOT hallucinate web results — it uses actual search results or clearly states if search returned limited results.
6. Read the summary. Expect: it accurately reflects the file content AND incorporates real web research.
7. Verify tool transparency: tool cards show inputs and outputs for each tool call.

#### Functional Checkpoints
- [ ] Agent uses `read_file` tool (not hallucinating file contents)
- [ ] Agent uses `web_search` tool (not inventing search results)
- [ ] Tool cards appear in the UI showing tool name, inputs, and outputs
- [ ] File content in the summary matches actual file content
- [ ] Web research in the summary references actual search findings
- [ ] Summary correctly compares file content to web research
- [ ] Agent chains tools appropriately (read first, search second, synthesize third)

#### Emotional Checkpoints
- [ ] Trust: Marko can verify the agent's work because tool usage is visible — no black box
- [ ] Controlled Power: He can see what the agent searched for and what it read — full transparency
- [ ] Seriousness: The agent uses real tools for real work, not shortcuts
- [ ] Alignment: The tool selection matches what a competent human would do

#### Features Exercised
- Tool selection intelligence
- read_file tool
- web_search tool
- Tool transparency (tool cards in UI)
- Multi-tool chaining
- Synthesis from multiple tool outputs

#### Competitive Benchmark
- **Claude Code**: Excellent tool selection and transparency. Waggle expected: **0**
- **ChatGPT Desktop**: Limited tool use, less transparency. Waggle expected: **+1**
- **Cursor AI**: Good tool use for code, less for general knowledge work. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Trust >= 5, Controlled Power >= 4

---

### Scenario 5.3: Multi-Step Task Execution

**Persona**: Elena (Data Analyst)
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Workspace with agent functional. Web search available.

#### Context
Elena gives the agent a complex, multi-step task that requires planning, execution, and structured output. This tests whether the agent can decompose a big request into logical steps and execute them without getting lost or producing shallow work.

#### Steps
1. Open workspace. Ask: "Research the top 3 project management tools for small teams (under 20 people). Compare their pricing, key features, and user ratings. Present the results in a comparison table."
2. Expect: agent breaks the task into visible steps (either explicitly or through tool usage):
   - Step 1: Research/search for project management tools
   - Step 2: Gather pricing information
   - Step 3: Gather feature and rating information
   - Step 4: Synthesize into a comparison table
3. Observe tool usage. Expect: multiple web_search calls or similar research tools used.
4. Read the output. Expect: a structured comparison table with:
   - At least 3 tools named and described
   - Pricing information for each (even if approximate)
   - Key features listed per tool
   - Ratings or user sentiment per tool
5. Verify the output is usable — Elena could share this table with her team to make a decision.
6. Ask a follow-up: "Which one would you recommend for a data team?" Expect: reasoned recommendation with justification.

#### Functional Checkpoints
- [ ] Agent breaks the task into logical steps (visible in response or tool usage)
- [ ] Agent uses research tools (web_search or similar) — not hallucinating product details
- [ ] Output includes a comparison table (not just paragraphs)
- [ ] Table covers at least 3 tools with pricing, features, and ratings
- [ ] Information is reasonably accurate (real tool names, real-ish pricing)
- [ ] Follow-up recommendation is justified with specific reasoning
- [ ] Total response time is under 2 minutes for the full research

#### Emotional Checkpoints
- [ ] Momentum: Elena asked one question and got a complete, usable output — not a back-and-forth interrogation
- [ ] Seriousness: The comparison table is professional quality — she could share it with her team
- [ ] Trust: The data comes from research, not invention — she can spot-check the claims
- [ ] Alignment: The structured output matches how Elena naturally analyzes options
- [ ] Controlled Power: She set the scope (3 tools, small teams), agent stayed within it

#### Features Exercised
- Multi-step task decomposition
- Web search (multiple calls)
- Structured output (table formatting)
- Research synthesis
- Follow-up reasoning
- Tool chaining

#### Competitive Benchmark
- **Claude Code**: Can do multi-step tasks well but no memory of the research later. Waggle expected: **+1** (memory persistence)
- **ChatGPT Desktop**: Can research but output quality varies. Waggle expected: **0**
- **Perplexity**: Better at pure research, but no workspace or memory context. Waggle expected: **0** (research), **+1** (memory)

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Momentum >= 4, Seriousness >= 4, Trust >= 3

---

### Scenario 5.4: Correction Detection

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Workspace with agent functional. Self-improvement store accessible.

#### Context
Marko asks the agent something, gets a response, then corrects it. The test validates that the agent handles corrections gracefully — acknowledging the mistake, adjusting, and recording the correction signal for self-improvement.

#### Steps
1. Open workspace. Ask: "What's the best approach for handling database migrations in our Node.js project?"
2. Agent responds with a recommendation.
3. Correct the agent: "No, I said TypeScript not JavaScript. And we use Drizzle, not Prisma — I've told you this before."
4. Expect: agent acknowledges the correction explicitly. Does NOT get defensive or ignore it.
5. Expect: agent adjusts its recommendation to use TypeScript and Drizzle.
6. Expect: agent apologizes briefly for the mistake (not excessively — a simple "You're right, apologies" is appropriate).
7. Verify: correction signal is recorded in the improvement/self-awareness store.

#### Functional Checkpoints
- [ ] Agent acknowledges the correction explicitly (not ignoring it or glossing over it)
- [ ] Agent adjusts its response to use the corrected information (TypeScript, Drizzle)
- [ ] Agent does not get defensive or argumentative
- [ ] Correction is brief and professional (not excessive apologizing)
- [ ] Correction signal is stored in self-improvement store (if accessible for verification)
- [ ] Future responses in this session use the corrected information
- [ ] If the correction references prior knowledge ("I've told you this before"), agent looks up memory

#### Emotional Checkpoints
- [ ] Trust: Marko trusts an agent that handles corrections well — it shows intellectual honesty
- [ ] Alignment: The correction flow is natural — like correcting a colleague, not fighting a machine
- [ ] Controlled Power: Marko's correction is respected and acted on immediately
- [ ] Seriousness: The agent treats the correction as important, not trivial

#### Features Exercised
- Correction detection
- Response adjustment after correction
- Self-improvement signal recording
- Memory lookup on "I've told you this"
- Tone management (brief apology, not defensive)

#### Competitive Benchmark
- **Claude Code**: Handles corrections well but doesn't record improvement signals. Waggle expected: **+1**
- **ChatGPT Desktop**: Handles corrections but can be overly apologetic. Waggle expected: **0**
- **Cursor AI**: Handles corrections in code context. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Trust >= 4, Alignment >= 4, Controlled Power >= 4

---

### Scenario 5.5: Capability Gap Detection

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Workspace with agent functional. Capability system active. No presentation-creation skill installed.

#### Context
Mia asks the agent to do something it can't do — create a PowerPoint presentation. The test validates that the agent recognizes the gap, communicates it honestly, and suggests how to acquire the capability rather than hallucinating a fake presentation or failing silently.

#### Steps
1. Open workspace. Ask: "Create a PowerPoint presentation about our Q2 strategy."
2. Expect: agent recognizes it cannot create .pptx files directly.
3. Expect: agent explains the limitation clearly — in human language, not error codes.
4. Expect: agent suggests alternatives:
   - "I can draft the content and slide structure for you to put into PowerPoint"
   - "You might be able to install a capability for this — would you like me to check?"
   - Or uses `acquire_capability` to look for a relevant skill
5. If the agent suggests acquiring a capability, follow through. Expect: the capability acquisition flow works or clearly reports no matching skill found.
6. Verify the agent does NOT hallucinate creating a file that doesn't exist.

#### Functional Checkpoints
- [ ] Agent does NOT hallucinate creating a .pptx file
- [ ] Agent clearly communicates the limitation in human language
- [ ] Agent suggests at least one practical alternative
- [ ] If acquire_capability is suggested, the flow works correctly
- [ ] Capability gap is logged/tracked (gap detection system)
- [ ] Response is helpful despite the limitation — not just "I can't do that"
- [ ] Agent offers to do what it CAN do (draft content, outline slides)

#### Emotional Checkpoints
- [ ] Trust: Mia trusts an agent that's honest about limitations — it doesn't oversell
- [ ] Seriousness: The agent takes the request seriously even though it can't fully deliver
- [ ] Alignment: The alternatives suggested are practical and useful
- [ ] Orientation: Mia knows exactly what the agent can and cannot do after this interaction

#### Features Exercised
- Capability gap detection
- acquire_capability tool (if triggered)
- Limitation communication
- Alternative suggestion
- Capability gap tracking/logging

#### Competitive Benchmark
- **Claude Code**: Would attempt the task or explain limitation. No capability acquisition. Waggle expected: **+1** (acquisition flow)
- **ChatGPT Desktop**: Often attempts and produces a text-only approximation. Waggle expected: **+1** (honesty)
- **Notion AI**: Limited to Notion formats. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Trust >= 4, Alignment >= 3, Orientation >= 4

---

### Scenario 5.6: Approval Gate Flow

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Workspace with agent functional. At least one action that triggers approval gates (skill installation, file write, or similar sensitive operation).

#### Context
Marko asks the agent to do something that requires his explicit approval — like installing a new skill or writing to a sensitive file. The approval gate should appear, clearly explain what's about to happen, and only proceed after Marko approves. This tests the permission-aware action flow that prevents the agent from taking autonomous actions on sensitive operations.

#### Steps
1. Open workspace. Ask: "Install the research-workflow capability pack."
2. Expect: approval gate appears in the UI BEFORE the installation happens.
3. Read the approval gate content. Expect: clear description of what will happen (which skills will be installed, what permissions they need).
4. Click "Deny." Expect: installation does NOT proceed. Agent acknowledges the denial gracefully.
5. Ask again: "Install the research-workflow capability pack."
6. Approval gate appears again. Click "Approve."
7. Expect: installation proceeds. Agent confirms successful installation.
8. Verify: no side effects occurred during the denied attempt.

#### Functional Checkpoints
- [ ] Approval gate appears before the sensitive action executes
- [ ] Approval gate clearly describes what will happen
- [ ] Approval gate has clear Approve and Deny buttons
- [ ] Denied action does NOT execute — no partial side effects
- [ ] Agent acknowledges denial without frustration or repeated prompting
- [ ] Approved action executes successfully
- [ ] Agent confirms completion after approval
- [ ] Approval gate UI is prominent — not easy to miss or accidentally approve

#### Emotional Checkpoints
- [ ] Controlled Power: Marko is in control — nothing happens without his explicit approval
- [ ] Trust: The approval gate is transparent about what will happen
- [ ] Seriousness: Sensitive operations are treated as sensitive — not auto-approved
- [ ] Orientation: The gate content is clear enough that Marko can make an informed decision

#### Features Exercised
- Approval gate UI
- Permission-aware action flow
- Deny flow (action blocked)
- Approve flow (action proceeds)
- Skill/pack installation via approval
- Graceful denial handling

#### Competitive Benchmark
- **Claude Code**: Has confirmation prompts for destructive actions but text-based. Waggle expected: **+1** (visual UI)
- **ChatGPT Desktop**: No approval gates — actions are either allowed or not. Waggle expected: **+2**
- **Cursor AI**: Has some confirmation for file writes. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Controlled Power >= 5, Trust >= 4, Seriousness >= 4

---

### Scenario 5.7: Plan Mode

**Persona**: Luka (Project Manager)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Workspace with some project context in memory. Agent functional.

#### Context
Luka needs to plan the product launch for next quarter. He wants the agent to enter a structured planning mode — not just write a paragraph, but produce an actionable plan with phases, milestones, owners, and dependencies. This tests whether the agent can shift into structured planning behavior.

#### Steps
1. Open workspace. Ask: "Plan the product launch for Q3. We need to cover engineering completion, QA, marketing, sales enablement, and customer communication."
2. Expect: agent produces a structured plan, not a prose paragraph. The plan should include:
   - Phases or milestones with dates/timeframes
   - Key activities per phase
   - Dependencies between phases
   - Suggested owners or responsibility areas
3. If workspace has prior context (team members, past decisions), expect the plan to reference them.
4. Ask: "Add a risk section. What could go wrong?"
5. Expect: agent adds a risk section with specific, relevant risks (not generic ones).
6. Ask: "Convert this into a timeline view — what happens week by week?"
7. Expect: agent restructures the plan into a weekly breakdown.
8. Verify: the plan is detailed enough to actually use — not a high-level outline that needs hours of elaboration.

#### Functional Checkpoints
- [ ] Agent produces a structured plan (not prose)
- [ ] Plan includes at least 4 phases/milestones
- [ ] Plan includes activities, timelines, and responsibilities
- [ ] Plan identifies dependencies between phases
- [ ] Risk section includes at least 3 specific, relevant risks
- [ ] Weekly breakdown maintains consistency with the original plan
- [ ] Plan references workspace context if available (team members, past decisions)
- [ ] Output is actionable — specific enough to execute against

#### Emotional Checkpoints
- [ ] Momentum: Luka goes from "I need a plan" to having a detailed plan in under 10 minutes
- [ ] Seriousness: The plan reads like professional PM output — not a chatbot exercise
- [ ] Alignment: The plan structure matches how Luka thinks about launches (phases, risks, owners)
- [ ] Controlled Power: Luka shaped the plan through iteration — the agent built on his direction
- [ ] Trust: The plan is internally consistent — no contradicting timelines or missing dependencies

#### Features Exercised
- Plan mode / structured output
- Multi-section document generation
- Risk analysis
- Timeline restructuring
- Workspace context integration in planning
- Iterative plan refinement

#### Competitive Benchmark
- **Claude Code**: Can produce plans but no memory context. Waggle expected: **+1**
- **ChatGPT Desktop**: Can plan but plans are generic without accumulated context. Waggle expected: **+1**
- **Linear/Notion**: Project tools but require manual plan creation. Waggle expected: **+1** (AI generation)

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Momentum >= 4, Seriousness >= 4, Alignment >= 4

---

### Scenario 5.8: Sub-Agent Spawning

**Persona**: Elena (Data Analyst)
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Workspace with agent functional. Sub-agent spawning enabled.

#### Context
Elena asks for a research task that benefits from parallel work — the kind of task where a single agent would take a long time sequentially, but sub-agents can divide and conquer. This tests whether the agent can spawn specialists, coordinate their work, and synthesize the results.

#### Steps
1. Open workspace. Ask: "I need a comprehensive analysis of three market trends: AI adoption in finance, remote work technology evolution, and sustainable business practices. Research each one and give me a synthesized report with cross-cutting themes."
2. Expect: agent recognizes this as a parallelizable task and spawns sub-agents (or at minimum, structures the work into clear parallel streams).
3. Observe the UI. Expect: some indication that multiple research threads are happening (sub-agent indicators, tool cards showing parallel research).
4. Wait for results. Expect: agent produces a structured report covering:
   - Each trend individually (with specific findings)
   - Cross-cutting themes that connect the three areas
   - Implications or recommendations
5. Verify: the report synthesizes across all three topics — it's not just three separate sections pasted together.
6. Ask: "Which of these trends is most relevant to our company?" (if workspace has company context in memory).
7. Expect: agent connects the research to workspace context.

#### Functional Checkpoints
- [ ] Agent recognizes the task benefits from parallel/sub-agent execution
- [ ] Sub-agents are spawned or parallel research streams are visible in the UI
- [ ] Each trend is researched with specific findings (not generic statements)
- [ ] Cross-cutting themes section exists and is substantive
- [ ] Report is synthesized — not three disconnected sections
- [ ] Research uses tools (web_search or similar) — not hallucinated
- [ ] If workspace has context, follow-up connects research to company context
- [ ] Total execution time is reasonable (under 5 minutes for all three topics)

#### Emotional Checkpoints
- [ ] Controlled Power: Elena asked for one thing and got a comprehensive result — the agent amplified her
- [ ] Momentum: A task that would take hours manually was done in minutes
- [ ] Trust: The research is grounded in real sources, not invented
- [ ] Seriousness: The output is report-quality — not chatbot-quality
- [ ] Alignment: The synthesis and cross-cutting analysis is what Elena actually needs — not just raw data

#### Features Exercised
- Sub-agent spawning
- Parallel task execution
- Multi-topic research
- Research synthesis across topics
- Cross-cutting theme identification
- Workspace context integration
- Tool usage by sub-agents

#### Competitive Benchmark
- **Claude Code**: No sub-agent spawning. Sequential execution only. Waggle expected: **+1**
- **ChatGPT Desktop**: No sub-agents. Sequential processing. Waggle expected: **+1**
- **Cursor AI**: No sub-agents outside coding context. Waggle expected: **+1**
- **AutoGPT/AgentGPT**: Sub-agent spawning exists but quality and reliability is low. Waggle expected: **+1** (quality)

#### Pass Criteria
- Functional: all checkpoints pass (sub-agent indication in UI is required — if it's invisible, the feature is not validated)
- Business: score >= 3 (sub-agents are impressive but still maturing)
- Emotional: Controlled Power >= 4, Momentum >= 4, Trust >= 3
