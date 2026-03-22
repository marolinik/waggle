# P05: Sara -- Marketing Manager (Round 2)

## Persona
**Role**: Marketing manager, content creation, campaign planning
**Mapped Persona**: `marketer` (direct match)
**Tier**: SOLO

## Prompt Sent
"Draft a social media content plan for our product launch"

## Infrastructure Verification

### W1.3 Persona Wiring: VERIFIED
- `marketer` persona at `personas.ts:168-185` -- instructions: create content aligned with brand voice, plan campaigns with goals/channels/metrics, research trends, draft social posts/blog outlines/email sequences, consider SEO, save brand guidelines to memory
- Composed into system prompt via `composePersonaPrompt()` at `chat.ts:621-624`

### W3.1 Tool Filtering: VERIFIED
- Marketer tools: `web_search`, `web_fetch`, `search_memory`, `save_memory`, `read_file`, `write_file`, `generate_docx`
- Excluded: `bash`, `git_*`, `edit_file`, `search_content` -- correct for marketing role
- Includes web_search for trend research -- essential for marketing
- Includes generate_docx for formal content plan export

### W3.2 Disclaimers: NOT APPLICABLE
- Marketing persona has no disclaimer -- correct (not regulated)

### W3.4 Mandatory Recall: NOT PRESENT
- Not a regulated persona -- acceptable
- Auto-recall still surfaces brand guidelines and prior campaign data

### Workspace Template: MATCHED
- `marketing-campaign` template uses `marketer` persona with Slack + email connectors
- Commands: /draft, /research, /plan, /catchup
- Starter memory includes campaign goals and workflow guidance

## Response Evaluation (Code Analysis)

Sara's "Draft a social media content plan for our product launch" would:
1. Auto-recall searches for product launch context and brand guidelines
2. Marketer persona instructs: plan campaigns with clear goals, channels, and success metrics
3. Agent considers SEO, audience targeting, and trending topics (persona instruction)
4. Drafts social media posts, content calendar, and channel strategy
5. Can export via generate_docx for formal content plan
6. Saves brand guidelines and campaign data to workspace memory

Strong match: the marketer persona's instructions explicitly cover social media posts, campaign planning, and audience research.

## Scores

| Dimension | R1 | R2 | Delta | Rationale |
|---|---|---|---|---|
| Infrastructure readiness | 4 | 5 | +1 | Full tool set for marketing. Web search, docx export, memory. |
| Memory support | 4 | 5 | +1 | Brand voice persists, campaign data accumulates, auto-recall surfaces context. |
| Output quality | 3 | 4 | +1 | Marketer persona now guides: campaign structure, SEO, brand alignment. |
| Team support | 1 | 1 | 0 | SOLO scenario. N/A. |

**Average: 3.75 (up from 3.0 R1)**

## Verdict
PASS -- Strong persona-use case alignment. Marketing campaign template provides additional structure.
