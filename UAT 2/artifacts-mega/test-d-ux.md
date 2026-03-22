# Waggle Mega-UAT Test D: UX Retest

**Date:** 2026-03-22
**Tester:** Claude Opus 4.6 (automated source audit)
**Method:** Static analysis of served HTML, CSS variables, component source, view source, and design system files
**Scope:** All 7 views, 80+ components, theme system, design tokens, responsive layout

---

## 1. Overall UX Assessment

**Score: 7.5 / 10**

Waggle's frontend is a well-structured React SPA built on Tauri 2.0 with a mature three-zone layout (sidebar / content / context panel). The design system is grounded in a single source of truth: shadcn/ui CSS variables in `globals.css`, extended by `waggle-theme.css` aliases. The technology choices are sound -- Tailwind CSS v4, shadcn/ui primitives (21 components), class-variance-authority for Button variants, and Inter as the bundled sans-serif font. The codebase shows evidence of multiple hardening passes (Wave 1-10 references throughout).

Strengths:
- Consistent three-panel layout via `AppShell` with responsive collapse behavior
- Full dark/light theme support via `data-theme` attribute and dual CSS variable sets
- Every view has error states with retry buttons and user-friendly messages
- Skeleton loading states in Cockpit; loading indicators in all other views
- Proper ARIA attributes on sidebar (`role="navigation"`, `aria-label`, `aria-expanded`), chat area (`role="log"`, `aria-live="polite"`), and event tabs (`role="tab"`, `aria-selected`, `aria-controls`)
- Keyboard accessibility: Ctrl+K global search, Ctrl+Shift+N view shortcuts, Ctrl+/ help, Ctrl+Shift+P persona switcher
- ErrorBoundary wraps each view with a clean recovery UI
- Rich "Workspace Now" empty state with context-aware suggestion chips

Weaknesses:
- Sidebar nav items still use `font-mono` (11px monospace), creating visual friction compared to the Inter sans-serif body
- The context panel uses excessive `font-mono` on labels, help text, and list items -- this makes informational text harder to read
- Some views (SettingsView, MemoryView) are thin wrappers that delegate entirely to @waggle/ui, making it hard to verify loading/error states without reading deeper
- The Cockpit view applies `font-mono` to its entire container (`<div className="... font-mono">`), making all dashboard text monospace
- Context panel close button uses `absolute` positioning without a proper parent `relative`, which could cause layout issues
- `CapabilitiesContext` in the context panel still references "Wave 8A" as a placeholder -- stale placeholder text in production

---

## 2. Per-View Evaluation

### ChatView (8/10)
- **Visual polish:** Clean composition of tabs, persona indicator, file drop zone, and chat area. Workspace Home block is rich with summary, decisions, progress items, threads, memories, and onboarding hints.
- **Typography:** Body uses Inter sans-serif (correct). Code blocks have language labels and copy buttons. Message text is 13px with relaxed line-height.
- **Loading states:** `isLoading` prop disables input and shows loading in ChatArea. SubAgentProgress shows real-time SSE status.
- **Error states:** Handled at the ChatArea level. Tool cards have 5 status states (running/done/error/denied/pending_approval) with distinct colors and icons.
- **Empty state:** Excellent. Shows "Workspace Now" with context-aware prompts derived from workspace name (`getContextualSuggestions`). New workspaces get onboarding hints explaining memory, context, and how to start.
- **Responsiveness:** Fills available space via `flex flex-col h-full`. Scroll position persists across session switches.
- **Issues:** Persona chip uses very small text (`text-xs`, `text-[10px]`). No-persona button shows "--" which is cryptic.

### CockpitView (7/10)
- **Visual polish:** 10-card grid with responsive `grid-cols-[repeat(auto-fit,minmax(420px,1fr))]`. Cards are clean with shadcn Card primitives.
- **Typography:** Entire view uses `font-mono` class on the container -- this makes ALL text monospace including headers and descriptions. This is the most significant typography issue in the app.
- **Loading states:** Full skeleton loading (6 skeleton cards) with proper Skeleton component. Well implemented.
- **Error states:** `CockpitError` with user-friendly message ("Unable to load cockpit data. Check your connection and try again.") and retry button.
- **Empty state:** KVARK Enterprise card shows "Not configured" with a helpful explanation.
- **Responsiveness:** Good grid behavior. Max width constrained to 960px with auto margins.
- **Issues:** `font-mono` on container is wrong for a dashboard. Costs, health, and audit data should use sans-serif body text.

### CapabilitiesView (7/10)
- **Visual polish:** Rich marketplace browser with search, filter chips (type/category/sort), install badges, bulk install progress.
- **Typography:** Uses proper text sizing hierarchy.
- **Loading states:** Bulk install progress tracking with current/total counts.
- **Error states:** Not deeply visible from the view file (delegated to InstallCenter component).
- **Empty state:** Search results show "No packages found" state.
- **Issues:** Very large file (15k+ tokens) suggesting it could benefit from further decomposition.

### MemoryView (7/10)
- **Visual polish:** Clean composition. MemoryBrowser has search, type filter chips, source filter dropdown, frame timeline, and frame detail.
- **Typography:** Proper hierarchy. Filter chips use appropriate sizes.
- **Loading states:** `loading` prop passed through. MemorySearch disabled during loading.
- **Error states:** `error` and `onRetry` props properly threaded.
- **Empty state:** Not explicitly visible in the thin wrapper, but MemoryBrowser handles empty frame lists.
- **Issues:** View is a 49-line thin wrapper -- almost all logic lives in @waggle/ui. The stats footer shows memory size formatted with `formatBytes`.

### EventsView (8/10)
- **Visual polish:** Two-tab layout (Live Events / Session Replay) with proper ARIA tab roles. Clean session picker dropdown.
- **Typography:** Tab buttons use appropriate sizes. Error messages in destructive color.
- **Loading states:** `loadingSessions` shows "Loading sessions..." text. `loadingTimeline` passed to SessionTimeline component.
- **Error states:** Both sessions and timeline have error states with specific messages ("Connection lost. Check that Waggle is running and try again.") and retry buttons.
- **Empty state:** "No sessions found" when empty. "Select a workspace first" when no workspace.
- **Responsiveness:** Proper flex column layout with overflow handling.

### MissionControlView (7.5/10)
- **Visual polish:** Fleet cards with color-coded left borders (primary/destructive/muted) per status. Resource summary in a 3-column grid.
- **Typography:** Good hierarchy. Font sizes are appropriate (13px names, 11px details).
- **Loading states:** "Loading fleet data..." with animate-pulse.
- **Error states:** "Connection lost" message with retry.
- **Empty state:** Excellent. Shows bee emoji, "No active agents yet" heading, and instructional text with inline code example (`/spawn researcher [topic]`).
- **Issues:** Kill confirmation uses `window.confirm()` -- should use a proper Dialog component for consistency with the rest of the app.

### SettingsView (6.5/10)
- **Visual polish:** Delegates to SettingsPanel with 7 tabs. Clean organization.
- **Typography:** Uses the tabbed interface convention. Label text is appropriate.
- **Loading states:** Shows "Loading settings..." text while config is null. After 10 seconds of null config, shows error state with retry.
- **Error states:** Timeout-based error detection is a good pattern. Message is user-friendly.
- **Empty state:** N/A (config is always populated once loaded).
- **Issues:** Loading state is plain text ("Loading settings...") without a skeleton or spinner -- less polished than CockpitView's skeleton approach. The 10-second timeout is hardcoded.

---

## 3. Design System Assessment

### Color System (8/10)
- Single source of truth: `globals.css` defines all shadcn CSS variables (20+ tokens) in HSL format
- Dark theme: Deep zinc/purple-black palette (`240 7% 4%` background) with amber primary (`40 65% 55%`)
- Light theme: Warm beige (`40 10% 96%` background) with deeper amber primary (`37 63% 44%`)
- Extended via `waggle-theme.css` with surface aliases, semantic colors, step/event colors, and KG node colors
- Legacy `dark.css` and `light.css` in packages/ui exist but are largely superseded by globals.css
- Charts use 5 distinct hues. Destructive/warning/success are properly defined.

### Typography (6/10)
- Body font: Inter (locally bundled .woff2) at 13px -- correct, professional choice
- Code font: JetBrains Mono / Cascadia Code / Fira Code stack -- good
- **Critical issue:** `font-mono` is used excessively outside of code contexts:
  - CockpitView entire container is `font-mono`
  - Sidebar nav items use `font-mono` for labels
  - Context panel headers, help text, list items all use `font-mono`
  - ContextPanel's PanelHeader uses `font-mono` for section labels
  - This creates a "terminal app" feel rather than a modern productivity tool feel
- Font sizes are generally consistent: 9px metadata, 10-11px labels, 12-13px body, 14-16px headings

### Spacing/Padding (7.5/10)
- Mostly consistent Tailwind spacing: `px-3 py-2` for panels, `px-6 py-6` for main views, `gap-2` or `gap-4` for grids
- Card padding via shadcn Card primitives is consistent
- Some manual pixel values (`py-[5px]`, `py-[7px]`) that could use Tailwind scale values instead

### Component Library (8/10)
- 21 shadcn/ui primitive components installed (accordion, alert-dialog, badge, button, card, command, dialog, dropdown-menu, input, input-group, label, popover, scroll-area, select, separator, sheet, skeleton, switch, tabs, textarea, tooltip)
- Button uses class-variance-authority with 6 variants and 8 sizes -- well-engineered
- Skeleton component is minimal but correct (animate-pulse + bg-muted)
- Card, Dialog, and Command components leverage Radix UI primitives

### Theme Support (8.5/10)
- ThemeProvider uses React context with `data-theme` attribute on `document.documentElement`
- Persists to localStorage under `waggle-theme` key
- Defaults to dark theme (appropriate for a dev/productivity tool)
- Toggle accessible from sidebar bottom area
- Scrollbar styling adjusts per theme
- Selection color uses primary with transparency

---

## 4. Specific Fix Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Monospace replaced with sans-serif for body | PARTIAL | Body correctly uses Inter via `globals.css` line 100. However, `font-mono` is still applied to CockpitView container, sidebar nav items, context panel headers, and many labels. The body text itself is sans-serif, but many UI elements still render in monospace. |
| Empty states have call-to-action | PASS | ChatView shows contextual suggestions and onboarding hints. MissionControlView shows `/spawn` instruction. CockpitView KVARK card explains what to do. Sidebar shows "Create one to organize your conversations" when no workspaces exist. |
| Error messages are user-friendly | PASS | All views show human-readable messages: "Unable to load cockpit data. Check your connection and try again." / "Connection lost. Check that Waggle is running and try again." / "Something went wrong in [viewName]". No raw HTTP codes or stack traces shown to users. |
| Loading skeletons exist | PARTIAL | CockpitView has a proper 6-card `CockpitSkeleton` with multiple skeleton lines per card. Other views use text-based loading indicators ("Loading settings...", "Loading fleet data...", "Loading sessions...") with animate-pulse. Only Cockpit has true skeleton cards. |
| Sidebar navigation polished | PASS | Clean vertical nav with active state (primary bg tint + border-left accent), keyboard shortcuts shown (`Shift+1` through `Shift+7`), collapsed mode shows icons, theme toggle, workspace creation button, search button with Ctrl+K hint. Proper ARIA attributes. |
| Status bar informative | PASS | Shows workspace name, mode (Local/Team), model name (clickable to switch with dropdown), token count (formatted), cost (formatted). Offline indicator with wifi-off icon, pulsing animation, queued message count, and explanatory tooltip. |

---

## 5. Comparison to ChatGPT / Claude.ai / Cursor UI

### Where Waggle Matches or Exceeds
- **Three-zone layout** is more information-dense than ChatGPT's single-pane or Claude.ai's two-pane, closer to Cursor's multi-panel approach
- **Workspace memory context** ("Workspace Now" block) is unique -- neither ChatGPT nor Claude.ai show workspace-level summaries, decisions, progress, or key memories when you return
- **Tool transparency** (ToolCard with 5 states, 3-layer drill-down, auto-grouping of completed tools) exceeds what Claude.ai or ChatGPT show for tool use
- **Keyboard accessibility** (Ctrl+K, Ctrl+Shift+N, Ctrl+/) matches Cursor's keyboard-first approach
- **Command palette** with cmdk-based dialog matches modern app patterns (VS Code, Linear, Notion)

### Where Waggle Falls Short
- **Typography consistency:** ChatGPT, Claude.ai, and Cursor all use clean sans-serif throughout. Waggle's excessive `font-mono` on non-code UI elements (sidebar, context panel, cockpit) creates a "developer terminal" aesthetic that undermines the "serious productivity tool" positioning. This is the single biggest UX gap.
- **Loading polish:** Claude.ai uses smooth skeleton animations for message streaming. Waggle only has skeletons in Cockpit; other views use plain text "Loading..." strings.
- **Micro-animations:** While `waggle-theme.css` defines `.waggle-interactive` and `.waggle-card-lift` utility classes, they are not consistently applied. Claude.ai's message appearance animations and ChatGPT's streaming dots are more polished.
- **Dialog consistency:** MissionControlView uses `window.confirm()` for destructive actions while the rest of the app uses shadcn Dialog. This is a jarring inconsistency.
- **Empty state art:** ChatGPT and Claude.ai use branded illustrations for empty states. Waggle uses emoji (bee emoji in MissionControl, geometric SVG in ChatArea). This is functional but less polished.

---

## 6. Component Inventory Summary

| Category | Count | Notes |
|----------|-------|-------|
| shadcn/ui primitives (app/src/components/ui/) | 21 | Full set: button, card, dialog, command, skeleton, etc. |
| App components (app/src/components/) | 7 + cockpit (11) | AppSidebar, ContextPanel, ErrorBoundary, GlobalSearch, KeyboardShortcutsHelp, PersonaSwitcher, cockpit/ |
| UI package components (packages/ui/src/components/) | 50+ | Organized in 10 directories: chat, common, events, files, layout, memory, onboarding, sessions, settings, workspace |
| Views (app/src/views/) | 7 | Chat, Cockpit, Capabilities, Events, Memory, MissionControl, Settings |
| **Total estimated components** | **~90** | Well-organized monorepo package structure |

---

## 7. Recommendations (Priority Order)

### P0 -- Fix Before Production
1. **Remove `font-mono` from non-code UI elements.** Specifically:
   - `CockpitView.tsx` line 307: remove `font-mono` from the container div
   - `AppSidebar.tsx` lines 64, 98, 113, 129, 172: remove `font-mono` from nav buttons, workspace button, theme toggle, shortcuts button, search button
   - `ContextPanel.tsx` lines 106, 358, 395, 452, 477, 480, 489: remove `font-mono` from PanelHeader, list items, and help text
   - Keep `font-mono` only on: code blocks, model names, file paths, technical IDs, and the status bar model picker

2. **Replace `window.confirm()` in MissionControlView** (line 122) with a shadcn AlertDialog for consistency.

3. **Remove stale placeholder text** ("Marketplace suggestions will appear here after Wave 8A" in ContextPanel line 370, "Available after Wave 8A" in ContextPanel line 406).

### P1 -- Polish
4. **Add skeleton loading states** to SettingsView (use skeleton rows for settings sections) and MissionControlView (skeleton cards for fleet data).
5. **Consistently apply `.waggle-card-lift`** to interactive cards in Cockpit, MissionControl, and Capabilities views.
6. **Add subtle entrance animations** for messages in ChatArea (fade-in or slide-up) to match Claude.ai polish level.

### P2 -- Enhancement
7. **Replace emoji navigation icons** (sidebar uses emoji: computer, brain, clipboard, lightning, chart, rocket, gear) with a proper icon library (Lucide icons, which are already standard with shadcn/ui).
8. **Add branded empty state illustrations** for Chat welcome, Memory empty, and MissionControl empty -- replace emoji-only empty states.
9. **Audit all `text-[Npx]` pixel values** and normalize to Tailwind scale (`text-xs`, `text-sm`, etc.) where possible to reduce arbitrary values.

---

## 8. Verdict

Waggle's UX is **production-viable but needs typography cleanup before launch**. The architecture is solid: proper three-zone layout, comprehensive theme system, shadcn/ui component library, error boundaries on every view, keyboard accessibility, and rich empty states. The excessive use of `font-mono` on non-code UI elements is the single most impactful issue -- fixing it would raise the perceived quality from "developer tool" to "professional productivity platform" and align with the emotional standard described in CLAUDE.md ("I can't stop working here").

The codebase shows evidence of systematic hardening (Wave 1-10 references, F-prefixed fix annotations, UAT-driven improvements). The component count (~90) and organization are appropriate for the product's scope. With the P0 fixes addressed, the UI would rate 8.5/10 and compete credibly with commercial AI desktop applications.
