/**
 * MissionControlView — Agent fleet command center.
 *
 * Shows active workspace sessions with status, controls (pause/resume/kill),
 * and resource usage. Complements Cockpit (system health) with agent-focused ops.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const BASE_URL = 'http://127.0.0.1:3333';
const REFRESH_INTERVAL = 3_000; // 3s for live agent status

interface FleetSession {
  workspaceId: string;
  personaId: string | null;
  status: 'active' | 'paused' | 'error';
  lastActivity: number;
  durationMs: number;
  toolCount: number;
}

interface FleetData {
  sessions: FleetSession[];
  count: number;
  maxSessions: number;
}

// ── Persona display helpers ──────────────────────────────────────────

const PERSONA_ICONS: Record<string, string> = {
  researcher: '🔬',
  writer: '✍️',
  analyst: '📊',
  coder: '💻',
  'project-manager': '📋',
  'executive-assistant': '📧',
  'sales-rep': '🎯',
  marketer: '📢',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--accent, #d4a843)',
  paused: 'var(--muted, #666)',
  error: '#ef4444',
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

// ── Agent Fleet Card ─────────────────────────────────────────────────

function AgentFleetCard({
  session,
  onPause,
  onResume,
  onKill,
}: {
  session: FleetSession;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onKill: (id: string) => void;
}) {
  const icon = session.personaId ? PERSONA_ICONS[session.personaId] ?? '🤖' : '🤖';
  const statusColor = STATUS_COLORS[session.status] ?? '#666';

  return (
    <Card className="direction-d-card" style={{ borderLeft: `3px solid ${statusColor}` }}>
      <CardContent style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>
                {session.workspaceId.slice(0, 12)}
                {session.personaId && (
                  <span style={{ marginLeft: '6px', opacity: 0.7, fontWeight: 400, fontSize: '11px' }}>
                    {session.personaId}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusColor,
                    marginRight: '4px',
                    animation: session.status === 'active' ? 'pulse 2s infinite' : 'none',
                  }}
                />
                {session.status} · {formatDuration(session.durationMs)} · {session.toolCount} tools
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {session.status === 'active' && (
              <button
                onClick={() => onPause(session.workspaceId)}
                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border, #333)', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
              >
                Pause
              </button>
            )}
            {session.status === 'paused' && (
              <button
                onClick={() => onResume(session.workspaceId)}
                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--accent, #d4a843)', background: 'transparent', cursor: 'pointer', color: 'var(--accent, #d4a843)' }}
              >
                Resume
              </button>
            )}
            <button
              onClick={() => onKill(session.workspaceId)}
              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ef4444', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
            >
              Kill
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main View ────────────────────────────────────────────────────────

export function MissionControlView() {
  const [fleet, setFleet] = useState<FleetData>({ sessions: [], count: 0, maxSessions: 3 });
  const [error, setError] = useState<string | null>(null);

  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/fleet`);
      if (res.ok) {
        setFleet(await res.json());
        setError(null);
      }
    } catch {
      setError('Cannot reach server');
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    const timer = setInterval(fetchFleet, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchFleet]);

  const handleAction = async (workspaceId: string, action: 'pause' | 'resume' | 'kill') => {
    try {
      await fetch(`${BASE_URL}/api/fleet/${workspaceId}/${action}`, { method: 'POST' });
      await fetchFleet();
    } catch { /* silent */ }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          Mission Control
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.6 }}>
          Agent fleet overview · {fleet.count}/{fleet.maxSessions} sessions active
        </p>
      </div>

      {error && (
        <Card className="direction-d-card" style={{ marginBottom: '16px', borderLeft: '3px solid #ef4444' }}>
          <CardContent style={{ padding: '12px 16px', fontSize: '13px', color: '#ef4444' }}>
            {error}
          </CardContent>
        </Card>
      )}

      {/* Agent Fleet */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', opacity: 0.8 }}>
          Active Agents
        </h2>
        {fleet.sessions.length === 0 ? (
          <Card className="direction-d-card">
            <CardContent style={{ padding: '24px', textAlign: 'center', fontSize: '13px', opacity: 0.5 }}>
              No active agents. Open a workspace and start chatting to see agents here.
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fleet.sessions.map((session) => (
              <AgentFleetCard
                key={session.workspaceId}
                session={session}
                onPause={(id) => handleAction(id, 'pause')}
                onResume={(id) => handleAction(id, 'resume')}
                onKill={(id) => handleAction(id, 'kill')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resource Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Card className="direction-d-card">
          <CardContent style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #d4a843)' }}>
              {fleet.count}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Active Sessions</div>
          </CardContent>
        </Card>
        <Card className="direction-d-card">
          <CardContent style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #d4a843)' }}>
              {fleet.maxSessions}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Max Concurrent</div>
          </CardContent>
        </Card>
        <Card className="direction-d-card">
          <CardContent style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #d4a843)' }}>
              {fleet.sessions.reduce((sum, s) => sum + s.toolCount, 0)}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>Total Tools</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
