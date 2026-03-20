# P09: Attorney -- Legal Office

## Persona Summary

**Role**: Attorney at a mid-size law firm handling contract review, compliance, and legal correspondence
**Tech level**: Moderate -- uses legal research tools and document management systems
**Tier**: SOLO
**Core need**: Workspace isolation for client matters, legal terminology support, contract analysis, document drafting with precision
**Emotional priority**: Trust, Seriousness, Controlled Power

---

## Persona System Analysis

### Matching Persona

No dedicated legal persona exists. The closest matches:
- **Analyst**: Decision matrices, structured analysis, quantification -- useful for contract review
- **Writer**: Document drafting, formatting, tone adaptation -- useful for legal correspondence

The existing **legal-review** workspace template uses the analyst persona and includes:
- Connectors: email
- Suggested commands: /review, /research, /draft, /memory
- Starter memory: "This workspace handles legal document review and compliance tracking."

This is the best out-of-box fit for an attorney.

### Legal-Specific Requirements

| Requirement | Support Level | Notes |
|---|---|---|
| Client matter isolation | Strong | Each workspace is a separate .mind DB |
| Document analysis | Moderate | read_file + search_content for document review |
| Legal research | Moderate | web_search for case law; no legal-specific databases |
| Precise drafting | Moderate | Agent can draft but lacks legal precision training |
| Privilege/confidentiality | Strong | Local-first architecture; data stays on device |
| Citation tracking | Weak | No legal citation format enforcement |
| Document generation (docx) | Strong | generate_docx with full formatting |
| Compliance tracking | Weak | No compliance-specific features; memory can store but not track |

---

## Journey Assessment

### Workspace Isolation for Client Matters

This is Waggle's strongest feature for attorneys. Each client matter can be a separate workspace:
- Separate .mind database per workspace
- No cross-workspace data leakage
- Workspace switching preserves isolation
- Local-first (data never leaves the device unless team server is configured)

An attorney handling Johnson Corp vs. Smith LLC and separately the Acme Corp acquisition can have isolated workspaces where:
- Memories don't cross-contaminate
- Auto-recall only surfaces matter-specific context
- Documents are workspace-scoped

### Legal Terminology and Precision

The agent (Claude) has strong legal knowledge from training data, but:
- No persona instructions guide legal precision or citation format
- No legal-specific tools (Westlaw, LexisNexis integration)
- No enforced disclaimer behavior ("this is not legal advice")
- No jurisdiction-awareness in drafting

### Document Drafting

The agent can draft:
- Contracts (from templates in memory)
- Legal correspondence (demand letters, responses)
- Memos and briefs
- Compliance checklists

Output can be exported via generate_docx. However, legal document formatting (numbered paragraphs, defined terms, cross-references) is not specifically supported.

### Functional Assessment

- [x] Workspace creation for client matters -- Fully functional
- [x] Client matter isolation -- Separate .mind DBs per workspace
- [~] Legal research -- web_search works but no legal databases
- [~] Contract analysis -- read_file + agent reasoning, but no clause extraction tools
- [~] Legal correspondence drafting -- Generic drafting, no legal-specific formatting
- [x] Document export (docx) -- generate_docx works
- [~] Compliance tracking -- Memory can store items but no structured tracking
- [x] Confidentiality -- Local-first architecture protects attorney-client privilege

### Emotional Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Workspace per client matter is intuitive |
| Relief | 3 | Drafting assistance helps but needs legal precision |
| Momentum | 3 | End-to-end legal workflow possible but not streamlined |
| Trust | 2 | Legal precision is critical; generic agent may produce imprecise language |
| Continuity | 4 | Client matter context persists across sessions |
| Seriousness | 2 | Legal output needs higher precision than generic drafting provides |
| Alignment | 2 | No legal persona; workflow requires significant adaptation |
| Controlled Power | 3 | Attorney directs but agent lacks legal domain awareness |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 3 | Workspace isolation and memory are strong. Missing legal-specific tools and formatting. |
| Memory support | 4 | Client matter isolation excellent. Cross-session persistence for case context. |
| Output quality potential | 2 | Legal precision requires domain-specific persona. Generic drafting is risky for legal work. |
| Team support | 1 | SOLO scenario. N/A. |

**Overall infrastructure score: 2.75/5**

---

## Key Findings

1. **Workspace isolation is the legal killer feature**: Attorney-client privilege requires strict data separation. Waggle's workspace-per-matter architecture with local-first storage directly serves this need.

2. **Legal precision gap is the biggest risk**: Legal documents require specific language, defined terms, and precise citations. Without a legal persona or domain-specific instructions, the agent may produce language that sounds legal but is imprecise.

3. **Legal-review workspace template exists**: This provides a good starting point with analyst persona, /review and /draft commands, and legal-specific starter memory.

4. **No legal research integration**: Attorneys need Westlaw, LexisNexis, or similar legal databases. web_search is insufficient for authoritative case law research.

5. **Confidentiality architecture is strong**: Local-first, no cloud sync by default, workspace isolation, encrypted vault for sensitive data. This is well-suited for legal practice.

---

## Recommendations

1. Create a "legal" persona with instructions for precise legal language, citation formats, and mandatory disclaimers.
2. Add legal document formatting to generate_docx (numbered paragraphs, defined terms, recitals).
3. Consider legal research API integration (e.g., CourtListener for free case law).
4. Add a "privileged" workspace flag that enforces stricter data handling (no export, no team sync).
5. Create matter-management workspace templates for common practice areas (litigation, corporate, IP).
