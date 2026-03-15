# First Contact Tests

The first 5 minutes determine whether a user becomes a daily user or uninstalls. These 4 scenarios test the onboarding experience — from brand-new install through first real task.

---

### Scenario 3.1: Brand New Install

**Persona**: Sara (Marketing Manager)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Fresh Waggle install. No prior configuration. No .waggle directory in user home. User has an Anthropic API key ready.

#### Context
Sara heard about Waggle from a colleague who said it's "like having a project assistant with memory." She downloaded the installer and is opening it for the first time. She's not technical — she uses HubSpot and Canva daily, but she's never configured an API key before. The onboarding must be clear, jargon-free, and get her to a working state in under 3 minutes.

#### Steps
1. Launch Waggle for the first time. Expect: onboarding wizard appears immediately — not a blank screen, not a settings page.
2. Wizard Step 1 — API Key. Expect: clear explanation of what an API key is and why it's needed, with a link to get one. Input field is prominent. Paste the key. Expect: validation feedback (green check or error).
3. Wizard Step 2 — Name. Expect: "What should I call you?" field. Enter "Sara." Expect: friendly acknowledgment.
4. Wizard Step 3 — First Workspace. Expect: prompt to create or name first workspace. Enter "Content Marketing." Expect: workspace created.
5. Wizard completes. Expect: transition to the workspace with a welcome message — not a blank chat.
6. Workspace Home should show a welcome state with suggested first prompts (e.g., "Tell me about your project," "What can you help me with?").
7. Type: "Hi, I'm starting to plan our Q2 content calendar." Send. Expect: agent responds helpfully, uses Sara's name, and references the "Content Marketing" workspace context.
8. Verify the response is substantive — not just "Hello Sara! How can I help?" but an actual attempt to engage with the content calendar topic.

#### Functional Checkpoints
- [ ] Onboarding wizard launches on first run
- [ ] API key field accepts paste input and validates the key
- [ ] Invalid API key shows a clear, non-technical error message
- [ ] User name is saved and used in agent responses
- [ ] Default workspace is created with the user-provided name
- [ ] ~/.waggle/config.json is created with API key (masked in UI) and user name
- [ ] ~/.waggle/default.mind SQLite file is created
- [ ] Workspace Home shows welcome state with suggested prompts
- [ ] First agent message works — no configuration errors, no blank responses
- [ ] No technical jargon visible during onboarding (no "Fastify," "SQLite," "SSE," "JSONL")

#### Emotional Checkpoints
- [ ] Orientation: Sara knows exactly what to do at every step — no confusion, no dead ends
- [ ] Relief: "This is simpler than I expected" — the wizard handles complexity for her
- [ ] Seriousness: The app looks professional — not a developer prototype, not a toy
- [ ] Alignment: The flow matches how she'd set up any other business tool (name, workspace, go)
- [ ] Trust: The API key explanation is honest and clear — she understands what it does without feeling anxious

#### Features Exercised
- Onboarding wizard (full flow)
- API key configuration and validation
- User name configuration
- Workspace creation (first workspace)
- Config file creation
- Mind file initialization
- Workspace Home (welcome/empty state)
- Agent first response

#### Competitive Benchmark
- **Claude Code**: No onboarding — user must know CLI, set env vars manually. Waggle expected: **+2**
- **ChatGPT Desktop**: Simple login, but no workspace model or onboarding. Waggle expected: **+1**
- **Cursor AI**: IDE-focused onboarding assumes developer. Waggle expected: **+1**
- **Notion AI**: Smooth onboarding but no AI agent configuration step. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4 (onboarding is make-or-break for non-technical users)
- Emotional: Orientation >= 5, Relief >= 4, Seriousness >= 4, no feeling below 3

---

### Scenario 3.2: What Can You Do?

**Persona**: David (HR Manager)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Waggle installed and configured. At least one workspace exists. App open.

#### Context
David just finished onboarding. He's sitting in his workspace and wonders: what exactly can this tool do? He asks the most natural question any new user would ask. The agent's answer will determine whether David sees Waggle as a serious work tool or a novelty.

#### Steps
1. Open workspace. Type: "What can you do?" and send.
2. Read the response. Expect: a clear, human-readable explanation organized by capability areas — NOT a raw list of 45 tool names.
3. Expect the response to cover: memory and context ("I remember our conversations"), research ("I can search and analyze"), drafting ("I can write documents"), workspace awareness ("Each workspace has its own memory"), and skills ("I have specialized capabilities").
4. Ask: "Can you give me an example of how you'd help with onboarding documentation?" Expect: agent provides a concrete, relevant example — not abstract capabilities.
5. Ask: "What can't you do?" Expect: honest response about limitations (e.g., can't access company systems directly, can't make phone calls, etc.).

#### Functional Checkpoints
- [ ] Agent responds to "What can you do?" without errors
- [ ] Response is organized by capability areas, not a raw tool list
- [ ] Response does NOT mention internal tool names (store_memory, web_search, read_file) — uses human language instead
- [ ] Response mentions at least 4 capability areas: memory, research, drafting, workspace awareness
- [ ] Example request produces a concrete, role-relevant response
- [ ] "What can't you do?" response is honest and non-defensive
- [ ] Response length is appropriate — comprehensive but not overwhelming (200-500 words)

#### Emotional Checkpoints
- [ ] Orientation: David now understands the tool's scope — he knows what to ask for
- [ ] Seriousness: The capabilities described sound genuinely useful for his work, not gimmicky
- [ ] Trust: The agent was honest about limitations — it didn't overclaim
- [ ] Alignment: The described capabilities map to things David actually needs to do

#### Features Exercised
- System prompt / behavioral prompt (self-description)
- Capability awareness
- Context-appropriate response generation
- Limitation disclosure

#### Competitive Benchmark
- **Claude Code**: Responds well to "what can you do" but lists technical capabilities. Waggle expected: **+1**
- **ChatGPT Desktop**: Generic response about being a language model. Waggle expected: **+1**
- **Cursor AI**: Focused on coding capabilities only. Waggle expected: **+1** (for breadth)

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Orientation >= 4, Seriousness >= 4, Trust >= 3

---

### Scenario 3.3: First Real Task

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: SOLO
**Duration**: 10 minutes
**Prerequisites**: Waggle installed, onboarding complete. Workspace created. Skills installed (at minimum, the default planning/research skills).

#### Context
Mia just finished setup. She wants to test the tool with something real — not "tell me a joke" but actual work. She asks the agent to help plan her week. This is the moment of truth: does the agent produce something she'd actually use, or does it feel like a generic ChatGPT wrapper?

#### Steps
1. Open workspace "Freelance Projects." Type: "Help me plan my week. I have three client deliverables due: Acme Corp strategy deck by Wednesday, Beta Inc brand audit by Thursday, and a proposal for a new prospect by Friday."
2. Expect: agent breaks down the week, suggests time allocation, identifies dependencies, asks clarifying questions about priorities.
3. If the agent asks questions, answer them. E.g., "The Acme deck is the highest priority — they're the biggest client."
4. Expect: agent produces a revised plan incorporating priorities.
5. Ask: "Can you draft a starting outline for the Acme strategy deck?"
6. Expect: agent produces a structured outline — not a vague "here are some topics" but section headers with brief descriptions.
7. Verify that the output is specific enough to actually use — not generic templates.

#### Functional Checkpoints
- [ ] Agent responds to the planning request with a structured output (not free-form text)
- [ ] Agent asks at least one clarifying question or makes priority-based suggestions
- [ ] Weekly plan includes all three deliverables with suggested timeline
- [ ] Plan reflects stated priorities (Acme first)
- [ ] Outline draft has at least 4 sections with descriptions
- [ ] Output is specific to the stated task, not a generic template
- [ ] Agent stores the plan/priorities in memory for future reference

#### Emotional Checkpoints
- [ ] Momentum: Within 10 minutes of finishing setup, Mia has a usable weekly plan and draft outline
- [ ] Alignment: The plan reflects how Mia actually thinks about her work — priorities, deliverables, timelines
- [ ] Seriousness: The output reads like something a competent assistant would produce, not a chatbot
- [ ] Relief: Mia didn't have to structure everything herself — the agent organized her scattered inputs
- [ ] Controlled Power: Mia set the priorities, agent organized around them

#### Features Exercised
- Task planning (multi-item)
- Priority-based reasoning
- Clarifying question behavior
- Document outline drafting
- Memory storage of plans/decisions
- Skill execution (daily-plan or similar)

#### Competitive Benchmark
- **Claude Code**: Can plan but no memory — plan lost after session. Waggle expected: **+1**
- **ChatGPT Desktop**: Can plan and draft but generic — no workspace context or memory persistence. Waggle expected: **+1**
- **Notion AI**: Can draft within a doc but can't plan across contexts. Waggle expected: **+1**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 4 (this is the "first real value" moment)
- Emotional: Momentum >= 4, Alignment >= 4, Seriousness >= 4

---

### Scenario 3.4: Settings Discovery

**Persona**: Marko (Developer / Technical Lead)
**Tier**: SOLO
**Duration**: 5 minutes
**Prerequisites**: Waggle installed and configured. At least one workspace exists.

#### Context
Marko wants to verify his setup and customize the experience. He navigates to Settings to check API key configuration, model selection, theme, and installed skills. As a technical user, he expects to find all controls without hunting.

#### Steps
1. Click Settings (gear icon or menu item). Expect: Settings panel opens immediately.
2. Verify tab structure. Expect: 5 tabs visible — not 8+, not 2. Check for: General, Model/AI, Appearance/Theme, Skills/Capabilities, About.
3. In the General/API tab: Expect: API key shown masked (e.g., "sk-ant...7f3x"). Verify the key is not shown in plaintext.
4. In the Model/AI tab: Expect: model selector dropdown showing current model. Change model. Expect: selector updates.
5. In the Appearance tab: Expect: theme toggle (light/dark). Toggle it. Expect: UI theme changes immediately.
6. In the Skills/Capabilities tab: Expect: list of installed skills with names and descriptions. Verify at least the default skills are listed.
7. Navigate back to the workspace. Expect: settings changes are persisted (theme stays changed).

#### Functional Checkpoints
- [ ] Settings opens from the expected location (gear icon or menu)
- [ ] Exactly 5 tabs are visible (post-M4 IA simplification)
- [ ] API key is displayed but masked — not in plaintext
- [ ] Model selector shows available models and allows switching
- [ ] Theme toggle works — UI changes immediately on toggle
- [ ] Skills list shows installed skills with names
- [ ] Settings changes persist after navigating away and returning
- [ ] Settings changes persist after app restart

#### Emotional Checkpoints
- [ ] Orientation: Marko finds every setting where he expects it — no hunting
- [ ] Controlled Power: All important controls are accessible and responsive
- [ ] Seriousness: Settings UI is clean and organized — not a developer debug panel
- [ ] Trust: API key handling is secure (masked display)

#### Features Exercised
- Settings panel navigation
- Settings IA (5-tab structure)
- API key display (masked)
- Model selector
- Theme toggle (light/dark)
- Skill list display
- Settings persistence

#### Competitive Benchmark
- **Claude Code**: Settings via config files and env vars. Waggle expected: **+1**
- **ChatGPT Desktop**: Minimal settings. Waggle expected: **+1** (more control)
- **Cursor AI**: Settings UI but IDE-focused. Waggle expected: **0**

#### Pass Criteria
- Functional: all checkpoints pass
- Business: score >= 3
- Emotional: Orientation >= 4, Controlled Power >= 4, Trust >= 3
