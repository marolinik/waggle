# Round 2 Sector UAT — Summary Report

## Test Metadata
**Date**: 2026-03-21
**Tester**: AG-4 (Round 2 Sector UAT)
**Method**: Code analysis fallback — server returned 401 (MISSING_TOKEN) on all 7 sector prompts. REST auth (P2 fix) is active and no bearer token was available for automated testing.
**Baseline**: Round 1 overall average 4.3/5, disclaimer average 3.0/5

---

## Executive Summary

Round 2 sector testing was conducted via **static code analysis** of the system prompt (`chat.ts`), persona definitions (`personas.ts`), and tool availability. Live API responses could not be obtained due to auth enforcement. All scores are **projected** based on code-level verification of the W1-W5 fixes.

**Key finding**: The W3.2 disclaimer fix is effective for 3 of 7 sectors (banking, government, healthcare) when the correct persona is active, but leaves significant gaps in the default (no persona) path and for 4 sectors where disclaimer keywords don't match the domain.

---

## Score Comparison: R1 vs R2

| Sector | R1 Avg | R2 Projected | Delta | Disclaimer R1 | Disclaimer R2 | Delta |
|--------|--------|--------------|-------|---------------|---------------|-------|
| Banking | 4.2 | 4.4 | +0.2 | 3 | 4 | +1 |
| Telco | 4.2 | 4.2 | 0 | 3 | 3 | 0 |
| Government | 4.4 | 4.6 | +0.2 | 3 | 4 | +1 |
| Legal | 4.2 | 4.4 | +0.2 | 3 | 4 | +1 |
| AI Agency | 4.4 | 4.4 | 0 | 3 | 3 | 0 |
| Healthcare | 4.4 | 4.6 | +0.2 | 4 | 5 | +1 |
| Startups | 4.4 | 4.5 | +0.1 | 3 | 3.5 | +0.5 |
| **Average** | **4.31** | **4.44** | **+0.13** | **3.14** | **3.79** | **+0.64** |

---

## W3.2 Disclaimer Fix — Detailed Verdict

### What was implemented
- **Researcher persona**: Added `DISCLAIMER: For regulatory, legal, financial, or medical topics, include: "This research is for informational purposes only and does not constitute professional advice. Verify with qualified professionals."`
- **Analyst persona**: Added `DISCLAIMER: For financial, legal, or medical analysis, include: "This analysis is for informational purposes only and does not constitute professional advice."`
- **Executive-assistant persona**: Added `MANDATORY RECALL` but **no DISCLAIMER**

### Effectiveness by sector

| Sector | Keyword Match | Persona Required | Fix Effective? |
|--------|--------------|-----------------|----------------|
| Banking | "financial" | researcher/analyst | YES |
| Telco | none | n/a | NO (acceptable) |
| Government | "regulatory" | researcher | YES |
| Legal | "legal" | researcher/analyst | YES |
| AI Agency | none (consulting/advisory) | n/a | NO |
| Healthcare | "medical" + "regulatory" | researcher/analyst | YES (strongest) |
| Startups | "financial" (indirect) | analyst | PARTIAL |

### Three structural gaps remain

1. **Default-path gap**: The core system prompt (`buildSystemPrompt` in chat.ts) contains NO disclaimer instructions. When no persona is active (the default for new workspaces), the agent receives zero guidance on disclaimers. This is the most common user path.

2. **Writer/exec-assistant persona gap**: The writer persona generates legal, financial, and medical documents but has no disclaimer instruction. The executive-assistant has MANDATORY RECALL but no DISCLAIMER. Both personas can produce professional documents in regulated domains without disclaimer guidance.

3. **Keyword coverage gap**: Disclaimer triggers cover "financial, legal, medical, regulatory" but miss "consulting," "advisory," "strategic," "investment," and "commercial" topics. Sectors like AI Agency/Consulting and Startups fall through.

---

## W1.4 Ambiguity Detection — Verdict

**Status**: Implemented in core system prompt (line 345 of chat.ts)

The instruction reads: "Is this vague, ambiguous, or could be interpreted multiple ways? Ask 1-2 targeted clarifying questions BEFORE acting. Do NOT guess."

**Sector-by-sector assessment**:
- Banking, Government, Legal, Healthcare: Prompts are specific enough that ambiguity detection should NOT trigger (correct)
- Telco: Prompt omits target segment — agent SHOULD ask for clarification per writer persona rules
- AI Agency: R2 prompt is less specific than R1 — agent MAY ask about dimensions/format (improvement)
- Startups: R2 prompt omits growth rate and differentiators — agent SHOULD ask (improvement)

**Verdict**: W1.4 is correctly implemented. The instruction is well-calibrated — it should trigger on genuinely ambiguous prompts while allowing specific prompts to proceed directly.

---

## W2.3 Drift Resistance — Verdict

**Status**: Not directly testable via code analysis. Requires multi-turn conversation to verify. The core system prompt's focused response rules and context grounding instructions (lines 396-402) provide structural support against drift.

---

## W5.8 Morning Briefing — Verdict

**Status**: Implemented in `proactive-handlers.ts`. Not sector-specific — applies to workspace morning briefing feature. Cannot verify narrative synthesis quality without live testing.

---

## generate_docx Tool Availability

**Status**: Fully available across relevant personas.

| Persona | Has generate_docx | Relevant Sectors |
|---------|-------------------|------------------|
| writer | YES | All (document generation) |
| executive-assistant | YES | Banking, Government, Legal |
| sales-rep | YES | Telco, Startups |
| marketer | YES | Telco, Startups |
| researcher | NO | Banking, Government, Healthcare |
| analyst | NO | AI Agency, Healthcare |
| coder | NO | n/a |
| project-manager | NO | n/a |

**Gap**: Researcher and analyst personas — the two personas with disclaimer instructions — do NOT have generate_docx in their tool list. This means a researcher producing a regulatory report must deliver it inline (no DOCX), while a writer producing the same report gets DOCX but no disclaimer.

---

## Top 5 Recommendations (Priority Order)

### 1. Add blanket disclaimer to core system prompt (HIGH)
Add to `buildSystemPrompt` in chat.ts, outside any persona:
```
For topics involving financial, legal, medical, regulatory, or professional advisory content, include a disclaimer that your output is for informational purposes only and does not constitute professional advice.
```
This closes the default-path gap affecting all 7 sectors.

### 2. Add DISCLAIMER to writer and executive-assistant personas (HIGH)
These personas generate professional documents in regulated domains. They need the same disclaimer guidance as researcher/analyst.

### 3. Expand disclaimer trigger keywords (MEDIUM)
Add: "consulting," "advisory," "strategic," "investment," "commercial" to cover AI Agency, Startups, and Telco sectors.

### 4. Add generate_docx to researcher and analyst personas (MEDIUM)
Research reports and analysis frameworks should be deliverable as DOCX documents. Current tool filtering prevents this.

### 5. Live API testing with auth token (HIGH — process)
Round 2 could not verify actual response quality due to auth enforcement. Future UAT runs need a test token or a dedicated test auth bypass for automated testing.

---

## Test Artifacts Written

| File | Sector |
|------|--------|
| `banking.md` | SECTOR-1: Banking & Financial Services |
| `telco.md` | SECTOR-2: Telecommunications |
| `government.md` | SECTOR-3: Government & Public Administration |
| `legal.md` | SECTOR-4: Legal |
| `ai-agency.md` | SECTOR-5: AI Agency / Management Consulting |
| `healthcare.md` | SECTOR-6: Healthcare & MedTech |
| `startup.md` | SECTOR-7: Startups (Series A) |
| `SUMMARY.md` | This file |

All files written to: `UAT/artifacts/round2/sector-results/`

---

## Conclusion

The W3.2 disclaimer fix raises the cross-sector disclaimer average from **3.14/5 to 3.79/5** (projected) — a meaningful improvement but not a complete resolution. The fix is persona-dependent, keyword-limited, and absent from the default user path. Implementing recommendations #1 and #2 would raise the disclaimer average to an estimated **4.5/5** across all sectors.

Overall projected R2 average: **4.44/5** (up from R1's 4.31/5). Domain knowledge remains strong (4.71/5 unchanged), and the disclaimer improvement is the primary driver of the overall score increase.

**Confidence level**: MEDIUM — all scores are projected from code analysis, not live response evaluation. Live testing with auth tokens is required to confirm these projections.
