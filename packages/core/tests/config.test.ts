import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WaggleConfig, type ProviderEntry } from '../src/config.js';

describe('WaggleConfig', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-config-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('creates config directory if missing', () => {
    const base = makeTempDir();
    const configDir = path.join(base, 'nested', '.waggle');

    new WaggleConfig(configDir);

    expect(fs.existsSync(configDir)).toBe(true);
  });

  it('returns default config when no file exists', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    expect(config.getDefaultModel()).toBe('claude-sonnet-4-6');
    expect(config.getProviders()).toEqual({});
    expect(config.getMindPath()).toBe(path.join(configDir, 'default.mind'));
  });

  it('saves and loads provider config', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    const provider: ProviderEntry = {
      apiKey: 'sk-test-key',
      models: ['claude-sonnet-4-6', 'claude-haiku-3'],
      baseUrl: 'https://api.anthropic.com',
    };

    config.setProvider('anthropic', provider);
    config.save();

    // Load fresh instance from same directory
    const config2 = new WaggleConfig(configDir);
    const providers = config2.getProviders();

    expect(providers['anthropic']).toEqual(provider);
    expect(providers['anthropic'].apiKey).toBe('sk-test-key');
    expect(providers['anthropic'].models).toHaveLength(2);
  });

  it('sets and gets default model', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    config.setDefaultModel('gpt-4o');
    config.save();

    const config2 = new WaggleConfig(configDir);
    expect(config2.getDefaultModel()).toBe('gpt-4o');
  });

  it('returns mind file path', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    expect(config.getMindPath()).toBe(path.join(configDir, 'default.mind'));
  });

  it('removes a provider', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    config.setProvider('anthropic', { apiKey: 'key1', models: ['m1'] });
    config.setProvider('openai', { apiKey: 'key2', models: ['m2'] });
    config.removeProvider('anthropic');
    config.save();

    const config2 = new WaggleConfig(configDir);
    const providers = config2.getProviders();
    expect(providers['anthropic']).toBeUndefined();
    expect(providers['openai']).toBeDefined();
  });

  it('returns config directory path', () => {
    const configDir = makeTempDir();
    const config = new WaggleConfig(configDir);

    expect(config.getConfigDir()).toBe(configDir);
  });
});
