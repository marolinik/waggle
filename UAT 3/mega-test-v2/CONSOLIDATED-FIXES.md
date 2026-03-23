# Consolidated Fixes & Improvements — Waggle 76→95 Roadmap

**Compiled:** 2026-03-23 after Mega Test V2 (76/100)
**Sources:** Mega Test V2 (R1-R7), HIVE-UI-POLISH-PROMPT, RETEST reports, SPRINT-1-FIX-PROMPT
**Total unique items:** 32 (previously fixed items removed)

---

## TIER 1: Critical Path to 85/100 (Fix These First)

### BUG-01: Frame Deletion FK Constraint [HIGH]
- **Category:** Memory API
- **Impact:** Users cannot delete memory frames. Blocks GDPR compliance.
- **Error:** `DELETE /api/memory/frames/:id` → `SQLITE_CONSTRAINT_FOREIGNKEY`
- **Fix:** Add `ON DELETE CASCADE` to FK constraints in knowledge graph tables, or delete dependent KG entities before frame deletion.
- **File:** `packages/core/src/mind/` (SQLite schema/migration) + `packages/server/src/local/routes/memory.ts`
- **Effort:** Small (schema change + migration)

### BUG-02: Tier Limits Not Enforced [HIGH]
- **Category:** Tier System
- **Impact:** Solo tier says maxWorkspaces=5 but 138+ allowed. No paid tier model possible.
- **Fix:** Add enforcement checks at workspace creation, session creation, and team member addition. Return 403 with tier limit message.
- **File:** `packages/server/src/local/routes/workspaces.ts` (POST handler), `packages/server/src/local/routes/fleet.ts` (session creation)
- **Effort:** Medium (add checks to 3-4 route handlers)

### BUG-03: Teams Role Update Returns 404 [HIGH]
- **Category:** Teams API
- **Impact:** Cannot change member roles (viewer→member, member→admin). Core teams functionality broken.
- **Fix:** Add/fix PATCH `/api/teams/:id/members/:userId` endpoint handler.
- **File:** `packages/server/src/local/routes/teams.ts`
- **Effort:** Small (add PATCH handler or fix route registration)

### BUG-04: Audit Event Filter Ignored [HIGH]
- **Category:** Events API
- **Impact:** `GET /api/events?eventType=tool_call` returns ALL types unfiltered. Dashboard filtering broken.
- **Fix:** Apply `eventType` WHERE clause in SQL query.
- **File:** `packages/server/src/local/routes/events.ts`
- **Effort:** Small (add WHERE clause)

### BUG-05: 4 Slash Commands Not Registered [MEDIUM]
- **Category:** Slash Commands
- **Impact:** `/plugins`, `/export`, `/import`, `/settings` → "Unknown command"
- **Fix:** Register handlers. `/plugins` → list installed plugins. `/export` → export workspace data. `/import` → import data. `/settings` → open/show settings.
- **File:** `packages/agent/src/` (command registry) or `packages/server/src/local/routes/chat.ts`
- **Effort:** Medium (4 new command handlers)

### BUG-06: read_file Uses Wrong CWD [MEDIUM]
- **Category:** Tool Execution
- **Impact:** Agent can't read workspace-linked files. Falls back to home directory.
- **Fix:** Set tool execution CWD to workspace's linked directory when available.
- **File:** `packages/agent/src/system-tools.ts` or `packages/agent/src/tools.ts` (read_file handler)
- **Effort:** Small (pass workspace dir as cwd)

---

## TIER 2: Quality Polish to 90/100

### BUG-07: search_files Not Workspace-Scoped [MEDIUM]
- **Category:** Tool Execution
- **Impact:** Searches entire home dir (21,232 results). Slow and irrelevant.
- **Fix:** Scope to workspace linked directory. Fall back to home only if no dir linked.
- **File:** `packages/agent/src/system-tools.ts` (search_files handler)
- **Effort:** Small

### BUG-08: /decide Returns Empty Content [LOW]
- **Category:** Slash Commands
- **Impact:** Decision framework tools run but produce 0 chars output.
- **Fix:** Debug the decision command handler — likely the response isn't being captured after tool execution.
- **File:** `packages/agent/src/` (decide command handler)
- **Effort:** Small (debug + fix)

### BUG-09: Model/Budget Missing from Workspace List [MEDIUM]
- **Category:** Workspace API
- **Impact:** GET /api/workspaces doesn't return model or budget fields.
- **Fix:** Add `model`, `budgetLimit` to SELECT query in workspace list handler.
- **File:** `packages/server/src/local/routes/workspaces.ts`
- **Effort:** Tiny (add columns to SQL SELECT)

### BUG-10: HR Disclaimer Inconsistent [MEDIUM]
- **Category:** Persona System
- **Impact:** HR persona sometimes omits mandatory professional disclaimer.
- **Fix:** Strengthen the REGULATED_PERSONAS prompt injection. Consider adding disclaimer as a post-processing step rather than relying on LLM compliance.
- **File:** `packages/server/src/local/routes/chat.ts` (system prompt composition)
- **Effort:** Small (strengthen prompt or add post-processing)

### BUG-11: send_slack_message Tool Not Firing [MEDIUM]
- **Category:** Mock Connectors
- **Impact:** Asking agent to "send a Slack message" doesn't trigger the mock tool.
- **Fix:** Ensure mock connector tools are registered in the effective tools list. May need to add them to the tool registry when connector status is "available".
- **File:** `packages/agent/src/connectors/mock-channel-connectors.ts` + tool registration
- **Effort:** Medium

### BUG-12: Storage Read Returns text/plain [LOW]
- **Category:** API Consistency
- **Impact:** Inconsistent content type on storage read endpoint.
- **Fix:** Return JSON wrapper `{ content: "...", mimeType: "text/plain" }` or set proper Content-Type.
- **File:** `packages/server/src/local/routes/storage.ts`
- **Effort:** Tiny

### IMP-01: Cockpit Cost Chart Empty State [LOW]
- **Category:** Cockpit UI
- **Impact:** Cost chart area blank when no data. Looks broken.
- **Fix:** Show "No usage data yet" placeholder when cost data is null/empty.
- **File:** `app/src/components/cockpit/CostDashboardCard.tsx`
- **Effort:** Tiny

### IMP-02: Events Pagination [MEDIUM]
- **Category:** Events API
- **Impact:** Only 100 events per request, no pagination token.
- **Fix:** Add `page`/`cursor` params and `hasMore`/`total` in response.
- **File:** `packages/server/src/local/routes/events.ts`
- **Effort:** Small

### IMP-03: DELETE Endpoints Return Empty Body [LOW]
- **Category:** API Consistency
- **Impact:** No confirmation of deletion — confusing for API consumers.
- **Fix:** Return `{ deleted: true, id: "..." }` on all DELETE endpoints.
- **File:** Multiple route files
- **Effort:** Small

### IMP-04: Fleet Endpoint Add Model Info [LOW]
- **Category:** Fleet API
- **Impact:** Can't see which model each session uses.
- **Fix:** Include `model` field in session objects.
- **File:** `packages/server/src/local/routes/fleet.ts`
- **Effort:** Tiny

---

## TIER 3: Feature Completeness to 95/100

### ENT-01: KVARK Real Connection [HIGH — Enterprise]
- **Category:** Enterprise
- **Impact:** KVARK settings panel exists but can't connect. Enterprise tier is skeleton.
- **Fix:** Implement real KVARK health check, document retrieval, governed actions via the existing `packages/server/src/kvark/` module.
- **Effort:** Large

### ENT-02: Viewer Permission Enforcement [MEDIUM — Teams]
- **Category:** Teams
- **Impact:** Viewers can potentially modify workspace data. No role-based access control.
- **Fix:** Add middleware that checks user role before write operations in team workspaces.
- **File:** `packages/server/src/local/routes/` (middleware)
- **Effort:** Medium

### ENT-03: Enterprise Admin Endpoints [MEDIUM — Enterprise]
- **Category:** Enterprise
- **Impact:** No /api/admin endpoints for enterprise administration.
- **Fix:** Add admin routes for user management, audit export, governance controls.
- **Effort:** Large

### ENT-04: SSO/SAML Integration [HIGH — Enterprise]
- **Category:** Enterprise
- **Impact:** Enterprise auth is basic token only. No SSO.
- **Fix:** Add SAML/OIDC provider support.
- **Effort:** Large

### IMP-05: Concurrent Workspace Verification Test [LOW]
- **Category:** Testing
- **Impact:** No automated test for true parallel workspace chat.
- **Fix:** Write test: 3 parallel chats to 3 workspaces with different models.
- **File:** `UAT 3/concurrent-test.ts` (exists as skeleton)
- **Effort:** Small

### IMP-06: OpenAPI/Swagger Spec [MEDIUM]
- **Category:** API Discoverability
- **Impact:** 88+ endpoints with no documentation. Hard for integrators.
- **Fix:** Generate OpenAPI spec from route definitions (already have GET /api/docs with 88 endpoints listed).
- **File:** `packages/server/src/local/routes/docs.ts`
- **Effort:** Medium

---

## ALREADY FIXED (Do Not Re-Fix)

These items from HIVE-UI-POLISH-PROMPT and earlier UAT rounds were **fixed in the Hive UI sessions:**

| Item | Status | Evidence |
|------|--------|----------|
| C1: Chat text readability | ✅ Fixed | Chat prose rules in globals.css (hive-100 body, hive-50 headings) |
| C2: Markdown rendering | ✅ Fixed | Full prose stylesheet added to globals.css |
| C3: Helper text contrast | ✅ Fixed | Changed to `var(--hive-400)` in ChatArea.tsx |
| C4: Send button invisible | ✅ Fixed | `honey-500` bg when active in ChatInput.tsx |
| C5: Replace emoji with brand icons | ✅ Fixed | HiveIcon component + 7 sidebar icons + 4 KPI icons + 5 onboarding icons |
| H1: Bee images in empty states | ✅ Fixed | Chat (orchestrator), Memory (researcher), Events (analyst) |
| H2: Theme-aware image switching | ✅ Fixed | BeeImage + HiveLogo components + CSS fallback classes |
| H5: Card backgrounds don't lift | ✅ Fixed | shadow-card + border hive-700 on Card component |
| IMP-1: Onboarding progress dots | ✅ Fixed | Hex dots + "Step X of Y" added |
| IMP-3: Model DEFAULT highlight | ✅ Fixed | DEFAULT badge exists in ModelsSection |
| BUG-R2-01: Search crash | ✅ Fixed | Mount guard `if (!open) return null` in GlobalSearch.tsx |
| M1: Workspace badge styling | ✅ Fixed | Pill container with subtle bg in WorkspaceCard |
| M2: Sidebar text contrast | ✅ Fixed | hive-300 inactive, hive-50 active |
| M7: Frame list hierarchy | ✅ Fixed | Source dots, title/metadata separation, font weights |
| M8: Empty detail pane | ✅ Fixed | Researcher bee + stats summary |
| L1: Session truncation | ✅ Fixed | word-break: break-word |
| L2: Status bar styling | ✅ Fixed | 11px mono, hive-400 |
| L3: Selected sidebar item | ✅ Fixed | honey-glow bg |

---

## PRIORITY EXECUTION ORDER

```
Sprint 1 (2-3 hours) → 85/100:
  BUG-01: Frame deletion FK
  BUG-02: Tier limit enforcement
  BUG-03: Teams role PATCH
  BUG-04: Audit event filter
  BUG-06: read_file CWD
  BUG-09: Workspace model/budget in list

Sprint 2 (2-3 hours) → 90/100:
  BUG-05: 4 missing slash commands
  BUG-07: search_files scoping
  BUG-10: HR disclaimer enforcement
  BUG-11: Mock Slack tool registration
  IMP-01: Cost chart empty state
  IMP-02: Events pagination

Sprint 3 (ongoing) → 95/100:
  ENT-01: KVARK real connection
  ENT-02: Viewer permissions
  ENT-04: SSO/SAML
  IMP-06: OpenAPI spec
```

**Bottom line:** 6 surgical fixes in Sprint 1 would bring us from 76 to ~85. Another 6 in Sprint 2 gets to ~90. The remaining 5 points require real enterprise features.
