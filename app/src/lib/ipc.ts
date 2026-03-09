const SERVICE_URL = 'http://localhost:3333';

/**
 * Ensure the local agent service is running.
 * First tries a direct health check; falls back to Tauri command to start it.
 */
export async function ensureService(): Promise<string> {
  try {
    const res = await fetch(`${SERVICE_URL}/health`);
    if (res.ok) return 'Service running';
  } catch {
    // Service not running — ask Tauri to start it
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('ensure_service');
}

/**
 * Stop the local agent service via Tauri.
 */
export async function stopService(): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('stop_service');
}

/**
 * Get the configured service port.
 */
export async function getServicePort(): Promise<number> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('get_service_port');
}

/**
 * Thin HTTP client for the localhost agent service.
 * All real logic lives in @waggle/ui's LocalAdapter — this is just the
 * bridge layer for legacy ipc consumers that haven't migrated yet.
 */
export const api = {
  health: async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    return res.json();
  },

  ping: async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    if (!res.ok) throw new Error('Service not reachable');
    return { status: 'ok' };
  },

  getIdentity: async (): Promise<string> => {
    const res = await fetch(`${SERVICE_URL}/api/mind/identity`);
    if (!res.ok) throw new Error('Failed to get identity');
    const data = await res.json();
    return data.identity;
  },

  getAwareness: async (): Promise<string> => {
    const res = await fetch(`${SERVICE_URL}/api/mind/awareness`);
    if (!res.ok) throw new Error('Failed to get awareness');
    const data = await res.json();
    return data.awareness;
  },

  sendMessage: async (message: string) => {
    const res = await fetch(`${SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  getSettings: async (): Promise<Record<string, unknown>> => {
    const res = await fetch(`${SERVICE_URL}/api/settings`);
    if (!res.ok) throw new Error('Failed to get settings');
    return res.json();
  },

  setSettings: async (key: string, value: unknown) => {
    const res = await fetch(`${SERVICE_URL}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error('Failed to set settings');
    return res.json();
  },
};

/**
 * Generic RPC-style call via HTTP POST.
 * Maps legacy rpcCall(method, params) to POST /api/rpc.
 * Falls back to method-based routing if the RPC endpoint doesn't exist.
 */
export async function rpcCall(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(`${SERVICE_URL}/api/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });
  if (!res.ok) throw new Error(`RPC call '${method}' failed: ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// Re-export for backward compatibility
export const ipc = api;
