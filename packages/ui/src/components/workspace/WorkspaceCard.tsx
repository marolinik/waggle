/**
 * WorkspaceCard — a single workspace item in the tree.
 *
 * Shows icon, name, and group. Highlights when active.
 * Team workspaces show a small team badge.
 */

import React from 'react';
import type { Workspace } from '../../services/types.js';

export interface WorkspaceCardProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function WorkspaceCard({ workspace, isActive, onClick, onContextMenu }: WorkspaceCardProps) {
  const isTeam = Boolean(workspace.teamId);

  return (
    <button
      className={`workspace-card flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
        isActive
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-gray-300 hover:bg-gray-800'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={workspace.name + (isTeam ? ' (Team)' : '')}
    >
      {/* Icon */}
      <span className="workspace-card__icon text-base">
        {workspace.icon || (isTeam ? '\u{1F465}' : '\u{1F4C1}')}
      </span>

      {/* Name */}
      <span className="workspace-card__name flex-1 truncate text-left">
        {workspace.name}
      </span>

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
