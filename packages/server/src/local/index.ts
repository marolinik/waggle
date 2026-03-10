import os from 'node:os';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { MultiMind, WorkspaceManager, createLiteLLMEmbedder } from '@waggle/core';
import {
  Orchestrator,
  createSystemTools,
  createPlanTools,
  createGitTools,
  ensureIdentity,
  loadSystemPrompt,
  loadSkills,
  HookRegistry,
  loadHooksFromConfig,
  CostTracker,
  type ToolDefinition,
  type LoadedSkill,
} from '@waggle/agent';
import { workspaceRoutes } from './routes/workspaces.js';
import { chatRoutes, type AgentRunner } from './routes/chat.js';
import { memoryRoutes } from './routes/memory.js';
import { settingsRoutes } from './routes/settings.js';
import { sessionRoutes } from './routes/sessions.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { litellmRoutes } from './routes/litellm.js';
import { ingestRoutes } from './routes/ingest.js';
import { mindRoutes } from './routes/mind.js';
import { agentRoutes } from './routes/agent.js';
import { skillRoutes } from './routes/skills.js';
import { approvalRoutes } from './routes/approval.js';
import { anthropicProxyRoutes } from './routes/anthropic-proxy.js';
import { EventEmitter } from 'node:events';

export interface LocalConfig {
  port: number;
  host: string;
  dataDir: string;       // ~/.waggle
  litellmUrl: string;    // http://localhost:4000
}

/** Pending approval request — resolved when user approves or denies. */
export interface PendingApproval {
  resolve: (approved: boolean) => void;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

/**
 * Shared agent state — initialized once at server startup,
 * accessible by all route modules for feature parity with CLI.
 */
export interface AgentState {
  orchestrator: Orchestrator;
  allTools: ToolDefinition[];
  hookRegistry: HookRegistry;
  costTracker: CostTracker;
  skills: LoadedSkill[];
  userSystemPrompt: string | null;
  sessionHistories: Map<string, Array<{ role: string; content: string }>>;
  currentModel: string;
  litellmApiKey: string;
  pendingApprovals: Map<string, PendingApproval>;
}

declare module 'fastify' {
  interface FastifyInstance {
    localConfig: LocalConfig;
    multiMind: MultiMind;
    workspaceManager: WorkspaceManager;
    eventBus: EventEmitter;
    agentRunner?: AgentRunner;
    agentState: AgentState;
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

  // ── Agent state (matches CLI initialization) ────────────────────────
  const litellmApiKey = process.env.LITELLM_API_KEY ?? process.env.LITELLM_MASTER_KEY ?? 'sk-waggle-dev';
  const litellmUrl = fullConfig.litellmUrl;

  // Embedder backed by LiteLLM (falls back to mock)
  const embedder = createLiteLLMEmbedder({
    litellmUrl,
    litellmApiKey,
    model: 'text-embedding',
    dimensions: 1024,
    fallbackToMock: true,
  });

  // Orchestrator — connects to personal .mind
  const orchestrator = new Orchestrator({
    db: multiMind.personal,
    embedder,
    mode: 'local',
    version: '0.4',
  });
  ensureIdentity(orchestrator.getIdentity());

  // Build all tools (same pattern as CLI)
  const mindTools = orchestrator.getTools();
  const systemTools = createSystemTools(os.homedir());
  const planTools = createPlanTools();
  const gitTools = createGitTools(os.homedir());
  const allTools = [...mindTools, ...systemTools, ...planTools, ...gitTools];

  // Load user customizations from ~/.waggle/
  const waggleHome = path.join(os.homedir(), '.waggle');
  const userSystemPrompt = loadSystemPrompt(waggleHome);
  const skills = loadSkills(waggleHome);

  // Hook registry with user-configured hooks
  const hookRegistry = new HookRegistry();
  await loadHooksFromConfig(path.join(waggleHome, 'hooks.json'), hookRegistry);

  // Cost tracker
  const costTracker = new CostTracker({});

  // Session histories (server-side, like CLI)
  const sessionHistories = new Map<string, Array<{ role: string; content: string }>>();

  // Default model
  const currentModel = 'claude-sonnet-4-6';

  // Pending approvals map for confirmation gates
  const pendingApprovals = new Map<string, PendingApproval>();

  // Decorate with shared agent state
  server.decorate('agentState', {
    orchestrator,
    allTools,
    hookRegistry,
    costTracker,
    skills,
    userSystemPrompt,
    sessionHistories,
    currentModel,
    litellmApiKey,
    pendingApprovals,
  });

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
  await server.register(mindRoutes);
  await server.register(agentRoutes);
  await server.register(skillRoutes);
  await server.register(approvalRoutes);
  await server.register(anthropicProxyRoutes);

  // WebSocket endpoint — event bus relay to frontend
  server.get('/ws', { websocket: true }, (socket) => {
    // Relay eventBus events to connected clients
    const onEvent = (event: string, data: unknown) => {
      try {
        socket.send(JSON.stringify({ event, data }));
      } catch {
        // Client disconnected
      }
    };

    // Forward approval events and agent events to the WebSocket client
    const handlers = ['approval_required', 'step', 'tool', 'done', 'error'] as const;
    for (const evt of handlers) {
      eventBus.on(evt, (data: unknown) => onEvent(evt, data));
    }

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; requestId?: string; reason?: string };
        if (msg.type === 'approve' && msg.requestId) {
          const pending = server.agentState.pendingApprovals.get(msg.requestId);
          if (pending) {
            server.agentState.pendingApprovals.delete(msg.requestId);
            pending.resolve(true);
          }
        } else if (msg.type === 'deny' && msg.requestId) {
          const pending = server.agentState.pendingApprovals.get(msg.requestId);
          if (pending) {
            server.agentState.pendingApprovals.delete(msg.requestId);
            pending.resolve(false);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      for (const evt of handlers) {
        eventBus.removeAllListeners(evt);
      }
    });
  });

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
