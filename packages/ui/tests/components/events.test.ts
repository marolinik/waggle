/**
 * Event stream component tests.
 *
 * Tests utility functions and exports only — no jsdom/React Testing Library.
 * React component rendering is tested in the desktop app's E2E suite.
 */

import { describe, it, expect } from 'vitest';
import {
  getStepIcon,
  getStepColor,
  getStepTypeColor,
  formatStepDuration,
  formatStepTimestamp,
  categorizeStep,
  mergeStep,
  STEP_ICONS,
  STEP_COLORS,
  STEP_TYPE_COLORS,
  filterSteps,
  EventStream,
  StepCard,
  useEvents,
} from '../../src/index.js';
import type { AgentStep, StepFilter } from '../../src/index.js';

// ── Test data ───────────────────────────────────────────────────────

function makeStep(overrides: Partial<AgentStep> = {}): AgentStep {
  return {
    id: 'step-1',
    type: 'thinking',
    name: 'Reasoning',
    description: 'Analyzing the problem',
    timestamp: '2026-03-09T14:30:45.123Z',
    duration: 1234,
    status: 'success',
    ...overrides,
  };
}

// ── getStepIcon ─────────────────────────────────────────────────────

describe('getStepIcon', () => {
  it('returns brain icon for thinking', () => {
    expect(getStepIcon('thinking')).toBe('brain');
  });

  it('returns tool icon for tool', () => {
    expect(getStepIcon('tool')).toBe('tool');
  });

  it('returns magnifier icon for search', () => {
    expect(getStepIcon('search')).toBe('magnifier');
  });

  it('returns globe icon for web', () => {
    expect(getStepIcon('web')).toBe('globe');
  });

  it('returns pen icon for writing', () => {
    expect(getStepIcon('writing')).toBe('pen');
  });

  it('returns alert icon for error', () => {
    expect(getStepIcon('error')).toBe('alert');
  });

  it('returns default icon for unknown type', () => {
    expect(getStepIcon('unknown')).toBe('step');
  });
});

// ── getStepColor ────────────────────────────────────────────────────

describe('getStepColor', () => {
  it('returns blue for running', () => {
    expect(getStepColor('running')).toBe('#3b82f6');
  });

  it('returns green for success', () => {
    expect(getStepColor('success')).toBe('#22c55e');
  });

  it('returns yellow for pending', () => {
    expect(getStepColor('pending')).toBe('#eab308');
  });

  it('returns red for error', () => {
    expect(getStepColor('error')).toBe('#ef4444');
  });

  it('returns gray for skipped', () => {
    expect(getStepColor('skipped')).toBe('#6b7280');
  });

  it('returns gray for unknown status', () => {
    expect(getStepColor('unknown')).toBe('#6b7280');
  });
});

// ── getStepTypeColor ────────────────────────────────────────────────

describe('getStepTypeColor', () => {
  it('returns blue for thinking', () => {
    expect(getStepTypeColor('thinking')).toBe('#3b82f6');
  });

  it('returns purple for search', () => {
    expect(getStepTypeColor('search')).toBe('#8b5cf6');
  });

  it('returns cyan for web', () => {
    expect(getStepTypeColor('web')).toBe('#06b6d4');
  });

  it('returns green for tool', () => {
    expect(getStepTypeColor('tool')).toBe('#22c55e');
  });

  it('returns amber for writing', () => {
    expect(getStepTypeColor('writing')).toBe('#f59e0b');
  });

  it('returns red for error', () => {
    expect(getStepTypeColor('error')).toBe('#ef4444');
  });

  it('returns gray for unknown type', () => {
    expect(getStepTypeColor('unknown')).toBe('#6b7280');
  });
});

// ── formatStepDuration ──────────────────────────────────────────────

describe('formatStepDuration', () => {
  it('formats sub-second as milliseconds', () => {
    expect(formatStepDuration(250)).toBe('250ms');
  });

  it('formats seconds with one decimal', () => {
    expect(formatStepDuration(1200)).toBe('1.2s');
  });

  it('formats exact seconds without decimal', () => {
    expect(formatStepDuration(3000)).toBe('3.0s');
  });

  it('formats minutes and seconds', () => {
    expect(formatStepDuration(150000)).toBe('2m 30s');
  });

  it('formats exactly one minute', () => {
    expect(formatStepDuration(60000)).toBe('1m 0s');
  });

  it('handles zero', () => {
    expect(formatStepDuration(0)).toBe('0ms');
  });

  it('handles sub-millisecond (rounds down)', () => {
    expect(formatStepDuration(0.5)).toBe('0ms');
  });
});

// ── formatStepTimestamp ─────────────────────────────────────────────

describe('formatStepTimestamp', () => {
  it('formats ISO timestamp to UTC HH:MM:SS', () => {
    expect(formatStepTimestamp('2026-03-09T14:30:45.123Z')).toBe('14:30:45');
  });

  it('handles midnight', () => {
    expect(formatStepTimestamp('2026-01-01T00:00:00.000Z')).toBe('00:00:00');
  });

  it('handles end of day', () => {
    expect(formatStepTimestamp('2026-12-31T23:59:59.999Z')).toBe('23:59:59');
  });
});

// ── categorizeStep ──────────────────────────────────────────────────

describe('categorizeStep', () => {
  it('returns "Reasoning" for thinking type', () => {
    expect(categorizeStep(makeStep({ type: 'thinking' }))).toBe('Reasoning');
  });

  it('returns "Tool Use" for tool type', () => {
    expect(categorizeStep(makeStep({ type: 'tool' }))).toBe('Tool Use');
  });

  it('returns "Search" for search type', () => {
    expect(categorizeStep(makeStep({ type: 'search' }))).toBe('Search');
  });

  it('returns "Web" for web type', () => {
    expect(categorizeStep(makeStep({ type: 'web' }))).toBe('Web');
  });

  it('returns "Writing" for writing type', () => {
    expect(categorizeStep(makeStep({ type: 'writing' }))).toBe('Writing');
  });

  it('returns "Error" for error type', () => {
    expect(categorizeStep(makeStep({ type: 'error' }))).toBe('Error');
  });

  it('returns "Other" for unknown type', () => {
    expect(categorizeStep(makeStep({ type: 'unknown' as AgentStep['type'] }))).toBe('Other');
  });
});

// ── mergeStep ───────────────────────────────────────────────────────

describe('mergeStep', () => {
  it('appends a new step when id does not exist', () => {
    const existing = [makeStep({ id: 'a' })];
    const result = mergeStep(existing, makeStep({ id: 'b', name: 'New' }));
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('b');
  });

  it('upserts existing step by id', () => {
    const existing = [
      makeStep({ id: 'a', status: 'running' }),
      makeStep({ id: 'b', status: 'running' }),
    ];
    const updated = makeStep({ id: 'a', status: 'success' });
    const result = mergeStep(existing, updated);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('success');
  });

  it('preserves order on upsert', () => {
    const existing = [
      makeStep({ id: 'a' }),
      makeStep({ id: 'b' }),
      makeStep({ id: 'c' }),
    ];
    const updated = makeStep({ id: 'b', name: 'Updated' });
    const result = mergeStep(existing, updated);
    expect(result.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(result[1].name).toBe('Updated');
  });

  it('works with empty array', () => {
    const result = mergeStep([], makeStep({ id: 'x' }));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('x');
  });
});

// ── STEP_ICONS constant ─────────────────────────────────────────────

describe('STEP_ICONS', () => {
  it('has entries for all step types', () => {
    expect(STEP_ICONS).toHaveProperty('thinking', 'brain');
    expect(STEP_ICONS).toHaveProperty('tool', 'tool');
    expect(STEP_ICONS).toHaveProperty('search', 'magnifier');
    expect(STEP_ICONS).toHaveProperty('web', 'globe');
    expect(STEP_ICONS).toHaveProperty('writing', 'pen');
    expect(STEP_ICONS).toHaveProperty('error', 'alert');
  });
});

// ── STEP_COLORS constant ───────────────────────────────────────────

describe('STEP_COLORS', () => {
  it('has entries for all statuses', () => {
    expect(STEP_COLORS).toHaveProperty('running');
    expect(STEP_COLORS).toHaveProperty('success');
    expect(STEP_COLORS).toHaveProperty('pending');
    expect(STEP_COLORS).toHaveProperty('error');
    expect(STEP_COLORS).toHaveProperty('skipped');
  });
});

// ── STEP_TYPE_COLORS constant ──────────────────────────────────────

describe('STEP_TYPE_COLORS', () => {
  it('has entries for all step types', () => {
    expect(STEP_TYPE_COLORS).toHaveProperty('thinking');
    expect(STEP_TYPE_COLORS).toHaveProperty('search');
    expect(STEP_TYPE_COLORS).toHaveProperty('web');
    expect(STEP_TYPE_COLORS).toHaveProperty('tool');
    expect(STEP_TYPE_COLORS).toHaveProperty('writing');
    expect(STEP_TYPE_COLORS).toHaveProperty('error');
  });
});

// ── filterSteps ─────────────────────────────────────────────────────

describe('filterSteps', () => {
  const steps: AgentStep[] = [
    makeStep({ id: '1', type: 'thinking', status: 'success' }),
    makeStep({ id: '2', type: 'tool', status: 'running' }),
    makeStep({ id: '3', type: 'search', status: 'error' }),
    makeStep({ id: '4', type: 'web', status: 'success' }),
    makeStep({ id: '5', type: 'writing', status: 'skipped' }),
  ];

  it('returns all steps with empty filter', () => {
    expect(filterSteps(steps, {})).toHaveLength(5);
  });

  it('filters by single type', () => {
    const result = filterSteps(steps, { types: ['thinking'] });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('thinking');
  });

  it('filters by multiple types', () => {
    const result = filterSteps(steps, { types: ['thinking', 'tool'] });
    expect(result).toHaveLength(2);
  });

  it('filters by single status', () => {
    const result = filterSteps(steps, { statuses: ['success'] });
    expect(result).toHaveLength(2);
  });

  it('filters by multiple statuses', () => {
    const result = filterSteps(steps, { statuses: ['success', 'running'] });
    expect(result).toHaveLength(3);
  });

  it('combines type and status filters (AND logic)', () => {
    const result = filterSteps(steps, { types: ['thinking', 'tool'], statuses: ['success'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns empty array when no matches', () => {
    const result = filterSteps(steps, { types: ['error'], statuses: ['pending'] });
    expect(result).toHaveLength(0);
  });

  it('handles empty types array as no filter', () => {
    const result = filterSteps(steps, { types: [] });
    expect(result).toHaveLength(5);
  });

  it('handles empty statuses array as no filter', () => {
    const result = filterSteps(steps, { statuses: [] });
    expect(result).toHaveLength(5);
  });
});

// ── Export checks ───────────────────────────────────────────────────

describe('event stream exports', () => {
  it('exports EventStream component', () => {
    expect(EventStream).toBeDefined();
    expect(typeof EventStream).toBe('function');
  });

  it('exports StepCard component', () => {
    expect(StepCard).toBeDefined();
    expect(typeof StepCard).toBe('function');
  });

  it('exports useEvents hook', () => {
    expect(useEvents).toBeDefined();
    expect(typeof useEvents).toBe('function');
  });

  it('exports utility functions', () => {
    expect(typeof getStepIcon).toBe('function');
    expect(typeof getStepColor).toBe('function');
    expect(typeof getStepTypeColor).toBe('function');
    expect(typeof formatStepDuration).toBe('function');
    expect(typeof formatStepTimestamp).toBe('function');
    expect(typeof categorizeStep).toBe('function');
    expect(typeof mergeStep).toBe('function');
    expect(typeof filterSteps).toBe('function');
  });

  it('exports constants', () => {
    expect(STEP_ICONS).toBeDefined();
    expect(STEP_COLORS).toBeDefined();
    expect(STEP_TYPE_COLORS).toBeDefined();
  });
});
