/**
 * StatusBar — bottom status bar showing model, workspace, tokens, cost, mode.
 * Model name is clickable — opens a dropdown to switch models.
 * PM-6: Offline indicator with queued message count.
 */

import React, { useState, useRef, useEffect } from 'react';
import { formatTokenCount, formatCost } from './utils.js';

/** PM-6: Offline state passed from the app */
export interface OfflineStatus {
  offline: boolean;
  since: string | null;
  queuedMessages: number;
}

export interface StatusBarProps {
  model: string;
  workspace: string;
  tokens: number;
  cost: number;
  mode: 'local' | 'team';
  availableModels?: string[];
  onModelSelect?: (model: string) => void;
  /** PM-6: Current offline state */
  offlineStatus?: OfflineStatus;
}

/** PM-6: Wifi-off SVG icon (inline, no dependency) */
function WifiOffIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', marginRight: 4 }}
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

export function StatusBar({
  model,
  workspace,
  tokens,
  cost,
  mode,
  availableModels,
  onModelSelect,
  offlineStatus,
}: StatusBarProps) {
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showOfflineTooltip, setShowOfflineTooltip] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const offlineRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showModelPicker && !showOfflineTooltip) return;
    const handler = (e: MouseEvent) => {
      if (showModelPicker && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
      if (showOfflineTooltip && offlineRef.current && !offlineRef.current.contains(e.target as Node)) {
        setShowOfflineTooltip(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelPicker, showOfflineTooltip]);

  const canPickModel = availableModels && availableModels.length > 0 && onModelSelect;
  const isOffline = offlineStatus?.offline === true;

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
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>{workspace}</span>
        <span>{mode === 'team' ? 'Team' : 'Local'}</span>

        {/* PM-6: Offline indicator */}
        {isOffline && (
          <div ref={offlineRef} style={{ position: 'relative' }}>
            <button
              className="waggle-offline-indicator"
              onClick={() => setShowOfflineTooltip(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--waggle-amber, #d4a843)',
                color: 'var(--waggle-text-dark, #1a1a2e)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                animation: 'waggle-offline-pulse 2s ease-in-out infinite',
              }}
              title="LLM connection lost"
            >
              <WifiOffIcon />
              Offline
              {offlineStatus.queuedMessages > 0 && (
                <span
                  className="waggle-offline-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--waggle-text-dark, #1a1a2e)',
                    color: 'var(--waggle-amber, #d4a843)',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 2,
                  }}
                >
                  {offlineStatus.queuedMessages}
                </span>
              )}
            </button>

            {showOfflineTooltip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 28,
                  left: 0,
                  minWidth: 260,
                  background: 'var(--waggle-bg-secondary, #1a1a2e)',
                  border: '1px solid var(--waggle-border, #333)',
                  borderRadius: 6,
                  boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: 'var(--waggle-text, #e0e0e0)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--waggle-amber, #d4a843)' }}>
                  LLM Connection Lost
                </div>
                <div style={{ marginBottom: 4, color: 'var(--waggle-text-muted, #888)' }}>
                  Local tools (file ops, git, memory search) still work.
                </div>
                {offlineStatus.queuedMessages > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {offlineStatus.queuedMessages} message{offlineStatus.queuedMessages === 1 ? '' : 's'} queued.
                  </div>
                )}
                {offlineStatus.since && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--waggle-text-muted, #666)' }}>
                    Since {new Date(offlineStatus.since).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
