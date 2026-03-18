/**
 * CapabilitiesView — Top-level view surfacing capability packs and individual
 * skills (via the existing InstallCenter component).
 *
 * Wave 1.7: Promoted from buried Settings tab to top-level navigation.
 * Task A2: Pack reconciliation — Recommended (5 Waggle packs) + Community
 *          (marketplace packs) tiers with bulk install + progress tracking.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

/** Shape returned by GET /api/marketplace/packs */
export interface MarketplacePackSummary {
  id: number;
  slug: string;
  display_name: string;
  description: string;
  target_roles: string;
  icon: string;
  priority: 'core' | 'recommended' | 'optional';
  connectors_needed: string[];
  created_at: string;
}

/** Shape returned by GET /api/marketplace/packs/:slug */
export interface MarketplacePackDetail {
  pack: MarketplacePackSummary;
  packages: MarketplacePackageEntry[];
}

export interface MarketplacePackageEntry {
  id: number;
  name: string;
  display_name: string;
  description: string;
  waggle_install_type: 'skill' | 'plugin' | 'mcp';
  category: string;
}

/** Bulk install progress state for a single community pack */
export interface BulkInstallProgress {
  installing: boolean;
  current: number;
  total: number;
  currentName: string;
  errors: string[];
  done: boolean;
}

// ── Helpers (exported for testing) ───────────────────────────────────────

export function createInitialProgress(): BulkInstallProgress {
  return { installing: false, current: 0, total: 0, currentName: '', errors: [], done: false };
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'core': return 'Core';
    case 'recommended': return 'Recommended';
    case 'optional': return 'Optional';
    default: return priority;
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'core': return '#d4a843';
    case 'recommended': return '#58a6ff';
    case 'optional': return 'var(--text-muted, #8b949e)';
    default: return 'var(--text-muted, #8b949e)';
  }
}

// ── Component ────────────────────────────────────────────────────────────

export function CapabilitiesView() {
  const [activeTab, setActiveTab] = useState<'packs' | 'skills'>('packs');

  // ── Recommended packs (existing 5 Waggle packs) ──
  const [packs, setPacks] = useState<PackEntry[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);
  const [installingPack, setInstallingPack] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  // ── Community packs (marketplace) ──
  const [communityPacks, setCommunityPacks] = useState<MarketplacePackSummary[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityInstallProgress, setCommunityInstallProgress] = useState<Record<string, BulkInstallProgress>>({});
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());

  const baseUrl = 'http://127.0.0.1:3333';

  // Abort controller ref for cleanup
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch recommended packs ──
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

  // ── Fetch community packs from marketplace ──
  const fetchCommunityPacks = useCallback(async () => {
    setCommunityLoading(true);
    setCommunityError(null);
    try {
      const res = await fetch(`${baseUrl}/api/marketplace/packs`);
      if (res.ok) {
        const data = await res.json();
        setCommunityPacks(data.packs ?? []);
      } else if (res.status === 503) {
        // Marketplace not available — not an error, just unavailable
        setCommunityPacks([]);
      } else {
        setCommunityError('Failed to load community packs');
      }
    } catch {
      // Network error — marketplace may not be running, degrade gracefully
      setCommunityPacks([]);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacks();
    fetchCommunityPacks();
  }, [fetchPacks, fetchCommunityPacks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Install recommended pack (existing logic) ──
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

  // ── Bulk install community pack ──
  const handleInstallCommunityPack = useCallback(async (slug: string) => {
    // Prevent double-install
    const existing = communityInstallProgress[slug];
    if (existing?.installing) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setCommunityInstallProgress(prev => ({
      ...prev,
      [slug]: { installing: true, current: 0, total: 0, currentName: 'Fetching pack details...', errors: [], done: false },
    }));

    try {
      // 1. Fetch pack detail to get the list of packages
      const detailRes = await fetch(`${baseUrl}/api/marketplace/packs/${slug}`, { signal: controller.signal });
      if (!detailRes.ok) {
        setCommunityInstallProgress(prev => ({
          ...prev,
          [slug]: { ...prev[slug], installing: false, errors: ['Failed to fetch pack details'], done: true },
        }));
        return;
      }

      const detail: MarketplacePackDetail = await detailRes.json();
      const packages = detail.packages;

      if (packages.length === 0) {
        setCommunityInstallProgress(prev => ({
          ...prev,
          [slug]: { installing: false, current: 0, total: 0, currentName: '', errors: ['Pack contains no packages'], done: true },
        }));
        return;
      }

      const total = packages.length;
      const errors: string[] = [];

      // 2. Install each package sequentially
      for (let i = 0; i < packages.length; i++) {
        if (controller.signal.aborted) break;

        const pkg = packages[i];

        setCommunityInstallProgress(prev => ({
          ...prev,
          [slug]: { ...prev[slug], current: i + 1, total, currentName: pkg.display_name || pkg.name },
        }));

        try {
          const installRes = await fetch(`${baseUrl}/api/marketplace/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId: pkg.id }),
            signal: controller.signal,
          });

          if (!installRes.ok) {
            const errData = await installRes.json().catch(() => ({ error: 'Install failed' }));
            const msg = errData.blocked
              ? `${pkg.display_name || pkg.name}: blocked (${errData.severity})`
              : `${pkg.display_name || pkg.name}: ${errData.error || errData.message || 'Install failed'}`;
            errors.push(msg);
          } else {
            const result = await installRes.json();
            if (!result.success) {
              errors.push(`${pkg.display_name || pkg.name}: ${result.message || 'Install failed'}`);
            }
          }
        } catch (err) {
          if (controller.signal.aborted) break;
          errors.push(`${pkg.display_name || pkg.name}: ${err instanceof Error ? err.message : 'Network error'}`);
        }
      }

      // 3. Mark as done
      setCommunityInstallProgress(prev => ({
        ...prev,
        [slug]: { installing: false, current: total, total, currentName: '', errors, done: true },
      }));

      if (errors.length === 0) {
        setInstalledSlugs(prev => new Set([...prev, slug]));
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setCommunityInstallProgress(prev => ({
          ...prev,
          [slug]: { ...prev[slug], installing: false, errors: [err instanceof Error ? err.message : 'Install failed'], done: true },
        }));
      }
    }
  }, [communityInstallProgress]);

  // ── Retry failed packages in a community pack ──
  const handleRetryCommunityPack = useCallback((slug: string) => {
    setCommunityInstallProgress(prev => {
      const updated = { ...prev };
      delete updated[slug];
      return updated;
    });
    // Re-trigger the install
    handleInstallCommunityPack(slug);
  }, [handleInstallCommunityPack]);

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

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text, #e6edf3)',
    letterSpacing: '0.02em',
  };

  const sectionBadgeStyle = (variant: 'recommended' | 'community'): React.CSSProperties => ({
    fontSize: 9,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    background: variant === 'recommended' ? 'rgba(212, 168, 67, 0.15)' : 'rgba(88, 166, 255, 0.1)',
    color: variant === 'recommended' ? '#d4a843' : '#58a6ff',
  });

  const packCardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border, #232333)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  };

  const recommendedCardStyle: React.CSSProperties = {
    ...packCardStyle,
    borderLeft: '3px solid rgba(212, 168, 67, 0.5)',
  };

  const communityCardStyle = (priority: string): React.CSSProperties => ({
    ...packCardStyle,
    borderLeft: priority === 'core'
      ? '3px solid rgba(212, 168, 67, 0.3)'
      : '3px solid transparent',
    ...(priority === 'core' ? { boxShadow: '0 0 8px rgba(212, 168, 67, 0.06)' } : {}),
  });

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

  const metaTagStyle: React.CSSProperties = {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(88, 166, 255, 0.08)',
    color: 'var(--text-muted, #8b949e)',
    border: '1px solid rgba(88, 166, 255, 0.1)',
  };

  const progressBarContainerStyle: React.CSSProperties = {
    height: 4,
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: 'var(--border, #232333)',
    margin: '24px 0',
  };

  // ── Total pack count for tab label ──
  const totalPackCount = packs.length + communityPacks.length;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      <div style={headingStyle}>Capabilities</div>
      <div style={subStyle}>Browse and install capability packs and individual skills to expand your agent.</div>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        <button style={tabStyle(activeTab === 'packs')} onClick={() => setActiveTab('packs')}>
          Packs ({totalPackCount})
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
          {/* ── Recommended Section ─────────────────────────────────── */}
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>Recommended</span>
            <span style={sectionBadgeStyle('recommended')}>Waggle</span>
          </div>

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
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 24 }}>No recommended packs available.</div>
          ) : (
            packs.map(pack => (
              <div key={pack.id} style={recommendedCardStyle}>
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

          {/* ── Divider ─────────────────────────────────────────────── */}
          {communityPacks.length > 0 && <div style={dividerStyle} />}

          {/* ── Community Section ───────────────────────────────────── */}
          {communityLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 24 }}>Loading community packs...</div>
          ) : communityError ? (
            <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 6, background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', fontSize: 12 }}>
              {communityError}
            </div>
          ) : communityPacks.length > 0 ? (
            <>
              <div style={sectionHeaderStyle}>
                <span style={sectionTitleStyle}>Community</span>
                <span style={sectionBadgeStyle('community')}>Marketplace</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)', marginLeft: 'auto' }}>
                  {communityPacks.length} packs
                </span>
              </div>

              {communityPacks.map(cp => {
                const progress = communityInstallProgress[cp.slug];
                const isInstalled = installedSlugs.has(cp.slug) || (progress?.done && progress.errors.length === 0);
                const isInstalling = progress?.installing;

                return (
                  <div key={cp.slug} style={communityCardStyle(cp.priority)} data-testid={`community-pack-${cp.slug}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {cp.icon && <span style={{ fontSize: 16 }}>{cp.icon}</span>}
                          <span style={packNameStyle}>{cp.display_name}</span>
                          <span style={{ ...metaTagStyle, color: priorityColor(cp.priority) }}>
                            {priorityLabel(cp.priority)}
                          </span>
                        </div>
                        <div style={packDescStyle}>{cp.description}</div>
                        {/* Target roles */}
                        {cp.target_roles && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 4 }}>
                            {cp.target_roles.split(',').map(role => (
                              <span key={role.trim()} style={metaTagStyle}>{role.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        {isInstalled ? (
                          <span style={{ ...badgeStyle('complete') }}>Installed</span>
                        ) : isInstalling ? (
                          <span style={{ fontSize: 11, color: '#d4a843', fontWeight: 500 }}>
                            Installing {progress.current}/{progress.total}...
                          </span>
                        ) : progress?.done && progress.errors.length > 0 ? (
                          <button
                            style={{ ...installBtnStyle(false), background: '#d29922' }}
                            onClick={() => handleRetryCommunityPack(cp.slug)}
                          >
                            Retry ({progress.errors.length} failed)
                          </button>
                        ) : (
                          <button
                            style={installBtnStyle(false)}
                            onClick={() => handleInstallCommunityPack(cp.slug)}
                          >
                            Install
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {isInstalling && progress && (
                      <div>
                        <div style={progressBarContainerStyle}>
                          <div
                            style={{
                              height: '100%',
                              width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                              background: '#d4a843',
                              borderRadius: 2,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                          {progress.currentName}
                        </div>
                      </div>
                    )}

                    {/* Error list */}
                    {progress?.done && progress.errors.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {progress.errors.map((err, i) => (
                          <div key={i} style={{ fontSize: 10, color: '#f85149', padding: '2px 0' }}>
                            {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : null /* No community packs — don't show the section at all */}
        </div>
      )}

      {/* Individual Skills tab — reuses existing InstallCenter */}
      {activeTab === 'skills' && (
        <InstallCenter />
      )}
    </div>
  );
}
