# P06: David -- HR Manager (Round 2)

## Persona
**Role**: HR manager, onboarding, policy management, employee communications
**Mapped Persona**: No direct `hr-manager` persona. Best fit: `executive-assistant` (communication, scheduling) or `writer` (document drafting)
**Tier**: SOLO

## Prompt Sent
"Create an onboarding checklist for a new senior engineer"

## Infrastructure Verification

### W1.3 Persona Wiring: VERIFIED
- If workspace uses `executive-assistant` persona (`personas.ts:129-147`):
  - Instructions: draft professional emails, prepare meeting briefs, manage correspondence, summarize documents
  - Has MANDATORY RECALL for correspondence context
  - Tools: search_memory, save_memory, read_file, write_file, web_search, generate_docx
- If workspace uses `writer` persona (`personas.ts:51-68`):
  - Instructions: ask about audience/tone, produce well-structured documents, adapt tone
  - Tools: read_file, write_file, edit_file, search_files, search_memory, save_memory, generate_docx

### W3.1 Tool Filtering: VERIFIED
- Executive-assistant tools include `generate_docx` -- essential for formal HR documents
- Writer tools include `edit_file` and `search_files` -- useful for template management
- Both exclude `bash`, `git_*` -- appropriate for HR role

### W3.2 Disclaimers: PARTIAL CONCERN
- Executive-assistant has no explicit HR/employment law disclaimer
- For HR-specific work (employment law, compliance), the researcher and analyst personas have general professional disclaimers
- Gap: HR-specific disclaimer about employment law not built into any persona

### W3.4 Mandatory Recall: VERIFIED (exec-assistant)
- `personas.ts:141`: Executive-assistant has MANDATORY RECALL
- "Before drafting any correspondence, ALWAYS search_memory for relevant context, prior communications, and stated preferences."
- This would surface existing onboarding templates and policies

### Persona Gap Analysis
- No dedicated HR persona with employment law awareness
- Missing: compliance tracking for HR regulations, employee data privacy handling
- Workaround: writer persona + custom workspace starter memory with HR policies

## Response Evaluation (Code Analysis)

David's "Create an onboarding checklist for a new senior engineer" would:
1. Auto-recall searches for existing onboarding processes and policies
2. Exec-assistant persona guides professional, structured output
3. Agent creates checklist format (system prompt supports checkbox lists)
4. `generate_docx` can export formal onboarding document
5. Memory save stores the checklist as a reusable template

Quality would be good for generic onboarding but lack:
- Engineering-specific onboarding items (unless stored in memory from prior sessions)
- HR compliance requirements (GDPR, employment law) unless workspace has relevant memories
- Integration with HRIS systems

## Scores

| Dimension | R1 | R2 | Delta | Rationale |
|---|---|---|---|---|
| Infrastructure readiness | 3 | 4 | +1 | Persona wired, tools available. Gap: no dedicated HR persona. |
| Memory support | 4 | 5 | +1 | HR policies persist, mandatory recall surfaces them. Provenance tracking added. |
| Output quality | 2 | 3.5 | +1.5 | Exec-assistant/writer persona guides structured output. Not 4 due to missing HR domain specificity. |
| Team support | 1 | 1 | 0 | SOLO scenario. N/A. |

**Average: 3.375 (up from 2.5 R1)**

## Verdict
PASS (with gap) -- Infrastructure wired. Functional for generic HR tasks. Gap: no HR-specific persona with employment law awareness and compliance features.
