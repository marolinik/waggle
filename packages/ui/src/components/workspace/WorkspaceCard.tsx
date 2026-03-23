/**
 * WorkspaceCard — a single workspace item in the tree.
 *
 * Shows icon, name, and group. Highlights when active.
 * Team workspaces show a small team badge.
 * F7: Shows micro-status indicators (active dot, memory count, last active).
 */

import React from 'react';
import type { Workspace } from '../../services/types.js';

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

  return (
    <button
      className="workspace-card waggle-nav-hover flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
      style={{
        color: isActive ? 'var(--hive-50)' : 'var(--hive-300)',
        backgroundColor: isActive ? 'var(--honey-glow)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--honey-500)' : '2px solid transparent',
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={workspace.name + (isTeam ? ' (Team)' : '')}
    >
      {/* Hex dot + agent active indicator */}
      <span className="workspace-card__icon text-[10px] relative shrink-0" style={{ color: isActive ? 'var(--honey-500)' : 'var(--hive-500)' }}>
        ⬡
        {isAgentActive && (
          <span
            className="workspace-card__agent-dot absolute -top-px -right-0.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--status-healthy)', border: '1px solid var(--hive-800)' }}
            title="Agent active"
          />
        )}
      </span>

      {/* Name + last active subtitle */}
      <span className="workspace-card__name flex-1 truncate text-left flex flex-col min-w-0">
        <span className="truncate text-[12px]">{workspace.name}</span>
        {lastActive && (
          <span className="workspace-card__last-active text-[9px] font-normal leading-tight" style={{ color: 'var(--hive-500)' }}>
            {formatRelativeTime(lastActive)}
          </span>
        )}
      </span>

      {/* M1: Memory count badge — pill container */}
      {memoryCount != null && memoryCount > 0 && (
        <span
          className="workspace-card__memory-badge text-[10px] font-semibold shrink-0 rounded-full px-1.5 py-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--hive-300)' }}
          title={`${memoryCount} memories`}
        >
          {memoryCount}
        </span>
      )}

      {/* Team badge */}
      {isTeam && (
        <span
          className="workspace-card__team-badge rounded px-1.5 py-0.5 text-[9px] font-medium"
          style={{ backgroundColor: 'var(--honey-glow)', color: 'var(--honey-500)' }}
          title={`Team workspace (${workspace.teamRole ?? 'member'})`}
        >
          Team
        </span>
      )}
    </button>
  );
}
