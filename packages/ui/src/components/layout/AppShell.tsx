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
  statusBar: React.ReactNode;
}

export function AppShell({ sidebar, content, contextPanel, statusBar }: AppShellProps) {
  return (
    <div className="waggle-app-shell flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <div className="waggle-app-shell-body flex flex-1 overflow-hidden">
        {sidebar}

        <main className="waggle-content flex-1 flex flex-col overflow-hidden min-w-0">
          {content}
        </main>

        {contextPanel && (
          <aside className="waggle-context-panel w-[280px] min-w-[280px] border-l border-border bg-card overflow-auto">
            {contextPanel}
          </aside>
        )}
      </div>

      {statusBar}
    </div>
  );
}
