# 07 — Capability System

Tests the skill/plugin/capability layer that makes Waggle extensible and powerful. The capability system is what turns Waggle from a chat app into a platform — users discover, install, and govern what their agent can do.

---

## Scenario 7.1: Browse Starter Skills

**Persona**: Marko (Developer / Technical Lead)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, no additional skills installed beyond defaults

### Context

Marko has been using Waggle for basic chat and memory. He heard it has a capability system with pre-built skills. He navigates to the Capabilities section to see what's available. He expects a catalog experience — browsable, searchable, with clear descriptions of what each skill does.

### Steps

1. Click "Capabilities" in the top-level navigation. Expect: Capabilities page opens, showing the Install Center or skill catalog.
2. Browse the catalog. Expect: 7 skill families visible (e.g., Research, Writing, Planning, etc.), with 18 total starter skills listed across them.
3. Check skill cards. Expect: each skill shows name, description, family, and install state (installed vs. available).
4. Look for already-installed skills. Expect: default/built-in skills show a visual "installed" or "active" indicator distinct from uninstalled ones.
5. Use the search or filter functionality. Expect: typing "research" filters to show only research-related skills.
6. Click on a skill card for details. Expect: skill detail view or expanded card shows what the skill does, what tools it provides, and any trust/permission info.

### Functional Checkpoints

- [ ] Capabilities page is accessible from top-level navigation
- [ ] 7 skill families are displayed
- [ ] 18 starter skills are visible across all families
- [ ] Each skill shows: name, description, family grouping
- [ ] Installed vs. available states are visually distinguishable
- [ ] Search/filter narrows results correctly
- [ ] Skill detail view shows meaningful information (not just a name)
- [ ] Page loads without errors, no console errors

### Emotional Checkpoints

- [ ] Orientation: Marko immediately understands the catalog layout — families, skills, states
- [ ] Controlled Power: Marko sees what's available and feels he can choose what to add — the agent isn't deciding for him
- [ ] Seriousness: The catalog feels like a real platform feature, not a prototype list
- [ ] Trust: Skill descriptions are clear enough that Marko knows what he's installing before he does

### Features Exercised

- Capabilities top-level navigation
- Install Center / skill catalog UI
- Skill family grouping
- Skill card rendering (name, description, state)
- Search/filter functionality
- Skill detail view

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No capability catalog. Skills are hard-coded. | +2 |
| ChatGPT Desktop | GPTs store exists but is external, not integrated into workflow. | +1 |
| Cursor AI | Extensions exist but are IDE plugins, not agent skills. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (browsable capability catalog is a platform differentiator)
- Emotional: average feeling score >= 3, no feeling below 2

---

## Scenario 7.2: Install Single Skill

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: [SOLO]
**Duration**: 3 minutes
**Prerequisites**: Waggle desktop running, "research-synthesis" skill available but not installed

### Context

Mia wants her agent to be better at synthesizing research notes into summaries. She found the "research-synthesis" skill in the catalog and wants to install it. She expects a one-click install with clear feedback, and then the skill should just work in her next conversation.

### Steps

1. Navigate to Capabilities and find "research-synthesis" skill. Expect: skill is visible with an "Install" button.
2. Click "Install." Expect: a confirmation dialog appears, describing what the skill does and any permissions it requires.
3. Confirm installation. Expect: install completes within 2 seconds, skill card updates to show "Installed" / "Active" state.
4. Return to a workspace and send a message: "Synthesize the research notes in this workspace into a summary." Expect: agent uses the newly installed skill capabilities in its response.
5. Check that the skill appears in the agent's available tools. Expect: agent response reflects skill-enhanced behavior (richer synthesis, structured output, etc.).

### Functional Checkpoints

- [ ] Install button is visible on uninstalled skill cards
- [ ] Confirmation dialog appears before installation
- [ ] Confirmation dialog describes skill purpose and permissions
- [ ] Installation completes without errors
- [ ] Skill state updates to "Installed" / "Active" in the catalog
- [ ] Agent can use the skill in the next message (no restart required)
- [ ] Skill persists across app restart (not session-only)

### Emotional Checkpoints

- [ ] Relief: Installing a skill is trivial — no configuration, no setup wizard, no restart
- [ ] Momentum: From "I want this" to "it's working" in under 30 seconds
- [ ] Trust: The confirmation dialog told Mia what the skill does — no surprises
- [ ] Alignment: The skill does what Mia expected based on its description

### Features Exercised

- Skill installation flow
- Install confirmation dialog
- Skill state persistence
- Agent tool registration after install
- Skill usage in agent responses

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No installable skills. Capabilities are fixed. | +2 |
| ChatGPT Desktop | GPTs require leaving the app, browsing a store, configuring. | +1 |
| Cursor AI | Extension install requires marketplace, often needs restart. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (frictionless skill install is a key platform experience)
- Emotional: average feeling score >= 4, Relief and Momentum must score >= 4

---

## Scenario 7.3: Install Capability Pack

**Persona**: Elena (Data Analyst)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, "Research Workflow" pack available, none of its 3 constituent skills installed

### Context

Elena wants to set up Waggle for her research workflow. Rather than installing skills one by one, she sees a "Research Workflow" capability pack that bundles related skills together. She expects a pack install to be a single action that gets her multiple skills at once.

### Steps

1. Navigate to Capabilities. Find the "Research Workflow" pack. Expect: pack is visually distinct from individual skills (e.g., labeled as "Pack," shows contained skills count).
2. Click on the pack for details. Expect: pack description plus list of 3 contained skills with their individual descriptions.
3. Click "Install Pack." Expect: confirmation dialog shows all 3 skills that will be installed.
4. Confirm. Expect: all 3 skills install atomically — either all succeed or none. Progress or completion indicator visible.
5. Verify in the catalog. Expect: all 3 individual skills now show as "Installed." Pack shows as "Installed."
6. Try installing the same pack again. Expect: graceful handling — either "Already installed" message or skip-already-installed behavior (no errors, no duplicates).

### Functional Checkpoints

- [ ] Capability packs are visually distinguishable from individual skills
- [ ] Pack detail view lists all contained skills
- [ ] Pack install confirmation shows all skills to be installed
- [ ] All constituent skills install successfully in one action
- [ ] Each individual skill shows as "Installed" after pack install
- [ ] Pack catalog updates to reflect installed state
- [ ] Re-installing an already-installed pack is handled gracefully (skip or message, no error)
- [ ] No duplicate skill registrations

### Emotional Checkpoints

- [ ] Momentum: One click, three skills — Elena feels she's accelerating, not configuring
- [ ] Controlled Power: Elena chose the pack; she knows exactly what was added
- [ ] Seriousness: Pack concept signals a mature platform with curated workflows
- [ ] Trust: All 3 skills work as described after pack install

### Features Exercised

- Capability pack catalog
- Pack detail view (constituent skills)
- Pack atomic install
- Skip-already-installed logic
- Pack state tracking
- Individual skill state after pack install

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No concept of skill bundles or packs. | +2 |
| ChatGPT Desktop | No bundled GPT packs. Each GPT is individually added. | +2 |
| Cursor AI | Extension packs exist but are IDE-scoped, not agent-scoped. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (pack install is a key onboarding accelerator)
- Emotional: average feeling score >= 3, Momentum must score >= 4

---

## Scenario 7.4: Acquire Capability via Agent

**Persona**: Marko (Developer / Technical Lead)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, at least one skill uninstalled that maps to a common request (e.g., "decision-matrix" skill not installed)

### Context

Marko is in the middle of a conversation and asks the agent to help him build a decision matrix. The agent recognizes it doesn't have the "decision-matrix" skill installed but knows it exists in the catalog. It should suggest acquiring the capability, guide Marko through installation, and then use it — all within the same conversation flow.

### Steps

1. In an active workspace session, send: "Help me build a decision matrix for choosing between three deployment options." Expect: agent recognizes the capability gap and suggests acquiring the skill.
2. Agent proposes using `acquire_capability` tool. Expect: agent explains what skill it wants to install and why, in natural language.
3. Approval gate triggers for `install_capability`. Expect: approval dialog appears describing the skill to be installed.
4. Approve the installation. Expect: skill installs, agent confirms, and then proceeds to use the skill in the same conversation.
5. Verify the agent's response uses the newly installed skill. Expect: structured decision matrix output, richer than a generic text response.
6. Check Capabilities page. Expect: newly installed skill shows as "Installed."

### Functional Checkpoints

- [ ] Agent detects capability gap when user requests an uninstalled skill's domain
- [ ] Agent proposes `acquire_capability` with clear explanation
- [ ] Approval gate triggers for skill installation (ALWAYS_CONFIRM behavior)
- [ ] Skill installs successfully after approval
- [ ] Agent uses newly installed skill in the same session (no restart needed)
- [ ] Skill appears as installed in the Capabilities catalog
- [ ] The conversation flow is unbroken — gap detection, install, usage happen in one thread

### Emotional Checkpoints

- [ ] Orientation: Marko understands what's happening — agent explained the gap and the solution
- [ ] Trust: Agent asked permission before installing. Marko approved. No surprises.
- [ ] Momentum: The flow didn't break — Marko went from request to result without leaving the conversation
- [ ] Controlled Power: Marko approved the install. The agent proposed, he decided.
- [ ] Alignment: The agent's suggestion was contextually relevant — it didn't suggest random skills

### Features Exercised

- Capability gap detection
- `acquire_capability` tool
- `install_capability` tool
- Approval gate (ALWAYS_CONFIRM)
- Skill registration mid-session
- Agent using newly installed skill
- End-to-end capability acquisition loop

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | Agent cannot acquire new capabilities. Fixed toolset. | +2 |
| ChatGPT Desktop | Cannot install GPTs mid-conversation. Must leave, find, configure, return. | +2 |
| Cursor AI | Cannot acquire extensions during a conversation. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 5 (in-conversation capability acquisition is a category-defining feature)
- Emotional: average feeling score >= 4, Trust and Momentum must score >= 4

---

## Scenario 7.5: Trust Assessment

**Persona**: Ana (Product Manager)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, at least 2 skills previously installed, Cockpit accessible

### Context

Ana is security-conscious and wants to understand what skills are installed, where they came from, and whether Waggle assessed their trustworthiness. She expects a transparent audit trail — not just "installed" but "installed from X source, risk level Y, assessed on Z date."

### Steps

1. Install a new skill (e.g., "writing-tone-analyzer"). Expect: installation succeeds as normal.
2. Navigate to Cockpit (top-level nav or via settings). Expect: Cockpit dashboard loads with multiple sections.
3. Find the Trust Audit section. Expect: a dedicated area showing installed capabilities with trust information.
4. Locate the just-installed skill in the audit trail. Expect: entry shows timestamp, source trust level (e.g., "built-in" / "starter" / "community"), risk assessment (low/medium/high), assessment mode (auto/manual).
5. Review other previously installed skills. Expect: each has its own audit entry with consistent information format.
6. Verify audit entries are chronologically ordered. Expect: most recent installs appear first or entries are sortable.

### Functional Checkpoints

- [ ] Trust Audit section exists in Cockpit
- [ ] Each installed skill has an audit trail entry
- [ ] Audit entry includes: timestamp, source trust level, risk assessment, assessment mode
- [ ] Newly installed skill appears in audit trail immediately after installation
- [ ] Audit entries display in chronological order (or are sortable)
- [ ] Audit trail is read-only (no accidental modification)
- [ ] REST endpoint (`/api/trust-audit` or similar) returns consistent data

### Emotional Checkpoints

- [ ] Trust: Ana can verify what's installed and how it was assessed — the system is transparent
- [ ] Seriousness: Trust assessment signals Waggle takes security seriously, not "install anything, yolo"
- [ ] Orientation: The audit trail is readable — Ana doesn't need to be a security expert to understand it
- [ ] Controlled Power: Ana can review and make informed decisions about what stays installed

### Features Exercised

- Trust assessment on skill install
- Cockpit trust audit section
- Audit trail data (timestamp, source, risk, mode)
- REST endpoint for trust data
- Chronological audit display

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No capability audit trail. No trust assessment. | +2 |
| ChatGPT Desktop | No GPT trust assessment. No audit trail of what was installed when. | +2 |
| Cursor AI | Extensions have marketplace ratings but no per-install trust audit. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (trust/audit is a professional requirement, especially for enterprise trajectory)
- Emotional: Trust must score >= 4, Seriousness must score >= 4
