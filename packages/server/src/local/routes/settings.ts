import type { FastifyPluginAsync } from 'fastify';
import { WaggleConfig } from '@waggle/core';

export const settingsRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/settings — read config (keys from vault, metadata from vault+config)
  server.get('/api/settings', async () => {
    const config = new WaggleConfig(server.localConfig.dataDir);

    // Build providers response from vault (encrypted) with config fallback
    const providers: Record<string, { apiKey: string; models: string[]; baseUrl?: string }> = {};

    if (server.vault) {
      const vaultEntries = server.vault.list();
      for (const entry of vaultEntries) {
        const full = server.vault.get(entry.name);
        if (full) {
          providers[entry.name] = {
            apiKey: full.value,
            models: (full.metadata?.models as string[]) ?? [],
            baseUrl: full.metadata?.baseUrl as string | undefined,
          };
        }
      }
    }

    // Fallback: merge any config.json providers not in vault (backward compat)
    const configProviders = config.getProviders();
    for (const [name, entry] of Object.entries(configProviders)) {
      if (!providers[name]) {
        providers[name] = entry;
      }
    }

    return {
      defaultModel: config.getDefaultModel(),
      providers,
      mindPath: config.getMindPath(),
      dataDir: server.localConfig.dataDir,
      litellmUrl: server.localConfig.litellmUrl,
    };
  });

  // PUT /api/settings — update config (keys to vault, non-secret fields to config.json)
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
        const { apiKey, models, baseUrl } = entry as { apiKey?: string; models?: string[]; baseUrl?: string };

        // Save secret to vault (encrypted)
        if (apiKey && server.vault) {
          server.vault.set(name, apiKey, { models, baseUrl });
        }

        // Also keep in config.json for backward compat (non-secret fields)
        config.setProvider(name, entry as { apiKey: string; models: string[] });
      }
    }

    config.save();

    // Return providers from vault (same as GET)
    const responseProviders: Record<string, { apiKey: string; models: string[]; baseUrl?: string }> = {};
    if (server.vault) {
      const vaultEntries = server.vault.list();
      for (const vEntry of vaultEntries) {
        const full = server.vault.get(vEntry.name);
        if (full) {
          responseProviders[vEntry.name] = {
            apiKey: full.value,
            models: (full.metadata?.models as string[]) ?? [],
            baseUrl: full.metadata?.baseUrl as string | undefined,
          };
        }
      }
    }
    // Fallback for any providers not in vault
    const configProviders = config.getProviders();
    for (const [name, entry] of Object.entries(configProviders)) {
      if (!responseProviders[name]) {
        responseProviders[name] = entry;
      }
    }

    return {
      defaultModel: config.getDefaultModel(),
      providers: responseProviders,
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
