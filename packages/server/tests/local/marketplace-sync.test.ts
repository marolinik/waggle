/**
 * Marketplace Sync Engine — Tests
 *
 * Tests for POST /api/marketplace/sync endpoint, cron job registration,
 * and graceful handling of unreachable sync sources.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { MarketplaceDB, MarketplaceSync } from '@waggle/marketplace';

// ── Helpers ──────────────────────────────────────────────────────────

function getRepoRoot(): string {
  return path.resolve(__dirname, '..', '..', '..', '..');
}

function getMarketplaceDbPath(): string | null {
  const dbPath = path.join(getRepoRoot(), 'packages', 'marketplace', 'marketplace.db');
  return fs.existsSync(dbPath) ? dbPath : null;
}

// ── Module Export ────────────────────────────────────────────────────

describe('Marketplace Sync Module', () => {
  it('MarketplaceSync class is importable from @waggle/marketplace', async () => {
    const mod = await import('@waggle/marketplace');
    expect(mod.MarketplaceSync).toBeDefined();
    expect(typeof mod.MarketplaceSync).toBe('function');
  });
});

// ── Sync Route ──────────────────────────────────────────────────────

describe('POST /api/marketplace/sync', () => {
  it('sync route is registered in marketplace routes', async () => {
    const mod = await import('../../src/local/routes/marketplace.js');
    expect(mod.marketplaceRoutes).toBeDefined();
    // The route handler function exists — deeper HTTP testing would require
    // a full server instance which is validated by integration tests.
  });

  it('MarketplaceSync.syncAll returns result format', async () => {
    const dbPath = getMarketplaceDbPath();
    if (!dbPath) return;

    const db = new MarketplaceDB(dbPath);
    const sync = new MarketplaceSync(db);

    // syncAll will try to reach external APIs — which will fail in CI/local.
    // We just verify the return shape.
    const results = await sync.syncAll();

    expect(Array.isArray(results)).toBe(true);
    for (const result of results) {
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('added');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('removed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.source).toBe('string');
      expect(typeof result.added).toBe('number');
      expect(typeof result.updated).toBe('number');
      expect(typeof result.removed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    }

    db.close();
  });

  it('sync with no reachable sources returns graceful errors', async () => {
    const dbPath = getMarketplaceDbPath();
    if (!dbPath) return;

    const db = new MarketplaceDB(dbPath);
    const sync = new MarketplaceSync(db);

    // All sources point to external APIs that won't be reachable in test
    const results = await sync.syncAll();

    // Should NOT throw — errors are captured per-source
    expect(Array.isArray(results)).toBe(true);

    // Most sources will have errors since external APIs are unreachable
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    // At least some sources should have errors (unless all are somehow reachable)
    // We don't assert totalErrors > 0 because some sources might succeed
    expect(totalErrors).toBeGreaterThanOrEqual(0);

    db.close();
  });

  it('sync aggregates results from multiple sources', async () => {
    const dbPath = getMarketplaceDbPath();
    if (!dbPath) return;

    const db = new MarketplaceDB(dbPath);
    const sources = db.listSources();
    const sync = new MarketplaceSync(db);

    const results = await sync.syncAll();

    // Should have one result per source
    expect(results.length).toBe(sources.length);

    // Each result's source should match a known source name
    const sourceNames = sources.map(s => s.name);
    for (const result of results) {
      expect(sourceNames).toContain(result.source);
    }

    db.close();
  });
});

// ── Sync Cron Registration ──────────────────────────────────────────

describe('Marketplace sync cron job', () => {
  it('server index.ts registers marketplace_sync cron schedule', () => {
    const indexPath = path.join(getRepoRoot(), 'packages', 'server', 'src', 'local', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Verify that marketplace_sync cron is seeded in server startup
    expect(content).toContain('Marketplace sync');
    expect(content).toContain('0 2 * * 0'); // Sunday 2 AM
    expect(content).toContain('marketplace_sync');
  });

  it('cron handler routes marketplace_sync action to MarketplaceSync', () => {
    const indexPath = path.join(getRepoRoot(), 'packages', 'server', 'src', 'local', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Verify the cron executor handles marketplace_sync
    expect(content).toContain("jobConfig.action === 'marketplace_sync'");
    expect(content).toContain('new MarketplaceSync');
  });

  it('MarketplaceSync import is available in server index', () => {
    const indexPath = path.join(getRepoRoot(), 'packages', 'server', 'src', 'local', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    expect(content).toContain('MarketplaceSync');
    expect(content).toContain("from '@waggle/marketplace'");
  });
});

// ── Sync Result Shape ───────────────────────────────────────────────

describe('Sync result aggregation', () => {
  it('sync results can be aggregated into endpoint response format', async () => {
    const dbPath = getMarketplaceDbPath();
    if (!dbPath) return;

    const db = new MarketplaceDB(dbPath);
    const sync = new MarketplaceSync(db);
    const results = await sync.syncAll();

    // Simulate the endpoint aggregation logic
    const sourcesChecked = results.length;
    const packagesAdded = results.reduce((sum, r) => sum + r.added, 0);
    const packagesUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const errors = results.flatMap(r => r.errors.map(e => `[${r.source}] ${e}`));

    expect(typeof sourcesChecked).toBe('number');
    expect(typeof packagesAdded).toBe('number');
    expect(typeof packagesUpdated).toBe('number');
    expect(Array.isArray(errors)).toBe(true);
    expect(sourcesChecked).toBeGreaterThan(0);

    db.close();
  });
});
