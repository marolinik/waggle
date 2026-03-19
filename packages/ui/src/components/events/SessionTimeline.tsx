/**
 * SessionTimeline — clickable vertical timeline of tool events from a session.
 *
 * Shows every tool call with timestamp, tool name, status dot, and duration.
 * Click to expand and see full input/output as formatted JSON.
 * Sub-agent calls (spawn_agent) render as nested child events.
 */

import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  timestamp: string;
  toolName: string;
  status: 'success' | 'error';
  durationMs: number | null;
  inputPreview: string;
  outputPreview: string;
  fullInput: Record<string, unknown>;
  fullOutput: Record<string, unknown>;
  children?: TimelineEvent[];
}

export interface SessionTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, string> = {
  web_search: 'magnifier',
  web_fetch: 'globe',
  search_memory: 'brain',
  save_memory: 'brain',
  bash: 'terminal',
  read_file: 'file',
  write_file: 'file',
  edit_file: 'pen',
  search_files: 'magnifier',
  search_content: 'magnifier',
  git_status: 'git',
  git_diff: 'git',
  git_log: 'git',
  git_commit: 'git',
  spawn_agent: 'agent',
  create_plan: 'plan',
  generate_docx: 'doc',
};

export function getToolIcon(toolName: string): string {
  return TOOL_ICONS[toolName] ?? 'tool';
}

/**
 * Format duration in milliseconds to a human-readable string.
 * - null: empty string
 * - <1000ms: "250ms"
 * - 1000-59999ms: "1.2s"
 * - >=60000ms: "2m 30s"
 */
export function formatTimelineDuration(ms: number | null): string {
  if (ms === null) return '';
  const whole = Math.floor(ms);
  if (whole < 1000) return `${whole}ms`;
  if (whole < 60000) return `${(whole / 1000).toFixed(1)}s`;
  const minutes = Math.floor(whole / 60000);
  const seconds = Math.floor((whole % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format an ISO timestamp to a relative time string.
 */
export function formatTimelineTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ── Status colors (Direction D: amber accent, zinc neutrals) ─────────

const STATUS_COLORS = {
  success: '#22c55e',
  error: '#ef4444',
};

// ── Single Event Row ──────────────────────────────────────────────────

function TimelineEventRow({
  event,
  expanded,
  onToggle,
  nested = false,
}: {
  event: TimelineEvent;
  expanded: boolean;
  onToggle: () => void;
  nested?: boolean;
}) {
  const statusColor = STATUS_COLORS[event.status];

  return (
    <div
      className="session-timeline__event"
      style={{
        marginLeft: nested ? 28 : 0,
        marginBottom: 2,
      }}
    >
      {/* Clickable header row */}
      <button
        className="session-timeline__event-header"
        onClick={onToggle}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          textAlign: 'left',
          color: 'var(--text-primary, #e4e4e7)',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
        }}
      >
        {/* Status dot */}
        <span
          className="session-timeline__status-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
          title={event.status}
        />

        {/* Timestamp */}
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-dim, #71717a)',
            fontFamily: 'JetBrains Mono, monospace',
            flexShrink: 0,
          }}
        >
          {formatTimelineTimestamp(event.timestamp)}
        </span>

        {/* Tool icon + name */}
        <span style={{ fontSize: 10, flexShrink: 0 }}>
          {getToolIcon(event.toolName)}
        </span>
        <span
          style={{
            fontWeight: 600,
            color: 'var(--text-primary, #e4e4e7)',
            flexShrink: 0,
          }}
        >
          {event.toolName}
        </span>

        {/* Input preview */}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--text-muted, #a1a1aa)',
            fontSize: 11,
          }}
        >
          {event.inputPreview}
        </span>

        {/* Duration */}
        {event.durationMs !== null && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-dim, #71717a)',
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0,
            }}
          >
            {formatTimelineDuration(event.durationMs)}
          </span>
        )}

        {/* Expand indicator */}
        <span style={{ fontSize: 10, color: 'var(--text-dim, #71717a)', flexShrink: 0 }}>
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div
          className="session-timeline__details"
          style={{
            marginLeft: 18,
            marginTop: 4,
            marginBottom: 8,
            padding: 12,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            border: '1px solid rgba(212,168,67,0.15)',
          }}
        >
          {/* Full Input */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-dim, #71717a)',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Input
            </div>
            <pre
              className="session-timeline__json"
              style={{
                margin: 0,
                padding: 8,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-muted, #a1a1aa)',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(event.fullInput, null, 2)}
            </pre>
          </div>

          {/* Full Output */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-dim, #71717a)',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Output
            </div>
            <pre
              className="session-timeline__json"
              style={{
                margin: 0,
                padding: 8,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: event.status === 'error'
                  ? '#fca5a5'
                  : 'var(--text-muted, #a1a1aa)',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(event.fullOutput, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function SessionTimeline({ events, loading }: SessionTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedSubAgents, setCollapsedSubAgents] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubAgent = (id: string) => {
    setCollapsedSubAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div
        className="session-timeline"
        style={{ padding: 16, color: 'var(--text-dim, #71717a)', fontSize: 12 }}
      >
        Loading timeline...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className="session-timeline session-timeline--empty"
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-dim, #71717a)',
          fontSize: 12,
        }}
      >
        No events
      </div>
    );
  }

  return (
    <div
      className="session-timeline"
      style={{
        position: 'relative',
        paddingLeft: 12,
      }}
    >
      {/* Vertical timeline line */}
      <div
        className="session-timeline__line"
        style={{
          position: 'absolute',
          left: 15,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'var(--border-subtle, #52525b)',
          borderRadius: 1,
        }}
      />

      {events.map((event) => {
        const hasChildren = event.children && event.children.length > 0;
        const isSubAgentCollapsed = collapsedSubAgents.has(event.id);

        return (
          <div key={event.id} className="session-timeline__group">
            <TimelineEventRow
              event={event}
              expanded={expandedIds.has(event.id)}
              onToggle={() => toggleExpand(event.id)}
            />

            {/* Sub-agent children */}
            {hasChildren && (
              <div className="session-timeline__subagent" style={{ marginLeft: 4 }}>
                <button
                  type="button"
                  onClick={() => toggleSubAgent(event.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px 2px 28px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10,
                    color: 'var(--accent, #d4a843)',
                  }}
                >
                  {isSubAgentCollapsed ? '\u25B6' : '\u25BC'}{' '}
                  {event.children!.length} sub-agent event{event.children!.length !== 1 ? 's' : ''}
                </button>

                {!isSubAgentCollapsed &&
                  event.children!.map((child) => (
                    <TimelineEventRow
                      key={child.id}
                      event={child}
                      expanded={expandedIds.has(child.id)}
                      onToggle={() => toggleExpand(child.id)}
                      nested
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
