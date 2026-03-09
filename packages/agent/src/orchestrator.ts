import {
  type MindDB,
  IdentityLayer,
  AwarenessLayer,
  FrameStore,
  SessionStore,
  HybridSearch,
  KnowledgeGraph,
  type Embedder,
} from '@waggle/core';
import { createMindTools, type ToolDefinition } from './tools.js';
import { buildSelfAwareness, type AgentCapabilities } from './self-awareness.js';

export interface OrchestratorConfig {
  db: MindDB;
  embedder: Embedder;
  apiKey?: string;
  model?: string;
  mode?: 'local' | 'team';
  version?: string;
  skills?: string[];
}

export class Orchestrator {
  private db: MindDB;
  private identity: IdentityLayer;
  private awareness: AwarenessLayer;
  private frames: FrameStore;
  private sessions: SessionStore;
  private search: HybridSearch;
  private knowledge: KnowledgeGraph;
  private tools: ToolDefinition[];
  private model: string;
  private mode: 'local' | 'team';
  private version: string;
  private skills: string[];

  constructor(config: OrchestratorConfig) {
    this.db = config.db;
    this.model = config.model ?? 'unknown';
    this.mode = config.mode ?? 'local';
    this.version = config.version ?? '0.0.0';
    this.skills = config.skills ?? [];
    this.identity = new IdentityLayer(config.db);
    this.awareness = new AwarenessLayer(config.db);
    this.frames = new FrameStore(config.db);
    this.sessions = new SessionStore(config.db);
    this.search = new HybridSearch(config.db, config.embedder);
    this.knowledge = new KnowledgeGraph(config.db);

    this.tools = createMindTools({
      db: this.db,
      identity: this.identity,
      awareness: this.awareness,
      frames: this.frames,
      sessions: this.sessions,
      search: this.search,
      knowledge: this.knowledge,
    });
  }

  getMemoryStats(): { frameCount: number; sessionCount: number; entityCount: number } {
    const raw = this.db.getDatabase();
    const frameCount = (raw.prepare('SELECT COUNT(*) as cnt FROM memory_frames').get() as { cnt: number }).cnt;
    const sessionCount = (raw.prepare('SELECT COUNT(*) as cnt FROM sessions').get() as { cnt: number }).cnt;
    const entityCount = (raw.prepare('SELECT COUNT(*) as cnt FROM knowledge_entities').get() as { cnt: number }).cnt;
    return { frameCount, sessionCount, entityCount };
  }

  buildSystemPrompt(): string {
    const parts: string[] = [];

    if (this.identity.exists()) {
      parts.push('# Identity\n' + this.identity.toContext());
    }

    const awarenessCtx = this.awareness.toContext();
    if (awarenessCtx !== 'No active awareness items.') {
      parts.push('# Current State\n' + awarenessCtx);
    }

    // Self-awareness block before memory tools
    const caps: AgentCapabilities = {
      tools: this.tools.map(t => ({ name: t.name, description: t.description })),
      skills: this.skills,
      model: this.model,
      memoryStats: this.getMemoryStats(),
      mode: this.mode,
      version: this.version,
    };
    parts.push(buildSelfAwareness(caps));

    parts.push(
      '# Memory Tools',
      ...this.tools.map(t => `- ${t.name}: ${t.description}`),
      '',
      'Use search_memory to recall context when relevant. Save important facts with save_memory. Don\'t overuse — only save things worth remembering.',
    );

    return parts.join('\n\n');
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool.execute(args);
  }

  getIdentity(): IdentityLayer { return this.identity; }
  getAwareness(): AwarenessLayer { return this.awareness; }
  getFrames(): FrameStore { return this.frames; }
  getSessions(): SessionStore { return this.sessions; }
  getSearch(): HybridSearch { return this.search; }
  getKnowledge(): KnowledgeGraph { return this.knowledge; }
}
