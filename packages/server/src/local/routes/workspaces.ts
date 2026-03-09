import type { FastifyPluginAsync } from 'fastify';
import { assertSafeSegment } from './validate.js';

export const workspaceRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/workspaces — list all workspaces
  server.get('/api/workspaces', async () => {
    return server.workspaceManager.list();
  });

  // POST /api/workspaces — create workspace
  server.post<{
    Body: { name: string; group: string; icon?: string; model?: string };
  }>('/api/workspaces', async (request, reply) => {
    const { name, group, icon, model } = request.body;
    if (!name || !group) {
      return reply.status(400).send({ error: 'name and group are required' });
    }
    const ws = server.workspaceManager.create({ name, group, icon, model });
    return reply.status(201).send(ws);
  });

  // GET /api/workspaces/:id — get workspace by id
  server.get<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const ws = server.workspaceManager.get(request.params.id);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    return ws;
  });

  // PUT /api/workspaces/:id — update workspace
  server.put<{
    Params: { id: string };
    Body: { name?: string; group?: string; icon?: string; model?: string };
  }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const existing = server.workspaceManager.get(request.params.id);
    if (!existing) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    server.workspaceManager.update(request.params.id, request.body);
    return server.workspaceManager.get(request.params.id);
  });

  // DELETE /api/workspaces/:id — delete workspace
  server.delete<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const existing = server.workspaceManager.get(request.params.id);
    if (!existing) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    server.workspaceManager.delete(request.params.id);
    return reply.status(204).send();
  });
};
