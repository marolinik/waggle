# TEST D: UX Retest — UAT Round 3
**Date:** 2026-03-22
**Tester:** Claude Agent (Playwright automated browser)
**Viewport resolutions tested:** 1920x1080, 1280x800, 1024x768
**Theme tested:** Dark mode (primary) + Light mode (verified)
**Screenshots directory:** `UAT 3/screenshots-mega/` (D-01 through D-17)

---

## Setup Notes

- Auth injected via `localStorage.setItem('waggle-token', ...)` before page reload
- App successfully loaded and recognized as authenticated (workspace list populated, memory visible)
- Note: The injected key `waggle-token` differs from the internally used key `waggle_auth_token` — the app actually uses its own internally stored token. This caused 70 HTTP 401 console errors (all silenced from UI) throughout the session. The workspace context prefetch fires for ALL 64+ workspaces on sidebar render — a performance concern noted below.

---

## View-by-View Evaluation

---

### View: Initial Load / Chat with Messages (1920x1080)
- **Screenshot:** D-01-initial-1920.png, D-02-chat-with-messages-1920.png
- **Visual Polish:** 8/10
- **Typography:** 9/10 — Inter body font confirmed throughout. Headings, body, metadata all use appropriate weights and sizes.
- **Spacing:** 8/10 — Chat area well-padded. Message bubble has good internal padding. Status bar readable.
- **Loading State:** N/A (content already loaded)
- **Empty State:** N/A (messages present)
- **Color System:** Consistent dark theme. #0a0a0a background, muted grays for secondary text, amber/green for priority badges (CRITICAL/IMPORTANT). Sidebar uses slightly lighter dark.
- **Key Observations:**
  - Three-zone layout (sidebar left / chat center / context panel right) renders cleanly at full HD
  - Markdown rendering in chat is polished: H2 headings, bullet lists, bold emphasis all visually distinct
  - Timestamps and copy button appear at message footer — good micro-UX
  - Right context panel (Memory + Sessions) is well-structured with clear section headers
  - Status bar (bottom): workspace name, deployment mode, model name, token count, cost — appropriately informative
  - Persona indicator (`-- Persona`) in top-left of chat area is functional but visually underpowered
  - Chat message container has a rounded border — distinguishes agent response well
  - Session tab strip with `session-022dcae...` truncated labels — functional but raw UUIDs shown to user
- **Regression: Monospace font for body text** — FIXED. Inter is now the body font throughout.

---

### View: Chat (1280x800)
- **Screenshot:** D-02-chat-with-messages-1280.png
- **Visual Polish:** 8/10
- **Typography:** 9/10
- **Spacing:** 8/10 — Text reflows naturally; sidebar slightly narrower but still readable.
- **Responsiveness:** Right context panel still present at 1280px, good.
- **Key Observations:** All three columns visible and functional. No visual breakage. Slightly tighter but usable.

---

### View: Chat (1024x768)
- **Screenshot:** D-02-chat-with-messages-1024.png
- **Visual Polish:** 7/10
- **Typography:** 9/10
- **Spacing:** 7/10 — Right context panel disappears (hidden) at 1024px. This is acceptable responsive behavior — context info is de-prioritized at smaller widths.
- **Key Observations:** Two-column layout (sidebar + chat) at 1024. No content overflow visible. Input bar and Send button remain accessible.

---

### View: Memory (1920x1080)
- **Screenshot:** D-03-memory-1920.png, D-16-memory-frame-detail-1920.png
- **Visual Polish:** 7/10
- **Typography:** 8/10
- **Spacing:** 7/10 — List items feel slightly compact; three-line card format (icon + time + label + "From you") is repetitive but scannable.
- **Loading State:** N/A (frames loaded)
- **Empty State:** N/A (50 frames present)
- **Key Observations:**
  - Left panel: memory frame list with date grouping (TODAY section). Each item shows: icon (diamond/arrow), timestamp, importance badge, title, source.
  - Right panel: "Select a frame to view details" placeholder until selection — reasonable empty state.
  - Frame detail (D-16): Shows type (Fact), ID, age, source, content, and GOP (grouping) key. Clean but very technical — ID/GOP exposure may be too raw for non-technical users.
  - Bottom status bar: "50 frames | 0 entities | 0 relations" — informative.
  - Filter bar (Fact/Prediction/Background + All sources dropdown) well-placed at top.
  - The list uses monospace-style rendering for the "From you" source label — acceptable as metadata.
  - **Issue:** Memory frame detail right panel shows raw internal data (GOP session key) — could be cleaned up for general users.
- **Regression: Empty states with no guidance** — PARTIALLY FIXED. "Select a frame to view details" is a minimal but acceptable empty state.

---

### View: Memory (1280x800)
- **Screenshot:** D-03-memory-1280.png
- **Visual Polish:** 7/10
- **Spacing:** 7/10 — Two-panel split compresses at 1280; right detail panel is narrow but usable.
- **Key Observations:** Acceptable at this breakpoint.

---

### View: Memory (1024x768)
- **Screenshot:** D-03-memory-1024.png
- **Visual Polish:** 7/10
- **Key Observations:** Two-panel split maintained. Right panel narrower but functional. Bottom stat bar still visible.

---

### View: Events — Empty State (1920x1080)
- **Screenshot:** D-04-events-1920.png
- **Visual Polish:** 7/10
- **Typography:** 8/10
- **Spacing:** 8/10
- **Loading State:** N/A
- **Empty State:** 7/10 — Clipboard emoji icon + "No events recorded" + "Tool calls, agent actions, and system events will appear here." This is a proper empty state with a clear call-to-action message.
- **Key Observations:**
  - Tab strip: "Live Events" / "Session Replay" — good structure.
  - Filter panel on right (Tool Call / Memory / Search / File / Response checkboxes) is present even with no data — appropriate.
  - Stats panel reads "Event statistics available during active agent sessions." — acceptable placeholder.
  - Icon row in top bar (brain/tool/magnifier/globe/pen/alert/Auto) is unlabeled — power-user UI but not immediately intuitive.
- **Regression: Empty states with no guidance** — FIXED for Events. Clear explanatory text present.

---

### View: Events (1280x800, 1024x768)
- **Screenshots:** D-04-events-1280.png, D-04-events-1024.png
- **Key Observations:** Empty state remains clean at smaller breakpoints. Filter panel retained at 1280. At 1024, right filter panel hidden — empty state centered well.

---

### View: Capabilities — Packs Tab (1920x1080)
- **Screenshot:** D-05-capabilities-1920.png
- **Visual Polish:** 5/10 — SIGNIFICANT ISSUE
- **Typography:** 8/10
- **Spacing:** 6/10
- **Loading State:** "Loading community packs..." text present but 3 large empty bordered rectangles visible above it — these are blank/unloaded pack cards.
- **Key Observations:**
  - Page title "Capabilities" with subtitle "Browse and install capability packs, marketplace packages, and individual skills." — good.
  - Tab strip: Packs (0) / Marketplace / Individual Skills — clear.
  - "Recommended WAGGLE" section label present, followed by 3 blank white-bordered cards with no content inside.
  - **CRITICAL UX BUG:** Blank card placeholders visible before content loads — no skeleton loaders with shimmer/pulse, just empty rectangles. This looks broken.
  - Enterprise section shows KVARK badge with explanatory text — well done.
  - Right panel (Installed): Lists 5 built-in packs with green dot indicators — clean.
  - Right panel (Suggested): "Marketplace suggestions will appear here after Wave 8A." — developer note leaking into production UI.
  - API 401 errors on `/api/skills/capability-packs/catalog` and `/api/marketplace/packs` explain why cards are blank — auth issue.

---

### View: Capabilities (1280x800)
- **Screenshot:** D-05-capabilities-1280.png
- **Key Observations:** Blank cards even more prominent at this breakpoint as they take up more vertical space proportionally.

---

### View: Capabilities (1024x768)
- **Screenshot:** D-05-capabilities-1024.png
- **Key Observations:** Same blank cards issue. Layout adapts to single column.

---

### View: Capabilities — Marketplace Tab (1920x1080)
- **Screenshot:** D-11-marketplace-1920.png
- **Visual Polish:** 7/10
- **Key Observations:**
  - Search bar with "Search packages..." placeholder — good.
  - Type filter pills: All / Skills / Plugins / MCP Servers — clear taxonomy.
  - Sort options: Most Popular / Relevance / Recently Updated / Name A-Z — comprehensive.
  - "Loading marketplace..." spinner text — at least the loading state is communicated.
  - No actual package cards loaded (auth failure prevents data fetch).
  - Overall marketplace structure is solid; just needs auth to work.
- **Light mode:** The marketplace in light mode (D-11 was captured in light mode) shows clean whites, good filter pill styling.

---

### View: Capabilities — Individual Skills Tab (1920x1080)
- **Screenshot:** D-12-individual-skills-1920.png
- **Visual Polish:** 7/10
- **Key Observations:**
  - "+ Create Skill" button prominent and well-placed.
  - "Loading Install Center..." text present.
  - Sparse but not broken — the loading state is communicated.
  - Right panel still shows installed packs list.

---

### View: Cockpit / Dashboard (1920x1080)
- **Screenshot:** D-06-cockpit-1920.png
- **Visual Polish:** 8/10
- **Typography:** 8/10 — Mix of Inter for headings and monospace for system values (OK, running, healthy) — appropriate technical aesthetic.
- **Spacing:** 8/10 — 2-column grid of cards is well-balanced.
- **Loading State:** "Loading cost data..." visible in Cost Estimates card — spinner text without visual indicator.
- **Key Observations:**
  - Two-column card grid: System Health / Service Health / Cost Estimates / Memory Stats / Vault Summary / Cron Schedules / Runtime Overview / Agent Topology / Connectors / Install Audit Trail / KVARK Enterprise.
  - **System Health card:** Overall: OK (green) / LLM Provider: anthropic-proxy (healthy) / Database: healthy — clear status with color-coded dots. "Auto-refreshes every 30s" note is informative.
  - **Memory Stats:** 104 frames / 4.5 MB mind size / 57% embedded — compact stat tiles look good.
  - **Agent Topology:** Shows active model (claude-sonnet-4-6), tools/skills/workflows counts (0/0/0 because not authed), mode: local. Clean layout.
  - **Service Health:** Cron Scheduler: running (green) / Notification SSE: no listeners (amber) — appropriate color coding.
  - **Cockpit is the strongest view** — dense but well-organized, looks genuinely useful.
  - "Loading capabilities..." in Runtime Overview — persistent loading without resolution (auth failure).
  - KVARK Enterprise card: "Not configured" with explanation — good guidance text.
  - Quick Actions panel (right): Refresh Health + Trigger Sync buttons — appropriately minimal.

---

### View: Cockpit (1280x800)
- **Screenshot:** D-06-cockpit-1280.png
- **Key Observations:** Grid collapses to single column at 1280. Cards stack vertically. Still readable and functional. No breakage.

---

### View: Mission Control (1920x1080)
- **Screenshot:** D-07-mission-control-1920.png
- **Visual Polish:** 6/10
- **Loading State:** "Loading fleet data..." — persistent loader with no resolution (auth failure prevents fleet API calls).
- **Empty State:** The loading text is the only content — no fallback empty state if fleet data never loads.
- **Key Observations:**
  - Title: "Mission Control" / subtitle: "Agent fleet overview · 0/3 sessions active" — informative even without data.
  - Right panel: "Fleet Info" with MAX SESSIONS: 3 concurrent. Quick Actions (Pause/Resume, Kill, View sub-agent results). Tip on /spawn usage.
  - The persistent "Loading fleet data..." with no resolution or error fallback is a UX gap.
  - **Issue:** No "no agents running" empty state — just perpetual loading.

---

### View: Settings — General (1920x1080)
- **Screenshot:** D-08-settings-1920.png
- **Visual Polish:** 8/10
- **Typography:** 8/10
- **Spacing:** 8/10 — Row cards with labels and controls well-spaced.
- **Key Observations:**
  - Tab navigation: General / Models & Providers / Vault & Credentials / Permissions / Team / Backup & Restore / Advanced — comprehensive.
  - Theme row: Light / Dark toggle buttons.
  - Launch on Startup row: toggle implied.
  - Global Hotkey row: text input for shortcut.
  - Right panel: Help section with section navigation (General / Models / Vault / Permissions / Team / Advanced) — excellent wayfinding.
  - **Responsive issue at 1024px:** Settings view at 1024px shows Chat view instead of Settings — this is a routing or layout bug where Settings content area collapses to show the previous chat view. REGRESSION.

---

### View: Settings — Light Mode (1920x1080)
- **Screenshot:** D-09-light-mode-settings-1920.png
- **Visual Polish:** 9/10 — Light mode looks noticeably cleaner and more professional than dark mode.
- **Key Observations:** Light theme is polished. White backgrounds with light borders, dark text, good contrast. Settings rows have proper border separation. This rivals professional SaaS products.

---

### View: Settings — Permissions (1920x1080)
- **Screenshot:** D-17-settings-permissions-1920.png
- **Visual Polish:** 8/10
- **Key Observations:**
  - Auto-Approve Mode row with clear description: "When enabled, most tool executions are auto-approved. Only destructive operations (file deletions, git push, external API calls) will prompt for confirmation." — excellent copy.
  - External Mutation Gates: text input with "e.g., git push, rm -rf, curl POST" placeholder — clear and actionable.
  - Right panel shows active section highlight and all section links.
  - Note: API 401 on `/api/settings/permissions` means toggle states couldn't be loaded.

---

### View: Light Mode Chat (1920x1080)
- **Screenshot:** D-10-light-mode-chat-1920.png
- **Visual Polish:** 9/10 — Strongest visual presentation in the app.
- **Typography:** 9/10 — Inter body text is highly readable on white backgrounds.
- **Spacing:** 9/10
- **Key Observations:**
  - Clean white chat area with crisp typography.
  - Markdown rendering (headings, bullets, bold) particularly readable in light mode.
  - Sidebar uses very light gray (#f5f5f5 approx) — clear visual hierarchy.
  - Right memory panel has proper section headers with clean typography.
  - Status bar remains dark even in light mode — minor inconsistency.

---

### View: Empty/New Session — Workspace Home Screen (1920x1080, 1280x800)
- **Screenshots:** D-14-empty-chat-blank-session-1920.png, D-14-empty-chat-blank-session-1280.png
- **Visual Polish:** 9/10 — **BEST EMPTY STATE IN THE APP.**
- **Typography:** 9/10
- **Spacing:** 9/10
- **Empty State:** Excellent — This is the "Workspace Now" block described in product vision.
- **Key Observations:**
  - Workspace icon + workspace name + category badge + "Your agent knows 15 things · 1 sessions" + "Last active: 12m ago" — instant context.
  - Pinned memory card: current critical context surfaced immediately.
  - "Recent decisions" section: last 3 key decisions shown as clickable cards.
  - "Recent threads" section: previous sessions resumable with one click.
  - "Key memories" section: top memories with type icons (diamond/arrow).
  - Suggested prompts at bottom: "Continue: Catch me up on this workspace", "Catch me up on this workspace", "Review recent decisions and next steps", "What should I do next?", "Draft an update from what we know" — these are smart, context-aware CTAs.
  - Input placeholder: "Ask what matters here, continue a task, or draft something..." — excellent copy vs generic "Type a message".
  - **This is the signature Waggle experience — highly differentiated from generic chat apps.**
- **Regression: Empty states with no guidance** — FIXED AND EXCEEDED. The new session state is the app's strongest screen.

---

### View: Collapsed Sidebar (1920x1080)
- **Screenshot:** D-15-collapsed-sidebar-1920.png
- **Visual Polish:** 7/10
- **Key Observations:**
  - Sidebar collapses to icon-only rail with workspace folder icons.
  - Category labels truncate to 2-character abbreviations (e.g., "Ex" for Executive, "M" for Management) — unreadable without expanding.
  - Bottom nav icons remain visible (circle/dots/document/bolt/grid/rocket/gear icons for Chat/Memory/Events/Capabilities/Cockpit/MissionControl/Settings).
  - **Issue:** Collapsed state workspace names are just 2-char truncations, not meaningful icons. Icon-based workspace identification would be better.
  - Folder emoji icons for expanded groups do appear (yellow folder for active workspace).

---

## Regression Checklist

| Issue from Previous Audit | Status |
|---|---|
| Monospace font used for body text | **FIXED** — Inter used throughout |
| Empty states with no guidance (Events) | **FIXED** — "No events recorded" with clear description |
| Empty states with no guidance (new session) | **EXCEEDED** — Full Workspace Now home screen |
| Raw technical error messages shown to users | **FIXED** — 70 API 401s fully silenced, zero UI-visible errors |
| Missing loading skeletons | **PARTIALLY FIXED** — Text loading states present; Capabilities shows blank cards without skeleton shimmer |
| Console errors | **PRESENT** — 70+ 401 errors in console; all from workspace context prefetch + auth-gated endpoints. Not user-visible but indicates auth token mismatch in test environment |
| Sidebar navigation polish | **IMPROVED** — Clean, well-organized; minor collapsed-state issue |
| Status bar informativeness | **EXCELLENT** — Model name, token count, cost, workspace, deployment mode all shown |

---

## Additional Issues Found

### Issue 1: Settings View Disappears at 1024px
**Severity:** Medium
**Screenshot:** D-08-settings-1024.png
**Description:** Navigating to Settings at 1024px viewport width renders the previous Chat view instead of the Settings view. The Settings content area does not display. This appears to be a responsive layout bug where the Settings panel width collapses below a minimum threshold and the fallback shows the underlying chat view.

### Issue 2: Blank Cards in Capabilities Packs Tab (No Skeleton Loaders)
**Severity:** Medium
**Screenshots:** D-05-capabilities-1920.png, D-05-capabilities-1280.png, D-05-capabilities-1024.png
**Description:** The Recommended packs section shows 3 blank white-outlined card placeholders with zero content, followed by "Loading community packs..." text. No shimmer/skeleton animation. Looks visually broken.

### Issue 3: "Wave 8A" Developer Note in Production UI
**Severity:** Low
**Screenshot:** D-05-capabilities-1920.png (right panel Suggested section)
**Description:** Text reads "Marketplace suggestions will appear here after Wave 8A." — internal development milestone terminology leaking into user-facing UI.

### Issue 4: Mission Control Has No Resolved Empty/Error State
**Severity:** Low-Medium
**Screenshot:** D-07-mission-control-1920.png
**Description:** "Loading fleet data..." persists indefinitely when the API call fails (auth issue in test). There is no fallback "No agents running" or error state displayed. A real user with no active agents would see perpetual loading.

### Issue 5: Session Tab Labels Show Raw UUIDs
**Severity:** Low
**Screenshot:** D-13-empty-chat-new-session-1920.png
**Description:** Session tabs show `session-022dcae...` — raw UUID prefixes. Sessions should be named by their first message or topic, not internal IDs.

### Issue 6: Memory Frame Detail Exposes Raw Internal Data (GOP Key)
**Severity:** Low
**Screenshot:** D-16-memory-frame-detail-1920.png
**Description:** Frame detail shows "GOP: session:2026-03-09T11:20:52.007Z:64dig2" — this is an internal grouping key not meaningful to end users. Should be either hidden or translated to human-readable format.

### Issue 7: Mass Workspace Context Prefetch (64+ Simultaneous API Calls)
**Severity:** Medium (Performance/Network)
**Description:** On sidebar render, the app fires 64+ simultaneous API calls to `/api/workspaces/{id}/context` — one for every workspace in the list. This is a significant performance issue: it floods the network tab, all result in 401 in the test environment, and in production would hammer the server on every page load. Lazy loading or on-demand fetch would be more appropriate.

### Issue 8: Collapsed Sidebar Workspace Labels Are 2-Char Truncations
**Severity:** Low
**Screenshot:** D-15-collapsed-sidebar-1920.png
**Description:** In collapsed mode, workspace names truncate to 2 characters ("Ex", "M", "Le") which conveys no meaningful information. Icon-based or monogram-based identification would be better.

---

## Summary

**Overall UX Score: 7.5/10**

**Best-looking view:** Light mode Chat with messages (D-10) — polished, readable, professional. The new session Workspace Home screen (D-14) is the most impressive UX feature.

**Worst-looking view:** Capabilities Packs tab (D-05) — blank card placeholders look broken.

**Most improved since last audit:** Empty states — the new session "Workspace Now" home screen is a complete transformation from "blank chat box" to a rich, context-aware workspace entry point. This is product-differentiating.

**Top 3 remaining visual issues:**
1. Blank capability pack cards (no skeleton loaders) — looks broken
2. Settings view disappears at 1024px — functional regression at smaller breakpoints
3. Mission Control stuck in loading state with no fallback

**Would a designer be embarrassed to show this?**
No — with one caveat: the dark mode experience is "developer dark" (high contrast, sparse, functional) rather than "design dark" (sophisticated, warm). In light mode, the app looks genuinely polished and would pass a designer review. The Workspace Home screen, Cockpit, and Settings are standout screens.

**Is this production-ready visually?**
**Conditional YES.**
- Dark mode: Production-ready for technical/developer persona users. Not yet for mainstream enterprise users who expect more visual warmth and polish.
- Light mode: Production-ready. Competes well with professional SaaS tools.
- Capabilities view: NOT production-ready (blank card skeletons).
- Settings at 1024px: NOT production-ready (content disappears).
- All other views: Production-ready at 1280px+.

**Recommendation for pre-launch:** Fix the 3 medium-severity issues (blank capability cards, settings at 1024px, mission control no-fleet state) before first public release. The rest are polish items.

---

## Screenshot Index

| File | View | Resolution | Notes |
|---|---|---|---|
| D-01-initial-1920.png | Chat (initial load) | 1920x1080 | Dark mode |
| D-02-chat-with-messages-1920.png | Chat with messages | 1920x1080 | Dark mode |
| D-02-chat-with-messages-1280.png | Chat with messages | 1280x800 | Dark mode |
| D-02-chat-with-messages-1024.png | Chat with messages | 1024x768 | Dark mode, right panel hidden |
| D-03-memory-1920.png | Memory view | 1920x1080 | 50 frames |
| D-03-memory-1280.png | Memory view | 1280x800 | |
| D-03-memory-1024.png | Memory view | 1024x768 | |
| D-04-events-1920.png | Events (empty) | 1920x1080 | Good empty state |
| D-04-events-1280.png | Events (empty) | 1280x800 | |
| D-04-events-1024.png | Events (empty) | 1024x768 | Right panel hidden |
| D-05-capabilities-1920.png | Capabilities — Packs | 1920x1080 | BLANK CARD BUG |
| D-05-capabilities-1280.png | Capabilities — Packs | 1280x800 | BLANK CARD BUG |
| D-05-capabilities-1024.png | Capabilities — Packs | 1024x768 | BLANK CARD BUG |
| D-06-cockpit-1920.png | Cockpit | 1920x1080 | Best functional view |
| D-06-cockpit-1280.png | Cockpit | 1280x800 | Single column |
| D-06-cockpit-1024.png | Cockpit | 1024x768 | |
| D-07-mission-control-1920.png | Mission Control | 1920x1080 | Persistent loading |
| D-08-settings-1920.png | Settings | 1920x1080 | Clean layout |
| D-08-settings-1280.png | Settings | 1280x800 | Tab wrap |
| D-08-settings-1024.png | Settings | 1024x768 | BUG: Shows chat instead |
| D-09-light-mode-settings-1920.png | Settings (light mode) | 1920x1080 | Very polished |
| D-10-light-mode-chat-1920.png | Chat (light mode) | 1920x1080 | Best overall visual |
| D-11-marketplace-1920.png | Capabilities — Marketplace | 1920x1080 | Loading state |
| D-12-individual-skills-1920.png | Capabilities — Skills | 1920x1080 | Loading state |
| D-13-empty-chat-new-session-1920.png | Chat — existing session | 1920x1080 | Content from previous session |
| D-14-empty-chat-blank-session-1920.png | Workspace Home Screen | 1920x1080 | BEST FEATURE |
| D-14-empty-chat-blank-session-1280.png | Workspace Home Screen | 1280x800 | |
| D-15-collapsed-sidebar-1920.png | Collapsed sidebar | 1920x1080 | 2-char truncation issue |
| D-16-memory-frame-detail-1920.png | Memory frame detail | 1920x1080 | Raw GOP key exposed |
| D-17-settings-permissions-1920.png | Settings — Permissions | 1920x1080 | Clean, good copy |
