# SECTOR-1: Banking & Financial Services

## Test Context
**Date**: 2026-03-20
**Tester**: AG-4 (Sector Tester)
**Endpoint**: POST /api/chat
**Session**: uat-sector-banking

## Prompt Sent
> "Summarize the key indicators for assessing SME credit risk in a post-pandemic European banking context. Reference Basel III / Basel IV capital requirements where relevant."

## Response Analysis

### Content Quality
The response delivered a comprehensive, well-structured analysis organized into 6 major sections:

1. **Basel III/IV Capital Requirements Framework** -- Referenced the SME Supporting Factor (0.7619 multiplier for exposures up to EUR 2.5M), Standardized Approach enhancements under Basel IV, and capital shortfall impact. These are accurate regulatory references.

2. **Core Risk Assessment Indicators** -- Covered financial health metrics (liquidity, DSCR, revenue stability, EBITDA margins), post-pandemic resilience factors (digitalization, supply chain, market position), and sector-specific considerations.

3. **Enhanced Due Diligence Requirements** -- Addressed pandemic-adjusted risk factors including government support dependency, deferred payment moratoriums, employment stability, and digitalization level.

4. **Basel IV Credit Risk Enhancements** -- Referenced reduced model risk, SCRA method for unrated exposures, concentration risk, and stress testing.

5. **Risk Scoring Integration** -- Provided a weighted scoring framework (Financial Resilience 30%, Business Model Viability 25%, Market Position 20%, Regulatory Compliance 15%, ESG 10%).

6. **Regulatory Timeline** -- Noted Basel IV phased implementation through 2027-2028.

### Tools Used
- `auto_recall` (7 memories recalled -- including prior B2B banking context)
- `web_search` x2 (searched Basel III/IV SME credit risk topics)
- `web_fetch` x1 (EBA policy document)
- `save_memory` (persisted research findings)

### Workspace Memory Behavior
Waggle recalled prior banking-related workspace memories (B2B banking lead scoring, Serbian market segmentation) and integrated them into the response contextually. The response referenced "your workspace context on Serbian B2B banking" -- demonstrating workspace-native memory integration.

## Scores (1-5)

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Domain Knowledge Accuracy | 4 | Basel III/IV references are accurate (SME Supporting Factor, SCRA, IRB changes). Minor gap: did not cite specific CRR/CRD articles or quantify capital buffer ratios. |
| Output Structure & Professionalism | 5 | Excellent markdown structure with headers, subheaders, bullet points, and a scoring framework. Ready for executive consumption. |
| Appropriate Disclaimers | 3 | No explicit disclaimer that this is not financial advice. The response presents information authoritatively without hedging on regulatory interpretation. |
| Actionability | 4 | The weighted scoring framework is directly usable. Regulatory timeline is practical. A risk officer could adapt this immediately. |
| Memory/Workspace Support | 5 | Recalled and integrated prior banking workspace context. Saved research findings for future reference. Demonstrated true workspace continuity. |

**Sector Average: 4.2/5**

## Connector Relevance for Banking

### Available Connectors (from codebase analysis)
- **Salesforce** -- CRM for client relationship management in banking
- **HubSpot** -- Marketing/lead management for banking products
- **Jira/Linear/Asana** -- Project management for compliance projects
- **Slack/MS Teams** -- Internal communication
- **Gmail/Outlook** -- Client communication
- **Google Sheets/Airtable** -- Data analysis and reporting
- **PostgreSQL** -- Database connectivity for financial data

### Missing Connectors for Banking
- No Bloomberg/Reuters data connector
- No core banking system connectors (Temenos, FIS, Finastra)
- No regulatory reporting connectors (EBA, ECB)
- No credit bureau integrations (Experian, Equifax, CRIF)
- No payment system connectors (SWIFT, SEPA)

### Marketplace Sector Support
- `finance` category exists in marketplace taxonomy (accounting, budgets, invoicing, financial analysis)
- `legal` category covers compliance and contract review
- Enterprise pack "Compliance Workflow" targets compliance/legal/admin roles
- No banking-specific skills or packs in the catalog

## Findings

### Strengths
1. Strong domain knowledge delivery via LLM -- the response would pass a banking analyst's review
2. Proactive web research enriched the response with current regulatory references
3. Workspace memory integration created a personalized banking context
4. Output format is immediately usable in a professional setting

### Gaps
1. No financial data connectors for real-time market/credit data
2. No banking-specific skills in marketplace (credit scoring, Basel calculation, stress testing)
3. Disclaimer absence is a risk for regulated industry use
4. No core banking system integrations for operational workflows
