/**
 * ActivityFeed — shows recent team activity as a timeline.
 *
 * Displays session summaries, memory additions, and task changes
 * from all team members. Used in the context panel for team workspaces.
 */

import React from 'react';

export interface ActivityItem {
  id: string;
  type: 'session' | 'memory' | 'task' | 'join' | 'general';
  authorName: string;
  authorId?: string;
  summary: string;
  timestamp: string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

const TYPE_ICONS: Record<ActivityItem['type'], string> = {
  session: '\u{1F4AC}',   // 💬
  memory: '\u{1F9E0}',    // 🧠
  task: '\u{2705}',       // ✅
  join: '\u{1F44B}',      // 👋
  general: '\u{1F4E2}',   // 📢
};

export function formatActivityTime(iso: string): string {
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

export function ActivityFeed({ items, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="activity-feed" style={{ padding: '12px', color: 'var(--text-dim)', fontSize: 11 }}>
        Loading team activity...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="activity-feed" style={{ padding: '12px', color: 'var(--text-dim)', fontSize: 11 }}>
        No recent team activity.
      </div>
    );
  }

  return (
    <div className="activity-feed" style={{ maxHeight: 300, overflow: 'auto' }}>
      {items.map((item) => (
        <div
          key={item.id}
          className="activity-feed__item"
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
            fontSize: 11,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span>{TYPE_ICONS[item.type] ?? TYPE_ICONS.general}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
              {item.authorName}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: 9, marginLeft: 'auto' }}>
              {formatActivityTime(item.timestamp)}
            </span>
          </div>
          <div style={{
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {item.summary}
          </div>
        </div>
      ))}
    </div>
  );
}
