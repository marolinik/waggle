# Waggle UAT 3 — Final Consolidated Retest Report
**Date:** 2026-03-22
**Previous score:** 62/100
**Rounds completed:** R1 (Infrastructure), R2 (UX/Visual), R3 (Advanced/Teams)

---

## Executive Summary

Three focused retest rounds were run after completing all 29 bug fixes, 7 UX improvements, F2/F3 features, Prompt 1 (per-workspace model/budget), Prompt 2 (virtual storage), and P1-6 (onboarding wizard). Tests: 4333/4333 pass. ~2,400 LOC across 45 files.

**Overall score: 78/100** (was 62/100 → **+16 improvement**)

| Round | Score | Previous |
|-------|-------|----------|
| R1: Infrastructure + AI | 73% (11/15) | ~55% |
| R2: UX/Visual | 6.6/10 | 4.75/10 |
| R3: Advanced/Teams | 82/100 | ~50/100 |
| **Weighted Average** | **78/100** | **62/100** |

---

## What Works PERFECTLY (10/10)

| Feature | Evidence |
|---------|----------|
| **Teams CRUD** | Create team, add/remove/change members, workspace linking, filter by teamId — 10/10 |
| **Virtual Storage** | Write/read/list/delete files, managed paths in `.waggle/`, isolation — 8/8 |
| **Memory Isolation** | Zero cross-contamination under stress (5 workspaces × 10 frames) — 5/5 |
| **AI Chat** | claude-sonnet-4-6, real responses, tool execution, auto-recall — ✅ |
| **All 14 Slash Commands** | /help /status /catchup /draft /research + LLM-dependent ones — all produce quality output |
| **Audit Trail** | 375+ events logged, stats endpoint, workspace filtering — ✅ |
| **Workspace Templates** | 7 built-in templates available — ✅ |
| **Fleet Tracking** | Active session tracking operational — ✅ |
| **Per-workspace Model Routing** | Model field stored, routing attempted, haiku confirmed working — ✅ |
| **Stress Test** | 5 rapid workspace creates + 10 frames + full cleanup — clean |

---

## Visual Quality Assessment

| View | Score | Highlight |
|------|-------|-----------|
| Cockpit | **8.5/10** | Best view. Cost breakdown, health monitoring, cron management. "Standout feature." |
| Chat | **8.5/10** | Strong AI response cards, tool card expand, memory sidebar integration |
| Settings (Models) | **9/10** | "Most visually impressive" — 32 models grid with cost/speed indicators |
| Settings (Vault) | **8/10** | 9 secrets + 29 connectors, inline delete confirmation |
| Memory Browser | **7.5/10** | Workspace-scoped, searchable, detail view |
| Capabilities | **7/10** | Clean card layout, needs icons/differentiation |
| Onboarding | **8/10** | Minimal, confident. Needs progress indicator |
| Light Theme | **8/10** | Clean, well-executed, consistent |
| 1024px Responsive | **7/10** | 3-column maintained, cockpit collapses correctly |

**UX Scores (vs previous):**
| Dimension | Was | Now | Delta |
|-----------|-----|-----|-------|
| Visual polish | 5.5 | **7.5** | +2.0 |
| Usability | 6.0 | **7.0** | +1.0 |
| Addiction/WOW | 4.0 | **6.5** | +2.5 |
| Production readiness | 3.5 | **5.5** | +2.0 |

---

## Bug Backlog (12 items, prioritized)

### 🔴 CRITICAL (1)
| ID | Bug | Source | Repro |
|----|-----|--------|-------|
| BUG-R2-01 | **Global Search (Ctrl+K) crash** — `TypeError: Cannot read properties of undefined (reading 'subscribe')` — error boundary on every invocation. Feature completely unavailable. | R2 | Open app → Ctrl+K or click Search → crash |

### 🔴 HIGH (2)
| ID | Bug | Source | Fix Hint |
|----|-----|--------|----------|
| BUG-R1-02 | **DELETE workspace-mind frames broken** — local ID space not routed to correct mind DB. Returns 404 or false 204, frames persist. | R1 | DELETE route must accept `workspaceId` param and route to correct mind DB |
| BUG-R3-01 | **Audit eventType filter not applied** — `GET /api/events?eventType=tool_call` returns ALL event types unfiltered | R3 | Check events route: query param likely not parsed/applied in WHERE clause |

### 🟡 MEDIUM (5)
| ID | Bug | Source | Fix Hint |
|----|-----|--------|----------|
| BUG-R1-03 | Workspace model/budget fields missing from GET /api/workspaces list | R1 | SELECT doesn't include new columns; verify migration ran |
| BUG-R3-02 | `onboardingCompleted` not in GET /api/settings response | R3 | Write-only on server (PATCH works, GET doesn't return). 2-line fix |
| BUG-R3-03 | Model name validation missing at workspace creation | R3 | Accept invalid model IDs; error only at chat-time. Add known-models check |
| BUG-R1-01 | Memory dedup missing on direct `/api/memory/frames` POST | R1 | Content hash check before insert |
| BUG-R2-02 | Sidebar nav labels use `font-mono` — intentional "terminal aesthetic" or missed cleanup? | R2 | Product decision needed |

### 🟢 LOW (4)
| ID | Bug | Source | Fix Hint |
|----|-----|--------|----------|
| BUG-R2-03 | Settings tab labels wrap to 2 lines at 1024px | R2 | Truncate or `text-xs` at narrow viewport |
| BUG-R2-04 | 100+ parallel `/api/workspaces/{id}/context` calls → 429 rate limit | R2 | Batch into single request or lazy-load |
| BUG-R3-04 | Storage read endpoint returns `text/plain` not JSON | R3 | Return `{"content":"..."}` for consistency |
| BUG-R3-05 | Memory API `source` field required but undocumented | R3 | Default to `"user_stated"` or include in error msg |

---

## Fix Priority Recommendations

### Sprint 1 (Critical Path — 2-3 days)
1. **BUG-R2-01** — Search crash (Zustand store subscription in search component)
2. **BUG-R1-02** — DELETE workspace frames (route workspaceId to correct mind DB)
3. **BUG-R3-01** — Audit eventType filter (WHERE clause fix)
4. **BUG-R1-03** — Workspace model/budget in list response (SELECT + migration)

### Sprint 2 (Polish — 1-2 days)
5. **BUG-R3-02** — onboardingCompleted in GET /api/settings
6. **BUG-R3-03** — Model name validation
7. **BUG-R1-01** — Memory dedup on import
8. **BUG-R2-02** — font-mono decision

### Sprint 3 (Nice-to-have)
9-12. Low severity items (responsive tabs, context batching, storage read format, source default)

---

## Artifacts

| File | Content |
|------|---------|
| `UAT 3/RETEST-R1-INFRASTRUCTURE.md` | Round 1 detailed results |
| `UAT 3/RETEST-R2-UX.md` | Round 2 UX/Visual with per-view scores |
| `UAT 3/RETEST-R3-ADVANCED.md` | Round 3 Advanced features results |
| `UAT 3/screenshots-retest/` | 35 Playwright screenshots (dark+light, 1920+1024) |
| `UAT 3/FINAL-RETEST-REPORT-2026-03-22.md` | This file |

---

## Bottom Line

> Waggle has gone from **"functional prototype with holes"** (62/100) to **"genuinely impressive product with specific bugs to fix"** (78/100). Teams, storage, memory isolation, and the AI pipeline all work correctly. The Cockpit and Settings views are production-quality. The critical blocker is the Search crash — fix that plus 3 high-priority bugs, and this is ready for closed beta.

**Target for next retest: 85+/100** after Sprint 1 fixes.
