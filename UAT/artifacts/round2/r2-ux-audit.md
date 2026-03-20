# Round 2 UX Audit Report (AG-7)

**Date**: 2026-03-21
**Auditor**: AG-7 (automated source-level verification)
**Scope**: Re-validate all W4 UX fixes + W5 enterprise items against source code
**Branch**: `phase8-wave-8f-ui-ux`

---

## W4 Fix Verification Table

| # | Fix | File(s) | Verdict | Evidence |
|---|-----|---------|---------|----------|
| W4.1 | Sidebar NAV_ITEMS order matches Ctrl+Shift+N shortcuts | `app/src/components/AppSidebar.tsx:29-37` | PASS | Order is Chat(1), Memory(2), Events(3), Capabilities(4), Cockpit(5), Mission Control(6), Settings(7). Comment explicitly references W4.1. |
| W4.2 | EventsView receives `workspaceId` | `app/src/App.tsx:1012` | PASS | `<EventsView ... workspaceId={activeWorkspace?.id} />` passes active workspace ID. EventsView accepts and uses it for session fetching (lines 48, 52, 67, 71). |
| W4.3 | Help button (`?`) in sidebar | `app/src/components/AppSidebar.tsx:24,122-137` | PASS | `onOpenHelp` prop accepted; `?` button rendered with title "Keyboard shortcuts (Ctrl+/)". App.tsx line 930 wires `onOpenHelp={() => setShowHelp(true)}`. |
| W4.4 | `dark:prose-invert` on assistant messages | `packages/ui/src/components/chat/ChatMessage.tsx:218` | PARTIAL | Assistant messages correctly use `dark:prose-invert` (line 218). However, system messages on line 186 still use bare `prose-invert` (no `dark:` prefix). This means system messages force inverted prose colors even in light mode. |
| W4.5 | SettingsPanel uses `serverUrl` prop, no hardcoded `127.0.0.1:3333` | `packages/ui/src/components/settings/SettingsPanel.tsx:29,47-49` | PASS (with fallback) | `serverUrl` prop accepted; `baseUrl = serverUrlProp ?? 'http://127.0.0.1:3333'` -- the fallback is a safe default, not a hard override. App.tsx line 980 passes `serverUrl={SERVER_BASE}` through SettingsView, which forwards it at line 80. |
| W4.6 | Context panel collapse toggle | `packages/ui/src/components/layout/AppShell.tsx:14-15,29-52` | PASS | `contextPanelOpen` and `onToggleContextPanel` props on AppShell. Close button when open (line 33-39), re-open strip when collapsed (line 44-52). App.tsx line 1040-1041 wires both. |
| W4.7 | Responsive auto-collapse sidebar < 1024, panel < 1280 | `app/src/App.tsx:121-136` | PASS | `handleResize` fires on mount + window resize. `w < 1024` collapses sidebar; `w < 1280` closes context panel; `w >= 1280` re-opens it. Comment references W4.7. |
| W4.8 | View emoji icons when sidebar collapsed | `app/src/components/AppSidebar.tsx:30-36,74-76` | PASS | Each NAV_ITEM has an `icon` field (emoji). When `collapsed`, renders `<span>{icon}</span>` instead of the label. Comment references W4.8. |
| W4.9/10 | Code block copy button + language labels | `packages/ui/src/components/chat/ChatMessage.tsx:17-29` | PASS | Custom `Renderer` for `marked` generates a wrapper div with language label header and copy button. Uses `navigator.clipboard.writeText` with `encodeURIComponent`/`decodeURIComponent` pattern. Comment references W4.9/W4.10. |
| W4.11 | Tagline "the AI that remembers your work" | `app/src/components/AppSidebar.tsx:155` | PASS | Exact text: `the AI that remembers your work`, shown below the WAGGLE brand when sidebar is expanded. |
| W4.12 | Mission Control context panel has fleet info | `app/src/components/ContextPanel.tsx:232-256` | PASS | `currentView === 'mission-control'` renders "Fleet Info" header with max sessions, quick actions list, and /spawn tip. Content is substantive (not null). Comment references W4.12. |

### W5 Items

| # | Fix | File(s) | Verdict | Evidence |
|---|-----|---------|---------|----------|
| W5.2 | KVARK Enterprise health card in Cockpit | `app/src/views/CockpitView.tsx:349-372` | PASS | Dedicated Card with "KVARK Enterprise" header, connection indicator dot, description text when not connected, endpoint + last ping when connected. Comment references W5.2. |
| W5.5 | Enterprise section in Capabilities | `app/src/views/CapabilitiesView.tsx:734-744` | PASS | "Enterprise" section header with KVARK badge, description about governed knowledge access, and configuration prompt. Comment references W5.5. |

---

## Outstanding Defect

**W4.4-PARTIAL**: System messages in `ChatMessage.tsx` line 186 use `prose-invert` instead of `dark:prose-invert`. This causes forced inverted typography colors in light mode for system messages (slash command responses). The fix was applied to assistant messages (line 218) but missed the system message block.

**File**: `packages/ui/src/components/chat/ChatMessage.tsx`
**Line**: 186
**Current**: `prose prose-invert prose-sm`
**Expected**: `prose dark:prose-invert prose-sm`

---

## UX Re-Scores

| Dimension | Description | R1 Score | R2 Score | Notes |
|-----------|-------------|----------|----------|-------|
| UX-1 | Navigation & information architecture | 2.5 | 4.5 | NAV_ITEMS ordered correctly (W4.1), shortcuts match, emoji icons when collapsed (W4.8), help button discoverable (W4.3), tagline present (W4.11). |
| UX-2 | Responsive layout & panel management | 2.0 | 4.5 | Auto-collapse sidebar < 1024, context panel < 1280 (W4.7). Context panel toggle with open/close controls (W4.6). Three-zone layout fully wired. |
| UX-3 | Dark/light mode correctness | 3.0 | 4.0 | Assistant messages fixed (`dark:prose-invert`). System messages still use bare `prose-invert` -- light mode affected. Deducting 1 point for this remaining defect. |
| UX-4 | Feature wiring (views receive needed props) | 2.0 | 5.0 | EventsView gets `workspaceId` (W4.2). SettingsPanel gets `serverUrl` (W4.5). CockpitView has KVARK card (W5.2). CapabilitiesView has Enterprise section (W5.5). Mission Control context panel has fleet info (W4.12). All views properly code-split with Suspense. |
| UX-5 | Content rendering (markdown, code blocks) | 2.5 | 4.5 | Custom renderer with language labels + copy button (W4.9/W4.10). DOMPurify sanitization in place. Code blocks get proper wrapper with hover-to-reveal copy. |
| UX-6 | Discoverability & onboarding cues | 2.0 | 4.5 | Help button (W4.3) with "?" icon and Ctrl+/ shortcut. Tagline communicates product identity (W4.11). Global search (Ctrl+K) wired. Persona switcher (Ctrl+Shift+P) available. Keyboard shortcuts help overlay present. |

### Score Summary

| | R1 Average | R2 Average |
|---|-----------|-----------|
| **Overall UX** | **2.3** | **4.5** |

Improvement: +2.2 points average across all dimensions.

---

## Recommendations

1. **Fix W4.4-PARTIAL**: Change line 186 of `ChatMessage.tsx` from `prose prose-invert` to `prose dark:prose-invert` to match the assistant message treatment.
2. All other W4 fixes are verified and correctly implemented.
3. W5.2 and W5.5 enterprise items are in place and functional.

---

Report COMPLETE
