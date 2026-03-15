# Waggle UAT — User Acceptance Testing

Comprehensive acceptance testing for Waggle Solo + Teams tiers.

## Structure

```
UAT/
  README.md                           — this file
  00-methodology.md                   — scoring, rubrics, comparison framework
  01-personas.md                      — 8 user personas with context
  02-core-loop-tests.md               — daily use loop validation
  03-first-contact.md                 — onboarding and first 5 minutes
  04-memory-continuity.md             — cross-session memory and context
  05-agent-behavior.md                — agent quality, tool use, self-awareness
  06-workspace-management.md          — multi-workspace, switching, organization
  07-capability-system.md             — skills, plugins, acquisition, trust
  08-team-collaboration.md            — shared workspace, presence, tasks, governance
  09-ambient-power.md                 — cron, notifications, background behavior
  10-trust-transparency.md            — approval gates, audit, tool visibility
  11-habit-formation.md               — 5-day simulation, return behavior
  12-competitive-benchmark.md         — vs Claude Code, Cowork, OpenClaw, ChatGPT
  13-persona-scenarios.md             — role-specific end-to-end scenarios
  14-edge-cases-resilience.md         — error handling, network issues, data limits
  15-results-template.md              — scoring sheet template
  16-chrome-devtools-inspection.md    — live browser inspection (screenshots, perf, network, console)
  artifacts/                          — screenshots, traces, network logs, lighthouse reports
```

## How to Use

1. Read `00-methodology.md` for scoring approach
2. Pick a persona from `01-personas.md`
3. Run scenarios from their perspective
4. Score using rubrics from the methodology
5. Record results in `15-results-template.md`

## Reusability

These tests are designed to be re-run after:
- KVARK integration (Phase 7) — add enterprise scenarios
- V1 Hardening (Phase 8) — final regression
- Each major release

Scenarios tagged with `[SOLO]`, `[TEAMS]`, `[KVARK]` indicate tier applicability.
