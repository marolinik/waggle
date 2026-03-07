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

export interface OrchestratorConfig {
  db: MindDB;
  embedder: Embedder;
  apiKey?: string;
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

  constructor(config: OrchestratorConfig) {
    this.db = config.db;
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

  buildSystemPrompt(): string {
    const parts: string[] = [];

    if (this.identity.exists()) {
      parts.push('# Identity\n' + this.identity.toContext());
    }

    const awarenessCtx = this.awareness.toContext();
    if (awarenessCtx !== 'No active awareness items.') {
      parts.push('# Current State\n' + awarenessCtx);
    }

    parts.push(
      '# Available Tools',
      'You have access to the following .mind tools:',
      ...this.tools.map(t => `- ${t.name}: ${t.description}`),
      '',
      '# Instructions',
      'Use your memory tools to recall relevant context before responding.',
      'Save important observations and decisions as memories.',
      'Track tasks and pending items in awareness.',
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
