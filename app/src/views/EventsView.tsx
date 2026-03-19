/**
 * EventsView — Wrapper around EventStream from @waggle/ui.
 * Includes a "Session Replay" tab for browsing tool event timelines.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AgentStep, StepFilter, TimelineEvent } from '@waggle/ui';
import { EventStream, SessionTimeline } from '@waggle/ui';

export interface EventsViewProps {
  steps: AgentStep[];
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  filter: StepFilter;
  onFilterChange: (f: StepFilter) => void;
  workspaceId?: string;
  serverUrl?: string;
}

interface SessionOption {
  id: string;
  title: string;
  lastActive: string;
}

type ViewTab = 'live' | 'replay';

export function EventsView({
  steps,
  autoScroll,
  onToggleAutoScroll,
  filter,
  onFilterChange,
  workspaceId,
  serverUrl = 'http://localhost:3333',
}: EventsViewProps) {
  const [tab, setTab] = useState<ViewTab>('live');
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Fetch sessions when switching to replay tab
  const fetchSessions = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${serverUrl}/api/workspaces/${workspaceId}/sessions`);
      if (res.ok) {
        const data: SessionOption[] = await res.json();
        setSessions(data);
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch {
      // Network error — sessions will remain empty
    } finally {
      setLoadingSessions(false);
    }
  }, [workspaceId, serverUrl, selectedSessionId]);

  // Fetch timeline when session changes
  const fetchTimeline = useCallback(async () => {
    if (!workspaceId || !selectedSessionId) {
      setTimeline([]);
      return;
    }
    setLoadingTimeline(true);
    try {
      const res = await fetch(
        `${serverUrl}/api/workspaces/${workspaceId}/sessions/${selectedSessionId}/timeline`
      );
      if (res.ok) {
        const data: TimelineEvent[] = await res.json();
        setTimeline(data);
      } else {
        setTimeline([]);
      }
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }, [workspaceId, selectedSessionId, serverUrl]);

  useEffect(() => {
    if (tab === 'replay') {
      fetchSessions();
    }
  }, [tab, fetchSessions]);

  useEffect(() => {
    if (tab === 'replay' && selectedSessionId) {
      fetchTimeline();
    }
  }, [tab, selectedSessionId, fetchTimeline]);

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          background: 'var(--bg-secondary, #18181b)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setTab('live')}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: tab === 'live' ? 600 : 400,
            background: tab === 'live' ? 'rgba(212,168,67,0.15)' : 'transparent',
            color: tab === 'live' ? '#d4a843' : 'var(--text-muted, #a1a1aa)',
          }}
        >
          Live Events
        </button>
        <button
          type="button"
          onClick={() => setTab('replay')}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: tab === 'replay' ? 600 : 400,
            background: tab === 'replay' ? 'rgba(212,168,67,0.15)' : 'transparent',
            color: tab === 'replay' ? '#d4a843' : 'var(--text-muted, #a1a1aa)',
          }}
        >
          Session Replay
        </button>
      </div>

      {/* Tab content */}
      {tab === 'live' ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <EventStream
            steps={steps}
            autoScroll={autoScroll}
            onToggleAutoScroll={onToggleAutoScroll}
            filter={filter}
            onFilterChange={onFilterChange}
          />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Session picker */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              flexShrink: 0,
            }}
          >
            {loadingSessions ? (
              <span style={{ fontSize: 11, color: 'var(--text-dim, #71717a)' }}>
                Loading sessions...
              </span>
            ) : sessions.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text-dim, #71717a)' }}>
                {workspaceId ? 'No sessions found' : 'Select a workspace first'}
              </span>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(212,168,67,0.2)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-primary, #e4e4e7)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || s.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}>
            <SessionTimeline events={timeline} loading={loadingTimeline} />
          </div>
        </div>
      )}
    </div>
  );
}
