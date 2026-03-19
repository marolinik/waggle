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
      className={`waggle-sidebar flex flex-col h-full border-r border-border bg-card transition-[width,min-width] duration-200 ease-in-out overflow-hidden ${
        collapsed ? 'w-12 min-w-12' : 'w-[200px] min-w-[200px]'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <button
        className="waggle-sidebar-toggle bg-transparent border-none text-foreground cursor-pointer p-3 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        {collapsed ? '\u25B6' : '\u25C0'}
      </button>

      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {bottomItems && (
        <div
          className="waggle-sidebar-bottom border-t border-border py-2"
        >
          {bottomItems}
        </div>
      )}
    </aside>
  );
}
