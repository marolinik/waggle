import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { FastifyInstance } from 'fastify';
import { needsMigration, migrateToMultiMind, MindDB } from '@waggle/core';
import { buildLocalServer } from './index.js';
import { startLiteLLM, stopLiteLLM, type LiteLLMStatus } from './lifecycle.js';

// ── Startup progress types ─────────────────────────────────────────

export type StartupPhase = 'init' | 'migration' | 'creating-mind' | 'litellm' | 'server' | 'ready';

export interface StartupEvent {
  phase: StartupPhase;
  message: string;
  progress: number;
}

export interface ServiceOptions {
  dataDir?: string;
  port?: number;
  litellmPort?: number;
  skipLiteLLM?: boolean;
  onProgress?: (event: StartupEvent) => void;
}

export interface ServiceResult {
  server: FastifyInstance;
  litellm: LiteLLMStatus;
}

const DEFAULT_PORT = 3333;

/**
 * Check if this is a fresh install (no personal.mind, no default.mind).
 */
export function isFirstRun(dataDir: string): boolean {
  if (!fs.existsSync(dataDir)) return true;
  const hasPersonal = fs.existsSync(path.join(dataDir, 'personal.mind'));
  const hasDefault = fs.existsSync(path.join(dataDir, 'default.mind'));
  return !hasPersonal && !hasDefault;
}

/**
 * Start the Waggle agent service.
 *
 * 1. Resolves/creates dataDir (~/.waggle)
 * 2. Runs migration if needed (default.mind -> personal.mind)
 * 3. Creates personal.mind if fresh install
 * 4. Starts LiteLLM proxy (unless skipped)
 * 5. Builds & starts local Fastify server
 * 6. Registers graceful shutdown handlers
 *
 * Optionally accepts an onProgress callback to emit startup phase events
 * for UI splash screen display.
 */
export async function startService(options?: ServiceOptions): Promise<ServiceResult> {
  const dataDir = options?.dataDir ?? path.join(os.homedir(), '.waggle');
  const port = options?.port ?? DEFAULT_PORT;
  const litellmPort = options?.litellmPort ?? 4000;
  const skipLiteLLM = options?.skipLiteLLM ?? false;
  const emit = options?.onProgress ?? (() => {});

  // 1. Ensure dataDir exists
  emit({ phase: 'init', message: 'Initializing Waggle service...', progress: 0.05 });
  fs.mkdirSync(dataDir, { recursive: true });

  // 2. Check/run migration
  if (needsMigration(dataDir)) {
    emit({ phase: 'migration', message: 'Migrating to multi-mind layout...', progress: 0.15 });
    try {
      migrateToMultiMind(dataDir);
      emit({ phase: 'migration', message: 'Migration complete', progress: 0.2 });
    } catch (err) {
      const msg = `Migration failed: ${err instanceof Error ? err.message : String(err)}`;
      emit({ phase: 'migration', message: msg, progress: 0.2 });
      throw new Error(msg);
    }
  }

  // 3. Ensure personal.mind exists
  const personalPath = path.join(dataDir, 'personal.mind');
  if (!fs.existsSync(personalPath)) {
    emit({ phase: 'creating-mind', message: 'Creating personal memory...', progress: 0.3 });
    const mind = new MindDB(personalPath);
    mind.close();
  }

  // 4. Start LiteLLM (unless skipped)
  emit({ phase: 'litellm', message: skipLiteLLM ? 'Skipping LiteLLM proxy...' : 'Starting LiteLLM proxy...', progress: 0.5 });
  let litellm: LiteLLMStatus;
  if (skipLiteLLM) {
    litellm = { status: 'error', port: litellmPort, error: 'Skipped' };
  } else {
    litellm = await startLiteLLM(litellmPort);
  }

  // 5. Build and start local server
  emit({ phase: 'server', message: 'Starting local server...', progress: 0.75 });
  const server = await buildLocalServer({
    dataDir,
    port,
    litellmUrl: `http://localhost:${litellmPort}`,
  });

  // 6. Register self-removing shutdown handlers (must add hook before listen)
  let shutdown: () => Promise<void>;

  // Deregister signal handlers when server closes normally (e.g. in tests)
  server.addHook('onClose', async () => {
    process.off('SIGTERM', shutdown);
    process.off('SIGINT', shutdown);
  });

  await server.listen({ port, host: '127.0.0.1' });

  shutdown = async () => {
    process.off('SIGTERM', shutdown);
    process.off('SIGINT', shutdown);
    await server.close();
    if (!skipLiteLLM) {
      await stopLiteLLM();
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  emit({ phase: 'ready', message: 'Waggle service is ready!', progress: 1 });

  return { server, litellm };
}

// Main entry point when run directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const skipLiteLLM = process.argv.includes('--skip-litellm') || process.env.WAGGLE_SKIP_LITELLM === '1';
  startService({ skipLiteLLM })
    .then(({ server, litellm }) => {
      const addr = server.server.address();
      const port = typeof addr === 'object' && addr ? addr.port : '?';
      console.log(`Waggle service running on http://127.0.0.1:${port}`);
      console.log(`LiteLLM: ${litellm.status} (port ${litellm.port})`);
    })
    .catch((err) => {
      console.error('Failed to start Waggle service:', err);
      process.exit(1);
    });
}
