import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { MindDB, MultiMind, WorkspaceManager, WaggleConfig, createLiteLLMEmbedder, FrameStore, SessionStore, InstallAuditStore, CronStore, AwarenessLayer, VaultStore, SkillHashStore } from '@waggle/core';
import { MemoryWeaver } from '@waggle/weaver';
import {
  Orchestrator,
  createSystemTools,
  createPlanTools,
  createGitTools,
  createDocumentTools,
  createSkillTools,
  createSubAgentTools,
  createWorkflowTools,
  runAgentLoop,
  ensureIdentity,
  loadSystemPrompt,
  loadSkills,
  HookRegistry,
  loadHooksFromConfig,
  CostTracker,
  CommandRegistry,
  registerWorkflowCommands,
  McpRuntime,
  type ToolDefinition,
  type LoadedSkill,
} from '@waggle/agent';
import { PluginRuntimeManager, getStarterSkillsDir, validatePluginManifest } from '@waggle/sdk';
import { workspaceRoutes } from './routes/workspaces.js';
import { chatRoutes, type AgentRunner } from './routes/chat.js';
import { memoryRoutes } from './routes/memory.js';
import { settingsRoutes } from './routes/settings.js';
import { sessionRoutes, findUndistilledSessions, markSessionDistilled } from './routes/sessions.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { litellmRoutes } from './routes/litellm.js';
import { ingestRoutes } from './routes/ingest.js';
import { mindRoutes } from './routes/mind.js';
import { agentRoutes } from './routes/agent.js';
import { skillRoutes } from './routes/skills.js';
import { approvalRoutes } from './routes/approval.js';
import { anthropicProxyRoutes } from './routes/anthropic-proxy.js';
import { teamRoutes } from './routes/team.js';
import { taskRoutes } from './routes/tasks.js';
import { capabilitiesRoutes } from './routes/capabilities.js';
import { commandRoutes } from './routes/commands.js';
import { cronRoutes } from './routes/cron.js';
import { notificationRoutes } from './routes/notifications.js';
import { LocalScheduler } from './cron.js';
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
/** LLM provider health: healthy (verified), degraded (configured, not verified), unavailable */
export type LlmHealthStatus = 'healthy' | 'degraded' | 'unavailable';

/** Which LLM provider is active and its runtime health */
export interface LlmProviderStatus {
  /** Which provider is handling LLM requests */
  provider: 'litellm' | 'anthropic-proxy';
  /** Runtime health — truthful, not optimistic */
  health: LlmHealthStatus;
  /** Human-readable detail (e.g. "LiteLLM on port 4000" or "No API key configured") */
  detail: string;
  /** When this status was last checked */
  checkedAt: string;
}

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
  /** Rebuild workspace-scoped tools (system, git, document) for a given directory */
  buildToolsForWorkspace: (workspacePath: string) => ToolDefinition[];
  /** Activate workspace mind for the given workspace ID. Returns true if switched. */
  activateWorkspaceMind: (workspaceId: string) => boolean;
  /** Get a cached workspace MindDB (opens on demand). Returns null if workspace not found. */
  getWorkspaceMindDb: (workspaceId: string) => import('@waggle/core').MindDB | null;
  /** Currently active workspace ID (null = personal only) */
  activeWorkspaceId: string | null;
  /** Current sub-agent orchestrator instance (set during workflow execution) */
  subagentOrchestrator: import('@waggle/agent').SubagentOrchestrator | null;
  /** Plugin runtime manager — lifecycle, tools, skills from plugins */
  pluginRuntimeManager: import('@waggle/sdk').PluginRuntimeManager;
  /** MCP server runtime — stdio servers, health, tools */
  mcpRuntime: import('@waggle/agent').McpRuntime;
  /** Command registry — slash commands */
  commandRegistry: import('@waggle/agent').CommandRegistry;
  /** LLM provider status — which provider is active and whether it's truly healthy */
  llmProvider: LlmProviderStatus;
}

declare module 'fastify' {
  interface FastifyInstance {
    localConfig: LocalConfig;
    multiMind: MultiMind;
    workspaceManager: WorkspaceManager;
    eventBus: EventEmitter;
    agentRunner?: AgentRunner;
    agentState: AgentState;
    auditStore: import('@waggle/core').InstallAuditStore;
    cronStore: import('@waggle/core').CronStore;
    vault: import('@waggle/core').VaultStore;
    skillHashStore: import('@waggle/core').SkillHashStore;
    scheduler: import('./cron.js').LocalScheduler;
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

  // Install audit store — persistent trail for capability install events
  const auditStore = new InstallAuditStore(multiMind.personal);
  server.decorate('auditStore', auditStore);

  // Cron store — SQLite-backed schedule persistence for Solo
  const cronStore = new CronStore(multiMind.personal);
  server.decorate('cronStore', cronStore);

  // Seed default routines on first run
  if (cronStore.list().length === 0) {
    cronStore.create({ name: 'Memory consolidation', cronExpr: '0 3 * * *', jobType: 'memory_consolidation' });
    cronStore.create({ name: 'Workspace health check', cronExpr: '0 8 * * 1', jobType: 'workspace_health' });
  }

  // Vault — encrypted secret storage
  const vault = new VaultStore(fullConfig.dataDir);
  server.decorate('vault', vault);

  // Migrate plaintext keys from config.json to vault on first run
  try {
    const waggleConfig = new WaggleConfig(fullConfig.dataDir);
    const configProviders = waggleConfig.getProviders();
    if (Object.keys(configProviders).length > 0) {
      const migrated = vault.migrateFromConfig({ providers: configProviders });
      if (migrated > 0) {
        console.log(`[waggle] Migrated ${migrated} API key(s) to encrypted vault`);
      }
    }
  } catch {
    // Migration failure should never block startup
  }

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

  // Build tools — use a default workspace (homedir), but tools are rebuilt
  // per-request when a workspace directory is specified in chat.
  const defaultWorkspace = os.homedir();
  const waggleHome = fullConfig.dataDir || path.join(os.homedir(), '.waggle');
  const mindTools = orchestrator.getTools();
  const systemTools = createSystemTools(defaultWorkspace);
  const planTools = createPlanTools();
  const gitTools = createGitTools(defaultWorkspace);
  const documentTools = createDocumentTools(defaultWorkspace);

  // Skill management tools — let the agent discover, install, create, and acquire skills
  const starterSkillsDir = getStarterSkillsDir();
  const skillTools = createSkillTools({
    waggleHome,
    starterSkillsDir,
    auditStore,
    nativeToolNames: [
      ...mindTools.map(t => t.name),
      ...systemTools.map(t => t.name),
      ...planTools.map(t => t.name),
      ...gitTools.map(t => t.name),
      ...documentTools.map(t => t.name),
    ],
    getInstalledSkills: () => {
      // Return the current in-memory skill state (hot-reloadable)
      return server.agentState?.skills ?? loadSkills(waggleHome);
    },
    onSkillsChanged: () => {
      // Hot-reload skills into agent state
      const fresh = loadSkills(waggleHome);
      // Will be set after agentState is created (see below)
      reloadSkills?.(fresh);
    },
  });

  // Collect all non-subagent tools first (sub-agent tools need the full list)
  const baseTools = [...mindTools, ...systemTools, ...planTools, ...gitTools, ...documentTools, ...skillTools];

  // Sub-agent tools — let the main agent spawn specialist sub-agents
  const subAgentTools = createSubAgentTools({
    availableTools: baseTools,
    runLoop: runAgentLoop,
    litellmUrl: fullConfig.litellmUrl,
    litellmApiKey: litellmApiKey,
    defaultModel: 'claude-sonnet-4-6',
  });

  // Workflow tools — multi-agent workflow templates (research, review, plan-execute)
  const workflowTools = createWorkflowTools({
    availableTools: baseTools,
    runLoop: runAgentLoop,
    litellmUrl: fullConfig.litellmUrl,
    litellmApiKey: litellmApiKey,
    defaultModel: 'claude-sonnet-4-6',
  });

  const allTools = [...baseTools, ...subAgentTools, ...workflowTools];

  // Load user customizations from ~/.waggle/
  const userSystemPrompt = loadSystemPrompt(waggleHome);
  const skills = loadSkills(waggleHome);

  // Skill hash store — detect skill changes on disk
  const skillHashStore = new SkillHashStore(multiMind.personal);
  server.decorate('skillHashStore', skillHashStore);

  // Check for changed skills at startup
  const hashCheck = skillHashStore.checkAll(skills);

  // Auto-verify new skills (first install — no change to flag)
  for (const name of hashCheck.added) {
    const skill = skills.find(s => s.name === name);
    if (skill) skillHashStore.verify(name, skill.content);
  }

  // Log changed skills as warnings
  if (hashCheck.changed.length > 0) {
    console.log(`[waggle] WARNING: ${hashCheck.changed.length} skill(s) changed on disk: ${hashCheck.changed.join(', ')}`);
    console.log('[waggle] Run /skills to review changes');
  }

  // Clean up removed skill hashes
  for (const name of hashCheck.removed) {
    skillHashStore.removeHash(name);
  }

  // Hook registry with user-configured hooks
  const hookRegistry = new HookRegistry();
  await loadHooksFromConfig(path.join(waggleHome, 'hooks.json'), hookRegistry);

  // Cost tracker
  const costTracker = new CostTracker({});

  // Command registry — workflow-native slash commands
  const commandRegistry = new CommandRegistry();
  registerWorkflowCommands(commandRegistry);

  // Plugin runtime manager — lifecycle, tools, skills from plugins
  const pluginRuntimeManager = new PluginRuntimeManager();

  // Auto-load installed plugins from ~/.waggle/plugins/
  const pluginsDir = path.join(waggleHome, 'plugins');
  if (fs.existsSync(pluginsDir)) {
    try {
      const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const pluginName of pluginDirs) {
        const pluginPath = path.join(pluginsDir, pluginName);
        const manifestPath = path.join(pluginPath, 'plugin.json');
        if (!fs.existsSync(manifestPath)) continue;

        try {
          const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
          const validation = validatePluginManifest(raw);
          if (!validation.valid) {
            console.log(`[waggle] Skipping plugin "${pluginName}": invalid manifest — ${validation.errors.join(', ')}`);
            continue;
          }
          pluginRuntimeManager.register(raw as Parameters<typeof pluginRuntimeManager.register>[0]);
          await pluginRuntimeManager.enable(raw.name as string);
        } catch (err) {
          console.log(`[waggle] Failed to load plugin "${pluginName}": ${(err as Error).message}`);
        }
      }

      const active = pluginRuntimeManager.getActive();
      if (active.length > 0) {
        console.log(`[waggle] Loaded ${active.length} plugin(s): ${active.map(p => p.getManifest().name).join(', ')}`);
      }
    } catch { /* non-blocking — plugin scan failure must not prevent startup */ }
  }

  // MCP server runtime — stdio servers, health, tools (empty by default)
  const mcpRuntime = new McpRuntime();

  // Session histories (server-side, like CLI)
  const sessionHistories = new Map<string, Array<{ role: string; content: string }>>();

  // Default model
  const currentModel = 'claude-sonnet-4-6';

  // Pending approvals map for confirmation gates
  const pendingApprovals = new Map<string, PendingApproval>();

  // Skill hot-reload callback (set after agentState is created)
  let reloadSkills: ((fresh: LoadedSkill[]) => void) | undefined;

  // Factory to rebuild workspace-scoped tools for a given directory
  const buildToolsForWorkspace = (wsPath: string): ToolDefinition[] => {
    const wsBase = [
      ...mindTools,
      ...createSystemTools(wsPath),
      ...createPlanTools(),
      ...createGitTools(wsPath),
      ...createDocumentTools(wsPath),
      ...skillTools,
    ];
    const wsSub = createSubAgentTools({
      availableTools: wsBase,
      runLoop: runAgentLoop,
      litellmUrl: fullConfig.litellmUrl,
      litellmApiKey: litellmApiKey,
      defaultModel: 'claude-sonnet-4-6',
    });
    const wsWorkflow = createWorkflowTools({
      availableTools: wsBase,
      runLoop: runAgentLoop,
      litellmUrl: fullConfig.litellmUrl,
      litellmApiKey: litellmApiKey,
      defaultModel: 'claude-sonnet-4-6',
    });
    return [...wsBase, ...wsSub, ...wsWorkflow];
  };

  // ── Workspace mind cache ─────────────────────────────────────────
  // Open workspace .mind files on demand and keep them cached.
  // Closed on server shutdown via onClose hook.
  const workspaceMindCache = new Map<string, MindDB>();
  let activeWorkspaceId: string | null = null;

  /**
   * Activate a workspace's .mind file on the orchestrator.
   * Opens the mind if not cached, then calls setWorkspaceMind().
   */
  const activateWorkspaceMind = (workspaceId: string): boolean => {
    if (activeWorkspaceId === workspaceId) return true; // already active

    const mindPath = wsManager.getMindPath(workspaceId);
    if (!mindPath) return false;

    let wsDb = workspaceMindCache.get(workspaceId);
    if (!wsDb) {
      try {
        wsDb = new MindDB(mindPath);
        workspaceMindCache.set(workspaceId, wsDb);
      } catch {
        return false;
      }
    }

    orchestrator.setWorkspaceMind(wsDb);
    activeWorkspaceId = workspaceId;
    return true;
  };

  // ── Memory Weaver — background consolidation & decay (A1 fix) ────
  // Runs on the personal mind at startup. Workspace minds get weavers when activated.
  const personalFrames = new FrameStore(multiMind.personal);
  const personalSessions = new SessionStore(multiMind.personal);
  const personalWeaver = new MemoryWeaver(multiMind.personal, personalFrames, personalSessions);
  const weaverTimers: NodeJS.Timeout[] = [];
  const workspaceWeavers = new Map<string, { weaver: MemoryWeaver; timers: NodeJS.Timeout[] }>();

  // Run personal mind weaver on intervals
  const runPersonalConsolidation = () => {
    try {
      const active = personalSessions.getActive();
      for (const s of active) personalWeaver.consolidateGop(s.gop_id);
    } catch { /* non-blocking */ }
  };
  const runPersonalDecay = () => {
    try {
      personalWeaver.decayFrames();
      personalWeaver.strengthenFrames();
    } catch { /* non-blocking */ }
  };
  weaverTimers.push(setInterval(runPersonalConsolidation, 60 * 60 * 1000)); // hourly
  weaverTimers.push(setInterval(runPersonalDecay, 24 * 60 * 60 * 1000));    // daily

  // Extend activateWorkspaceMind to also start a weaver for the workspace
  // and distill any undistilled sessions into durable memory frames.
  const baseActivateWorkspaceMind = activateWorkspaceMind;
  const activateWorkspaceMindWithWeaver = (workspaceId: string): boolean => {
    const result = baseActivateWorkspaceMind(workspaceId);

    // E4: Track workspace topic in personal mind (runs on every activation, deduped by content)
    if (result) {
      try {
        const wsConfig = wsManager.get(workspaceId);
        if (wsConfig) {
          const topicContent = `Workspace topic: ${wsConfig.name} (${wsConfig.group || 'General'})`;
          const personalRaw = multiMind.personal.getDatabase();
          const existing = personalRaw.prepare(
            `SELECT id FROM memory_frames WHERE content = ? LIMIT 1`
          ).get(topicContent) as { id: number } | undefined;
          if (!existing) {
            personalFrames.createIFrame(
              personalSessions.getActive()[0]?.gop_id ?? personalSessions.create('personal').gop_id,
              topicContent,
              'normal'
            );
          }
        }
      } catch { /* non-blocking */ }
    }

    if (result && !workspaceWeavers.has(workspaceId)) {
      const wsDb = workspaceMindCache.get(workspaceId);
      if (wsDb) {
        const wsFrames = new FrameStore(wsDb);
        const wsSessions = new SessionStore(wsDb);
        const wsWeaver = new MemoryWeaver(wsDb, wsFrames, wsSessions);
        const timers: NodeJS.Timeout[] = [];
        timers.push(setInterval(() => {
          try {
            const active = wsSessions.getActive();
            for (const s of active) wsWeaver.consolidateGop(s.gop_id);
          } catch { /* non-blocking */ }
        }, 60 * 60 * 1000));
        timers.push(setInterval(() => {
          try { wsWeaver.decayFrames(); wsWeaver.strengthenFrames(); } catch { /* non-blocking */ }
        }, 24 * 60 * 60 * 1000));
        workspaceWeavers.set(workspaceId, { weaver: wsWeaver, timers });

        // E2: Distill undistilled sessions into durable memory frames on activation
        try {
          const sessionsDir = path.join(fullConfig.dataDir, 'workspaces', workspaceId, 'sessions');
          const undistilled = findUndistilledSessions(sessionsDir);
          for (const session of undistilled) {
            wsWeaver.distillSessionContent(session.date, session.summary, session.keyPoints);
            markSessionDistilled(session.filePath);
          }
        } catch { /* non-blocking — distillation failure should never break workspace activation */ }
      }
    }
    return result;
  };

  // Helper: get a cached workspace MindDB (opens on demand)
  const getWorkspaceMindDb = (workspaceId: string): MindDB | null => {
    let wsDb = workspaceMindCache.get(workspaceId);
    if (wsDb) return wsDb;
    const mindPath = wsManager.getMindPath(workspaceId);
    if (!mindPath) return null;
    try {
      wsDb = new MindDB(mindPath);
      workspaceMindCache.set(workspaceId, wsDb);
      return wsDb;
    } catch {
      return null;
    }
  };

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
    buildToolsForWorkspace,
    activateWorkspaceMind: activateWorkspaceMindWithWeaver,
    getWorkspaceMindDb,
    activeWorkspaceId,
    subagentOrchestrator: null,
    pluginRuntimeManager,
    mcpRuntime,
    commandRegistry,
    llmProvider: {
      provider: 'anthropic-proxy' as const,
      health: 'unavailable' as const,
      detail: 'Not yet initialized',
      checkedAt: new Date().toISOString(),
    },
  });

  // Wire up skill hot-reload callback
  reloadSkills = (fresh: LoadedSkill[]) => {
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...fresh);
  };

  // Local scheduler — runs cron jobs in-process (Solo, no Redis/BullMQ)
  const scheduler = new LocalScheduler(cronStore, async (schedule) => {
    switch (schedule.job_type) {
      case 'memory_consolidation':
        try { runPersonalConsolidation(); } catch { /* non-blocking */ }
        break;
      case 'workspace_health':
        // Log stale frame count per workspace as awareness flag
        try {
          const workspaces = wsManager.list();
          for (const ws of workspaces) {
            const wsDb = getWorkspaceMindDb(ws.id);
            if (wsDb) {
              const wsFrames = new FrameStore(wsDb);
              const staleCount = wsFrames.list({ limit: 100 })
                .filter(f => {
                  const age = Date.now() - new Date(f.last_accessed).getTime();
                  return age > 7 * 24 * 60 * 60 * 1000;
                }).length;
              if (staleCount > 0) {
                const wsAwareness = new AwarenessLayer(wsDb);
                wsAwareness.add('flag', `Workspace "${ws.name}" has ${staleCount} stale memory frames (>7 days untouched)`, 0);
              }
            }
          }
        } catch { /* non-blocking */ }
        break;
      case 'agent_task':
        // Deferred to Wave 1.2 (background service mode)
        break;
    }
  });
  scheduler.start();
  server.decorate('scheduler', scheduler);

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
  await server.register(teamRoutes);
  await server.register(taskRoutes);
  await server.register(capabilitiesRoutes);
  await server.register(commandRoutes);
  await server.register(cronRoutes);
  await server.register(notificationRoutes);

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
    const handlers = ['approval_required', 'step', 'tool', 'done', 'error', 'presence_update', 'notification'] as const;
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

  // Health check — truthful, not optimistic
  server.get('/health', async () => {
    const llm = server.agentState.llmProvider;
    const dbHealthy = (() => {
      try {
        multiMind.personal.getDatabase().prepare('SELECT 1').get();
        return true;
      } catch {
        return false;
      }
    })();

    const overallStatus = llm.health === 'healthy' && dbHealthy
      ? 'ok'
      : llm.health === 'unavailable' || !dbHealthy
        ? 'unavailable'
        : 'degraded';

    return {
      status: overallStatus,
      mode: 'local',
      timestamp: new Date().toISOString(),
      llm: {
        provider: llm.provider,
        health: llm.health,
        detail: llm.detail,
        checkedAt: llm.checkedAt,
      },
      database: { healthy: dbHealthy },
    };
  });

  // Cleanup on close
  server.addHook('onClose', async () => {
    // Stop cron scheduler
    scheduler.stop();

    // Stop MCP servers
    await mcpRuntime.stopAll().catch(() => {});

    // Stop weaver timers
    for (const t of weaverTimers) clearInterval(t);
    for (const [, ww] of workspaceWeavers) {
      for (const t of ww.timers) clearInterval(t);
    }
    workspaceWeavers.clear();

    // Close all cached workspace minds
    for (const [, wsDb] of workspaceMindCache) {
      try { wsDb.close(); } catch { /* already closed */ }
    }
    workspaceMindCache.clear();
    multiMind.close();
  });

  return server;
}
