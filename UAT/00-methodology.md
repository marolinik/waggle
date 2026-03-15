# UAT Methodology

## Philosophy

Unit tests prove code correctness. UAT proves **product truth** — that Waggle delivers on its promise:

> "I don't have to hold this whole project in my head alone anymore."

Every test scenario asks: does this feature make a knowledge worker's life meaningfully better? Not "does the API return 200" but "does the user feel oriented, relieved, and in control?"

## Three Dimensions of Quality

### 1. Functional Truth
Does the feature work as designed? Are inputs handled correctly? Do error cases degrade gracefully?

**Scoring**: Binary. Works or doesn't. Partial credit only if the core value is delivered despite cosmetic issues.

### 2. Business Truth
Does the feature solve a real problem? Would a professional pay for this? Does it save time, reduce cognitive load, or enable something previously impossible?

**Scoring**: 1-5 scale.
- 1 = Feature exists but provides no real value
- 2 = Somewhat useful but wouldn't drive adoption
- 3 = Useful — equivalent to what competitors offer
- 4 = Clearly better than alternatives
- 5 = Category-defining — changes how the user works

### 3. Emotional Truth
Does the user **feel** what we promised? The 8 target feelings:

| Feeling | What it means | Anti-pattern |
|---------|--------------|-------------|
| Orientation | "I know where I am and what's happening" | Lost, confused, overwhelmed |
| Relief | "I don't have to remember everything" | Anxious about losing context |
| Momentum | "I can pick up where I left off" | Starting from scratch every time |
| Trust | "I trust what the agent tells me" | Skeptical, second-guessing output |
| Continuity | "It remembers our work together" | Groundhog Day — agent forgets |
| Seriousness | "This tool takes my work seriously" | Toy-like, gimmicky, unreliable |
| Alignment | "It works the way I think" | Fighting the tool, workarounds |
| Controlled Power | "I'm in charge, but it amplifies me" | Agent doing random things |

**Scoring**: 1-5 per feeling, per scenario.
- 1 = Anti-pattern experienced
- 3 = Neutral — neither good nor bad
- 5 = Feeling strongly present

## Scenario Structure

Each scenario follows this template:

```markdown
### Scenario X.Y: [Name]

**Persona**: [from 01-personas.md]
**Tier**: [SOLO] | [TEAMS] | [KVARK]
**Duration**: estimated minutes
**Prerequisites**: what must be set up first

#### Context
[Realistic situation that motivates this test]

#### Steps
1. [Action with expected outcome]
2. [Action with expected outcome]
...

#### Functional Checkpoints
- [ ] [Specific functional assertion]
- [ ] [Specific functional assertion]

#### Emotional Checkpoints
- [ ] Orientation: [what should the user feel at this point]
- [ ] Trust: [what should the user feel at this point]

#### Features Exercised
[List of features this scenario tests — used for coverage matrix]

#### Competitive Benchmark
[How would the same task work in Claude Code / ChatGPT / etc.]

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: average feeling score >= 3, no feeling below 2
```

## Competitive Comparison Framework

For each scenario, we compare against:

| Competitor | What it is | Waggle advantage expected |
|-----------|-----------|-------------------------|
| Claude Code | CLI-only, no memory, no workspace model | Memory, workspace context, visual UI, multi-project |
| Claude Cowork | Electron chat, basic Agent SDK | Deeper memory, capability system, team mode |
| OpenClaw | Open source assistant, multi-channel | Memory persistence, workspace model, trust model |
| ChatGPT Desktop | General-purpose, no code tools | Specialized for knowledge work, tool transparency |
| Cursor AI | IDE-focused, code only | Broader knowledge work, memory, team collaboration |

Comparison scoring:
- **-1** = Waggle is worse
- **0** = Equivalent
- **+1** = Waggle is better
- **+2** = Waggle is significantly better (category difference)

## Coverage Matrix

After all scenarios run, produce a matrix:

```
Feature × Scenario coverage
Feature × Persona coverage
Feature × Feeling coverage
```

Any feature untested = gap. Any persona with average emotional score < 3 = problem.

## Automation vs Manual

| Test type | Approach |
|-----------|---------|
| API endpoint availability | Automated (curl/Playwright) |
| UI component rendering | Automated (Playwright screenshots) |
| Agent response quality | Manual evaluation with rubric |
| Memory persistence across sessions | Semi-automated (script + manual eval) |
| Emotional checkpoints | Manual only |
| Competitive comparison | Manual with structured rubric |
| Habit formation | Manual (multi-day simulation) |

## When to Run

- **Full suite**: Before Phase 7, before Phase 8, before V1 ship
- **Partial (core loop + persona)**: After any major feature change
- **Regression (functional only)**: After any release
