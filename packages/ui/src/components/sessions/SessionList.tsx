/**
 * SessionList — grouped session list with time-based sections.
 *
 * Renders sessions grouped by Today, Yesterday, This Week, Older.
 * Includes a "New Session" button at the top.
 */

import React from 'react';
import type { Session } from '../../services/types.js';
import { SessionCard } from './SessionCard.js';
import { TIME_GROUPS } from './utils.js';

export interface SessionListProps {
  grouped: Record<string, Session[]>;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession?: (id: string) => void;
  onRenameSession?: (id: string, title: string) => void;
  onExportSession?: (id: string) => void;
}

export function SessionList({
  grouped,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onExportSession,
}: SessionListProps) {
  return (
    <div className="session-list flex flex-col gap-1">
      {/* New Session button */}
      <button
        className="session-list__new flex items-center gap-2 w-full rounded px-3 py-2 text-sm text-blue-400 hover:bg-gray-800 transition-colors"
        onClick={onCreateSession}
      >
        <span>+</span>
        <span>New Session</span>
      </button>

      {/* Grouped sessions */}
      {TIME_GROUPS.map((group) => {
        const sessions = grouped[group];
        if (!sessions || sessions.length === 0) return null;

        return (
          <div key={group} className="session-list__group">
            <div className="session-list__group-header px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {group}
            </div>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                active={session.id === activeSessionId}
                onSelect={() => onSelectSession(session.id)}
                onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                onRename={onRenameSession ? (title) => onRenameSession(session.id, title) : undefined}
                onExport={onExportSession ? () => onExportSession(session.id) : undefined}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
