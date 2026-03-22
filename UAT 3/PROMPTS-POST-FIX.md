# Post-Fix Architecture Prompts for Claude Code

Execute these IN ORDER after Wave 1-4 bug fixes are done and build passes.

---

## Prompt 1: Per-Workspace Agent Instances + Model Config

```
ARCHITECTURE TASK: Make Waggle a true multi-workspace OS by enabling parallel per-workspace agent instances with per-workspace model selection.

## Current State
- One shared agent loop processes all workspaces serially
- Workspace config has a `model` field but the agent loop uses global defaultModel
- Fleet endpoint exists (/api/fleet) with maxSessions: 3 but is not wired to workspace agent spawning
- Cost tracking per workspace exists

## What to Build

### 1. Per-Workspace Agent Instances
The agent loop must become per-workspace, not singleton.

In packages/server/src/local/routes/chat.ts:
- When a chat message arrives for workspace X, check if an agent instance already exists for X
- If yes, route message to that instance
- If no, spawn a new agent instance for X (up to fleet maxSessions limit)
- Each instance has its own: context window, tool set (scoped to workspace dir), memory (.mind), persona

Implementation approach:
- Create a WorkspaceAgentManager class (or extend existing fleet logic)
- Map<workspaceId, AgentInstance> to track active agents
- AgentInstance holds: model, persona, tools, conversation history, workspace config
- On chat request: manager.getOrCreate(workspaceId) → route message
- Idle timeout: after 10 min of no messages, release the instance (free memory)
- When fleet is full (maxSessions reached): queue the request OR return "Agent busy, try again in a moment"

### 2. Per-Workspace Model Selection
Each workspace should use its own LLM model.

- Read workspace.model field when creating agent instance
- If workspace.model is set, use that model for all LLM calls in this workspace
- If not set, fall back to global defaultModel
- The model should be changeable via workspace settings (PUT /api/workspaces/:id with model field)
- Different workspaces can use different providers (Anthropic, OpenAI, Google) as long as the API key is in vault

In the agent loop / orchestrator:
- Replace hardcoded model references with workspace-level config
- The built-in Anthropic proxy already supports model routing via the model field in the request body
- For LiteLLM, the model name is passed directly

### 3. Per-Workspace Cost Budgets (optional but valuable)
- Add `budget` field to workspace config (monthly limit in USD)
- Track cumulative cost per workspace per month
- When budget exceeded: warn user, optionally block further LLM calls
- Expose via API: GET /api/workspaces/:id/cost → { used: 4.50, budget: 20.00, remaining: 15.50 }

### 4. Fleet Management Updates
- GET /api/fleet should list active workspace agent instances
- Each entry: { workspaceId, model, tokensUsed, messageCount, startedAt, lastActiveAt }
- POST /api/fleet/:workspaceId/kill — terminate a workspace agent
- Fleet maxSessions should be tier-based: Solo=3, Teams=10, Business=25, Enterprise=unlimited

## 5. UI — Workspace Settings Panel for Model + Budget

The user MUST be able to configure model and budget per workspace from the UI. No CLI, no config files — click and done.

### Workspace Settings (in-workspace header or settings tab)
Location: When user is inside a workspace, there should be a settings gear icon or a "Workspace Settings" section accessible from the workspace header area or the context panel.

Add to existing workspace settings UI (or create if none exists):

**Model Selection:**
- Dropdown labeled "AI Model" showing all available models from /api/settings (providers list)
- Current selection shown as badge/chip in workspace header: e.g. "Claude Sonnet 4" 
- "Use default" option that inherits from global settings
- When changed: PUT /api/workspaces/:id with { model: "claude-opus-4" }
- Visual feedback: the model badge in workspace header updates immediately
- Power user hint: different model = different color accent on the badge (subtle, e.g. Opus=purple, Sonnet=blue, Haiku=green, GPT=teal, Gemini=orange)

**Budget Control:**
- Input field labeled "Monthly Budget" with currency symbol ($)
- Shows current usage: "$4.50 / $20.00 used this month" with progress bar
- Warning state (yellow) at 80%, critical (red) at 95%, blocked at 100%
- "Unlimited" toggle for no budget cap
- When changed: PUT /api/workspaces/:id with { budget: 20.00 }

**Active Agent Indicator:**
- In workspace header, show when an agent is actively running for this workspace
- Green dot + "Agent active" or grey dot + "Agent idle"
- If fleet is full: "Agent queued (3/3 active)" with link to fleet view

### Fleet Overview (in Cockpit or Mission Control)
- Card showing all active workspace agents: workspace name, model, tokens used, time active
- Kill button per agent
- Fleet capacity bar: "2/3 agents active"

### Quick Model Switch
- In chat input area, small model indicator chip (e.g. "Sonnet 4")
- Click to quickly switch model for this workspace without going to settings
- Dropdown with recently used models + "More models..." link to full settings

### UI Files to Modify
- app/src/views/SettingsView.tsx or workspace-specific settings component — add Model + Budget sections
- app/src/components/AppSidebar.tsx or workspace header — add model badge + agent status indicator
- app/src/components/cockpit/index.ts — add fleet status card
- app/src/components/chat/ChatInput.tsx — add quick model switch chip
- app/src/hooks/ — add useWorkspaceSettings hook if needed
- packages/ui/src/components/settings/ — add WorkspaceModelSection and WorkspaceBudgetSection

### API endpoints needed (backend side, from sections above)
- GET /api/workspaces/:id → already returns model field, add budget + cost
- PUT /api/workspaces/:id → already accepts model, add budget
- GET /api/workspaces/:id/cost → { used, budget, remaining, history[] }
- GET /api/fleet → active agents with workspace attribution
- POST /api/fleet/:workspaceId/kill → terminate workspace agent

## Files to Modify
- packages/server/src/local/routes/chat.ts — main chat routing
- packages/server/src/local/index.ts — agent state, fleet management
- packages/agent/src/agent-loop.ts — model selection per instance
- packages/agent/src/orchestrator.ts — workspace-scoped orchestration
- packages/core/src/workspace.ts — add budget field to WorkspaceConfig
- packages/server/src/local/routes/workspaces.ts — expose cost/budget in API
- app/src/ — UI components listed above

## Rules
- Do NOT break existing single-workspace flow — it should still work as before
- Tests must pass (npx vitest run)
- Agent instances must be properly cleaned up on idle/kill
- Memory (.mind) is already per-workspace — just verify tools and persona are scoped
- This is the foundation for "OS for AI work" — make it clean and extensible
```

---

## Prompt 2: Virtual Workspace Storage + Team-Ready File Management

```
ARCHITECTURE TASK: Implement virtual workspace storage so workspaces without a linked directory have managed file storage, and prepare the file layer for team/cloud deployment.

## Current State
- Workspaces can have a `directory` field linking to a local folder
- When no directory is set, file tools fall back to user homedir (broken UX)
- System prompt warns "No workspace directory set. File operations use the user's home directory."
- ~/.waggle/workspaces/{id}/ exists with .mind file and sessions/ folder
- No concept of managed file storage per workspace

## What to Build

### 1. Virtual Workspace Storage (Local Mode)
Every workspace gets a managed files directory, regardless of whether it has a linked directory.

Location: ~/.waggle/workspaces/{workspace-id}/files/

Behavior:
- When workspace HAS a linked directory: file tools use that directory (current behavior, keep it)
- When workspace has NO linked directory: file tools use ~/.waggle/workspaces/{id}/files/ as CWD
- NEVER fall back to user homedir
- Create the files/ directory automatically on first file operation (lazy creation)

In chat.ts where workspacePath is resolved:
- If workspace.directory exists and is accessible → use it (linked mode)
- Else → use path.join(dataDir, 'workspaces', workspaceId, 'files') (virtual mode)
- Remove the homedir fallback entirely

In the system prompt generation:
- Replace "No workspace directory set. File operations use the user's home directory."
- With: "Workspace files are stored in managed storage." (for virtual)
- Or: "Workspace linked to: {directory}" (for linked)

### 2. File Storage Abstraction Layer
Create a FileStore interface that abstracts over local filesystem, so we can later swap in S3/MinIO for cloud deployment.

```typescript
// packages/core/src/file-store.ts

interface FileStore {
  // Read
  readFile(workspaceId: string, relativePath: string): Promise<Buffer>;
  listFiles(workspaceId: string, directory?: string): Promise<FileEntry[]>;
  searchFiles(workspaceId: string, pattern: string): Promise<FileEntry[]>;
  
  // Write
  writeFile(workspaceId: string, relativePath: string, content: Buffer): Promise<void>;
  deleteFile(workspaceId: string, relativePath: string): Promise<void>;
  moveFile(workspaceId: string, from: string, to: string): Promise<void>;
  
  // Meta
  getStorageInfo(workspaceId: string): Promise<{ usedBytes: number; fileCount: number }>;
}

interface FileEntry {
  name: string;
  path: string;         // relative to workspace root
  size: number;
  modified: string;     // ISO timestamp
  isDirectory: boolean;
}
```

Implementations:
- LocalFileStore: reads/writes to ~/.waggle/workspaces/{id}/files/ (implement NOW)
- S3FileStore: reads/writes to s3://bucket/workspaces/{id}/ (implement LATER — just define interface)
- LinkedDirStore: reads/writes to workspace.directory (existing behavior, wrap in interface)

The file tools (read_file, write_file, search_files, search_content, list_files) should use FileStore instead of direct fs calls. This is the key abstraction that makes cloud deployment possible.

### 3. File API Endpoints
Expose workspace files via REST (for UI file browser and team access):

- GET /api/workspaces/:id/files — list files in workspace
- GET /api/workspaces/:id/files/*path — read file content
- POST /api/workspaces/:id/files/*path — upload/write file
- DELETE /api/workspaces/:id/files/*path — delete file
- GET /api/workspaces/:id/storage — storage stats { usedBytes, fileCount, storageType: 'virtual'|'linked' }

These endpoints use the FileStore abstraction — same code works for local AND cloud.

### 4. Workspace Storage Type in Config
Add storage info to workspace API response:

```json
{
  "id": "my-project",
  "name": "My Project",
  "storageType": "linked",        // or "virtual"
  "directory": "D:\\Projects\\X",  // only for linked
  "storageStats": {
    "usedBytes": 1048576,
    "fileCount": 23
  }
}
```

### 5. Team Readiness (Prepare, Don't Implement)
For team workspaces in cloud deployment, the storage would be:
- S3/MinIO bucket with workspace-scoped prefixes
- All team members access through API, not filesystem
- File locking for concurrent edits (optimistic locking via ETag)
- File versioning (S3 versioning or manual)

DO NOT implement S3/MinIO now — just ensure the FileStore interface supports it. The key principle: NO file tool should directly call fs.readFile() or fs.writeFile() — everything goes through FileStore.

### 6. Migration for Existing Workspaces
- Existing linked workspaces: no change
- Existing virtual workspaces (no directory): create files/ dir, no migration needed
- System prompt update: auto-detect storage type and inform agent

## Files to Create
- packages/core/src/file-store.ts — FileStore interface + LocalFileStore + LinkedDirStore

## Files to Modify  
- packages/server/src/local/routes/chat.ts — use FileStore for workspace path resolution
- packages/server/src/local/routes/workspaces.ts — add storage info to response, new file endpoints
- packages/agent/src/system-tools.ts — use FileStore instead of direct fs calls
- packages/server/src/local/index.ts — initialize FileStore on startup

## Rules
- DO NOT break linked directory workspaces — they must continue to work exactly as before
- DO NOT implement S3/MinIO — only define the interface
- Tests must pass
- Virtual workspace files/ dir is created lazily (on first write), not eagerly
- Path traversal protection: all file operations must resolve within workspace boundary (use resolveSafe or equivalent)
- This is the foundation for team file sharing — make the abstraction clean
```

---

## Execution Order

1. First: finish Wave 1-4 bug fixes (currently in progress)
2. Verify build passes: npm run build && npx vitest run
3. Execute Prompt 1 (per-workspace agents + model config)
4. Build + test
5. Execute Prompt 2 (virtual storage + FileStore abstraction)
6. Build + test
7. Then run re-test rounds (3 focused rounds as planned)
