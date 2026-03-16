/**
 * NameStep — first onboarding step: Welcome + name.
 * Direction D: Inter for headings, amber accents, warm welcome.
 */

import React from 'react';
import { validateName } from '../utils.js';

export interface NameStepProps {
  name: string;
  onChange: (name: string) => void;
  onContinue: () => void;
}

export function NameStep({ name, onChange, onContinue }: NameStepProps) {
  const validation = validateName(name);
  const canContinue = validation.valid;
  const showError = name.length > 0 && !validation.valid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      onContinue();
    }
  };

  return (
    <div className="name-step flex flex-col items-center gap-6 p-8">
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          color: 'var(--primary, #d4a843)',
          marginBottom: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Your AI Operating System
        </div>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-bright, #ededef)',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Welcome to Waggle
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted, rgba(237,237,239,0.65))',
          marginTop: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Persistent memory. Workspace-native. Built for knowledge work.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-1">
        <label style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          color: 'var(--text-muted)',
          marginBottom: 4,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          What should I call you?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--surface, #14141e)',
            border: '1px solid var(--border, rgba(255,255,255,0.06))',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 16,
            textAlign: 'center' as const,
            color: 'var(--text, #ededef)',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          placeholder="Your name"
          autoFocus
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary, #d4a843)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border, rgba(255,255,255,0.06))'; }}
        />
        {showError && validation.error && (
          <p className="text-xs text-center" style={{ color: 'var(--error, #ef4444)', marginTop: 4 }}>
            {validation.error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          background: canContinue ? 'var(--primary, #d4a843)' : 'var(--surface-3, #22222e)',
          color: canContinue ? '#0a0a12' : 'var(--text-dim)',
          border: 'none',
          borderRadius: 10,
          padding: '10px 28px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        Continue →
      </button>
    </div>
  );
}
