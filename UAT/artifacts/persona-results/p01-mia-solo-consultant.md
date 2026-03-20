# P01: Mia -- Solo Knowledge Worker / Freelance Consultant

## Persona Summary

**Role**: Freelance consultant, strategy & research
**Tech level**: Comfortable with tools, not a developer
**Tier**: SOLO
**Daily tools**: Notion, Google Docs, email, ChatGPT
**Core need**: "Open a workspace -> instantly know where I left off -> do real work -> close it knowing nothing is lost"
**Emotional priority**: Orientation, Relief, Continuity

---

## Persona System Analysis

### How Personas Are Defined

Personas are defined in `packages/agent/src/personas.ts` as an array of `AgentPersona` objects. Each persona has:
- `id`, `name`, `description`, `icon`
- `systemPrompt` (role-specific instructions appended after core system prompt)
- `modelPreference` (suggested model)
- `tools` (tool subset for this persona)
- `workspaceAffinity` (workspace types this persona suits)
- `suggestedCommands` and `defaultWorkflow`

**8 personas are defined**: researcher, writer, analyst, coder, project-manager, executive-assistant, sales-rep, marketer.

### How Personas Are Activated

- Personas can be assigned to workspaces via `POST /api/workspaces` with a `personaId` field.
- The `GET /api/personas` endpoint exposes the persona catalog to the UI (without system prompts).
- Workspace sessions (`workspace-sessions.ts`) store a `personaId` per session.

### CRITICAL FINDING: Persona Prompt Injection Is Not Wired

The function `composePersonaPrompt()` exists in `packages/agent/src/personas.ts` and is exported, but it is **never called** anywhere in the server chat route. The `buildSystemPrompt()` function in `chat.ts` does not look up the workspace's persona or inject persona-specific instructions into the system prompt.

This means **persona assignment is stored but has no runtime effect on agent behavior**. The agent always receives the same generic system prompt regardless of which persona is assigned to the workspace.

### Persona Switching

There is no explicit "switch persona mid-conversation" API endpoint. Persona is set at workspace creation time and can be updated via `PATCH /api/workspaces/:id` with a `personaId` field.

---

## Journey Assessment: Mia's Client Project Research (Scenario 13.1)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Workspace creation | Yes | Yes | PASS - POST /api/workspaces works |
| Research/web search | Yes | Yes | web_search, web_fetch tools exist |
| Long-form drafting | Yes | Yes | Agent can generate structured text |
| Memory save (multiple entries) | Yes | Yes | save_memory tool + memory routes |
| Workspace isolation | Yes | Yes | Each workspace has its own .mind DB |
| In-session memory recall | Yes | Yes | search_memory + auto_recall on each turn |
| Workspace switching | Yes | Yes | UI can switch workspaces via API |

### Persona Fit

Mia's workflow maps closest to the **researcher** persona:
- Tools: `web_search`, `web_fetch`, `search_memory`, `save_memory`, `read_file`, `search_files`, `search_content`
- Workspace affinity: research, analysis, investigation, due-diligence
- Suggested commands: `/research`, `/catchup`

The researcher persona is well-designed for Mia's competitive research needs. However, because the persona prompt is not injected into the chat, Mia would not receive the researcher-specific behavior instructions (citation tracking, structured findings, depth-over-breadth preference).

### Functional Checkpoint Assessment

- [x] Workspace creation succeeds -- POST /api/workspaces confirmed working
- [~] Research response quality -- Agent has web_search but persona instructions not injected
- [~] Deep-dive analysis -- Agent can do this generically, but lacks persona-guided depth
- [~] Executive summary quality -- Writer/researcher persona instructions would improve this
- [x] Memory save succeeds -- save_memory tool and memory routes confirmed working
- [x] Workspace isolation -- Separate .mind DB files per workspace
- [x] In-session memory recall -- auto_recall runs on each chat turn

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 4 | Workspace Now block provides instant context on return |
| Relief | 3 | Research synthesis works but lacks persona-guided structure |
| Momentum | 3 | End-to-end flow works but no persona-specific workflow guidance |
| Trust | 3 | Research quality depends on web_search results; no citation tracking without persona prompt |
| Continuity | 4 | Memory persistence across sessions is solid |
| Seriousness | 3 | Output quality is generic without persona-specific professional tone guidance |
| Alignment | 3 | Workflow is functional but not consultant-optimized |
| Controlled Power | 4 | Mia directs; agent executes via tools |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | All required tools/features exist. Workspace, memory, search, drafting all functional. |
| Memory support | 4 | Dual-mind architecture (personal + workspace) with FTS5 search, auto-recall, and cross-session persistence. |
| Output quality potential | 3 | Without persona prompt injection, output is generic. With it, would be 4+. |
| Team support | 1 | Mia is SOLO tier. Team features not required. N/A effectively. |

**Overall infrastructure score: 3.5/5**

---

## Key Findings

1. **Persona prompt not wired**: The biggest gap. Mia's workspace can be assigned the "researcher" persona, but the agent never receives the researcher-specific instructions. This means no citation tracking, no structured findings format, no depth-over-breadth preference.

2. **Workspace Now block is strong**: When Mia returns to a workspace, the system builds a structured context block with recent activity, decisions, and progress. This directly serves her "instantly know where I left off" need.

3. **Memory architecture is excellent**: Personal mind + workspace mind separation means Mia's client projects are isolated. Cross-session recall via auto_recall is automatic.

4. **Missing: persona-guided tool filtering**: The `tools` field on each persona lists a tool subset, but `filterToolsForContext()` in `tool-filter.ts` does not reference persona tool lists. All tools are always available regardless of persona.

5. **Starter skills help**: The `/research` and `/catchup` slash commands are available and would serve Mia well for her competitive research workflow.

---

## Recommendations

1. Wire `composePersonaPrompt()` into the chat route's `buildSystemPrompt()` function so persona instructions actually reach the LLM.
2. Use the persona's `tools` field to filter the tool set sent to the agent loop, reducing noise for non-technical users like Mia.
3. Consider adding a "consultant" persona that combines research + writing + memory skills specifically for Mia's archetype.
