import type { FastifyPluginAsync } from 'fastify';
import { WaggleConfig } from '@waggle/core';

export const settingsRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/settings — read config
  server.get('/api/settings', async () => {
    const config = new WaggleConfig(server.localConfig.dataDir);
    return {
      defaultModel: config.getDefaultModel(),
      providers: config.getProviders(),
      mindPath: config.getMindPath(),
      dataDir: server.localConfig.dataDir,
      litellmUrl: server.localConfig.litellmUrl,
    };
  });

  // PUT /api/settings — update config
  server.put<{
    Body: { defaultModel?: string; providers?: Record<string, unknown> };
  }>('/api/settings', async (request) => {
    const config = new WaggleConfig(server.localConfig.dataDir);
    const { defaultModel, providers } = request.body;

    if (defaultModel) {
      config.setDefaultModel(defaultModel);
    }

    if (providers && typeof providers === 'object') {
      for (const [name, entry] of Object.entries(providers)) {
        config.setProvider(name, entry as { apiKey: string; models: string[] });
      }
    }

    config.save();

    return {
      defaultModel: config.getDefaultModel(),
      providers: config.getProviders(),
      mindPath: config.getMindPath(),
    };
  });

  // POST /api/settings/test-key — test an API key by validating its format
  server.post<{
    Body: { provider: string; apiKey: string };
  }>('/api/settings/test-key', async (request, reply) => {
    const { provider, apiKey } = request.body ?? {};

    if (!provider || !apiKey) {
      return reply.status(400).send({ error: 'provider and apiKey are required' });
    }

    // Validate key format per provider
    const result = validateApiKeyFormat(provider, apiKey);
    return result;
  });
};

/**
 * Validate API key format without making real API calls.
 * In production, actual validation would go through LiteLLM.
 */
function validateApiKeyFormat(provider: string, apiKey: string): { valid: boolean; error?: string } {
  switch (provider.toLowerCase()) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI keys must start with "sk-"' };
      }
      if (apiKey.length < 20) {
        return { valid: false, error: 'API key is too short' };
      }
      return { valid: true };

    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Anthropic keys must start with "sk-ant-"' };
      }
      if (apiKey.length < 20) {
        return { valid: false, error: 'API key is too short' };
      }
      return { valid: true };

    case 'google':
    case 'gemini':
      if (apiKey.length < 10) {
        return { valid: false, error: 'API key is too short' };
      }
      return { valid: true };

    default:
      // For unknown providers, just check it's non-empty and reasonable length
      if (apiKey.length < 8) {
        return { valid: false, error: 'API key is too short' };
      }
      return { valid: true };
  }
}
