/**
 * ContextPanel — Right panel showing contextual content based on current view.
 *
 * Chat view: SessionList + optional document preview
 * Memory view: FrameDetail (selected frame)
 * Other views: nothing (panel hidden)
 */

import type { Session, SessionSearchResult, Frame, FileEntry, TeamMember, ActivityItem } from '@waggle/ui';
import { SessionList, FrameDetail, FilePreview, TeamPresence, ActivityFeed } from '@waggle/ui';

type AppView = 'chat' | 'settings' | 'memory' | 'events';

export interface ContextPanelProps {
  currentView: AppView;
  groupedSessions: Record<string, Session[]>;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  selectedFrame?: Frame;
  /** File to preview in the panel (set by agent file ops or file upload). */
  previewFile?: FileEntry | null;
  onClosePreview?: () => void;
  /** Recent memory highlights for the active workspace */
  recentMemories?: Array<{ content: string; importance: string; date: string }>;
  /** F3: Session export */
  onExportSession?: (id: string) => void;
  /** F1: Session search */
  onSearchSessions?: (query: string) => void;
  searchResults?: SessionSearchResult[] | null;
  searchLoading?: boolean;
  onClearSearch?: () => void;
  /** I4: Team presence members (shown for team workspaces) */
  teamMembers?: TeamMember[];
  /** J1: Team activity feed items */
  teamActivity?: ActivityItem[];
  teamActivityLoading?: boolean;
}

function PanelHeader({ label, action }: { label: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderBottom: '1px solid var(--border)',
      fontSize: '9px',
      fontWeight: 600,
      color: 'var(--text-dim)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {label}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 9,
            padding: '2px 4px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ContextPanel({
  currentView,
  groupedSessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  selectedFrame,
  previewFile,
  onClosePreview,
  recentMemories,
  onExportSession,
  onSearchSessions,
  searchResults,
  searchLoading,
  onClearSearch,
  teamMembers,
  teamActivity,
  teamActivityLoading,
}: ContextPanelProps) {
  if (currentView === 'chat') {
    // If there's a file to preview, show it above sessions
    if (previewFile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PanelHeader
            label="Document Preview"
            action={onClosePreview ? { label: '\u2715 Close', onClick: onClosePreview } : undefined}
          />
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <FilePreview file={previewFile} />
          </div>
          <PanelHeader label="Sessions" />
          <div style={{ maxHeight: '30%', overflow: 'auto' }}>
            <SessionList
              grouped={groupedSessions}
              activeSessionId={activeSessionId}
              onSelectSession={onSelectSession}
              onCreateSession={onCreateSession}
              onDeleteSession={onDeleteSession}
              onRenameSession={onRenameSession}
              onExportSession={onExportSession}
              onSearch={onSearchSessions}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onClearSearch={onClearSearch}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {recentMemories && recentMemories.length > 0 && (
          <>
            <PanelHeader label="Memory" />
            <div style={{
              maxHeight: '35%',
              overflow: 'auto',
              borderBottom: '1px solid var(--border)',
            }}>
              {recentMemories.slice(0, 4).map((mem, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderBottom: i < Math.min(recentMemories.length, 4) - 1 ? '1px solid var(--border-subtle, rgba(255,255,255,0.05))' : 'none',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {mem.content}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: 'var(--text-dim)',
                    marginTop: '3px',
                    display: 'flex',
                    gap: '6px',
                  }}>
                    <span>{mem.date}</span>
                    {mem.importance !== 'normal' && (
                      <span style={{
                        color: mem.importance === 'critical' ? 'var(--error, #ef4444)' : 'var(--primary, #E8920F)',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                      }}>
                        {mem.importance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* I4: Team presence */}
        {teamMembers && teamMembers.length > 0 && (
          <>
            <PanelHeader label="Team" />
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <TeamPresence members={teamMembers} />
            </div>
          </>
        )}
        {/* J1: Team activity feed */}
        {(teamActivity && teamActivity.length > 0 || teamActivityLoading) && (
          <>
            <PanelHeader label="Activity" />
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <ActivityFeed items={teamActivity ?? []} loading={teamActivityLoading} />
            </div>
          </>
        )}
        <PanelHeader label="Sessions" />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <SessionList
            grouped={groupedSessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onCreateSession={onCreateSession}
            onDeleteSession={onDeleteSession}
            onRenameSession={onRenameSession}
            onExportSession={onExportSession}
            onSearch={onSearchSessions}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onClearSearch={onClearSearch}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'memory' && selectedFrame) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PanelHeader label="Frame Detail" />
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          <FrameDetail frame={selectedFrame} />
        </div>
      </div>
    );
  }

  return null;
}
