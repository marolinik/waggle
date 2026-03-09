import { describe, it, expect } from 'vitest';
import { CostTracker, type ModelPricing } from '../src/cost-tracker.js';

describe('CostTracker', () => {
  const pricing: Record<string, ModelPricing> = {
    'claude-sonnet': { inputPer1k: 0.003, outputPer1k: 0.015 },
    'claude-haiku': { inputPer1k: 0.00025, outputPer1k: 0.00125 },
  };

  it('tracks token usage per model', () => {
    const tracker = new CostTracker(pricing);
    tracker.addUsage('claude-sonnet', 1000, 500);
    tracker.addUsage('claude-sonnet', 2000, 300);
    const stats = tracker.getStats();
    expect(stats.totalInputTokens).toBe(3000);
    expect(stats.totalOutputTokens).toBe(800);
  });

  it('estimates cost', () => {
    const tracker = new CostTracker(pricing);
    tracker.addUsage('claude-sonnet', 1000, 1000);
    const stats = tracker.getStats();
    expect(stats.estimatedCost).toBeCloseTo(0.018, 4);
  });

  it('handles unknown models gracefully', () => {
    const tracker = new CostTracker(pricing);
    tracker.addUsage('unknown-model', 1000, 500);
    const stats = tracker.getStats();
    expect(stats.totalInputTokens).toBe(1000);
    expect(stats.estimatedCost).toBe(0);
  });

  it('formats summary', () => {
    const tracker = new CostTracker(pricing);
    tracker.addUsage('claude-sonnet', 1000, 500);
    const summary = tracker.formatSummary();
    expect(summary).toContain('1000');
    expect(summary).toContain('500');
    expect(summary).toContain('$');
  });
});
