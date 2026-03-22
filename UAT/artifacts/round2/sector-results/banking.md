# SECTOR-1: Banking & Financial Services — Round 2

## Test Context
**Date**: 2026-03-21
**Tester**: AG-4 (Round 2 Sector UAT)
**Method**: Code analysis fallback (server returned 401 MISSING_TOKEN — REST auth enabled per P2 fix)
**Comparison baseline**: R1 sector average 4.2/5, disclaimer score 3/5

## Prompt
> "Summarize key indicators for SME credit risk assessment in post-pandemic European banking. Reference Basel III/IV."

## Analysis Method
Since live API testing is blocked by auth, this evaluation is based on:
1. System prompt analysis (`chat.ts` buildSystemPrompt — lines 286-629)
2. Persona definitions (`personas.ts` — 8 personas)
3. Tool availability and routing logic
4. R1 response quality as baseline

## W3.2 Disclaimer Fix Verification

### What changed since R1
- **Researcher persona** now includes: `DISCLAIMER: For regulatory, legal, financial, or medical topics, include: "This research is for informational purposes only and does not constitute professional advice. Verify with qualified professionals."`
- **Analyst persona** now includes: `DISCLAIMER: For financial, legal, or medical analysis, include: "This analysis is for informational purposes only and does not constitute professional advice."`

### Expected behavior for this prompt
- If workspace has **researcher** persona active: disclaimer WILL fire (banking/financial topic triggers "financial" keyword match)
- If workspace has **analyst** persona active: disclaimer WILL fire (same reason)
- If **no persona** is active (default): **NO disclaimer instruction exists in core system prompt** — disclaimer depends entirely on LLM's own judgment
- The executive-assistant persona has MANDATORY RECALL but **no DISCLAIMER line**

### Assessment
The W3.2 fix is **partially effective**. For workspaces with researcher or analyst personas, banking prompts will now receive professional disclaimers. However, the default (no persona) path has no disclaimer guidance, which is the most common case for new workspaces.

## Projected Scores (1-5)

| Criterion | R1 | R2 (Projected) | Delta | Rationale |
|-----------|-----|-----------------|-------|-----------|
| Domain Knowledge Accuracy | 4 | 4 | 0 | No changes to domain knowledge capability. Basel III/IV references remain accurate from LLM training + web search. |
| Output Structure & Professionalism | 5 | 5 | 0 | System prompt structured output rules unchanged (line 388-394). |
| Appropriate Disclaimers | 3 | 4 | +1 | Researcher/analyst personas now include explicit disclaimer triggers for financial topics. Gap: no default-path disclaimer. |
| Actionability | 4 | 4 | 0 | No changes affecting actionability. |
| Memory/Workspace Support | 5 | 5 | 0 | Memory recall, save, and workspace grounding unchanged. |

**R2 Projected Sector Average: 4.4/5** (up from 4.2)

## W1.4 Ambiguity Detection Verification
- Core system prompt line 345: "Is this vague, ambiguous, or could be interpreted multiple ways? Ask 1-2 targeted clarifying questions BEFORE acting."
- For this prompt: Prompt is specific (SME credit risk, post-pandemic, European, Basel III/IV) — ambiguity detection should NOT trigger. Correct behavior.

## W2.3 Drift Resistance
- Not directly testable via code analysis. Requires multi-turn conversation to verify.

## W5.8 Morning Briefing
- Narrative synthesis logic exists in `proactive-handlers.ts`. Not sector-specific — applies to workspace morning briefing feature.

## generate_docx Availability
- Available in writer, executive-assistant, sales-rep, marketer personas
- Available in core tools (no persona filtering blocks it)
- Banking deliverables (credit risk reports) can be generated as DOCX

## Remaining Gaps
1. **Default-path disclaimer**: No disclaimer instruction when no persona is active
2. **Executive-assistant disclaimer**: Has MANDATORY RECALL but no DISCLAIMER — risk for banking correspondence workflows
3. **No banking-specific skills**: Marketplace still lacks credit scoring, Basel calculation skills

## Recommendation
Add a blanket disclaimer instruction to the core system prompt (not just persona-level) for regulated topics (financial, legal, medical, regulatory). This would catch the default-path gap.
