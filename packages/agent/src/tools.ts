import type {
  MindDB,
  IdentityLayer,
  AwarenessLayer,
  FrameStore,
  SessionStore,
  HybridSearch,
  KnowledgeGraph,
} from '@waggle/core';
import type { CognifyPipeline } from './cognify.js';
import type { FeedbackHandler } from './feedback-handler.js';

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
  cognify?: CognifyPipeline;
  feedback?: FeedbackHandler;
}

export function createMindTools(deps: MindToolDeps): ToolDefinition[] {
  return [
    {
      name: 'get_identity',
      description: 'Get the agent identity (who am I, what is my role)',
      parameters: {},
      execute: async () => {
        if (!deps.identity.exists()) return 'No identity configured yet.';
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
        const limit = (args.limit as number) ?? 10;
        const results = await deps.search.search(
          args.query as string,
          {
            limit,
            profile: (args.profile as 'balanced') ?? 'balanced',
          }
        );
        if (results.length > 0) {
          return results.map((r, i) =>
            `[${i + 1}] (score: ${r.finalScore.toFixed(3)}, type: ${r.frame.frame_type}, importance: ${r.frame.importance})\n${r.frame.content}`
          ).join('\n\n');
        }
        // Fallback: if hybrid search found nothing, do a simple LIKE scan
        // This catches cases where FTS5 keyword matching is too strict
        const raw = deps.db.getDatabase();
        const query = args.query as string;
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let fallbackFrames: Array<{ id: number; content: string; frame_type: string; importance: string }>;
        if (keywords.length > 0) {
          const likeClauses = keywords.map(() => 'LOWER(content) LIKE ?').join(' OR ');
          const likeParams = keywords.map(k => `%${k}%`);
          fallbackFrames = raw.prepare(
            `SELECT id, content, frame_type, importance FROM memory_frames WHERE ${likeClauses} ORDER BY id DESC LIMIT ?`
          ).all(...likeParams, limit) as any[];
        } else {
          fallbackFrames = raw.prepare(
            'SELECT id, content, frame_type, importance FROM memory_frames ORDER BY id DESC LIMIT ?'
          ).all(limit) as any[];
        }
        if (fallbackFrames.length === 0) return 'No relevant memories found.';
        return fallbackFrames.map((f, i) =>
          `[${i + 1}] (type: ${f.frame_type}, importance: ${f.importance})\n${f.content}`
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
        const importance = (args.importance as string) ?? 'normal';
        const content = args.content as string;

        // Use cognify pipeline if available (extracts entities + indexes for search)
        if (deps.cognify) {
          const result = await deps.cognify.cognify(content, importance as any);
          return `Memory saved (importance: ${importance}, entities: ${result.entitiesExtracted}, relations: ${result.relationsCreated}).`;
        }

        // Fallback: raw frame creation (no entity extraction or vector indexing)
        const active = deps.sessions.getActive();
        let gopId: string;
        if (active.length === 0) {
          const session = deps.sessions.create();
          gopId = session.gop_id;
        } else {
          gopId = active[0].gop_id;
        }
        const latestI = deps.frames.getLatestIFrame(gopId);
        if (latestI) {
          deps.frames.createPFrame(gopId, content, latestI.id, importance as any);
        } else {
          deps.frames.createIFrame(gopId, content, importance as any);
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
    {
      name: 'correct_knowledge',
      description: 'Correct or invalidate a knowledge entity. Use entity_id from query_knowledge results.',
      parameters: {
        type: 'object',
        properties: {
          entity_id: { type: 'number', description: 'The entity ID to update' },
          action: {
            type: 'string',
            enum: ['correct', 'invalidate'],
            description: 'Whether to correct or invalidate the entity',
          },
          updates: {
            type: 'object',
            description: 'For correct: property updates to merge. For invalidate: { reason: "why it is wrong" }',
          },
        },
        required: ['entity_id', 'action'],
      },
      execute: async (args) => {
        if (!deps.feedback) {
          return 'Feedback handler not available. Cannot correct knowledge.';
        }

        const entityId = args.entity_id as number;
        const action = args.action as string;
        const updates = (args.updates as Record<string, unknown>) ?? {};

        if (action === 'correct') {
          deps.feedback.correctEntity(entityId, updates);
          return `Entity ${entityId} corrected with updates: ${JSON.stringify(updates)}`;
        } else if (action === 'invalidate') {
          const reason = (updates.reason as string) ?? 'No reason provided';
          deps.feedback.invalidateEntity(entityId, reason);
          return `Entity ${entityId} invalidated. Reason: ${reason}`;
        }

        return `Unknown action "${action}". Use "correct" or "invalidate".`;
      },
    },
  ];
}
