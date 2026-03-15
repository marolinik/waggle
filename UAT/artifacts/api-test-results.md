# Waggle API UAT Test Results

**Date:** 2026-03-16
**Server:** http://127.0.0.1:3333
**Tester:** Automated (Claude Code)

---

## Summary

| # | Scenario | Result |
|---|----------|--------|
| 6.1 | Create Workspace | PASS |
| 6.4 | Delete Workspace | PASS |
| 7.1 | Browse Starter Skills | PASS |
| 7.3 | Capability Pack Catalog | PASS |
| 9.1 | Cron Schedules | PASS |
| 9.2 | Manual Cron Trigger | PASS |
| 10.3 | Audit Trail | PASS |
| 10.4 | Vault Security | **FAIL** |
| 4.2 | Memory Search | PASS |
| 6.3 | Workspace Context | PASS |
| 14.5 | Empty State | PASS |
| 14.7 | Special Characters | PASS |
| — | SSE Stream | PASS |
| — | Health Deep Check | PASS |
| — | Governance (Solo) | PASS |

**Result: 14/15 PASS, 1 FAIL**

---

## Detailed Results

### Scenario 6.1: Create Workspace
- **Endpoint:** `POST /api/workspaces`
- **HTTP Status:** 201
- **Response:**
  ```json
  {"id":"uat-test-workspace","name":"UAT Test Workspace","group":"Testing","created":"2026-03-15T23:37:03.324Z"}
  ```
- **Verified:** Workspace appeared in `GET /api/workspaces` list
- **Result:** PASS

---

### Scenario 6.4: Delete Workspace
- **Endpoint:** `DELETE /api/workspaces/uat-test-workspace`
- **HTTP Status:** 204 (No Content)
- **Verified:** Workspace no longer present in `GET /api/workspaces` after deletion
- **Result:** PASS

---

### Scenario 7.1: Browse Starter Skills
- **Endpoint:** `GET /api/skills/starter-pack/catalog`
- **HTTP Status:** 200
- **Response snippet:**
  ```json
  {"skills":[{"id":"brainstorm","name":"Brainstorm — Structured Ideation with Convergence","family":"creative","familyLabel":"Creative & Ideation","state":"available","isWorkflow":false},{"id":"catch-up",...},...]}
  ```
- **Verified:** Returns skills with families, states (active/installed/available), isWorkflow flag
- **Result:** PASS

---

### Scenario 7.3: Capability Pack Catalog
- **Endpoint:** `GET /api/skills/capability-packs/catalog`
- **HTTP Status:** 200
- **Response snippet:**
  ```json
  {"packs":[
    {"id":"decision-framework","name":"Decision Framework","packState":"incomplete","installedCount":2,"totalCount":3},
    {"id":"planning-master","name":"Planning Master","packState":"incomplete","installedCount":2,"totalCount":4},
    {"id":"research-workflow","name":"Research Workflow","packState":"complete","installedCount":3,"totalCount":3},
    {"id":"team-collaboration","name":"Team Collaboration","packState":"incomplete","installedCount":1,"totalCount":4},
    {"id":"writing-suite","name":"Writing Suite","packState":"incomplete","installedCount":2,"totalCount":3}
  ]}
  ```
- **Verified:** 5 packs returned with skill states and install counts
- **Result:** PASS

---

### Scenario 9.1: Cron Schedules
- **Endpoint:** `GET /api/cron`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"schedules":[
    {"id":1,"name":"Memory consolidation","cronExpr":"0 3 * * *","jobType":"memory_consolidation","enabled":true},
    {"id":2,"name":"Workspace health check","cronExpr":"0 8 * * 1","jobType":"workspace_health","enabled":true}
  ],"count":2}
  ```
- **Verified:** 2 default schedules present (memory consolidation daily 3am, workspace health Monday 8am)
- **Result:** PASS

---

### Scenario 9.2: Manual Cron Trigger
- **Endpoint:** `POST /api/cron/1/trigger`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"triggered":true,"id":1,"nextRunAt":"2026-03-16T02:00:00.000Z"}
  ```
- **Verified:** Trigger succeeded, nextRunAt returned
- **Result:** PASS

---

### Scenario 10.3: Audit Trail
- **Endpoint:** `GET /api/audit/installs?limit=10`
- **HTTP Status:** 200
- **Response snippet:**
  ```json
  {"entries":[
    {"id":3,"capabilityName":"research-team","capabilityType":"skill","source":"starter-pack","riskLevel":"low","trustSource":"starter_pack","approvalClass":"standard","action":"installed"},
    {"id":2,"capabilityName":"research-synthesis",...},
    {"id":1,"capabilityName":"compare-docs",...}
  ]}
  ```
- **Verified:** Returns install history with trust info (riskLevel, trustSource, approvalClass)
- **Result:** PASS

---

### Scenario 10.4: Vault Security
- **Endpoint:** `GET /api/settings`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"defaultModel":"claude-opus-4-20250514","providers":{"anthropic":{"apiKey":"sk-ant-***REDACTED***","models":[...]}},...}
  ```
- **Finding:** API key is returned in **PLAINTEXT** in the response. The Anthropic API key `sk-ant-api03-...` is fully visible.
- **Expected:** API keys should be masked (e.g., `sk-ant-...BAAA`) or omitted from the response entirely.
- **Severity:** HIGH — sensitive credential exposure over HTTP
- **Result:** **FAIL**

---

### Scenario 4.2: Memory Search
- **Endpoint:** `GET /api/memory/search?q=React&scope=all`
- **HTTP Status:** 200
- **Response snippet:**
  ```json
  {"results":[{"id":4,"content":"Milestone M3 (Team Pilot): COMPLETE...","source":"personal","frameType":"P","importance":"important"}],"count":1}
  ```
- **Verified:** Returns frames matching "React" query with metadata
- **Result:** PASS

---

### Scenario 6.3: Workspace Context
- **Endpoint:** `GET /api/workspaces/marketing/context`
- **HTTP Status:** 200
- **Response snippet:**
  ```json
  {"workspace":{"id":"marketing","name":"Marketing","group":"Work"},
   "summary":"Session (2026-03-13): Where are we...",
   "recentThreads":[...],
   "recentDecisions":[...],
   "suggestedPrompts":[...],
   "recentMemories":[...]}
  ```
- **Verified:** Returns structured context with workspace info, summary, threads, decisions, suggested prompts, and memories
- **Result:** PASS

---

### Scenario 14.5: Empty State
- **Endpoint:** `GET /api/workspaces/nonexistent-workspace-12345/sessions`
- **HTTP Status:** 200
- **Response:**
  ```json
  []
  ```
- **Verified:** Returns 200 with empty array (graceful degradation, no error)
- **Result:** PASS

---

### Scenario 14.7: Special Characters
- **Endpoint:** `GET /api/memory/search?q=React%20🔥&scope=all`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"results":[{"id":4,"content":"Milestone M3 (Team Pilot): COMPLETE..."}],"count":1}
  ```
- **Verified:** Handles unicode emoji in search query without error, returns valid results
- **Result:** PASS

---

### SSE Stream Test
- **Endpoint:** `GET /api/notifications/stream`
- **Response:**
  ```
  data: {"type":"connected"}
  ```
- **Verified:** Receives SSE connected event immediately on connection
- **Result:** PASS

---

### Health Deep Check
- **Endpoint:** `GET /health`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"status":"ok","mode":"local","timestamp":"2026-03-15T23:37:01.522Z",
   "llm":{"provider":"anthropic-proxy","health":"healthy","detail":"Built-in Anthropic proxy (API key configured)"},
   "database":{"healthy":true}}
  ```
- **Verified:** Status ok, LLM healthy, database healthy
- **Result:** PASS

---

### Governance (Solo — no team)
- **Endpoint:** `GET /api/team/governance/permissions`
- **HTTP Status:** 200
- **Response:**
  ```json
  {"connected":false,"permissions":null}
  ```
- **Verified:** Returns connected: false, permissions: null (correct for solo mode)
- **Result:** PASS

---

## Critical Finding

### FAIL: Scenario 10.4 — Vault Security (API Key Plaintext Exposure)

The `GET /api/settings` endpoint returns the full Anthropic API key in plaintext. This is a security vulnerability:

- Any process or browser extension with access to `localhost:3333` can read the API key
- The key should be masked in API responses (e.g., show only last 4 characters)
- The vault (AES-256-GCM encrypted storage) protects keys at rest, but this endpoint negates that protection by exposing them over HTTP

**Recommendation:** Mask API keys in the settings response. Return `"apiKey": "sk-ant-...BAAA"` instead of the full key. Only accept full keys on write (POST/PUT), never return them on read (GET).
