/**
 * WaggleService interface — the abstraction layer that allows UI components
 * to work with local (desktop) or cloud (web) backends interchangeably.
 */

// ── Stream Events ──────────────────────────────────────────────────────

export interface StreamEvent {
  type: 'token' | 'tool' | 'tool_result' | 'step' | 'done' | 'error';
  content?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: unknown;
  usage?: { inputTokens: number; outputTokens: number };
}

// ── Messages ───────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolUse?: ToolUseEvent[];
}

export interface ToolUseEvent {
  name: string;
  input: Record<string, unknown>;
  result?: string;
  duration?: number;
  approved?: boolean;
  requiresApproval: boolean;
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
  created: string;
}

// ── Sessions ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  workspaceId?: string;
  title?: string;
  messageCount: number;
  lastActive: string;
  created: string;
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
  sendMessage(workspace: string, message: string, session?: string): AsyncGenerator<StreamEvent>;
  getHistory(workspace: string, session?: string): Promise<Message[]>;

  // Workspaces
  listWorkspaces(): Promise<Workspace[]>;
  createWorkspace(config: Partial<Workspace>): Promise<Workspace>;
  updateWorkspace(id: string, config: Partial<Workspace>): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;

  // Memory
  searchMemory(query: string, scope: 'personal' | 'workspace' | 'all'): Promise<Frame[]>;
  getKnowledgeGraph(workspace: string): Promise<{ entities: unknown[]; relations: unknown[] }>;

  // Sessions
  listSessions(workspace: string): Promise<Session[]>;
  createSession(workspace: string, title?: string): Promise<Session>;
  deleteSession(sessionId: string, workspace: string): Promise<void>;

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
