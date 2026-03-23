# Round 5: Business Tier Journey

**Date:** 2026-03-23
**Tier:** business

## Results

| # | Test | Result | Notes |
|---|------|--------|-------|
| T86 | Set business tier | ✅ PASS | tier=business, budgetControls=true |
| T87 | Legal workspace + persona | ✅ PASS | legal-review created with legal-professional persona |
| T88 | Contract review | ✅ PASS | 2202 chars. Identified broad indemnification, no cap, lack of carve-outs. Professional disclaimer present ("not legal advice") |
| T89 | Policy recall | ⚠️ SKIP | Combined with T88 behavior |
| T90 | Finance workspace | ✅ PASS | finance created with finance-owner persona |
| T91 | Financial analysis | ✅ PASS | 1560 chars. Analyzed Q2 projections against stored data. Financial disclaimer present ("verify with accountant") |
| T92 | Budget tracking | ⚠️ PARTIAL | Workspace created but budget field not visible in workspace list (BUG-R1-06) |
| T93 | Marketplace install | ⚠️ SKIP | Not explicitly tested |
| T94 | Cron schedules | ✅ PASS | 30 cron schedules exist and respond |
| T95 | Connectors list | ✅ PASS | 32 connectors listed (GitHub, Slack, Jira, etc.) |
| T96 | Connect Slack | ⚠️ SKIP | Connect endpoint not tested |
| T97 | Slack message via agent | ⚠️ PARTIAL | Agent chat returned but send_slack_message tool did not fire in response (agent may have used different approach) |
| T98 | HR persona disclaimer | ❌ FAIL | HR disclaimer NOT present in 2966-char response. Persona system prompt has it but enforcement didn't work this time |
| T99 | Approval gate | ⚠️ SKIP | YOLO mode active, not tested |
| T100 | Event stats | ✅ PASS | 916 events, breakdown by type (410 tool_call, 409 tool_result), top tools listed, 30-day period |

## Business Tier Score

**Pass: 8 | Partial: 2 | Fail: 1 | Skip: 4 | Total: 15**
**Pass rate: 8/15 = 53% (target 12+) — BELOW TARGET**

Note: Multiple skips due to sequential test execution constraints.

### Dimension Scores
- **F: 7/10** — Legal/finance personas work well. Connectors listed. Some gaps
- **Q: 9/10** — Legal analysis was genuinely impressive. Financial precision good
- **D: N/A** — API-only
- **A: 8/10** — Legal persona with disclaimer feels professional
- **P: 6/10** — HR disclaimer inconsistent, budget tracking gap, several skips

### Bugs
1. **BUG-R5-01 (MED):** HR persona disclaimer not always enforced (inconsistent)
2. **BUG-R5-02 (LOW):** send_slack_message tool didn't fire when asked to send Slack message
