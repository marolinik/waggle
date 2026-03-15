# UAT Results Template

Copy this file for each test run. Fill in results as you execute scenarios.

---

## 1. Test Run Info

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Tester** | |
| **Environment** | Windows / macOS / Linux |
| **App Version** | |
| **Commit Hash** | |
| **Server Version** | |
| **Node.js Version** | |
| **Test Suite** | Full / Partial (specify which files) |
| **Notes** | |

---

## 2. Per-Scenario Results

Record each scenario executed. Use scenario IDs from the UAT files (e.g., 11-D1 = Habit Formation Day 1).

### Scoring Key

- **Pass/Fail**: All functional checkpoints met = Pass
- **Business Score**: 1-5 (see 00-methodology.md)
- **Emotional Scores**: 1-5 per feeling (see 00-methodology.md)

### Results Table

| Scenario ID | Scenario Name | Pass/Fail | Business (1-5) | Orientation | Relief | Momentum | Trust | Continuity | Seriousness | Alignment | Ctrl Power | Emotional Avg | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 11-D1 | Habit: Day 1 Discovery | | | | | | | | | | | | |
| 11-D2 | Habit: Day 2 First Real Work | | | | | | | | | | | | |
| 11-D3 | Habit: Day 3 Momentum | | | | | | | | | | | | |
| 11-D4 | Habit: Day 4 Power Features | | | | | | | | | | | | |
| 11-D5 | Habit: Day 5 Return Test | | | | | | | | | | | | |
| 12-T1 | Benchmark: Memory Recall | | | | | | | | | | | | |
| 12-T2 | Benchmark: Research | | | | | | | | | | | | |
| 12-T3 | Benchmark: Catch-Up | | | | | | | | | | | | |
| 13.1 | Persona: Mia Consultant | | | | | | | | | | | | |
| 13.2 | Persona: Luka PM | | | | | | | | | | | | |
| 13.3 | Persona: Ana Product | | | | | | | | | | | | |
| 13.4 | Persona: Marko Developer | | | | | | | | | | | | |
| 13.5 | Persona: Sara Marketing | | | | | | | | | | | | |
| 13.6 | Persona: David HR | | | | | | | | | | | | |
| 13.7 | Persona: Elena Analyst | | | | | | | | | | | | |
| 13.8 | Persona: Team Lead | | | | | | | | | | | | |
| 14.1 | Edge: Network Interruption | | | | | | | | | | | | |
| 14.2 | Edge: Server Crash | | | | | | | | | | | | |
| 14.3 | Edge: Long Conversation | | | | | | | | | | | | |
| 14.4 | Edge: Concurrent Access | | | | | | | | | | | | |
| 14.5 | Edge: Empty States | | | | | | | | | | | | |
| 14.6 | Edge: Large Files | | | | | | | | | | | | |
| 14.7 | Edge: Special Characters | | | | | | | | | | | | |
| 14.8 | Edge: Rate Limits | | | | | | | | | | | | |

---

## 3. Feature Coverage Matrix

Check each feature that was exercised during this test run. If a feature was not tested, note why.

| Feature | Tested | Scenario(s) | Notes |
|---------|--------|-------------|-------|
| Desktop app launch | | | |
| Onboarding / first-run | | | |
| Workspace creation | | | |
| Workspace switching | | | |
| Workspace isolation | | | |
| Workspace home / summary | | | |
| Agent conversation (chat) | | | |
| Agent tool usage (bash, git) | | | |
| Agent tool usage (web search) | | | |
| Agent tool transparency (tool cards) | | | |
| Memory save | | | |
| Memory recall (in-session) | | | |
| Memory recall (cross-session) | | | |
| Memory search | | | |
| Memory browser | | | |
| /catchup command | | | |
| Long-form drafting | | | |
| Decision storage | | | |
| Task board (create, assign) | | | |
| Cron scheduling | | | |
| Cron execution | | | |
| Cockpit / Control Center | | | |
| Install Center | | | |
| Capability pack install | | | |
| Skill usage (post-install) | | | |
| Settings customization | | | |
| Docx export | | | |
| File upload / ingest | | | |
| SSE streaming | | | |
| Error handling (network) | | | |
| Error handling (server crash) | | | |
| Empty state UX | | | |
| Unicode / special chars | | | |
| Scroll performance | | | |
| Cost tracking | | | |
| Session persistence | | | |
| Session reload | | | |
| Team workspace creation | | | |
| Team member invitation | | | |
| Team task assignment | | | |
| Waggle Dance messages | | | |
| WebSocket presence | | | |
| Capability governance | | | |
| Sub-agent execution | | | |
| Approval gates | | | |

---

## 4. Persona Satisfaction Summary

Average emotional scores per persona across all scenarios they participated in.

| Persona | Scenarios Run | Orientation | Relief | Momentum | Trust | Continuity | Seriousness | Alignment | Ctrl Power | **Average** |
|---------|--------------|-------------|--------|----------|-------|------------|-------------|-----------|------------|-------------|
| Mia | | | | | | | | | | |
| Luka | | | | | | | | | | |
| Ana | | | | | | | | | | |
| Marko | | | | | | | | | | |
| Sara | | | | | | | | | | |
| David | | | | | | | | | | |
| Elena | | | | | | | | | | |
| Team Lead | | | | | | | | | | |

**Threshold**: No persona average below 3.0. All personas above 3.5 = strong signal.

---

## 5. Competitive Benchmark Summary

From UAT 12. Fill in after running all 3 tasks across all competitors.

### Task Completion Quality

| Tool | Task 1: Memory | Task 2: Research | Task 3: Catch-Up | Average |
|------|---------------|-----------------|------------------|---------|
| **Waggle** | | | | |
| Claude Code | | | | |
| Claude Cowork | | | | |
| OpenClaw | | | | |
| ChatGPT Desktop | | | | |
| Cursor AI | | | | |

### Context Utilization

| Tool | Task 1 | Task 2 | Task 3 | Average |
|------|--------|--------|--------|---------|
| **Waggle** | | | | |
| Claude Code | | | | |
| Claude Cowork | | | | |
| OpenClaw | | | | |
| ChatGPT Desktop | | | | |
| Cursor AI | | | | |

### "Would Do Again" Count

| Tool | Count (/3) |
|------|-----------|
| **Waggle** | |
| Claude Code | |
| Claude Cowork | |
| OpenClaw | |
| ChatGPT Desktop | |
| Cursor AI | |

### Competitive Verdict

- Waggle wins on: ___
- Waggle competitive on: ___
- Waggle behind on: ___

---

## 6. Habit Formation Trend

From UAT 11. Plot the 5-day emotional trajectory.

| Feeling | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Trend (up/flat/down) |
|---------|-------|-------|-------|-------|-------|---------------------|
| Orientation | | | | | | |
| Relief | | | | | | |
| Momentum | | | | | | |
| Trust | | | | | | |
| Continuity | | | | | | |
| Seriousness | | | | | | |
| Alignment | | | | | | |
| Controlled Power | | | | | | |
| **Day Average** | | | | | | |

### Trend Analysis

- Feelings with consistent upward trend: ___
- Feelings that plateau: ___
- Feelings that dip (investigate): ___
- Critical fails (any feeling below 2): ___

### Habit Verdict

| Criterion | Threshold | Result |
|-----------|-----------|--------|
| No feeling below 2 any day | Zero critical fails | |
| Upward day averages | Each day >= previous | |
| Day 5 average >= 4.0 | Habit-forming threshold | |
| Day 5 Continuity >= 4 | Core promise met | |
| Would recommend | YES | |
| **VERDICT** | All pass | |

---

## 7. Critical Issues Found

Record any issue that blocked a scenario, caused data loss, or produced incorrect results.

| # | Description | Severity | Affected Scenario(s) | Repro Steps | Workaround |
|---|-------------|----------|---------------------|-------------|------------|
| 1 | | BLOCKER / HIGH / MEDIUM / LOW | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

### Severity Definitions

- **BLOCKER**: Prevents core functionality. Must fix before ship.
- **HIGH**: Major feature broken or data integrity risk. Must fix before ship.
- **MEDIUM**: Feature works but with notable UX issues. Should fix before ship.
- **LOW**: Cosmetic or minor friction. Can ship with known issue.

---

## 8. Recommendations

### Must Fix Before Ship (Blockers + High)

1. ___
2. ___
3. ___

### Should Fix Before Ship (Medium)

1. ___
2. ___
3. ___

### Can Ship With (Low / Known Issues)

1. ___
2. ___
3. ___

### Feature Gaps Identified

1. ___
2. ___

### UX Improvements Suggested

1. ___
2. ___

---

## 9. Overall Ship Readiness

### Scorecard

| Dimension | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| Functional pass rate | _/24 scenarios | 24/24 | |
| Average business score | _/5 | >= 3.5 | |
| Average emotional score | _/5 | >= 3.5 | |
| Critical issues open | _ | 0 blockers, 0 high | |
| Habit formation verdict | | PASS | |
| Competitive benchmark | | Waggle leads on memory tasks | |
| Feature coverage | _% | >= 90% | |
| Persona satisfaction (lowest) | _/5 | >= 3.0 | |

### Verdict

**[ ] GO** — All thresholds met. Ship it.

**[ ] CONDITIONAL GO** — Minor issues remain. Ship with known issues list and fix timeline.

**[ ] NO GO** — Blockers or high-severity issues remain. Fix and re-test.

### Reasoning

___ (2-3 sentences explaining the verdict)

### Next Test Run

- Scheduled for: ___
- Focus areas: ___
- Issues to retest: ___

---

## Sign-Off

| Role | Name | Date | Verdict |
|------|------|------|---------|
| Tester | | | |
| Product Owner | | | |
| Tech Lead | | | |
