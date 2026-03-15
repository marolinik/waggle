/**
 * Team routes for the local server.
 *
 * These routes handle team server connection from the desktop app:
 * - POST /api/team/connect — connect to team server (validate token, store config)
 * - POST /api/team/disconnect — disconnect from team server
 * - GET /api/team/status — get current team connection status
 */

import type { FastifyInstance } from 'fastify';
import { WaggleConfig } from '@waggle/core';

export async function teamRoutes(fastify: FastifyInstance) {
  const dataDir = fastify.localConfig.dataDir;

  /**
   * POST /api/team/connect
   * Connect to a team server by validating the token against the server's health endpoint.
   */
  fastify.post('/api/team/connect', async (request, reply) => {
    const { serverUrl, token } = request.body as { serverUrl: string; token: string };

    if (!serverUrl || !token) {
      return reply.code(400).send({ error: 'serverUrl and token are required' });
    }

    // Validate by calling the team server health endpoint
    try {
      const healthUrl = `${serverUrl.replace(/\/$/, '')}/health`;
      const healthRes = await fetch(healthUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!healthRes.ok) {
        return reply.code(502).send({ error: `Team server returned ${healthRes.status}` });
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return reply.code(504).send({ error: 'Team server connection timed out' });
      }
      return reply.code(502).send({ error: `Cannot reach team server: ${err.message}` });
    }

    // Try to get user info from the team server
    let userId = 'unknown';
    let displayName = 'Unknown User';
    try {
      const teamsRes = await fetch(`${serverUrl.replace(/\/$/, '')}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (teamsRes.ok) {
        // Token is valid and user has access — extract from response is not possible without user endpoint
        // For now, we know the connection works
        userId = 'authenticated';
        displayName = 'Team User';
      }
    } catch {
      // Non-critical — connection itself was validated by health check
    }

    // Store team server config
    const waggleConfig = new WaggleConfig(dataDir);
    waggleConfig.setTeamServer({
      url: serverUrl.replace(/\/$/, ''),
      token,
      userId,
      displayName,
    });
    waggleConfig.save();

    const connection = {
      serverUrl: serverUrl.replace(/\/$/, ''),
      token: '***', // Don't send token back
      userId,
      displayName,
    };

    return reply.code(200).send(connection);
  });

  /**
   * POST /api/team/disconnect
   * Disconnect from the team server.
   */
  fastify.post('/api/team/disconnect', async (_request, reply) => {
    const waggleConfig = new WaggleConfig(dataDir);
    waggleConfig.clearTeamServer();
    waggleConfig.save();

    return reply.code(200).send({ disconnected: true });
  });

  /**
   * GET /api/team/teams
   * List teams the connected user belongs to (proxied from team server).
   */
  fastify.get('/api/team/teams', async (_request, reply) => {
    const waggleConfig = new WaggleConfig(dataDir);
    const teamServer = waggleConfig.getTeamServer();

    if (!teamServer || !teamServer.token) {
      return reply.code(401).send({ error: 'Not connected to a team server' });
    }

    try {
      const teamsUrl = `${teamServer.url}/api/teams`;
      const res = await fetch(teamsUrl, {
        headers: { 'Authorization': `Bearer ${teamServer.token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return reply.code(res.status).send({ error: `Team server returned ${res.status}` });
      }

      const teams = await res.json();
      return reply.code(200).send(teams);
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return reply.code(504).send({ error: 'Team server request timed out' });
      }
      return reply.code(502).send({ error: `Cannot reach team server: ${err.message}` });
    }
  });

  /**
   * GET /api/team/presence?workspaceId=X
   * Get team presence data for a workspace (proxied from team server, or mock if unavailable).
   */
  fastify.get<{
    Querystring: { workspaceId?: string };
  }>('/api/team/presence', async (request, reply) => {
    const waggleConfig = new WaggleConfig(dataDir);
    const teamServer = waggleConfig.getTeamServer();

    if (!teamServer || !teamServer.token) {
      return reply.code(200).send({ members: [] });
    }

    // Try to fetch real presence from team server
    try {
      const presenceUrl = `${teamServer.url}/api/presence`;
      const res = await fetch(presenceUrl, {
        headers: { 'Authorization': `Bearer ${teamServer.token}` },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        // Emit presence update for WebSocket subscribers
        fastify.eventBus.emit('presence_update', data);
        return reply.code(200).send(data);
      }
    } catch {
      // Team server unavailable — return self as online (local-only fallback)
    }

    // Fallback: return current user as online
    const fallbackData = {
      members: [{
        userId: teamServer.userId ?? 'self',
        displayName: teamServer.displayName ?? 'You',
        status: 'online',
        lastActivity: new Date().toISOString(),
      }],
    };
    // Emit presence update for WebSocket subscribers
    fastify.eventBus.emit('presence_update', fallbackData);
    return reply.code(200).send(fallbackData);
  });

  /**
   * GET /api/team/status
   * Get current team connection status.
   */
  fastify.get('/api/team/status', async (_request, reply) => {
    const waggleConfig = new WaggleConfig(dataDir);
    const teamServer = waggleConfig.getTeamServer();

    if (!teamServer) {
      return reply.code(200).send({ connected: false });
    }

    return reply.code(200).send({
      connected: true,
      serverUrl: teamServer.url,
      userId: teamServer.userId ?? 'unknown',
      displayName: teamServer.displayName ?? 'Team User',
    });
  });

  /**
   * GET /api/team/activity?workspaceId=X&limit=N
   * Get recent team activity for a workspace.
   * Proxies to team server or returns empty when disconnected.
   */
  fastify.get<{
    Querystring: { workspaceId?: string; limit?: string };
  }>('/api/team/activity', async (request, reply) => {
    const waggleConfig = new WaggleConfig(dataDir);
    const teamServer = waggleConfig.getTeamServer();
    const limit = Math.min(parseInt(request.query.limit ?? '20', 10) || 20, 50);

    if (!teamServer || !teamServer.token) {
      return reply.code(200).send({ items: [] });
    }

    // Try to fetch activity from team server's entities API
    // (synced frames = memory additions, which are our primary activity source)
    try {
      const workspaceId = request.query.workspaceId;
      const entitiesUrl = `${teamServer.url}/api/entities?type=memory_frame&limit=${limit}`;
      const res = await fetch(entitiesUrl, {
        headers: { 'Authorization': `Bearer ${teamServer.token}` },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json() as { entities?: Array<{
          id: string;
          metadata?: { authorName?: string; authorId?: string; frameType?: string; content?: string };
          createdAt?: string;
        }> };

        const items = (data.entities ?? []).map((e) => ({
          id: e.id,
          type: 'memory' as const,
          authorName: e.metadata?.authorName ?? 'Unknown',
          authorId: e.metadata?.authorId,
          summary: e.metadata?.content
            ? (e.metadata.content.length > 120 ? e.metadata.content.slice(0, 120) + '...' : e.metadata.content)
            : `Added ${e.metadata?.frameType ?? 'frame'}`,
          timestamp: e.createdAt ?? new Date().toISOString(),
        }));

        return reply.code(200).send({ items });
      }
    } catch {
      // Team server unavailable — return empty
    }

    return reply.code(200).send({ items: [] });
  });
}
