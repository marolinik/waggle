# P11: R&D Engineer -- Startup (Round 2)

## Persona
**Role**: R&D engineer at AI startup, model evaluation, benchmarking, technical research
**Mapped Persona**: No direct R&D persona. Best fit: `researcher` (for technical investigation) or `coder` (for hands-on evaluation)
**Tier**: SOLO (sector persona)

## Prompt Sent
"Compare vLLM vs TGI for serving a 70B parameter model"

## Infrastructure Verification

### W1.3 Persona Wiring: VERIFIED
- If `researcher` persona: instructions for deep investigation, multi-source synthesis, citation tracking, confidence levels
- If `coder` persona: instructions for reading code, understanding architecture, small focused changes
- Both wired via `composePersonaPrompt()` at `chat.ts:621-624`

### W3.1 Tool Filtering: VERIFIED
- Researcher tools: `web_search`, `web_fetch`, `search_memory`, `save_memory`, `read_file`, `search_files`, `search_content`
  - Includes web_search for current benchmarks -- essential for ML infrastructure comparison
  - Missing: `bash` for running local benchmarks
- Coder tools: `bash`, `read_file`, `write_file`, `edit_file`, `search_files`, `search_content`, `git_*`
  - Includes bash for local testing
  - Missing: `web_search` for external research

Neither persona provides the full R&D tool set. Ideal: researcher + bash (= analyst persona).

### Best Persona Match: `analyst`
- Analyst tools include BOTH `bash` AND `web_search` + `web_fetch`
- Analyst instructions: quantify, use tables, present tradeoffs -- perfect for framework comparison
- Has professional disclaimer and mandatory recall
- **Recommendation: Use analyst persona for R&D workspaces**

### W3.2 Professional Disclaimers: VERIFIED (analyst)
- Analyst disclaimer covers this scenario adequately

### W3.4 Mandatory Recall: VERIFIED (analyst/researcher)
- Both analyst and researcher have MANDATORY RECALL
- Would surface prior benchmarks, model evaluations, and infrastructure decisions

## Response Evaluation (Code Analysis)

"Compare vLLM vs TGI for serving a 70B parameter model" with analyst persona would:
1. MANDATORY RECALL fires -- searches for prior model serving evaluations
2. `web_search` for current benchmarks, release notes, community comparisons
3. `web_fetch` to deep-read benchmark articles and documentation
4. `bash` could run local tests (if serving frameworks are installed)
5. Analyst persona instructs: quantify, use comparison tables, present tradeoffs
6. Output: structured comparison matrix with throughput, latency, memory, features, community support
7. Professional disclaimer if analysis touches financial/commercial decisions
8. Memory save stores comparison results for future reference

This is a strong use case for the analyst persona. The combination of web research + bash + structured analysis covers the R&D workflow well.

## Scores

| Dimension | R1 | R2 | Delta | Rationale |
|---|---|---|---|---|
| Infrastructure readiness | 3 | 4.5 | +1.5 | Analyst persona provides bash + web + structured analysis. Near-complete for R&D. |
| Memory support | 4 | 5 | +1 | Benchmark results persist, mandatory recall surfaces baselines. |
| Output quality | 2 | 4 | +2 | Analyst persona's quantitative focus + comparison tables directly serve benchmarking. Major uplift from R1. |
| Team support | 1 | 1 | 0 | SOLO sector scenario. N/A. |

**Average: 3.625 (up from 2.5 R1)**

## Verdict
PASS -- Use analyst persona for R&D workspaces. Combines web research, bash, and structured quantitative analysis. Significant improvement over R1 where no persona was active.
