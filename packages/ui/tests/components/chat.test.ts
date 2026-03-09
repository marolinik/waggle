/**
 * Chat component tests.
 *
 * Tests utility functions and exports only — no jsdom/React Testing Library.
 * React component rendering is tested in the desktop app's E2E suite.
 */

import { describe, it, expect } from 'vitest';
import {
  getToolStatusColor,
  formatDuration,
  ChatArea,
  ChatMessage,
  ChatInput,
  ToolCard,
  ApprovalGate,
  useChat,
  processStreamEvent,
} from '../../src/index.js';
import type { ToolUseEvent, StreamEvent } from '../../src/index.js';

// ── getToolStatusColor ───────────────────────────────────────────────

describe('getToolStatusColor', () => {
  it('returns green for a completed tool', () => {
    const tool: ToolUseEvent = {
      name: 'read_file',
      input: { path: '/foo' },
      requiresApproval: false,
    };
    expect(getToolStatusColor(tool)).toBe('green');
  });

  it('returns green for an approved tool', () => {
    const tool: ToolUseEvent = {
      name: 'write_file',
      input: { path: '/foo' },
      requiresApproval: true,
      approved: true,
    };
    expect(getToolStatusColor(tool)).toBe('green');
  });

  it('returns yellow for a tool pending approval', () => {
    const tool: ToolUseEvent = {
      name: 'bash',
      input: { command: 'rm -rf /' },
      requiresApproval: true,
      // approved is undefined
    };
    expect(getToolStatusColor(tool)).toBe('yellow');
  });

  it('returns red for a denied tool', () => {
    const tool: ToolUseEvent = {
      name: 'bash',
      input: { command: 'rm -rf /' },
      requiresApproval: true,
      approved: false,
    };
    expect(getToolStatusColor(tool)).toBe('red');
  });

  it('returns red when approved is false even without requiresApproval', () => {
    const tool: ToolUseEvent = {
      name: 'bash',
      input: {},
      requiresApproval: false,
      approved: false,
    };
    expect(getToolStatusColor(tool)).toBe('red');
  });
});

// ── formatDuration ───────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats sub-second durations in milliseconds', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(42)).toBe('42ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats durations >= 1s in seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(12345)).toBe('12.3s');
  });
});

// ── processStreamEvent ──────────────────────────────────────────────

describe('processStreamEvent', () => {
  const empty = { content: '', tools: [] as ToolUseEvent[] };

  it('appends token content', () => {
    const event: StreamEvent = { type: 'token', content: 'Hello' };
    const result = processStreamEvent(event, empty);
    expect(result.content).toBe('Hello');
  });

  it('accumulates multiple tokens', () => {
    const state1 = processStreamEvent(
      { type: 'token', content: 'Hello ' },
      empty,
    );
    const state2 = processStreamEvent(
      { type: 'token', content: 'world' },
      state1,
    );
    expect(state2.content).toBe('Hello world');
  });

  it('adds a tool on tool event', () => {
    const event: StreamEvent = {
      type: 'tool',
      name: 'read_file',
      input: { path: '/foo.ts' },
    };
    const result = processStreamEvent(event, empty);
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('read_file');
    expect(result.tools[0].input).toEqual({ path: '/foo.ts' });
  });

  it('updates last tool with result on tool_result event', () => {
    const withTool = processStreamEvent(
      { type: 'tool', name: 'bash', input: { command: 'ls' } },
      empty,
    );
    const result = processStreamEvent(
      { type: 'tool_result', result: 'file1.ts\nfile2.ts' },
      withTool,
    );
    expect(result.tools[0].result).toBe('file1.ts\nfile2.ts');
  });

  it('appends error content on error event', () => {
    const event: StreamEvent = { type: 'error', content: 'timeout' };
    const result = processStreamEvent(event, empty);
    expect(result.content).toContain('[Error: timeout]');
  });

  it('does not modify content for step events', () => {
    const event: StreamEvent = { type: 'step' };
    const result = processStreamEvent(event, { content: 'existing', tools: [] });
    expect(result.content).toBe('existing');
  });

  it('does not modify content for done events', () => {
    const event: StreamEvent = { type: 'done' };
    const result = processStreamEvent(event, { content: 'existing', tools: [] });
    expect(result.content).toBe('existing');
  });

  it('handles tool_result when no tools exist gracefully', () => {
    const event: StreamEvent = { type: 'tool_result', result: 'orphan' };
    const result = processStreamEvent(event, empty);
    // Should not crash, tools array remains empty
    expect(result.tools).toHaveLength(0);
  });
});

// ── Component exports ───────────────────────────────────────────────

describe('component exports', () => {
  it('exports ChatArea as a function', () => {
    expect(typeof ChatArea).toBe('function');
  });

  it('exports ChatMessage as a function', () => {
    expect(typeof ChatMessage).toBe('function');
  });

  it('exports ChatInput as a function', () => {
    expect(typeof ChatInput).toBe('function');
  });

  it('exports ToolCard as a function', () => {
    expect(typeof ToolCard).toBe('function');
  });

  it('exports ApprovalGate as a function', () => {
    expect(typeof ApprovalGate).toBe('function');
  });

  it('exports useChat as a function', () => {
    expect(typeof useChat).toBe('function');
  });

  it('exports processStreamEvent as a function', () => {
    expect(typeof processStreamEvent).toBe('function');
  });
});
