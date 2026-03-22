# P10: Marketing Agency Lead (Round 2)

## Persona
**Role**: Agency lead managing multiple client accounts, content calendars, competitive research
**Mapped Persona**: `marketer` (direct match, same as P05 Sara but multi-client)
**Tier**: SOLO with TEAMS potential (sector persona)

## Prompt Sent
"Build a 4-week content calendar for Instagram + LinkedIn"

## Infrastructure Verification

### W1.3 Persona Wiring: VERIFIED
- `marketer` persona at `personas.ts:168-185`
- Instructions: create content aligned with brand voice, plan campaigns with goals/channels/metrics, research trending topics, draft social media posts, consider SEO, save brand guidelines to memory
- Composed into system prompt via `composePersonaPrompt()` at `chat.ts:621-624`

### W3.1 Tool Filtering: VERIFIED
- Marketer tools: `web_search`, `web_fetch`, `search_memory`, `save_memory`, `read_file`, `write_file`, `generate_docx`
- Includes web_search for trend research -- essential for content calendar
- Includes generate_docx for formal calendar export
- Excluded: bash, git -- appropriate

### W3.2 Disclaimers: NOT APPLICABLE
- Marketing is not a regulated domain -- correct

### W3.4 Mandatory Recall: NOT PRESENT
- Marketer persona has no MANDATORY RECALL
- Auto-recall still fires on every turn
- For agency lead, mandatory recall would help surface client-specific brand voice -- minor gap

### Multi-Client Architecture

The agency lead's key differentiator vs P05 (Sara) is multi-client workspace management:

| Feature | Support | Evidence |
|---|---|---|
| Per-client workspaces | Strong | Separate .mind DB per workspace |
| Client brand voice isolation | Strong | Memory stored per workspace, no cross-contamination |
| Content calendar per client | Moderate | Memory + write_file; no dedicated calendar tool |
| Cross-client switching | Strong | Workspace API supports switching |
| Team collaboration on clients | Weak | Team server exists but limited in V1 |

### Workspace Template: MATCHED
- `marketing-campaign` template uses `marketer` persona with Slack + email connectors
- Each client account would get its own workspace from this template
- Starter memory customized per client

## Response Evaluation (Code Analysis)

"Build a 4-week content calendar for Instagram + LinkedIn" would:
1. Auto-recall searches for brand guidelines, prior content, and audience data
2. Marketer persona instructs: plan with clear goals, channels, success metrics
3. `web_search` for trending topics and competitor content strategies
4. Agent produces structured 4-week calendar with platform-specific content
5. `generate_docx` exports formal content calendar document
6. `save_memory` stores calendar and brand decisions for future reference

Agency-specific considerations:
- Multiple workspaces allow per-client content calendars without cross-contamination
- Brand voice stored in workspace memory carries across sessions
- Content calendar can be refined iteratively with memory accumulation

## Scores

| Dimension | R1 | R2 | Delta | Rationale |
|---|---|---|---|---|
| Infrastructure readiness | 4 | 5 | +1 | Full marketer tool set. Multi-workspace architecture serves agency model. |
| Memory support | 4 | 5 | +1 | Per-client isolation, brand voice persistence, auto-recall. |
| Output quality | 3 | 4 | +1 | Marketer persona now guides: campaign structure, multi-channel planning, trend research. |
| Team support | 2 | 2 | 0 | Team features limited in V1. Agency team collab is V1.1+ item. |

**Average: 4.0 (up from 3.25 R1)**

## Verdict
PASS -- Strong fit. Marketer persona + multi-workspace architecture directly serves agency model. Content calendar generation well-supported.
