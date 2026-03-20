# P11: R&D Engineer -- Startup

## Persona Summary

**Role**: R&D engineer at an early-stage startup evaluating technologies, making architecture decisions, and documenting technical rationale
**Tech level**: Expert -- writes code, evaluates frameworks, makes infrastructure decisions
**Tier**: SOLO
**Core need**: Technical comparison frameworks, ADR generation, memory recall for past evaluations, prototype scaffolding
**Emotional priority**: Trust, Controlled Power, Momentum

---

## Persona System Analysis

### Matching Persona

The R&D Engineer maps directly to the **coder** persona:
- Tools: bash, read_file, write_file, edit_file, search_files, search_content, git_status, git_diff, git_log, git_commit
- Workspace affinity: development, coding, engineering, debugging
- Suggested commands: /review, /plan

### Overlap with P04 (Marko)

The R&D Engineer shares significant overlap with Marko (P04) but with distinct emphases:
- **Marko**: Ongoing codebase work, PR reviews, team conventions
- **R&D Engineer**: Technology evaluation, comparison frameworks, prototyping, documentation

The coder persona covers both but lacks R&D-specific instructions for:
- Structured technology comparisons
- ADR (Architecture Decision Record) generation
- Prototype scaffolding
- Research synthesis for technical choices

---

## Journey Assessment

### Technology Comparison Frameworks

The agent can generate technology comparisons using:
- **web_search**: Research technology options, benchmarks, community size
- **Structured output**: Decision matrices, comparison tables
- **Memory**: Store evaluation criteria and past decisions
- **Bash**: Run benchmarks, test code snippets

The analyst persona's instructions ("break complex questions into measurable components", "use tables, matrices, and frameworks") would be more appropriate here than the coder persona. This highlights a gap: R&D work spans analysis and coding.

### ADR Generation

ADR (Architecture Decision Record) generation requires:
- Context (what problem is being solved)
- Options considered
- Decision made
- Consequences

The agent can draft ADRs, but there is no ADR template/skill. The analyst persona instructions would help with structured decision documentation, and the coder persona would help with codebase-grounded context.

### Memory Recall for Past Evaluations

When the R&D engineer returns to evaluate a related technology:
1. Auto-recall searches for relevant prior evaluations
2. Workspace memory contains past technology decisions
3. Cross-session persistence means evaluation criteria accumulate

This is Waggle's strongest differentiator for R&D work -- past evaluations are never lost.

### Required Capabilities Assessment

| Capability | Required | Present | Status |
|---|---|---|---|
| Web research (technology) | Yes | Yes | web_search + web_fetch |
| Comparison frameworks | Yes | Yes | Agent can generate matrices/tables |
| ADR generation | Yes | Partial | Agent can draft; no template/skill |
| Memory recall (evaluations) | Yes | Yes | search_memory + auto_recall |
| Prototype scaffolding | Yes | Yes | bash + write_file + edit_file |
| Codebase exploration | Yes | Yes | search_files + search_content + read_file |
| Benchmark execution | Yes | Yes | bash with background task support |
| Decision persistence | Yes | Yes | save_memory for technical decisions |

### Functional Assessment

- [x] Technology research -- web_search + web_fetch functional
- [x] Comparison tables -- Agent generates structured markdown tables
- [~] ADR format -- Agent can draft but no template ensures consistency
- [x] Memory recall of past evaluations -- auto_recall + search_memory
- [x] Prototype scaffolding -- bash + file tools
- [x] Benchmark execution -- bash with background tasks
- [x] Decision storage -- save_memory for persistence
- [x] Codebase integration -- git tools + file search

### Emotional Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 4 | Workspace context + memory recall orient the engineer quickly |
| Relief | 4 | Research + comparison + decision + documentation in one session |
| Momentum | 4 | End-to-end R&D workflow: research -> compare -> decide -> prototype |
| Trust | 3 | Research quality varies; codebase analysis is reliable |
| Continuity | 5 | Past evaluations persist and accumulate -- strongest value |
| Seriousness | 3 | ADR quality needs template/persona guidance for consistency |
| Alignment | 4 | R&D workflow maps well to available tools |
| Controlled Power | 4 | Engineer directs evaluation; agent handles research and documentation |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 4 | Strong tool set for R&D: research, code, bash, git, memory. |
| Memory support | 5 | Technology evaluations and decisions persist. Cross-session recall is the killer feature. |
| Output quality potential | 3 | No R&D-specific persona. Coder + analyst combination would be ideal. |
| Team support | 1 | SOLO tier. N/A. |

**Overall infrastructure score: 3.75/5**

---

## Key Findings

1. **Memory persistence is the R&D killer feature**: An R&D engineer evaluating technologies over weeks or months benefits enormously from persistent decision memory. "What did we decide about caching last month?" is answerable.

2. **No R&D persona**: The ideal R&D persona would combine coder (tools, code) and analyst (structured comparison, quantification) instructions. Neither alone is sufficient.

3. **ADR skill template is a high-value gap**: A structured ADR skill (/draft ADR) would significantly improve consistency and quality of technical documentation.

4. **Plan tools enable evaluation workflows**: create_plan -> add_plan_step -> execute_step maps well to R&D evaluation: "Define criteria -> Research options -> Benchmark -> Document decision."

5. **Code review workspace template is close**: Uses coder persona and includes github/jira connectors. Could serve as R&D base with modified starter memory.

---

## Recommendations

1. Create an R&D-specific persona combining coder tools with analyst-style structured comparison instructions.
2. Build an ADR skill template for consistent architecture decision recording.
3. Create an "R&D evaluation" workspace template with technology comparison starter memory.
4. Consider a "technology radar" feature that visualizes evaluated technologies and decisions over time.
5. Wire the coder persona (at minimum) into the chat flow for Marko/R&D use cases.
