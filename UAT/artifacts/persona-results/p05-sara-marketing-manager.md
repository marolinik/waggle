# P05: Sara -- Marketing Manager

## Persona Summary

**Role**: Leads content marketing at a B2B company
**Tech level**: Non-technical, uses SaaS tools
**Tier**: SOLO
**Daily tools**: HubSpot, Canva, Google Analytics, Slack, WordPress
**Core need**: "Draft blog posts in our brand voice. Maintain a competitive intelligence workspace. Track content performance insights."
**Emotional priority**: Alignment, Relief, Seriousness

---

## Persona System Analysis

### Matching Persona

Sara maps directly to the **marketer** persona:
- Tools: `web_search`, `web_fetch`, `search_memory`, `save_memory`, `read_file`, `write_file`, `generate_docx`
- Workspace affinity: marketing, content, social-media, brand
- Suggested commands: `/draft`, `/research`
- Default workflow: null

### Persona Prompt Content

The marketer persona instructs the agent to:
- Create content aligned with brand voice and target audience
- Plan campaigns with clear goals, channels, and success metrics
- Research trending topics and competitor content strategies
- Draft social media posts, blog outlines, and email sequences
- Consider SEO when creating web content
- Save brand guidelines and campaign performance data to memory

This is well-tailored for Sara but **not injected** into the chat flow.

### Workspace Template

The **marketing-campaign** template exists:
- Persona: marketer
- Connectors: slack, email
- Suggested commands: /draft, /research, /plan, /catchup
- Starter memory: "This workspace manages marketing campaigns and content creation."

---

## Journey Assessment: Content Creation Pipeline (Scenario 13.5)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Brand voice memory | Yes | Yes | save_memory can store brand guidelines |
| Blog post drafting | Yes | Yes | Agent can generate long-form text |
| Competitor content analysis | Yes | Yes | web_search + web_fetch for research |
| Content calendar as tasks | Yes | Yes | Task board with CRUD API |
| Cron scheduling | Yes | Yes | Cron routes with full CRUD |
| Cross-session memory retention | Yes | Yes | Memory persists in .mind SQLite |
| Non-technical UX | Yes | Partial | Agent UX is chat-based; no marketing-specific UI |

### Brand Voice Persistence

Sara's core need is brand voice persistence. The system supports this:
1. Sara saves brand voice description to memory: `save_memory("Our brand voice is professional but approachable...")`
2. Auto-recall on subsequent messages will surface the brand voice when relevant
3. Personal mind stores cross-workspace preferences; workspace mind stores brand-specific context

However, there is no "brand voice" as a first-class concept. It is stored as a regular memory frame, and the agent must be explicitly told to search for it before drafting.

### Content Calendar as Tasks

The task board can serve as a basic content calendar:
- Create tasks with titles like "Blog: Why B2B Thought Leadership (Week 1)"
- Status tracking: open -> in_progress -> done
- No due_date field in the current schema (only createdAt/updatedAt)
- No assignee concept beyond the string field

### Functional Checkpoint Assessment

- [x] Brand voice stored in memory -- save_memory works for text storage
- [~] Blog draft matches brand voice -- Auto-recall may surface brand voice, but no guarantee
- [~] Competitor analysis actionable -- web_search quality varies; no SEO-specific tools
- [x] Content calendar tasks created -- Task board CRUD works
- [x] Cron scheduling succeeds -- Weekly review schedule creatable
- [x] Memory save for draft and strategy -- save_memory confirmed
- [~] Context retention on reopen -- Workspace Now block + auto_recall, but content calendar is in tasks not memory

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Chat-based UX works but no marketing-specific dashboard |
| Relief | 4 | Blog draft + competitor analysis + calendar in one session |
| Momentum | 4 | End-to-end content pipeline from idea to scheduled review |
| Trust | 3 | Blog quality depends on brand voice recall; may need manual prompting |
| Continuity | 4 | Brand voice and content strategy persist across sessions |
| Seriousness | 3 | Output quality is generic without marketer persona instructions |
| Alignment | 3 | Non-technical user can use chat, but no content-specific UI |
| Controlled Power | 4 | Sara sets direction; agent handles execution |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | All required features present: web search, memory, tasks, cron, docx generation. |
| Memory support | 4 | Brand voice can persist. Cross-session recall works. |
| Output quality potential | 3 | Without marketer persona prompt, agent lacks brand-voice-first drafting behavior. |
| Team support | 1 | SOLO tier. N/A. |

**Overall infrastructure score: 3.5/5**

---

## Key Findings

1. **Marketer persona is well-designed**: Instructions cover brand voice, SEO, campaign planning. But unused in runtime.

2. **Marketing workspace template exists**: "marketing-campaign" template with marketer persona, starter memory, and relevant commands. Good onboarding path for Sara.

3. **Task board works as basic content calendar**: But lacks due_date, priority, and category fields that a content calendar needs.

4. **Brand voice is not a first-class concept**: It is stored as a generic memory frame. The agent has no built-in "apply brand voice" behavior without persona instructions.

5. **Document generation (docx) is valuable**: Sara can export blog posts and strategy documents as Word files for stakeholder review.

6. **No HubSpot/WordPress connector**: Sara's daily tools include HubSpot and WordPress. The connector registry includes a HubSpot connector (`hubspot-connector.ts`) but connectors are in early implementation stage.

---

## Recommendations

1. Wire marketer persona prompt to inject brand-voice-first behavior.
2. Add a "brand voice" first-class memory type that is automatically surfaced for all drafting tasks.
3. Add due_date and category fields to the task board for content calendar use.
4. Create a `/draft blog` skill template with brand voice pre-check.
5. Activate the HubSpot connector for marketing workspace templates.
