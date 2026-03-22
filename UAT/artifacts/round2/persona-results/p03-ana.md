# P03: Ana -- Product Manager (Round 2)

## Persona
**Role**: Product manager, PRD authoring, feature prioritization
**Mapped Persona**: No direct `product-manager` persona. Best fit: `writer` (for PRD drafting) or `project-manager` (for planning). Hybrid use case.
**Tier**: SOLO

## Prompt Sent
"Draft a PRD outline for a new workspace templates feature"

## Infrastructure Verification

### W1.3 Persona Wiring: VERIFIED
- If workspace has `personaId: 'writer'`, writer persona instructions would apply
- Writer persona: ask about audience/tone/purpose, use search_memory, produce well-structured documents, adapt tone, proofread
- If `personaId: 'project-manager'`, PM instructions would apply instead
- Both are wired via `composePersonaPrompt()` at `chat.ts:621-624`

### W3.1 Tool Filtering: VERIFIED
- Writer tools: `read_file`, `write_file`, `edit_file`, `search_files`, `search_memory`, `save_memory`, `generate_docx`
- PM tools: `create_plan`, `add_plan_step`, `execute_step`, `show_plan`, `search_memory`, `save_memory`, `read_file`, `search_files`, `write_file`
- Both exclude bash/git -- appropriate for product role
- Writer includes `generate_docx` for formal PRD export -- advantage over PM persona

### Persona Gap Analysis
- No dedicated `product-manager` persona (distinct from `project-manager`)
- A product manager needs: competitive research (web_search), PRD templates, user story formatting, prioritization frameworks
- Writer persona covers drafting; PM persona covers planning; neither covers competitive research or web_search
- Recommendation: Ana would benefit from researcher or analyst persona for full PRD workflow

### W1.4 Ambiguity Detection: VERIFIED
- System prompt handles vague requests -- would clarify scope/audience for PRD

## Response Evaluation (Code Analysis)

Ana's "Draft a PRD outline for a new workspace templates feature" would:
1. Auto-recall searches for existing workspace templates context (finds it -- templates exist in codebase)
2. Writer persona would ask about audience and tone before drafting
3. Agent can produce structured PRD outline with headings and flow
4. `generate_docx` available for formal document export
5. `search_memory` would surface any prior product discussions

Missing for ideal product management:
- No web_search in writer persona (can't research competitors)
- No prioritization framework tools
- No user story generation templates

## Scores

| Dimension | R1 | R2 | Delta | Rationale |
|---|---|---|---|---|
| Infrastructure readiness | 3 | 4 | +1 | Writer or PM persona works, but no dedicated product persona. Tool set partial. |
| Memory support | 4 | 5 | +1 | Workspace mind stores product decisions, auto-recall surfaces context. |
| Output quality | 3 | 4 | +1 | Persona instructions now active. Writer persona guides structured document creation. |
| Team support | 1 | 1 | 0 | SOLO scenario. N/A. |

**Average: 3.5 (up from 2.75 R1)**

## Verdict
PASS (with gap) -- Persona system is wired and functional. Gap: no dedicated product-manager persona combining drafting + research + prioritization.
