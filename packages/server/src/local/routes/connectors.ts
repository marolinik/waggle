import type { FastifyInstance } from 'fastify';
import type { ConnectorDefinition, ConnectorHealth } from '@waggle/shared';

// Built-in connector definitions — the proof-of-concept set
const BUILTIN_CONNECTORS: Omit<ConnectorDefinition, 'status'>[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access repositories, issues, and pull requests',
    service: 'github.com',
    authType: 'bearer',
    capabilities: ['read', 'write'],
    substrate: 'waggle',
    tools: ['github_repos', 'github_issues'],
  },
];

export async function connectorRoutes(fastify: FastifyInstance) {
  // GET /api/connectors — list all connectors with status
  fastify.get('/api/connectors', async () => {
    const connectors: ConnectorDefinition[] = BUILTIN_CONNECTORS.map(def => {
      const cred = fastify.vault?.getConnectorCredential(def.id);
      let status: ConnectorDefinition['status'] = 'disconnected';
      if (cred) {
        status = cred.isExpired ? 'expired' : 'connected';
      }
      return { ...def, status };
    });
    return { connectors };
  });

  // GET /api/connectors/:id/health — check connector health
  fastify.get('/api/connectors/:id/health', async (request, reply) => {
    const { id } = request.params as { id: string };
    const def = BUILTIN_CONNECTORS.find(c => c.id === id);
    if (!def) return reply.code(404).send({ error: 'Connector not found' });

    const cred = fastify.vault?.getConnectorCredential(id);
    const health: ConnectorHealth = {
      id,
      name: def.name,
      status: cred ? (cred.isExpired ? 'expired' : 'connected') : 'disconnected',
      lastChecked: new Date().toISOString(),
      tokenExpiresAt: cred?.expiresAt,
    };

    // If connected, try a lightweight health check
    if (cred && !cred.isExpired && id === 'github') {
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${cred.value}`, 'User-Agent': 'Waggle/1.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          health.status = 'error';
          health.error = `GitHub API returned ${res.status}`;
        }
      } catch (err: any) {
        health.status = 'error';
        health.error = err.message;
      }
    }

    return health;
  });

  // POST /api/connectors/:id/connect — store credentials in vault
  fastify.post('/api/connectors/:id/connect', async (request, reply) => {
    const { id } = request.params as { id: string };
    const def = BUILTIN_CONNECTORS.find(c => c.id === id);
    if (!def) return reply.code(404).send({ error: 'Connector not found' });

    const body = request.body as {
      token?: string;
      apiKey?: string;
      refreshToken?: string;
      expiresAt?: string;
      scopes?: string[];
    };

    const value = body.token ?? body.apiKey;
    if (!value) return reply.code(400).send({ error: 'token or apiKey required' });

    if (!fastify.vault) return reply.code(503).send({ error: 'Vault not available' });

    fastify.vault.setConnectorCredential(id, {
      type: def.authType,
      value,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
      scopes: body.scopes,
    });

    return { connected: true, connectorId: id };
  });

  // POST /api/connectors/:id/disconnect — remove credentials from vault
  fastify.post('/api/connectors/:id/disconnect', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!fastify.vault) return reply.code(503).send({ error: 'Vault not available' });

    const deleted = fastify.vault.delete(`connector:${id}`);
    return { disconnected: deleted, connectorId: id };
  });
}
