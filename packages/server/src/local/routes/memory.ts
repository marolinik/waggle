import type { FastifyPluginAsync } from 'fastify';
import type { SearchScope } from '@waggle/core';
import { FrameStore, SessionStore } from '@waggle/core';

/** Normalize SQLite snake_case MemoryFrame fields to camelCase UI Frame shape. */
function normalizeFrame(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    id: raw.id,
    content: raw.content,
    source: raw.source ?? 'personal',
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

  // GET /api/memory/search?q=query&scope=all&workspace=wsId
  server.get<{
    Querystring: { q?: string; scope?: string; limit?: string; workspace?: string };
  }>('/api/memory/search', async (request, reply) => {
    const { q, scope, limit, workspace } = request.query;
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
    const rawResults = server.multiMind.search(q, searchScope, maxResults);
    const results = rawResults.map(r => normalizeFrame(r as unknown as Record<string, unknown>));

    return { results, count: results.length };
  });

  // GET /api/memory/frames?workspace=wsId&limit=50
  // Returns recent frames without requiring a search query — used by Memory tab initial load.
  server.get<{
    Querystring: { workspace?: string; limit?: string };
  }>('/api/memory/frames', async (request, reply) => {
    const { workspace, limit } = request.query;
    const maxResults = limit ? parseInt(limit, 10) : 50;

    const raw: Array<Record<string, unknown>> = [];

    // Personal mind frames
    const personalStore = server.multiMind.getFrameStore('personal');
    if (personalStore) {
      const pFrames = personalStore.getRecent(maxResults);
      raw.push(...pFrames.map(f => ({ ...(f as unknown as Record<string, unknown>), source: 'personal' })));
    }

    // Workspace mind frames (use cached MindDB directly — no switchWorkspace needed)
    if (workspace) {
      const wsDb = server.agentState.getWorkspaceMindDb(workspace);
      if (wsDb) {
        const wsStore = new FrameStore(wsDb);
        const wFrames = wsStore.getRecent(maxResults);
        raw.push(...wFrames.map(f => ({ ...(f as unknown as Record<string, unknown>), source: 'workspace' })));
      }
    }

    // Sort by created_at descending and limit
    raw.sort((a, b) =>
      String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
    );

    const results = raw.slice(0, maxResults).map(normalizeFrame);
    return { results, count: results.length };
  });

  // W5.9: POST /api/memory/frames — direct memory write API
  // For bulk loading, pipeline output, testing. Bypasses agent loop.
  server.post<{
    Body: {
      content: string;
      workspace?: string;
      importance?: string;
      source?: string;
    };
  }>('/api/memory/frames', async (request, reply) => {
    const { content, workspace, importance, source } = request.body ?? {};
    if (!content) {
      return reply.status(400).send({ error: 'content is required' });
    }

    const imp = importance ?? 'normal';
    const src = source ?? 'import';

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

    return { saved: true, frameId: frame.id, mind: mindLabel, importance: imp, source: src };
  });
};
