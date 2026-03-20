# P12: SME Owner / Accountant

## Persona Summary

**Role**: Small/medium enterprise owner who also handles accounting, professional communications, and regulatory compliance
**Tech level**: Basic to moderate -- uses accounting software, email, basic office tools
**Tier**: SOLO
**Core need**: Professional communications (invoices, client emails), regulatory context storage, multi-audience drafting (formal for regulators, friendly for clients)
**Emotional priority**: Trust, Seriousness, Relief

---

## Persona System Analysis

### Matching Persona

The SME Owner maps across several personas with no single match:
- **Executive Assistant**: Email drafting, correspondence, scheduling -- covers communication needs
- **Writer**: Document drafting, tone adaptation -- covers multi-audience drafting
- **Analyst**: Financial analysis, structured reporting -- covers accounting analysis

### Gap: No Business Owner / Finance Persona

No persona is optimized for:
- Financial document generation (invoices, estimates, financial reports)
- Regulatory compliance tracking
- Multi-audience tone switching (formal regulatory vs. friendly client)
- Cash flow analysis and business planning

---

## Journey Assessment

### Professional Communications

The agent can draft:
- Client emails (with tone adaptation via instructions)
- Formal regulatory correspondence
- Invoices (as structured documents via generate_docx)
- Meeting summaries and follow-ups

Memory enables:
- Client relationship tracking (stored preferences, past interactions)
- Regulatory deadline tracking (stored as memory frames)
- Template reuse (stored communication patterns)

### Regulatory Context Storage

The memory system can store regulatory information:
- Tax deadlines and requirements
- Industry-specific compliance rules
- Audit preparation checklists
- Regulatory changes and updates

However, similar to David's (P06) policy concern: the agent has no enforcement to prefer stored regulatory context over general knowledge. For financial/regulatory matters, accuracy is critical.

### Multi-Audience Drafting

The agent can adapt tone, but without a business-owner persona:
- No automatic audience detection
- Manual instruction needed for each draft ("write this formally for the tax authority" vs. "write this warmly for our client")
- No stored audience profiles as a first-class concept

### Required Capabilities Assessment

| Capability | Required | Present | Status |
|---|---|---|---|
| Professional email drafting | Yes | Yes | Agent drafting + generate_docx |
| Invoice/estimate generation | Yes | Partial | generate_docx exists but no invoice template |
| Regulatory context storage | Yes | Yes | save_memory for regulatory information |
| Multi-audience tone switching | Yes | Partial | Agent can adapt tone but no automatic detection |
| Financial analysis | Yes | Partial | Agent reasoning works; no accounting tools |
| Client relationship tracking | Yes | Yes | Memory per client workspace or per-memory |
| Deadline tracking | Yes | Partial | Cron for reminders; no calendar integration |
| Document export | Yes | Yes | generate_docx with formatting |

### Financial Sensitivity

The SME Owner scenario has high stakes for accuracy:
- Tax calculations must be correct
- Invoice amounts must match agreements
- Regulatory filings must use precise language
- Financial reports must be accurate

The agent can perform calculations and generate documents, but there is no financial-specific validation or double-checking behavior.

### Functional Assessment

- [x] Professional email drafting -- Agent can generate professional correspondence
- [~] Invoice generation -- generate_docx can create structured documents but no invoice template
- [x] Regulatory context storage -- save_memory works for regulatory information
- [~] Multi-audience tone switching -- Manual instruction required per draft
- [~] Financial analysis -- Agent reasoning works but no accounting validation
- [x] Client relationship tracking -- Memory persistence per workspace
- [~] Deadline tracking -- Cron scheduling exists but no calendar view
- [x] Document export -- generate_docx with full formatting

### Emotional Assessment

| Emotion | Score (1-5) | Notes |
|---|---|---|
| Orientation | 3 | Chat UX works but no business-owner dashboard |
| Relief | 3 | Communication drafting saves time; financial work needs validation |
| Momentum | 3 | End-to-end workflows possible but not streamlined |
| Trust | 2 | Financial accuracy is critical; no specialized validation |
| Continuity | 4 | Client and regulatory context persists across sessions |
| Seriousness | 2 | Business/financial output needs higher precision than generic agent provides |
| Alignment | 2 | No business-owner persona; workflow requires significant adaptation |
| Controlled Power | 3 | Owner directs but agent lacks domain-specific business awareness |

---

## Scores

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| Infrastructure readiness | 3 | Communication and memory tools present. No financial-specific features. |
| Memory support | 4 | Client relationships and regulatory context persist well. |
| Output quality potential | 2 | No business-owner persona. Financial accuracy needs domain-specific guidance. |
| Team support | 1 | SOLO tier. N/A. |

**Overall infrastructure score: 2.75/5**

---

## Key Findings

1. **No business-owner or finance persona**: The 8 defined personas are oriented toward knowledge work, not business operations. An SME owner needs financial precision, regulatory awareness, and business-specific drafting.

2. **Financial accuracy risk**: Similar to the HR policy concern (P06), the agent may mix general financial knowledge with stored regulatory context. For tax and compliance matters, this is high-risk.

3. **Document generation is a strong foundation**: generate_docx can produce invoices, reports, and correspondence. Adding invoice/estimate templates would significantly improve utility.

4. **Multi-audience drafting needs persona support**: The agent can adapt tone when instructed, but a business-owner persona could automatically detect audience context and adjust.

5. **Cron scheduling for deadlines**: The cron system can remind the SME owner about tax deadlines, invoice due dates, and regulatory filings. This is a practical utility.

6. **Local-first architecture protects financial data**: Sensitive financial information stays on the device. No cloud sync unless explicitly configured.

---

## Recommendations

1. Create a "business-owner" persona with instructions for financial precision, multi-audience tone detection, and regulatory compliance awareness.
2. Add invoice and estimate templates to the document generation system.
3. Add a "deadline" memory type with automatic cron reminder generation.
4. Consider integration with accounting software (QuickBooks, Xero) via connectors.
5. Add financial calculation validation behavior to the persona (double-check amounts, verify tax rates against stored context).
6. Create a "small business" workspace template with relevant starter memory for common regulatory requirements.
