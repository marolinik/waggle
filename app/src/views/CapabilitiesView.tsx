/**
 * CapabilitiesView — Top-level view surfacing capability packs and individual
 * skills (via the existing InstallCenter component).
 *
 * Wave 1.7: Promoted from buried Settings tab to top-level navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InstallCenter } from '@waggle/ui';

// ── Types ────────────────────────────────────────────────────────────────

interface PackSkillState {
  id: string;
  state: string;
}

interface PackEntry {
  id: string;
  name: string;
  description: string;
  skills: string[];
  skillStates: PackSkillState[];
  packState: 'available' | 'incomplete' | 'complete';
  installedCount: number;
  totalCount: number;
}

// ── Component ────────────────────────────────────────────────────────────

export function CapabilitiesView() {
  const [activeTab, setActiveTab] = useState<'packs' | 'skills'>('packs');
  const [packs, setPacks] = useState<PackEntry[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);
  const [installingPack, setInstallingPack] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const baseUrl = 'http://127.0.0.1:3333';

  const [fetchFailed, setFetchFailed] = useState(false);

  const fetchPacks = useCallback(async () => {
    setPacksLoading(true);
    setFetchFailed(false);
    try {
      const res = await fetch(`${baseUrl}/api/skills/capability-packs/catalog`);
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs ?? []);
      } else {
        setFetchFailed(true);
      }
    } catch {
      setFetchFailed(true);
    } finally {
      setPacksLoading(false);
    }
  }, []);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  const handleInstallPack = useCallback(async (packId: string) => {
    setInstallingPack(packId);
    setPackError(null);
    try {
      const res = await fetch(`${baseUrl}/api/skills/capability-packs/${packId}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Install failed' }));
        setPackError(err.error ?? 'Install failed');
        return;
      }
      await fetchPacks();
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Install failed');
    } finally {
      setInstallingPack(null);
    }
  }, [fetchPacks]);

  // ── Styles ─────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: 960,
    margin: '0 auto',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    height: '100%',
    overflowY: 'auto',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text, #e6edf3)',
    marginBottom: 4,
  };

  const subStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-muted, #8b949e)',
    marginBottom: 24,
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 2,
    marginBottom: 24,
    borderBottom: '1px solid var(--border, #232333)',
    paddingBottom: 0,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 500,
    color: active ? 'var(--primary, #58a6ff)' : 'var(--text-muted, #8b949e)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--primary, #58a6ff)' : '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color 0.15s, border-color 0.15s',
  });

  const packCardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border, #232333)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  };

  const packNameStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text, #e6edf3)',
    marginBottom: 4,
  };

  const packDescStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-muted, #8b949e)',
    marginBottom: 12,
  };

  const skillDotStyle = (state: string): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: state === 'active' ? '#3fb950' : state === 'installed' ? '#58a6ff' : '#484f58',
    flexShrink: 0,
  });

  const skillLabelStyle = (state: string): React.CSSProperties => ({
    fontSize: 11,
    color: state === 'active' ? '#3fb950' : state === 'installed' ? '#58a6ff' : 'var(--text-muted, #8b949e)',
  });

  const badgeStyle = (state: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    background: state === 'complete' ? 'rgba(63, 185, 80, 0.15)' : state === 'incomplete' ? 'rgba(210, 153, 34, 0.15)' : 'rgba(88, 166, 255, 0.15)',
    color: state === 'complete' ? '#3fb950' : state === 'incomplete' ? '#d29922' : '#58a6ff',
  });

  const installBtnStyle = (disabled: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: disabled ? '#21262d' : 'var(--primary, #58a6ff)',
    color: disabled ? '#484f58' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      <div style={headingStyle}>Capabilities</div>
      <div style={subStyle}>Browse and install capability packs and individual skills to expand your agent.</div>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        <button style={tabStyle(activeTab === 'packs')} onClick={() => setActiveTab('packs')}>
          Packs ({packs.length})
        </button>
        <button style={tabStyle(activeTab === 'skills')} onClick={() => setActiveTab('skills')}>
          Individual Skills
        </button>
      </div>

      {/* Pack error */}
      {packError && (
        <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 6, background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', fontSize: 12 }}>
          {packError}
        </div>
      )}

      {/* Packs tab */}
      {activeTab === 'packs' && (
        <div>
          {packsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 24 }}>Loading packs...</div>
          ) : fetchFailed && packs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Failed to load capability packs. Is the server running?
              </div>
              <button
                onClick={fetchPacks}
                style={{
                  padding: '6px 16px',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--primary, #58a6ff)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                Retry
              </button>
            </div>
          ) : packs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 24 }}>No capability packs available.</div>
          ) : (
            packs.map(pack => (
              <div key={pack.id} style={packCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={packNameStyle}>{pack.name}</div>
                    <div style={packDescStyle}>{pack.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={badgeStyle(pack.packState)}>
                      {pack.packState === 'complete' ? 'Installed' : pack.packState === 'incomplete' ? `${pack.installedCount}/${pack.totalCount}` : 'Available'}
                    </span>
                    {pack.packState !== 'complete' && (
                      <button
                        style={installBtnStyle(installingPack === pack.id)}
                        onClick={() => handleInstallPack(pack.id)}
                        disabled={installingPack === pack.id}
                      >
                        {installingPack === pack.id ? 'Installing...' : pack.packState === 'incomplete' ? 'Complete' : 'Install'}
                      </button>
                    )}
                  </div>
                </div>
                {/* Skill list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {pack.skillStates.map(skill => (
                    <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={skillDotStyle(skill.state)} />
                      <span style={skillLabelStyle(skill.state)}>
                        {skill.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Individual Skills tab — reuses existing InstallCenter */}
      {activeTab === 'skills' && (
        <InstallCenter />
      )}
    </div>
  );
}
