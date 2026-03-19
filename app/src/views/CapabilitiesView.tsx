/**
 * CapabilitiesView — Top-level view surfacing capability packs, marketplace
 * browsing with search/filter/sort, and individual skills.
 *
 * Wave 1.7: Promoted from buried Settings tab to top-level navigation.
 * Task A2: Pack reconciliation — Recommended (5 Waggle packs) + Community
 *          (marketplace packs) tiers with bulk install + progress tracking.
 * Wave 9A: Marketplace polish — search filters, install badges, uninstall,
 *          type/category/sort chips, improved UX.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InstallCenter } from '@waggle/ui';
import { getServerBaseUrl } from '../lib/ipc';

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

/** Package shape from GET /api/marketplace/search (annotated with installed) */
export interface MarketplaceSearchPackage {
  id: number;
  name: string;
  display_name: string;
  description: string;
  author: string;
  waggle_install_type: 'skill' | 'plugin' | 'mcp';
  category: string;
  stars: number;
  downloads: number;
  rating: number;
  rating_count: number;
  version: string;
  installed: boolean;
  updated_at: string;
}

/** Search result shape from GET /api/marketplace/search */
export interface MarketplaceSearchResult {
  packages: MarketplaceSearchPackage[];
  total: number;
  facets: {
    types: Record<string, number>;
    categories: Record<string, number>;
    sources: Record<string, number>;
  };
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

// ── Filter types ─────────────────────────────────────────────────────────

type InstallTypeFilter = 'all' | 'skill' | 'plugin' | 'mcp';
type SortOption = 'relevance' | 'popular' | 'updated' | 'name';

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
    case 'recommended': return 'var(--primary, #58a6ff)';
    case 'optional': return 'var(--text-muted, #8b949e)';
    default: return 'var(--text-muted, #8b949e)';
  }
}

export function installTypeLabel(type: string): string {
  switch (type) {
    case 'skill': return 'Skill';
    case 'plugin': return 'Plugin';
    case 'mcp': return 'MCP Server';
    default: return type;
  }
}

export function installTypeColor(type: string): string {
  switch (type) {
    case 'skill': return '#3fb950';
    case 'plugin': return 'var(--primary, #58a6ff)';
    case 'mcp': return '#d4a843';
    default: return 'var(--text-muted, #8b949e)';
  }
}

export function formatDownloads(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Component ────────────────────────────────────────────────────────────

export function CapabilitiesView() {
  const [activeTab, setActiveTab] = useState<'packs' | 'marketplace' | 'skills'>('packs');

  // ── Create Skill panel state ──
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillSteps, setNewSkillSteps] = useState<string[]>(['']);
  const [newSkillCategory, setNewSkillCategory] = useState('general');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

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

  // ── Marketplace search/browse state ──
  const [marketplacePackages, setMarketplacePackages] = useState<MarketplaceSearchPackage[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [marketplaceFacets, setMarketplaceFacets] = useState<MarketplaceSearchResult['facets'] | null>(null);
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstallTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [installingPackageId, setInstallingPackageId] = useState<number | null>(null);
  const [uninstallingPackageId, setUninstallingPackageId] = useState<number | null>(null);

  const baseUrl = getServerBaseUrl();

  // Abort controller ref for cleanup
  const abortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setCommunityPacks([]);
      } else {
        setCommunityError('Failed to load community packs');
      }
    } catch {
      setCommunityPacks([]);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  // ── Fetch marketplace packages (search) ──
  const fetchMarketplace = useCallback(async () => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      params.set('limit', '100');

      const res = await fetch(`${baseUrl}/api/marketplace/search?${params.toString()}`);
      if (res.ok) {
        const data: MarketplaceSearchResult = await res.json();
        setMarketplacePackages(data.packages ?? []);
        setMarketplaceFacets(data.facets ?? null);
        setMarketplaceTotal(data.total ?? 0);
      } else if (res.status === 503) {
        setMarketplacePackages([]);
        setMarketplaceTotal(0);
      } else {
        setMarketplaceError('Failed to load marketplace');
      }
    } catch {
      setMarketplacePackages([]);
      setMarketplaceTotal(0);
    } finally {
      setMarketplaceLoading(false);
    }
  }, [searchQuery, typeFilter, categoryFilter]);

  useEffect(() => {
    fetchPacks();
    fetchCommunityPacks();
  }, [fetchPacks, fetchCommunityPacks]);

  // Fetch marketplace when tab is active or filters change
  useEffect(() => {
    if (activeTab === 'marketplace') {
      // Debounce search queries
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetchMarketplace();
      }, searchQuery ? 300 : 0);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [activeTab, fetchMarketplace, searchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ── Client-side sort for marketplace ──
  const sortedPackages = useMemo(() => {
    const sorted = [...marketplacePackages];
    switch (sortOption) {
      case 'popular':
        sorted.sort((a, b) => b.downloads - a.downloads || b.stars - a.stars);
        break;
      case 'updated':
        sorted.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        break;
      case 'name':
        sorted.sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));
        break;
      case 'relevance':
      default:
        // Keep server order (FTS5 rank) when searching, otherwise sort by downloads
        if (!searchQuery) {
          sorted.sort((a, b) => b.downloads - a.downloads || b.stars - a.stars);
        }
        break;
    }
    return sorted;
  }, [marketplacePackages, sortOption, searchQuery]);

  // ── Derive categories from facets ──
  const availableCategories = useMemo(() => {
    if (!marketplaceFacets?.categories) return [];
    return Object.entries(marketplaceFacets.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [marketplaceFacets]);

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

  // ── Install a marketplace package ──
  const handleInstallPackage = useCallback(async (packageId: number) => {
    setInstallingPackageId(packageId);
    try {
      const res = await fetch(`${baseUrl}/api/marketplace/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Update local state to reflect installation
          setMarketplacePackages(prev =>
            prev.map(p => p.id === packageId ? { ...p, installed: true } : p),
          );
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setInstallingPackageId(null);
    }
  }, []);

  // ── Uninstall a marketplace package ──
  const handleUninstallPackage = useCallback(async (packageId: number) => {
    setUninstallingPackageId(packageId);
    try {
      const res = await fetch(`${baseUrl}/api/marketplace/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setMarketplacePackages(prev =>
            prev.map(p => p.id === packageId ? { ...p, installed: false } : p),
          );
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setUninstallingPackageId(null);
    }
  }, []);

  // ── Bulk install community pack ──
  const handleInstallCommunityPack = useCallback(async (slug: string) => {
    const existing = communityInstallProgress[slug];
    if (existing?.installing) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setCommunityInstallProgress(prev => ({
      ...prev,
      [slug]: { installing: true, current: 0, total: 0, currentName: 'Fetching pack details...', errors: [], done: false },
    }));

    try {
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
    handleInstallCommunityPack(slug);
  }, [handleInstallCommunityPack]);

  // ── Create Skill handler ─────────────────────────────────────────────
  const handleCreateSkill = useCallback(async () => {
    if (!newSkillName.trim() || !newSkillDescription.trim()) {
      setCreateError('Name and description are required.');
      return;
    }
    const validSteps = newSkillSteps.filter(s => s.trim().length > 0);
    if (validSteps.length === 0) {
      setCreateError('At least one step is required.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch(`${baseUrl}/api/skills/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkillName.trim(),
          description: newSkillDescription.trim(),
          steps: validSteps,
          category: newSkillCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreateSuccess(`Skill "${data.skill?.name ?? newSkillName}" created successfully.`);
        // Reset form
        setNewSkillName('');
        setNewSkillDescription('');
        setNewSkillSteps(['']);
        setNewSkillCategory('general');
        // Auto-collapse after short delay
        setTimeout(() => {
          setShowCreateSkill(false);
          setCreateSuccess(null);
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to create skill' }));
        setCreateError(err.error ?? 'Failed to create skill');
      }
    } catch {
      setCreateError('Could not reach the server.');
    } finally {
      setCreating(false);
    }
  }, [newSkillName, newSkillDescription, newSkillSteps, newSkillCategory]);

  const handleAddStep = useCallback(() => {
    setNewSkillSteps(prev => [...prev, '']);
  }, []);

  const handleRemoveStep = useCallback((index: number) => {
    setNewSkillSteps(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  }, []);

  const handleStepChange = useCallback((index: number, value: string) => {
    setNewSkillSteps(prev => prev.map((s, i) => i === index ? value : s));
  }, []);

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
    color: variant === 'recommended' ? '#d4a843' : 'var(--primary, #58a6ff)',
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
    background: state === 'active' ? '#3fb950' : state === 'installed' ? 'var(--primary, #58a6ff)' : 'var(--text-muted, #484f58)',
    flexShrink: 0,
  });

  const skillLabelStyle = (state: string): React.CSSProperties => ({
    fontSize: 11,
    color: state === 'active' ? '#3fb950' : state === 'installed' ? 'var(--primary, #58a6ff)' : 'var(--text-muted, #8b949e)',
  });

  const badgeStyle = (state: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    background: state === 'complete' || state === 'installed'
      ? 'rgba(63, 185, 80, 0.15)'
      : state === 'incomplete' ? 'rgba(210, 153, 34, 0.15)' : 'rgba(88, 166, 255, 0.15)',
    color: state === 'complete' || state === 'installed'
      ? '#3fb950'
      : state === 'incomplete' ? '#d29922' : 'var(--primary, #58a6ff)',
  });

  const installBtnStyle = (disabled: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: disabled ? 'var(--bg-secondary, #21262d)' : 'var(--primary, #58a6ff)',
    color: disabled ? 'var(--text-muted, #484f58)' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  });

  const uninstallBtnStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(248, 81, 73, 0.3)',
    background: 'rgba(248, 81, 73, 0.08)',
    color: '#f85149',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, border-color 0.15s',
  };

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

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid var(--border, #232333)',
    background: 'var(--bg-secondary, #161b22)',
    color: 'var(--text, #e6edf3)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const chipRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const chipLabelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted, #8b949e)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginRight: 4,
    flexShrink: 0,
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 12,
    border: active ? '1px solid var(--primary, #58a6ff)' : '1px solid var(--border, #232333)',
    background: active ? 'rgba(88, 166, 255, 0.12)' : 'var(--bg-secondary, #161b22)',
    color: active ? 'var(--primary, #58a6ff)' : 'var(--text-muted, #8b949e)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    flexShrink: 0,
  });

  const packageCardStyle = (isInstalled: boolean): React.CSSProperties => ({
    background: 'var(--bg-secondary, #161b22)',
    border: `1px solid ${isInstalled ? 'rgba(63, 185, 80, 0.2)' : 'var(--border, #232333)'}`,
    borderRadius: 8,
    padding: 14,
    transition: 'border-color 0.15s',
  });

  const typeTagStyle = (type: string): React.CSSProperties => ({
    fontSize: 9,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    background: `${installTypeColor(type)}15`,
    color: installTypeColor(type),
    border: `1px solid ${installTypeColor(type)}25`,
  });

  const categoryTagStyle: React.CSSProperties = {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'var(--bg-secondary, #161b22)',
    color: 'var(--text-muted, #8b949e)',
    border: '1px solid var(--border, #232333)',
  };

  const starStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#d4a843',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  };

  const downloadStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--text-muted, #8b949e)',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 48,
    color: 'var(--text-muted, #8b949e)',
  };

  // ── Total pack count for tab label ──
  const totalPackCount = packs.length + communityPacks.length;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Capabilities</h1>
      <div style={subStyle}>Browse and install capability packs, marketplace packages, and individual skills.</div>

      {/* Tab bar */}
      <div style={tabBarStyle} role="tablist" aria-label="Capability sections">
        <button
          style={tabStyle(activeTab === 'packs')}
          onClick={() => setActiveTab('packs')}
          role="tab"
          aria-selected={activeTab === 'packs'}
          aria-controls="panel-packs"
          className="capabilities-tab-btn"
        >
          Packs ({totalPackCount})
        </button>
        <button
          style={tabStyle(activeTab === 'marketplace')}
          onClick={() => setActiveTab('marketplace')}
          role="tab"
          aria-selected={activeTab === 'marketplace'}
          aria-controls="panel-marketplace"
          className="capabilities-tab-btn"
        >
          Marketplace {marketplaceTotal > 0 ? `(${marketplaceTotal})` : ''}
        </button>
        <button
          style={tabStyle(activeTab === 'skills')}
          onClick={() => setActiveTab('skills')}
          role="tab"
          aria-selected={activeTab === 'skills'}
          aria-controls="panel-skills"
          className="capabilities-tab-btn"
        >
          Individual Skills
        </button>
      </div>

      {/* Pack error */}
      {packError && (
        <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 6, background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', fontSize: 12 }}>
          {packError}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Packs tab
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'packs' && (
        <div id="panel-packs" role="tabpanel" aria-label="Packs">
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

      {/* ════════════════════════════════════════════════════════════════════
          Marketplace tab — search, filter, sort, install/uninstall
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'marketplace' && (
        <div id="panel-marketplace" role="tabpanel" aria-label="Marketplace">
          {/* ── Filter bar ────────────────────────────────────────── */}
          <div style={filterBarStyle}>
            {/* Search input */}
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
              aria-label="Search marketplace packages"
              className="capabilities-search-input"
            />

            {/* Type filter chips */}
            <div style={chipRowStyle}>
              <span style={chipLabelStyle}>Type</span>
              {(['all', 'skill', 'plugin', 'mcp'] as const).map(t => (
                <button
                  key={t}
                  style={chipStyle(typeFilter === t)}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'mcp' ? 'MCP Servers' : `${t.charAt(0).toUpperCase() + t.slice(1)}s`}
                  {t !== 'all' && marketplaceFacets?.types?.[t] != null && (
                    <span style={{ opacity: 0.6, marginLeft: 4 }}>
                      {marketplaceFacets.types[t]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Category filter chips */}
            {availableCategories.length > 0 && (
              <div style={chipRowStyle}>
                <span style={chipLabelStyle}>Category</span>
                <button
                  style={chipStyle(categoryFilter === 'all')}
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </button>
                {availableCategories.map(cat => (
                  <button
                    key={cat.name}
                    style={chipStyle(categoryFilter === cat.name)}
                    onClick={() => setCategoryFilter(cat.name)}
                  >
                    {cat.name}
                    <span style={{ opacity: 0.6, marginLeft: 4 }}>{cat.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sort */}
            <div style={chipRowStyle}>
              <span style={chipLabelStyle}>Sort</span>
              {([
                { key: 'popular', label: 'Most Popular' },
                { key: 'relevance', label: 'Relevance' },
                { key: 'updated', label: 'Recently Updated' },
                { key: 'name', label: 'Name A-Z' },
              ] as const).map(s => (
                <button
                  key={s.key}
                  style={chipStyle(sortOption === s.key)}
                  onClick={() => setSortOption(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Marketplace error ──────────────────────────────────── */}
          {marketplaceError && (
            <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 6, background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', fontSize: 12 }}>
              {marketplaceError}
              <button
                onClick={fetchMarketplace}
                style={{
                  float: 'right',
                  background: 'none',
                  border: '1px solid rgba(248, 81, 73, 0.3)',
                  borderRadius: 4,
                  color: '#f85149',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  fontSize: 11,
                  fontFamily: 'inherit',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────────── */}
          {marketplaceLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 24, textAlign: 'center' }}>
              Loading marketplace packages...
            </div>
          ) : sortedPackages.length === 0 ? (
            /* ── Empty state ──────────────────────────────────────── */
            <div style={emptyStateStyle}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
                {searchQuery ? '\u{1F50D}' : '\u{1F4E6}'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text, #e6edf3)' }}>
                {searchQuery
                  ? 'No packages match your filters'
                  : 'Marketplace is empty'}
              </div>
              <div style={{ fontSize: 11 }}>
                {searchQuery
                  ? 'Try adjusting your search query or removing some filters.'
                  : 'No packages available. Try syncing the marketplace.'}
              </div>
              {(searchQuery || typeFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  style={{
                    ...chipStyle(false),
                    marginTop: 12,
                    padding: '5px 16px',
                  }}
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            /* ── Package grid ─────────────────────────────────────── */
            <>
              {/* Result count */}
              <div style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)', marginBottom: 12 }}>
                {sortedPackages.length} package{sortedPackages.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                {sortedPackages.map(pkg => {
                  const isInstalling = installingPackageId === pkg.id;
                  const isUninstalling = uninstallingPackageId === pkg.id;

                  return (
                    <div key={pkg.id} style={packageCardStyle(pkg.installed)} data-testid={`marketplace-pkg-${pkg.id}`}>
                      {/* Top row: name + badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #e6edf3)' }}>
                              {pkg.display_name || pkg.name}
                            </span>
                            <span style={typeTagStyle(pkg.waggle_install_type)}>
                              {installTypeLabel(pkg.waggle_install_type)}
                            </span>
                            {pkg.installed && (
                              <span style={badgeStyle('installed')}>Installed</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted, #8b949e)',
                        marginBottom: 10,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {pkg.description}
                      </div>

                      {/* Bottom row: metadata + action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left: category + stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {pkg.category && (
                            <span style={categoryTagStyle}>{pkg.category}</span>
                          )}
                          {pkg.stars > 0 && (
                            <span style={starStyle}>
                              <span style={{ fontSize: 11 }}>{'\u2605'}</span>
                              {formatDownloads(pkg.stars)}
                            </span>
                          )}
                          {pkg.downloads > 0 && (
                            <span style={downloadStyle}>
                              <span style={{ fontSize: 11 }}>{'\u2193'}</span>
                              {formatDownloads(pkg.downloads)}
                            </span>
                          )}
                        </div>

                        {/* Right: action button */}
                        <div style={{ flexShrink: 0, marginLeft: 8 }}>
                          {pkg.installed ? (
                            <button
                              style={uninstallBtnStyle}
                              onClick={() => handleUninstallPackage(pkg.id)}
                              disabled={isUninstalling}
                            >
                              {isUninstalling ? 'Removing...' : 'Uninstall'}
                            </button>
                          ) : (
                            <button
                              style={installBtnStyle(isInstalling)}
                              onClick={() => handleInstallPackage(pkg.id)}
                              disabled={isInstalling}
                            >
                              {isInstalling ? 'Installing...' : 'Install'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Individual Skills tab — reuses existing InstallCenter
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'skills' && (
        <div id="panel-skills" role="tabpanel" aria-label="Individual Skills">
          {/* ── Create Skill panel ── */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => { setShowCreateSkill(v => !v); setCreateError(null); setCreateSuccess(null); }}
              style={{
                background: showCreateSkill ? 'var(--surface-hover, #292e36)' : 'var(--surface, #1c2028)',
                color: 'var(--text, #e6edf3)',
                border: '1px solid var(--border, #30363d)',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              data-testid="create-skill-toggle"
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{showCreateSkill ? '\u2212' : '+'}</span>
              Create Skill
            </button>

            {showCreateSkill && (
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: 'var(--surface, #1c2028)',
                  border: '1px solid var(--border, #30363d)',
                  borderRadius: 8,
                }}
                data-testid="create-skill-form"
              >
                {/* Name */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #8b949e)', marginBottom: 4 }}>
                  Name (kebab-case)
                </label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  placeholder="my-research-workflow"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 13,
                    background: 'var(--input-bg, #0d1117)',
                    color: 'var(--text, #e6edf3)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 4,
                    marginBottom: 12,
                    boxSizing: 'border-box' as const,
                  }}
                  data-testid="create-skill-name"
                />

                {/* Description */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #8b949e)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={newSkillDescription}
                  onChange={e => setNewSkillDescription(e.target.value)}
                  placeholder="What this skill does..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 13,
                    background: 'var(--input-bg, #0d1117)',
                    color: 'var(--text, #e6edf3)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 4,
                    marginBottom: 12,
                    resize: 'vertical' as const,
                    boxSizing: 'border-box' as const,
                  }}
                  data-testid="create-skill-description"
                />

                {/* Steps */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #8b949e)', marginBottom: 4 }}>
                  Steps
                </label>
                {newSkillSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)', minWidth: 18 }}>{i + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={e => handleStepChange(i, e.target.value)}
                      placeholder={`Step ${i + 1}...`}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        fontSize: 12,
                        background: 'var(--input-bg, #0d1117)',
                        color: 'var(--text, #e6edf3)',
                        border: '1px solid var(--border, #30363d)',
                        borderRadius: 4,
                      }}
                      data-testid={`create-skill-step-${i}`}
                    />
                    {newSkillSteps.length > 1 && (
                      <button
                        onClick={() => handleRemoveStep(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted, #8b949e)',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: '2px 4px',
                        }}
                        title="Remove step"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddStep}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--border, #30363d)',
                    color: 'var(--text-muted, #8b949e)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                    marginBottom: 12,
                  }}
                >
                  + Add step
                </button>

                {/* Category */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #8b949e)', marginBottom: 4 }}>
                  Category
                </label>
                <select
                  value={newSkillCategory}
                  onChange={e => setNewSkillCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 13,
                    background: 'var(--input-bg, #0d1117)',
                    color: 'var(--text, #e6edf3)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 4,
                    marginBottom: 16,
                    boxSizing: 'border-box' as const,
                  }}
                  data-testid="create-skill-category"
                >
                  <option value="general">General</option>
                  <option value="research">Research</option>
                  <option value="writing">Writing</option>
                  <option value="coding">Coding</option>
                  <option value="planning">Planning</option>
                  <option value="knowledge">Knowledge</option>
                  <option value="marketing">Marketing</option>
                  <option value="communication">Communication</option>
                </select>

                {/* Error / Success */}
                {createError && (
                  <div style={{ padding: '6px 10px', marginBottom: 10, borderRadius: 4, background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', fontSize: 12 }}>
                    {createError}
                  </div>
                )}
                {createSuccess && (
                  <div style={{ padding: '6px 10px', marginBottom: 10, borderRadius: 4, background: 'rgba(63, 185, 80, 0.1)', color: '#3fb950', fontSize: 12 }}>
                    {createSuccess}
                  </div>
                )}

                {/* Create button */}
                <button
                  onClick={handleCreateSkill}
                  disabled={creating}
                  style={{
                    background: creating ? 'var(--surface-hover, #292e36)' : '#d4a843',
                    color: creating ? 'var(--text-muted, #8b949e)' : '#000',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: creating ? 'default' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                  }}
                  data-testid="create-skill-submit"
                >
                  {creating ? 'Creating...' : 'Create Skill'}
                </button>
              </div>
            )}
          </div>

          <InstallCenter />
        </div>
      )}
    </div>
  );
}
