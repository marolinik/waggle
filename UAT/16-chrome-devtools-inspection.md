# 16. Chrome DevTools Live Inspection

Automated and semi-automated inspection of the running Waggle app using Chrome DevTools MCP server. This captures what manual testing misses: performance, network efficiency, console errors, memory leaks, layout issues, and visual regressions.

Run these inspections alongside the scenario tests in docs 02-14. Each inspection produces artifacts (screenshots, performance traces, network logs) stored in `UAT/artifacts/`.

---

## Setup

1. Start Waggle server: `cd waggle-poc && npx tsx packages/server/src/local/start.ts`
2. Open app in Chrome: `http://localhost:1420` (Vite dev) or via Tauri desktop
3. Chrome DevTools MCP server connected (available as `mcp__chrome-devtools__*` tools)

---

## Inspection A: Visual Regression Baseline

**Purpose**: Capture screenshots of every major surface for baseline comparison.

### Steps
1. Navigate to each surface and take screenshot:
   - Home / Workspace view (with context loaded)
   - Chat view (empty + with messages + with tool cards)
   - Memory Browser (with search results)
   - Settings (each tab: API Keys, Model, Theme, Skills, Advanced)
   - Install Center (Capabilities nav)
   - Cockpit (health + schedules + audit)
   - Onboarding wizard (each step)
   - Session list
   - Context panel (right side — activity, team presence, messages)

2. For each screenshot, verify:
   - [ ] No overlapping elements
   - [ ] Text is readable (contrast, size)
   - [ ] Dark theme renders correctly
   - [ ] Light theme renders correctly
   - [ ] No broken layouts at 1280x720
   - [ ] No broken layouts at 1920x1080

### Tools Used
```
mcp__chrome-devtools__take_screenshot
mcp__chrome-devtools__resize_page (1280x720, then 1920x1080)
mcp__chrome-devtools__navigate_page
```

### Artifacts
- `artifacts/screenshots/home-dark-1920.png`
- `artifacts/screenshots/chat-with-tools-dark-1920.png`
- `artifacts/screenshots/memory-browser-dark-1920.png`
- `artifacts/screenshots/settings-apikeys-dark-1920.png`
- `artifacts/screenshots/install-center-dark-1920.png`
- `artifacts/screenshots/cockpit-dark-1920.png`
- (repeat for light theme and 1280 resolution)

---

## Inspection B: Console Error Audit

**Purpose**: Catch JavaScript errors, unhandled promise rejections, deprecation warnings that users never report.

### Steps
1. Open app, navigate through all major surfaces
2. Perform key actions: send message, switch workspace, open settings, install skill, browse memory
3. Collect ALL console messages

### What to flag
- **CRITICAL**: Any `Error` or `Uncaught` in console during normal navigation
- **WARNING**: React warnings (missing keys, prop type errors, useEffect cleanup issues)
- **INFO**: Deprecation warnings from dependencies
- **OK**: Debug logs from Waggle itself (`[waggle]` prefix)

### Tools Used
```
mcp__chrome-devtools__list_console_messages
mcp__chrome-devtools__get_console_message
```

### Pass Criteria
- Zero `Error` level messages during normal usage flow
- Zero `Uncaught Promise` rejections
- React warnings documented (not blocking but tracked)

---

## Inspection C: Network Efficiency

**Purpose**: Verify API calls are efficient — no redundant fetches, no missing error handling, reasonable response times.

### Steps
1. Clear network, open app
2. Navigate: Home → Chat → Memory → Settings → Install Center → Cockpit
3. Send a chat message, wait for response
4. Switch workspaces
5. Capture all network requests

### What to check
- [ ] Health check: single call on startup, not polling excessively
- [ ] Workspace list: fetched once, not on every render
- [ ] SSE connections: exactly 2 (chat + notifications), not duplicated
- [ ] API responses: all return < 500ms (local server)
- [ ] No 4xx/5xx errors during normal flow
- [ ] WebSocket: single connection, reconnects on drop
- [ ] No fetch to external domains (privacy — all local)

### Tools Used
```
mcp__chrome-devtools__list_network_requests
mcp__chrome-devtools__get_network_request
```

### Artifacts
- `artifacts/network/startup-requests.json`
- `artifacts/network/chat-flow-requests.json`
- `artifacts/network/workspace-switch-requests.json`

---

## Inspection D: Performance Trace

**Purpose**: Measure real performance — startup time, time to interactive, chat response rendering, workspace switching speed.

### Steps
1. Start performance trace
2. Perform: app load → first workspace → first chat message → tool card render → workspace switch
3. Stop trace, analyze

### Metrics to capture
| Metric | Target | Method |
|--------|--------|--------|
| App startup to interactive | < 3s | Performance trace |
| Workspace switch to context loaded | < 1s | Performance trace |
| Chat message send to first token render | < 2s | Network timing |
| Tool card full render | < 500ms | Performance trace |
| Memory browser search result | < 1s | Network timing |
| Install Center catalog load | < 1s | Network timing |

### Tools Used
```
mcp__chrome-devtools__performance_start_trace
mcp__chrome-devtools__performance_stop_trace
mcp__chrome-devtools__performance_analyze_insight
```

### Artifacts
- `artifacts/performance/startup-trace.json`
- `artifacts/performance/chat-flow-trace.json`

---

## Inspection E: Memory Snapshot (Browser Memory)

**Purpose**: Detect memory leaks — especially from SSE connections, WebSocket listeners, and event handlers that aren't cleaned up.

### Steps
1. Take initial memory snapshot
2. Navigate through all surfaces (full loop: home → chat → memory → settings → install → cockpit → back to home)
3. Repeat the loop 5 times
4. Take final memory snapshot
5. Compare: heap size should not grow significantly (< 20% growth indicates possible leak)

### What to flag
- Growing listener counts (EventSource, WebSocket, EventEmitter)
- Detached DOM nodes
- Growing arrays (notification history, toast stack)

### Tools Used
```
mcp__chrome-devtools__take_memory_snapshot
```

### Pass Criteria
- Heap growth < 20% after 5 navigation loops
- No detached DOM node accumulation
- SSE/WebSocket connections: exactly 1 each, not growing

---

## Inspection F: Lighthouse Audit

**Purpose**: Automated quality audit — accessibility, performance, best practices.

### Steps
1. Run Lighthouse on the main app page
2. Run Lighthouse on the settings page
3. Run Lighthouse on the memory browser

### Target Scores
| Category | Target |
|----------|--------|
| Performance | > 80 |
| Accessibility | > 70 |
| Best Practices | > 80 |

### Tools Used
```
mcp__chrome-devtools__lighthouse_audit
```

### Artifacts
- `artifacts/lighthouse/main-page.json`
- `artifacts/lighthouse/settings-page.json`

### Notes
- Score expectations are moderate because this is a desktop Electron/Tauri app, not a public website
- Accessibility matters even in desktop apps (keyboard nav, screen reader basics, color contrast)

---

## Inspection G: Responsive Layout Check

**Purpose**: Verify app doesn't break at different window sizes (users resize Waggle alongside other windows).

### Sizes to test
| Size | Scenario |
|------|---------|
| 1920x1080 | Full screen, large monitor |
| 1280x720 | Laptop |
| 1024x768 | Small window, side-by-side |
| 800x600 | Minimum usable |

### Steps
For each size:
1. Resize browser
2. Take screenshot of: Home, Chat (with tool cards), Settings, Memory Browser
3. Check: sidebar visible/collapsed, chat area usable, context panel handled

### Tools Used
```
mcp__chrome-devtools__resize_page
mcp__chrome-devtools__take_screenshot
```

### Pass Criteria
- All surfaces usable at 1280x720 and above
- At 1024x768: functional but may have minor layout compromises
- At 800x600: no crashes, basic functionality preserved

---

## Inspection H: SSE Stream Health

**Purpose**: Verify SSE connections (chat + notifications) are stable and handle reconnection.

### Steps
1. Open app, verify 2 SSE connections established (chat events + notifications)
2. Monitor for 5 minutes — no disconnects, heartbeats arrive
3. Simulate disconnect (navigate away and back, or network throttle)
4. Verify reconnection within 5 seconds
5. Verify no duplicate SSE connections after reconnect

### Tools Used
```
mcp__chrome-devtools__list_network_requests (filter: EventStream)
mcp__chrome-devtools__evaluate_script (check EventSource readyState)
```

### Pass Criteria
- Exactly 2 SSE connections (not more)
- Reconnection within 5s after network restore
- No message loss during brief disconnection (for chat; notifications are best-effort)

---

## Inspection I: Interactive Flow Testing

**Purpose**: Test real user interactions — clicking, typing, navigating — to verify the UI is responsive and correct.

### Flows to test

**Flow 1: Send a message**
1. Click chat input
2. Type "Hello, can you help me?"
3. Press Enter
4. Wait for response
5. Verify: message appears in chat, agent responds, tool cards render if tools used

**Flow 2: Switch workspace**
1. Click different workspace in sidebar
2. Verify: content changes, no stale data, memory context updates

**Flow 3: Install a skill**
1. Navigate to Capabilities
2. Click Install Center
3. Find an available skill
4. Click Install
5. Verify: confirmation dialog, install completes, skill appears as active

**Flow 4: Use settings**
1. Navigate to Settings
2. Change theme (light/dark toggle)
3. Verify: theme changes immediately
4. Change model selection
5. Verify: model selector updates

### Tools Used
```
mcp__chrome-devtools__click
mcp__chrome-devtools__fill
mcp__chrome-devtools__press_key
mcp__chrome-devtools__wait_for
mcp__chrome-devtools__take_screenshot
```

---

## Execution Order

Run inspections in this order during UAT:

1. **B (Console Errors)** — first, to catch issues that affect everything
2. **A (Visual Baseline)** — capture screenshots before any changes
3. **C (Network)** — during scenario execution
4. **D (Performance)** — dedicated trace session
5. **I (Interactive Flows)** — during persona scenarios
6. **F (Lighthouse)** — once, after smoke test passes
7. **E (Memory Snapshot)** — after extended use testing
8. **G (Responsive)** — once, dedicated session
9. **H (SSE Health)** — during ambient power testing

---

## Artifact Storage

```
UAT/
  artifacts/
    screenshots/       — visual regression baselines
    network/           — request logs
    performance/       — trace files
    lighthouse/        — audit results
    memory/            — heap snapshots
    console/           — error logs
```

Create this structure before running inspections.
