import { describe, it, expect, vi } from 'vitest';
import { needsConfirmation, ConfirmationGate } from '../src/confirmation.js';

describe('needsConfirmation', () => {
  it('returns true for bash', () => {
    expect(needsConfirmation('bash')).toBe(true);
  });

  it('returns true for write_file', () => {
    expect(needsConfirmation('write_file')).toBe(true);
  });

  it('returns true for edit_file', () => {
    expect(needsConfirmation('edit_file')).toBe(true);
  });

  it('returns true for git_commit', () => {
    expect(needsConfirmation('git_commit')).toBe(true);
  });

  it('returns false for read_file', () => {
    expect(needsConfirmation('read_file')).toBe(false);
  });
});

describe('ConfirmationGate', () => {
  it('non-interactive auto-approves everything', async () => {
    const gate = new ConfirmationGate({ interactive: false });
    expect(await gate.confirm('bash', { command: 'rm -rf /' })).toBe(true);
  });

  it('autoApprove list auto-approves listed tools', async () => {
    const gate = new ConfirmationGate({ autoApprove: ['write_file'] });
    expect(await gate.confirm('write_file', { path: '/tmp/x' })).toBe(true);
  });

  it('calls promptFn for tools needing confirmation', async () => {
    const promptFn = vi.fn().mockResolvedValue(false);
    const gate = new ConfirmationGate({ promptFn });
    // Use a destructive command that requires confirmation
    const result = await gate.confirm('bash', { command: 'rm -rf /tmp/foo' });
    expect(result).toBe(false);
    expect(promptFn).toHaveBeenCalledWith('bash', { command: 'rm -rf /tmp/foo' });
  });

  it('auto-approves safe bash commands without calling promptFn', async () => {
    const promptFn = vi.fn().mockResolvedValue(false);
    const gate = new ConfirmationGate({ promptFn });
    const result = await gate.confirm('bash', { command: 'ls -la' });
    expect(result).toBe(true);
    expect(promptFn).not.toHaveBeenCalled();
  });

  it('auto-approves tools that do not need confirmation', async () => {
    const promptFn = vi.fn().mockResolvedValue(false);
    const gate = new ConfirmationGate({ promptFn });
    const result = await gate.confirm('read_file', { path: '/tmp/x' });
    expect(result).toBe(true);
    expect(promptFn).not.toHaveBeenCalled();
  });
});
