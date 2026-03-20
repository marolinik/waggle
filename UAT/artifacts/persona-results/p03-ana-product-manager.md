# P03: Ana -- Product Manager

## Persona Summary

**Role**: PM at a SaaS startup, owns roadmap and specs
**Tech level**: Can read code, doesn't write it daily
**Tier**: SOLO
**Daily tools**: Linear, Figma, Slack, Notion, user research tools
**Core need**: "Synthesize user research into a spec. Remember why we made past decisions. Draft PRDs that reference real context."
**Emotional priority**: Trust, Alignment, Continuity

---

## Persona System Analysis

### Matching Persona

Ana's needs span two personas:
- **Analyst** (for decision matrices, structured comparison): tools include bash, web_search, search_memory, save_memory
- **Writer** (for PRD drafting, document generation): tools include read_file, write_file, edit_file, search_memory, save_memory, generate_docx

No single persona perfectly matches "Product Manager" -- the closest is a combination of analyst + writer. The existing project-manager persona focuses on task tracking/coordination rather than spec writing.

### Gap: No Product Manager Persona

The 8 defined personas do not include a product management persona optimized for:
- PRD drafting with historical context
- Decision matrices and tradeoff analysis
- User research synthesis
- Roadmap management

---

## Journey Assessment: Feature Spec with Historical Context (Scenario 13.3)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Proactive memory retrieval | Yes | Yes | auto_recall runs on each turn |
| PRD drafting | Yes | Partial | Agent can draft text but no PRD-specific template |
| Decision matrix generation | Yes | Yes | Analyst persona instructions cover this (if wired) |
| Memory search across sessions | Yes | Yes | search_memory with scope=all |
| Context-grounded recommendation | Yes | Partial | Agent can reason but lacks persona guidance |
| Memory save (complex artifacts) | Yes | Yes | save_memory with importance levels |
| Historical accuracy | Yes | Partial | Memory search returns relevant results but no citation verification |

### Memory Architecture for Ana's Needs

Ana's scenario is the most memory-demanding. The system supports:

1. **Auto-recall on every turn**: Before the agent responds, it searches memory for content relevant to the user's message. This means when Ana asks about onboarding, prior onboarding decisions should surface automatically.

2. **Dual-mind search**: `search_memory` with scope=all searches both personal and workspace minds. Past product decisions stored in the workspace mind will be found.

3. **Knowledge graph**: The orchestrator has a knowledge graph (`KnowledgeGraph`) that tracks entities and relationships. This could surface connected decisions.

4. **Cross-session persistence**: All memories persist in SQLite .mind files with FTS5 full-text search + vector embeddings for semantic search.

### PRD Drafting Quality

Without persona instructions, the agent will:
- Draft a PRD if asked, using its general instruction-following capability
- Not proactively reference workspace memory unless auto_recall finds something relevant
- Not structure the PRD in a product-management-standard format unless specifically asked

With a product-manager persona (which does not exist), the agent would:
- Proactively search for prior decisions before drafting
- Structure PRDs with standard sections
- Reference historical context with explicit callouts

### Functional Checkpoint Assessment

- [~] Proactive retrieval of past decisions -- auto_recall works but is query-based, not proactive
- [~] PRD references historical context -- Only if auto_recall matches; no proactive deep search
- [~] Decision matrix is workspace-specific -- Agent can create matrices but lacks PM guidance
- [x] Memory save for PRD and decision matrix -- save_memory works
- [x] Memory search returns cross-session results -- FTS5 + vector search confirmed
- [~] Recommendation grounded in context -- Possible but not guaranteed
- [~] Historical accuracy -- No hallucination guard for memory references

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Auto-recall surfaces some context but not proactively structured for PM work |
| Relief | 3 | Draft generation works but manual guidance needed for PM quality |
| Momentum | 3 | End-to-end flow possible but not streamlined for PRD workflow |
| Trust | 3 | Memory recall is accurate when found, but no citation verification |
| Continuity | 4 | Cross-session memory persistence is strong |
| Seriousness | 3 | PRD quality needs persona-specific professional formatting |
| Alignment | 2 | No PM-specific persona; workflow requires manual adaptation |
| Controlled Power | 3 | Ana can direct but agent lacks PM-domain understanding |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 3 | Memory search exists but lacks proactive retrieval for PM context. No PRD templates. |
| Memory support | 4 | Excellent cross-session persistence. FTS5 + vector search. Auto-recall. |
| Output quality potential | 3 | Generic drafting capability. No PM-specific templates or persona guidance. |
| Team support | 1 | SOLO tier scenario. N/A. |

**Overall infrastructure score: 3.0/5**

---

## Key Findings

1. **No product-manager persona**: The existing project-manager persona is task/coordination focused, not spec-writing focused. Ana needs a persona that emphasizes decision tracking, research synthesis, and structured document generation.

2. **Auto-recall is query-reactive, not proactive**: The system recalls memories matching the user's message, but Ana's scenario requires the agent to proactively surface "everything we know about onboarding" before drafting. The current auto_recall may miss tangentially related decisions.

3. **Memory search works well**: FTS5 + vector search across sessions is functional. The `search_memory` tool with scope=all provides the underlying capability Ana needs.

4. **Decision tracking has no first-class support**: Decisions are stored as regular memory frames with no special tagging or retrieval path. A "decision" frame type or tag would help Ana's workflow significantly.

5. **Document generation (docx) exists**: The `generate_docx` tool can create Word documents, which is useful for Ana producing stakeholder-ready PRDs.

---

## Recommendations

1. Create a "product-manager" persona with instructions for PRD drafting, decision tracking, and research synthesis.
2. Add proactive deep memory search at the start of drafting tasks -- not just auto_recall but a broader context-gathering step.
3. Consider a "decision" frame type in the memory system to distinguish decisions from general notes.
4. Add PRD templates to the skill system so Ana can invoke `/draft PRD` for structured output.
