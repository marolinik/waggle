import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VaultStore, type VaultEntry } from '../src/vault.js';

describe('VaultStore', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-vault-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('set and get — store a secret, retrieve it, value matches', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    vault.set('anthropic', 'sk-ant-secret-key-123');

    const entry = vault.get('anthropic');
    expect(entry).not.toBeNull();
    expect(entry!.name).toBe('anthropic');
    expect(entry!.value).toBe('sk-ant-secret-key-123');
    expect(entry!.updatedAt).toBeTruthy();
  });

  it('set overwrites — set same name twice, get returns latest', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    vault.set('openai', 'sk-old-key');
    vault.set('openai', 'sk-new-key');

    const entry = vault.get('openai');
    expect(entry).not.toBeNull();
    expect(entry!.value).toBe('sk-new-key');
  });

  it('get nonexistent — returns null', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    expect(vault.get('doesnotexist')).toBeNull();
  });

  it('delete — removes secret, get returns null after', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    vault.set('anthropic', 'sk-ant-key');
    expect(vault.delete('anthropic')).toBe(true);
    expect(vault.get('anthropic')).toBeNull();
  });

  it('delete nonexistent — returns false', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    expect(vault.delete('nope')).toBe(false);
  });

  it('list — shows names + metadata without values', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    vault.set('anthropic', 'sk-ant-key', { models: ['claude-sonnet-4-6'] });
    vault.set('openai', 'sk-openai-key', { models: ['gpt-4o'], baseUrl: 'https://api.openai.com' });

    const entries = vault.list();
    expect(entries).toHaveLength(2);

    const names = entries.map(e => e.name);
    expect(names).toContain('anthropic');
    expect(names).toContain('openai');

    // list must NOT contain secret values
    for (const entry of entries) {
      expect(entry).not.toHaveProperty('value');
      expect(entry.updatedAt).toBeTruthy();
    }

    const anthropicEntry = entries.find(e => e.name === 'anthropic')!;
    expect(anthropicEntry.metadata).toEqual({ models: ['claude-sonnet-4-6'] });
  });

  it('has — returns true for existing, false for missing', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    vault.set('anthropic', 'sk-ant-key');

    expect(vault.has('anthropic')).toBe(true);
    expect(vault.has('missing')).toBe(false);
  });

  it('encryption is real — vault.json does NOT contain plaintext value', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);
    const secret = 'sk-ant-super-secret-api-key-12345';

    vault.set('anthropic', secret);

    const rawContent = fs.readFileSync(path.join(dir, 'vault.json'), 'utf-8');
    expect(rawContent).not.toContain(secret);

    // The encrypted field should exist and contain hex data with colons (iv:tag:ciphertext)
    const parsed = JSON.parse(rawContent);
    expect(parsed.anthropic.encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  it('different VaultStore instances with same key can decrypt', () => {
    const dir = makeTempDir();
    const vault1 = new VaultStore(dir);
    vault1.set('anthropic', 'sk-ant-shared-secret');

    // Create a second instance pointing at the same directory (same key file)
    const vault2 = new VaultStore(dir);
    const entry = vault2.get('anthropic');

    expect(entry).not.toBeNull();
    expect(entry!.value).toBe('sk-ant-shared-secret');
  });

  it('migration from config — providers migrated to vault', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    const config = {
      providers: {
        anthropic: { apiKey: 'sk-ant-key-1', models: ['claude-sonnet-4-6'], baseUrl: undefined },
        openai: { apiKey: 'sk-openai-key-1', models: ['gpt-4o'] },
      },
    };

    const migrated = vault.migrateFromConfig(config as any);
    expect(migrated).toBe(2);

    const anthropic = vault.get('anthropic');
    expect(anthropic).not.toBeNull();
    expect(anthropic!.value).toBe('sk-ant-key-1');
    expect(anthropic!.metadata?.models).toEqual(['claude-sonnet-4-6']);

    const openai = vault.get('openai');
    expect(openai).not.toBeNull();
    expect(openai!.value).toBe('sk-openai-key-1');
  });

  it('migration skips existing — migrate twice, count stays same', () => {
    const dir = makeTempDir();
    const vault = new VaultStore(dir);

    const config = {
      providers: {
        anthropic: { apiKey: 'sk-ant-key-1', models: ['claude-sonnet-4-6'] },
      },
    };

    const first = vault.migrateFromConfig(config as any);
    expect(first).toBe(1);

    const second = vault.migrateFromConfig(config as any);
    expect(second).toBe(0);
  });

  it('key file is generated on first use and reused', () => {
    const dir = makeTempDir();
    new VaultStore(dir);

    const keyPath = path.join(dir, '.vault-key');
    expect(fs.existsSync(keyPath)).toBe(true);

    // Key should be 64 hex chars (32 bytes)
    const keyHex = fs.readFileSync(keyPath, 'utf-8').trim();
    expect(keyHex).toMatch(/^[0-9a-f]{64}$/);

    // Second instance should use the same key (not overwrite)
    new VaultStore(dir);
    const keyHex2 = fs.readFileSync(keyPath, 'utf-8').trim();
    expect(keyHex2).toBe(keyHex);
  });
});
