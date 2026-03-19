import type { FastifyPluginAsync } from 'fastify';
import { listPersonas } from '@waggle/agent';

/**
 * Personas routes — expose agent persona catalog to the UI.
 * System prompts are intentionally omitted (large + sensitive).
 */
export const personaRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/personas — list all available personas (no system prompts)
  fastify.get('/api/personas', async () => {
    const personas = listPersonas().map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      workspaceAffinity: p.workspaceAffinity,
      suggestedCommands: p.suggestedCommands,
    }));
    return { personas };
  });
};
