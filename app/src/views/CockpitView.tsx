/**
 * CockpitView — Placeholder for Wave 1.4 Control Cockpit.
 *
 * Will be replaced with real implementation providing health monitoring,
 * usage stats, schedules, and system status.
 */

import React from 'react';

export function CockpitView() {
  return (
    <div style={{
      padding: '24px 32px',
      maxWidth: 960,
      margin: '0 auto',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #e6edf3)', marginBottom: 4 }}>
        Cockpit
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted, #8b949e)', marginBottom: 24 }}>
        Health, usage, schedules, and system status.
      </div>
      <div style={{
        padding: 24,
        background: 'var(--bg-secondary, #161b22)',
        border: '1px solid var(--border, #232333)',
        borderRadius: 8,
        color: 'var(--text-muted, #8b949e)',
        fontSize: 12,
        textAlign: 'center' as const,
      }}>
        Coming in Wave 1.4 — Control Cockpit with health monitoring, usage stats, and schedule management.
      </div>
    </div>
  );
}
