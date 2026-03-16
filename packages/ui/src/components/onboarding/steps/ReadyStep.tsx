/**
 * ReadyStep — final onboarding step: celebration + first-action guidance.
 * Direction D: amber CTA, feature cards with category colors, warm completion.
 */

import React from 'react';

export interface ReadyStepProps {
  name: string;
  onComplete: () => void;
}

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Persistent memory',
    description: 'I remember decisions, preferences, and context across every session.',
    icon: '◆',
    color: 'var(--primary, #d4a843)',
  },
  {
    title: 'Workspace isolation',
    description: 'Each project gets its own memory, sessions, and context — no cross-contamination.',
    icon: '◈',
    color: 'var(--accent, #c084fc)',
  },
  {
    title: 'Local-first & private',
    description: 'Everything stored locally in encrypted .mind files. Your data never leaves your machine.',
    icon: '◇',
    color: 'var(--success, #3ecf8e)',
  },
];

export function ReadyStep({ name, onComplete }: ReadyStepProps) {
  return (
    <div className="ready-step flex flex-col items-center gap-6 p-8">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-bright, #ededef)',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em',
        }}>
          You're all set{name ? `, ${name}` : ''}
        </div>
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          fontFamily: 'Inter, system-ui, sans-serif',
          marginTop: 8,
        }}>
          Your workspace is ready. Here's what makes Waggle different:
        </p>
      </div>

      {/* Feature highlight cards */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        {FEATURE_HIGHLIGHTS.map((feature) => (
          <div
            key={feature.title}
            style={{
              background: 'var(--surface, #14141e)',
              border: '1px solid var(--border, rgba(255,255,255,0.06))',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <span style={{
              color: feature.color,
              fontSize: 14,
              flexShrink: 0,
              marginTop: 2,
            }}>
              {feature.icon}
            </span>
            <div>
              <h3 style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text, #ededef)',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: 0,
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 4,
                lineHeight: 1.5,
              }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <p style={{
          fontSize: 12,
          color: 'var(--text-dim)',
          marginBottom: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Try asking: "What can you help me with?" or "Catch me up on this workspace"
        </p>
        <button
          type="button"
          onClick={onComplete}
          style={{
            background: 'var(--primary, #d4a843)',
            color: '#0a0a12',
            border: 'none',
            borderRadius: 10,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'Inter, system-ui, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 0 20px rgba(212, 168, 67, 0.15)',
          }}
        >
          Start working →
        </button>
      </div>
    </div>
  );
}
