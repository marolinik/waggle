# 10 — Trust & Transparency

Tests the features that make Waggle trustworthy for professional use. Users must see what the agent does, approve sensitive actions, verify capability integrity, and know their secrets are safe. Trust is not a feature — it is the product's foundation.

---

## Scenario 10.1: Tool Transparency

**Persona**: Marko (Developer / Technical Lead)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, workspace with some accumulated memories, agent tools functional

### Context

Marko asks the agent to research a topic and produce a summary. He wants to see HOW the agent arrived at its answer — what tools it used, what it searched for, what it read. Waggle's ToolCards should make the agent's process visible, not hide it behind a polished paragraph. This is the core trust loop: if the user can see the work, they trust the output.

### Steps

1. In an active workspace, send: "Search my workspace memories for anything about database migration decisions and summarize what you find." Expect: agent begins working, ToolCards appear as the agent uses tools.
2. Observe the first ToolCard. Expect: a card shows the tool name (e.g., `memory_search`), the input (search query), and the result summary — not raw JSON, but readable output.
3. Watch for subsequent ToolCards. Expect: if the agent reads specific memories, each read operation produces a visible ToolCard.
4. Wait for the final response. Expect: agent produces a summary that clearly connects to what the ToolCards showed (the tools found X, the summary references X).
5. Review the ToolCard grouping. Expect: adjacent ToolCards from the same tool chain are grouped or summarized (not a wall of individual cards). Completion animation plays when tool chain finishes.
6. Verify ToolCards are expandable/collapsible. Expect: cards show a compact view by default, expandable to see full details.

### Functional Checkpoints

- [ ] ToolCards appear as agent uses tools (real-time, not after the fact)
- [ ] Each ToolCard shows: tool name, input summary, output summary
- [ ] ToolCards display human-readable content (not raw JSON blobs)
- [ ] Adjacent tool calls are grouped (not individual cards for every micro-operation)
- [ ] Completion animation plays when a tool chain finishes
- [ ] ToolCards are compact by default, expandable for details
- [ ] The agent's final response connects logically to what the ToolCards showed
- [ ] ToolCards do not overwhelm the conversation view (scroll position is maintained)

### Emotional Checkpoints

- [ ] Trust: Marko can see exactly what the agent searched, read, and found — no black box
- [ ] Orientation: ToolCards tell the story of the agent's process — Marko can follow along
- [ ] Controlled Power: Marko sees the agent working FOR him, not doing mysterious things
- [ ] Seriousness: The transparency feels professional — like watching a colleague work, not debugging a tool
- [ ] Alignment: The agent searched for what Marko asked about, not random tangents

### Features Exercised

- ToolCard rendering (name, input, output)
- Real-time ToolCard appearance during agent execution
- ToolCard grouping for adjacent operations
- ToolCard completion animation
- ToolCard expand/collapse
- Agent tool transparency end-to-end

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | Shows tool calls in terminal but as raw text, no grouping, no collapse. | +1 |
| ChatGPT Desktop | No tool transparency. User sees only the final output. | +2 |
| Cursor AI | Shows some tool calls in sidebar but not grouped or summarized. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 5 (tool transparency is Waggle's trust differentiator — this must be excellent)
- Emotional: Trust must score >= 4, average feeling score >= 4

---

## Scenario 10.2: Approval Gates

**Persona**: Ana (Product Manager)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, at least one uninstalled skill available (to trigger `install_capability` which is in ALWAYS_CONFIRM list)

### Context

Ana asks the agent to do something that requires elevated permission — in this case, installing a capability. The agent should not silently install it. An approval gate must appear: a clear dialog that describes what the agent wants to do, why, and gives Ana the power to approve or deny. This is the control mechanism that makes powerful agents safe.

### Steps

1. In an active workspace, send a request that triggers a gated tool. For example: "Install the planning-matrix skill for me." Expect: agent identifies the skill and proposes installation.
2. Wait for approval gate. Expect: a gate dialog appears with clear description of the action — what tool, what it will do, what the consequences are.
3. Read the gate dialog carefully. Expect: it says something like "The agent wants to install 'planning-matrix' skill. This will add new planning capabilities to your agent. Approve?" — not a cryptic technical prompt.
4. Click "Deny." Expect: agent acknowledges the denial gracefully. No error, no retry. Agent explains what it can do without the skill.
5. Repeat the request. Expect: gate appears again (denial is per-invocation, not permanent).
6. Click "Approve." Expect: action proceeds, skill installs, agent confirms and continues.

### Functional Checkpoints

- [ ] Approval gate triggers for ALWAYS_CONFIRM tools (e.g., `install_capability`)
- [ ] Gate dialog describes the action in human-readable language
- [ ] Gate dialog has clear Approve and Deny buttons
- [ ] Deny stops the action immediately — no execution occurs
- [ ] Agent handles denial gracefully (no error, offers alternatives)
- [ ] Denial is per-invocation (same tool can be gated again next time)
- [ ] Approve allows the action to proceed and complete
- [ ] Gate dialog does not auto-dismiss or time out (waits for user decision)
- [ ] SSE streaming resumes correctly after gate approval

### Emotional Checkpoints

- [ ] Controlled Power: Ana decided. The agent proposed, she approved or denied. She is in charge.
- [ ] Trust: The gate gave Ana full information before asking for permission — no surprises
- [ ] Orientation: Ana understood exactly what was being asked and what would happen
- [ ] Relief: Ana can let the agent be powerful BECAUSE she knows she can stop it
- [ ] Seriousness: The gate treats the action as consequential — it's not a rubber stamp

### Features Exercised

- Approval gate triggering (ALWAYS_CONFIRM tool list)
- Gate dialog UI rendering
- Approve flow (action proceeds)
- Deny flow (action stopped, agent continues gracefully)
- SSE streaming after gate resolution
- Per-invocation gate enforcement

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | Has approval prompts in terminal but text-only, no structured UI, no description. | +1 |
| ChatGPT Desktop | No approval gates. Tools run without user consent. | +2 |
| Cursor AI | Has "accept/reject" for code changes but not for arbitrary tool actions. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 5 (approval gates are what makes powerful agents safe — non-negotiable)
- Emotional: Controlled Power must score >= 5, Trust must score >= 4

---

## Scenario 10.3: Audit Trail

**Persona**: Marko (Developer / Technical Lead)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, at least 3 skills previously installed (with varying install methods — manual, pack, agent-initiated)

### Context

Marko wants to review what capabilities have been added to his Waggle instance over time. As a technical lead, he thinks about supply chain security — what code is running on his machine, where did it come from, and when was it added? The audit trail should give him a complete, chronological record.

### Steps

1. Navigate to Cockpit. Expect: Cockpit loads with Trust Audit section visible.
2. Open the Trust Audit section. Expect: chronological list of capability install events.
3. Review the first audit entry. Expect: entry shows timestamp (human-readable), skill name, source trust level (e.g., "built-in," "starter-pack," "community"), risk assessment (low/medium/high), and who/what initiated the install.
4. Compare entries from different install methods. Expect: a skill installed from a pack shows "pack: Research Workflow" as source. A skill installed via agent shows "agent-initiated" with the conversation context. A manually installed skill shows "user-initiated."
5. Check that all 3+ previously installed skills appear. Expect: no missing entries. Every install is accounted for.
6. Verify entries are ordered by time. Expect: newest first (or sortable), consistent chronological ordering.

### Functional Checkpoints

- [ ] Trust Audit section exists in Cockpit
- [ ] All installed skills have audit entries (no missing records)
- [ ] Each entry includes: timestamp, skill name, source trust level, risk assessment
- [ ] Each entry includes install method/initiator (manual, pack, agent)
- [ ] Pack-installed skills reference the source pack
- [ ] Agent-installed skills reference agent initiation
- [ ] Entries are chronologically ordered
- [ ] Audit trail is append-only (no entries can be deleted or modified by the user)
- [ ] REST endpoint returns consistent data with UI display

### Emotional Checkpoints

- [ ] Trust: Marko can verify every capability on his system — nothing snuck in unnoticed
- [ ] Seriousness: The audit trail treats capability management as a security concern, not a convenience feature
- [ ] Orientation: Marko can scan the list and quickly understand his system's capability history
- [ ] Controlled Power: Full visibility means full control — Marko knows exactly what's running

### Features Exercised

- Audit trail persistence
- Audit entry metadata (timestamp, source, risk, initiator)
- Source attribution (manual, pack, agent)
- Chronological ordering
- Audit trail REST endpoint
- Cockpit audit UI rendering

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No capability audit trail. No install history. | +2 |
| ChatGPT Desktop | No audit trail for GPT installations. | +2 |
| Cursor AI | Extension install history exists in VS Code but no risk/trust metadata. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (audit trail is essential for professional and enterprise use)
- Emotional: Trust must score >= 4, Seriousness must score >= 4

---

## Scenario 10.4: Vault Security

**Persona**: David (HR Manager)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, settings accessible, no API keys previously stored in vault

### Context

David needs to add his company's API key for an integration. As an HR manager handling sensitive employee data, he's acutely aware of credential security. He expects API keys to be encrypted, not stored in a readable config file. The vault should handle secrets properly — encrypted at rest, masked in the UI, and validated before storage.

### Steps

1. Navigate to Settings. Expect: a section for API keys / secrets / vault management is visible.
2. Click "Add API Key" or similar. Expect: input field for key name and key value, with the value field masked (password-style input).
3. Enter a test API key: name "Test Service" and value "sk-test-12345abcdef." Expect: key value is masked as typed (dots or asterisks).
4. Save the key. Expect: confirmation that the key was saved. No plaintext key visible in the confirmation.
5. Return to the key list. Expect: "Test Service" appears with a masked value (e.g., "sk-test-...cdef" showing only first and last few characters, or fully masked).
6. Verify storage security: check that the key is NOT in `~/.waggle/config.json` in plaintext. Expect: key is stored in the encrypted vault (AES-256-GCM), not in the config file.
7. Test key validation. Expect: if a "Test" or "Validate" button exists, it checks the key format or connectivity without exposing the key value.

### Functional Checkpoints

- [ ] Vault / API key management section exists in Settings
- [ ] Key input field masks the value during entry
- [ ] Key is saved without errors
- [ ] Saved key shows masked in the UI (not plaintext)
- [ ] Key is NOT stored in plaintext in `config.json`
- [ ] Key is stored in encrypted vault (AES-256-GCM)
- [ ] Key validation / test function works (if available)
- [ ] Multiple keys can be stored (not just one)
- [ ] Keys persist across app restart (vault survives restart)

### Emotional Checkpoints

- [ ] Trust: David's credentials are handled with the same care a banking app would use
- [ ] Seriousness: The vault signals that Waggle takes data security seriously — not an afterthought
- [ ] Relief: David doesn't have to worry about his API keys leaking from a config file
- [ ] Orientation: The Settings UI makes it clear where secrets are stored and how they're protected

### Features Exercised

- Vault encrypted storage (AES-256-GCM)
- API key CRUD in Settings
- Key masking in UI (input and display)
- Auto-migration to vault (if legacy keys existed)
- Key validation
- Vault persistence across restarts

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | API keys set as environment variables. No vault, no encryption, no UI. | +2 |
| ChatGPT Desktop | API key managed by OpenAI account, not locally stored. Different model. | 0 |
| Cursor AI | API keys stored in VS Code settings (JSON, not encrypted). | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (encrypted credential storage is a professional requirement)
- Emotional: Trust must score >= 5, Seriousness must score >= 4
