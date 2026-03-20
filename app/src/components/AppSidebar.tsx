/**
 * AppSidebar — Main sidebar with brand, workspace tree, and bottom navigation.
 * Phase 10: Full Tailwind rewrite — zero inline styles.
 */

import type { Workspace, WorkspaceMicroStatus } from '@waggle/ui';
import { Sidebar, WorkspaceTree, useTheme } from '@waggle/ui';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  microStatus?: Record<string, WorkspaceMicroStatus>;
}

// W4.1: Order matches Ctrl+Shift+N keyboard shortcut mapping (1=Chat, 2=Memory, etc.)
const NAV_ITEMS: { view: AppView; label: string; shortcut: string; icon: string }[] = [
  { view: 'chat', label: 'Chat', shortcut: '1', icon: '💬' },
  { view: 'memory', label: 'Memory', shortcut: '2', icon: '🧠' },
  { view: 'events', label: 'Events', shortcut: '3', icon: '📋' },
  { view: 'capabilities', label: 'Capabilities', shortcut: '4', icon: '⚡' },
  { view: 'cockpit', label: 'Cockpit', shortcut: '5', icon: '📊' },
  { view: 'mission-control', label: 'Mission Control', shortcut: '6', icon: '🚀' },
  { view: 'settings', label: 'Settings', shortcut: '7', icon: '⚙️' },
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
  onOpenSearch,
  onOpenHelp,
  microStatus,
}: AppSidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const bottomItems = (
    <div className="flex flex-col gap-px px-1">
      {NAV_ITEMS.map(({ view, label, shortcut, icon }) => {
        const isActive = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            title={`${label} (Ctrl+Shift+${shortcut})`}
            className={`
              flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-[11px] font-mono
              border-l-2 transition-all duration-100 cursor-pointer
              ${collapsed ? 'justify-center px-0 py-2' : 'justify-start'}
              ${isActive
                ? 'bg-primary/10 border-l-primary text-primary'
                : 'bg-transparent border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            {/* W4.8: Show view icon when collapsed (replaces invisible dot) */}
            {collapsed ? (
              <span className="text-[13px]">{icon}</span>
            ) : (
              <>
                <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
                <span className="flex-1">{label}</span>
                <span className={`text-[9px] ${isActive ? 'opacity-80' : 'opacity-40'} text-muted-foreground`}>
                  ⇧{shortcut}
                </span>
              </>
            )}
          </button>
        );
      })}

      <Separator className="my-1" />

      {/* Create Workspace */}
      <Button
        variant="ghost"
        onClick={onCreateWorkspace}
        title="Create Workspace"
        className={`
          w-full border border-dashed border-border text-muted-foreground
          hover:border-primary hover:text-primary text-[10px] font-mono
          ${collapsed ? 'justify-center px-0' : 'justify-start'}
        `}
        size="sm"
      >
        <span className="text-[13px] leading-none">+</span>
        {!collapsed && <span>new workspace</span>}
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`
          w-full text-muted-foreground hover:text-primary text-[11px] font-mono mt-0.5
          ${collapsed ? 'justify-center px-0' : 'justify-start'}
        `}
        size="sm"
      >
        <span className="text-[13px] leading-none">{theme === 'dark' ? '\u2600' : '\u263E'}</span>
        {!collapsed && <span>{theme === 'dark' ? 'light mode' : 'dark mode'}</span>}
      </Button>

      {/* W4.3: Keyboard shortcuts help button — discoverable entry point for Ctrl+/ */}
      {onOpenHelp && (
        <Button
          variant="ghost"
          onClick={onOpenHelp}
          title="Keyboard shortcuts (Ctrl+/)"
          className={`
            w-full text-muted-foreground hover:text-primary text-[11px] font-mono
            ${collapsed ? 'justify-center px-0' : 'justify-start'}
          `}
          size="sm"
        >
          <span className="text-[13px] leading-none">?</span>
          {!collapsed && <span>shortcuts</span>}
        </Button>
      )}
    </div>
  );

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      bottomItems={bottomItems}
    >
      {/* Brand */}
      {!collapsed ? (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <img src="/waggle-logo.svg" alt="Waggle" className="w-6 h-[30px] shrink-0" />
            <span className="text-primary tracking-[0.15em] text-[11px] font-medium">WAGGLE</span>
            <span className="text-[8px] text-muted-foreground/50 tracking-wider ml-auto">v1.0</span>
          </div>
          <span className="text-[8px] text-muted-foreground/40 tracking-wide pl-8">the AI that remembers your work</span>
        </div>
      ) : (
        <div className="flex justify-center py-1.5">
          <img src="/waggle-logo.svg" alt="W" className="w-[26px] h-8" />
        </div>
      )}

      {/* Search */}
      {onOpenSearch && (
        <Button
          variant="outline"
          onClick={onOpenSearch}
          title="Search (Ctrl+K)"
          className={`
            text-muted-foreground hover:text-foreground hover:border-primary
            text-[10px] font-mono transition-colors
            ${collapsed ? 'w-4/5 mx-auto justify-center' : 'w-[calc(100%-8px)] mx-1 justify-start'}
          `}
          size="sm"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <span className="text-[9px] opacity-50">^K</span>
            </>
          )}
        </Button>
      )}

      {/* Workspace tree */}
      {workspaces.length > 0 ? (
        <ScrollArea className="flex-1">
          <WorkspaceTree
            workspaces={workspaces}
            activeId={activeWorkspaceId}
            onSelect={onSelectWorkspace}
            microStatus={microStatus}
          />
        </ScrollArea>
      ) : (
        !collapsed && (
          <div className="px-3 py-3 text-[10px] font-mono text-muted-foreground/40 leading-relaxed">
            <div className="mb-2 opacity-70">no workspaces</div>
            <div className="text-[9px] opacity-40 leading-relaxed">
              Create one to organize your conversations, memory, and files.
            </div>
          </div>
        )
      )}
    </Sidebar>
  );
}
