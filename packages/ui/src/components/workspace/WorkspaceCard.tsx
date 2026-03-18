/**
 * WorkspaceCard — a single workspace item in the tree.
 *
 * Shows icon, name, and group. Highlights when active.
 * Team workspaces show a small team badge.
 * F7: Shows micro-status indicators (active dot, memory count, last active).
 */

import React from 'react';
import type { Workspace } from '../../services/types.js';

/** Derive a stable hue (0-360) from a workspace name for visual identity */
function workspaceHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

/** Format a relative time string from an ISO date */
function formatRelativeTime(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    if (diff < 0) return 'now';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return '';
  }
}

export interface WorkspaceCardProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  /** F7: Whether an agent is currently active in this workspace */
  isAgentActive?: boolean;
  /** F7: Number of memories in this workspace */
  memoryCount?: number;
  /** F7: ISO timestamp of last activity in this workspace */
  lastActive?: string;
}

export function WorkspaceCard({ workspace, isActive, onClick, onContextMenu, isAgentActive, memoryCount, lastActive }: WorkspaceCardProps) {
  const isTeam = Boolean(workspace.teamId);
  const hue = workspaceHue(workspace.name);

  return (
    <button
      className={`workspace-card flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
        isActive
          ? 'text-blue-300'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
      style={{
        borderLeft: `3px solid hsl(${hue}, 60%, 50%)`,
        background: isActive ? `hsla(${hue}, 60%, 50%, 0.08)` : undefined,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={workspace.name + (isTeam ? ' (Team)' : '')}
    >
      {/* Icon + agent active dot */}
      <span className="workspace-card__icon text-base" style={{ position: 'relative' }}>
        {workspace.icon || (isTeam ? '\u{1F465}' : '\u{1F4C1}')}
        {isAgentActive && (
          <span
            className="workspace-card__agent-dot"
            style={{
              position: 'absolute',
              top: -1,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#3fb950',
              border: '1px solid var(--bg, #0d1117)',
            }}
            title="Agent active"
          />
        )}
      </span>

      {/* Name + last active subtitle */}
      <span className="workspace-card__name flex-1 truncate text-left" style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
        <span className="truncate">{workspace.name}</span>
        {lastActive && (
          <span
            className="workspace-card__last-active"
            style={{
              fontSize: '9px',
              color: 'var(--text-dim, #484f58)',
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            {formatRelativeTime(lastActive)}
          </span>
        )}
      </span>

      {/* F7: Memory count badge */}
      {memoryCount != null && memoryCount > 0 && (
        <span
          className="workspace-card__memory-badge"
          title={`${memoryCount} memories`}
          style={{
            fontSize: '9px',
            color: 'var(--text-dim, #484f58)',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {memoryCount}m
        </span>
      )}

      {/* Team badge */}
      {isTeam && (
        <span
          className="workspace-card__team-badge rounded bg-blue-600/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-300"
          title={`Team workspace (${workspace.teamRole ?? 'member'})`}
        >
          Team
        </span>
      )}
    </button>
  );
}
