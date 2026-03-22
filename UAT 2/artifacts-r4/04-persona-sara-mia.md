# UAT Round 4 — Persona Journey Tests: Sara (Marketing) & Mia (Agency)

**Date**: 2026-03-21
**Server**: http://localhost:3333
**Model**: claude-sonnet-4-6
**Tester**: Automated UAT Sub-agent 4

---

## Sara — Marketing Manager Journey

### Step 1: Create Workspace
- **API**: `POST /api/workspaces`
- **Request**: `{"name": "Sara UAT Marketing", "group": "Marketing", "description": "Marketing campaign management"}`
- **Response**: `{"id":"sara-uat-marketing","name":"Sara UAT Marketing","group":"Marketing","created":"2026-03-21T19:43:58.540Z"}`
- **Status**: PASS
- **Response quality**: 9/10 — Clean JSON, immediate, includes all expected fields.
- **Persona fit**: 8/10 — Sara would need the UI to do this, but API works perfectly.
- **Notes**: API requires `group` field (not documented in test script). Initial call without `group` returned `{"error":"name and group are required"}`. Minor doc gap.

### Step 2: Create Campaign Brief (`/draft`)
- **API**: `POST /api/chat` with `/draft Write a campaign brief...`
- **Status**: PARTIAL
- **Response quality**: 3/10 (slash command) / 9/10 (plain message)
- **Persona fit**: 8/10 (when using plain message)
- **Notes**:
  - `/draft` slash command returned only a **prompt echo**, not an actual draft: `"## Draft Prompt\n\nPlease draft the following:\n\n**Write a campaign brief...**\n\n_Tip: A review workflow is not available. The agent will draft directly._"`
  - **Root cause**: The `/draft` command calls `ctx.runWorkflow('review-pair', ...)` which is not wired up in the local server context. Falls back to returning a static template string.
  - **Retry without slash command**: Agent successfully generated a comprehensive campaign brief including target audience analysis, messaging pillars, channel strategy, budget allocation, and timeline. Also generated a DOCX file at `marketing/waggle-early-adopter-campaign-brief.docx`.
  - **Finding F1**: `/draft` slash command is non-functional in local server context (workflow runner unavailable). Sara would be confused by the prompt echo response.
  - The agent leveraged prior memory (Q2 revenue target of $150K MRR) to enrich the brief — impressive context-awareness.

### Step 3: Research Competitors (`/research`)
- **API**: `POST /api/chat` with `/research What are the main competitors...`
- **Status**: PARTIAL
- **Response quality**: 2/10 (slash command) / 8/10 (plain message)
- **Persona fit**: 7/10 (when using plain message)
- **Notes**:
  - `/research` slash command returned: `"Workflow runner is not available in this context."`
  - **Root cause**: Same as `/draft` — `ctx.runWorkflow` is not provided in the chat route context.
  - **Retry without slash command**: Agent performed web_search for competitor pricing, fetched Notion pricing page, and began building a competitive analysis. Used `search_memory` to check existing knowledge.
  - **Finding F2**: `/research` slash command is non-functional in local server context. Returns a terse error message with no fallback behavior.
  - Agent attempted real web research (web_search + web_fetch tools) — good capability demonstration.

### Step 4: Draft Social Posts
- **API**: `POST /api/chat` (plain message, no slash command)
- **Status**: PASS
- **Response quality**: 8/10
- **Persona fit**: 8/10
- **Notes**:
  - Agent searched memory for Waggle context before drafting.
  - Generated 3 LinkedIn posts with distinct tones (professional/thought-leader, personal story, technical).
  - Incorporated specific product details from memory (417 tests, persistent memory architecture).
  - Posts included relevant hashtags as requested.
  - Good contextual awareness — pulled real product data from workspace memory.

### Step 5: Save Campaign Insight to Memory
- **API**: `POST /api/chat`
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10
- **Notes**:
  - Memory saved successfully: `"Memory saved to personal mind (importance: important, source: user_stated, confidence: medium, entities: 0, relations: 0)"`
  - Agent acknowledged the insight and added context about why persistent memory is a strong differentiator.
  - Tool used: `save_memory`
  - Usage: inputTokens: 53479, outputTokens: 185
  - **Minor note**: No entities or relations extracted from the memory. Could be improved — "Notion AI", "Copilot" should be extracted as entities.

---

## Sara Journey Summary

| Step | Status | Quality | Persona Fit |
|------|--------|---------|-------------|
| 1. Create workspace | PASS | 9/10 | 8/10 |
| 2. Campaign brief (/draft) | PARTIAL | 3/10 -> 9/10 | 8/10 |
| 3. Research competitors (/research) | PARTIAL | 2/10 -> 8/10 | 7/10 |
| 4. Draft social posts | PASS | 8/10 | 8/10 |
| 5. Save campaign insight | PASS | 9/10 | 9/10 |

**Overall Sara Score**: 7.2/10
**Would Sara find this useful?**: Yes, with caveats. The plain-message agent responses are excellent — contextual, detailed, and actionable. However, the slash commands `/draft` and `/research` are broken, which would confuse a marketing user who follows the suggested commands. Sara would quickly learn to use plain language instead.

---

## Mia — Agency Owner Journey

### Step 1: Create Client Alpha Corp Workspace
- **API**: `POST /api/workspaces`
- **Request**: `{"name": "Mia Client Alpha Corp", "group": "Consulting", "description": "Alpha Corp consulting engagement"}`
- **Response**: `{"id":"mia-client-alpha-corp","name":"Mia Client Alpha Corp","group":"Consulting","created":"2026-03-21T19:44:05.406Z"}`
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10 — Mia would appreciate clean workspace separation per client.

### Step 2: Create Client Beta Inc Workspace
- **API**: `POST /api/workspaces`
- **Request**: `{"name": "Mia Client Beta Inc", "group": "Consulting", "description": "Beta Inc consulting engagement"}`
- **Response**: `{"id":"mia-client-beta-inc","name":"Mia Client Beta Inc","group":"Consulting","created":"2026-03-21T19:44:07.141Z"}`
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10

### Step 3: Save Alpha Corp Confidential Data
- **API**: `POST /api/chat` in workspace `mia-client-alpha-corp`
- **Message**: "Save to memory: Alpha Corp engagement key facts: CEO is John Smith, budget is $500K, timeline is 6 months, primary deliverable is digital transformation roadmap. CONFIDENTIAL."
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10
- **Notes**:
  - Memory saved with high confidence: `"Memory saved to personal mind (importance: important, source: user_stated, confidence: high, entities: 2, relations: 1)"`
  - Good entity extraction: 2 entities + 1 relation detected.
  - Agent confirmed save and acknowledged confidentiality.

### Step 4: Save Beta Inc Confidential Data
- **API**: `POST /api/chat` in workspace `mia-client-beta-inc`
- **Message**: "Save to memory: Beta Inc engagement key facts: CTO is Maria Chen, budget is $200K, timeline is 3 months, primary deliverable is AI integration strategy. CONFIDENTIAL."
- **Status**: PARTIAL (functional but with isolation concern)
- **Response quality**: 7/10
- **Persona fit**: 6/10
- **Notes**:
  - Memory saved successfully with entities extracted.
  - **ISOLATION WARNING**: The `auto_recall` step (which runs automatically before every response) returned Alpha Corp data while operating in the Beta Inc workspace: `"Alpha Corp engagement key facts: CEO is John Smith, budget is $500K..."` appeared in recalled memories.
  - **Agent cross-contamination**: The agent's response said: "similar to your Alpha Corp engagement details" — it referenced Alpha Corp data while operating in the Beta workspace. Mia would be alarmed.
  - **Finding F3 (CRITICAL)**: Memory auto_recall does not filter by workspace. All memories are stored in a single "personal mind" and recalled regardless of which workspace the user is operating in.

### Step 5: Isolation Test — Ask About Alpha Corp from Beta Workspace
- **API**: `POST /api/chat` in workspace `mia-client-beta-inc`
- **Message**: "What do you know about Alpha Corp? What is their budget and who is their CEO?"
- **Status**: **FAIL** (CRITICAL)
- **Response quality**: N/A (correct behavior would be to NOT know)
- **Persona fit**: 1/10 — This is a dealbreaker for agency use.
- **Isolation test result**: **FAIL — DATA LEAKED**
- **Notes**:
  - The agent fully disclosed Alpha Corp's confidential data from the Beta workspace:
    ```
    **Alpha Corp Engagement Details:**
    - **CEO**: John Smith
    - **Budget**: $500,000
    - **Timeline**: 6 months
    - **Primary Deliverable**: Digital transformation roadmap
    - **Status**: CONFIDENTIAL engagement
    ```
  - Both `auto_recall` and `search_memory` returned Alpha Corp data when queried from the Beta workspace.
  - The agent did not hesitate or caveat — it presented the data as if it belonged to the current workspace.
  - **Finding F4 (CRITICAL — SEVERITY: BLOCKER)**: Workspace memory isolation is not enforced. All memories are stored in and recalled from a shared personal mind. There is no workspace-level memory partitioning. This means:
    - Client A's confidential data is visible from Client B's workspace
    - An agency user cannot safely use separate workspaces for different clients
    - The "workspace-native" promise of the product is violated for memory
  - **Root cause hypothesis**: The `save_memory` and `search_memory` tools operate on the personal `.mind` file, which is shared across all workspaces. There is no workspace-scoped mind or memory filtering.

### Step 6: Verify Alpha Corp Context in Own Workspace
- **API**: `POST /api/chat` in workspace `mia-client-alpha-corp`
- **Message**: "What do you know about Alpha Corp? What is their budget and who is their CEO?"
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10
- **Notes**:
  - Agent correctly recalled all Alpha Corp details in its own workspace.
  - Response: CEO John Smith, budget $500K, timeline 6 months, digital transformation roadmap.
  - This confirms the data IS stored — the problem is it's also accessible from other workspaces.

### Step 7: Generate Client Report
- **API**: `POST /api/chat` in workspace `mia-client-alpha-corp`
- **Status**: PASS
- **Response quality**: 9/10
- **Persona fit**: 9/10
- **Notes**:
  - Agent searched memory for Alpha Corp context and found the engagement details.
  - Generated a comprehensive DOCX report at `reports/alpha-corp-weekly-status-report.docx` with:
    - Executive summary with budget utilization (18% of $500K)
    - Progress summary with completed activities
    - Key milestones table
    - Used CEO name (John Smith) correctly
  - The report was professional quality with realistic consulting content.
  - Agent correctly used `generate_docx` tool for professional document output.
  - **Minor concern**: Report contained fabricated progress data (stakeholder interviews, readiness assessments) since we only stored basic facts. The agent filled in realistic but fictional details. This is expected behavior for a draft but should be noted.

### Step 8: Check Costs
- **API**: `GET /api/costs`
- **Status**: FAIL
- **Response quality**: 1/10
- **Response**: `{"error":"Not found"}`
- **Persona fit**: N/A
- **Notes**:
  - **Finding F5**: The `/api/costs` endpoint is not registered or returns 404. An agency owner would want to track API costs per client workspace.

---

## Mia Journey Summary

| Step | Status | Quality | Persona Fit | Isolation |
|------|--------|---------|-------------|-----------|
| 1. Create Alpha Corp workspace | PASS | 9/10 | 9/10 | N/A |
| 2. Create Beta Inc workspace | PASS | 9/10 | 9/10 | N/A |
| 3. Save Alpha Corp data | PASS | 9/10 | 9/10 | N/A |
| 4. Save Beta Inc data | PARTIAL | 7/10 | 6/10 | WARNING |
| 5. Isolation test (Alpha from Beta) | **FAIL** | N/A | 1/10 | **LEAKED** |
| 6. Verify Alpha in own workspace | PASS | 9/10 | 9/10 | OK |
| 7. Generate client report | PASS | 9/10 | 9/10 | N/A |
| 8. Check costs | FAIL | 1/10 | N/A | N/A |

**Overall Mia Score**: 5.5/10
**Would Mia find this useful?**: No, not until workspace memory isolation is fixed. The workspace creation and content generation capabilities are excellent, but the lack of memory isolation is a **blocker** for any agency or multi-client use case. Mia cannot safely store confidential client data if it leaks between workspaces.

---

## Findings Summary

### Critical / Blocker

| ID | Finding | Severity | Affected Persona |
|----|---------|----------|-----------------|
| F4 | **Workspace memory isolation is not enforced** — memories saved in one workspace are fully visible from other workspaces via auto_recall and search_memory. Client data leaks between workspaces. | BLOCKER | Mia (agency), any multi-workspace user |
| F3 | **auto_recall does not filter by workspace** — the pre-response memory recall returns all memories regardless of workspace context | CRITICAL | Mia |

### High

| ID | Finding | Severity | Affected Persona |
|----|---------|----------|-----------------|
| F1 | `/draft` slash command non-functional — returns prompt echo instead of draft because workflow runner is unavailable in local server context | HIGH | Sara |
| F2 | `/research` slash command non-functional — returns "Workflow runner is not available in this context" | HIGH | Sara |

### Medium

| ID | Finding | Severity | Affected Persona |
|----|---------|----------|-----------------|
| F5 | `/api/costs` endpoint returns 404 — cost tracking unavailable | MEDIUM | Mia |
| F6 | Entity extraction inconsistent — "Notion AI" and "Copilot" not extracted as entities from campaign insight memory | LOW | Sara |
| F7 | Agent fabricates progress details in status reports when only basic facts are stored — expected but worth noting for agency use | LOW | Mia |

### Workspace API Note
- The `POST /api/workspaces` endpoint requires a `group` field that is not documented in the test script. The error message `"name and group are required"` is clear, but the test instructions should include the `group` parameter.

---

## Architecture Analysis: Memory Isolation Gap

The root cause of the critical isolation failure is architectural:

1. **Single personal mind**: All workspaces share one `.mind` SQLite file (`~/.waggle/default.mind`)
2. **No workspace scoping**: The `save_memory` tool stores memories without workspace metadata, or if it does, the retrieval (`search_memory`, `auto_recall`) does not filter by workspace
3. **Design intent vs reality**: The CLAUDE.md states "Personal mind and workspace mind are distinct" as a Product Truth, but the current implementation appears to use only a personal mind with no workspace-level partitioning

### Recommended Fix
- Add `workspaceId` column to memory frames table
- Filter `auto_recall` and `search_memory` results by current workspace
- Consider: should some memories (user preferences, personal facts) be global while workspace-specific data stays isolated?

---

## Overall Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| Workspace creation | 9/10 | Fast, clean, well-structured |
| Memory save | 8/10 | Works but no isolation |
| Memory recall | 4/10 | Functionally works but violates isolation |
| Content generation | 9/10 | Excellent quality, contextual, DOCX output |
| Slash commands | 3/10 | /draft and /research non-functional |
| Workspace isolation | 1/10 | BLOCKER — data leaks between workspaces |
| Cost tracking | 0/10 | Endpoint missing |
| **Overall** | **5.5/10** | Strong content generation, critical isolation gap |

**Bottom line**: The agent's content generation and memory capabilities are genuinely impressive. Sara would find the plain-language interactions highly useful for marketing work. However, the workspace memory isolation failure is a fundamental product issue that blocks the multi-client agency use case (Mia) and contradicts the core "workspace-native" product promise.
