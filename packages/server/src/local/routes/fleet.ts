/**
 * Fleet routes — agent fleet status and controls for Mission Control.
 * Exposes workspace session state, pause/resume/kill controls.
 */

import type { FastifyInstance } from 'fastify';

export async function fleetRoutes(fastify: FastifyInstance) {
  // GET /api/fleet — list all active workspace sessions
  fastify.get('/api/fleet', async () => {
    const sessionManager = (fastify as any).sessionManager;
    if (!sessionManager) {
      return { sessions: [], count: 0 };
    }

    const sessions = sessionManager.getActive().map((s: any) => ({
      workspaceId: s.workspaceId,
      personaId: s.personaId,
      status: s.status,
      lastActivity: s.lastActivity,
      durationMs: Date.now() - s.lastActivity,
      toolCount: s.tools?.length ?? 0,
    }));

    return { sessions, count: sessions.length, maxSessions: 3 };
  });

  // POST /api/fleet/:workspaceId/pause — pause a workspace session
  fastify.post('/api/fleet/:workspaceId/pause', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const sessionManager = (fastify as any).sessionManager;
    if (!sessionManager) return reply.code(503).send({ error: 'Session manager not available' });

    const paused = sessionManager.pause(workspaceId);
    if (!paused) return reply.code(404).send({ error: 'Session not found or already paused' });
    return { paused: true, workspaceId };
  });

  // POST /api/fleet/:workspaceId/resume — resume a paused session
  fastify.post('/api/fleet/:workspaceId/resume', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const sessionManager = (fastify as any).sessionManager;
    if (!sessionManager) return reply.code(503).send({ error: 'Session manager not available' });

    const resumed = sessionManager.resume(workspaceId);
    if (!resumed) return reply.code(404).send({ error: 'Session not found or not paused' });
    return { resumed: true, workspaceId };
  });

  // POST /api/fleet/:workspaceId/kill — abort and close a session
  fastify.post('/api/fleet/:workspaceId/kill', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const sessionManager = (fastify as any).sessionManager;
    if (!sessionManager) return reply.code(503).send({ error: 'Session manager not available' });

    const killed = sessionManager.close(workspaceId);
    if (!killed) return reply.code(404).send({ error: 'Session not found' });
    return { killed: true, workspaceId };
  });
}
