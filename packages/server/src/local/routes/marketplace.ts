/**
 * Marketplace Production Routes
 *
 * Always-available API endpoints for the marketplace — search catalog,
 * list/install/uninstall packages, query packs, and run security scans.
 *
 * These replace the dev-only /_dev/marketplace/ routes with stable
 * /api/marketplace/ contracts.
 */

import type { FastifyInstance } from 'fastify';
import { MarketplaceDB, MarketplaceInstaller, SecurityGate } from '@waggle/marketplace';
import type { InstallationType } from '@waggle/marketplace';

export async function marketplaceRoutes(fastify: FastifyInstance) {
  // ── Helpers ──────────────────────────────────────────────────────────

  function getDb(): MarketplaceDB | null {
    return (fastify as any).marketplace ?? null;
  }

  function requireDb(reply: any): MarketplaceDB | null {
    const db = getDb();
    if (!db) {
      reply.code(503).send({
        error: 'Marketplace not available',
        hint: 'marketplace.db was not found or failed to load',
      });
      return null;
    }
    return db;
  }

  // ── GET /api/marketplace/search ─────────────────────────────────────
  // Search the package catalog with FTS5 + faceted filters.

  fastify.get('/api/marketplace/search', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const { query, type, category, pack, source, limit, offset } = request.query as {
      query?: string;
      type?: string;
      category?: string;
      pack?: string;
      source?: string;
      limit?: string;
      offset?: string;
    };

    const results = db.search({
      query: query || '',
      type: type as InstallationType | undefined,
      category,
      pack,
      source,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return results;
  });

  // ── GET /api/marketplace/packs ──────────────────────────────────────
  // List all capability packs.

  fastify.get('/api/marketplace/packs', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const packs = db.listPacks();
    return { packs, total: packs.length };
  });

  // ── GET /api/marketplace/packs/:slug ────────────────────────────────
  // Get pack detail with its packages.

  fastify.get('/api/marketplace/packs/:slug', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const { slug } = request.params as { slug: string };
    const result = db.getPacksBySlug(slug);

    if (!result) {
      return reply.code(404).send({ error: `Pack "${slug}" not found` });
    }

    return result;
  });

  // ── POST /api/marketplace/install ───────────────────────────────────
  // Install a package from the marketplace.

  fastify.post('/api/marketplace/install', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as {
      packageId: number;
      installPath?: string;
      settings?: Record<string, string>;
      force?: boolean;
      forceInsecure?: boolean;
    };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    const installer = new MarketplaceInstaller(db);
    const result = await installer.install({
      packageId: body.packageId,
      installPath: body.installPath,
      settings: body.settings,
      force: body.force,
      forceInsecure: body.forceInsecure,
    });

    return reply.code(result.success ? 200 : 422).send(result);
  });

  // ── POST /api/marketplace/uninstall ─────────────────────────────────
  // Uninstall a previously installed package.

  fastify.post('/api/marketplace/uninstall', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as { packageId: number };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    const installer = new MarketplaceInstaller(db);
    const result = await installer.uninstall(body.packageId);

    return reply.code(result.success ? 200 : 422).send(result);
  });

  // ── GET /api/marketplace/installed ──────────────────────────────────
  // List all currently installed packages.

  fastify.get('/api/marketplace/installed', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const installations = db.listInstallations();
    return { installations, total: installations.length };
  });

  // ── POST /api/marketplace/security-check ────────────────────────────
  // Run a security scan on a package (by ID) without installing it.

  fastify.post('/api/marketplace/security-check', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as { packageId: number };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    const installer = new MarketplaceInstaller(db, {
      enable_gen_trust_hub: false,
      enable_cisco_scanner: false,
      enable_mcp_guardian: false,
      enable_heuristics: true,
    });

    const scanResult = await installer.scanOnly(body.packageId);

    if (!scanResult) {
      return reply.code(404).send({ error: `Package ID ${body.packageId} not found` });
    }

    return {
      packageId: body.packageId,
      severity: scanResult.overall_severity,
      score: scanResult.security_score,
      blocked: scanResult.blocked,
      enginesUsed: scanResult.engines_used,
      findingsCount: scanResult.findings.length,
      findings: scanResult.findings,
      durationMs: scanResult.scan_duration_ms,
      contentHash: scanResult.content_hash,
    };
  });

  // ── GET /api/marketplace/sources ────────────────────────────────────
  // List all marketplace sources.

  fastify.get('/api/marketplace/sources', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const sources = db.listSources();
    return { sources, total: sources.length };
  });
}
