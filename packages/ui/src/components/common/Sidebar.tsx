/**
 * Sidebar — collapsible left panel.
 *
 * 48px icons when collapsed, 200px expanded.
 * Optional bottom section for utility icons (Memory, Events, Settings).
 */

import React from 'react';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  bottomItems?: React.ReactNode;
}

export function Sidebar({ collapsed, onToggle, children, bottomItems }: SidebarProps) {
  return (
    <aside
      className="waggle-sidebar"
      style={{
        width: collapsed ? 48 : 200,
        minWidth: collapsed ? 48 : 200,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid var(--waggle-border, #333)',
        background: 'var(--waggle-sidebar-bg, #1a1a2e)',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <button
        className="waggle-sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--waggle-text, #e0e0e0)',
          cursor: 'pointer',
          padding: '12px',
          textAlign: 'left',
          fontSize: '16px',
        }}
      >
        {collapsed ? '\u25B6' : '\u25C0'}
      </button>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>

      {bottomItems && (
        <div
          className="waggle-sidebar-bottom"
          style={{
            borderTop: '1px solid var(--waggle-border, #333)',
            padding: '8px 0',
          }}
        >
          {bottomItems}
        </div>
      )}
    </aside>
  );
}
