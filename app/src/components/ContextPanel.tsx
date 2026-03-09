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
  groupedSessions: Record<string, Session[]>;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  selectedFrame?: Frame;
}

function PanelHeader({ label }: { label: string }) {
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
    }}>
      {label}
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
}: ContextPanelProps) {
  if (currentView === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PanelHeader label="Sessions" />
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
        <PanelHeader label="Frame Detail" />
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          <FrameDetail frame={selectedFrame} />
        </div>
      </div>
    );
  }

  return null;
}
