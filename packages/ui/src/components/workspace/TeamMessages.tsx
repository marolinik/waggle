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
    <div className="py-1">
      <div className="flex flex-col gap-0.5">
        {messages.slice(0, maxVisible).map((msg, i) => (
          <div
            key={msg.id ?? i}
            className="px-3 py-1.5 text-[11px] text-foreground ml-3 border-l-2"
            style={{ borderLeftColor: TYPE_COLORS[msg.type] ?? '#484f58' }}
          >
            <div className="flex justify-between items-center mb-0.5">
              <span
                className="font-semibold text-[10px] uppercase tracking-wide"
                style={{ color: TYPE_COLORS[msg.type] ?? '#8b949e' }}
              >
                {msg.type}{msg.senderName ? ` \u00B7 ${msg.senderName}` : ''}
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                {formatRelativeTime(msg.createdAt)}
              </span>
            </div>
            <div className="overflow-hidden line-clamp-2 leading-[1.4] text-muted-foreground">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { formatRelativeTime, TYPE_COLORS };
