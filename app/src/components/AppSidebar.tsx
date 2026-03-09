/**
 * AppSidebar — Main sidebar with brand, workspace tree, and bottom navigation.
 * Uses the official Waggle bee logo (amber on dark).
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

const NAV_ITEMS: { view: AppView; label: string; shortcut: string }[] = [
  { view: 'chat', label: 'Chat', shortcut: '1' },
  { view: 'memory', label: 'Memory', shortcut: '2' },
  { view: 'events', label: 'Events', shortcut: '3' },
  { view: 'settings', label: 'Settings', shortcut: '4' },
];

/** Indicator dot for nav items */
function NavDot({ active }: { active: boolean }) {
  return (
    <span style={{
      width: 4,
      height: 4,
      borderRadius: '50%',
      background: active ? 'var(--primary)' : 'transparent',
      flexShrink: 0,
      transition: 'background 0.15s',
    }} />
  );
}

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
      {NAV_ITEMS.map(({ view, label, shortcut }) => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          title={`${label} (Ctrl+${shortcut})`}
          style={{
            background: currentView === view ? 'var(--primary-muted)' : 'none',
            border: 'none',
            borderLeft: currentView === view ? '2px solid var(--primary)' : '2px solid transparent',
            color: currentView === view ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: collapsed ? '8px 0' : '5px 10px',
            width: '100%',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            borderRadius: '3px',
            transition: 'all 0.12s',
          }}
        >
          <NavDot active={currentView === view} />
          {!collapsed && (
            <>
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{
                fontSize: '9px',
                color: 'var(--text-dim)',
                opacity: currentView === view ? 0.8 : 0.4,
              }}>
                ^{shortcut}
              </span>
            </>
          )}
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
            border: '1px dashed var(--border)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: collapsed ? '6px 0' : '5px 10px',
            width: '100%',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '6px',
            borderRadius: '3px',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-dim)';
          }}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>+</span>
          {!collapsed && <span>new workspace</span>}
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
      {/* Brand: logo + WAGGLE + version */}
      {!collapsed && (
        <div className="waggle-brand" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <img
            src="/waggle-logo.svg"
            alt="Waggle"
            style={{ width: 24, height: 30, flexShrink: 0 }}
          />
          <span style={{ color: '#E8920F', letterSpacing: '0.15em', fontSize: '11px' }}>WAGGLE</span>
          <span style={{
            fontSize: '8px',
            color: 'var(--text-dim)',
            opacity: 0.5,
            letterSpacing: '0.05em',
            marginLeft: 'auto',
          }}>
            v0.4
          </span>
        </div>
      )}
      {collapsed && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '6px 0',
        }}>
          <img
            src="/waggle-logo.svg"
            alt="W"
            style={{ width: 26, height: 32 }}
          />
        </div>
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
            padding: '12px',
            color: 'var(--text-dim)',
            fontSize: '10px',
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ marginBottom: '8px', opacity: 0.7 }}>
              no workspaces
            </div>
            <div style={{ fontSize: '9px', opacity: 0.4, lineHeight: 1.5 }}>
              Create one to organize your
              conversations, memory, and files.
            </div>
          </div>
        )
      )}
    </Sidebar>
  );
}
