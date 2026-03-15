/**
 * TeamMessages — shows recent Waggle Dance messages for a team workspace.
 *
 * Compact message list with type badges (waggle/alert/status/request),
 * sender name, truncated content, and relative timestamps.
 * Returns null when there are no messages (takes no space).
 */

import React from 'react';

export interface TeamMessage {
  id: string;
  type: 'waggle' | 'alert' | 'status' | 'request';
  content: string;
  senderName?: string;
  createdAt: string;
}

export interface TeamMessagesProps {
  messages: TeamMessage[];
  /** Max messages to display (default 10) */
  maxVisible?: number;
}

const TYPE_COLORS: Record<string, string> = {
  waggle: '#58a6ff',
  alert: '#f85149',
  status: '#3fb950',
  request: '#d29922',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function TeamMessages({ messages, maxVisible = 10 }: TeamMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.slice(0, maxVisible).map((msg, i) => (
          <div key={msg.id ?? i} style={{
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--text, #e6edf3)',
            borderLeft: `2px solid ${TYPE_COLORS[msg.type] ?? '#484f58'}`,
            marginLeft: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{
                fontWeight: 600,
                fontSize: 10,
                color: TYPE_COLORS[msg.type] ?? '#8b949e',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.03em',
              }}>
                {msg.type}{msg.senderName ? ` \u00B7 ${msg.senderName}` : ''}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim, #484f58)' }}>
                {formatRelativeTime(msg.createdAt)}
              </span>
            </div>
            <div style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              lineHeight: 1.4,
              color: 'var(--text-muted, #8b949e)',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { formatRelativeTime, TYPE_COLORS };
