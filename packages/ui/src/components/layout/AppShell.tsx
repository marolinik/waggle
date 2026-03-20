/**
 * AppShell — three-panel layout: left sidebar + center content + right context panel.
 *
 * Responsive: right panel collapses on narrow windows (handled via CSS).
 * Left sidebar is controlled externally by the Sidebar component.
 */

import React from 'react';

export interface AppShellProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  contextPanel?: React.ReactNode;
  contextPanelOpen?: boolean;
  onToggleContextPanel?: () => void;
  statusBar: React.ReactNode;
}

export function AppShell({ sidebar, content, contextPanel, contextPanelOpen = true, onToggleContextPanel, statusBar }: AppShellProps) {
  return (
    <div className="waggle-app-shell flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <div className="waggle-app-shell-body flex flex-1 overflow-hidden">
        {sidebar}

        <main className="waggle-content flex-1 flex flex-col overflow-hidden min-w-0">
          {content}
        </main>

        {/* W4.6: Context panel with collapse toggle */}
        {contextPanel && contextPanelOpen && (
          <aside className="waggle-context-panel w-[280px] min-w-[280px] border-l border-border bg-card overflow-auto hidden lg:block">
            {onToggleContextPanel && (
              <button
                onClick={onToggleContextPanel}
                className="absolute top-1 right-1 text-muted-foreground hover:text-foreground text-xs z-10"
                title="Hide panel"
              >
                ✕
              </button>
            )}
            {contextPanel}
          </aside>
        )}
        {contextPanel && !contextPanelOpen && onToggleContextPanel && (
          <button
            onClick={onToggleContextPanel}
            className="w-8 border-l border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer hidden lg:flex"
            title="Show context panel"
          >
            ◀
          </button>
        )}
      </div>

      {statusBar}
    </div>
  );
}
