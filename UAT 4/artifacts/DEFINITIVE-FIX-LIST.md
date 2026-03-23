# Definitive Fix List — All UAT Rounds Combined

**Date:** 2026-03-23
**Sources:** UAT 3 Mega V2, UAT 3 Mega-UAT Final, UAT 4 Master Report, HIVE-UI-POLISH-PROMPT
**Cross-verified:** Every item checked against actual source code

---

## TRULY OPEN — Must Fix (12 items)

### CRITICAL (3)

| # | Category | Description | File | Effort |
|---|----------|-------------|------|--------|
| 1 | **Security** | CORS origin: `true` — allows any origin. Must allowlist Tauri origins only | `packages/server/src/local/index.ts` | 30min |
| 2 | **Agent** | DOCX generation kills chat summaries — user sees 50 chars instead of response. Agent should include 200-char summary after generate_docx | `packages/agent/src/document-tools.ts` | 1h |
| 3 | **Agent** | Agent doesn't ask clarifying questions for ambiguous prompts ("Make it better" → immediately generates DOCX instead of asking) | Agent system prompt or `packages/agent/src/orchestrator.ts` | 2h |

### HIGH (2)

| # | Category | Description | File | Effort |
|---|----------|-------------|------|--------|
| 4 | **Security** | CSP `unsafe-eval` + `unsafe-inline` not verified in Tauri config | `app/src-tauri/tauri.conf.json` | 1h |
| 5 | **Security** | Rate-limit retry — no explicit MAX_RETRIES cap visible. Infinite retry loop possible | `packages/server/src/local/routes/chat.ts` or proxy | 30min |

### MEDIUM (4)

| # | Category | Description | File | Effort |
|---|----------|-------------|------|--------|
| 6 | **Command** | /decide command sometimes produces empty content despite tools running | `packages/agent/src/commands/workflow-commands.ts` | 1h |
| 7 | **Memory** | Workspace names auto-saved to personal mind (workspace topics leak cross-workspace) | `packages/server/src/local/routes/chat.ts` (auto-topic) | 30min |
| 8 | **Memory** | KG relation extraction sparse — 5 entity statements → only 2 relations | `packages/agent/src/entity-extractor.ts` | 2h |
| 9 | **Agent** | Persona tool loops — Researcher persona sometimes produces empty output | Agent loop max iterations or persona prompt | 1h |

### LOW (3)

| # | Category | Description | File | Effort |
|---|----------|-------------|------|--------|
| 10 | **UI** | Vault "0 ACTIVE" shows in green (misleading for inactive state) | `app/src/components/cockpit/VaultSummaryCard.tsx` | ✅ DONE |
| 11 | **UI** | Date locale bug — "23. map" month abbreviation | `app/src/components/cockpit/helpers.ts` | ✅ DONE |
| 12 | **UI** | Session search input invisible (needs hive styling) | `packages/ui/src/components/sessions/SessionList.tsx` | ✅ DONE |

---

## ALREADY FIXED — Verified in Code (25+ items)

| Item | Evidence |
|------|----------|
| Global Search crash | mount guard `if (!open) return null` in GlobalSearch.tsx |
| Frame DELETE FK constraint | `base_frame_id = NULL` cascade in frames.ts |
| Tier workspace limit enforcement | "Workspace limit reached" 403 in workspaces.ts |
| Teams PATCH member roles | PATCH endpoint in team.ts |
| 4 new slash commands (/plugins, /export, /import, /settings) | registered in workflow-commands.ts |
| Audit event filter | eventType WHERE clause works (was test error) |
| HR/Legal/Finance disclaimer enforcement | REGULATED_DISCLAIMER_MAP post-processing in chat.ts |
| Mock Slack/Teams/Discord tools | ALWAYS_CONNECTED set in connector-registry.ts |
| Team DELETE returns body | `{deleted: true, userId, teamId}` in team.ts |
| Events pagination | hasMore + totalPages in events.ts |
| Storage read JSON wrapper | encoding field in workspaces.ts |
| Fleet model field | wsConfig.model in fleet.ts |
| Cockpit KPI fallbacks | "$0" instead of "—" in CockpitView.tsx |
| Vault "0 ACTIVE" color | conditional green in VaultSummaryCard.tsx |
| Date locale | en-US forced in helpers.ts |
| Session search input | hive styling in SessionList.tsx |
| LLM health cache | 30s TTL in index.ts |
| Hive UI redesign | 27 files — full color system, honeycomb, icons, bees |
| Chat prose readability | globals.css chat-message__content rules |
| Custom brand icons | HiveIcon component + 32 JEPGs |
| Bee mascots in empty states | Memory (researcher), Events (analyst), Onboarding (orchestrator) |
| Card shadow system | shadow-card + border hive-700 |
| Onboarding progress dots | hex dots + "Step X of Y" |
| Sidebar workspace badges | pill container with rounded-full |
| Frame list hierarchy | source dots, font-semibold, hive-100 titles |

---

## ENTERPRISE (Deferred — 4 items)

| # | Description | Effort |
|---|-------------|--------|
| E1 | KVARK real connection (settings panel exists, need real health check + doc retrieval) | 2 weeks |
| E2 | SSO/SAML integration | 2 weeks |
| E3 | Viewer permission enforcement in team workspaces | 4h |
| E4 | Admin endpoints (/api/admin) | 1 week |

---

## EXECUTION PLAN

**Sprint A (2 hours) — Ship-blocking:**
1. Fix CORS origin allowlist (#1)
2. Fix DOCX chat summary (#2)
3. Fix ambiguity detection (#3)
4. Add rate-limit retry cap (#5)

**Sprint B (2 hours) — Quality:**
5. Verify CSP in Tauri config (#4)
6. Fix /decide empty content (#6)
7. Suppress workspace topic auto-save to personal mind (#7)
8. Fix persona tool loops (#9)

**Sprint C (ongoing) — Enterprise:**
9. KVARK real connection (E1)
10. Viewer permissions (E3)
