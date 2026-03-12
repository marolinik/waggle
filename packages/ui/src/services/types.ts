/**
 * WaggleService interface — the abstraction layer that allows UI components
 * to work with local (desktop) or cloud (web) backends interchangeably.
 */

// ── Stream Events ──────────────────────────────────────────────────────

export interface StreamEvent {
  type: 'token' | 'tool' | 'tool_result' | 'step' | 'done' | 'error' | 'approval_required' | 'file_created';
  content?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: unknown;
  usage?: { inputTokens: number; outputTokens: number };
  requestId?: string;
  toolName?: string;
  /** For file_created events: the file path and action */
  filePath?: string;
  fileAction?: 'write' | 'edit' | 'generate';
  /** For tool_result events: execution duration in ms */
  duration?: number;
  /** For tool_result events: whether the result is an error */
  isError?: boolean;
}

// ── Messages ───────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolUse?: ToolUseEvent[];
  steps?: string[];
}

export type ToolStatus = 'running' | 'done' | 'error' | 'denied' | 'pending_approval';

export interface ToolUseEvent {
  name: string;
  input: Record<string, unknown>;
  result?: string;
  duration?: number;
  approved?: boolean;
  requiresApproval: boolean;
  requestId?: string;
  status: ToolStatus;
}

// ── Workspaces ─────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  group: string;
  icon?: string;
  model?: string;
  personality?: string;
  tools?: string[];
  skills?: string[];
  team?: string | null;
  /** Filesystem directory where agent operates and generates files. */
  directory?: string;
  created: string;
}

// ── Progress Items (E3) ───────────────────────────────────────────────

export interface ProgressItem {
  content: string;
  type: 'task' | 'completed' | 'blocker';
  date: string;
  sessionId: string;
}

// ── Workspace Context (catch-up / return reward) ──────────────────────

export interface WorkspaceContext {
  workspace: { id: string; name: string; group?: string; model?: string; directory?: string };
  summary: string;
  recentThreads: Array<{ id: string; title: string; lastActive: string }>;
  recentDecisions: Array<{ content: string; date: string }>;
  suggestedPrompts: string[];
  recentMemories: Array<{ content: string; importance: string; date: string }>;
  progressItems?: ProgressItem[];
  stats: { memoryCount: number; sessionCount: number; fileCount?: number };
  lastActive: string;
}

// ── Sessions ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  workspaceId?: string;
  title?: string;
  summary?: string | null;
  messageCount: number;
  lastActive: string;
  created: string;
}

// ── Session Search (F1) ───────────────────────────────────────────

export interface SessionSearchResult {
  sessionId: string;
  title: string;
  summary: string | null;
  matchCount: number;
  snippets: Array<{ text: string; role: string }>;
  lastActive: string;
}

// ── File Registry (F2) ───────────────────────────────────────────

export interface FileRegistryEntry {
  name: string;
  type: string;
  summary: string;
  sizeBytes: number;
  ingestedAt: string;
}

// ── Memory ─────────────────────────────────────────────────────────────

export interface Frame {
  id: number;
  content: string;
  source: 'personal' | 'workspace';
  frameType: string;
  importance: string;
  timestamp: string;
  score?: number;
  gop?: string;
  sessionId?: string;
  entities?: string[];
  linkedFrames?: number[];
}

// ── Agent Status ───────────────────────────────────────────────────────

export interface AgentStatus {
  running: boolean;
  currentTask?: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
}

// ── Configuration ──────────────────────────────────────────────────────

export interface WaggleConfig {
  providers: Record<string, { apiKey: string; models: string[] }>;
  defaultModel: string;
  theme: 'dark' | 'light';
  autostart: boolean;
  globalHotkey: string;
}

// ── Service Interface ──────────────────────────────────────────────────

export interface WaggleService {
  // Connection lifecycle
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // Chat
  sendMessage(workspace: string, message: string, session?: string, model?: string, workspacePath?: string): AsyncGenerator<StreamEvent>;
  getHistory(workspace: string, session?: string): Promise<Message[]>;

  // Workspaces
  listWorkspaces(): Promise<Workspace[]>;
  createWorkspace(config: Partial<Workspace>): Promise<Workspace>;
  updateWorkspace(id: string, config: Partial<Workspace>): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  getWorkspaceContext(id: string): Promise<WorkspaceContext>;

  // Memory
  searchMemory(query: string, scope: 'personal' | 'workspace' | 'all'): Promise<Frame[]>;
  getKnowledgeGraph(workspace: string): Promise<{ entities: unknown[]; relations: unknown[] }>;

  // Sessions
  listSessions(workspace: string): Promise<Session[]>;
  createSession(workspace: string, title?: string): Promise<Session>;
  deleteSession(sessionId: string, workspace: string): Promise<void>;
  renameSession(sessionId: string, workspace: string, title: string): Promise<void>;
  searchSessions(workspace: string, query: string): Promise<SessionSearchResult[]>;
  exportSession(workspace: string, sessionId: string): Promise<string>;

  // Files
  listFiles(workspace: string): Promise<FileRegistryEntry[]>;

  // Approval gates
  approveAction(requestId: string): void;
  denyAction(requestId: string, reason?: string): void;

  // Agent
  getAgentStatus(): Promise<AgentStatus>;

  // Settings
  getConfig(): Promise<WaggleConfig>;
  updateConfig(config: Partial<WaggleConfig>): Promise<void>;
  testApiKey(provider: string, key: string): Promise<{ valid: boolean; error?: string }>;

  // Events
  on(event: string, cb: (data: unknown) => void): () => void;
}
