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
    expect(result).toContain('# Self-Awareness (auto-generated');
    expect(result).toContain('do NOT web search');

    // Version, mode, model
    expect(result).toContain('Version: 0.3.0');
    expect(result).toContain('Mode: local');
    expect(result).toContain('Current model: claude-sonnet-4-20250514');

    // Tools section
    expect(result).toContain('## Available Tools');
    expect(result).toContain('- search_memory: Search saved memories');
    expect(result).toContain('- save_memory: Save a new memory');

    // Skills section
    expect(result).toContain('## Installed Skills');
    expect(result).toContain('- code-review');
    expect(result).toContain('- summarize');

    // Memory section
    expect(result).toContain('## Memory');
    expect(result).toContain('42 memories across 5 sessions, 10 knowledge entities.');

    // Footer
    expect(result).toContain('When asked "what can you do?" or "who are you?"');
    expect(result).toContain('Do NOT search the web about yourself.');
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

    expect(result).toContain('## Installed Skills');
    expect(result).toContain('- data-analysis');
    expect(result).toContain('- translation');
    expect(result).toContain('- code-gen');
    expect(result).not.toContain('No skills installed.');
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

    expect(result).toContain('No tools loaded.');
    expect(result).toContain('No skills installed.');
    expect(result).toContain('0 memories across 0 sessions, 0 knowledge entities.');
  });
});
