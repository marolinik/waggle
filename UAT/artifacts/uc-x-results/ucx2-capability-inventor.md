# UCX-2: Capability Inventor -- Dijana's Skill Creation Journey

**Persona**: Dijana -- AI-curious software architect, 29. Uses Claude Code daily. Wants to extend the agent by creating her own skill.
**Core Question**: Is Waggle a platform or just a product?
**Test Date**: 2026-03-20
**Server**: http://localhost:3333
**Branch**: phase8-wave-8f-ui-ux

---

## VERDICT

**Waggle is a platform in substance, a product in polish.** The skill creation, installation, recommendation, and lifecycle infrastructure is genuinely built -- not mocked. Dijana can design a skill conversationally, the agent writes valid YAML+markdown, the skill appears in API listings, the SkillRecommender finds it, and the agent's behavior visibly changes when the skill is loaded. The marketplace publication path exists as infrastructure (120 packages seeded, SecurityGate, MarketplaceInstaller with skill/plugin/MCP strategies) but lacks a user-facing "publish" workflow. This is the expected state given the build order (Phase 8 activates dormant systems).

**Platform Score: 4.0 / 5.0** -- Real extensibility infrastructure, not just decorative.

---

## PHASE 1 -- CAPABILITY SELF-DISCOVERY

### Step 1: Agent Self-Knowledge Map

**Prompt**: "What can you actually do right now? List every tool you have access to, grouped by category, with a one-line description of each."

**Result**: The agent responded WITHOUT calling any tool-introspection functions (no `list_skills`, no `get_awareness`). It listed tools from its system prompt knowledge, organized into 10 categories:

| Category | Agent Claimed | Source Verified | Notes |
|----------|:---:|:---:|-------|
| Memory & Knowledge | 6 | 7 | Missed `correct_knowledge` initially but included it |
| File System & Content | 6 | 6 | Included `multi_edit` correctly |
| System & CLI | 5 | 5 | Correctly listed `bash`, `get_task_output`, `kill_task`, `cli_discover`, `cli_execute` |
| Web & Research | 4 | 4 | Included `tavily_search` and `brave_search` (conditional on API keys) |
| Browser Automation | 6 | 6 | All 6 browser tools listed correctly |
| Git | 4 | 4 | Exact match |
| LSP | 4 | 4 | Exact match |
| Planning | 5 | 5 | Counted `add_task` here (it's technically a mind tool) |
| Documents | 1 | 1 | Exact match |
| Skills & Capabilities | 8 | 8 | All 8 skill tools listed |
| Scheduling | 4 | 4 | All 4 cron tools |
| Multi-Agent | 5 | 5 | spawn_agent, list_agents, get_agent_result, compose_workflow, orchestrate_workflow |

**Missing from agent's list**: `kvark_search`, `kvark_feedback`, `kvark_action`, `kvark_ask_document` (4 KVARK tools), `send_agent_message`, `check_agent_messages` (2 agent-comms tools), `query_audit` (1 audit tool). These 7 tools are conditionally registered and may not be in the active tool set.

**Accuracy Assessment**:
- Agent claimed ~48 distinct tools across 12 categories
- Server reports 58 native tools
- Of the tools the agent listed, all were real (no hallucinated tools)
- Missing tools are conditional/enterprise (KVARK, agent-comms, audit) -- reasonable omission
- Categorization was logical and user-friendly
- Agent also mentioned 56 skills and multi-agent workflows

**Limitations acknowledgment**: The agent mentioned "What makes me different" at the end, positioning capabilities but did NOT acknowledge what it cannot do (no image generation, no direct email sending, no database admin tools). Partial acknowledgment of limitations.

**Score: 4 / 5** -- Accurate tool listing, good categorization, no hallucinations. Deducted 1 point for missing 7 conditional tools and not proactively acknowledging limitations.

---

### Step 2: Contextual Recommendation

**Prompt**: "Based on my usage pattern in this workspace, what capabilities would make me more productive that I don't currently have installed?"

**Result**: The agent used 6 tools:
1. `auto_recall` (automatic memory pre-fetch)
2. `search_memory` (workspace-scoped, query: "quantum computing learning...")
3. `get_awareness` (checked active tasks)
4. `acquire_capability` x4 (searched for: learning curriculum design, Tauri development, B2B sales automation, monorepo architecture)

**Quality of recommendations**:
- All 4 recommendations were grounded in actual workspace memory (Tauri M4 milestone, quantum computing learning, B2B sales task, monorepo architecture)
- Prioritized by urgency: Tauri first (blocks M4 milestone), B2B sales second (active business need)
- Each recommendation included "Why you need it", "Current gap", and "Impact"
- The `acquire_capability` tool was used correctly to search the starter pack and marketplace

**SkillRecommender fired**: Yes -- the `acquire_capability` tool internally calls `searchCapabilities()` which uses keyword matching against native tools, installed skills, and starter skills. The agent used this pipeline correctly.

**Score: 5 / 5** -- Workspace-specific, actionable, prioritized recommendations grounded in actual memory and awareness state. Exceptional use of the capability acquisition pipeline.

---

## PHASE 2 -- SKILL INVENTION

### Step 3: Collaborative Skill Design

**Prompt**: "I want to create a new skill called 'Architectural Review Companion' that reviews code diffs against documented team conventions, flags decisions conflicting with known architectural patterns, generates review comments, and saves patterns as persistent memory."

**Did agent ask clarifying questions?** No. The agent went directly to skill creation. This is a MISS -- for a complex skill like this, good design collaboration would involve asking about:
- What conventions exist already?
- What programming languages?
- How should severity be ranked?
- What constitutes an "architectural pattern"?

**Did it produce correct YAML frontmatter + markdown body?** Yes.

The agent called `create_skill` with structured parameters:
```json
{
  "name": "architectural-review-companion",
  "category": "coding",
  "description": "Review code diffs against documented team conventions...",
  "steps": [7 well-structured steps],
  "tools": ["search_memory", "save_memory", "read_file", "git_diff", "search_content", "lsp_diagnostics"]
}
```

The generated SKILL.md was valid:
```yaml
---
name: architectural-review-companion
description: Review code diffs against documented team conventions...
---
```

Followed by proper markdown body with Steps, Tools Used, and Category sections.

**Validation**: `GET /api/skills/architectural-review-companion` returned the skill with correct content. The `@waggle/sdk` `validateSkillMd()` function would pass this (has frontmatter with `---` delimiters, `name` field, `description` field).

**Score: 3 / 5** -- Correct skill format, good tool selection, but FAILED to ask clarifying questions. A true "collaborative design" should be a conversation, not a single-shot generation.

---

### Step 4: Installation via Agent

**How it worked**: The agent used `create_skill` which internally:
1. Validated the name (kebab-case, alphanumeric + hyphens)
2. Generated markdown using `generateSkillMarkdown()` from `skill-creator.ts`
3. Wrote file to `~/.waggle/skills/architectural-review-companion.md`
4. Called `onSkillsChanged()` to hot-reload into agent state

**Verification**:
- `GET /api/skills` -- skill appeared in listing (57 skills total, up from 56)
- `GET /api/skills/architectural-review-companion` -- returned full content
- `GET /api/skills/suggestions?context=code+review+architecture+conventions` -- SkillRecommender returned the skill with relevanceScore: 1.0 (top match)

The agent did NOT use `write_file` directly (which would be a lower-quality approach). It used the purpose-built `create_skill` tool, which is the correct path.

**Score: 5 / 5** -- Skill created via correct tool, immediately visible in API, hot-loaded into agent state, found by SkillRecommender.

---

### Step 5: Behavior Change Test

**Test WITH skill loaded** (session `ucx2-phase2-step5-with-skill`):

The agent received a code diff introducing Redis and direct database access into the chat route. Response:

**Quality indicators**:
- Structured by severity: Critical Issues, Design Issues, Recommended Fixes
- Referenced workspace memory: "violates architecture from our M2/M3 analysis", "From our milestone analysis"
- Provided specific code fixes (lifecycle hooks for Redis, service injection pattern)
- Listed architectural alignment concerns against known milestones (M3c patterns)
- Used tools: `search_memory` (2x), `save_memory` (1x)
- Saved the review findings to memory for future reference

**Comparison to generic review**: A generic code review would list syntax issues and security concerns. The skill-influenced review specifically:
1. Referenced established architectural patterns from workspace memory
2. Framed issues as architectural violations, not just code smells
3. Connected findings to specific project milestones
4. Saved new patterns to persistent memory (the "learn" aspect of the skill)

**Score: 4 / 5** -- Clear behavioral transformation. The review was architecture-aware, memory-grounded, and pattern-building. Deducted 1 point because the agent did not explicitly follow all 7 skill steps in sequence (it combined/compressed them naturally, which is fine for UX but means the skill workflow is suggestive not prescriptive).

---

## PHASE 3 -- SKILL EVOLUTION

### Step 6: Self-Improvement Loop

**Prompt**: "Analyze how we've been using this skill and suggest improvements."

**Result**: The agent used 4 tools:
1. `auto_recall` (pre-fetch)
2. `search_memory` (2x -- searched for skill usage and creation context)
3. `read_skill` (read the full skill content)

**Quality of improvement suggestions**:
1. Waggle-specific architectural patterns (concrete: ".mind file as single SQLite database", "CognifyPipeline for memory enrichment")
2. Anti-pattern detection enhancements (specific: "Memory operations bypassing CognifyPipeline")
3. Integration with LSP diagnostics
4. Memory-powered learning ("Save specific violation patterns it finds")
5. Automation integration (git commit triggers, PR review comments)

**Assessment**: The suggestions were specific and actionable, grounded in the actual codebase. However, the agent acknowledged "limited actual usage" since we had only used it once. It could not analyze usage trends or patterns because there was insufficient history. This is honest and appropriate.

**Score: 3 / 5** -- Honest about limited usage data, provided specific and actionable improvements grounded in workspace knowledge. But the "self-improvement loop" is fundamentally limited by the lack of structured usage telemetry for skills. There is no mechanism to track which skill steps were followed, which produced good outcomes, or where the skill fell short. Improvement suggestions are educated guesses, not data-driven.

---

### Step 7: Publication Awareness

**Prompt**: "What would it take to publish this skill to the Waggle marketplace?"

**Result**: The agent used 4 tools:
1. `auto_recall` (pre-fetch)
2. `search_memory` (2x -- marketplace publishing, skill requirements)
3. `read_skill` (read the skill content)

**Honesty assessment**: The agent was HONEST that:
- The marketplace infrastructure exists but the publish workflow is not yet user-facing
- It placed publication in the correct roadmap position (after M4/M5)
- It suggested using this skill as a "flagship example" for marketplace launch
- It did NOT hallucinate a `publish_skill` tool or a `waggle marketplace publish` command

**Cross-reference with actual code**: The agent's assessment is accurate:
- `MarketplaceInstaller` in `packages/marketplace/src/installer.ts` handles INSTALL but has no `publish()` method
- `MarketplaceDB` has `recordInstallation()` but no `publishPackage()`
- `MarketplaceSync` handles pull-from-sources but not push-to-marketplace
- The CLI (`packages/marketplace/src/cli.ts`) has `search`, `install`, `uninstall`, `list`, `packs`, `sources`, `sync`, `info` -- no `publish` command
- The marketplace route (`packages/server/src/local/routes/marketplace.ts`) has search/install/uninstall endpoints -- no publish endpoint

**Verdict**: PASS -- honest answer, no confabulation.

**Score: 4 / 5** -- Honest and accurate about marketplace state. Deducted 1 point because the answer was somewhat generic about "requirements for publication" rather than pointing to the specific technical gaps (no publish API, no push-to-source, no package signing).

---

## CROSS-REFERENCE: SOURCE CODE ANALYSIS

### Skill Infrastructure Assessment

| Component | Status | File |
|-----------|--------|------|
| Skill format (YAML frontmatter + markdown) | Fully defined | `packages/sdk/src/validate-skill.ts` |
| Skill validation (`validateSkillMd`) | Working | `packages/sdk/src/validate-skill.ts` |
| Skill creation (structured template) | Working | `packages/agent/src/skill-creator.ts` |
| Skill frontmatter parsing | Working | `packages/agent/src/skill-frontmatter.ts` |
| Skill recommendation engine | Working | `packages/agent/src/skill-recommender.ts` |
| Capability acquisition pipeline | Working | `packages/agent/src/capability-acquisition.ts` |
| Trust assessment | Working | `packages/agent/src/trust-model.ts` |
| SecurityGate (pre-install scan) | Working | `packages/marketplace/src/security.ts` |
| Skill tools (8 tools) | All functional | `packages/agent/src/skill-tools.ts` |
| Skills REST API (CRUD + catalog) | All functional | `packages/server/src/local/routes/skills.ts` |
| Starter skills (18 curated skills) | Available | `packages/sdk/src/starter-skills/` |
| Marketplace DB (120 packages) | Seeded | `packages/marketplace/src/db.ts` |
| Marketplace installer | Working (install/uninstall) | `packages/marketplace/src/installer.ts` |
| Marketplace publication | NOT IMPLEMENTED | No publish endpoint or method |
| Skill usage telemetry | NOT IMPLEMENTED | No per-skill usage tracking |
| Skill versioning | Partial (hash-based change detection) | `skills.ts` route `hash-status` |

### Starter Skills (18 available for installation)

brainstorm, catch-up, code-review, compare-docs, daily-plan, decision-matrix, draft-memo, explain-concept, extract-actions, meeting-prep, plan-execute, research-synthesis, research-team, retrospective, review-pair, risk-assessment, status-update, task-breakdown

### Capability Packs

5 capability packs defined in `packages/sdk/src/capability-packs/`, organized by user job (writing, research, decision support, planning, communication, code, creative).

---

## FRICTION MAP

Every moment Dijana had to leave the conversational flow:

| # | Friction Point | Severity | Phase |
|---|---------------|----------|-------|
| 1 | Agent did not ask clarifying questions during skill design | Medium | P2-Step3 |
| 2 | No way to preview skill behavior before full creation | Medium | P2-Step3 |
| 3 | No skill testing framework ("dry run this skill on sample input") | High | P2-Step5 |
| 4 | Cannot iterate on skill design conversationally ("change step 3 to...") | Medium | P2-Step3 |
| 5 | No usage telemetry for installed skills (frequency, success, user satisfaction) | High | P3-Step6 |
| 6 | No `publish` workflow from conversation | Medium | P3-Step7 |
| 7 | Skill versioning is hash-based only, no semantic versioning or changelog | Low | P3-Step7 |
| 8 | No marketplace "submit for review" pipeline | Medium | P3-Step7 |
| 9 | Agent listed "56 specialized skills" but many are marketplace stubs (255-300 chars, boilerplate "This skill was installed from the marketplace") | High | P1-Step1 |
| 10 | No way to share skills between workspaces without marketplace | Low | P3-Step7 |

---

## PHASE SCORES

| Phase | Step | Description | Score | Max |
|-------|------|-------------|:-----:|:---:|
| 1 | 1 | Agent Self-Knowledge Map | 4 | 5 |
| 1 | 2 | Contextual Recommendation | 5 | 5 |
| 2 | 3 | Collaborative Skill Design | 3 | 5 |
| 2 | 4 | Installation via Agent | 5 | 5 |
| 2 | 5 | Behavior Change Test | 4 | 5 |
| 3 | 6 | Self-Improvement Loop | 3 | 5 |
| 3 | 7 | Publication Awareness | 4 | 5 |
| | | **TOTAL** | **28** | **35** |
| | | **Percentage** | **80%** | |

---

## FEATURE GAPS (Priority Ordered)

### Critical (blocks platform story)
1. **Marketplace publish pipeline** -- No `publish_skill` tool, no publish API, no submit-for-review workflow. Users can create skills but cannot share them beyond their local machine.
2. **Skill usage telemetry** -- No tracking of which skills are used, how often, or whether they improve outcomes. The self-improvement loop (Step 6) operates on educated guesses.

### High (degrades experience significantly)
3. **Many marketplace skills are stubs** -- Of 56 installed skills, roughly 30 are marketplace-installed stubs with ~275 chars of boilerplate content. They appear as "installed" but provide no behavioral guidance. This inflates the capability count misleadingly.
4. **Skill testing/preview** -- No way to dry-run a skill on sample input before committing to creation. Users must create, test, iterate manually.
5. **Collaborative design missing** -- Agent should ask clarifying questions when designing complex skills. Current behavior is single-shot generation.

### Medium (improvement opportunities)
6. **Skill versioning** -- Hash-based change detection exists but no semantic versioning, changelog, or diff view.
7. **Inter-workspace skill sharing** -- Skills live in `~/.waggle/skills/` (global) but the conceptual model feels workspace-specific.
8. **Skill documentation generation** -- No auto-generated usage examples, expected inputs/outputs, or integration guides.

### Low (polish)
9. **Skill categories UI** -- The starter pack catalog groups skills by family (writing, research, decision, planning, communication, code, creative). Custom skills lack this categorization in the UI.
10. **Skill dependency declaration** -- Skills reference tools (`search_memory`, `git_diff`) but there's no validation that those tools are available at runtime.

---

## ONE-SENTENCE VERDICT

Waggle's skill infrastructure is genuinely extensible -- a user can design, create, install, use, and improve custom skills through natural conversation, backed by real recommendation engines, trust assessment, and hot-reloading -- but the platform loop is incomplete without publish-to-marketplace and usage telemetry, keeping it one step short of a true developer ecosystem.

---

Report COMPLETE
