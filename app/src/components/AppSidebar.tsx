/**
 * AppSidebar — Main sidebar with brand, workspace tree, and bottom navigation.
 * Uses the official Waggle bee logo (amber on dark).
 */

import type { Workspace, WorkspaceMicroStatus } from '@waggle/ui';
import { Sidebar, WorkspaceTree, useTheme } from '@waggle/ui';

type AppView = 'chat' | 'memory' | 'events' | 'capabilities' | 'cockpit' | 'mission-control' | 'settings';

export interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace: (id: string) => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onCreateWorkspace: () => void;
  /** F6: Open global search */
  onOpenSearch?: () => void;
  /** F7: Micro-status data keyed by workspace ID */
  microStatus?: Record<string, WorkspaceMicroStatus>;
}

const NAV_ITEMS: { view: AppView; label: string; shortcut: string }[] = [
  { view: 'chat', label: 'Chat', shortcut: '1' },
  { view: 'capabilities', label: 'Capabilities', shortcut: '2' },
  { view: 'cockpit', label: 'Cockpit', shortcut: '3' },
  { view: 'mission-control', label: 'Mission Control', shortcut: '4' },
  { view: 'memory', label: 'Memory', shortcut: '5' },
  { view: 'events', label: 'Events', shortcut: '6' },
  { view: 'settings', label: 'Settings', shortcut: '7' },
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
  onOpenSearch,
  microStatus,
}: AppSidebarProps) {
  const { theme, toggleTheme } = useTheme();
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
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: collapsed ? '6px 0' : '5px 10px',
            width: '100%',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '6px',
            borderRadius: '3px',
            marginTop: '2px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>{theme === 'dark' ? '☀' : '☾'}</span>
          {!collapsed && <span>{theme === 'dark' ? 'light mode' : 'dark mode'}</span>}
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

      {/* F6: Search button */}
      {onOpenSearch && (
        <button
          onClick={onOpenSearch}
          title="Search (Ctrl+K)"
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: collapsed ? '6px 0' : '5px 10px',
            width: collapsed ? '80%' : 'calc(100% - 8px)',
            margin: collapsed ? '4px auto' : '4px 4px',
            textAlign: collapsed ? 'center' : 'left',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '6px',
            borderRadius: '4px',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-dim)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {!collapsed && (
            <>
              <span style={{ flex: 1 }}>Search</span>
              <span style={{ fontSize: '9px', opacity: 0.5 }}>^K</span>
            </>
          )}
        </button>
      )}

      {workspaces.length > 0 ? (
        <WorkspaceTree
          workspaces={workspaces}
          activeId={activeWorkspaceId}
          onSelect={onSelectWorkspace}
          microStatus={microStatus}
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
