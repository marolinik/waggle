import { spawn, type ChildProcess } from 'node:child_process';

export interface LiteLLMStatus {
  status: 'running' | 'started' | 'timeout' | 'error';
  port: number;
  error?: string;
}

const DEFAULT_PORT = 4000;
const HEALTH_POLL_INTERVAL = 1000;
const HEALTH_POLL_MAX = 30;

let litellmProcess: ChildProcess | null = null;

async function checkHealth(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check LiteLLM health status without starting it.
 */
export async function getLiteLLMStatus(port?: number): Promise<LiteLLMStatus> {
  const p = port ?? DEFAULT_PORT;
  const healthy = await checkHealth(p);
  if (healthy) {
    return { status: 'running', port: p };
  }
  return { status: 'error', port: p, error: 'LiteLLM is not running' };
}

/**
 * Start LiteLLM proxy. If already running, returns immediately.
 * Otherwise spawns `python -m litellm --port {port}` and polls health.
 */
export async function startLiteLLM(port?: number): Promise<LiteLLMStatus> {
  const p = port ?? DEFAULT_PORT;

  // Already running?
  if (await checkHealth(p)) {
    return { status: 'running', port: p };
  }

  // Spawn LiteLLM
  try {
    litellmProcess = spawn('python', ['-m', 'litellm', '--port', String(p)], {
      stdio: 'ignore',
      detached: false,
    });

    // Handle spawn errors
    litellmProcess.on('error', () => {
      litellmProcess = null;
    });
  } catch (err) {
    return {
      status: 'error',
      port: p,
      error: `Failed to spawn LiteLLM: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Poll health check
  for (let i = 0; i < HEALTH_POLL_MAX; i++) {
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL));
    if (await checkHealth(p)) {
      return { status: 'started', port: p };
    }
    // If process exited, stop polling
    if (litellmProcess && litellmProcess.exitCode !== null) {
      return {
        status: 'error',
        port: p,
        error: `LiteLLM exited with code ${litellmProcess.exitCode}`,
      };
    }
  }

  // Timed out — kill process
  if (litellmProcess) {
    litellmProcess.kill();
    litellmProcess = null;
  }
  return { status: 'timeout', port: p };
}

/**
 * Stop the spawned LiteLLM process, if any.
 */
export async function stopLiteLLM(): Promise<void> {
  if (litellmProcess) {
    litellmProcess.kill();
    litellmProcess = null;
  }
}
