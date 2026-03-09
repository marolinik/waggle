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
    <div
      className="waggle-app-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: 'var(--waggle-bg, #0f3460)',
        color: 'var(--waggle-text, #e0e0e0)',
        overflow: 'hidden',
      }}
    >
      <div
        className="waggle-app-shell-body"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {sidebar}

        <main
          className="waggle-content"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {content}
        </main>

        {contextPanel && (
          <aside
            className="waggle-context-panel"
            style={{
              width: 280,
              minWidth: 280,
              borderLeft: '1px solid var(--waggle-border, #333)',
              background: 'var(--waggle-sidebar-bg, #1a1a2e)',
              overflow: 'auto',
            }}
          >
            {contextPanel}
          </aside>
        )}
      </div>

      {statusBar}
    </div>
  );
}
