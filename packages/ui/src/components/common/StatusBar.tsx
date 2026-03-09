/**
 * StatusBar — bottom status bar showing model, workspace, tokens, cost, mode.
 */

import React from 'react';
import { formatTokenCount, formatCost } from './utils.js';

export interface StatusBarProps {
  model: string;
  workspace: string;
  tokens: number;
  cost: number;
  mode: 'local' | 'team';
}

export function StatusBar({ model, workspace, tokens, cost, mode }: StatusBarProps) {
  return (
    <footer
      className="waggle-statusbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 28,
        padding: '0 12px',
        fontSize: '12px',
        background: 'var(--waggle-statusbar-bg, #0a0a1a)',
        color: 'var(--waggle-text-muted, #888)',
        borderTop: '1px solid var(--waggle-border, #333)',
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <span>{workspace}</span>
        <span>{mode === 'team' ? 'Team' : 'Local'}</span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <span>{model}</span>
        <span>{formatTokenCount(tokens)} tokens</span>
        <span>{formatCost(cost)}</span>
      </div>
    </footer>
  );
}
