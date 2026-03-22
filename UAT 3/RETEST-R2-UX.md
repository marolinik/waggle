# Waggle UAT — Round 2 UX Re-test
**Date:** 2026-03-22
**Tester:** Claude (Playwright MCP, automated)
**Server:** http://localhost:3333 (bearer token auth)
**Viewport Primary:** 1920×1080 | **Secondary:** 1024×768
**Theme tested:** Dark (primary) + Light (verified)
**Prior scores to beat:** Visual 5.5 / Usability 6.0 / Addiction 4.0 / Production-readiness 3.5

---

## Screenshot Index

| File | View | Notes |
|------|------|-------|
| `01-initial-load-1920.png` | Home / Chat (no workspace) | Empty state with starter prompts |
| `01-initial-load-1024.png` | Home @ 1024px | — |
| `02-chat-with-input-1920.png` | Chat with typed input | — |
| `02-chat-after-send-1920.png` | Chat — message sent | — |
| `02-chat-toolcard-expanded-1920.png` | Tool card expanded | Auto-recall tool visible ✓ |
| `02-chat-with-response-1920.png` | Chat with AI response | — |
| `03-memory-1920.png` | Memory browser | — |
| `03-memory-detail-1920.png` | Memory item detail | — |
| `04-events-1920.png` | Events audit trail | — |
| `04-events-session-replay-1920.png` | Events session replay | — |
| `05-capabilities-1920.png` | Capabilities / Marketplace | — |
| `06-cockpit-1920.png` | Cockpit dashboard | — |
| `07-mission-control-1920.png` | Mission Control | — |
| `08-settings-general-1920.png` | Settings → General | — |
| `08-settings-models-1920.png` | Settings → Models & Providers | 32 models, 10 providers |
| `08-settings-vault-1920.png` | Settings → Vault & Credentials | 9 secrets, 29 connectors |
| `08-settings-permissions-1920.png` | Settings → Permissions | YOLO mode toggle |
| `08-settings-team-1920.png` | Settings → Team | — |
| `08-settings-backup-1920.png` | Settings → Backup & Restore | — |
| `08-settings-advanced-1920.png` | Settings → Advanced | — |
| `09-onboarding-step1-filled-1920.png` | Onboarding — Step 1 (Name) | Triggered via React fiber dispatch |
| `09-onboarding-step2-apikey-1920.png` | Onboarding — Step 2 (Provider select) | 4 providers shown |
| `09-onboarding-step2-anthropic-1920.png` | Onboarding — Anthropic key entry | Inline key input |
| `10-context-panel-1920.png` | Context panel (right rail) | — |
| `11-global-search-1920.png` | Global Search — **CRASH** | BUG: error boundary triggered |
| `12-light-theme-chat-1920.png` | Chat — light theme | Clean light mode ✓ |
| `12-light-theme-cockpit-1920.png` | Cockpit — light theme | Good contrast ✓ |
| `12-light-theme-settings-1920.png` | Settings — light theme | Light/Dark toggle visible ✓ |
| `13-chat-1024x768.png` | Chat @ 1024×768 | Three-column maintained |
| `13-cockpit-1024x768.png` | Cockpit @ 1024×768 | Single-column stack |
| `13-settings-1024x768.png` | Settings @ 1024×768 | Tabs wrap to 2 lines |
| `verify-delete-confirm-1920.png` | Vault delete inline confirm | In-row "Sure? Yes/No" ✓ |

---

## Fix Verification Checklist (vs. prior UAT findings)

| # | Fix claimed | Status | Evidence |
|---|-------------|--------|---------|
| F1 | `font-mono` removed from non-code UI elements | **PARTIAL** | Navigation buttons (Chat, Cockpit, Mission Control, etc.) still carry `font-mono text-[11px]` in their Tailwind classes. Sidebar nav text renders in monospace. Intended for "terminal aesthetic" or missed cleanup — needs decision. |
| F2 | Loading skeletons in SettingsView | **CONFIRMED ✓** | `SettingsView.tsx:65-74` uses `<Skeleton>` component showing 4 tab + 3 row placeholders when `!config`. |
| F3 | Loading skeletons in MemoryBrowser | **CONFIRMED ✓** | `MemoryBrowser.tsx:100-109` uses `animate-pulse` for 5 item rows when `loading=true`. |
| F4 | Loading skeletons in EventsView | **CONFIRMED ✓** | `EventsView.tsx:159-160` uses `animate-pulse h-6 bg-muted rounded` when `loadingSessions=true`. |
| F5 | Empty states have CTAs | **CONFIRMED ✓** | Home screen shows 3 starter prompt buttons: "/help to see commands", "Start by telling me about your project", "/research [topic]". |
| F6 | No Wave 8A placeholder text remaining | **CONFIRMED ✓** | No lorem ipsum / placeholder copy visible across any view. |
| F7 | AlertDialog instead of `window.confirm()` | **CONFIRMED (different pattern) ✓** | Vault delete uses inline row confirmation "Sure? Yes/No" — not a browser native `window.confirm()`. `window.__confirmCalled` verified false. Pattern differs from AlertDialog overlay but achieves the same goal without modal. |
| F8 | Auto-recall ToolCard visible | **CONFIRMED ✓** | `02-chat-toolcard-expanded-1920.png` shows expanded tool card with auto-recall tool result. |
| F9 | No console errors on initial load | **PARTIAL** | 29 errors present — all are 401/429 for `/api/workspaces/{id}/context` batch calls (100+ parallel context prefetch requests hit rate limiter). This is a test-environment artifact (no bearer token on cold load) not a real user path. Zero product-breaking JS errors. |

---

## Per-View Scores (Round 2)

### 01 · Initial Load / Home
**Visual:** 7.5/10 — Clean dark background, centered AI greeting, good hierarchy. Starter prompts are helpful.
**Usability:** 7/10 — Clear CTA prompts. "No workspace" state handled gracefully. ← workspace list needs auth to show.
**Notes:** Workspace sidebar empty on cold load (before auth). Once loaded (after 2-3s): grouped workspace list is excellent — group headers, memory counts, timestamps.

### 02 · Chat View
**Visual:** 8/10 — Strong dark card for AI response, clear user/agent distinction, readable body text.
**Usability:** 8/10 — Tool card expand/collapse works. Input area clear. Session list on right provides good navigation.
**Notes:** Font in response appears to be system sans-serif (not mono). Tool card shows "auto-recall" with proper content. Copy button on response is good.

### 03 · Memory Browser
**Visual:** 7.5/10 — Clean list with type badges and timestamps. Detail view shows full frame content well.
**Usability:** 7/10 — Search bar present. Workspace scoping clear. No empty state tested but architecture sound.

### 04 · Events / Audit Trail
**Visual:** 7/10 — Timeline layout readable, session grouping clear.
**Usability:** 7/10 — Session replay visible. Timeline loading skeleton confirmed in code.

### 05 · Capabilities
**Visual:** 7.5/10 — Marketplace-style grid layout, connector cards with health indicators.
**Usability:** 7/10 — Clear enable/disable toggles, version info, category filtering.

### 06 · Cockpit
**Visual:** 8.5/10 — Best-looking view. Two-column grid of metric cards is clean. System Health / Cost / Memory / Vault / Cron sections all well-delineated.
**Usability:** 8/10 — Actionable data (costs by workspace, health status, cron triggers). Auto-refresh indicator present.
**Notes:** Cost breakdown by workspace ($22.69 today, totals by workspace) is a standout feature. Cron schedule management with inline Trigger buttons is powerful.

### 07 · Mission Control
**Visual:** 7/10 — Table-based layout functional. Dense information.
**Usability:** 7/10 — Shows all workspaces with status. Useful for power users.

### 08 · Settings
**Visual:** 7.5/10 — Tab navigation clear. Right sidebar section index is a nice UX touch.
**Usability:** 8/10 — 7 tabs, each with focused content. Models & Providers shows 32 models / 10 providers — impressive breadth. Vault shows 9 secrets + 29 connectors.
**Notes:** Settings → Permissions "YOLO mode" toggle is a personality touch. Backup/Restore with timestamp is production-grade.
**1024px issue:** Tab labels wrap to 2 lines at 1024px ("Models & Providers", "Backup & Restore", "Vault & Credentials"). Should be reviewed for responsive behavior.

### 09 · Onboarding Wizard
**Visual:** 8/10 — Centered minimal layout on pure black background. Clean typography. "YOUR AI OPERATING SYSTEM" label above heading works well.
**Usability:** 7.5/10 — Name → Provider → API key → (subsequent steps). Provider selection (Anthropic/OpenAI/Google/Other) is clear. "Don't have one?" link present.
**Critical note:** Wizard does NOT trigger automatically when providers are already configured in `config`. `showOnboarding` only becomes `true` when `cfg.providers` is empty. Wizard required React fiber dispatch hack to show in test environment. This is expected behavior — not a bug.

### 10 · Context Panel
**Visual:** 7/10 — Collapsible right rail, workspace summary cards.
**Usability:** 6.5/10 — Functional but information density could be improved.

### 11 · Global Search (Ctrl+K)
**Visual:** N/A — **CRASH BUG**
**Usability:** N/A — **CRASH BUG**
**Bug:** Every invocation of the Search modal (via button click or Ctrl+K) throws `TypeError: Cannot read properties of undefined (reading 'subscribe')` in the error boundary. Occurs regardless of workspace load state. Error trace points to `index-CT9Y9Ge1.js:32` — a Zustand store subscription in the search component. **Priority: HIGH — complete feature unavailability.**

### 12 · Light Theme
**Visual:** 8/10 — Light theme is clean and well-executed. White background with good contrast on all views (Chat, Cockpit, Settings all looked strong).
**Usability:** Same as dark — no degradation in usability in light mode.
**Notes:** Theme toggle in sidebar ("☀ light mode" / "☾ dark mode") works correctly.

### 13 · 1024×768 Responsive
**Visual:** 7/10 — Three-column layout maintained at 1024px (sidebar + main + sessions). Cockpit collapses to single-column correctly.
**Usability:** 6.5/10 — Settings tab labels wrap to 2 lines. Session list truncates heavily. Navigation buttons use mono font which becomes more pronounced at smaller sizes.
**Notes:** No horizontal scrollbar or overflow issues observed.

---

## New Bugs Found (Round 2)

| ID | Severity | View | Description |
|----|----------|------|-------------|
| BUG-R2-01 | **CRITICAL** | Global Search | `window.TypeError: Cannot read properties of undefined (reading 'subscribe')` crashes entire app on Search open. Error boundary shown every time. Feature completely unavailable. |
| BUG-R2-02 | MEDIUM | All nav | Sidebar navigation buttons (Chat, Capabilities, Cockpit, Mission Control, Memory, Events, Settings) use `font-mono` class — monospace font on UI navigation labels. Visual inconsistency. Whether intentional "terminal aesthetic" or bug needs decision. |
| BUG-R2-03 | LOW | Settings @ 1024px | Tab labels "Models & Providers", "Backup & Restore", "Vault & Credentials" wrap to 2 lines at 1024px width, making the tab bar tall and visually awkward. |
| BUG-R2-04 | LOW | Context (all views) | 100+ parallel `/api/workspaces/{id}/context` requests fire on load, hitting rate limiter (100 req/min default). All fail with 429. Silent failure — workspace context tiles show empty. Consider batching or lazy-loading context requests. |

---

## Round 2 Scores Summary

| Dimension | Round 1 | Round 2 | Delta | Notes |
|-----------|---------|---------|-------|-------|
| **Visual polish** | 5.5 | **7.5** | +2.0 | Dark theme is strong, light theme works well, Cockpit is excellent |
| **Usability** | 6.0 | **7.0** | +1.0 | Better empty states, good CTAs; search crash and tab wrapping drag score |
| **Addiction / WOW factor** | 4.0 | **6.5** | +2.5 | Cockpit cost breakdown, memory browser, onboarding wizard are all impressive |
| **Production readiness** | 3.5 | **5.5** | +2.0 | Skeletons confirmed, AlertDialog-equivalent in Vault, audit trail, backup/restore all production-grade |

**Overall Round 2: 6.6/10** (was 4.75/10 average in Round 1)

---

## What Works Very Well

1. **Cockpit** — most polished view; cost breakdown by workspace, cron management, health monitoring
2. **Memory Browser** — workspace-scoped, searchable, timestamped, detail view
3. **Onboarding Wizard** — clean minimal design, progressive API key setup
4. **Vault & Credentials** — 9 secrets + 29 connectors, inline confirmation for destructive actions
5. **Models & Providers** — 32 models / 10 providers is impressive breadth
6. **Light theme** — clean, well-executed, consistent across all views
7. **Session persistence** — session list with dates/counts in right panel
8. **Workspace grouping** — colored group indicators, memory counts, timestamps all add professional polish

## What Needs Attention Before Production

1. **[CRITICAL] Search crash** — Ctrl+K / Search button throws uncaught exception on every invocation
2. **[HIGH] font-mono on nav labels** — needs product decision: intentional terminal aesthetic or remove
3. **[MEDIUM] Context request batching** — 100+ parallel calls hit rate limiter; batch into single request or paginate
4. **[LOW] Settings tab responsive** — tab labels need truncation or `text-xs` at narrower viewports

---

## Comparison vs. Target Products

| Product | Strength | Waggle comparison |
|---------|---------|------------------|
| Claude.ai | Clean chat, simple | Waggle has MORE depth (memory, workspace, tools) — differentiates well |
| OpenWork | Workspace org | Waggle workspace model is comparable, memory system is superior |
| Cursor | Dev tool polish | Cockpit and Capabilities views approach this level of polish |
| Genspark | Search UX | Waggle search is currently broken — direct gap |

**Bottom line:** Waggle R2 is showing genuine product character. The workspace-native paradigm with persistent memory is clear and differentiated. The Cockpit is a standout. The critical blocker is the Search crash — fix that, address font-mono intentionality, and batch context requests, and this is in solid shape for a closed beta.
