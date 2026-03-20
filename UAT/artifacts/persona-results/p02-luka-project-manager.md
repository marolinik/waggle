# P02: Luka -- Project Manager

## Persona Summary

**Role**: PM at a 50-person tech company, manages 3 concurrent projects
**Tech level**: Uses project tools daily, light technical knowledge
**Tier**: SOLO
**Daily tools**: Linear, Slack, Google Meet, Confluence
**Core need**: "Ask the agent what happened on Project X today. Get a draft status update. Track decisions across sprints."
**Emotional priority**: Momentum, Seriousness, Controlled Power

---

## Persona System Analysis

### Matching Persona

Luka maps directly to the **project-manager** persona:
- Tools: `create_plan`, `add_plan_step`, `execute_step`, `show_plan`, `search_memory`, `save_memory`, `read_file`, `search_files`, `write_file`
- Workspace affinity: project, management, coordination, planning
- Suggested commands: `/plan`, `/status`, `/catchup`
- Default workflow: `plan-execute`

### Persona Prompt Content

The project-manager persona system prompt instructs the agent to:
- Break large goals into concrete, actionable tasks
- Track progress and surface blockers proactively
- Create structured status reports with clear next steps
- Use memory to maintain project context across sessions
- Suggest realistic timelines based on task complexity
- Use plans for multi-step work

This is well-designed for Luka but **not injected** (same issue as P01).

---

## Journey Assessment: Sprint Planning (Scenario 13.2)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Workspace memory recall | Yes | Yes | search_memory + auto_recall |
| Task board (creation) | Yes | Yes | Task routes in tasks.ts - CRUD API |
| Cron scheduling | Yes | Yes | Cron routes with full CRUD + trigger |
| Long-form drafting | Yes | Yes | Agent can generate text |
| Decision storage | Yes | Yes | save_memory with importance levels |
| Risk analysis with context | Yes | Partial | Depends on memory quality + persona instructions |

### Task Board Analysis

The task board (`packages/server/src/local/routes/tasks.ts`) supports:
- CRUD operations per workspace (JSONL storage)
- Fields: id, title, status (open/in_progress/done), assignee, creator, timestamps
- Workspace-scoped via URL: `GET/POST /api/workspaces/:id/tasks`

The agent has an `add_task` tool (visible in chat.ts describeToolUse). Tasks can be created programmatically.

### Cron Scheduling Analysis

The cron system (`packages/server/src/local/routes/cron.ts`) supports:
- Full CRUD: create, list, get, update, delete schedules
- Manual trigger: `POST /api/cron/:id/trigger`
- Job types: memory_consolidation, proactive, monthly_assessment
- 5-field cron expressions + shorthands (@daily, @hourly, etc.)
- Agent tools: `create_schedule`, `list_schedules`, `delete_schedule`, `trigger_schedule`

The cron system is fully operational with existing schedules confirmed via API (7 schedules running).

### Plan Tools Analysis

Plan tools exist: `create_plan`, `add_plan_step`, `execute_step`, `show_plan`. These support Luka's sprint planning workflow with structured multi-step work tracking.

### Functional Checkpoint Assessment

- [~] Sprint review from memory -- Auto-recall works, but no persona-guided proactive surfacing
- [~] Task suggestions -- Agent can suggest but lacks PM-specific instructions without persona prompt
- [x] Task creation -- add_task tool + task routes confirmed working
- [x] Cron scheduling -- Fully functional with 7+ existing schedules
- [~] Status update draft -- Generic drafting without PM-specific structure guidance
- [x] Memory save for sprint plan -- save_memory confirmed working
- [~] Risk analysis from context -- Possible but not persona-guided

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 4 | Workspace Now block + auto_recall provide strong context |
| Relief | 3 | Status update drafting works but could be more structured |
| Momentum | 4 | Plan tools + task board + cron = good workflow chain |
| Trust | 3 | Without persona instructions, suggestions may be generic |
| Continuity | 4 | Sprint-over-sprint context persists via memory |
| Seriousness | 3 | Status update quality needs persona-guided professional tone |
| Alignment | 3 | PM workflow tools exist but need persona activation |
| Controlled Power | 4 | Plan tools give Luka structural control |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | Task board, cron scheduling, plan tools, memory -- all present and functional. |
| Memory support | 4 | Strong dual-mind with auto-recall. Decision/sprint context persists. |
| Output quality potential | 3 | Without persona prompt, output lacks PM-specific structure. With persona: 4+. |
| Team support | 1 | Luka's scenario is SOLO tier. Team not required here. |

**Overall infrastructure score: 3.5/5**

---

## Key Findings

1. **Task board is functional but basic**: JSONL storage with open/in_progress/done statuses. No priority field, no due dates, no sprint assignment. Sufficient for basic use but lacks PM-specific fields.

2. **Cron scheduling is production-ready**: Full CRUD with manual trigger, shorthands, and multiple job types. Weekly status report scheduling would work.

3. **Plan tools add real value**: create_plan/add_plan_step/execute_step/show_plan give Luka structured multi-step tracking that ChatGPT cannot offer.

4. **Missing: Sprint/iteration concept**: Tasks exist per workspace but there is no sprint/iteration grouping. Luka cannot query "what was in last sprint" unless sprint boundaries are tracked in memory.

5. **Workspace template available**: The "product-launch" template uses the project-manager persona and includes relevant connectors (github, jira, slack) and suggested commands (/plan, /status, /catchup, /spawn).

---

## Recommendations

1. Wire persona prompts into the chat flow -- the project-manager instructions are well-crafted but unused.
2. Add priority and due_date fields to the task board schema.
3. Consider adding a sprint/iteration concept to the task board for PM workflows.
4. The `/status` command could generate structured status updates automatically by querying tasks + memory.
