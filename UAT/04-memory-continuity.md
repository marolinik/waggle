# Memory & Continuity Tests

Memory is Waggle's core differentiator. Without it, Waggle is just another chat wrapper. These 6 scenarios validate that memory actually works as a product primitive — saving automatically, searching reliably, scoping correctly, surfacing in responses, and making the agent genuinely smarter over time.

---

### Scenario 4.1: Memory Saves Automatically

**Persona**: Ana (Product Manager)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Workspace exists with agent functional. No prior memories about target market.

#### Context
Ana is discussing her product strategy with the agent. She shares important context — her target market, key constraints, competitive positioning. She doesn't explicitly say "remember this." The agent should automatically identify important information and store it. Later, in a new session, the agent should recall this information without being asked to look it up.

#### Steps
1. Open workspace "Product Strategy." Start a conversation: "I want to share some context about our product. Our target market is enterprise SaaS companies with 100-500 employees. We're focused on the mid-market because enterprise is too slow and SMB can't afford us."
2. Continue: "Our main differentiator is that we offer real-time collaboration, which none of our competitors do well. The pricing will be $25/user/month."
3. Continue with a few more exchanges about the product. End the session naturally: "That's a good foundation. Let's pick this up tomorrow."
4. Close the session or the app entirely.
5. Open a new session in the same workspace.
6. Ask: "Who is our target market?"
7. Expect: agent answers "enterprise SaaS companies with 100-500 employees" (or equivalent) — sourced from memory, not asking again.
8. Ask: "What's our pricing?"
9. Expect: agent answers "$25/user/month" — from memory.
10. Ask: "Why did we choose the mid-market?"
11. Expect: agent references the reasoning ("enterprise is too slow, SMB can't afford us").

#### Functional Checkpoints
- [ ] Agent does NOT require explicit "remember this" commands — memory saves automatically
- [ ] Memory browser shows stored memories from the first session
- [ ] Memories include the key facts: target market, pricing, differentiator, mid-market reasoning
- [ ] In the new session, agent answers "Who is our target market?" correctly from memory
- [ ] In the new session, agent answers "What's our pricing?" correctly from memory
- [ ] Agent references reasoning ("enterprise too slow, SMB can't afford") when asked about mid-market choice
- [ ] Memory frames show appropriate metadata: importance level, timestamp, source session

#### Emotional Checkpoints
- [ ] Relief: Ana didn't have to explicitly tag information as important — the agent caught it
- [ ] Continuity: The new session feels like a continuation, not a restart
- [ ] Trust: The agent's recalled information is accurate — no hallucinated details, no drift
- [ ] Seriousness: The agent treats business context as important, not ephemeral chat

#### Features Exercised
- Automatic memory extraction (CognifyPipeline)
- Memory persistence in .mind SQLite file
- Memory retrieval in new sessions
- Context injection from memory
- Memory browser (verification)

#### Competitive Benchmark
- **Claude Code**: Zero memory between sessions. Every session starts blank. Waggle expected: **+2**
- **ChatGPT Desktop**: Has "memory" but it's unreliable, not workspace-scoped, and can't be inspected. Waggle expected: **+2**
- **Notion AI**: No cross-session memory at all. Waggle expected: **+2**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 5 (this IS the product — if this doesn't work at a 5, nothing matters)
- Emotional: Relief >= 4, Continuity >= 5, Trust >= 4

---

### Scenario 4.2: Memory Search

**Persona**: Elena (Data Analyst)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Workspace with at least 10-15 memories accumulated across multiple sessions. Diverse topics (metrics, reports, decisions, stakeholder preferences).

#### Context
Elena has been using Waggle for her analytics workspace for two weeks. She's accumulated memories about metric definitions, report preferences, stakeholder requests, and data sources. Now she needs to find a specific piece of information she discussed a week ago about the definition of "active user."

#### Steps
1. Open the Memory Browser panel (right panel or dedicated view).
2. Search for "active user." Expect: FTS5 search returns relevant memory frames.
3. Review the search results. Expect: results show the memory content, importance score, timestamp, and source (which session/conversation).
4. Search for "quarterly report." Expect: different set of results related to reporting.
5. Search for something that doesn't exist: "blockchain." Expect: empty results, not hallucinated matches.
6. Browse memories chronologically. Expect: memories are ordered by timestamp, showing the accumulation over time.
7. Click on a memory frame. Expect: expanded view shows full content and metadata.

#### Functional Checkpoints
- [ ] Memory Browser is accessible from the UI (right panel or navigation)
- [ ] FTS5 search returns relevant results for "active user"
- [ ] Search results include: content preview, importance score, timestamp, source
- [ ] Different search terms return different, relevant results
- [ ] Empty search (no matches) shows a clear "no results" state, not errors
- [ ] Memories are browsable chronologically
- [ ] Individual memory frames can be expanded for full detail
- [ ] Search is fast (results appear in under 1 second)

#### Emotional Checkpoints
- [ ] Orientation: Elena can navigate the memory system intuitively — it's clear what she's looking at
- [ ] Controlled Power: She can search, browse, and inspect — the memory system is transparent, not a black box
- [ ] Trust: Search results are accurate — relevant memories surface, irrelevant ones don't
- [ ] Relief: She found the "active user" definition without digging through session logs or notes

#### Features Exercised
- Memory Browser UI
- FTS5 full-text search
- Memory frame display (content, importance, timestamp, source)
- Chronological memory browsing
- Empty state handling
- Memory detail view

#### Competitive Benchmark
- **Claude Code**: No memory to search. Waggle expected: **+2**
- **ChatGPT Desktop**: Can search conversation history but not structured memory. Waggle expected: **+2**
- **Notion AI**: Notion has search but it's document-level, not memory-level. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Controlled Power >= 4, Trust >= 4, Orientation >= 4

---

### Scenario 4.3: Personal vs Workspace Memory

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Two distinct workspaces with prior sessions. Agent functional.

#### Context
Marko has two workspaces: "Backend API" and "Mobile App." He wants to verify that personal preferences (like "I prefer TypeScript") follow him everywhere, while project-specific context (like "this project uses Python") stays scoped to its workspace. This is a critical isolation test — getting this wrong would erode trust completely.

#### Steps
1. Open "Backend API" workspace. Tell the agent: "I personally prefer TypeScript over JavaScript for all my projects. Also, this specific project uses Python with FastAPI."
2. Verify the agent acknowledges both facts.
3. Switch to "Mobile App" workspace.
4. Ask: "What programming language do I prefer?"
5. Expect: agent answers "TypeScript" — this is a personal preference that crosses workspaces.
6. Ask: "What language does this project use?"
7. Expect: agent does NOT say "Python/FastAPI" — that's workspace-specific context from "Backend API." It should either answer from Mobile App's own context or say it doesn't know.
8. Tell the agent in Mobile App workspace: "This project uses React Native with TypeScript."
9. Switch back to "Backend API" workspace.
10. Ask: "What language does this project use?"
11. Expect: agent answers "Python with FastAPI" — Backend API's workspace memory, not Mobile App's.
12. Ask: "What's my preferred language?"
13. Expect: still "TypeScript" — personal memory persists everywhere.

#### Functional Checkpoints
- [ ] Personal preference ("prefer TypeScript") is stored as personal memory
- [ ] Workspace fact ("uses Python with FastAPI") is stored as workspace memory
- [ ] In a different workspace, personal preference is accessible
- [ ] In a different workspace, workspace-specific memory from the first workspace is NOT accessible
- [ ] Each workspace maintains its own isolated memory context
- [ ] Personal memory is consistent across all workspaces
- [ ] Memory browser shows correct scoping labels (personal vs workspace)

#### Emotional Checkpoints
- [ ] Trust: Marko trusts the memory isolation — project A's secrets don't leak into project B
- [ ] Orientation: It's clear which memories are personal (follow him) and which are workspace (stay local)
- [ ] Controlled Power: The separation works exactly as expected — no surprises
- [ ] Continuity: Both personal and workspace memory persist correctly across session boundaries

#### Features Exercised
- Personal memory storage and retrieval
- Workspace memory storage and retrieval
- Memory scope isolation (personal vs workspace)
- Cross-workspace personal memory access
- Workspace memory isolation verification
- Memory browser scope labels

#### Competitive Benchmark
- **Claude Code**: No memory at all, let alone scoped memory. Waggle expected: **+2**
- **ChatGPT Desktop**: Flat memory — no scoping, no workspace isolation. Waggle expected: **+2**
- **Notion AI**: Document-scoped but not with AI memory semantics. Waggle expected: **+2**

#### Pass Criteria
- Functional: all checkpoints pass (memory isolation is a HARD requirement — any cross-contamination is an automatic fail)
- Business: score >= 5
- Emotional: Trust >= 5, Orientation >= 4, Controlled Power >= 4

---

### Scenario 4.4: Knowledge Graph

**Persona**: Ana (Product Manager)
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Workspace with agent functional. Knowledge Graph viewer accessible.

#### Context
Ana is building up a competitive intelligence workspace. Over several conversations, she mentions companies, products, people, and their relationships. The Knowledge Graph should capture these entities and relationships, and the KG viewer should visualize them.

#### Steps
1. Open workspace "Competitive Intel." Have a conversation: "Our main competitor is Acme Corp. They were founded by John Smith in 2019."
2. Continue: "Acme Corp launched a product called AcmeFlow last month. It competes directly with our FlowPro product."
3. Continue: "Another competitor is BetaTech. They recently partnered with Acme Corp on enterprise sales."
4. Continue: "Jane Doe, our CEO, wants us to focus on differentiation against AcmeFlow specifically."
5. Open the Knowledge Graph viewer (right panel or dedicated view).
6. Expect: entities visible — Acme Corp, BetaTech, AcmeFlow, FlowPro, John Smith, Jane Doe.
7. Expect: relationships visible — "Acme Corp launched AcmeFlow," "BetaTech partnered with Acme Corp," "AcmeFlow competes with FlowPro," "John Smith founded Acme Corp," "Jane Doe is CEO."
8. Click on an entity (e.g., "Acme Corp"). Expect: connected relationships and entities highlighted.

#### Functional Checkpoints
- [ ] Entities are extracted from conversation automatically (at least 4 of the 6 mentioned)
- [ ] Relationships between entities are captured (at least 3 of the 5 described)
- [ ] KG viewer is accessible from the UI
- [ ] KG viewer renders entities as nodes and relationships as edges
- [ ] Clicking an entity shows its connections
- [ ] Entity names are correctly extracted (not garbled or partial)
- [ ] Relationship types are meaningful (not all generic "related to")

#### Emotional Checkpoints
- [ ] Orientation: Ana can see the competitive landscape visually — it's a map, not a wall of text
- [ ] Trust: The KG accurately reflects what she said — no invented entities or relationships
- [ ] Seriousness: The visualization looks professional and useful, not a tech demo
- [ ] Controlled Power: Ana can explore the graph interactively — zoom, click, navigate

#### Features Exercised
- Entity extraction from conversation
- Relationship extraction from conversation
- Knowledge Graph storage
- KG viewer rendering (nodes + edges)
- Entity detail view
- Graph interaction (click, explore)

#### Competitive Benchmark
- **Claude Code**: No knowledge graph. Waggle expected: **+2**
- **ChatGPT Desktop**: No structured knowledge extraction. Waggle expected: **+2**
- **Notion AI**: No automatic entity/relationship tracking. Waggle expected: **+2**
- **Roam Research**: Manual graph linking, not AI-extracted. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3 (KG is a differentiator but not a P0 feature)
- Emotional: Orientation >= 4, Trust >= 3, Seriousness >= 3

---

### Scenario 4.5: Memory-Informed Responses

**Persona**: Luka (Project Manager)
**Tier**: SOLO
**Duration**: 20 minutes (spread across 4 short sessions)
**Prerequisites**: Workspace with agent functional. Empty workspace to start — memories will be built up during the test.

#### Context
Luka is managing a product launch. Over four sessions across several days, he builds up context: team roster, timeline decisions, risk items, stakeholder feedback. In the final session, he asks for a status update. The test validates that the agent synthesizes accumulated memory into a rich, contextual response — not a generic template.

#### Steps
1. **Session 1**: Open workspace "Product Launch." Discuss: "The launch team is: Sarah (engineering), Mike (design), Lisa (marketing). Launch date is March 30th. We have 6 weeks."
2. **Session 2**: Continue: "We identified two risks — the API integration with partner X might slip, and the marketing site copy isn't approved yet. Sarah says the API is 60% done."
3. **Session 3**: Continue: "Lisa got the marketing copy approved today. Risk is down to just the API integration. Mike finished the landing page design. Stakeholder feedback: VP of Sales wants demo videos ready for launch."
4. **Session 4**: Ask: "Give me a status update on the product launch."
5. Read the response. Expect: a rich status update that includes:
   - Team members by name (Sarah, Mike, Lisa)
   - What each person has delivered
   - Risk status (API integration still at risk, marketing copy resolved)
   - New requirement (demo videos from VP of Sales)
   - Timeline reference (March 30th, weeks remaining)
   - Suggested next steps
6. The response should NOT be a generic "here's a status update template." It should reference specific details from all four sessions.

#### Functional Checkpoints
- [ ] Agent produces a status update that references specific team members by name
- [ ] Status update includes resolved items (marketing copy approved, landing page done)
- [ ] Status update includes open risks (API integration)
- [ ] Status update includes new requirements (demo videos)
- [ ] Status update references timeline (March 30th)
- [ ] Agent suggests specific next steps based on accumulated context
- [ ] Response synthesizes information from ALL sessions, not just the most recent
- [ ] No hallucinated details — everything in the update was actually discussed

#### Emotional Checkpoints
- [ ] Continuity: The agent remembers everything from all four sessions — it feels like a colleague who was in every meeting
- [ ] Momentum: Luka gets a complete status update without having to reconstruct anything manually
- [ ] Seriousness: The update is structured and professional — he could forward it to stakeholders
- [ ] Trust: Every detail in the update is accurate — nothing invented, nothing missing
- [ ] Relief: The cognitive load of tracking everything is handled by the agent

#### Features Exercised
- Multi-session memory accumulation
- Memory retrieval across sessions
- Context synthesis from multiple memory frames
- Status report generation from memory
- Chronological awareness (what changed between sessions)
- Decision and risk tracking

#### Competitive Benchmark
- **Claude Code**: Could not produce this status update — no memory of prior sessions. Waggle expected: **+2**
- **ChatGPT Desktop**: Might recall some bits from "memory" but unreliable and unstructured. Waggle expected: **+2**
- **Linear/Notion**: Tracks items but requires manual entry — doesn't synthesize from conversations. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 5 (this is the killer use case: "draft from accumulated context")
- Emotional: Continuity >= 5, Trust >= 4, Momentum >= 4, Seriousness >= 4

---

### Scenario 4.6: Session Outcome Extraction

**Persona**: Ana (Product Manager)
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Workspace with agent functional. Prior session content will be generated during this test.

#### Context
Ana has a productive brainstorming session about feature prioritization. Clear outcomes emerge: decisions made, items still under debate, and next steps identified. When she reopens the workspace later, the catch-up should surface these outcomes without her having to review the full conversation.

#### Steps
1. Open workspace. Have a focused session:
   - "Let's prioritize our backlog for Q2. We have: dark mode, API v2, mobile app, and SSO integration."
   - "After discussion, let's decide: API v2 is priority 1 — our partners are blocked. SSO is priority 2 — enterprise customers need it."
   - "Dark mode is nice-to-have, defer to Q3. Mobile app — I'm not sure yet, let's discuss with engineering next week."
   - "Action item: I need to schedule a meeting with the engineering team about the mobile app decision."
2. Close the session.
3. Open a new session in the same workspace.
4. Check Workspace Home or use /catchup. Expect structured outcomes:
   - **Decisions**: API v2 = P1, SSO = P2, Dark mode deferred to Q3
   - **Open items**: Mobile app — pending engineering discussion
   - **Action items**: Schedule engineering meeting about mobile app
   - **Suggested next steps**: Follow up on the engineering meeting
5. Ask: "What did we decide about dark mode?"
6. Expect: "Deferred to Q3 — classified as nice-to-have during Q2 prioritization."

#### Functional Checkpoints
- [ ] Session outcomes are extracted automatically (decisions, open items, action items)
- [ ] /catchup or Workspace Home surfaces structured outcomes
- [ ] Decisions include the priority assignments (API v2 = P1, SSO = P2)
- [ ] Open items are flagged (mobile app — pending discussion)
- [ ] Action items are captured (schedule engineering meeting)
- [ ] Next steps are suggested based on open items
- [ ] Individual decision queries ("What did we decide about dark mode?") return accurate answers
- [ ] Deferred items include the reasoning ("nice-to-have")

#### Emotional Checkpoints
- [ ] Relief: Ana doesn't have to take meeting notes — the agent captured everything
- [ ] Continuity: Outcomes persist across sessions — nothing falls through the cracks
- [ ] Orientation: The structured catch-up tells her exactly where things stand
- [ ] Momentum: She can immediately act on the next steps without re-reading the conversation
- [ ] Trust: Every extracted outcome accurately reflects what was discussed

#### Features Exercised
- Session outcome extraction (decisions, open items, action items)
- /catchup command
- Workspace Home catch-up display
- Memory storage of decisions with reasoning
- Decision recall by topic
- Next step suggestion

#### Competitive Benchmark
- **Claude Code**: No session outcome extraction. User must manually track decisions. Waggle expected: **+2**
- **ChatGPT Desktop**: No structured outcome capture. Waggle expected: **+2**
- **Notion AI**: Can summarize a doc but can't extract structured outcomes from a conversation. Waggle expected: **+1**
- **Otter.ai**: Does meeting transcription and action items, but for audio. Different modality. Waggle expected: **0** (different use case)

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4
- Emotional: Relief >= 4, Continuity >= 4, Orientation >= 4, Trust >= 4
