import type {
  MindDB,
  IdentityLayer,
  AwarenessLayer,
  FrameStore,
  SessionStore,
  HybridSearch,
  KnowledgeGraph,
} from '@waggle/core';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface MindToolDeps {
  db: MindDB;
  identity: IdentityLayer;
  awareness: AwarenessLayer;
  frames: FrameStore;
  sessions: SessionStore;
  search: HybridSearch;
  knowledge: KnowledgeGraph;
}

export function createMindTools(deps: MindToolDeps): ToolDefinition[] {
  return [
    {
      name: 'get_identity',
      description: 'Get the agent identity (who am I, what is my role)',
      parameters: {},
      execute: async () => {
        return deps.identity.toContext();
      },
    },
    {
      name: 'get_awareness',
      description: 'Get current awareness state (active tasks, recent actions, pending items, flags)',
      parameters: {},
      execute: async () => {
        return deps.awareness.toContext();
      },
    },
    {
      name: 'search_memory',
      description: 'Search through memory for relevant past experiences and knowledge',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for' },
          profile: {
            type: 'string',
            enum: ['balanced', 'recent', 'important', 'connected'],
            description: 'Scoring profile to use',
          },
          limit: { type: 'number', description: 'Max results to return' },
        },
        required: ['query'],
      },
      execute: async (args) => {
        const results = await deps.search.search(
          args.query as string,
          {
            limit: (args.limit as number) ?? 10,
            profile: (args.profile as 'balanced') ?? 'balanced',
          }
        );
        if (results.length === 0) return 'No relevant memories found.';
        return results.map((r, i) =>
          `[${i + 1}] (score: ${r.finalScore.toFixed(3)}, type: ${r.frame.frame_type}, importance: ${r.frame.importance})\n${r.frame.content}`
        ).join('\n\n');
      },
    },
    {
      name: 'save_memory',
      description: 'Save a new memory (observation, insight, or fact) to the current session',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The memory content to save' },
          importance: {
            type: 'string',
            enum: ['critical', 'important', 'normal', 'temporary'],
            description: 'How important is this memory',
          },
        },
        required: ['content'],
      },
      execute: async (args) => {
        const active = deps.sessions.getActive();
        let gopId: string;
        if (active.length === 0) {
          const session = deps.sessions.create();
          gopId = session.gop_id;
        } else {
          gopId = active[0].gop_id;
        }
        const latestI = deps.frames.getLatestIFrame(gopId);
        const importance = (args.importance as string) ?? 'normal';
        if (latestI) {
          deps.frames.createPFrame(gopId, args.content as string, latestI.id, importance as any);
        } else {
          deps.frames.createIFrame(gopId, args.content as string, importance as any);
        }
        return `Memory saved (importance: ${importance}).`;
      },
    },
    {
      name: 'query_knowledge',
      description: 'Query the knowledge graph for entities and their relationships',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Entity name or type to search for' },
          type: { type: 'string', description: 'Filter by entity type (e.g., person, project)' },
        },
        required: ['query'],
      },
      execute: async (args) => {
        const query = args.query as string;
        const entityType = args.type as string | undefined;

        let entities;
        if (entityType) {
          entities = deps.knowledge.getEntitiesByType(entityType);
          entities = entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
        } else {
          entities = deps.knowledge.searchEntities(query);
        }

        if (entities.length === 0) return `No entities found matching "${query}".`;

        const results: string[] = [];
        for (const entity of entities.slice(0, 10)) {
          const rels = deps.knowledge.getRelationsFrom(entity.id);
          const relStr = rels.length > 0
            ? rels.map(r => {
                const target = deps.knowledge.getEntity(r.target_id);
                return `  → ${r.relation_type} → ${target?.name ?? 'unknown'} (confidence: ${r.confidence})`;
              }).join('\n')
            : '  (no outgoing relations)';
          results.push(`${entity.entity_type}: ${entity.name}\n${relStr}`);
        }
        return results.join('\n\n');
      },
    },
    {
      name: 'add_task',
      description: 'Add a task to the awareness layer for tracking',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Task description' },
          priority: { type: 'number', description: 'Priority (0-10, higher = more important)' },
        },
        required: ['content'],
      },
      execute: async (args) => {
        const item = deps.awareness.add('task', args.content as string, (args.priority as number) ?? 5);
        return `Task added: "${item.content}" (priority: ${item.priority})`;
      },
    },
  ];
}
