import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { FastifyInstance } from 'fastify';
import { needsMigration, migrateToMultiMind, MindDB } from '@waggle/core';
import { buildLocalServer } from './index.js';
import { startLiteLLM, stopLiteLLM, type LiteLLMStatus } from './lifecycle.js';

export interface ServiceOptions {
  dataDir?: string;
  port?: number;
  litellmPort?: number;
  skipLiteLLM?: boolean;
}

export interface ServiceResult {
  server: FastifyInstance;
  litellm: LiteLLMStatus;
}

const DEFAULT_PORT = 3333;

/**
 * Start the Waggle agent service.
 *
 * 1. Resolves/creates dataDir (~/.waggle)
 * 2. Runs migration if needed (default.mind -> personal.mind)
 * 3. Creates personal.mind if fresh install
 * 4. Starts LiteLLM proxy (unless skipped)
 * 5. Builds & starts local Fastify server
 * 6. Registers graceful shutdown handlers
 */
export async function startService(options?: ServiceOptions): Promise<ServiceResult> {
  const dataDir = options?.dataDir ?? path.join(os.homedir(), '.waggle');
  const port = options?.port ?? DEFAULT_PORT;
  const litellmPort = options?.litellmPort ?? 4000;
  const skipLiteLLM = options?.skipLiteLLM ?? false;

  // 1. Ensure dataDir exists
  fs.mkdirSync(dataDir, { recursive: true });

  // 2. Check/run migration
  if (needsMigration(dataDir)) {
    migrateToMultiMind(dataDir);
  }

  // 3. Ensure personal.mind exists
  const personalPath = path.join(dataDir, 'personal.mind');
  if (!fs.existsSync(personalPath)) {
    const mind = new MindDB(personalPath);
    mind.close();
  }

  // 4. Start LiteLLM (unless skipped)
  let litellm: LiteLLMStatus;
  if (skipLiteLLM) {
    litellm = { status: 'error', port: litellmPort, error: 'Skipped' };
  } else {
    litellm = await startLiteLLM(litellmPort);
  }

  // 5. Build and start local server
  const server = await buildLocalServer({
    dataDir,
    port,
    litellmUrl: `http://localhost:${litellmPort}`,
  });

  await server.listen({ port, host: '127.0.0.1' });

  // 6. Register shutdown handlers
  const shutdown = async () => {
    await server.close();
    if (!skipLiteLLM) {
      await stopLiteLLM();
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { server, litellm };
}

// Main entry point when run directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  startService()
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
