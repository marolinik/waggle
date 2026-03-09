/**
 * AppSidebar — Main sidebar with brand, workspace tree, and bottom navigation.
 */

import type { Workspace } from '@waggle/ui';
import { Sidebar, WorkspaceTree } from '@waggle/ui';

type AppView = 'chat' | 'settings' | 'memory' | 'events';

export interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace: (id: string) => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onCreateWorkspace: () => void;
}

const NAV_ITEMS: { view: AppView; icon: string; label: string }[] = [
  { view: 'chat', icon: '\uD83D\uDCAC', label: 'Chat' },
  { view: 'memory', icon: '\uD83E\uDDE0', label: 'Memory' },
  { view: 'events', icon: '\uD83D\uDCCB', label: 'Events' },
  { view: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
];

export function AppSidebar({
  collapsed,
  onToggle,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  currentView,
  onViewChange,
  onCreateWorkspace,
}: AppSidebarProps) {
  const bottomItems = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 4px' }}>
      {NAV_ITEMS.map(({ view, icon, label }) => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          title={label}
          style={{
            background: currentView === view ? 'rgba(99, 102, 241, 0.08)' : 'none',
            border: 'none',
            borderLeft: currentView === view ? '2px solid var(--primary)' : '2px solid transparent',
            color: currentView === view ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: collapsed ? '10px 0' : '7px 14px',
            width: '100%',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            borderRadius: '4px',
            transition: 'all 0.12s',
          }}
        >
          <span style={{ fontSize: '14px' }}>{icon}</span>
          {!collapsed && <span>{label}</span>}
        </button>
      ))}
      <div style={{
        borderTop: '1px solid var(--border)',
        marginTop: '4px',
        paddingTop: '4px',
      }}>
        <button
          onClick={onCreateWorkspace}
          title="Create Workspace"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            padding: collapsed ? '8px 0' : '7px 14px',
            width: '100%',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            borderRadius: '4px',
            transition: 'all 0.12s',
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          {!collapsed && <span>New Workspace</span>}
        </button>
      </div>
    </div>
  );

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      bottomItems={bottomItems}
    >
      {!collapsed && (
        <div className="waggle-brand">WAGGLE</div>
      )}
      {workspaces.length > 0 ? (
        <WorkspaceTree
          workspaces={workspaces}
          activeId={activeWorkspaceId}
          onSelect={onSelectWorkspace}
        />
      ) : (
        !collapsed && (
          <div style={{
            padding: '16px 12px',
            color: 'var(--text-dim)',
            fontSize: '12px',
            lineHeight: 1.5,
          }}>
            No workspaces yet. Create one to get started.
          </div>
        )
      )}
    </Sidebar>
  );
}
