import { invoke } from '@tauri-apps/api/core';

export async function startSidecar(mindPath?: string): Promise<string> {
  return invoke('start_sidecar', { mindPath });
}

export async function stopSidecar(): Promise<string> {
  return invoke('stop_sidecar');
}

export async function rpcCall(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const response = await invoke<{ result?: unknown; error?: { message: string } }>(
    'send_to_sidecar',
    { method, params }
  );
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result;
}

export const ipc = {
  ping: () => rpcCall('ping'),
  getIdentity: () => rpcCall('mind.getIdentity') as Promise<string>,
  getAwareness: () => rpcCall('mind.getAwareness') as Promise<string>,
  sendMessage: (message: string) => rpcCall('chat.send', { message }),
  getSettings: () => rpcCall('settings.get') as Promise<Record<string, unknown>>,
  setSettings: (key: string, value: unknown) => rpcCall('settings.set', { key, value }),
};
