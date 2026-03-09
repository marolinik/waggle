/**
 * ContextPanel — Right panel showing contextual content based on current view.
 *
 * Chat view: SessionList
 * Memory view: FrameDetail (selected frame)
 * Other views: nothing (panel hidden)
 */

import type { Session, Frame } from '@waggle/ui';
import { SessionList, FrameDetail } from '@waggle/ui';

type AppView = 'chat' | 'settings' | 'memory' | 'events';

export interface ContextPanelProps {
  currentView: AppView;
  // Session props (chat view)
  groupedSessions: Record<string, Session[]>;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  // Memory props (memory view)
  selectedFrame?: Frame;
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
}: ContextPanelProps) {
  if (currentView === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
        }}>
          Sessions
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <SessionList
            grouped={groupedSessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onCreateSession={onCreateSession}
            onDeleteSession={onDeleteSession}
            onRenameSession={onRenameSession}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'memory' && selectedFrame) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
        }}>
          Frame Detail
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          <FrameDetail frame={selectedFrame} />
        </div>
      </div>
    );
  }

  return null;
}
