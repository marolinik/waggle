import type { FastifyPluginAsync } from 'fastify';

export const chatRoutes: FastifyPluginAsync = async (server) => {
  // POST /api/chat — stub chat endpoint (full implementation in Task 6)
  server.post<{
    Body: { message: string; workspace?: string };
  }>('/api/chat', async (request, reply) => {
    const { message, workspace } = request.body;
    if (!message) {
      return reply.status(400).send({ error: 'message is required' });
    }
    return {
      response: `[local-stub] Received: ${message}`,
      workspace: workspace ?? null,
      timestamp: new Date().toISOString(),
    };
  });
};
