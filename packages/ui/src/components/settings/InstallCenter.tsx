/**
 * InstallCenter — main Install Center component providing curated skill
 * browsing with runtime status and governed install flow.
 *
 * Matches the dark-theme inline-style pattern used by CapabilitySection.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { StarterCatalogResponse } from '../../services/types.js';
import { SkillCard } from './SkillCard.js';

// ── Types ────────────────────────────────────────────────────────────────

export interface InstallCenterProps {
  baseUrl?: string;
}

interface CapabilityData {
  plugins: Array<{ name: string; state: string; tools: number; skills: number }>;
  mcpServers: Array<{ name: string; state: string; healthy: boolean; tools: number }>;
  skills: Array<{ name: string; length: number }>;
  tools: { count: number; native: number; plugin: number; mcp: number };
  commands: Array<{ name: string; description: string; usage?: string }>;
  hooks: { registered: number; recentActivity: Array<{ event: string; timestamp: number; cancelled: boolean; reason?: string }> };
  workflows: Array<{ name: string; description: string; steps: number }>;
}

// ── Styles ───────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = { marginBottom: 32 };

const headingStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text, #e0e0e0)',
  marginBottom: 8,
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted, #888)',
  marginBottom: 16,
};

const pillStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'var(--bg-tertiary, #1a1a2e)',
  border: '1px solid var(--border, #333)',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  color: 'var(--text, #e0e0e0)',
};

const pillValueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--brand, #E8920F)',
  marginRight: 4,
};

const familyTabStyle: React.CSSProperties = {
  background: 'var(--bg-secondary, #222)',
  border: '1px solid var(--border, #333)',
  borderRadius: 16,
  padding: '4px 14px',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted, #888)',
  cursor: 'pointer',
};

const familyTabActiveStyle: React.CSSProperties = {
  borderColor: '#3b82f6',
  color: '#3b82f6',
  background: '#3b82f622',
};

// ── Component ────────────────────────────────────────────────────────────

export function InstallCenter({ baseUrl = 'http://127.0.0.1:3333' }: InstallCenterProps) {
  const [catalog, setCatalog] = useState<StarterCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFamily, setActiveFamily] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingSkillId, setInstallingSkillId] = useState<string | null>(null);
  const [confirmingSkillId, setConfirmingSkillId] = useState<string | null>(null);
  const [runtimeData, setRuntimeData] = useState<CapabilityData | null>(null);
  const [runtimeExpanded, setRuntimeExpanded] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [catalogRes, runtimeRes] = await Promise.all([
        fetch(`${baseUrl}/api/skills/starter-pack/catalog`),
        fetch(`${baseUrl}/api/capabilities/status`),
      ]);

      if (catalogRes.ok) {
        setCatalog(await catalogRes.json());
      } else {
        setError(`Failed to load catalog (${catalogRes.status})`);
      }

      if (runtimeRes.ok) {
        setRuntimeData(await runtimeRes.json());
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Install flow (governed) ──────────────────────────────────────────

  const handleInstallClick = useCallback((skillId: string) => {
    setConfirmingSkillId(skillId);
  }, []);

  const handleConfirmInstall = useCallback(async (skillId: string) => {
    setConfirmingSkillId(null);
    setInstallingSkillId(skillId);

    try {
      await fetch(`${baseUrl}/api/skills/starter-pack/${encodeURIComponent(skillId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Re-fetch catalog to get truthful state from server (NO optimistic update)
      const res = await fetch(`${baseUrl}/api/skills/starter-pack/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Install failed');
    } finally {
      setInstallingSkillId(null);
    }
  }, [baseUrl]);

  // ── Loading / error guards ───────────────────────────────────────────

  if (loading) {
    return <div style={{ color: 'var(--text-dim, #555)', padding: 24 }}>Loading Install Center...</div>;
  }

  if (error && !catalog) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{
          background: '#3b1818',
          border: '1px solid #7f1d1d',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#f87171',
          fontSize: 13,
        }}>
          {error}
          <button onClick={fetchData} style={{
            float: 'right',
            background: 'none',
            border: '1px solid #7f1d1d',
            borderRadius: 4,
            color: '#f87171',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: 11,
          }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!catalog) return null;

  // ── Filtering ────────────────────────────────────────────────────────

  const filteredSkills = catalog.skills.filter(s => {
    if (activeFamily !== 'all' && s.family !== activeFamily) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* 1. Runtime Status (collapsible) */}
      <div style={sectionStyle}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setRuntimeExpanded(!runtimeExpanded)}
        >
          <div style={headingStyle}>Runtime Status</div>
          <button style={{
            background: 'none',
            border: '1px solid var(--border, #333)',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-muted, #888)',
          }}>
            {runtimeExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div style={subStyle}>Current agent capabilities — tools, skills, plugins, and extensions.</div>
        {runtimeExpanded && runtimeData && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.tools.count}</span> tools</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.skills.length}</span> skills</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.plugins.filter(p => p.state === 'active').length}</span> / {runtimeData.plugins.length} plugins</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.mcpServers.filter(s => s.healthy).length}</span> / {runtimeData.mcpServers.length} MCP</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.commands.length}</span> commands</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.hooks.registered}</span> hooks</span>
            <span style={pillStyle}><span style={pillValueStyle}>{runtimeData.workflows.length}</span> workflows</span>
          </div>
        )}
      </div>

      {/* 2. Install Center header */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Install Center</div>
        <div style={subStyle}>Browse and install curated skills to expand your agent's capabilities.</div>
      </div>

      {/* 3. Non-fatal error banner */}
      {error && (
        <div style={{
          background: '#3b1818',
          border: '1px solid #7f1d1d',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#f87171',
          fontSize: 13,
          marginBottom: 12,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{
            float: 'right',
            background: 'none',
            border: '1px solid #7f1d1d',
            borderRadius: 4,
            color: '#f87171',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: 11,
          }}>Dismiss</button>
        </div>
      )}

      {/* 4. Family tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setActiveFamily('all')}
          style={{
            ...familyTabStyle,
            ...(activeFamily === 'all' ? familyTabActiveStyle : {}),
          }}
        >
          All
        </button>
        {catalog.families.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFamily(f.id)}
            style={{
              ...familyTabStyle,
              ...(activeFamily === f.id ? familyTabActiveStyle : {}),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 5. Search input */}
      <input
        type="text"
        placeholder="Search skills..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 13,
          borderRadius: 6,
          border: '1px solid var(--border, #333)',
          background: 'var(--bg-secondary, #222)',
          color: 'var(--text, #e0e0e0)',
          marginBottom: 16,
          outline: 'none',
        }}
      />

      {/* 6. Confirmation dialog (inline) */}
      {confirmingSkillId && (
        <div style={{
          background: 'var(--bg-tertiary, #1a1a2e)',
          border: '1px solid #3b82f6',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text, #e0e0e0)' }}>
            Install <strong>{catalog.skills.find(s => s.id === confirmingSkillId)?.name}</strong>?
            This will add the skill to your agent's capabilities.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setConfirmingSkillId(null)}
              style={{
                background: 'none',
                border: '1px solid var(--border, #333)',
                borderRadius: 6,
                padding: '4px 14px',
                fontSize: 12,
                color: 'var(--text-muted, #888)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmInstall(confirmingSkillId)}
              style={{
                background: '#3b82f6',
                border: 'none',
                borderRadius: 6,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* 7. Skill grid */}
      {filteredSkills.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-dim, #555)', padding: 24 }}>
          {searchQuery ? 'No skills match your search.' : 'All skills in this category are installed!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onInstall={handleInstallClick}
              installing={installingSkillId === skill.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
