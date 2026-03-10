/**
 * StatusBar — bottom status bar showing model, workspace, tokens, cost, mode.
 * Model name is clickable — opens a dropdown to switch models.
 */

import React, { useState, useRef, useEffect } from 'react';
import { formatTokenCount, formatCost } from './utils.js';

export interface StatusBarProps {
  model: string;
  workspace: string;
  tokens: number;
  cost: number;
  mode: 'local' | 'team';
  availableModels?: string[];
  onModelSelect?: (model: string) => void;
}

export function StatusBar({
  model,
  workspace,
  tokens,
  cost,
  mode,
  availableModels,
  onModelSelect,
}: StatusBarProps) {
  const [showModelPicker, setShowModelPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelPicker]);

  const canPickModel = availableModels && availableModels.length > 0 && onModelSelect;

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
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Model picker */}
        <div ref={pickerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => canPickModel && setShowModelPicker(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: canPickModel ? 'var(--waggle-brand, #6366f1)' : 'inherit',
              cursor: canPickModel ? 'pointer' : 'default',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: '0 2px',
              borderRadius: 3,
            }}
            title={canPickModel ? 'Click to switch model' : model}
          >
            {model}{canPickModel ? ' \u25BE' : ''}
          </button>

          {showModelPicker && availableModels && onModelSelect && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: 0,
                minWidth: 220,
                maxHeight: 300,
                overflowY: 'auto',
                background: 'var(--waggle-bg-secondary, #1a1a2e)',
                border: '1px solid var(--waggle-border, #333)',
                borderRadius: 6,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
                zIndex: 1000,
                padding: '4px 0',
              }}
            >
              {availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onModelSelect(m);
                    setShowModelPicker(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 12px',
                    background: m === model ? 'var(--waggle-brand, #6366f1)' : 'transparent',
                    color: m === model ? '#fff' : 'var(--waggle-text-muted, #ccc)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={(e) => {
                    if (m !== model) (e.target as HTMLElement).style.background = 'var(--waggle-bg-tertiary, #252540)';
                  }}
                  onMouseLeave={(e) => {
                    if (m !== model) (e.target as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <span>{formatTokenCount(tokens)} tokens</span>
        <span>{formatCost(cost)}</span>
      </div>
    </footer>
  );
}
