import { useState, useEffect, useCallback } from 'react';
import { startSidecar, stopSidecar, ipc } from '../lib/ipc';

export function useSidecar() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      await startSidecar();
      await ipc.ping();
      setConnected(true);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await stopSidecar(); } catch { /* window may be closing */ }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return { connected, error, reconnect: connect };
}
