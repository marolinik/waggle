import { describe, it, expect } from 'vitest';
import { buildSelfAwareness, type AgentCapabilities } from '../src/self-awareness.js';

describe('Self-Awareness', () => {
  it('builds awareness with tools, skills, and stats', () => {
    const caps: AgentCapabilities = {
      tools: [
        { name: 'search_memory', description: 'Search saved memories' },
        { name: 'save_memory', description: 'Save a new memory' },
      ],
      skills: ['code-review', 'summarize'],
      model: 'claude-sonnet-4-20250514',
      memoryStats: { frameCount: 42, sessionCount: 5, entityCount: 10 },
      mode: 'local',
      version: '0.3.0',
    };

    const result = buildSelfAwareness(caps);

    // Header
    expect(result).toContain('# Self-Awareness');

    // Version, mode, model
    expect(result).toContain('v0.3.0');
    expect(result).toContain('local');
    expect(result).toContain('claude-sonnet-4-20250514');

    // Tools — now summarized, not listed individually
    expect(result).toContain('2 tools available');

    // Skills
    expect(result).toContain('code-review');
    expect(result).toContain('summarize');

    // Memory stats
    expect(result).toContain('42 memories across 5 sessions, 10 knowledge entities');
    expect(result).toContain('search_memory');

    // Footer
    expect(result).toContain('what can you do?');
  });

  it('includes skills when present', () => {
    const caps: AgentCapabilities = {
      tools: [{ name: 'test_tool', description: 'A test tool' }],
      skills: ['data-analysis', 'translation', 'code-gen'],
      model: 'gpt-4o',
      memoryStats: { frameCount: 0, sessionCount: 0, entityCount: 0 },
      mode: 'team',
      version: '1.0.0',
    };

    const result = buildSelfAwareness(caps);

    expect(result).toContain('Active Skills');
    expect(result).toContain('data-analysis');
    expect(result).toContain('translation');
    expect(result).toContain('code-gen');
  });

  it('handles empty state gracefully', () => {
    const caps: AgentCapabilities = {
      tools: [],
      skills: [],
      model: 'unknown',
      memoryStats: { frameCount: 0, sessionCount: 0, entityCount: 0 },
      mode: 'local',
      version: '0.0.0',
    };

    const result = buildSelfAwareness(caps);

    expect(result).toContain('0 tools available');
    expect(result).toContain('empty');
    expect(result).toContain('fresh start');
  });
});
