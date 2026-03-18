/**
 * VaultSection -- vault & credentials management in settings.
 *
 * Fetches connector list from GET /api/connectors and displays
 * each connector with status, auth type, and connect/disconnect actions.
 * Reuses the inline connector UI pattern from CockpitView.
 */

import React, { useState, useEffect, useCallback } from 'react';

interface ConnectorInfo {
  id: string;
  name: string;
  status: string;
  service: string;
  authType: string;
  capabilities: string[];
  substrate: string;
}

export interface VaultSectionProps {
  baseUrl?: string;
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'connected': return '#22c55e';
    case 'disconnected': return '#6b7280';
    case 'expired': return '#eab308';
    case 'error': return '#ef4444';
    default: return '#6b7280';
  }
}

export function VaultSection({ baseUrl = 'http://127.0.0.1:3333' }: VaultSectionProps) {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});

  const fetchConnectors = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/connectors`);
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors ?? []);
        setError(null);
      } else {
        setError(`Failed to load connectors (${res.status})`);
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const handleConnect = useCallback(async (id: string) => {
    const token = tokenInputs[id];
    if (!token) return;

    setConnectingId(id);
    try {
      const res = await fetch(`${baseUrl}/api/connectors/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setTokenInputs((prev) => ({ ...prev, [id]: '' }));
        await fetchConnectors();
      } else {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to connect: ${body.error}`);
      }
    } catch {
      setError(`Failed to connect connector "${id}"`);
    } finally {
      setConnectingId(null);
    }
  }, [baseUrl, tokenInputs, fetchConnectors]);

  const handleDisconnect = useCallback(async (id: string) => {
    setConnectingId(id);
    try {
      await fetch(`${baseUrl}/api/connectors/${id}/disconnect`, { method: 'POST' });
      await fetchConnectors();
    } catch {
      setError(`Failed to disconnect connector "${id}"`);
    } finally {
      setConnectingId(null);
    }
  }, [baseUrl, fetchConnectors]);

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;

  if (loading) {
    return (
      <div className="vault-section">
        <h2 className="text-lg font-semibold mb-4">Vault & Credentials</h2>
        <p className="text-sm text-gray-400">Loading connectors...</p>
      </div>
    );
  }

  return (
    <div className="vault-section space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Vault & Credentials</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage external service connections. Credentials are encrypted with AES-256-GCM in the local vault.
        </p>
      </div>

      {/* Summary header */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total connectors: </span>
            <span className="text-gray-100 font-medium">{connectors.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Connected: </span>
            <span className="text-green-400 font-medium">{connectedCount}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-2 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            x
          </button>
        </div>
      )}

      {/* Connector list */}
      {connectors.length === 0 ? (
        <div className="rounded-lg border border-gray-700 p-4 text-center text-sm text-gray-500">
          No connectors configured. Connectors can be added via capability packs or plugins.
        </div>
      ) : (
        <div className="space-y-3">
          {connectors.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: statusDotColor(c.status),
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-sm font-medium text-gray-100">{c.name}</span>
                  <span
                    className="text-xs font-semibold uppercase"
                    style={{ color: statusDotColor(c.status) }}
                  >
                    {c.status}
                  </span>
                </div>

                {(c.status === 'connected' || c.status === 'error') && (
                  <button
                    onClick={() => handleDisconnect(c.id)}
                    disabled={connectingId === c.id}
                    className="rounded border border-red-700 px-3 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              <div className="mt-2 flex gap-4 text-xs text-gray-500">
                <span>service: {c.service}</span>
                <span>auth: {c.authType}</span>
                <span>substrate: {c.substrate}</span>
              </div>

              {/* Connect form for disconnected connectors */}
              {c.status === 'disconnected' && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2 items-center">
                  <input
                    type="password"
                    placeholder={c.authType === 'bearer' ? 'Paste personal access token...' : 'Enter API key...'}
                    value={tokenInputs[c.id] ?? ''}
                    onChange={(e) =>
                      setTokenInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleConnect(c.id)}
                    disabled={!tokenInputs[c.id] || connectingId === c.id}
                    className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectingId === c.id ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
