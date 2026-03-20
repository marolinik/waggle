# P06: David -- HR Manager

## Persona Summary

**Role**: HR lead at a growing company (80 to 150 people)
**Tech level**: Basic, uses HR platforms
**Tier**: SOLO
**Daily tools**: BambooHR, Slack, Google Docs, email
**Core need**: "Onboarding checklist that adapts. Policy knowledge base. Interview question generator. Track organizational insights."
**Emotional priority**: Seriousness, Trust, Relief

---

## Persona System Analysis

### Matching Persona

David has no direct persona match. The closest candidates:
- **Executive Assistant**: Email drafting, meeting prep, correspondence. Missing: policy management, checklist generation.
- **Writer**: Document drafting, formatting. Missing: HR-domain awareness.

Neither persona is optimized for HR workflows (policy management, onboarding, compliance).

### Gap: No HR Persona

The 8 defined personas do not include an HR persona. This is a significant gap for David's journey, as HR work has specific requirements:
- Policy accuracy and consistency (answers must come from stored policies, not general knowledge)
- Legal compliance awareness
- Onboarding workflow structure
- Interview process management

---

## Journey Assessment: Onboarding Workflow (Scenario 13.6)

### Required Capabilities

| Capability | Required | Present | Status |
|---|---|---|---|
| Task board (checklist) | Yes | Yes | Tasks with open/in_progress/done status |
| Long-form drafting (email) | Yes | Yes | Agent can generate professional emails |
| Policy memory save | Yes | Yes | save_memory with importance levels |
| In-session policy recall | Yes | Yes | search_memory + auto_recall |
| Cross-session policy recall | Yes | Yes | Memory persists in .mind SQLite |
| Answers cite stored policy | Yes | Partial | Agent may cite memory but no enforced behavior |

### Policy Memory Architecture

David's scenario is a critical test of memory accuracy. The system supports:

1. **Save policies**: `save_memory("Our PTO policy is 25 days per year, accrued monthly")` stores as a memory frame.
2. **In-session recall**: When David asks "How many PTO days?", auto_recall searches memory before the agent responds.
3. **Cross-session recall**: Memory persists in SQLite. Reopening the workspace and asking the same question should retrieve the stored policy.

**Critical concern**: The agent has no enforced behavior to prefer stored policies over general knowledge. Without persona instructions saying "always cite stored company policies rather than general HR knowledge," the agent might mix its training data with stored facts.

### Onboarding Checklist as Tasks

The task board can serve as an onboarding checklist:
- Create tasks: "Set up laptop (Week 1)", "Schedule 1:1 with manager (Day 1)", etc.
- Track status: open -> in_progress -> done
- No due_date field relative to a start date (the scenario asks for "due dates relative to the start date")

### Functional Checkpoint Assessment

- [x] Onboarding checklist generated -- Agent can create structured checklists
- [~] Tasks with due dates -- Task board lacks due_date field; titles can include dates
- [x] Welcome email is professional -- Agent drafting capability confirmed
- [x] Policy memory save -- save_memory works
- [~] In-session policy from memory -- Auto_recall works but no "cite policy" enforcement
- [~] Cross-session policy recall -- Memory persists but policy-vs-general-knowledge distinction unclear
- [~] Answers cite stored policy -- No enforced behavior; agent may use training data instead

### Emotional Checkpoint Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Chat UX works but no HR-specific dashboard or workflow |
| Relief | 4 | Checklist + email draft generated quickly |
| Momentum | 3 | Onboarding prep can be completed in one session |
| Trust | 2 | Policy accuracy is CRITICAL for HR. No guarantee agent cites stored policies vs. general knowledge |
| Continuity | 4 | Policies persist across sessions via memory |
| Seriousness | 3 | Output is professional but generic without HR domain guidance |
| Alignment | 2 | No HR persona; workflow requires manual adaptation |
| Controlled Power | 3 | David defines policies; agent storage is reliable but recall may not be |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 3 | Basic tools present but no HR-specific features (policy management, compliance tracking). |
| Memory support | 4 | Policy storage and recall infrastructure is solid. Cross-session persistence works. |
| Output quality potential | 2 | No HR persona. Risk of mixing stored policies with general HR knowledge. |
| Team support | 1 | SOLO tier. N/A. |

**Overall infrastructure score: 2.75/5**

---

## Key Findings

1. **No HR persona is a significant gap**: David's workflow requires domain-specific behavior that no existing persona covers. Policy accuracy is critical in HR contexts -- wrong answers about PTO or benefits create real liability.

2. **Memory-as-policy-store works but lacks enforcement**: The memory system can store policies, but nothing forces the agent to prefer stored policies over its general training data. This is the highest-risk finding for David's journey.

3. **Task board lacks relative dating**: David needs "Week 1 tasks" and "Month 1 tasks" -- the task board has no due_date field to support this.

4. **No onboarding template**: There is no workspace template optimized for HR. The starter memory and suggested commands would need to be manually configured.

5. **Auto-recall helps but is not sufficient**: When David asks "What's our PTO policy?", auto_recall will search for "PTO policy" in memory. But the agent's response may blend stored facts with general HR knowledge without distinguishing between them.

---

## Recommendations

1. Create an HR persona with strict instructions: "Always search memory for company policies before answering. Explicitly cite stored policies. Never mix general HR knowledge with stored company policies."
2. Add a "policy" frame type or importance level that triggers mandatory recall.
3. Create an HR/onboarding workspace template with starter memory for common policy categories.
4. Add due_date and relative_offset fields to the task board for onboarding workflows.
5. Consider a "policy verification" feature that shows the user which stored policy was used in the response.
