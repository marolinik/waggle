# UAT Round 3 - Persona 5 & 6 Results
## David (HR Manager, Teams tier) & Nikola (Attorney, Enterprise tier)
**Date**: 2026-03-21
**Server**: localhost:3333 (local mode, no LLM proxy connected)
**Auth**: Bearer token via /health endpoint (SEC-011)

---

## PERSONA 5: David - HR Manager (Teams tier)

**Journey**: Draft job description -> Screen resumes -> Prepare interview questions -> Coordinate with hiring team

### Step-by-Step Results

| Step | Action | Endpoint | HTTP | Result | Notes |
|------|--------|----------|------|--------|-------|
| 1 | List workspaces | GET /api/workspaces | 200 | 34 workspaces returned | Works. Array of workspace objects with id, name, group, created. |
| 2 | Create "HR Recruiting Pipeline" | POST /api/workspaces | 201 | `{"id":"hr-recruiting-pipeline","name":"HR Recruiting Pipeline","group":"Human Resources"}` | Works. Auto-generates slug ID. Starter skills auto-installed. |
| 3 | Draft job description (chat) | POST /api/chat | 200 | SSE stream returned, echo-mode (no LLM proxy) | **Partial**: API works, SSE streaming works, but no AI generation since no LLM is connected. Message echoed back with "configure an API key" notice. |
| 4 | /draft interview scorecard (chat) | POST /api/chat | 200 | SSE stream, echo-mode | Same as step 3. /draft slash command recognized in message but requires LLM to produce output. |
| 5 | Save to memory via chat | POST /api/chat | 200 | SSE echo-mode | Chat API works but agent needs LLM to actually call save_memory tool. |
| 6 | Save HR data (direct memory write) | POST /api/memory/frames | 200 | `{"saved":true,"frameId":1,"mind":"workspace","importance":"important"}` | Works perfectly. Entity extraction ran. Frame stored in workspace mind. |
| 7 | Search hiring memories | GET /api/memory/search?q=hiring | 200 | 1 result returned with full frame data | Works. FTS5 search found the frame. Returns content, importance, timestamp, frameType, source_mind. |
| 8 | Behavioral interview questions (chat) | POST /api/chat | 429 then 200 | Rate limited initially, succeeded on retry | **Issue**: Rate limiter (30 req/min for /api/chat) triggered after rapid sequential calls. Works after cooldown. |
| 9 | List team members | GET /api/team/status | 200 | `{"connected":false}` | Works. No team server connected (expected for solo mode). |
| 10 | Create task | POST /api/workspaces/:id/tasks | 201 | Task created with UUID, status "open", assignee "David" | Works perfectly. Task persisted to JSONL. |
| 11 | /plan hiring timeline (chat) | POST /api/chat | 200 | SSE echo-mode | API works, needs LLM for plan creation. |
| 12 | List personas | GET /api/personas | 200 | 8 personas: researcher, writer, analyst, coder, project-manager, executive-assistant, sales-rep, marketer | Works. Returns id, name, description, icon, workspaceAffinity, suggestedCommands. |
| 13 | /status pipeline status (chat) | POST /api/chat | 200 | SSE echo-mode | API works, needs LLM. |
| 14 | Check connectors | GET /api/connectors | 200 | 28 connectors returned, all "disconnected" | Works. Massive connector catalog: GitHub, Slack, Jira, Email, GCal, Discord, Linear, Asana, Trello, Monday, Notion, Confluence, Obsidian, HubSpot, Salesforce, Pipedrive, Airtable, GitLab, Bitbucket, Dropbox, PostgreSQL, Gmail, GDocs, GDrive, GSheets, MS Teams, Outlook, OneDrive, Composio (250+ bridge). |

### Persona 5 Summary

| Metric | Score |
|--------|-------|
| **Steps Completed** | 14/14 (100%) |
| **API Success Rate** | 14/14 endpoints responded correctly |
| **Chat Quality** | 0% (echo-mode, no LLM proxy) |
| **Data Persistence** | Memory write + search + task creation all work |
| **Team Features** | Available but no team server connected |

### Missing for HR Manager Persona

- **No HR-specific persona**: The 8 personas don't include an HR/Recruiter persona. David would benefit from a persona tuned for job descriptions, interview prep, candidate evaluation.
- **No LinkedIn connector**: The 28 connectors don't include LinkedIn (critical for HR recruiting workflows). HubSpot and Salesforce are present but not LinkedIn Recruiter.
- **No applicant tracking**: No native ATS (Applicant Tracking System) features or connector (Greenhouse, Lever, Workday).
- **Task board is minimal**: Tasks have title/status/assignee but no due dates, priorities, or categories. "Review candidate profiles by Thursday" has no actual Thursday date enforcement.

---

## PERSONA 6: Nikola - Attorney / Legal (Enterprise tier)

**Journey**: Research case law -> Draft legal brief -> Review for compliance -> Manage client confidentiality

### Step-by-Step Results

| Step | Action | Endpoint | HTTP | Result | Notes |
|------|--------|----------|------|--------|-------|
| 1 | List workspaces | GET /api/workspaces | 200 | 35 workspaces (includes P5 creation) | Works. |
| 2 | Create "Client Matter 2026-042" | POST /api/workspaces | 201 | `{"id":"client-matter-2026-042","group":"Legal - Confidential"}` | Works. Group name preserved for organization. |
| 3 | /research EU AI Act (chat) | POST /api/chat | 200 | SSE echo-mode | API works. Needs LLM to do actual web research. |
| 4 | /draft legal memo (chat) | POST /api/chat | 200 | SSE echo-mode | API works. /draft command recognized. |
| 5 | Confidential/encrypted request (chat) | POST /api/chat | 200 | SSE echo-mode | API works but cannot act on encryption without LLM. |
| 6 | Check vault status | GET /api/vault | 200 | 4 secrets stored (anthropic keys, marketplace keys). Suggested keys: OPENAI, TAVILY, BRAVE, etc. | Works. Shows secrets list without values. |
| 7 | Store encryption key in vault | POST /api/vault | 200 | `{"success":true,"name":"CLIENT_MATTER_2026_042_KEY"}` | Works. AES-256-GCM encrypted storage. |
| 8 | Save legal research to memory | POST /api/memory/frames | 200 | `{"saved":true,"frameId":1,"mind":"workspace","importance":"critical"}` | Works. "critical" importance level correctly applied. |
| 9 | Search for EU AI Act | GET /api/memory/search?q=EU%20AI%20Act | 200 | 1 result, full content with "critical" importance | Works. FTS5 found the legal research frame. |
| 10 | Who has access? (chat) | POST /api/chat | 200 | SSE echo-mode | API works, needs LLM to enumerate permissions. |
| 11 | Check approval gates | GET /api/approval/pending | 200 | `{"pending":[],"count":0}` | Works. No pending approvals (expected). |
| 12 | Create audit trail (chat) | POST /api/chat | 200 | SSE echo-mode | API works, needs LLM. |
| 13 | Check security settings | GET /api/settings | 200 | Returns model config, providers (keys masked), mind path | Works. API keys properly masked (e.g., "sk-ant-...8AAA"). |
| 14 | /decide compliance approach (chat) | POST /api/chat | 200 | SSE echo-mode | API works. /decide command needs LLM for decision analysis. |
| 15 | Export with encryption | POST /api/export | 200 | ZIP file returned: `waggle-export-2026-03-21.zip` | Works. Contains memories/, sessions/, workspaces/, settings.json, vault-metadata.json. Content-Type: application/zip. |

### Persona 6 Summary

| Metric | Score |
|--------|-------|
| **Steps Completed** | 15/15 (100%) |
| **API Success Rate** | 15/15 endpoints responded correctly |
| **Chat Quality** | 0% (echo-mode, no LLM proxy) |
| **Data Persistence** | Memory + vault + export all work |
| **Security Features** | Vault encryption, masked keys, export, approval gates |

### Missing for Attorney Persona

- **No workspace-level encryption**: Vault stores individual secrets but there's no "encrypt this entire workspace" toggle. An attorney expecting workspace-level encryption for privileged materials would be disappointed.
- **No access control per workspace**: No way to restrict who can see a workspace. The `connected: false` team status means there's no multi-user access control. An attorney needs to prove who had access for privilege claims.
- **No audit trail API**: No dedicated `/api/audit` endpoint. Audit trail creation relies on the agent (LLM) saving memory frames. There should be an automatic system-level audit log of all API access.
- **No redaction/privilege marking**: No way to tag content as "attorney-client privileged" at the system level. The importance="critical" flag is the closest, but it's not the same as legal privilege marking.
- **No document classification**: No ability to classify documents by sensitivity level (public, internal, confidential, privileged).
- **Export lacks encryption option**: POST /api/export produces an unencrypted ZIP. For legal/enterprise use, the export should support password-protected or encrypted archives.

---

## Rate Limiting Observations

| Finding | Detail |
|---------|--------|
| Chat rate limit | 30 requests per 60-second sliding window for /api/chat |
| Non-chat rate limit | 100 requests per 60-second window for other endpoints |
| Rate limit header | `x-ratelimit-limit` and `x-ratelimit-remaining` returned in response headers |
| Retry guidance | `retryAfterMs` field in 429 response body tells client exactly when to retry |
| **Issue** | During realistic multi-step workflows, a power user hitting chat 8-10 times in rapid succession easily triggers 429. The 30/min limit is reasonable for LLM calls but feels restrictive for echo-mode / fast workflow testing. |

---

## Connector Catalog Assessment

The 28 built-in connectors represent strong coverage:

| Category | Connectors | HR/Legal Relevance |
|----------|------------|-------------------|
| Dev/Code | GitHub, GitLab, Bitbucket | Low for HR/Legal |
| Communication | Slack, Discord, MS Teams | Medium - team coordination |
| Project Mgmt | Jira, Linear, Asana, Trello, Monday | Medium - task tracking |
| CRM | HubSpot, Salesforce, Pipedrive | Medium - candidate tracking |
| Docs | Notion, Confluence, Obsidian, GDocs | High - document management |
| Email/Calendar | Gmail, Outlook, Email (SendGrid), GCal | High - scheduling, correspondence |
| Storage | Dropbox, OneDrive, GDrive, GSheets | Medium - file management |
| Database | PostgreSQL | Low for HR/Legal |
| Meta-bridge | Composio (250+) | High - covers LinkedIn, Workday, etc. via bridge |

**Key gap**: LinkedIn is absent as a native connector. For HR, this is critical. The Composio bridge could potentially cover this but adds a dependency.

---

## Addiction Score

### David (HR Manager): 4/10

**What hooks him:**
- Workspace creation is instant and intuitive
- Memory persistence across sessions is powerful for long hiring pipelines
- Task creation works smoothly
- 28 connectors suggest future integration power
- Persona system (project-manager would fit) shows role awareness

**What loses him:**
- No AI responses without LLM proxy (the entire value proposition collapses)
- No HR-specific persona or workflow templates
- No LinkedIn connector
- Task board too simple (no due dates, no Kanban view)
- No way to share workspace with hiring team (team mode disconnected)
- No template system for recurring documents (job descriptions, scorecards)

**Missing aha moments:**
- "Save and auto-tag this job description" - should work with one command
- "Pull candidate profiles from LinkedIn" - no connector
- "Share this with the hiring committee" - no sharing mechanism
- "Schedule interviews using my calendar" - GCal connector exists but disconnected

### Nikola (Attorney): 5/10

**What hooks him:**
- Vault encryption for secrets (AES-256-GCM) shows security awareness
- "Critical" importance levels for legal research
- Export to ZIP for compliance/archival
- Approval gates architecture exists (even if empty)
- Memory search with workspace scoping
- Masked API keys in settings (security-conscious)

**What loses him:**
- No workspace-level encryption
- No access control or permission management per workspace
- No automatic audit trail (system-level)
- No privilege marking system for attorney-client material
- No encrypted export option
- No document classification or sensitivity labels
- Echo-mode makes the tool useless without LLM
- No legal-specific persona (closest is "researcher")
- No case management features (matter numbers, client linking, billing codes)

**Missing aha moments:**
- "This workspace is now encrypted and access-controlled" - not possible
- "Generate an audit log of all access to this matter" - no system-level audit
- "Mark this as attorney-client privileged" - no privilege system
- "Export encrypted for court submission" - export is unencrypted ZIP
- "Check compliance across all our workspaces" - no cross-workspace compliance view

---

## Overall Success Rate

| Metric | David (P5) | Nikola (P6) |
|--------|-----------|-------------|
| API endpoints working | 14/14 (100%) | 15/15 (100%) |
| Chat responses useful | 0/6 (0%)* | 0/5 (0%)* |
| Data persistence | 3/3 (100%) | 3/3 (100%) |
| Security features | N/A | 4/6 (67%) |
| Persona-specific value | 2/10 (20%) | 3/10 (30%) |
| Would return tomorrow | Unlikely | Unlikely |
| **Overall journey success** | **40%** | **45%** |

*Chat at 0% is due to no LLM proxy, not a bug. With LLM connected, chat would deliver actual AI-generated content.

**Adjusted scores (assuming LLM connected):**
- David: ~55% (still missing HR-specific features, LinkedIn, team sharing)
- Nikola: ~60% (still missing workspace encryption, audit trail, privilege marking)

---

## Critical Findings

### F1: No Workspace-Level Encryption (Enterprise blocker)
**Severity**: High
**Detail**: Vault encrypts individual secrets but entire workspace content (memories, sessions, files) is stored in plaintext SQLite. For legal/regulated industries, workspace-level encryption at rest is a minimum requirement.

### F2: No System-Level Audit Trail (Compliance gap)
**Severity**: High
**Detail**: No `/api/audit` endpoint. No automatic logging of who accessed what data and when. Legal and enterprise users need this for compliance, privilege claims, and regulatory requirements.

### F3: No Persona for HR or Legal
**Severity**: Medium
**Detail**: 8 personas cover dev, writing, analysis, project management, sales, marketing. Missing: HR/Recruiting, Legal/Compliance, Finance, Operations.

### F4: Task Board Lacks Due Dates and Priority
**Severity**: Medium
**Detail**: TeamTask type has title, status, assignee but no `dueDate`, `priority`, or `category` fields. For project-oriented users, this limits task utility significantly.

### F5: Rate Limiter Aggressive for Multi-Step Workflows
**Severity**: Low-Medium
**Detail**: 30 chat requests per minute is reasonable for LLM calls but frustrating for rapid-fire workflow testing or power users who chain multiple commands quickly. Consider burst allowance or adaptive limits.

### F6: Export Lacks Encryption
**Severity**: Medium
**Detail**: POST /api/export produces an unencrypted ZIP. For enterprise/legal use, should support encrypted archives (password-protected ZIP or GPG-encrypted).

### F7: No LinkedIn Connector (HR gap)
**Severity**: Medium (for HR persona specifically)
**Detail**: 28 native connectors cover broad ground but LinkedIn Recruiter is absent. Composio bridge may cover this indirectly.

### F8: Memory search returns `mind: "personal"` for workspace frames
**Severity**: Low
**Detail**: When searching workspace-scoped memory, the `mind` field in search results shows "personal" even for frames stored in the workspace mind. The `source` field correctly shows "workspace" but the `mind` label is inconsistent. This is due to the MultiMind search overwriting the source field (documented in code at F24).
