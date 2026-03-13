/**
 * SkillCard — displays a single starter skill in the Install Center.
 *
 * Matches the dark-theme inline-style pattern used by CapabilitySection.
 */

import React from 'react';
import type { StarterSkillEntry } from '../../services/types.js';

export interface SkillCardProps {
  skill: StarterSkillEntry;
  onInstall: (skillId: string) => void;
  installing?: boolean;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary, #1a1a2e)',
  border: '1px solid var(--border, #333)',
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 8,
};

const nameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted, #888)',
  marginTop: 4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

const familyPillStyle: React.CSSProperties = {
  background: 'var(--bg-secondary, #222)',
  border: '1px solid var(--border, #333)',
  borderRadius: 12,
  padding: '2px 10px',
  fontSize: 10,
  color: 'var(--text-muted, #888)',
};

const workflowBadgeStyle: React.CSSProperties = {
  background: '#3b82f622',
  color: '#3b82f6',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
};

function StateBadge({ state }: { state: 'active' | 'installed' }) {
  const color = state === 'active' ? '#22c55e' : '#a78bfa';
  const label = state === 'active' ? 'Active' : 'Installed';
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function InstallButton({
  installing,
  onClick,
}: {
  installing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={installing}
      onClick={onClick}
      style={{
        background: '#3b82f622',
        border: '1px solid #3b82f6',
        borderRadius: 6,
        padding: '4px 14px',
        fontSize: 12,
        fontWeight: 600,
        color: installing ? '#3b82f688' : '#3b82f6',
        cursor: installing ? 'not-allowed' : 'pointer',
        opacity: installing ? 0.6 : 1,
      }}
    >
      {installing ? 'Installing...' : 'Install'}
    </button>
  );
}

export function SkillCard({ skill, onInstall, installing = false }: SkillCardProps) {
  return (
    <div style={cardStyle}>
      {/* Top row: name + state indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={nameStyle}>{skill.name}</span>
        {skill.state === 'available' ? (
          <InstallButton
            installing={installing}
            onClick={() => {
              if (!installing) onInstall(skill.id);
            }}
          />
        ) : (
          <StateBadge state={skill.state} />
        )}
      </div>

      {/* Description */}
      <div style={descriptionStyle}>{skill.description}</div>

      {/* Bottom row: family tag + optional workflow badge */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <span style={familyPillStyle}>{skill.familyLabel}</span>
        {skill.isWorkflow && <span style={workflowBadgeStyle}>Workflow</span>}
      </div>
    </div>
  );
}
