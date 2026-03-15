/**
 * CockpitView — Wave 1.4 Control Cockpit.
 *
 * Real-time dashboard with 4 sections:
 *   1. System Health (LLM + DB status, auto-refresh 30s)
 *   2. Cron Schedules (list, toggle, trigger)
 *   3. Runtime Overview (tool/skill/plugin/MCP/command counts)
 *   4. Usage (placeholder for future token tracking)
 */

import React, { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────

interface HealthData {
  status: 'ok' | 'degraded' | 'unavailable';
  mode: string;
  timestamp: string;
  llm: {
    provider: string;
    health: string;
    detail: string;
    checkedAt: string;
  };
  database: { healthy: boolean };
}

interface CronSchedule {
  id: number;
  name: string;
  cronExpr: string;
  jobType: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface AuditEntry {
  id: number;
  timestamp: string;
  capabilityName: string;
  capabilityType: string;
  source: string;
  riskLevel: 'low' | 'medium' | 'high';
  trustSource: string;
  approvalClass: string;
  action: 'proposed' | 'approved' | 'installed' | 'rejected' | 'failed';
  initiator: string;
  detail: string;
}

interface CapabilitiesData {
  plugins: Array<{ name: string; state: string; tools: number; skills: number }>;
  mcpServers: Array<{ name: string; state: string; healthy: boolean; tools: number }>;
  skills: Array<{ name: string; length: number }>;
  tools: { count: number; native: number; plugin: number; mcp: number };
  commands: Array<{ name: string; description: string; usage: string }>;
  hooks: { registered: number };
  workflows: Array<{ name: string; description: string; steps: number }>;
}

// ── Constants ────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:3333';
const REFRESH_INTERVAL = 30_000;

// ── Component ────────────────────────────────────────────────────────────

export function CockpitView() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<CapabilitiesData | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Fetchers ─────────────────────────────────────────────────────────

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        setHealth(await res.json());
        setHealthError(false);
      } else {
        setHealthError(true);
      }
    } catch {
      setHealthError(true);
      setHealth(null);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cron`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules ?? []);
      }
    } catch { /* silent */ }
    finally { setSchedulesLoading(false); }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/audit/installs?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setAuditEntries(data.entries ?? []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchCapabilities = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/capabilities/status`);
      if (res.ok) {
        setCapabilities(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchHealth();
    fetchSchedules();
    fetchCapabilities();
    fetchAudit();

    const interval = setInterval(fetchHealth, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchSchedules, fetchCapabilities, fetchAudit]);

  // ── Actions ──────────────────────────────────────────────────────────

  const toggleSchedule = useCallback(async (id: number, currentEnabled: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`${BASE_URL}/api/cron/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        await fetchSchedules();
      }
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  }, [fetchSchedules]);

  const triggerSchedule = useCallback(async (id: number) => {
    setTriggeringId(id);
    try {
      const res = await fetch(`${BASE_URL}/api/cron/${id}/trigger`, { method: 'POST' });
      if (res.ok) {
        await fetchSchedules();
      }
    } catch { /* silent */ }
    finally { setTriggeringId(null); }
  }, [fetchSchedules]);

  // ── Helpers ──────────────────────────────────────────────────────────

  const formatTime = (iso: string | null): string => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '--'; }
  };

  const relativeTime = (iso: string): string => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      if (diff < 0) return 'just now';
      const secs = Math.floor(diff / 1000);
      if (secs < 60) return 'just now';
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} hr ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch { return '--'; }
  };

  const actionDotColor = (action: string): string => {
    switch (action) {
      case 'installed': return '#3fb950';
      case 'proposed': return '#58a6ff';
      case 'approved': return '#d29922';
      case 'failed': case 'rejected': return '#f85149';
      default: return '#8b949e';
    }
  };

  const riskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return '#3fb950';
      case 'medium': return '#d29922';
      case 'high': return '#f85149';
      default: return '#8b949e';
    }
  };

  const statusColor = (status: string): string => {
    switch (status) {
      case 'ok': case 'healthy': return '#3fb950';
      case 'degraded': return '#d29922';
      default: return '#f85149';
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    padding: '24px 32px',
    maxWidth: 960,
    margin: '0 auto',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: 16,
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border, #232333)',
    borderRadius: 8,
    padding: 16,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text, #e6edf3)',
    marginBottom: 12,
    letterSpacing: '0.02em',
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    display: 'inline-block',
  });

  const statCardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border, #232333)',
    borderRadius: 6,
    padding: '10px 14px',
    textAlign: 'center' as const,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--primary, #58a6ff)',
    lineHeight: 1,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--text-muted, #8b949e)',
    marginTop: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    fontSize: 12,
    color: 'var(--text, #e6edf3)',
  };

  const mutedStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-muted, #8b949e)',
  };

  const smallBtnStyle = (disabled: boolean): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid var(--border, #232333)',
    background: disabled ? '#21262d' : 'transparent',
    color: disabled ? '#484f58' : 'var(--text-muted, #8b949e)',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  });

  const toggleStyle = (enabled: boolean, disabled: boolean): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 4,
    border: 'none',
    background: enabled ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.1)',
    color: enabled ? '#3fb950' : '#f85149',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  });

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      <div style={headingStyle}>Cockpit</div>
      <div style={subStyle}>Health, schedules, runtime status, usage, and audit trail.</div>

      <div style={gridStyle}>
        {/* ── Section 1: System Health ─────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>System Health</div>

          {healthError && !health ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>
              Server unreachable. Is the server running on localhost:3333?
            </div>
          ) : !health ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Overall */}
              <div style={rowStyle}>
                <span style={dotStyle(statusColor(health.status))} />
                <span style={{ fontWeight: 600 }}>Overall:</span>
                <span style={{ color: statusColor(health.status), textTransform: 'uppercase' as const, fontSize: 11, fontWeight: 600 }}>
                  {health.status}
                </span>
              </div>

              {/* LLM */}
              <div style={rowStyle}>
                <span style={dotStyle(statusColor(health.llm.health))} />
                <span>LLM Provider:</span>
                <span style={{ color: 'var(--primary, #58a6ff)' }}>{health.llm.provider || 'none'}</span>
                <span style={mutedStyle}>({health.llm.health})</span>
              </div>
              {health.llm.detail && (
                <div style={{ ...mutedStyle, paddingLeft: 16 }}>{health.llm.detail}</div>
              )}

              {/* Database */}
              <div style={rowStyle}>
                <span style={dotStyle(health.database.healthy ? '#3fb950' : '#f85149')} />
                <span>Database:</span>
                <span style={{ color: health.database.healthy ? '#3fb950' : '#f85149' }}>
                  {health.database.healthy ? 'healthy' : 'unhealthy'}
                </span>
              </div>

              {/* Refresh note */}
              <div style={{ ...mutedStyle, paddingTop: 4, borderTop: '1px solid var(--border, #232333)' }}>
                Auto-refreshes every 30s
                {health.timestamp && ` | Last: ${formatTime(health.timestamp)}`}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: Cron Schedules ───────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Cron Schedules</div>

          {schedulesLoading ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>
              No schedules configured. Create one via the agent or API.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {schedules.map(s => (
                <div key={s.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  border: '1px solid var(--border, #232333)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={dotStyle(s.enabled ? '#3fb950' : '#484f58')} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #e6edf3)' }}>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        style={toggleStyle(s.enabled, togglingId === s.id)}
                        onClick={() => toggleSchedule(s.id, s.enabled)}
                        disabled={togglingId === s.id}
                      >
                        {s.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        style={smallBtnStyle(triggeringId === s.id)}
                        onClick={() => triggerSchedule(s.id)}
                        disabled={triggeringId === s.id}
                      >
                        {triggeringId === s.id ? 'Running...' : 'Trigger'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, ...mutedStyle }}>
                    <span>cron: {s.cronExpr}</span>
                    <span>type: {s.jobType}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 2, ...mutedStyle }}>
                    <span>last: {formatTime(s.lastRunAt)}</span>
                    <span>next: {formatTime(s.nextRunAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 3: Runtime Overview ─────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Runtime Overview</div>

          {!capabilities ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>Loading capabilities...</div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.tools.count}</div>
                  <div style={statLabelStyle}>Tools</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.skills.length}</div>
                  <div style={statLabelStyle}>Skills</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.commands.length}</div>
                  <div style={statLabelStyle}>Commands</div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.plugins.length}</div>
                  <div style={statLabelStyle}>Plugins</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.mcpServers.length}</div>
                  <div style={statLabelStyle}>MCP Servers</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{capabilities.workflows.length}</div>
                  <div style={statLabelStyle}>Workflows</div>
                </div>
              </div>

              {/* Tool breakdown */}
              <div style={{ ...mutedStyle, display: 'flex', gap: 12 }}>
                <span>Native: {capabilities.tools.native}</span>
                <span>Plugin: {capabilities.tools.plugin}</span>
                <span>MCP: {capabilities.tools.mcp}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Section 4: Usage (placeholder) ──────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Usage</div>
          <div style={{
            padding: 16,
            textAlign: 'center' as const,
            color: 'var(--text-muted, #8b949e)',
            fontSize: 12,
          }}>
            Usage tracking coming in a future update.
          </div>
        </div>

        {/* ── Section 5: Install Audit Trail ───────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Install Audit Trail</div>

          {auditEntries.length === 0 ? (
            <div style={{ ...mutedStyle, padding: '8px 0' }}>
              No install events recorded yet. Install a skill to see audit history.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {auditEntries.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 0',
                  fontSize: 12,
                  color: 'var(--text, #e6edf3)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={dotStyle(actionDotColor(entry.action))} title={entry.action} />
                  <span style={{ fontWeight: 600, minWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {entry.capabilityName}
                  </span>
                  <span style={{ color: actionDotColor(entry.action), fontSize: 11, minWidth: 60 }}>
                    {entry.action}
                  </span>
                  <span style={{ color: riskColor(entry.riskLevel), fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, minWidth: 36 }}>
                    {entry.riskLevel}
                  </span>
                  <span style={{ ...mutedStyle, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {entry.trustSource.replace(/_/g, ' ')}
                  </span>
                  <span style={{ ...mutedStyle, flexShrink: 0 }}>
                    {relativeTime(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
