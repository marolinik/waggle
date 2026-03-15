# 06 — Workspace Management

Tests the workspace model that makes Waggle workspace-native rather than a generic chat app. Workspaces are the fundamental unit of context — each one is a separate brain with its own memory, sessions, and agent state.

---

## Scenario 6.1: Create Workspace

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: [SOLO]
**Duration**: 3 minutes
**Prerequisites**: Waggle desktop running, at least one existing workspace (default)

### Context

Mia just landed a new consulting client — "Acme Corp Strategy Review." She needs a dedicated workspace so the agent context for this client stays separate from her other projects. She expects workspace creation to be fast and obvious, like creating a new folder.

### Steps

1. Click the "+" or "New Workspace" button in the sidebar. Expect: a creation dialog appears immediately, no page navigation required.
2. Enter workspace name "Acme Corp Strategy Review." Expect: name accepted, no character restrictions on normal text.
3. Select or create a group "Clients." Expect: group dropdown shows existing groups plus option to create new.
4. Confirm creation. Expect: workspace appears in sidebar under the "Clients" group within 1 second.
5. Click into the new workspace. Expect: workspace opens with an empty but welcoming home screen — not a blank void.
6. Send a first message: "What do we know about Acme Corp?" Expect: agent responds acknowledging this is a fresh workspace with no prior context, offers to help build knowledge.

### Functional Checkpoints

- [ ] Workspace creation dialog is accessible from sidebar
- [ ] Name and group fields accept input without errors
- [ ] New workspace appears in sidebar immediately after creation
- [ ] Workspace is assigned a distinct hue color
- [ ] Workspace home screen renders (not blank)
- [ ] Empty memory state is handled gracefully (no errors, no "no memories found" dump)
- [ ] First message round-trip succeeds — agent responds coherently
- [ ] Workspace has its own session history (separate from other workspaces)

### Emotional Checkpoints

- [ ] Orientation: Mia knows exactly how to create a workspace — the UI guides her without documentation
- [ ] Relief: The process is fast enough that creating a workspace feels like a zero-cost decision
- [ ] Alignment: Workspace creation matches Mia's mental model of "new project = new space"
- [ ] Controlled Power: Mia chose the name, group, and timing — nothing was auto-decided for her

### Features Exercised

- Workspace CRUD (create)
- Sidebar workspace list
- Workspace grouping
- Hue color assignment
- Workspace home screen (empty state)
- Agent message round-trip in new workspace

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No workspace concept. User manages context via files/directories manually. | +2 |
| ChatGPT Desktop | "Projects" exist but are flat, no grouping, no persistent memory per project. | +1 |
| Cursor AI | Per-project via folder opening. No explicit workspace creation or grouping. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (workspace creation is a core differentiator)
- Emotional: average feeling score >= 3, no feeling below 2

---

## Scenario 6.2: Workspace Organization

**Persona**: Luka (Project Manager)
**Tier**: [SOLO]
**Duration**: 5 minutes
**Prerequisites**: Waggle desktop running, no pre-existing workspaces beyond default

### Context

Luka manages 3 concurrent projects plus handles internal PM processes. He wants to organize his workspaces so he can mentally map his sidebar to his actual work portfolio: two groups ("Active Projects" and "Internal") with workspaces under each. Speed of switching is critical — he context-switches 20+ times per day.

### Steps

1. Create 5 workspaces: "Project Alpha," "Project Beta," "Project Gamma" (group: "Active Projects"), "Sprint Retro Templates," "PM Playbook" (group: "Internal"). Expect: each creation takes < 10 seconds.
2. Observe sidebar. Expect: two groups visible, workspaces nested correctly under each group, distinct hue colors per workspace.
3. Collapse the "Internal" group. Expect: group collapses, only "Active Projects" workspaces visible.
4. Expand "Internal" again. Expect: workspaces reappear without delay.
5. Click "Project Alpha." Expect: workspace loads in < 500ms.
6. Click "Sprint Retro Templates." Expect: workspace switches instantly, no loading spinner, previous workspace state preserved.
7. Click back to "Project Alpha." Expect: instant switch, any prior context still visible.

### Functional Checkpoints

- [ ] 5 workspaces created successfully across 2 groups
- [ ] Sidebar displays groups with correct workspace nesting
- [ ] Each workspace has a visually distinct hue color
- [ ] Group collapse/expand toggles work without page reload
- [ ] Workspace switching completes in < 500ms (no full page reload)
- [ ] Workspace state is preserved when switching away and back
- [ ] Sidebar scroll position is maintained across switches

### Emotional Checkpoints

- [ ] Orientation: Luka can see his entire work portfolio at a glance — the sidebar IS his project map
- [ ] Momentum: Switching between projects is instant — no friction, no re-loading, no "where was I"
- [ ] Seriousness: The organization model feels professional, not toy-like — groups, colors, structure
- [ ] Controlled Power: Luka organized things HIS way — the tool adapted to his mental model

### Features Exercised

- Workspace CRUD (create, multiple)
- Workspace grouping (multiple groups)
- Sidebar group collapse/expand
- Workspace hue color differentiation
- Workspace switching performance
- State preservation across switches

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No concept of multiple projects simultaneously. One terminal, one context. | +2 |
| ChatGPT Desktop | Flat project list, no grouping, no color coding, slow switching. | +2 |
| Cursor AI | Per-window project isolation. No sidebar portfolio view. Switching = open new window. | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (multi-project management is the core value prop for PMs)
- Emotional: average feeling score >= 4, no feeling below 3

---

## Scenario 6.3: Workspace Home

**Persona**: Ana (Product Manager)
**Tier**: [SOLO]
**Duration**: 4 minutes
**Prerequisites**: Waggle desktop running, workspace "Product Roadmap Q2" with at least 3 prior sessions and accumulated memories (decisions, research notes, drafts)

### Context

Ana returns to her "Product Roadmap Q2" workspace after a long weekend. She needs to quickly recall where she left off: what decisions were made, what the agent last worked on, and what context is available. The workspace home screen should give her this "welcome back" moment — the feeling that her project remembers her.

### Steps

1. Click "Product Roadmap Q2" workspace in sidebar. Expect: workspace home screen loads, not a blank chat.
2. Read the workspace home content. Expect: workspace summary visible — recent memories, last active timestamp, key context highlights.
3. Check "last active" indicator. Expect: shows a human-readable time like "Last active: Friday, 3:42 PM" — not a raw timestamp.
4. Review recent memories section. Expect: 3-5 most recent/relevant memories displayed with titles or summaries.
5. Look for a "welcome back" contextual element. Expect: the home screen acknowledges accumulated context — e.g., "12 memories, 3 sessions" or similar workspace vital signs.
6. Click into the chat/session area. Expect: can start a new session or continue the last one, with context from the workspace available to the agent.

### Functional Checkpoints

- [ ] Workspace home screen renders (not a blank chat input)
- [ ] Recent memories displayed with readable summaries
- [ ] Last active timestamp shows in human-readable format
- [ ] Workspace statistics visible (memory count, session count, or similar)
- [ ] "Welcome back" context is present — the screen communicates accumulated state
- [ ] Navigation from home to active chat/session is one click
- [ ] Agent in new session can reference workspace memories without user re-stating them

### Emotional Checkpoints

- [ ] Orientation: Ana immediately knows the state of this workspace — no digging required
- [ ] Relief: "It remembers everything. I don't have to rebuild context."
- [ ] Continuity: The workspace feels like a living project, not a dead chat log
- [ ] Trust: The information shown is accurate and useful, not generic filler
- [ ] Momentum: Ana can go from "returning" to "working" in under 30 seconds

### Features Exercised

- Workspace home screen
- Recent memories display
- Last active timestamp
- Workspace vital signs / statistics
- Session continuity
- Memory-aware agent responses

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | No concept of "returning." Every session starts from zero. | +2 |
| ChatGPT Desktop | Chat history exists but no summary, no "welcome back," no memory highlights. | +2 |
| Cursor AI | Opens to file tree. No project context summary or memory. | +2 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 4 (workspace re-entry is Waggle's signature moment)
- Emotional: average feeling score >= 4, Continuity and Relief must score >= 4

---

## Scenario 6.4: Delete Workspace

**Persona**: Mia (Solo Knowledge Worker)
**Tier**: [SOLO]
**Duration**: 3 minutes
**Prerequisites**: Waggle desktop running, workspace "Old Client - Archived" exists with some memories and sessions

### Context

Mia finished her engagement with an old client months ago. The workspace is cluttering her sidebar. She wants to delete it — but she needs to feel confident that this is a deliberate, reversible (or at least well-warned) action. Accidental deletion of a workspace with months of accumulated memory would be devastating.

### Steps

1. Right-click or access the context menu for "Old Client - Archived" workspace. Expect: menu includes a "Delete" or "Remove" option, visually distinct (red text or warning icon).
2. Click delete. Expect: a confirmation dialog appears — NOT immediate deletion. Dialog should state what will be lost (memories, sessions, files).
3. Read the confirmation dialog. Expect: clear language like "This will permanently delete the workspace and all its memories (X memories, Y sessions). This cannot be undone."
4. Confirm deletion. Expect: workspace disappears from sidebar. No errors.
5. Verify the workspace is gone. Expect: not visible in sidebar, not accessible via any navigation.
6. Check that other workspaces are unaffected. Expect: all other workspaces intact, their memories and sessions unchanged.

### Functional Checkpoints

- [ ] Delete option is accessible from workspace context menu or settings
- [ ] Confirmation dialog appears before deletion (not instant delete)
- [ ] Confirmation dialog describes what will be lost (memory count, session count)
- [ ] After confirmation, workspace is removed from sidebar
- [ ] Workspace data is cleaned up (memories, sessions, .mind data)
- [ ] Other workspaces remain completely unaffected
- [ ] Sidebar re-renders correctly after deletion (no ghost entries, no layout break)
- [ ] If the deleted workspace was active, user is redirected to another workspace

### Emotional Checkpoints

- [ ] Trust: The confirmation dialog makes Mia feel protected — no accidental data loss
- [ ] Seriousness: The deletion flow treats her data as valuable, not disposable
- [ ] Controlled Power: Mia is in charge — the system warned her, she decided, it executed
- [ ] Orientation: After deletion, Mia is not stranded — she's on another workspace, sidebar is clean

### Features Exercised

- Workspace CRUD (delete)
- Confirmation dialog for destructive actions
- Workspace memory cleanup
- Sidebar re-rendering after deletion
- Active workspace redirect on deletion

### Competitive Benchmark

| Competitor | Experience | Score |
|-----------|-----------|-------|
| Claude Code | Nothing to delete — no persistent project state. N/A. | 0 |
| ChatGPT Desktop | Can delete conversations. No confirmation of what's lost. No memory cleanup. | +1 |
| Cursor AI | Close project folder. No data cleanup, no confirmation, no concept of "deleting context." | +1 |

### Pass Criteria

- Functional: all checkpoints pass
- Business: score >= 3 (deletion is housekeeping, not a differentiator, but must be safe)
- Emotional: Trust must score >= 4, no feeling below 3
