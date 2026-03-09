import { useState, useEffect, useCallback } from 'react';
import { ensureService, stopService, api } from '../lib/ipc';

/**
 * Hook to manage the local agent service connection.
 * Named useSidecar for backward compat — delegates to localhost:3333 service.
 */
export function useSidecar() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      await ensureService();
      await api.ping();
      setConnected(true);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await stopService(); } catch { /* window may be closing */ }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return { connected, error, reconnect: connect };
}
