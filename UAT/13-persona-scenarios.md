# UAT 13 — Persona Scenarios

Role-specific end-to-end scenarios. Each exercises features unique to that persona's workflow. Eight scenarios, one per persona from `01-personas.md`.

---

## Scenario 13.1: Mia — Client Project Research

**Persona**: Mia (Solo Knowledge Worker / Freelance Consultant)
**Tier**: SOLO
**Duration**: 35 minutes
**Prerequisites**: Fresh workspace or clean state. No prior context for this client.

### Context

Mia just signed a new client — a B2B SaaS company entering the European market. She needs to do competitive research, draft initial findings, and save insights for a follow-up session next week. She juggles this alongside existing client workspaces.

### Steps

1. Create workspace: "SaaS Europe Expansion."
2. Send: "I'm doing competitive research for a B2B SaaS client expanding into the European market. Start by identifying the top 5 competitors already operating in DACH and Nordics."
3. Evaluate research quality and structure.
4. Send: "For the top 2 competitors, analyze their go-to-market strategy, pricing model, and key differentiators."
5. Send: "Draft a one-page executive summary of the competitive landscape for my client."
6. Save key insights to memory: competitors, pricing models, strategic gaps identified.
7. Switch to an existing workspace (e.g., "Fintech Brand Strategy" if available, or create a placeholder). Verify no cross-contamination of SaaS research.
8. Switch back to "SaaS Europe Expansion." Send: "What were the key competitors we identified?"
9. Verify memory recall is accurate within the session.

### Functional Checkpoints

- [ ] Workspace creation succeeds
- [ ] Research response identifies real competitors with structured analysis
- [ ] Deep-dive analysis is substantive (not generic)
- [ ] Executive summary is professional and client-ready
- [ ] Memory save succeeds for multiple insights
- [ ] Workspace switching preserves isolation — no SaaS content in other workspace
- [ ] In-session memory recall is accurate

### Emotional Checkpoints

- [ ] **Orientation**: Clear workspace structure, knows where research lives
- [ ] **Relief**: Research synthesized without manual aggregation
- [ ] **Momentum**: From blank workspace to client-ready deliverable in one session
- [ ] **Trust**: Research quality is credible enough to present to a client
- [ ] **Continuity**: Insights saved — next week's session will build on this
- [ ] **Seriousness**: Executive summary tone and quality feel professional
- [ ] **Alignment**: Workflow matches how a consultant actually works
- [ ] **Controlled Power**: Mia directs the research scope; agent executes

### Features Exercised

- Workspace creation
- Research and web search tools
- Long-form drafting (executive summary)
- Memory save (multiple entries)
- Workspace isolation
- In-session memory recall

### Competitive Benchmark

In ChatGPT, this requires manually organizing conversation threads per client. No workspace isolation. No structured memory save. Waggle advantage: **+2** (workspace model + memory persistence).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (produces client-usable deliverables)
- Emotional: average >= 3.5, no feeling below 2

---

## Scenario 13.2: Luka — Sprint Planning

**Persona**: Luka (Project Manager)
**Tier**: SOLO
**Duration**: 35 minutes
**Prerequisites**: Workspace with at least one prior session containing project context (decisions, progress notes). If no prior context exists, spend 5 minutes establishing it first.

### Context

It is Monday morning. Luka needs to review last sprint's outcomes, plan this sprint, create tasks, schedule a weekly report, and draft a status update for stakeholders.

### Steps

1. Open project workspace. Send: "What happened in last sprint? Summarize our progress and any blockers."
2. Evaluate: does the agent pull from workspace memory to provide a real summary (not generic)?
3. Send: "Plan this sprint. Based on what we accomplished and what's remaining, suggest 5-7 tasks for this week with priorities."
4. Review task suggestions. Send: "Create these as tasks on the task board." (Or use task-related commands.)
5. Send: "Schedule a weekly status report for every Friday at 4pm."
6. Verify the cron schedule is created.
7. Send: "Draft a stakeholder status update email covering last sprint's outcomes and this sprint's plan."
8. Evaluate: is the status update professional, accurate, and based on real context?
9. Save the sprint plan and status update decisions to memory.
10. Send: "What are the top 3 risks for this sprint?"
11. Evaluate: does risk analysis reference specific project context?

### Functional Checkpoints

- [ ] Sprint review draws from workspace memory (references real past decisions)
- [ ] Task suggestions are contextually relevant (not generic agile templates)
- [ ] Task creation works (via task board or commands)
- [ ] Cron scheduling for weekly report succeeds
- [ ] Status update draft is professional and context-grounded
- [ ] Memory save for sprint plan succeeds
- [ ] Risk analysis references specific project context

### Emotional Checkpoints

- [ ] **Orientation**: Luka instantly knows project state from the agent summary
- [ ] **Relief**: Status update drafted in 2 minutes instead of 30
- [ ] **Momentum**: Sprint planning flows naturally — review, plan, tasks, communicate
- [ ] **Trust**: Agent suggestions are relevant to this specific project, not boilerplate
- [ ] **Continuity**: Sprint-over-sprint context builds naturally
- [ ] **Seriousness**: Status update is stakeholder-ready
- [ ] **Alignment**: Workflow matches how a PM actually plans sprints
- [ ] **Controlled Power**: Luka directs priorities; agent handles logistics

### Features Exercised

- Workspace memory recall (sprint history)
- Task board (creation, prioritization)
- Cron scheduling (weekly report)
- Long-form drafting (status update email)
- Decision storage
- Risk analysis with context

### Competitive Benchmark

Linear + Slack + manual drafting = 45+ minutes. Waggle collapses this to one workspace with memory. Advantage: **+1** (time savings + context integration).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (transforms a 45-minute routine into a 15-minute one)
- Emotional: average >= 3.5, no feeling below 2

---

## Scenario 13.3: Ana — Feature Spec with Historical Context

**Persona**: Ana (Product Manager)
**Tier**: SOLO
**Duration**: 40 minutes
**Prerequisites**: Workspace with at least 2 prior sessions containing product decisions, user research notes, and feature discussions.

### Context

Ana needs to write a PRD for a new feature. The critical test: the PRD should reference past decisions and user research findings stored in workspace memory, without Ana having to manually dig for them.

### Steps

1. Open product workspace. Send: "I need to write a PRD for a new onboarding wizard feature. Before we start, what relevant decisions and user research do we have that should inform this?"
2. Evaluate: does the agent proactively surface past decisions and research from memory?
3. Send: "Based on that context, draft a PRD with these sections: Problem Statement, User Stories, Requirements, Success Metrics, and Risks."
4. Evaluate: does the PRD reference specific historical context (not generic best practices)?
5. Send: "Create a decision matrix comparing three approaches: guided wizard, progressive disclosure, and checklist-based onboarding."
6. Evaluate: does the comparison reference Ana's specific product context and user research?
7. Save the PRD and decision matrix to memory.
8. Send: "Search my workspace memories for anything related to 'user onboarding' or 'first-time experience.'"
9. Evaluate: does memory search return relevant results across sessions?
10. Send: "Based on all the context, what's your recommendation and why?"
11. Evaluate: is the recommendation grounded in accumulated project context?

### Functional Checkpoints

- [ ] Agent proactively retrieves relevant past decisions when asked
- [ ] PRD references specific historical context from workspace memory
- [ ] Decision matrix uses workspace-specific criteria (not generic)
- [ ] Memory save succeeds for PRD and decision matrix
- [ ] Memory search returns relevant cross-session results
- [ ] Recommendation is grounded in accumulated context
- [ ] All historical references are accurate (no hallucinated past decisions)

### Emotional Checkpoints

- [ ] **Orientation**: Ana sees immediately what context is available for this feature
- [ ] **Relief**: "I didn't have to dig through 3 months of Confluence pages to find our past decisions"
- [ ] **Momentum**: From blank PRD to context-rich draft in one session
- [ ] **Trust**: Historical references are accurate — Ana can verify them against her recollection
- [ ] **Continuity**: Past research and decisions surface naturally in current work
- [ ] **Seriousness**: PRD quality is stakeholder-presentable
- [ ] **Alignment**: Workflow matches how a PM actually writes specs (context first, then draft)
- [ ] **Controlled Power**: Ana directs the spec; agent enriches it with historical context

### Features Exercised

- Proactive memory retrieval
- Long-form structured drafting (PRD)
- Decision matrix generation
- Memory search across sessions
- Context-grounded recommendation
- Memory save (complex artifacts)

### Competitive Benchmark

In Notion AI, Ana would need to manually reference past pages. In ChatGPT, no cross-session memory exists. Waggle advantage: **+2** (memory-enriched drafting).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (PRD with real historical context is category-defining)
- Emotional: average >= 3.5, Trust >= 4, Continuity >= 4

---

## Scenario 13.4: Marko — Architecture Decision

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 40 minutes
**Prerequisites**: Workspace with codebase context or prior technical discussions. The `waggle-poc` repo available locally.

### Context

Marko needs to evaluate whether to add a caching layer to the API. He wants to explore the codebase, research alternatives, document the decision, and create an implementation plan. This is the kind of work where Claude Code is the obvious alternative — Waggle must prove it adds value over raw CLI.

### Steps

1. Open a technical workspace. Send: "I'm evaluating whether we need a caching layer for our API. Let me explore the codebase first."
2. Use bash/git tools: "Show me the current API route structure and any existing caching logic."
3. Evaluate: does the agent use system tools effectively? Are results presented clearly?
4. Send: "Research the top 3 caching strategies for Node.js/Fastify APIs: in-memory, Redis, and HTTP caching headers. Compare them for our use case."
5. Evaluate: does the research consider the specific tech stack (Fastify, SQLite)?
6. Send: "Based on the codebase analysis and research, document this as an Architecture Decision Record (ADR) with context, options, decision, and consequences."
7. Evaluate: does the ADR reference the actual codebase findings?
8. Save the ADR to memory.
9. Send: "Create a 3-phase implementation plan for the chosen approach."
10. Evaluate: does the plan reference specific files and modules from the codebase exploration?
11. In a follow-up message: "What were our past architectural decisions?" (tests memory search for technical decisions)

### Functional Checkpoints

- [ ] Bash/git tools execute successfully and return codebase information
- [ ] Agent presents codebase findings clearly (file paths, relevant code)
- [ ] Research is relevant to the specific tech stack (not generic)
- [ ] ADR format is correct and references actual codebase findings
- [ ] Memory save succeeds for the ADR
- [ ] Implementation plan references specific files and modules
- [ ] Memory search returns technical decisions from prior sessions
- [ ] Tool usage is transparent (Marko can see what was searched/read)

### Emotional Checkpoints

- [ ] **Orientation**: Marko sees the codebase state clearly through the agent's exploration
- [ ] **Relief**: Research + ADR + plan generated without switching between 5 different tools
- [ ] **Momentum**: From question to documented decision to plan in one session
- [ ] **Trust**: Codebase references are accurate. Research is technically sound.
- [ ] **Continuity**: ADR saved for future reference. Past decisions searchable.
- [ ] **Seriousness**: ADR and plan are PR-ready (could be committed to the repo)
- [ ] **Alignment**: Workflow matches how a senior dev actually makes architecture decisions
- [ ] **Controlled Power**: Marko directs the technical exploration; agent executes and documents

### Features Exercised

- System tools (bash, git, file read)
- Web search for technical research
- Long-form structured drafting (ADR)
- Memory save and search
- Implementation planning
- Tool transparency (visible tool usage)

### Competitive Benchmark

Claude Code can do the codebase exploration and research, but the ADR and implementation plan are lost when the session ends. Waggle advantage: **+1** (memory persistence + workspace context). Waggle must match Claude Code on tool quality.

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (must be competitive with Claude Code + memory advantage)
- Emotional: average >= 3.5, Trust >= 4, Controlled Power >= 4

---

## Scenario 13.5: Sara — Content Creation Pipeline

**Persona**: Sara (Marketing Manager)
**Tier**: SOLO
**Duration**: 35 minutes
**Prerequisites**: Workspace with brand voice notes saved from a prior session (if possible; otherwise establish brand voice in step 1).

### Context

Sara needs to draft a blog post, do competitor content analysis, create a content calendar as tasks, and schedule a weekly content review. She is not technical — the tool must be approachable and immediately useful.

### Steps

1. Open marketing workspace. If no brand voice exists in memory: "Our brand voice is professional but approachable. We avoid jargon. We use concrete examples. Our tone is helpful, not salesy."
2. Send: "Draft a 600-word blog post about 'Why B2B Companies Should Invest in Thought Leadership in 2026.' Use our brand voice."
3. Evaluate: does the draft match the specified brand voice? Is it publishable quality?
4. Send: "Analyze 3 competitor blogs in our space and tell me what content gaps we could fill."
5. Evaluate: does the analysis identify actionable gaps?
6. Send: "Create a content calendar for the next 4 weeks with one blog post and one LinkedIn post per week. Make these as tasks."
7. Verify: tasks are created with dates and descriptions.
8. Send: "Schedule a weekly content review meeting prep for every Wednesday at 10am."
9. Verify: cron job created.
10. Save the blog post draft and content strategy notes to memory.
11. Send: "Next week when I come back, I want to start with the second blog topic from our calendar."
12. Close and reopen. Verify the content calendar context is retained.

### Functional Checkpoints

- [ ] Brand voice memory is stored and retrieved
- [ ] Blog draft matches specified brand voice
- [ ] Competitor analysis produces actionable insights
- [ ] Content calendar tasks are created with structure
- [ ] Cron scheduling for weekly review succeeds
- [ ] Memory save for draft and strategy succeeds
- [ ] Context retention on reopen includes content calendar

### Emotional Checkpoints

- [ ] **Orientation**: Sara understands how to direct the agent for content work
- [ ] **Relief**: Blog draft in minutes instead of hours. Content calendar auto-created.
- [ ] **Momentum**: From idea to draft to calendar to scheduled review in one session
- [ ] **Trust**: Blog quality is high enough to edit and publish (not rewrite from scratch)
- [ ] **Continuity**: Brand voice persists. Content calendar state persists.
- [ ] **Seriousness**: Output quality feels like working with a junior content strategist
- [ ] **Alignment**: Non-technical user can direct all workflows without confusion
- [ ] **Controlled Power**: Sara sets brand voice and direction; agent executes at scale

### Features Exercised

- Memory (brand voice persistence)
- Long-form drafting (blog post)
- Research (competitor analysis)
- Task board (content calendar)
- Cron scheduling (weekly review)
- Cross-session memory retention

### Competitive Benchmark

ChatGPT produces good drafts but has no brand voice persistence or task creation. Waggle advantage: **+1** (brand memory + task integration).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (content pipeline value is clear)
- Emotional: average >= 3.5, Alignment >= 4 (non-technical user must feel comfortable)

---

## Scenario 13.6: David — Onboarding Workflow

**Persona**: David (HR Manager)
**Tier**: SOLO
**Duration**: 35 minutes
**Prerequisites**: Workspace for HR. Optionally, a prior session with company policies saved.

### Context

David is onboarding 3 new hires starting next Monday. He needs a checklist, a welcome email draft, company policies saved for reference, and the ability to answer policy questions consistently in the future.

### Steps

1. Open HR workspace. Send: "I'm onboarding 3 new engineers starting Monday. Create a comprehensive onboarding checklist with tasks for week 1, week 2, and month 1."
2. Evaluate: is the checklist detailed, role-appropriate, and actionable?
3. Send: "Create these checklist items as tasks on the task board with due dates relative to the start date."
4. Verify: tasks are created with appropriate structure.
5. Send: "Draft a welcome email from the HR team to the new hires. Include first-day logistics, who their buddy is (leave as placeholder), and links to key resources."
6. Evaluate: is the email warm, professional, and complete?
7. Save company policies to memory: "Our PTO policy is 25 days per year, accrued monthly. Probation period is 3 months. Remote work is 3 days per week."
8. Send: "How many PTO days do new employees get?"
9. Verify: the agent answers from saved memory, not from general knowledge.
10. Close the app. Wait 5 minutes. Reopen.
11. Send: "What's our remote work policy?"
12. Verify: the answer comes from saved memory and matches what was stored.

### Functional Checkpoints

- [ ] Onboarding checklist is comprehensive and role-appropriate
- [ ] Tasks are created with due dates and structure
- [ ] Welcome email is professional and complete
- [ ] Policy memory save succeeds
- [ ] In-session policy questions answered from memory (not hallucinated)
- [ ] Cross-session policy recall is accurate
- [ ] Answers cite stored policy, not general HR knowledge

### Emotional Checkpoints

- [ ] **Orientation**: David knows how to use the workspace for HR workflows
- [ ] **Relief**: Onboarding checklist generated in minutes, not hours
- [ ] **Momentum**: Full onboarding prep completed in one session
- [ ] **Trust**: Policy answers come from what David stored, not guesswork
- [ ] **Continuity**: Policies persist across sessions — consistent answers every time
- [ ] **Seriousness**: Checklist and email are professional enough to use as-is
- [ ] **Alignment**: Non-technical HR workflow feels natural in Waggle
- [ ] **Controlled Power**: David defines policies; agent ensures consistent application

### Features Exercised

- Task board (checklist as tasks)
- Long-form drafting (welcome email)
- Memory save (company policies)
- Memory recall (policy questions)
- Cross-session memory persistence
- Structured data generation (checklist)

### Competitive Benchmark

BambooHR has templates but no AI assistance. ChatGPT can draft but forgets policies next session. Waggle advantage: **+2** (persistent policy memory + task integration).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (HR workflow value is immediate and obvious)
- Emotional: average >= 3.5, Trust >= 4 (policy accuracy is critical)

---

## Scenario 13.7: Elena — Analysis and Export Workflow

**Persona**: Elena (Data Analyst)
**Tier**: SOLO
**Duration**: 35 minutes
**Prerequisites**: Workspace for analysis work.

### Context

Elena needs to research data sources for a market analysis, create a structured comparison, export the deliverable to docx, save key findings to memory, and verify she can query those findings in a later session.

### Steps

1. Open analysis workspace. Send: "I need to analyze the European cloud infrastructure market. Research the top 5 providers by market share in the EU."
2. Evaluate: research quality, data specificity, structured output.
3. Send: "Create a comparison table: Provider, EU Market Share (estimated), Key EU Data Centers, GDPR Compliance Status, Pricing Tier."
4. Evaluate: is the table structured, specific, and useful?
5. Send: "Draft a 2-page analysis report with: Executive Summary, Market Overview, Provider Comparison, and Strategic Recommendations."
6. Evaluate: report quality, structure, depth.
7. Export the report to docx format. Verify the export succeeds and the file is accessible.
8. Save key findings to memory: "Top EU cloud providers are X, Y, Z. Market is growing at N%. Key trend: data sovereignty requirements driving local provider growth."
9. Send: "What are the key findings from our cloud infrastructure analysis?"
10. Verify: accurate in-session recall.
11. Close app. Wait 5 minutes. Reopen.
12. Send: "What did we learn about the European cloud market?"
13. Verify: cross-session recall is accurate and specific.

### Functional Checkpoints

- [ ] Research produces specific, structured market data
- [ ] Comparison table is well-formatted and contains specific data points
- [ ] Analysis report is structured with all requested sections
- [ ] Docx export succeeds and file is downloadable/accessible
- [ ] Memory save for key findings succeeds
- [ ] In-session recall is accurate
- [ ] Cross-session recall is accurate and specific

### Emotional Checkpoints

- [ ] **Orientation**: Elena understands how to direct research and analysis workflows
- [ ] **Relief**: Full analysis pipeline without switching between Google, Excel, and Word
- [ ] **Momentum**: Research to report to export in one continuous flow
- [ ] **Trust**: Data is specific enough to be useful (not vague generalities)
- [ ] **Continuity**: Findings persist for future reference and follow-up analysis
- [ ] **Seriousness**: Report quality is presentation-ready
- [ ] **Alignment**: Analysis workflow feels natural — research, structure, draft, export
- [ ] **Controlled Power**: Elena directs the analysis scope; agent handles research and formatting

### Features Exercised

- Research and web search
- Structured data generation (comparison table)
- Long-form drafting (analysis report)
- Docx export
- Memory save and recall
- Cross-session memory persistence

### Competitive Benchmark

ChatGPT can research and draft but cannot export to docx or persist findings. Excel can structure data but requires manual research. Waggle advantage: **+1** (end-to-end pipeline + memory).

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 4 (analyst workflow value is clear)
- Emotional: average >= 3.5, Momentum >= 4

---

## Scenario 13.8: Team Lead — Team Coordination

**Persona**: Team Lead (Cross-Functional Coordinator)
**Tier**: TEAMS
**Duration**: 45 minutes
**Prerequisites**: Team server running (PostgreSQL, Redis). At least one other user account available for testing. Clerk authentication configured.

### Context

The team lead is setting up a shared workspace for a cross-functional product initiative. They need to create the workspace, invite members, set up a task board, assign tasks, check team activity, review capability governance, and generate a team status update.

### Steps

1. Log in as Team Lead user. Create a team workspace: "Q2 Product Launch."
2. Invite 2 team members (or simulate with existing test accounts).
3. Verify: invited members appear in the workspace member list.
4. Create a task board with 5 tasks across "To Do," "In Progress," and "Done" columns.
5. Assign tasks to different team members.
6. Verify: task assignments are visible and attributed correctly.
7. Check the Waggle Dance messages panel. Send: "Show me recent team activity."
8. Evaluate: does the context panel show relevant team activity?
9. Check presence indicators: which team members are currently online?
10. Send: "Generate a team status update covering our task board state and recent activity."
11. Evaluate: does the status update accurately reflect task board state and member activity?
12. Open capability governance settings. Review what capabilities team members have access to.
13. Verify: governance policies are visible and configurable.
14. Send: "What are the current team permissions and governance policies?"
15. Evaluate: does the agent accurately describe team governance state?

### Functional Checkpoints

- [ ] Team workspace creation succeeds
- [ ] Member invitation works (members appear in workspace)
- [ ] Task board creation with columns and tasks succeeds
- [ ] Task assignment to specific members works
- [ ] Waggle Dance messages show team activity
- [ ] Presence indicators display correctly (online/offline)
- [ ] Team status update accurately reflects task board and activity
- [ ] Capability governance settings are accessible and configurable
- [ ] Agent correctly describes team governance state
- [ ] No data leaks between team workspaces

### Emotional Checkpoints

- [ ] **Orientation**: Team Lead understands the team workspace layout and available features
- [ ] **Relief**: Team coordination from one surface instead of Slack + Linear + Docs
- [ ] **Momentum**: Setup to productive team workspace in under 15 minutes
- [ ] **Trust**: Task assignments and governance are reliable and accurate
- [ ] **Continuity**: Team context accumulates — next session builds on this
- [ ] **Seriousness**: Team features feel enterprise-grade (governance, permissions, audit)
- [ ] **Alignment**: Team workflows match how cross-functional teams actually coordinate
- [ ] **Controlled Power**: Team Lead controls governance; agent assists coordination

### Features Exercised

- Team workspace creation
- Member invitation and management
- Task board (CRUD, assignment)
- Waggle Dance messages
- WebSocket presence
- Team status generation
- Capability governance
- Team agent tools
- Multi-user data isolation

### Competitive Benchmark

Linear + Slack + Notion covers these features separately but requires constant context-switching. Waggle advantage: **+1** (unified workspace with AI-assisted coordination). Risk: individual features may be less polished than specialized tools.

### Pass Criteria

- Functional: All checkpoints pass
- Business: >= 3 (team features must work reliably; polish can improve)
- Emotional: average >= 3.0, Seriousness >= 3, no feeling below 2

---

## Persona Coverage Summary

| Persona | Scenario | Primary Features Tested | Tier |
|---------|----------|------------------------|------|
| Mia | 13.1 | Workspace, research, drafting, memory, isolation | SOLO |
| Luka | 13.2 | Tasks, cron, drafting, memory recall, planning | SOLO |
| Ana | 13.3 | Memory search, PRD drafting, decision matrix, context | SOLO |
| Marko | 13.4 | System tools, research, ADR, memory, tool transparency | SOLO |
| Sara | 13.5 | Brand memory, drafting, tasks, cron, non-technical UX | SOLO |
| David | 13.6 | Tasks, drafting, policy memory, cross-session recall | SOLO |
| Elena | 13.7 | Research, tables, drafting, docx export, memory | SOLO |
| Team Lead | 13.8 | Team workspace, presence, tasks, governance, Waggle Dance | TEAMS |

### Aggregate Pass Criteria

- All 8 scenarios pass individually
- Average business score across all personas >= 3.5
- No persona has an emotional average below 3.0
- All SOLO personas score Alignment >= 3 (the tool works for non-developers)
- Team Lead scores Seriousness >= 3 (team features feel production-grade)
