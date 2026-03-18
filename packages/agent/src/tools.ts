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

/** Workspace-specific layers for dual-mind routing */
interface WorkspaceLayers {
  db: MindDB;
  frames: FrameStore;
  sessions: SessionStore;
  search: HybridSearch;
  knowledge: KnowledgeGraph;
  cognify: CognifyPipeline;
}

/** Tracks tool utilization across the current session */
export interface ToolUtilizationTracker {
  /** Record that a tool was used */
  recordUsage(toolName: string): void;
  /** Get the set of unique tools used this session */
  getUsedTools(): Set<string>;
  /** Get the total number of available tools */
  totalAvailable: number;
  /** Get utilization ratio (uniqueUsed / totalAvailable) */
  getUtilization(): number;
}

/** Create a ToolUtilizationTracker instance */
export function createToolUtilizationTracker(totalAvailable: number): ToolUtilizationTracker {
  const usedTools = new Set<string>();
  return {
    recordUsage(toolName: string) {
      usedTools.add(toolName);
    },
    getUsedTools() {
      return new Set(usedTools);
    },
    totalAvailable,
    getUtilization() {
      if (totalAvailable === 0) return 0;
      return usedTools.size / totalAvailable;
    },
  };
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
  /** Dynamic accessor for workspace layers — checked at call time */
  getWorkspaceLayers?: () => WorkspaceLayers | null;
  /** Optional tool utilization tracker for session-level stats */
  toolUtilizationTracker?: ToolUtilizationTracker;
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
      description: 'Get current awareness state (active tasks, recent actions, pending items, flags, tool utilization)',
      parameters: {},
      execute: async () => {
        let context = deps.awareness.toContext();

        // Append utilization stats if tracker is available
        if (deps.toolUtilizationTracker) {
          const tracker = deps.toolUtilizationTracker;
          const used = tracker.getUsedTools();
          const utilization = tracker.getUtilization();
          context += `\n\n## Tool Utilization\n`;
          context += `- Unique tools used this session: ${used.size}\n`;
          context += `- Total available tools: ${tracker.totalAvailable}\n`;
          context += `- Utilization: ${(utilization * 100).toFixed(1)}%\n`;
          if (utilization < 0.1) {
            context += `- Note: Low utilization — consider using more of your available tools (skills, workflows, sub-agents) for richer results.\n`;
          }
        }

        return context;
      },
    },
    {
      name: 'search_memory',
      description: 'Search through memory for relevant past experiences and knowledge. Searches both personal and workspace memory when a workspace is active.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for' },
          profile: {
            type: 'string',
            enum: ['balanced', 'recent', 'important', 'connected'],
            description: 'Scoring profile to use',
          },
          scope: {
            type: 'string',
            enum: ['all', 'personal', 'workspace'],
            description: 'Which mind to search (default: all)',
          },
          limit: { type: 'number', description: 'Max results to return' },
        },
        required: ['query'],
      },
      execute: async (args) => {
        const limit = (args.limit as number) ?? 10;
        const scope = (args.scope as string) ?? 'all';
        const query = args.query as string;
        const profile = (args.profile as 'balanced') ?? 'balanced';
        const wsLayers = deps.getWorkspaceLayers?.();

        const sections: string[] = [];

        // Search workspace mind
        if (wsLayers && (scope === 'all' || scope === 'workspace')) {
          const wsResults = await wsLayers.search.search(query, { limit, profile });
          if (wsResults.length > 0) {
            sections.push('## Workspace Memory');
            sections.push(...wsResults.map((r, i) =>
              `[${i + 1}] (score: ${r.finalScore.toFixed(3)}, type: ${r.frame.frame_type}, importance: ${r.frame.importance})\n${r.frame.content}`
            ));
          }
        }

        // Search personal mind
        if (scope === 'all' || scope === 'personal') {
          const personalResults = await deps.search.search(query, { limit, profile });
          if (personalResults.length > 0) {
            const label = wsLayers ? '## Personal Memory' : '';
            if (label) sections.push(label);
            sections.push(...personalResults.map((r, i) =>
              `[${i + 1}] (score: ${r.finalScore.toFixed(3)}, type: ${r.frame.frame_type}, importance: ${r.frame.importance})\n${r.frame.content}`
            ));
          }
        }

        if (sections.length > 0) return sections.join('\n\n');

        // Fallback: LIKE scan on both minds
        const allFallback: string[] = [];
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        for (const [label, db] of [['personal', deps.db], ...(wsLayers ? [['workspace', wsLayers.db] as const] : [])] as const) {
          const raw = db.getDatabase();
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
          if (fallbackFrames.length > 0) {
            if (wsLayers) allFallback.push(`## ${label === 'workspace' ? 'Workspace' : 'Personal'} Memory`);
            allFallback.push(...fallbackFrames.map((f, i) =>
              `[${i + 1}] (type: ${f.frame_type}, importance: ${f.importance})\n${f.content}`
            ));
          }
        }

        if (allFallback.length === 0) return 'No relevant memories found.';
        return allFallback.join('\n\n');
      },
    },
    {
      name: 'save_memory',
      description: 'Save a new memory. Defaults to workspace mind when active. Use target="personal" for user preferences, communication style, cross-workspace knowledge.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The memory content to save' },
          importance: {
            type: 'string',
            enum: ['critical', 'important', 'normal', 'temporary'],
            description: 'How important is this memory',
          },
          target: {
            type: 'string',
            enum: ['workspace', 'personal'],
            description: 'Which mind to save to. Workspace (default): project context, decisions, tasks. Personal: preferences, style, cross-workspace knowledge.',
          },
        },
        required: ['content'],
      },
      execute: async (args) => {
        const importance = (args.importance as string) ?? 'normal';
        const content = args.content as string;
        const target = (args.target as string) ?? 'workspace';
        const wsLayers = deps.getWorkspaceLayers?.();

        // Determine which layers to use
        const useWorkspace = target === 'workspace' && wsLayers;
        const targetFrames = useWorkspace ? wsLayers.frames : deps.frames;
        const targetSessions = useWorkspace ? wsLayers.sessions : deps.sessions;
        const targetCognify = useWorkspace ? wsLayers.cognify : deps.cognify;
        const mindLabel = useWorkspace ? 'workspace' : 'personal';

        // Use cognify pipeline if available (extracts entities + indexes for search)
        if (targetCognify) {
          const result = await targetCognify.cognify(content, importance as any);
          return `Memory saved to ${mindLabel} mind (importance: ${importance}, entities: ${result.entitiesExtracted}, relations: ${result.relationsCreated}).`;
        }

        // Fallback: raw frame creation (no entity extraction or vector indexing)
        const active = targetSessions.getActive();
        let gopId: string;
        if (active.length === 0) {
          const session = targetSessions.create();
          gopId = session.gop_id;
        } else {
          gopId = active[0].gop_id;
        }
        const latestI = targetFrames.getLatestIFrame(gopId);
        if (latestI) {
          targetFrames.createPFrame(gopId, content, latestI.id, importance as any);
        } else {
          targetFrames.createIFrame(gopId, content, importance as any);
        }
        return `Memory saved to ${mindLabel} mind (importance: ${importance}).`;
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
