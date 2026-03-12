/**
 * SessionCard — a single session item in the session list.
 *
 * Shows title, message count, last active time. Highlights when active.
 * Right-click context menu for rename/delete/export.
 */

import React, { useState, useCallback } from 'react';
import type { Session } from '../../services/types.js';
import { formatLastActive } from './utils.js';

export interface SessionCardProps {
  session: Session;
  active?: boolean;
  workspaceIcon?: string;
  onSelect: () => void;
  onDelete?: () => void;
  onRename?: (title: string) => void;
  onExport?: () => void;
}

export function SessionCard({
  session,
  active = false,
  workspaceIcon,
  onSelect,
  onDelete,
  onRename,
  onExport,
}: SessionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title || '');

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onDelete || onRename || onExport) {
        setShowMenu(true);
      }
    },
    [onDelete, onRename, onExport],
  );

  const handleRename = useCallback(() => {
    setShowMenu(false);
    setEditing(true);
    setEditTitle(session.title || '');
  }, [session.title]);

  const handleRenameSubmit = useCallback(() => {
    setEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== session.title && onRename) {
      onRename(trimmed);
    }
  }, [editTitle, session.title, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameSubmit();
      if (e.key === 'Escape') setEditing(false);
    },
    [handleRenameSubmit],
  );

  const cardClasses = `session-card__button flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-blue-600/20 text-blue-300'
      : 'text-gray-300 hover:bg-gray-800'
  }`;

  const cardContent = (
    <div className="session-card__content flex-1 min-w-0 text-left">
      {editing ? (
        <input
          className="session-card__rename w-full bg-gray-700 text-gray-200 rounded px-1 text-sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="session-card__title block truncate">
          {workspaceIcon && <span className="session-card__workspace-icon mr-1">{workspaceIcon}</span>}
          {session.title || 'Untitled Session'}
        </span>
      )}
      {session.summary && (
        <span className="session-card__summary block text-xs text-gray-400 truncate mt-0.5">
          {session.summary}
        </span>
      )}
      <span className="session-card__meta block text-xs text-gray-500">
        {session.messageCount} messages · {formatLastActive(session.lastActive)}
      </span>
    </div>
  );

  return (
    <div className="session-card relative">
      {editing ? (
        <div
          className={cardClasses}
          onContextMenu={handleContextMenu}
          title={session.title || 'Untitled Session'}
        >
          {cardContent}
        </div>
      ) : (
        <button
          className={cardClasses}
          onClick={onSelect}
          onContextMenu={handleContextMenu}
          title={session.title || 'Untitled Session'}
        >
          {cardContent}
        </button>
      )}

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            className="session-card__overlay fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="session-card__menu absolute right-0 top-full z-20 mt-1 rounded bg-gray-800 border border-gray-700 shadow-lg py-1 min-w-[120px]">
            {onRename && (
              <button
                className="session-card__menu-item w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                onClick={handleRename}
              >
                Rename
              </button>
            )}
            {onExport && (
              <button
                className="session-card__menu-item w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => { setShowMenu(false); onExport(); }}
              >
                Export
              </button>
            )}
            {onDelete && (
              <button
                className="session-card__menu-item w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
                onClick={() => { setShowMenu(false); onDelete(); }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
