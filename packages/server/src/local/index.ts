import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { MultiMind, WorkspaceManager } from '@waggle/core';
import { workspaceRoutes } from './routes/workspaces.js';
import { chatRoutes, type AgentRunner } from './routes/chat.js';
import { memoryRoutes } from './routes/memory.js';
import { settingsRoutes } from './routes/settings.js';
import { sessionRoutes } from './routes/sessions.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { litellmRoutes } from './routes/litellm.js';
import { ingestRoutes } from './routes/ingest.js';
import { EventEmitter } from 'node:events';

export interface LocalConfig {
  port: number;
  host: string;
  dataDir: string;       // ~/.waggle
  litellmUrl: string;    // http://localhost:4000
}

declare module 'fastify' {
  interface FastifyInstance {
    localConfig: LocalConfig;
    multiMind: MultiMind;
    workspaceManager: WorkspaceManager;
    eventBus: EventEmitter;
    agentRunner?: AgentRunner;
  }
}

export async function buildLocalServer(config: Partial<LocalConfig> = {}) {
  const fullConfig: LocalConfig = {
    port: parseInt(process.env.WAGGLE_PORT ?? '3333'),
    host: '127.0.0.1',
    dataDir: config.dataDir ?? process.env.WAGGLE_DATA_DIR ?? '',
    litellmUrl: config.litellmUrl ?? 'http://localhost:4000',
    ...config,
  };

  const server = Fastify({ logger: false });

  // Decorate with local config
  server.decorate('localConfig', fullConfig);

  // Event bus (replaces Redis pub/sub)
  const eventBus = new EventEmitter();
  server.decorate('eventBus', eventBus);

  // Workspace manager
  const wsManager = new WorkspaceManager(fullConfig.dataDir);
  server.decorate('workspaceManager', wsManager);

  // MultiMind — open personal mind, no workspace yet (selected via API)
  const personalPath = path.join(fullConfig.dataDir, 'personal.mind');
  const multiMind = new MultiMind(personalPath);
  server.decorate('multiMind', multiMind);

  // Plugins
  await server.register(cors, { origin: true });
  await server.register(websocket);

  // Routes
  await server.register(workspaceRoutes);
  await server.register(chatRoutes);
  await server.register(memoryRoutes);
  await server.register(settingsRoutes);
  await server.register(sessionRoutes);
  await server.register(knowledgeRoutes);
  await server.register(litellmRoutes);
  await server.register(ingestRoutes);

  // Health check
  server.get('/health', async () => ({
    status: 'ok',
    mode: 'local',
    timestamp: new Date().toISOString(),
  }));

  // Cleanup on close
  server.addHook('onClose', async () => {
    multiMind.close();
  });

  return server;
}
