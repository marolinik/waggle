# P10: Marketing Agency Lead

## Persona Summary

**Role**: Lead at a marketing agency managing multiple client accounts, content calendars, competitive research, and team collaboration
**Tech level**: Moderate -- uses marketing SaaS tools extensively
**Tier**: SOLO (with TEAMS potential for agency team)
**Core need**: Content calendar generation across clients, competitive research, multi-audience drafting, team sharing
**Emotional priority**: Momentum, Alignment, Controlled Power

---

## Persona System Analysis

### Matching Persona

The Marketing Agency Lead maps to the **marketer** persona:
- Tools: web_search, web_fetch, search_memory, save_memory, read_file, write_file, generate_docx
- Workspace affinity: marketing, content, social-media, brand
- Suggested commands: /draft, /research

### Key Difference from P05 (Sara)

While Sara is a single-company marketing manager, the Agency Lead manages MULTIPLE client accounts. This requires:
- Multiple workspaces (one per client)
- Client-specific brand voice per workspace
- No cross-client contamination
- Potentially team collaboration on shared client accounts

---

## Journey Assessment

### Multi-Client Workspace Architecture

Waggle's workspace model directly supports the agency use case:
- Each client gets its own workspace with isolated .mind database
- Brand voice, content calendar, and competitive intelligence are per-workspace
- Workspace switching is supported via API
- No cross-contamination between client workspaces

Example workspace structure:
- "Client: Acme Corp -- Q2 Campaign" (marketer persona, brand voice stored)
- "Client: TechStart -- Product Launch" (marketer persona, different brand voice)
- "Agency Internal -- Strategy" (analyst persona, agency-level insights)

### Content Calendar Generation

The task board serves as a basic content calendar:
- Tasks per workspace (per client)
- Status tracking: open -> in_progress -> done
- No calendar view or scheduling beyond task titles
- Cron scheduling can trigger weekly reviews per workspace

### Competitive Research

Research capabilities:
- web_search + web_fetch for competitor analysis
- Premium search (Tavily, Brave) available with API keys
- Findings saved to workspace memory for per-client intelligence
- Research skill (/research command) available

### Multi-Audience Drafting

The agent can adapt tone for different audiences:
- Brand voice stored in workspace memory per client
- Agent can draft blog posts, social media, email sequences
- generate_docx for formal deliverables
- No multi-format output (e.g., simultaneous blog + LinkedIn + email)

### Required Capabilities Assessment

| Capability | Required | Present | Status |
|---|---|---|---|
| Multi-workspace (per client) | Yes | Yes | Full workspace management |
| Client-specific brand voice | Yes | Yes | Memory per workspace |
| Content calendar | Yes | Partial | Task board as basic calendar (no dates) |
| Competitive research | Yes | Yes | web_search + memory persistence |
| Multi-audience drafting | Yes | Partial | Manual per-draft; no batch generation |
| Team sharing | Yes | Partial | TEAMS tier exists but requires team server |
| Cross-client analytics | No | No | No agency-level dashboard |
| Client reporting | Yes | Yes | generate_docx for reports |

### Emotional Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 4 | Workspace-per-client is intuitive for agency model |
| Relief | 3 | Content generation works but no batch/campaign tools |
| Momentum | 3 | End-to-end per-client flow works; cross-client workflow is manual |
| Trust | 3 | Research quality depends on web search; brand voice recall varies |
| Continuity | 4 | Per-client context persists excellently |
| Seriousness | 3 | Output quality is professional but generic |
| Alignment | 3 | Agency workflow partially supported; no agency-specific features |
| Controlled Power | 4 | Agency lead directs per-client strategy; agent executes |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | Multi-workspace model is perfect for agency use. Memory, search, drafting all present. |
| Memory support | 4 | Per-client memory isolation is strong. Brand voice persistence works. |
| Output quality potential | 3 | Marketer persona (if wired) would help. No agency-specific batch tools. |
| Team support | 2 | TEAMS tier exists but requires separate infrastructure. Agency team sharing is possible but complex. |

**Overall infrastructure score: 3.25/5**

---

## Key Findings

1. **Multi-workspace model is perfectly suited for agencies**: One workspace per client with isolated memory is exactly what an agency needs. This is a natural fit.

2. **No batch content generation**: An agency lead wants to generate content calendars across multiple clients efficiently. Currently, each client workspace must be addressed separately.

3. **Marketing workspace template available**: The marketing-campaign template provides a good starting point with marketer persona and relevant starter memory.

4. **Team collaboration requires TEAMS tier**: If the agency has multiple team members working on client accounts, they need the team server infrastructure. This adds deployment complexity.

5. **No agency-level dashboard**: There is no cross-workspace view showing status across all client accounts. The agency lead must switch between workspaces to check each client.

---

## Recommendations

1. Wire marketer persona prompt for brand-voice-first drafting behavior.
2. Create an "agency" workspace group concept that lets the lead see status across all client workspaces.
3. Add batch content generation -- "generate this week's social posts for all clients" workflow.
4. Add campaign/calendar view for the task board.
5. Consider a simplified team-sharing model for agencies (no full team server required).
