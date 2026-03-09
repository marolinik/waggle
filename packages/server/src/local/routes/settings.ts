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
};
