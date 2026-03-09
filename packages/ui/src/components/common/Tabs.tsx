/**
 * Tabs — horizontal tab bar with close buttons.
 *
 * Renders tabs with active state, close buttons, and a [+] new tab button.
 */

import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}

export function Tabs({ tabs, activeId, onSelect, onClose, onAdd }: TabsProps) {
  return (
    <div
      className="waggle-tabs"
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--waggle-tabs-bg, #16213e)',
        borderBottom: '1px solid var(--waggle-border, #333)',
        height: 36,
        overflow: 'hidden',
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeId}
          className={`waggle-tab ${tab.id === activeId ? 'waggle-tab--active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: '100%',
            cursor: 'pointer',
            background: tab.id === activeId
              ? 'var(--waggle-bg, #0f3460)'
              : 'transparent',
            color: tab.id === activeId
              ? 'var(--waggle-text, #e0e0e0)'
              : 'var(--waggle-text-muted, #888)',
            fontSize: '13px',
            borderRight: '1px solid var(--waggle-border, #333)',
            userSelect: 'none',
          }}
          onClick={() => onSelect(tab.id)}
        >
          {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {tab.label}
          </span>
          <button
            className="waggle-tab-close"
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
            aria-label={`Close ${tab.label}`}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              marginLeft: 8,
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            \u00D7
          </button>
        </div>
      ))}

      <button
        className="waggle-tab-add"
        onClick={onAdd}
        aria-label="New tab"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--waggle-text-muted, #888)',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0 12px',
          height: '100%',
        }}
      >
        +
      </button>
    </div>
  );
}
