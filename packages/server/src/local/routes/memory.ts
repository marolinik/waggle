import type { FastifyPluginAsync } from 'fastify';
import type { SearchScope, Importance } from '@waggle/core';
import { FrameStore, SessionStore, KnowledgeGraph } from '@waggle/core';
import { extractEntities } from '@waggle/agent';

/** Normalize SQLite snake_case MemoryFrame fields to camelCase UI Frame shape. */
function normalizeFrame(raw: Record<string, unknown>): Record<string, unknown> {
  // F24: Determine source_mind. For search results from MultiMind, `_mind` is set
  // explicitly. For MultiMindSearchResult, the `source` field is 'personal' | 'workspace'
  // which would overwrite the frame's provenance source. We detect this and split correctly.
  const mindSource = raw._mind as string | undefined;
  const rawSource = raw.source as string | undefined;
  // If source is 'personal' or 'workspace', it's the MultiMindSearchResult mind label,
  // not the frame's provenance source. Use it for source_mind, fall back to DB provenance.
  const isMindLabel = rawSource === 'personal' || rawSource === 'workspace';
  const sourceMind = mindSource ?? (isMindLabel ? rawSource : 'personal');
  const provenance = isMindLabel ? (raw._provenance_source as string ?? 'user_stated') : (rawSource ?? 'user_stated');

  return {
    id: raw.id,
    content: raw.content,
    // F7: Preserve provenance source from DB
    source: provenance,
    // F24: Which mind this frame came from — UI can show badge/icon
    source_mind: sourceMind,
    // Legacy alias for backward compat
    mind: sourceMind,
    frameType: raw.frame_type ?? raw.frameType ?? 'I',
    importance: raw.importance ?? 'normal',
    timestamp: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    score: raw.score,
    gop: raw.gop_id ?? raw.gop,
    accessCount: raw.access_count,
    // I3: Team attribution (present for synced frames)
    ...(raw.author_id || raw.authorId ? { authorId: raw.author_id ?? raw.authorId } : {}),
    ...(raw.author_name || raw.authorName ? { authorName: raw.author_name ?? raw.authorName } : {}),
  };
}

export const memoryRoutes: FastifyPluginAsync = async (server) => {
  /**
   * Ensure multiMind has the correct workspace mind loaded before searching.
   * Uses the server's workspace mind cache to avoid closing/reopening DBs.
   */
  function ensureWorkspaceMind(workspaceId: string): void {
    const wsDb = server.agentState.getWorkspaceMindDb(workspaceId);
    if (!wsDb) return;
    // Use setWorkspace (not switchWorkspace) to avoid opening duplicate connections.
    // The cache owns DB lifecycle — multiMind just borrows the reference.
    if (server.multiMind.workspace !== wsDb) {
      server.multiMind.setWorkspace(wsDb);
    }
  }

  // GET /api/memory/search?q=query&scope=all&workspace=wsId&since=ISO&until=ISO
  server.get<{
    Querystring: { q?: string; scope?: string; limit?: string; workspace?: string; since?: string; until?: string };
  }>('/api/memory/search', async (request, reply) => {
    const { q, scope, limit, workspace, since, until } = request.query;
    if (!q) {
      return reply.status(400).send({ error: 'q (query) parameter is required' });
    }

    const searchScope = (scope === 'personal' || scope === 'workspace' || scope === 'all')
      ? scope as SearchScope
      : 'all';

    // Ensure workspace mind is loaded for workspace/all scope searches
    if (workspace && (searchScope === 'workspace' || searchScope === 'all')) {
      ensureWorkspaceMind(workspace);
    }

    const maxResults = limit ? parseInt(limit, 10) : 20;
    let rawResults = server.multiMind.search(q, searchScope, maxResults);

    // F20: Temporal filtering — filter by since/until ISO date strings
    if (since || until) {
      rawResults = rawResults.filter(r => {
        const ts = r.created_at;
        if (!ts) return true;
        if (since && ts < since) return false;
        if (until && ts > until) return false;
        return true;
      });
    }

    // F24: MultiMindSearchResult.source is the mind label ('personal'/'workspace'),
    // which overwrites the frame's original provenance source. Preserve both.
    const results = rawResults.map(r => {
      const obj = r as unknown as Record<string, unknown>;
      // The frame's DB source column was overwritten by MultiMind search.
      // Stash it so normalizeFrame can recover both values.
      // We can detect: if source is 'personal'/'workspace', it's the mind label.
      // The original frame source can be recovered from the DB if needed, but
      // for the common case we mark _mind from the MultiMindSearchResult.source.
      if (obj.source === 'personal' || obj.source === 'workspace') {
        obj._mind = obj.source;
        // D7: Recover original provenance from the frame's DB row if available.
        // The HybridSearch result includes the full frame — check for _original_source
        // or fall back to the frame object's nested source field.
        const frameObj = (r as any).frame;
        const dbSource = frameObj?.source;
        if (dbSource && dbSource !== 'personal' && dbSource !== 'workspace') {
          obj._provenance_source = dbSource;
        }
      }
      return normalizeFrame(obj);
    });

    return { results, count: results.length };
  });

  // GET /api/memory/frames?workspace=wsId&limit=50&since=ISO&until=ISO
  // Returns recent frames without requiring a search query — used by Memory tab initial load.
  server.get<{
    Querystring: { workspace?: string; limit?: string; since?: string; until?: string };
  }>('/api/memory/frames', async (request, reply) => {
    const { workspace, limit, since, until } = request.query;
    const maxResults = limit ? parseInt(limit, 10) : 50;

    const raw: Array<Record<string, unknown>> = [];

    // Personal mind frames
    const personalStore = server.multiMind.getFrameStore('personal');
    if (personalStore) {
      const pFrames = personalStore.getRecent(maxResults);
      raw.push(...pFrames.map(f => ({ ...(f as unknown as Record<string, unknown>), _mind: 'personal' })));
    }

    // Workspace mind frames (use cached MindDB directly — no switchWorkspace needed)
    if (workspace) {
      const wsDb = server.agentState.getWorkspaceMindDb(workspace);
      if (wsDb) {
        const wsStore = new FrameStore(wsDb);
        const wFrames = wsStore.getRecent(maxResults);
        raw.push(...wFrames.map(f => ({ ...(f as unknown as Record<string, unknown>), _mind: 'workspace' })));
      }
    }

    // Sort by created_at descending and limit
    raw.sort((a, b) =>
      String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
    );

    // F20: Temporal filtering — filter by since/until ISO date strings
    let filtered = raw;
    if (since || until) {
      filtered = raw.filter(r => {
        const ts = String(r.created_at ?? '');
        if (!ts) return true;
        if (since && ts < since) return false;
        if (until && ts > until) return false;
        return true;
      });
    }

    const results = filtered.slice(0, maxResults).map(normalizeFrame);
    return { results, count: results.length };
  });

  // W5.9: POST /api/memory/frames — direct memory write API
  // For bulk loading, pipeline output, testing. Bypasses agent loop.
  // F13: Optional entity extraction via ?extract=true (default: true)
  server.post<{
    Body: {
      content: string;
      workspace?: string;
      importance?: string;
      source?: string;
    };
    Querystring: {
      extract?: string;
    };
  }>('/api/memory/frames', async (request, reply) => {
    const { content, workspace, importance, source } = request.body ?? {};
    if (!content) {
      return reply.status(400).send({ error: 'content is required' });
    }

    const imp = (importance ?? 'normal') as Importance;
    // D6: Validate source to prevent raw SQLite CHECK constraint errors
    const VALID_SOURCES = ['user_stated', 'tool_verified', 'agent_inferred', 'import', 'system'];
    const src = source ?? 'import';
    if (!VALID_SOURCES.includes(src)) {
      return reply.status(400).send({
        error: `Invalid source "${src}". Valid values: ${VALID_SOURCES.join(', ')}`,
      });
    }

    // F13: determine whether to run entity extraction (default: true)
    const extractParam = (request.query as any)?.extract;
    const shouldExtract = extractParam !== 'false' && extractParam !== '0';

    // Determine target mind
    let targetDb;
    let mindLabel: string;
    if (workspace) {
      targetDb = server.agentState.getWorkspaceMindDb(workspace);
      mindLabel = 'workspace';
    }
    if (!targetDb) {
      targetDb = server.multiMind.personal;
      mindLabel = 'personal';
    }

    const frames = new FrameStore(targetDb);
    const sessions = new SessionStore(targetDb);

    // Get or create active session
    const active = sessions.getActive();
    let gopId: string;
    if (active.length === 0) {
      const session = sessions.create();
      gopId = session.gop_id;
    } else {
      gopId = active[0].gop_id;
    }

    // Create frame
    const latestI = frames.getLatestIFrame(gopId);
    let frame;
    if (latestI) {
      frame = frames.createPFrame(gopId, content, latestI.id, imp as any, src as any);
    } else {
      frame = frames.createIFrame(gopId, content, imp as any, src as any);
    }

    // F13: Run entity extraction and KG enrichment after storing the frame
    let extraction: { entitiesExtracted: number; relationsCreated: number } | undefined;
    if (shouldExtract) {
      try {
        const extracted = extractEntities(content);
        if (extracted.length > 0) {
          const knowledge = new KnowledgeGraph(targetDb);
          const entityIds: number[] = [];

          // Upsert entities: skip if same type+name already exists
          for (const e of extracted) {
            const existing = knowledge.getEntitiesByType(e.type)
              .find(ent => ent.name.toLowerCase() === e.name.toLowerCase());
            if (existing) {
              entityIds.push(existing.id);
            } else {
              const created = knowledge.createEntity(e.type, e.name, {
                confidence: e.confidence,
                source: 'bulk-import',
              });
              entityIds.push(created.id);
            }
          }

          // Create co-occurrence relations between entities found in same text
          let relCount = 0;
          for (let i = 0; i < entityIds.length; i++) {
            for (let j = i + 1; j < entityIds.length; j++) {
              const existingRels = knowledge.getRelationsFrom(entityIds[i], 'co_occurs_with');
              const alreadyExists = existingRels.some(r => r.target_id === entityIds[j]);
              if (!alreadyExists) {
                knowledge.createRelation(entityIds[i], entityIds[j], 'co_occurs_with', 0.8, {
                  source: 'bulk-import',
                });
                relCount++;
              }
            }
          }

          extraction = {
            entitiesExtracted: entityIds.length,
            relationsCreated: relCount,
          };
        }
      } catch {
        // Entity extraction failure is non-blocking — frame is already saved
      }
    }

    return {
      saved: true,
      frameId: frame.id,
      mind: mindLabel,
      importance: imp,
      source: src,
      ...(extraction ? { extraction } : {}),
    };
  });

  // F1: GET /api/memory/stats — dedicated memory statistics endpoint
  server.get<{
    Querystring: { workspace?: string };
  }>('/api/memory/stats', async (request) => {
    const workspaceId = request.query.workspace;
    const personalDb = server.multiMind.personal;
    const personalFrames = new FrameStore(personalDb);
    const personalCount = personalFrames.list({ limit: 100000 }).length;

    let workspaceCount = 0;
    let workspaceEntities = 0;
    let workspaceRelations = 0;

    if (workspaceId) {
      const wsDb = server.agentState.getWorkspaceMindDb(workspaceId);
      if (wsDb) {
        const wsFrames = new FrameStore(wsDb);
        workspaceCount = wsFrames.list({ limit: 100000 }).length;
        const wsKg = new KnowledgeGraph(wsDb);
        const entities = wsKg.getEntitiesByType('');
        workspaceEntities = entities.length;
        // Count relations from all entities
        for (const e of entities) {
          workspaceRelations += wsKg.getRelationsFrom(e.id).length;
        }
      }
    }

    const personalKg = new KnowledgeGraph(personalDb);
    const personalEntities = personalKg.getEntitiesByType('');
    let personalRelations = 0;
    for (const e of personalEntities) {
      personalRelations += personalKg.getRelationsFrom(e.id).length;
    }

    return {
      personal: {
        frameCount: personalCount,
        entityCount: personalEntities.length,
        relationCount: personalRelations,
      },
      workspace: workspaceId ? {
        frameCount: workspaceCount,
        entityCount: workspaceEntities,
        relationCount: workspaceRelations,
      } : null,
      total: {
        frameCount: personalCount + workspaceCount,
        entityCount: personalEntities.length + workspaceEntities,
        relationCount: personalRelations + workspaceRelations,
      },
    };
  });
};
