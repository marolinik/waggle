# 09 — Ambient Power

Tests the background and always-on features that make Waggle feel like a living system, not a passive tool you have to manually drive. Cron schedules, notifications, and the Cockpit dashboard are what separate a product from a prototype.

---

## Scenario 9.1: Cron Schedules

**Persona**: Luka (Project Manager)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, server running on localhost:3333, default cron schedules present (memory consolidation daily 3am, workspace health Monday 8am)

### Context

Luka wants to understand what Waggle does in the background. He's heard it has scheduled tasks — memory consolidation, workspace health checks — and wants to see what's set up, verify the defaults make sense, and add his own custom schedule for a weekly status digest.

### Steps

1. Navigate to Cockpit or Schedules section. Expect: cron schedule list is visible.
2. Review default schedules. Expect: at least 2 defaults present — "Memory consolidation" (daily, 3:00 AM) and "Workspace health" (Monday, 8:00 AM).
3. Check schedule details. Expect: each schedule shows name, cron expression (human-readable), next run time, and enabled/disabled state.
4. Verify next run time calculation. Expect: next run times are in the future and correctly calculated from the cron expression (e.g., if it's Tuesday, workspace health shows next Monday).
5. Create a custom schedule: "Weekly Status Digest" with cron expression for Friday 5pm. Expect: creation succeeds, new schedule appears in the list.
6. Edit the custom schedule — change time to Friday 4pm. Expect: update succeeds, next run time recalculates.
7. Delete the custom schedule. Expect: deletion succeeds after confirmation, schedule removed from list.

### Functional Checkpoints

- [ ] Cron schedule list is accessible from Cockpit or dedicated section
- [ ] Default schedules are present (memory consolidation, workspace health)
- [ ] Each schedule displays: name, cron expression, next run time, enabled state
- [ ] Next run time is correctly calculated and in the future
- [ ] Custom schedule creation works (name + cron expression)
- [ ] Schedule edit/update works with next run recalculation
- [ ] Schedule deletion works with confirmation
- [ ] CRUD operations hit REST endpoints successfully (`/api/cron/*`)
- [ ] Invalid cron expressions are rejected with clear error messages

### Emotional Checkpoints

- [ ] Orientation: Luka can see all scheduled tasks at a glance — he knows what Waggle does when he's not looking
- [ ] Trust: Default schedules are sensible — memory consolidation and health checks inspire confidence
- [ ] Controlled Power: Luka can create, edit, and delete schedules — the system runs on HIS terms
- [ ] Seriousness: Background tasks signal Waggle is a real platform, not a demo

### Features Exercised

- CronStore CRUD operations
- Default schedule seeding
- Cron expression parsing and next-run calculation
- REST API for schedules
- Schedule list UI
- Validation of cron expressions

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No scheduled tasks. No background behavior. | +2 |
| ChatGPT Desktop | No user-configurable schedules. No background tasks. | +2 |
| Cursor AI | No scheduled automation. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (scheduled background tasks are a key "ambient intelligence" feature)
- Emotional: average feeling score >= 3, Controlled Power must score >= 4

---

## Scenario 9.2: Manual Trigger

**Persona**: Luka (Project Manager)
**Tier**: [SOLO]
**Duration**: 3 minutes
**Prerequisites**: Waggle desktop running, at least one cron schedule exists (default or custom)

### Context

Luka wants to run the "Memory consolidation" task right now instead of waiting until 3am. He should be able to manually trigger any scheduled job on demand — useful for testing, for catching up, or simply because he wants the result now.

### Steps

1. Navigate to the cron schedule list (Cockpit or Schedules section). Expect: schedules visible with a "Run Now" or "Trigger" button on each.
2. Click "Run Now" on "Memory consolidation." Expect: immediate feedback — a spinner, "Running..." state, or progress indicator.
3. Wait for completion. Expect: job completes within a reasonable time (< 30 seconds for consolidation). Status updates to show completion.
4. Check for result notification. Expect: a notification or log entry confirms the job ran and what it did (e.g., "Consolidated 5 memories into 2 summaries").
5. Verify the result. Expect: if memory consolidation ran, consolidated memories should be visible in the workspace memory browser.

### Functional Checkpoints

- [ ] "Run Now" / "Trigger" button exists on each scheduled job
- [ ] Manual trigger initiates the job immediately
- [ ] Job execution shows progress feedback (not a silent fire-and-forget)
- [ ] Job completes within a reasonable timeframe
- [ ] Completion notification or log entry is generated
- [ ] Job result is observable (e.g., consolidated memories appear)
- [ ] Manual trigger does not interfere with the normal schedule (next run time unchanged)

### Emotional Checkpoints

- [ ] Controlled Power: Luka runs what he wants, when he wants — the schedule is a default, not a cage
- [ ] Momentum: From "I want this now" to "it's done" in seconds, not hours
- [ ] Trust: Luka can see what the job did — it's not a black box
- [ ] Orientation: Completion feedback tells Luka the job ran and what changed

### Features Exercised

- Manual cron trigger endpoint (`POST /api/cron/:id/trigger`)
- Job execution pipeline
- Execution feedback / progress indication
- Notification emission on job completion
- Result verification

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No scheduled jobs to trigger. | +2 |
| ChatGPT Desktop | No background jobs, no manual triggers. | +2 |
| Cursor AI | No automation features. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 3 (manual trigger is a power-user feature, not a daily driver)
- Emotional: average feeling score >= 3, Controlled Power must score >= 4

---

## Scenario 9.3: Notification Stream

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, SSE notification endpoint active, at least one triggerable event (cron job or agent completion)

### Context

Mia has Waggle running while she works in other apps. She expects to be notified when something important happens — a cron job completes, an agent finishes a long-running task, or a scheduled health check finds an issue. Notifications should be in-app toasts when focused and OS-level notifications when minimized (Tauri-only).

### Steps

1. Open Waggle desktop and verify the app is connected to the notification stream (SSE). Expect: no visible action required — connection is automatic on startup.
2. Trigger an event: manually run a cron job (from scenario 9.2). Expect: notification appears.
3. With Waggle focused, observe the notification. Expect: in-app toast notification appears — visible but not modal, auto-dismisses after a few seconds.
4. Minimize Waggle to the system tray or background.
5. Trigger another event (run another cron job or wait for one to fire). Expect: OS-level notification appears (Windows notification center toast). *Note: OS notifications require Tauri runtime — skip if testing in browser.*
6. Click the OS notification. Expect: Waggle brings itself to foreground, navigates to the relevant context.

### Functional Checkpoints

- [ ] SSE notification stream connects automatically on app startup
- [ ] In-app toast notifications appear when Waggle is focused
- [ ] Toast notifications are non-modal and auto-dismiss
- [ ] Toast shows meaningful content (event type + summary, not just "something happened")
- [ ] OS-level notifications fire when Waggle is minimized (Tauri only)
- [ ] OS notification click brings Waggle to foreground
- [ ] Multiple rapid notifications don't stack into an unreadable pile

### Emotional Checkpoints

- [ ] Relief: Mia doesn't have to keep checking Waggle — it tells her when something happened
- [ ] Trust: Notifications are accurate and timely — they reflect real events, not noise
- [ ] Orientation: Each notification tells Mia WHAT happened, not just THAT something happened
- [ ] Controlled Power: Notifications inform without interrupting — Mia stays in charge of her attention

### Features Exercised

- SSE notification endpoint
- In-app toast notification rendering
- OS-level notification via Tauri
- Notification content formatting
- App foreground on notification click
- Notification stream resilience (reconnection)

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No notifications. User must check the terminal. | +2 |
| ChatGPT Desktop | No proactive notifications for completed tasks. | +1 |
| Cursor AI | IDE notifications exist but not for background AI tasks. | +1 |

### Pass Criteria

- Functional: all checkpoints pass (OS notification checkpoints can be marked N/A if not testing in Tauri)
- Business: score >= 4 (notifications are how "ambient power" manifests to the user)
- Emotional: average feeling score >= 3, Relief must score >= 4

---

## Scenario 9.4: Cockpit Dashboard

**Persona**: Marko (Developer / Technical Lead)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, server running, at least one cron schedule active, some skills installed, agent has been used in at least one session

### Context

Marko wants a single view of Waggle's operational state — is the LLM provider connected? Are cron jobs running? What skills are installed? What are the runtime stats? The Cockpit is Waggle's control center: health, schedules, capabilities, and trust — all in one dashboard.

### Steps

1. Navigate to Cockpit (top-level navigation). Expect: Cockpit dashboard loads with multiple sections visible.
2. Check Health section. Expect: LLM provider status (connected/disconnected), database status, server uptime or similar health indicators.
3. Check Cron Schedules section. Expect: list of scheduled tasks with names, next run times, and enabled states (consistent with scenario 9.1).
4. Check Runtime Stats section. Expect: meaningful statistics — session count, message count, memory count, or similar operational metrics.
5. Check Trust Audit Trail section. Expect: list of capability install events with timestamps, sources, risk levels (consistent with scenario 7.5).
6. Verify data freshness. Expect: all sections show current data (not stale or cached from app startup). Health status reflects actual current state.
7. Use the `/help` command if available. Expect: help information is accessible and relevant.

### Functional Checkpoints

- [ ] Cockpit is accessible from top-level navigation
- [ ] Health section shows LLM provider status
- [ ] Health section shows database connectivity status
- [ ] Cron schedule section displays all scheduled tasks with next run times
- [ ] Runtime stats section shows operational metrics
- [ ] Trust audit trail section lists install events with metadata
- [ ] All sections display current (not stale) data
- [ ] No section shows errors or fails to render
- [ ] Dashboard loads in < 2 seconds

### Emotional Checkpoints

- [ ] Orientation: Marko sees the full operational state in one view — no digging through menus
- [ ] Trust: Health indicators let Marko verify Waggle is working correctly, not just hoping
- [ ] Controlled Power: Everything is observable — Marko can diagnose issues without guessing
- [ ] Seriousness: The Cockpit feels like a professional control panel, not a settings page
- [ ] Continuity: Stats accumulate over time — the Cockpit reflects Waggle's history, not just current state

### Features Exercised

- Cockpit top-level navigation
- Health status checks (LLM, DB)
- Cron schedule display
- Runtime statistics aggregation
- Trust audit trail display
- Dashboard layout and rendering performance

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No operational dashboard. Status is implicit (it works or it doesn't). | +2 |
| ChatGPT Desktop | No user-facing operational metrics or health dashboard. | +2 |
| Cursor AI | Extension management exists but no unified operational cockpit. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (unified operational visibility is a power-user and enterprise expectation)
- Emotional: average feeling score >= 4, Orientation and Trust must score >= 4
