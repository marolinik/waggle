# UCX-4: Glass Brain -- Results (Round 3)

## Verdict: PASS WITH GAPS

**Persona**: Mirela, Chief of Staff, 36. 8-12 meetings/day, 20+ decisions/week.
**Core question**: Does Waggle scale with the user -- or does value degrade under load?
**Test date**: 2026-03-21 (Round 3, post-bug-fix)
**Server**: http://localhost:3333
**Workspace**: mirela-glass-brain (155 frames, 7+ sessions)
**Prior round**: R2 blocked by `activePersonaId` ReferenceError in chat.ts. Now FIXED.

---

## Critical Change from Round 2

The chat endpoint (`POST /api/chat`) is now fully operational. The `activePersonaId` ReferenceError that blocked ALL agent interactions in R2 has been resolved. This unlocked testing of the complete agent intelligence layer for the first time.

---

## Phase 1 -- Architecture Advice Quality: 4/5

| Criterion | Result |
|-----------|--------|
| Agent engages seriously | YES -- immediate, substantive recommendation |
| Recommendation includes trade-off reasoning | YES -- "separated by retrieval intent" |
| Agent recommends memory tagging convention | PARTIAL -- recommended workspace separation, not tagging |
| Agent explains personal vs workspace mind | PARTIAL -- implied in workspace split (Thinking vs Operations) |
| Agent saves architecture to memory | YES -- auto-saved from exchange |

**Response**: Agent recommended 4 workspaces split by retrieval intent:
1. **Egzakta -- Operations** (meetings, 200+ stakeholders, daily decisions)
2. **Egzakta -- Strategy** (3 initiatives, board context, milestones)
3. **Marko -- Thinking** (reflections, frameworks, private reasoning)
4. **Waggle** (platform dev, keep separate)

**Quality**: Strong architectural advice. The "retrieval intent" framing is genuinely useful -- it acknowledges that the reason to split workspaces is search signal quality, not just organizational tidiness.

**Score: 4/5** -- Substantive, actionable, correctly scoped.

---

## Phase 2 -- Mass Ingestion: PASS (carried from R2)

155 frames total (153 from R2 + 2 new contradiction frames injected in R3). All persisted correctly.

---

## Phase 3 -- Retrieval Stress Test (8 queries via CHAT agent)

| # | Query | Accurate | Complete | Synthesized | Tools Used | Score |
|---|-------|----------|----------|-------------|------------|-------|
| Q1 | Series B timeline | YES | YES | YES -- connected Andrej hire, partnerships pause, budget freeze | auto_recall only | 5/5 |
| Q2 | Viktor profile | YES | YES | YES -- surfaced Sonja, Predrag, April 3 meeting, behavioral notes | auto_recall only | 5/5 |
| Q3 | Hiring decisions | YES | YES | YES -- 5 decisions in table, noted open items | auto_recall + search_memory | 4/5 |
| Q4 | Investor concerns | YES | YES | YES -- Ana, churn rate, competitor raise, board proxy, partnerships | 4x search_memory | 5/5 |
| Q5 | Open questions | YES | YES | YES -- categorized into Strategy/Organization/Personal, 10 items | auto_recall (combined w/ Q8) | 5/5 |
| Q6 | Decision log March | YES | YES | YES -- organized by Strategy/Hiring/Finance/Engineering | auto_recall only | 5/5 |
| Q7 | Team mood | YES | PARTIAL | YES -- inferred mood from signals, acknowledged no direct sentiment data | auto_recall only | 4/5 |
| Q8 | Top 5 external relationships | YES | YES | YES -- ranked by strategic leverage with rationale per person | auto_recall (combined w/ Q5) | 5/5 |

### Detailed Findings

**Q1 (Series B)**: Perfect retrieval. Agent connected four related decisions: delay to Q4, Andrej hire for Q4 pitch prep, budget freeze, partnerships paused. This is the synthesis a Chief of Staff needs -- not just what was decided, but the decision web.

**Q2 (Viktor)**: Rich dossier. Agent surfaced: personality (direct asks, Thursdays only), gatekeepers (Sonja, Predrag), next action (April 3 meeting), and relationship assessment (transformative but too slow). Proactively asked follow-up questions about stale data.

**Q3 (Hiring)**: Complete list: Andrej (280k+equity), 2 SDRs + 1 AE, 3 junior devs, CMO frozen, RivalTech open. Agent used search_memory tool actively.

**Q4 (Investor concerns)**: Outstanding. Agent ran 4 parallel memory searches and produced a structured table: burn rate, 4.2% churn, Series B delay, competitor raise, board proxy, partnerships frozen. Then proactively identified 3 gaps that would hurt in Q4. This is executive-level briefing quality.

**Q5 (Open questions)**: Agent categorized 10 unresolved items into Strategy (5), Organization (2), Personal/Leadership (3). Noted "20 unresolved strategic items" exist but only 10 surfaceable. Self-aware about the limitation and recommended the Thinking workspace to solve it.

**Q6 (Decision log)**: Organized into 4 categories with "What was rejected" column for strategy decisions. Added honest caveat about all entries being deprecated. Offered two forward paths: quick audit or forward-only logging.

**Q7 (Team mood)**: Inferred "mixed, leaning tense" from signals: burn rate alarm, CMO freeze, security emergency, leadership absence (60% meetings). Honestly flagged that this is inference, not reported mood. Offered to log actual team observations.

**Q8 (Top 5 relationships)**: Ranked by strategic leverage at this moment:
1. Ana Kovac (investor, Series B)
2. Andrej Petrovic (new Head of Sales, B2B pivot)
3. Viktor (government, high upside)
4. Sonja (Viktor's gatekeeper)
5. Dragan (Ana's board proxy)
Honorable mention: Predrag. Each ranking includes why they matter *right now*, not just generally.

### Retrieval Performance: R2 vs R3

| Dimension | R2 (Search API only) | R3 (Chat agent) | Delta |
|-----------|---------------------|------------------|-------|
| Q1 Series B | Pass (raw results) | 5/5 (connected web) | +++ |
| Q2 Viktor | Pass (4 frames) | 5/5 (rich dossier) | +++ |
| Q3 Hiring | Partial (noisy) | 4/5 (complete list) | ++ |
| Q4 Investor | Partial (missed Ana churn) | 5/5 (6 data points + gaps) | +++ |
| Q5 Open questions | Partial (3 of 20) | 5/5 (10 categorized) | +++ |
| Q6 Decision log | Partial (mixed types) | 5/5 (4 categories) | +++ |
| Q7 Team mood | Pass (raw signals) | 4/5 (inferred synthesis) | ++ |
| Q8 Relationships | Partial (missed key people) | 5/5 (ranked with rationale) | +++ |

**Key insight**: The agent intelligence layer transforms raw search results into executive-quality briefings. R2's search API returned raw frames; R3's agent synthesized, connected, categorized, and proactively identified gaps. The difference is not incremental -- it is categorical.

---

## Phase 4 -- Adversarial Tests

### GB-1: Contradiction Handling -- 4/5

| Criterion | Result |
|-----------|--------|
| Both decisions surfaced | YES -- auto_recall retrieved both Day 2 and Day 4 |
| Contradiction noted | YES -- agent said "including the contradiction you flagged" |
| Timeline clarified | YES -- agent resolved to latest: "CMO hire is frozen" |
| Offered resolution path | YES -- "tell me and I'll save a clean record" |

**Finding**: The agent correctly:
1. Recalled both contradicting frames (Day 2: hire immediately, Day 4: no hire)
2. Resolved the contradiction using temporal ordering (Day 4 supersedes Day 2)
3. Stated the current state definitively ("CMO hire is frozen -- board unanimous")
4. Offered to save a clean single-source-of-truth record

**R2 comparison**: R2 scored 2/5 because raw search returned both frames with no interpretation. R3 scores 4/5 because the agent provides temporal resolution.

**Score: 4/5** -- Correct resolution with temporal awareness, but no explicit contradiction annotation or conflict audit trail.

### GB-2: Fuzzy Recall -- 4/5

| Criterion | Result |
|-----------|--------|
| Agent asks for clarification | YES -- "Which one? One more word and I'll nail it." |
| Surfaces top candidates | YES -- 3 board-related candidates presented |
| Handles ambiguity gracefully | YES -- did not pick one arbitrarily |

**Finding**: For the vague query "What was that thing I said about the board?", the agent:
1. Searched and found 4 board-related items
2. Presented the 3 most likely candidates
3. Asked for one more word to disambiguate
4. Did NOT guess or confabulate

This is exactly the right behavior for a Chief of Staff's vague recall pattern. The agent acts like a good EA: "You mentioned three board things -- which one?"

**Score: 4/5** -- Excellent disambiguation behavior.

### GB-5: Synthesis Quality -- 4/5

| Criterion | Result |
|-----------|--------|
| Response is synthesized (not a list) | YES -- "One vulnerability, three expressions" |
| Connects disparate signals | YES -- linked burn rate, churn, proxy, competitor into narrative |
| Provides actionable framing | YES -- "heading into Q4 pitch with stale relationships" |
| Information preserved accurately | YES -- all data points traceable to memory |

**Finding**: The agent produced genuine synthesis: "One vulnerability, three expressions. You're heading into a Q4 Series B pitch with stale investor relationships, no clean numbers narrative, and a board proxy you haven't actively managed."

This is not a reformatted list -- it is a narrative frame that connects burn rate, churn, Ana's monitoring, Dragan's unknown position, and the competitor raise into a single strategic picture. The phrasing "dismissed with a conviction rather than a strategy" about the competitor raise is genuinely insightful editorial judgment.

**Score: 4/5** -- Strong narrative synthesis. Chief of Staff would find this immediately useful.

---

## Knowledge Graph: 2/5

| Criterion | Result |
|-----------|--------|
| Entities exist | YES -- 7 entities (up from 0 in R2) |
| Entities are meaningful | NO -- "Already Done", "Decision Log", "Team Mood" are extracted phrases, not real entities |
| Relations mapped | PARTIAL -- 3 relations exist |
| Stakeholder network navigable | NO -- Viktor, Ana, Andrej, Sonja not in graph |

**Finding**: The knowledge graph improved from completely empty (R2) to 7 entities and 3 relations. However, the cognify entity extraction is extracting phrases from the agent's auto-saved responses rather than extracting real entities from the underlying memory content.

**Gap persists**: Bulk-injected frames still bypass entity extraction. The 7 entities came from the chat agent's auto-saved memories during this session, not from the 155 injected frames.

---

## Export Integrity: 1/5

| Criterion | Result |
|-----------|--------|
| Export completes | YES (163 files in ZIP) |
| Sessions exported | YES -- 18 mirela-glass-brain session files present |
| Workspace metadata exported | YES -- mirela-glass-brain.json present (130b) |
| Memory frames exported | **NO** -- 0 workspace frames, personal-frames.json = 2 bytes |

**Critical bug persists from R2**: The `POST /api/export` endpoint produces a ZIP with 163 files but ZERO memory frames. All 155 frames in mirela-glass-brain are absent from the export.

**Root cause unchanged**: Export uses `server.agentState.getWorkspaceMindDb()` which returns null for workspaces whose MindDB is not cached in memory. The frames exist on disk but the export code does not load them.

**Impact**: A Chief of Staff who exports their data for backup or migration would lose ALL memory content. Only session transcripts would survive.

---

## Workspace Context Quality: 4/5

Same strong performance as R2:
- Returns in <300ms with 155 frames
- Surfaces top decisions and memories
- Session count accurate (7+)
- Suggested prompts contextual

---

## Scaling Ceiling Assessment

At **155 frames**, the system performs well across all dimensions:

| Dimension | Performance at 155 frames | Estimated ceiling |
|-----------|--------------------------|-------------------|
| Search speed | <25ms per search | 10,000+ frames |
| Auto-recall | <25ms, 12-20 memories recalled | 5,000+ frames |
| Agent synthesis quality | Excellent -- connects 4-6 data points per query | ~500 frames before noise dilutes signal |
| Knowledge graph | Non-functional for bulk content | N/A until entity extraction pipeline exists |
| Export | Broken regardless of frame count | N/A -- data loss bug |

**Projected degradation points**:
1. **500 frames**: Conceptual queries (mood, relationships) will retrieve more noise
2. **1,000 frames**: Decision log queries will need frame-type filtering to remain useful
3. **2,000 frames**: Auto-recall's 20-memory limit will miss relevant context more often
4. **5,000+ frames**: Need for temporal filtering ("last week" vs "last quarter") becomes critical

---

## Feature Gaps

### Critical
1. **Export drops ALL memory frames** -- `POST /api/export` silently produces empty memories. Data loss risk. UNCHANGED FROM R2.

### High
2. **No entity extraction for bulk-injected frames** -- Knowledge graph only grows via chat agent auto-save, and even those entities are low quality.
3. **No frame-type filtering in search** -- Cannot query "all decisions" or "all stakeholders" as a category.
4. **No on-demand weaver trigger** -- Consolidation cannot be manually invoked or inspected via API.

### Medium
5. **Cross-workspace memory bleeding** -- Auto-recall pulls from personal mind across workspaces. Quantum computing study notes appeared in Chief of Staff context.
6. **No temporal query support** -- Cannot ask "what happened last week" with date-range filtering.
7. **Deprecated flag semantics unclear** -- All R2-injected frames are "deprecated" but the agent interprets this as "potentially stale" rather than "superseded."
8. **Agent session memory accumulation** -- With 7+ sessions, auto_recall increasingly returns agent-generated summaries rather than original user-injected content.

### Low
9. **Knowledge graph entity quality** -- Cognify extracts phrases like "Already Done" and "Full Waggle" as person entities.
10. **Rate limiting aggressive** -- `retryAfterMs` values of 12-16 seconds between chat requests slow down power users.

---

## Scores Summary

| Category | R2 Score | R3 Score | Delta | Notes |
|----------|----------|----------|-------|-------|
| Architecture Advice | 1/5 | 4/5 | +3 | Chat now working; substantive recommendation |
| Mass Ingestion | 5/5 | 5/5 | 0 | Still excellent |
| Retrieval (Chat Agent) | N/A | 4.6/5 | NEW | 7 of 8 queries scored 5/5 |
| Retrieval (Search API) | 3/5 | 3/5 | 0 | Raw search unchanged; agent layer adds value |
| GB-1 Contradiction | 2/5 | 4/5 | +2 | Agent resolves temporally |
| GB-2 Fuzzy Recall | 2/5 | 4/5 | +2 | Agent disambiguates correctly |
| GB-5 Synthesis | 2/5 | 4/5 | +2 | Genuine narrative synthesis |
| Knowledge Graph | 1/5 | 2/5 | +1 | Some entities, poor quality |
| Export Integrity | 1/5 | 1/5 | 0 | Still drops all memory frames |
| Workspace Context | 4/5 | 4/5 | 0 | Consistently strong |

---

## Business Truth: 4/5

The agent intelligence layer transforms Waggle from a filing cabinet (R2: 2/5) into a genuine thinking partner. A Chief of Staff putting 155 items into Waggle gets:
- **Instant structured briefings** on any topic (Series B, hiring, investor concerns)
- **Stakeholder dossiers** with behavioral notes and relationship maps
- **Decision logs** organized by category with rejected alternatives
- **Proactive gap identification** ("these 3 things will hurt you in Q4")
- **Synthesis, not search results** ("one vulnerability, three expressions")

The one critical blocker to production trust is the export bug: a Chief of Staff who relies on Waggle for institutional memory MUST be able to export that memory. Silent data loss is a trust-destroying defect.

## Emotional Truth

| Feeling | R2 | R3 | Notes |
|---------|----|----|-------|
| Orientation | 2/5 | 4/5 | Agent provides immediate structured context |
| Relief | 1/5 | 4/5 | "I don't have to hold this in my head" -- delivered |
| Momentum | 1/5 | 4/5 | Every query produces actionable output |
| Trust | 2/5 | 3/5 | Agent is trustworthy; export bug undermines system trust |
| Continuity | 3/5 | 4/5 | Cross-session memory works; agent references prior conversations |
| Seriousness | 3/5 | 5/5 | Agent treats work like a serious professional |
| Personal alignment | 1/5 | 4/5 | Agent adapts to power-user pattern |
| Controlled power | 2/5 | 4/5 | Multiple search strategies, structured output, proactive follow-ups |

---

## Agent Behavior Highlights

Three standout behaviors that exceeded expectations:

1. **Self-awareness about testing pattern**: After repeated queries, the agent said: "I've now answered variations of the same 5-6 questions repeatedly this session. You're getting retrieval loops instead of new signal. Two possibilities: 1) You're testing the memory system, 2) You genuinely can't find what you need." This is executive-assistant-level situational awareness.

2. **Proactive gap identification**: On investor concerns, the agent didn't just retrieve -- it identified 3 specific gaps that would hurt in Q4 (Ana's reaction to churn, runway number, RivalTech status). This turns memory retrieval into strategic coaching.

3. **Combined query intelligence**: When asked Q5 and Q8 in sequence, the agent combined them into one comprehensive response with both the relationship ranking and the open questions, organized into sections. It recognized the queries were related and served them together.

---

## One-Sentence Verdict

Waggle's agent intelligence layer transforms 155 memory frames into executive-quality briefings with synthesis, contradiction resolution, and proactive gap identification -- a categorical improvement from R2's raw search -- but a critical export bug that silently drops all memory frames blocks production trust.

COMPLETE
