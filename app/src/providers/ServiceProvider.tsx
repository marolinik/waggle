/**
 * ServiceProvider — React context providing the WaggleService (LocalAdapter)
 * to all components in the tree.
 *
 * Handles connection lifecycle: shows loading/error states until connected.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { WaggleService } from '@waggle/ui';

const ServiceContext = createContext<WaggleService | null>(null);

export function useService(): WaggleService {
  const service = useContext(ServiceContext);
  if (!service) throw new Error('useService must be used within ServiceProvider');
  return service;
}

interface ServiceProviderProps {
  adapter: WaggleService;
  children: React.ReactNode;
}

export function ServiceProvider({ adapter, children }: ServiceProviderProps) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // If running in Tauri, ensure the server process is started first
      if ((window as any).__TAURI_INTERNALS__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('ensure_service');
        } catch (err) {
          console.warn('[waggle] ensure_service failed:', err);
        }
      }

      try {
        await adapter.connect();
        if (!cancelled) setConnected(true);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
      adapter.disconnect();
    };
  }, [adapter]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a1a',
          color: '#f87171',
          fontFamily: 'Inter, system-ui, sans-serif',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>Failed to connect</div>
        <div style={{ fontSize: 14, color: '#aaa' }}>{error}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Make sure the Waggle service is running on localhost:3333
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a1a',
          color: '#e0e0e0',
          fontFamily: 'Inter, system-ui, sans-serif',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            border: '2px solid #555',
            borderTopColor: '#e0e0e0',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Connecting to Waggle...
      </div>
    );
  }

  return (
    <ServiceContext.Provider value={adapter}>
      {children}
    </ServiceContext.Provider>
  );
}
