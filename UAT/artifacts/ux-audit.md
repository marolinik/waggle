# Waggle UX & Ergonomics Audit (AG-7)

**Auditor**: AG-7 (UX & Ergonomics Auditor)
**Date**: 2026-03-20
**Branch**: `phase8-wave-8f-ui-ux`
**Methodology**: Source code analysis of all view/component files + live app inspection via Chrome DevTools

---

## Executive Summary

**Overall UX Score: 3.6 / 5.0**

Waggle demonstrates strong architectural UX foundations -- workspace-native model, three-panel layout, persistent memory, keyboard shortcuts, and a comprehensive feature set. However, several issues prevent it from reaching production polish:

1. **CRITICAL**: Static asset serving broken in web mode -- the Fastify server SPA fallback intercepts `/assets/*` requests, returning HTML instead of JS/CSS. The frontend is blank when accessed at `http://localhost:3333`.
2. **HIGH**: Keyboard shortcut labels in the sidebar (`^1-7`) do not match actual shortcuts (`Ctrl+Shift+1-7`), and the sidebar view order differs from the keyboard help documentation.
3. **HIGH**: No responsive breakpoints in the AppShell layout -- context panel (280px fixed) never collapses, causing content squeeze on narrow viewports.
4. **MEDIUM**: The `prose-invert` class on assistant messages causes light theme readability issues (inverted typography colors on light backgrounds).

**Strengths**: Professional dark palette (Direction D), comprehensive keyboard shortcut system, well-structured three-panel layout, workspace-native mental model, smart empty states with contextual suggestions, approval gates with human-readable descriptions, three-layer tool transparency (inline/detail/raw JSON).

---

## UX-1: First Impression -- 30-Second Test

### Test Conditions
- Server running at `http://localhost:3333` (Fastify API + static build serving)
- Vite dev server not running (port 1420 refused -- expected, Tauri-native app)
- Browser: Chrome via DevTools MCP

### Screenshots
- `UAT/artifacts/screenshots/ux-01-first-load.png` -- Blank white page

### Findings

| Criterion | Score | Evidence |
|-----------|-------|----------|
| Professional first screen | 1/5 | **CRITICAL**: Blank white page. Static asset MIME types are `text/html` instead of `application/javascript`/`text/css`. Console shows 4 errors about module script MIME types and rejected stylesheets. The SPA fallback in `packages/server/src/local/index.ts:1225-1232` catches `/assets/*` requests before `@fastify/static` can serve them. |
| Onboarding communicates value in <=3 steps | 4/5 | Code analysis: `OnboardingWizard` has 4 steps (Name, API Key, Workspace, Ready) with clear progress dots. The flow is clean and purposeful. One step over the 3-step ideal but justified. |
| Post-onboarding screen: orienting or overwhelming | 4/5 | `ChatArea.tsx` shows "Workspace Now" block with summary, decisions, threads, memories, and suggested prompts when messages are empty. Smart contextual suggestions based on workspace name. Well-structured orientation. |
| New user understands purpose in <15 seconds | 3/5 | The empty state shows workspace name and contextual hints ("Conversations build memory"), but there is no explicit tagline or value proposition visible. The brand header just says "WAGGLE v1.0". |
| Typography appropriate for professional tool | 4/5 | Inter for UI text, JetBrains Mono for monospace. Font sizing is well-calibrated (13px base, 11px for secondary). The `font-mono` usage throughout the sidebar gives it a technical/professional feel. |

**UX-1 Average: 3.2/5**

### Critical Finding: UX-1-CRIT-001 -- Web Mode Renders Blank Page

- **Severity**: CRITICAL
- **File**: `packages/server/src/local/index.ts:1224-1232`
- **Issue**: The `setNotFoundHandler` SPA fallback does not exclude `/assets/` paths. When `@fastify/static` plugin (registered with `wildcard: false`) does not match a request via its own routing, the not-found handler fires and serves `index.html` with `text/html` MIME type for JS/CSS assets.
- **Impact**: The entire frontend is non-functional when accessed via browser at `http://localhost:3333`. This blocks web mode, Docker deployment, and any non-Tauri access.
- **Fix**: Add `/assets/` to the exclusion list in the SPA fallback handler:
  ```
  if (request.url.startsWith('/api/') || request.url.startsWith('/v1/') ||
      request.url.startsWith('/assets/') ||  // <-- ADD THIS
      request.url === '/health' || request.url === '/ws') {
  ```

---

## UX-2: Navigation Efficiency Measurement

### Sidebar Navigation Analysis

**File**: `app/src/components/AppSidebar.tsx`

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Sidebar exists | PASS | `Sidebar` component with collapsible toggle (`w-12` collapsed, `w-[200px]` expanded). Brand logo, search button, workspace tree, nav items. |
| Clear active state | PASS | Active nav item gets `bg-primary/10 border-l-primary text-primary` plus a `bg-primary` dot indicator. Distinct visual treatment. |
| Keyboard shortcuts documented | PARTIAL | Tooltips show `^1` through `^7` (implying Ctrl+1-7), but actual shortcuts are Ctrl+Shift+1-7. See UX-2-HIGH-001. |
| Dead clicks | PASS | All sidebar buttons have `onClick` handlers connected to `onViewChange`, `onCreateWorkspace`, `onOpenSearch`, `toggleTheme`. |
| Missing hover states | PASS | All items have `hover:text-foreground hover:bg-muted/50` or equivalent transitions. |
| Unlabeled/ambiguous icons | LOW | Sidebar uses text labels, not icons. When collapsed, only a small dot indicator is visible per nav item -- no icon or label. Users must expand to see what each dot means. |

### Keyboard Shortcut Inventory

**Files**: `app/src/hooks/useKeyboardShortcuts.ts`, `app/src/components/KeyboardShortcutsHelp.tsx`

| Shortcut | Action | Documented | Working (code) |
|----------|--------|------------|-----------------|
| Ctrl+K | Global Search | Yes | Yes |
| Ctrl+N | New Workspace | Yes | Yes |
| Ctrl+, | Settings | Yes | Yes |
| Ctrl+/ | Keyboard Help | Yes | Yes |
| Ctrl+T | New Tab | Yes | Yes |
| Ctrl+Shift+W | Toggle Sidebar | Yes | Yes |
| Ctrl+1-9 | Switch Workspace | Yes | Yes |
| Ctrl+Shift+1-7 | Switch Views | Yes (in Help) | Yes |
| Ctrl+Shift+P | Switch Persona | Yes | Yes |
| Escape | Close Modals | Implicit | Yes |

### Findings

#### UX-2-HIGH-001: Sidebar Shortcut Labels Mismatch Actual Shortcuts

- **Severity**: HIGH
- **Files**: `app/src/components/AppSidebar.tsx:59,74-76` vs `app/src/hooks/useKeyboardShortcuts.ts:104-112` vs `app/src/components/KeyboardShortcutsHelp.tsx:49-60`
- **Issue**: Three-way inconsistency:
  1. **Sidebar tooltips** say `Ctrl+1` through `Ctrl+7` (e.g., `title="Chat (Ctrl+1)"`)
  2. **Sidebar labels** show `^1` through `^7` (matching the tooltip claim)
  3. **Actual keyboard handler** uses `Ctrl+Shift+1` through `Ctrl+Shift+7` (`switchView1` through `switchView7`)
  4. **Keyboard Help overlay** correctly documents `Ctrl+Shift+1` through `Ctrl+Shift+7`
  5. **Ctrl+1-9 without Shift** actually switches **workspaces**, not views
- **Impact**: Users pressing `Ctrl+2` expecting Capabilities view will instead switch to their second workspace. Misleading UI labels.

#### UX-2-HIGH-002: Sidebar View Order vs Keyboard Help Order Mismatch

- **Severity**: HIGH
- **Files**: `app/src/components/AppSidebar.tsx:27-35` vs `app/src/components/KeyboardShortcutsHelp.tsx:49-60`
- **Issue**: The sidebar lists views in order: Chat(1), Capabilities(2), Cockpit(3), Mission Control(4), Memory(5), Events(6), Settings(7). But the keyboard help and the actual keyboard handler map: 1=Chat, 2=Memory, 3=Events, 4=Capabilities, 5=Cockpit, 6=Mission Control, 7=Settings. The numbering is completely different.
- **Impact**: Even if a user reads the keyboard help, the sidebar numbers conflict with what they learned.

#### UX-2-LOW-001: Collapsed Sidebar Shows Only Dots

- **Severity**: LOW
- **File**: `app/src/components/AppSidebar.tsx:70`
- **Issue**: When sidebar is collapsed, each nav item shows only a 4px dot (`w-1 h-1 rounded-full`). No icons, no abbreviated labels. Users cannot identify which view is which without expanding the sidebar.
- **Suggestion**: Add view-specific icons (e.g., chat bubble, brain, gear) visible in collapsed mode.

---

## UX-3: Chat Interface Deep Audit

### Files Analyzed
- `packages/ui/src/components/chat/ChatArea.tsx`
- `packages/ui/src/components/chat/ChatMessage.tsx`
- `packages/ui/src/components/chat/ChatInput.tsx`
- `packages/ui/src/components/chat/ToolCard.tsx`
- `packages/ui/src/components/chat/ApprovalGate.tsx`

| # | Criterion | Score | Evidence |
|---|-----------|-------|----------|
| 1 | Loading indicator visible during streaming | 5/5 | Three animated bouncing dots at `ChatArea.tsx:366-371` with `animate-bounce` and staggered delays (0ms, 150ms, 300ms). Has `role="status"` and `aria-label="Agent is thinking"`. Excellent. |
| 2 | User vs agent messages visually distinct | 5/5 | User: `bg-primary text-primary-foreground`, right-aligned (`justify-end`). Agent: `bg-card border border-border text-foreground`, left-aligned (`justify-start`). System: centered, `bg-muted`. Clear three-way distinction. |
| 3 | Tool cards: compact/expand discoverable | 4/5 | Three-layer system (inline/detail/raw JSON) via click cycling at `ToolCard.tsx:261-265`. Collapsed indicator arrow at 30% opacity. Adjacent completed tools auto-group with "X tools completed" summary. The layer indicator is very small (8px) but functional. |
| 4 | Scroll: auto-follows new messages | 5/5 | `ChatArea.tsx:144-150`: Auto-scrolls only when `messages.length > prevMessageCount.current` (new messages only, not re-renders). Scroll position persisted per-session via `scrollPositions` Map. Excellent implementation. |
| 5 | Code blocks: syntax highlighting + copy | 3/5 | Markdown renders via `marked` + `DOMPurify` at `ChatMessage.tsx:142-149`. Code blocks get styled backgrounds. **No syntax highlighting** (no highlight.js/Prism/Shiki). Copy button exists for the whole message but **not per code block**. |
| 6 | Markdown rendering | 5/5 | Full GFM support via `marked` with `gfm: true, breaks: true`. Extensive Tailwind prose classes for h1-h3, p, li, ul/ol, code, pre, strong, a, blockquote, table (via allowed tags). All standard markdown elements render. |
| 7 | Long response truncation + show more | 2/5 | No truncation mechanism for long messages. The `max-w-[85%]` constraint limits width but not height. Very long responses render in full, potentially creating scroll fatigue. ToolCard results truncate at 100 lines (`formatResultDetail`), but message content does not. |
| 8 | Network error state | 3/5 | Offline detection via `useOfflineStatus` hook with amber pulsing indicator in StatusBar. Shows "LLM Connection Lost" tooltip with queued message count. However, no inline error state within the chat area itself -- errors are only visible in the status bar. |
| 9 | Empty workspace state | 5/5 | Two-tier empty state: (1) With workspace context: shows "Workspace Now" block with summary, decisions, blockers, tasks, threads, memories, and suggested prompts. (2) Without context: shows geometric icon, workspace name, contextual suggestions based on workspace name (`getContextualSuggestions`). Excellent onboarding. |
| 10 | Input field: auto-focused, meaningful placeholder | 5/5 | `ChatInput.tsx:55-57`: Auto-focuses via `useEffect` on mount. Placeholder adapts: "Ask what matters here, continue a task, or draft something..." (with workspace context) or "Type a message... (/ for commands)" (default). |

**UX-3 Average: 4.2/5**

### Additional Chat Findings

#### UX-3-MED-001: No Per-Code-Block Copy Button

- **Severity**: MEDIUM
- **File**: `packages/ui/src/components/chat/ChatMessage.tsx:271-279`
- **Issue**: Copy button copies the entire message content. Code blocks rendered via marked output do not have individual copy buttons. This is a common expectation in AI chat interfaces.

#### UX-3-MED-002: No Syntax Highlighting in Code Blocks

- **Severity**: MEDIUM
- **File**: `packages/ui/src/components/chat/ChatMessage.tsx:209-210`
- **Issue**: Code blocks use styled backgrounds but have no language-specific syntax coloring. `marked` produces `<pre><code class="language-xxx">` tags but no highlighter processes them.

#### UX-3-MED-003: prose-invert on Light Theme

- **Severity**: MEDIUM
- **File**: `packages/ui/src/components/chat/ChatMessage.tsx:202-203`
- **Issue**: Assistant message content uses `prose prose-invert max-w-none`. The `prose-invert` class is designed for dark backgrounds. In light theme (`data-theme="light"`), this causes light-on-light text, reducing readability. Should conditionally apply `prose-invert` only in dark mode.

#### UX-3-LOW-001: Attachment Button Uses "+" Instead of Paperclip Icon

- **Severity**: LOW
- **File**: `packages/ui/src/components/chat/ChatInput.tsx:207-213`
- **Issue**: The file attachment button displays a plain `+` character. A paperclip or attachment icon would be more discoverable and standard.

---

## UX-4: Information Architecture Discoverability

**Test**: Can a first-time user find these features without documentation?

| Feature | Found? | How | Difficulty |
|---------|--------|-----|------------|
| Install a skill | Yes | Capabilities view > "Individual Skills" tab > "Create Skill" button, or "Packs" tab with Install buttons | Easy (2 clicks) |
| See what agent did (tool transparency) | Yes | Tool trail in assistant messages with expand toggle. "X tools / Y steps" label. | Easy (1 click to expand) |
| Switch workspaces | Yes | Sidebar workspace tree, visible by default. Also Ctrl+1-9. | Easy (1 click) |
| Workspace home / orientation view | Yes | Shown automatically when entering workspace with no messages. "Workspace Now" block with catch-up. | Automatic |
| Settings | Yes | Sidebar nav item "Settings" at bottom. Also Ctrl+, or Ctrl+Shift+7. | Easy (1 click) |
| Keyboard shortcuts list | Partial | Must know Ctrl+/ to open help overlay. No visible button or menu item for it. | Hard (requires prior knowledge) |
| Create a new workspace | Yes | Sidebar "+" button with dashed border, labeled "new workspace". Also Ctrl+N. | Easy (1 click) |

**Discoverability Score: 6/7 found = 4.3/5**

### Finding

#### UX-4-MED-001: Keyboard Shortcuts Help Not Discoverable Via UI

- **Severity**: MEDIUM
- **File**: `app/src/components/KeyboardShortcutsHelp.tsx`
- **Issue**: The keyboard shortcuts help overlay is only accessible via `Ctrl+/`. There is no visible button, menu item, or "?" icon in the UI to access it. A small `?` icon in the status bar or sidebar footer would improve discoverability.

---

## UX-5: Emotional Dimension Scoring -- All 7 Views x 8 Dimensions

### Scoring Scale
1 = Actively harmful/confusing, 2 = Deficient, 3 = Acceptable, 4 = Good, 5 = Excellent

### Chat View
**Files**: `app/src/views/ChatView.tsx`, `packages/ui/src/components/chat/ChatArea.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 5 | "Workspace Now" block with summary, decisions, tasks, threads. Contextual suggestions. Name-based hint generation. |
| Relief | 4 | "Welcome back -- here's where things stand." Catch-up prompts reduce cognitive load. No overwhelming wall of options. |
| Momentum | 4 | Suggested prompt chips enable quick action. Tab system for parallel conversations. Sub-agent progress panel shows work in flight. |
| Trust | 5 | Tool transparency with three layers (inline/detail/raw JSON). Approval gates with human-readable descriptions. Copy button on messages. DOMPurify sanitization in code. |
| Continuity | 5 | Scroll position persistence per session. Session list in context panel. Workspace context loads automatically. |
| Seriousness | 4 | Professional typography, consistent color palette. Markdown rendering for structured responses. |
| Alignment | 4 | Persona switcher (Ctrl+Shift+P). Workspace-specific context and memory. |
| Controlled Power | 4 | 13 slash commands, file drop, file attachment, tab management, approval gates. |
| **AVG** | **4.4** | |

### Memory View
**Files**: `app/src/views/MemoryView.tsx`, `packages/ui/src/components/memory/MemoryBrowser.tsx`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 4 | Search bar, type filter chips, source filter dropdown. Two-panel layout (timeline + detail). |
| Relief | 3 | Browsing memories is available but there is no summary or "what matters" view -- just raw chronological frames. |
| Momentum | 3 | Can search and filter, but no "act on this memory" workflow. View-only. |
| Trust | 4 | Shows all memory data transparently with source attribution (personal/workspace). |
| Continuity | 4 | Selected frame persists in context panel. Memory stats in footer. |
| Seriousness | 4 | Professional layout with filter chips and source selector. |
| Alignment | 3 | No way to manually edit or annotate memories from this view. |
| Controlled Power | 3 | Search + filter + type selection. No bulk operations, no export, no delete from UI. |
| **AVG** | **3.5** | |

### Capabilities View
**Files**: `app/src/views/CapabilitiesView.tsx`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 5 | Three-tab layout (Packs, Marketplace, Individual Skills). Clear section headers, pack counts. |
| Relief | 4 | Bulk pack install with progress bars. "Installed" badges. Community packs clearly separated. |
| Momentum | 5 | One-click install, search with debounce, category/type filter chips, sort options. Create Skill inline form. |
| Trust | 4 | Install status tracking, error display per-package, retry button for failures. SecurityGate mention in types. |
| Continuity | 3 | No persistent state across visits -- filter selections reset on view switch. |
| Seriousness | 5 | Rich marketplace grid with stars, downloads, version badges. Professional category chips. |
| Alignment | 4 | Category filtering, type badges (Skill/Plugin/MCP), target role display on packs. |
| Controlled Power | 5 | Install/uninstall, bulk pack install, create custom skills, search/filter/sort, retry failed installs. |
| **AVG** | **4.4** | |

### Cockpit View
**Files**: `app/src/views/CockpitView.tsx`, `app/src/components/cockpit/`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 4 | 10-card dashboard grid with clear titles (System Health, Service Health, Cost, Memory, etc.). Header describes purpose. |
| Relief | 4 | Skeleton loading states during fetch. Auto-refresh every 30s. Error state with retry button. |
| Momentum | 3 | Dashboard is read-only. Quick actions in context panel are limited (only "Refresh Health" works; "Trigger Sync" is disabled). |
| Trust | 5 | Transparent system health data: uptime, memory usage, service versions, cron schedules, audit trail, costs. |
| Continuity | 4 | Auto-refresh maintains currency. Cost tracking across sessions. |
| Seriousness | 5 | Professional dashboard layout. 10 distinct operational cards. Responsive grid. |
| Alignment | 3 | No customization of which cards are visible or their arrangement. |
| Controlled Power | 3 | Can toggle/trigger cron schedules, connect/disconnect connectors. But most cards are informational only. |
| **AVG** | **3.9** | |

### Mission Control View
**Files**: `app/src/views/MissionControlView.tsx`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 4 | Clear header "Agent fleet overview" with session count. Resource summary cards at bottom. |
| Relief | 3 | Empty state is friendly ("No active agents" with bee). But does not guide user on how to create agents. |
| Momentum | 4 | Pause/Resume/Kill buttons for each agent session. 3-second auto-refresh. |
| Trust | 4 | Per-agent status dots (active/paused/error), duration, tool count. Confirm dialog on Kill. |
| Continuity | 3 | Auto-refresh keeps data current but no historical view of past sessions. |
| Seriousness | 4 | Clean card layout with border-left color coding by status. Resource summary grid. |
| Alignment | 3 | Shows persona icon per agent but limited persona-specific controls. |
| Controlled Power | 4 | Pause, Resume, Kill operations. But no "spawn new agent" button from this view. |
| **AVG** | **3.6** | |

### Events View
**Files**: `app/src/views/EventsView.tsx`, `packages/ui/src/components/events/EventStream.tsx`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 4 | Two tabs: Live Events and Session Replay. Event count shown. Filter chips for step types. |
| Relief | 3 | Auto-scroll toggle is helpful. But event stream can be overwhelming during active agent work. |
| Momentum | 3 | Can filter by step type and toggle auto-scroll. Session replay allows browsing past timelines. |
| Trust | 5 | Full transparency into every agent step, tool call, and reasoning step. Step-level detail with expand/collapse. |
| Continuity | 4 | Session Replay tab persists timeline data. Session picker for historical browsing. |
| Seriousness | 4 | Professional event stream with type-coded icons and timing information. |
| Alignment | 3 | Filter state is managed but not persisted. Context panel has additional filter checkboxes (not connected to main filter). |
| Controlled Power | 3 | Filter + auto-scroll + session picker. No export, no search within events. |
| **AVG** | **3.6** | |

### Settings View
**Files**: `app/src/views/SettingsView.tsx`, `packages/ui/src/components/settings/`

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Orientation | 4 | Tab-based organization (General, Models, Vault, Permissions, Team, Advanced). Context panel shows section help text. |
| Relief | 4 | Timeout error handling (10s) with retry. Clean loading state. API key test functionality. |
| Momentum | 4 | Inline editing, API key testing, theme toggle, team connection management. |
| Trust | 4 | Vault for encrypted credentials. Permission controls. Transparent configuration. |
| Continuity | 4 | Config persists across sessions. Active tab syncs with context panel help text. |
| Seriousness | 4 | Professional settings panel with clear labels and organized sections. |
| Alignment | 4 | Personalization options: theme, default model, workspace defaults. |
| Controlled Power | 4 | Full config management, API key testing, team connection, vault management. |
| **AVG** | **4.0** | |

### Emotional Dimension Summary Matrix

| View | Orient | Relief | Momentum | Trust | Contin. | Serious | Align | Power | AVG |
|------|--------|--------|----------|-------|---------|---------|-------|-------|-----|
| Chat | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | **4.4** |
| Memory | 4 | 3 | 3 | 4 | 4 | 4 | 3 | 3 | **3.5** |
| Capabilities | 5 | 4 | 5 | 4 | 3 | 5 | 4 | 5 | **4.4** |
| Cockpit | 4 | 4 | 3 | 5 | 4 | 5 | 3 | 3 | **3.9** |
| Mission Ctrl | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 4 | **3.6** |
| Events | 4 | 3 | 3 | 5 | 4 | 4 | 3 | 3 | **3.6** |
| Settings | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4.0** |
| **Column AVG** | **4.3** | **3.6** | **3.7** | **4.4** | **3.9** | **4.3** | **3.4** | **3.7** | **3.9** |

**Target: Average >= 4.0 per view**: Chat (4.4 PASS), Memory (3.5 FAIL), Capabilities (4.4 PASS), Cockpit (3.9 FAIL), Mission Control (3.6 FAIL), Events (3.6 FAIL), Settings (4.0 PASS).

**Target: No dimension below 3.0**: ALL PASS (lowest is Alignment at 3.0 for Memory/Cockpit/Mission Control/Events).

**Views meeting 4.0 threshold**: 3/7 (Chat, Capabilities, Settings)
**Views below threshold**: 4/7 (Memory, Cockpit, Mission Control, Events)

---

## UX-6: Viewport Responsiveness

### CSS Analysis

**Files analyzed**: `app/src/styles/globals.css`, `app/src/styles/waggle-theme.css`, `packages/ui/src/components/layout/AppShell.tsx`, `packages/ui/src/components/layout/responsive-utils.ts`

### Responsive Infrastructure

| Feature | Status | Evidence |
|---------|--------|----------|
| `@media` queries in CSS | ABSENT | Zero `@media` queries in `globals.css` or `waggle-theme.css`. |
| `@media` queries in components | ABSENT | Zero `@media` queries in any `packages/ui/src` component. |
| Tailwind responsive prefixes | MINIMAL | Only `md:` in CockpitView grid (`md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]`) and `sm:` in shadcn dialog/button primitives. No `lg:`, `xl:`, or `2xl:` prefixes in app views. |
| `responsive-utils.ts` | UNUSED | Defines breakpoints (800, 1024, 1440, 1920) and helper functions (`getLayoutMode`, `shouldCollapseSidebar`, `getSidebarWidth`), but **none are imported or used** by any component. |

### Viewport Analysis

| Viewport | Sidebar | Content | Context Panel | Status |
|----------|---------|---------|---------------|--------|
| 1920x1080 | 200px | ~1440px | 280px | Good: ample content space |
| 1440x900 | 200px | ~960px | 280px | Acceptable: content somewhat narrow |
| 1280x800 | 200px | ~800px | 280px | Tight: content area only 800px for Cockpit cards (min 420px each in 2-col grid) |
| 1024x768 | 200px | ~544px | 280px | **PROBLEM**: Content area only 544px. Cockpit grid forced to single column. Chat max-width constrained. Context panel takes 27% of screen. |

### Findings

#### UX-6-HIGH-001: Context Panel Never Collapses

- **Severity**: HIGH
- **File**: `packages/ui/src/components/layout/AppShell.tsx:28`
- **Issue**: The context panel is fixed at `w-[280px] min-w-[280px]` with no responsive behavior. On viewports <= 1280px, this steals disproportionate screen real estate. The `contextPanelOpen` state in App.tsx is initialized to `true` and never toggled (no toggle handler exists).
- **Impact**: On 1024px-wide screens, content area is only ~544px. Professional users with smaller monitors or split-screen workflows lose significant usable space.

#### UX-6-HIGH-002: responsive-utils.ts Entirely Unused

- **Severity**: HIGH
- **File**: `packages/ui/src/components/layout/responsive-utils.ts`
- **Issue**: A complete responsive layout utility module exists with breakpoints (compact: 800, medium: 1024, wide: 1440, ultrawide: 1920) and helper functions, but is not imported by any component. It was likely written for Phase 8F but never wired up.

#### UX-6-MED-001: Sidebar Lacks Auto-Collapse on Narrow Viewports

- **Severity**: MEDIUM
- **File**: `packages/ui/src/components/common/Sidebar.tsx`
- **Issue**: Sidebar has a manual toggle but no automatic collapse based on viewport width. The `shouldCollapseSidebar` function in `responsive-utils.ts` was designed for this but is unused.

---

## Consolidated Findings Summary

### CRITICAL (1)

| ID | Finding | File | Impact |
|----|---------|------|--------|
| UX-1-CRIT-001 | Web mode renders blank page -- SPA fallback intercepts `/assets/*` | `packages/server/src/local/index.ts:1225-1232` | Frontend completely non-functional outside Tauri |

### HIGH (4)

| ID | Finding | File | Impact |
|----|---------|------|--------|
| UX-2-HIGH-001 | Sidebar shortcut labels (`^1-7`) mismatch actual shortcuts (`Ctrl+Shift+1-7`) | `app/src/components/AppSidebar.tsx:59,74-76` | Users trigger wrong actions |
| UX-2-HIGH-002 | Sidebar view numbering order differs from keyboard help order | `app/src/components/AppSidebar.tsx:27-35` vs `KeyboardShortcutsHelp.tsx:49-60` | Confusing cross-reference between sidebar and help |
| UX-6-HIGH-001 | Context panel never collapses (fixed 280px, no toggle) | `packages/ui/src/components/layout/AppShell.tsx:28` | Content squeeze on <1280px viewports |
| UX-6-HIGH-002 | responsive-utils.ts exists but is entirely unused | `packages/ui/src/components/layout/responsive-utils.ts` | No responsive behavior despite infrastructure being built |

### MEDIUM (5)

| ID | Finding | File | Impact |
|----|---------|------|--------|
| UX-3-MED-001 | No per-code-block copy button | `packages/ui/src/components/chat/ChatMessage.tsx` | Common expectation in AI chat UIs unmet |
| UX-3-MED-002 | No syntax highlighting in code blocks | `packages/ui/src/components/chat/ChatMessage.tsx:209` | Code readability reduced |
| UX-3-MED-003 | `prose-invert` applied unconditionally (breaks light theme) | `packages/ui/src/components/chat/ChatMessage.tsx:202` | Light theme text readability issue |
| UX-4-MED-001 | Keyboard shortcuts help only via Ctrl+/ (no visible UI element) | `app/src/components/KeyboardShortcutsHelp.tsx` | Discoverability gap |
| UX-6-MED-001 | Sidebar lacks auto-collapse on narrow viewports | `packages/ui/src/components/common/Sidebar.tsx` | Wasted space on compact screens |

### LOW (2)

| ID | Finding | File | Impact |
|----|---------|------|--------|
| UX-2-LOW-001 | Collapsed sidebar shows only dots, no icons | `app/src/components/AppSidebar.tsx:70` | Collapsed sidebar unusable for navigation |
| UX-3-LOW-001 | File attachment button uses "+" instead of paperclip icon | `packages/ui/src/components/chat/ChatInput.tsx:207` | Minor discoverability issue |

### INFO (4)

| ID | Finding | File | Notes |
|----|---------|------|-------|
| UX-INFO-001 | OnboardingWizard has 4 steps, not 3 | `packages/ui/src/components/onboarding/OnboardingWizard.tsx` | Acceptable -- Name, API Key, Workspace, Ready |
| UX-INFO-002 | Memory view is read-only (no edit/delete/export) | `packages/ui/src/components/memory/MemoryBrowser.tsx` | Phase 8 scope may address this |
| UX-INFO-003 | Events view context panel filter checkboxes not wired to main filter | `app/src/components/ContextPanel.tsx:316-358` | Cosmetic -- filters are independent |
| UX-INFO-004 | CockpitView is the only view using Tailwind responsive prefix (`md:`) | `app/src/views/CockpitView.tsx:50,323` | Other views do not adapt to screen size |

---

## Recommendations (Priority Order)

1. **Fix web mode static serving** (CRITICAL): Add `/assets/` exclusion to SPA fallback handler in `packages/server/src/local/index.ts`.

2. **Align sidebar shortcuts with actual keybindings** (HIGH): Either change sidebar labels from `^1-7` to `^Shift+1-7`, or reorder the sidebar to match the keyboard help mapping, or remap the keyboard shortcuts to match sidebar order.

3. **Wire up responsive-utils.ts** (HIGH): Import and use `shouldCollapseSidebar`, `shouldShowSidebar`, and `getContentMaxWidth` in AppShell and Sidebar components. Add a context panel toggle button and auto-hide on compact viewports.

4. **Add syntax highlighting** (MEDIUM): Integrate `highlight.js` or `shiki` with `marked` for code block rendering. Add per-code-block copy buttons via a custom `marked` renderer.

5. **Fix prose-invert for light theme** (MEDIUM): Conditionally apply `prose-invert` based on current theme context. Use `dark:prose-invert` Tailwind class instead of unconditional `prose-invert`.

6. **Add keyboard help button to UI** (MEDIUM): Add a `?` icon button in the sidebar footer or status bar that opens the keyboard shortcuts overlay.

7. **Add view icons to collapsed sidebar** (LOW): Replace dot-only collapsed nav with small SVG icons per view.

---

## Score Summary

| Section | Score | Weight | Weighted |
|---------|-------|--------|----------|
| UX-1: First Impression | 3.2/5 | 20% | 0.64 |
| UX-2: Navigation Efficiency | 3.5/5 | 15% | 0.53 |
| UX-3: Chat Interface | 4.2/5 | 25% | 1.05 |
| UX-4: Discoverability | 4.3/5 | 10% | 0.43 |
| UX-5: Emotional Dimensions | 3.9/5 | 20% | 0.78 |
| UX-6: Responsiveness | 2.5/5 | 10% | 0.25 |
| **OVERALL** | | | **3.68/5** |

**Verdict**: Waggle has strong UX bones -- the workspace-native model, memory system, tool transparency, and chat interface are well-designed. The critical web-mode bug, shortcut mismatches, and absent responsive behavior are the primary barriers to a professional production experience. Fixing the 1 CRITICAL and 4 HIGH issues would raise the overall score to approximately 4.2/5.
