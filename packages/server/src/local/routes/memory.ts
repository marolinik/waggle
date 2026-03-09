import type { FastifyPluginAsync } from 'fastify';
import type { SearchScope } from '@waggle/core';

export const memoryRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/memory/search?q=query&scope=all
  server.get<{
    Querystring: { q?: string; scope?: string; limit?: string };
  }>('/api/memory/search', async (request, reply) => {
    const { q, scope, limit } = request.query;
    if (!q) {
      return reply.status(400).send({ error: 'q (query) parameter is required' });
    }

    const searchScope = (scope === 'personal' || scope === 'workspace' || scope === 'all')
      ? scope as SearchScope
      : 'all';

    const maxResults = limit ? parseInt(limit, 10) : 20;
    const results = server.multiMind.search(q, searchScope, maxResults);

    return { results, count: results.length };
  });
};
