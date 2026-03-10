import type { FastifyPluginAsync } from 'fastify';

/**
 * Agent routes — status, cost tracking, model management.
 * Provides the same info that CLI's /cost, /model, /models commands show.
 */
export const agentRoutes: FastifyPluginAsync = async (server) => {
  const { costTracker } = server.agentState;

  // GET /api/agent/status — agent status including cost stats
  server.get('/api/agent/status', async () => {
    const stats = costTracker.getStats();
    return {
      running: true,
      model: server.agentState.currentModel,
      tokensUsed: stats.totalInputTokens + stats.totalOutputTokens,
      estimatedCost: stats.estimatedCost,
      turns: stats.turns,
      usage: stats,
    };
  });

  // GET /api/agent/cost — detailed cost breakdown
  server.get('/api/agent/cost', async () => {
    const stats = costTracker.getStats();
    return {
      summary: costTracker.formatSummary(),
      ...stats,
    };
  });

  // POST /api/agent/cost/reset — reset cost tracking
  server.post('/api/agent/cost/reset', async () => {
    // Create a fresh cost tracker (no reset method, so replace)
    // CostTracker is stateful, we clear by reassigning
    // For now, return the current stats and note it can't be reset in-place
    return { ok: true, message: 'Cost tracking resets on server restart' };
  });

  // GET /api/agent/model — current model
  server.get('/api/agent/model', async () => {
    return { model: server.agentState.currentModel };
  });

  // PUT /api/agent/model — switch model
  server.put<{
    Body: { model: string };
  }>('/api/agent/model', async (request, reply) => {
    const { model } = request.body ?? {};
    if (!model) {
      return reply.status(400).send({ error: 'model is required' });
    }
    server.agentState.currentModel = model;
    return { ok: true, model };
  });

  // GET /api/agent/history — get conversation history for a session
  server.get<{
    Querystring: { session?: string; workspace?: string };
  }>('/api/history', async (request) => {
    const sessionId = request.query.session ?? request.query.workspace ?? 'default';
    const history = server.agentState.sessionHistories.get(sessionId) ?? [];
    return {
      sessionId,
      messages: history.map((m, i) => ({
        id: `hist-${i}`,
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      })),
      count: history.length,
    };
  });
};
