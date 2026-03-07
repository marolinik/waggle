import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { loadConfig, type ServerConfig } from './config.js';
import { createDb, type Db } from './db/connection.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';
import { webhookRoutes } from './routes/webhooks.js';
import { teamRoutes } from './routes/teams.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: ServerConfig;
    db: Db;
  }
}

export async function buildServer(configOverrides?: Partial<ServerConfig>) {
  const config = { ...loadConfig(), ...configOverrides };

  const server = Fastify({ logger: true });

  server.decorate('config', config);

  const db = createDb(config.databaseUrl);
  server.decorate('db', db);

  await server.register(cors, { origin: config.corsOrigin });
  await server.register(websocket);
  await server.register(redisPlugin);
  await server.register(authPlugin);
  await server.register(webhookRoutes);
  await server.register(teamRoutes);

  // Health check
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}

// Start server if run directly
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isDirectRun) {
  const server = await buildServer();
  await server.listen({ port: server.config.port, host: server.config.host });
}
